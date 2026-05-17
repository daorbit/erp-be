import { UserRole, UserType, type IAuthUser } from './types.js';

/**
 * NwayERP-style scope resolution.
 *
 * Given the authenticated user on a request, returns the Mongo filter
 * fragments that scope a query to what the user is allowed to see.
 *
 * Permission matrix (matches the role legend in the User-Add form):
 *
 *   ┌─────────────┬────────────────┬─────────────────┬──────────────┐
 *   │ user type   │ company scope  │ site scope      │ module gate  │
 *   ├─────────────┼────────────────┼─────────────────┼──────────────┤
 *   │ super_admin │ all            │ all             │ all          │
 *   │ admin       │ allowedComp.   │ all in scope    │ allowedMod.  │
 *   │ ho_user     │ allowedComp.   │ all in scope    │ allowedMod.  │
 *   │ site_admin  │ implicit       │ allowedSites    │ allowedMod.  │
 *   │ user        │ implicit       │ allowedSites    │ allowedMod.  │
 *   └─────────────┴────────────────┴─────────────────┴──────────────┘
 *
 * The legacy `role` field is honoured as a fallback when `userType` is
 * absent (records that pre-date the userType migration).
 */

export interface ResourceScope {
  /** Mongo filter fragment for the resource's `company` field, or null
   *  if no company scoping should be applied (super_admin). */
  companyFilter: Record<string, unknown> | null;
  /** Mongo filter fragment for the resource's `branch` (site) field, or
   *  null if no site-level scoping should be applied. */
  branchFilter: Record<string, unknown> | null;
  /** Convenience: true when the user has unrestricted access. */
  unrestricted: boolean;
}

export interface ScopeOptions {
  /** Field name on the resource for the company FK. Default: 'company'. */
  companyField?: string;
  /** Field name on the resource for the site/branch FK. Default: 'branch'.
   *  Pass null to disable site-level scoping for this resource (e.g. a
   *  resource that has no branch field). */
  branchField?: string | null;
}

/**
 * Returns true ONLY for the true platform administrator — `role=super_admin`
 * with no company association. These are users created via the auto-seed
 * who manage the entire platform and bypass tenant scoping.
 *
 * Note: A user with `userType=super_admin` who has a company is a
 * "company-level super_admin" — they get full access within their parent's
 * group (handled by tenant scope expanding `allowedCompanies` to the whole
 * group) but are NOT platform admin and must not see other tenants' data.
 */
export function isPlatformAdmin(user: IAuthUser): boolean {
  // Dedicated platform_admin role is the preferred check.
  // Legacy: super_admin with no company is also treated as platform admin.
  return user.role === UserRole.PLATFORM_ADMIN || (user.role === UserRole.SUPER_ADMIN && !user.company);
}

/**
 * Returns every company ID this user can access — the full set, not the
 * currently-active one. Use for *listing* contexts: `/companies` page, the
 * company switcher (`/companies/group`), or any place we need to know
 * "which companies belong in this user's world." For single-tenant data
 * queries (employees, attendance, payroll, etc.) prefer `resolveCompanyScope`
 * which collapses to the active context.
 *
 *   super_admin           → null  (no restriction)
 *   has allowedCompanies  → that list ∪ { user.company }
 *   no allowedCompanies   → [user.company]  (or [] if none)
 */
export function getAccessibleCompanyIds(user: IAuthUser): string[] | null {
  if (isPlatformAdmin(user)) return null;

  const ids = new Set<string>();
  if (user.company) ids.add(user.company);
  for (const id of (user.allowedCompanies ?? [])) ids.add(id);
  return Array.from(ids);
}

/** Returns the list of company IDs this user can see, or null for unrestricted. */
export function resolveCompanyScope(user: IAuthUser): string[] | null {
  if (isPlatformAdmin(user)) return null;

  // When the user has explicitly selected a company via X-Active-Company,
  // honour that single-company scope — switching to a sibling means the
  // user is acting in that one company's context.
  if (user.activeCompany) return [user.activeCompany];

  // Prefer allowedCompanies for any NwayERP user type — it's the source of
  // truth set by the admin who created them (or auto-derived from their
  // chosen sites for site_admin / user).
  const list = user.allowedCompanies ?? [];
  if (list.length > 0) return list;

  // Fallback for legacy records: own company only.
  return user.company ? [user.company] : [];
}

/** Returns the list of site IDs this user is scoped to, or null for unrestricted. */
export function resolveSiteScope(user: IAuthUser): string[] | null {
  if (isPlatformAdmin(user)) return null;

  // Only site_admin / user / employee are scoped to specific sites. admin /
  // ho_user see every site under their allowed companies. employee is the
  // most restricted tier — self-service login bound to assigned sites.
  if (
    user.userType === UserType.SITE_ADMIN
    || user.userType === UserType.USER
    || user.userType === UserType.EMPLOYEE
  ) {
    return user.allowedSites ?? [];
  }
  return null;
}

/**
 * Build the Mongo filter fragments for scoping a query to what the
 * authenticated user is allowed to see.
 *
 * Usage in a service / controller:
 *
 *   const scope = buildResourceScope(req.user);
 *   const filter = { ...query, ...scope.companyFilter, ...scope.branchFilter };
 *   const docs = await Employee.find(filter);
 */
export function buildResourceScope(
  user: IAuthUser,
  options: ScopeOptions = {},
): ResourceScope {
  const companyField = options.companyField ?? 'company';
  const branchField = options.branchField === undefined ? 'branch' : options.branchField;

  if (isPlatformAdmin(user)) {
    return { companyFilter: null, branchFilter: null, unrestricted: true };
  }

  const companies = resolveCompanyScope(user);
  let companyFilter: Record<string, unknown> | null = null;
  if (companies !== null) {
    companyFilter = companies.length === 1
      ? { [companyField]: companies[0] }
      : { [companyField]: { $in: companies } };
  }

  let branchFilter: Record<string, unknown> | null = null;
  if (branchField) {
    const sites = resolveSiteScope(user);
    if (sites !== null && sites.length > 0) {
      branchFilter = sites.length === 1
        ? { [branchField]: sites[0] }
        : { [branchField]: { $in: sites } };
    }
    // site_admin / user with empty allowedSites → no access. The caller can
    // detect this via `resolveSiteScope(user)?.length === 0` and short-circuit.
    if (sites !== null && sites.length === 0) {
      // Force-empty result: filter on an impossible value.
      branchFilter = { [branchField]: { $in: [] } };
    }
  }

  return { companyFilter, branchFilter, unrestricted: false };
}

/**
 * Convenience: merge company + branch filters into a single object suitable
 * for spreading into a Mongo query. Returns `{}` when the user is
 * unrestricted (super_admin).
 */
export function scopeFilter(
  user: IAuthUser,
  options: ScopeOptions = {},
): Record<string, unknown> {
  const { companyFilter, branchFilter } = buildResourceScope(user, options);
  return { ...(companyFilter ?? {}), ...(branchFilter ?? {}) };
}

/**
 * Convenience helper for controllers: returns the effective company a
 * non-platform user should be scoped to for *single-record* operations
 * (getById, create, update, delete). Respects `X-Active-Company` and
 * returns undefined for platform super_admin (= no scoping).
 *
 * Usage:  await Service.update(id, body, effectiveCompany(req.user));
 */
export function effectiveCompany(user: IAuthUser): string | undefined {
  if (isPlatformAdmin(user)) return undefined;
  return user.activeCompany ?? user.company;
}
