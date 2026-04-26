import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Location, { type ILocation } from './location.model.js';

interface PaginatedResult<T> { data: T[]; pagination: ReturnType<typeof buildPagination>; }

export class LocationService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<ILocation>> {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [locations, total] = await Promise.all([
      Location.find(filter).populate('site', 'name code').sort(sortOptions).skip(skip).limit(limit).lean(),
      Location.countDocuments(filter),
    ]);

    return { data: locations as any as ILocation[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid location ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const loc = await Location.findOne(filter).populate('site', 'name code');
    if (!loc) throw new AppError('Location not found.', 404);
    return loc;
  }

  static async create(data: Partial<ILocation>): Promise<ILocation> {
    const loc = await Location.create(data);
    await this.mirrorRouteDetails(String(loc._id), loc.routeDetails ?? [], data.company as any);
    return loc;
  }

  static async update(id: string, data: Partial<ILocation>, companyId?: string): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid location ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const loc = await Location.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!loc) throw new AppError('Location not found.', 404);
    if (Array.isArray(data.routeDetails)) {
      await this.mirrorRouteDetails(String(loc._id), data.routeDetails, companyId);
    }
    return loc;
  }

  /**
   * Mirror "from → to" matrix entries back onto each target location so opening
   * the other side in edit mode shows the same km value. Only applies to rows
   * that look like matrix entries (have toLocation + km, no routeName).
   */
  private static async mirrorRouteDetails(
    fromId: string,
    routeDetails: any[],
    companyId?: string,
  ): Promise<void> {
    const matrixRows = (routeDetails || []).filter(
      (r) => r?.toLocation && typeof r.km === 'number' && !r.routeName,
    );
    for (const row of matrixRows) {
      const toId = String(row.toLocation);
      if (!mongoose.Types.ObjectId.isValid(toId) || toId === fromId) continue;
      const filter: Record<string, unknown> = { _id: toId };
      if (companyId) filter.company = companyId;
      const target = await Location.findOne(filter);
      if (!target) continue;
      const existing = (target.routeDetails ?? []) as any[];
      const stripped = existing.filter(
        (r) => r.routeName || String(r.toLocation) !== fromId,
      );
      target.routeDetails = [
        ...stripped,
        { toLocation: new mongoose.Types.ObjectId(fromId), km: row.km },
      ] as any;
      await target.save();
    }
  }

  static async delete(id: string, companyId?: string): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid location ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const loc = await Location.findOneAndUpdate(filter, { $set: { isActive: false } }, { new: true });
    if (!loc) throw new AppError('Location not found.', 404);
    return loc;
  }

  /**
   * Bulk-update routes between locations from the LocationRoute matrix.
   * Each entry is upserted into the *fromLoc*'s `routeDetails` array, keyed by `toLocation`.
   * Removes any entry whose km is set to 0 so the matrix can also clear values.
   */
  static async upsertRoutes(
    entries: Array<{ fromLoc: string; toLoc: string; km: number }>,
    companyId?: string,
  ): Promise<{ updated: number }> {
    if (!Array.isArray(entries) || entries.length === 0) return { updated: 0 };

    // Group entries by fromLoc so we can issue one update per source location.
    const byFrom: Record<string, Array<{ toLoc: string; km: number }>> = {};
    for (const e of entries) {
      if (!mongoose.Types.ObjectId.isValid(e.fromLoc) || !mongoose.Types.ObjectId.isValid(e.toLoc)) continue;
      byFrom[e.fromLoc] ??= [];
      byFrom[e.fromLoc]!.push({ toLoc: e.toLoc, km: Number(e.km) || 0 });
    }

    let updated = 0;
    for (const [fromLoc, rows] of Object.entries(byFrom)) {
      const filter: Record<string, unknown> = { _id: fromLoc };
      if (companyId) filter.company = companyId;
      const doc = await Location.findOne(filter);
      if (!doc) continue;

      const existing = (doc.routeDetails ?? []) as any[];
      // Drop any prior matrix entries for these target locations, then re-insert.
      const toLocSet = new Set(rows.map((r) => String(r.toLoc)));
      const kept = existing.filter((r) => !r.toLocation || !toLocSet.has(String(r.toLocation)));
      const fresh = rows
        .filter((r) => r.km > 0)
        .map((r) => ({ toLocation: new mongoose.Types.ObjectId(r.toLoc), km: r.km }));
      doc.routeDetails = [...kept, ...fresh] as any;
      await doc.save();
      await this.mirrorRouteDetails(String(doc._id), doc.routeDetails as any, companyId);
      updated += 1;
    }
    return { updated };
  }

  /**
   * Save a Via-Route definition: a list of waypoints between fromLocation and toLocation.
   * Stored on the fromLocation's `routeDetails` with the toLocation tag so they can be
   * looked up later. Replaces any previous Via-Route rows between the same pair.
   */
  static async saveViaRoute(
    fromLocation: string,
    toLocation: string,
    routes: Array<{ routeName: string; chainagePoint?: number; distance?: number }>,
    companyId?: string,
  ): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(fromLocation) || !mongoose.Types.ObjectId.isValid(toLocation)) {
      throw new AppError('Invalid location ID format.', 400);
    }
    const filter: Record<string, unknown> = { _id: fromLocation };
    if (companyId) filter.company = companyId;
    const doc = await Location.findOne(filter);
    if (!doc) throw new AppError('From location not found.', 404);

    const toObjId = new mongoose.Types.ObjectId(toLocation);
    const existing = (doc.routeDetails ?? []) as any[];
    // Strip prior via-route rows for this pair (rows that have routeName + matching toLocation).
    const kept = existing.filter((r) => !(r.routeName && String(r.toLocation) === String(toObjId)));
    const fresh = routes.map((r) => ({
      toLocation: toObjId,
      routeName: r.routeName,
      chainagePoint: r.chainagePoint ?? 0,
      distance: r.distance ?? 0,
    }));
    doc.routeDetails = [...kept, ...fresh] as any;
    await doc.save();
    return doc;
  }
}
