import mongoose from 'mongoose';
import dayjs from 'dayjs';
import cloudinary from '../../config/cloudinary.js';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import User from '../auth/auth.model.js';
import Branch from '../branches/branch.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Location from '../locations/location.model.js';
import ShiftSession, {
  ShiftSessionStatus,
  type IShiftSession,
} from './shiftSession.model.js';

interface StartShiftInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  notes?: string;
}

interface EndShiftInput {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
}

interface TrackGpsInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: string;
}

interface ListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  employee?: string;
  dateFrom?: string;
  dateTo?: string;
  site?: string;
}

interface SiteDurationReportQuery {
  dateFrom?: string;
  dateTo?: string;
  employee?: string;
  site?: string;
  status?: string;
}

const SITE_POPULATE_SELECT = 'name code siteType division address01 address02 address03 city pincode stateName latitude longitude';
const LOCATION_POPULATE_SELECT = 'name site address1 address2 address3 city pinCode locationType latitude longitude approxLocationKm';

type CandidateSiteGeo = {
  site: any;
  siteLocation?: any;
  latitude?: number;
  longitude?: number;
};

/**
 * Haversine distance (meters) between two lat/lng points.
 */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function uploadSelfieBuffer(buffer: Buffer): Promise<{
  url: string;
  publicId: string;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'erp/shift-sessions/selfies',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

async function resolveAssignedSite(
  userId: string,
  companyId: string,
  latitude: number,
  longitude: number,
) {
  const user = await User.findById(userId).select('allowedBranches').lean();
  const allowedSiteIds = (user?.allowedBranches ?? []).map((id) => String(id));

  if (allowedSiteIds.length === 0) {
    throw new AppError('No site is assigned to this user. Please ask admin to assign a site first.', 400);
  }

  const sites = await Branch.find({
    _id: { $in: allowedSiteIds },
    company: companyId,
  }).lean();

  if (sites.length === 0) {
    throw new AppError('Assigned site not found.', 404);
  }

  const siteLocations = await Location.find({
    site: { $in: sites.map((site) => site._id) },
    company: companyId,
    isActive: true,
  }).sort({ latitude: -1, longitude: -1, createdAt: -1 }).lean();

  const locationBySiteId = new Map<string, (typeof siteLocations)[number]>();
  for (const loc of siteLocations) {
    const locSiteId = String(loc.site);
    if (!locationBySiteId.has(locSiteId) || loc.latitude != null) {
      locationBySiteId.set(locSiteId, loc);
    }
  }

  let best: { site: (typeof sites)[number]; siteLocation?: (typeof siteLocations)[number]; distance?: number } | null = null;

  for (const site of sites) {
    const siteLocation = locationBySiteId.get(String(site._id));
    const geo = siteLocation ?? site;
    const distance = distanceFromSiteMeters(geo, latitude, longitude);
    if (!best || (distance != null && (best.distance == null || distance < best.distance))) {
      best = { site, siteLocation, distance };
    }
  }

  if (!best) {
    throw new AppError('Assigned site not found.', 404);
  }

  return best;
}

function distanceFromSiteMeters(
  geo: { latitude?: number; longitude?: number } | null | undefined,
  latitude: number,
  longitude: number,
): number | undefined {
  if (typeof geo?.latitude !== 'number' || typeof geo?.longitude !== 'number') return undefined;
  return Math.round(haversineMeters(geo.latitude, geo.longitude, latitude, longitude));
}

function isWithinBuffer(distanceMeters: number | undefined, bufferKm?: number): boolean | undefined {
  if (distanceMeters == null || bufferKm == null || bufferKm <= 0) return undefined;
  return distanceMeters <= bufferKm * 1000;
}

function getNearestCandidate(
  candidates: CandidateSiteGeo[],
  latitude: number,
  longitude: number,
): { candidate: CandidateSiteGeo; distanceMeters?: number } | undefined {
  let best: { candidate: CandidateSiteGeo; distanceMeters?: number } | undefined;

  for (const candidate of candidates) {
    if (typeof candidate.latitude !== 'number' || typeof candidate.longitude !== 'number') continue;
    const distanceMeters = Math.round(
      haversineMeters(candidate.latitude, candidate.longitude, latitude, longitude),
    );
    if (!best || distanceMeters < (best.distanceMeters ?? Number.POSITIVE_INFINITY)) {
      best = { candidate, distanceMeters };
    }
  }

  return best;
}

function formatReportDate(date: Date | string | undefined): string {
  return dayjs(date).format('YYYY-MM-DD');
}

function getEmployeeName(employee: any): string {
  const user = employee?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Unknown';
}

async function getSiteCandidatesForUser(
  userId: string,
  companyId?: string,
  fallbackSite?: any,
): Promise<CandidateSiteGeo[]> {
  const user = await User.findById(userId).select('allowedBranches').lean();
  const siteIds = new Set<string>((user?.allowedBranches ?? []).map((id) => String(id)));
  if (fallbackSite?._id) siteIds.add(String(fallbackSite._id));
  if (siteIds.size === 0) return [];

  const [sites, locations] = await Promise.all([
    Branch.find({
      _id: { $in: Array.from(siteIds) },
      ...(companyId ? { company: companyId } : {}),
    })
      .select(SITE_POPULATE_SELECT)
      .lean(),
    Location.find({
      site: { $in: Array.from(siteIds) },
      ...(companyId ? { company: companyId } : {}),
      isActive: true,
    })
      .select(LOCATION_POPULATE_SELECT)
      .lean(),
  ]);

  const locationsBySiteId = new Map<string, any[]>();
  for (const location of locations as any[]) {
    const siteId = String(location.site);
    locationsBySiteId.set(siteId, [...(locationsBySiteId.get(siteId) ?? []), location]);
  }

  const candidates: CandidateSiteGeo[] = [];
  for (const site of sites as any[]) {
    const siteLocations = locationsBySiteId.get(String(site._id)) ?? [];
    for (const location of siteLocations) {
      candidates.push({
        site,
        siteLocation: location,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
    candidates.push({
      site,
      latitude: site.latitude,
      longitude: site.longitude,
    });
  }

  return candidates;
}

async function withResolvedTrailSites(session: any, companyId?: string) {
  const candidates = await getSiteCandidatesForUser(String(session.user), companyId, session.site);
  const sortedTrail = [...(session.gpsTrail ?? [])].sort(
    (a: any, b: any) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );

  session.gpsTrail = sortedTrail.map((point: any) => {
    const nearest = getNearestCandidate(candidates, point.latitude, point.longitude);
    const bufferKm = typeof nearest?.candidate.siteLocation?.approxLocationKm === 'number'
      ? nearest.candidate.siteLocation.approxLocationKm
      : undefined;
    const withinBuffer = isWithinBuffer(nearest?.distanceMeters, bufferKm) === true;

    return {
      ...point,
      matchedSite: withinBuffer ? nearest?.candidate.site : undefined,
      matchedSiteLocation: withinBuffer ? nearest?.candidate.siteLocation : undefined,
    };
  });

  return session;
}

export class ShiftSessionService {
  /**
   * Resolve the EmployeeProfile for the authenticated user.
   */
  static async resolveEmployee(userId: string, companyId?: string) {
    const filter: Record<string, unknown> = { userId };
    if (companyId) filter.company = companyId;
    const profile = await EmployeeProfile.findOne(filter)
      .select('_id userId company shift')
      .lean();
    if (!profile) {
      throw new AppError(
        'No employee profile found for the current user.',
        404,
      );
    }
    return profile;
  }

  /**
   * Start a new shift session. Throws if there is already an active one.
   */
  static async start(
    userId: string,
    companyId: string,
    input: StartShiftInput,
    selfie?: Express.Multer.File,
  ): Promise<IShiftSession> {
    const profile = await this.resolveEmployee(userId, companyId);
    const { site, siteLocation } = await resolveAssignedSite(userId, companyId, input.latitude, input.longitude);

    // Reject if an active shift already exists.
    const existing = await ShiftSession.findOne({
      user: userId,
      status: ShiftSessionStatus.ACTIVE,
    }).lean();
    if (existing) {
      throw new AppError(
        'You already have an active shift. Please end it first.',
        400,
      );
    }

    let selfieUrl: string | undefined;
    let selfiePublicId: string | undefined;
    if (selfie?.buffer) {
      const uploaded = await uploadSelfieBuffer(selfie.buffer);
      selfieUrl = uploaded.url;
      selfiePublicId = uploaded.publicId;
    }

    const now = new Date();
    const startLocation = {
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
    };
    const siteBufferKm = typeof siteLocation?.approxLocationKm === 'number' ? siteLocation.approxLocationKm : undefined;
    const startSiteDistanceMeters = distanceFromSiteMeters(siteLocation ?? site, input.latitude, input.longitude);

    const session = await ShiftSession.create({
      employee: profile._id,
      user: new mongoose.Types.ObjectId(userId),
      company: new mongoose.Types.ObjectId(companyId),
      site: site._id,
      siteLocation: siteLocation?._id,
      shift: profile.shift,
      shiftDate: dayjs(now).startOf('day').toDate(),
      shiftStartedAt: now,
      status: ShiftSessionStatus.ACTIVE,
      selfieUrl,
      selfiePublicId,
      startLocation,
      latestLocation: { ...startLocation, capturedAt: now },
      gpsTrail: [
        {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          capturedAt: now,
        },
      ],
      totalDistanceMeters: 0,
      startSiteDistanceMeters,
      latestSiteDistanceMeters: startSiteDistanceMeters,
      siteBufferKm,
      latestSiteWithinBuffer: isWithinBuffer(startSiteDistanceMeters, siteBufferKm),
      notes: input.notes,
    });

    await session.populate('site', SITE_POPULATE_SELECT);
    await session.populate('siteLocation', LOCATION_POPULATE_SELECT);
    return session as IShiftSession;
  }

  /**
   * Append a GPS point to an active shift session.
   */
  static async track(
    sessionId: string,
    userId: string,
    input: TrackGpsInput,
  ): Promise<IShiftSession> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID.', 400);
    }
    const session = await ShiftSession.findOne({
      _id: sessionId,
      user: userId,
    });
    if (!session) {
      throw new AppError('Shift session not found.', 404);
    }
    if (session.status !== ShiftSessionStatus.ACTIVE) {
      throw new AppError('Shift session is not active.', 400);
    }

    const lastPoint = session.gpsTrail[session.gpsTrail.length - 1];
    if (lastPoint) {
      session.totalDistanceMeters += haversineMeters(
        lastPoint.latitude,
        lastPoint.longitude,
        input.latitude,
        input.longitude,
      );
    }

    const nearest = await resolveAssignedSite(userId, String(session.company), input.latitude, input.longitude);
    session.site = nearest.site._id as any;
    session.siteLocation = nearest.siteLocation?._id as any;
    session.siteBufferKm = typeof nearest.siteLocation?.approxLocationKm === 'number' ? nearest.siteLocation.approxLocationKm : undefined;
    session.latestSiteDistanceMeters = nearest.distance;
    session.latestSiteWithinBuffer = isWithinBuffer(nearest.distance, session.siteBufferKm);

    session.gpsTrail.push({
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
    });
    session.latestLocation = {
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
    };

    await session.save();
    return session;
  }

  /**
   * End an active shift session.
   */
  static async end(
    sessionId: string,
    userId: string,
    input: EndShiftInput,
  ): Promise<IShiftSession> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID.', 400);
    }
    const session = await ShiftSession.findOne({
      _id: sessionId,
      user: userId,
    });
    if (!session) {
      throw new AppError('Shift session not found.', 404);
    }
    if (session.status !== ShiftSessionStatus.ACTIVE) {
      throw new AppError('Shift session already ended.', 400);
    }

    const now = new Date();

    if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
      session.endLocation = {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
      };
      const lastPoint = session.gpsTrail[session.gpsTrail.length - 1];
      if (lastPoint) {
        session.totalDistanceMeters += haversineMeters(
          lastPoint.latitude,
          lastPoint.longitude,
          input.latitude,
          input.longitude,
        );
      }
      session.gpsTrail.push({
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        capturedAt: now,
      });
      session.latestLocation = {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        capturedAt: now,
      };
      const nearest = await resolveAssignedSite(userId, String(session.company), input.latitude, input.longitude);
      session.site = nearest.site._id as any;
      session.siteLocation = nearest.siteLocation?._id as any;
      session.siteBufferKm = typeof nearest.siteLocation?.approxLocationKm === 'number' ? nearest.siteLocation.approxLocationKm : undefined;
      session.endSiteDistanceMeters = nearest.distance;
      session.latestSiteDistanceMeters = nearest.distance;
      session.latestSiteWithinBuffer = isWithinBuffer(nearest.distance, session.siteBufferKm);
    }

    session.shiftEndedAt = now;
    session.status = ShiftSessionStatus.COMPLETED;
    session.durationMinutes = Math.round(
      (now.getTime() - session.shiftStartedAt.getTime()) / 60000,
    );
    if (input.notes) session.notes = input.notes;

    await session.save();
    return session;
  }

  /**
   * Get the current active session for a user (or null).
   */
  static async getActiveForUser(userId: string): Promise<unknown> {
    return ShiftSession.findOne({
      user: userId,
      status: ShiftSessionStatus.ACTIVE,
    })
      .populate('employee', 'employeeId firstName lastName')
      .populate('site', SITE_POPULATE_SELECT)
      .populate('siteLocation', LOCATION_POPULATE_SELECT)
      .populate('shift', 'name startTime endTime')
      .lean();
  }

  /**
   * Get a session by id (visible only to its owner unless caller is admin/HR).
   */
  static async getById(
    id: string,
    options: { userId?: string; companyId?: string; allowAll?: boolean } = {},
  ): Promise<unknown> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid session ID.', 400);
    }
    const filter: Record<string, unknown> = { _id: id };
    if (options.companyId) filter.company = options.companyId;
    if (!options.allowAll && options.userId) filter.user = options.userId;

    const session = await ShiftSession.findOne(filter)
      .populate({
        path: 'employee',
        select: 'employeeId userId',
        populate: { path: 'userId', select: 'firstName lastName email phone' },
      })
      .populate('site', SITE_POPULATE_SELECT)
      .populate('siteLocation', LOCATION_POPULATE_SELECT)
      .populate('shift', 'name startTime endTime')
      .lean();

    if (!session) throw new AppError('Shift session not found.', 404);
    return withResolvedTrailSites(session, options.companyId);
  }

  /**
   * List sessions with pagination + filters. Used by admin/HR (allowAll=true)
   * and by employees viewing their own history (userId set, allowAll=false).
   */
  static async list(
    query: ListQuery,
    options: { companyId?: string; userId?: string; allowAll?: boolean } = {},
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'shiftStartedAt',
      sortOrder = 'desc',
      status,
      employee,
      dateFrom,
      dateTo,
      site,
    } = query;

    const filter: Record<string, unknown> = {};
    if (options.companyId) filter.company = options.companyId;
    if (!options.allowAll && options.userId) filter.user = options.userId;
    if (status) filter.status = status;
    if (employee && mongoose.Types.ObjectId.isValid(employee)) {
      filter.employee = employee;
    }
    if (site && mongoose.Types.ObjectId.isValid(site)) {
      filter.site = site;
    }
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = dayjs(dateFrom).startOf('day').toDate();
      if (dateTo) range.$lte = dayjs(dateTo).endOf('day').toDate();
      filter.shiftDate = range;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      ShiftSession.find(filter)
        // For list views the trail is heavy — exclude it.
        .select('-gpsTrail')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'employee',
          select: 'employeeId userId',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .populate('site', SITE_POPULATE_SELECT)
        .populate('siteLocation', LOCATION_POPULATE_SELECT)
        .populate('shift', 'name startTime endTime')
        .lean(),
      ShiftSession.countDocuments(filter),
    ]);

    return {
      data,
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Admin report: split each shift's GPS timeline into employee x site/location
   * duration buckets. Each segment is assigned to the nearest assigned site
   * coordinate available for that user at that GPS point.
   */
  static async siteDurationReport(
    query: SiteDurationReportQuery,
    options: { companyId?: string } = {},
  ) {
    const { dateFrom, dateTo, employee, site, status } = query;
    const filter: Record<string, unknown> = {};
    if (options.companyId) filter.company = options.companyId;
    if (status) filter.status = status;
    if (employee && mongoose.Types.ObjectId.isValid(employee)) filter.employee = employee;
    if (site && mongoose.Types.ObjectId.isValid(site)) filter.site = site;
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = dayjs(dateFrom).startOf('day').toDate();
      if (dateTo) range.$lte = dayjs(dateTo).endOf('day').toDate();
      filter.shiftDate = range;
    }

    const sessions = await ShiftSession.find(filter)
      .sort({ shiftStartedAt: -1 })
      .populate({
        path: 'employee',
        select: 'employeeId userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('site', SITE_POPULATE_SELECT)
      .populate('siteLocation', LOCATION_POPULATE_SELECT)
      .lean();

    const userIds = Array.from(new Set(sessions.map((session: any) => String(session.user))));
    const users = await User.find({ _id: { $in: userIds } }).select('allowedBranches').lean();
    const allowedSiteIdsByUser = new Map<string, string[]>();
    const allSiteIds = new Set<string>();

    for (const user of users) {
      const allowedSiteIds = (user.allowedBranches ?? []).map((id) => String(id));
      allowedSiteIdsByUser.set(String(user._id), allowedSiteIds);
      allowedSiteIds.forEach((id) => allSiteIds.add(id));
    }
    for (const session of sessions as any[]) {
      if (session.site?._id) allSiteIds.add(String(session.site._id));
    }

    const [sites, locations] = await Promise.all([
      Branch.find({ _id: { $in: Array.from(allSiteIds) }, ...(options.companyId ? { company: options.companyId } : {}) })
        .select(SITE_POPULATE_SELECT)
        .lean(),
      Location.find({ site: { $in: Array.from(allSiteIds) }, ...(options.companyId ? { company: options.companyId } : {}), isActive: true })
        .select(LOCATION_POPULATE_SELECT)
        .lean(),
    ]);

    const siteById = new Map(sites.map((item: any) => [String(item._id), item]));
    const locationsBySiteId = new Map<string, any[]>();
    for (const location of locations as any[]) {
      const siteId = String(location.site);
      locationsBySiteId.set(siteId, [...(locationsBySiteId.get(siteId) ?? []), location]);
    }

    const rows = new Map<string, any>();

    for (const session of sessions as any[]) {
      const trail = [...(session.gpsTrail ?? [])]
        .filter((point: any) => typeof point.latitude === 'number' && typeof point.longitude === 'number')
        .sort((a: any, b: any) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
      if (trail.length === 0) continue;

      const allowedSiteIds = allowedSiteIdsByUser.get(String(session.user)) ?? [];
      const candidateSiteIds = allowedSiteIds.length > 0
        ? allowedSiteIds
        : session.site?._id
          ? [String(session.site._id)]
          : [];

      const candidates: CandidateSiteGeo[] = [];
      for (const siteId of candidateSiteIds) {
        const siteDoc = siteById.get(siteId) ?? session.site;
        if (!siteDoc) continue;
        const siteLocations = locationsBySiteId.get(siteId) ?? [];
        for (const location of siteLocations) {
          candidates.push({
            site: siteDoc,
            siteLocation: location,
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
        candidates.push({
          site: siteDoc,
          latitude: siteDoc.latitude,
          longitude: siteDoc.longitude,
        });
      }

      for (let index = 0; index < trail.length; index += 1) {
        const point = trail[index];
        const segmentStart = new Date(point.capturedAt).getTime();
        const nextPoint = trail[index + 1];
        const segmentEnd = nextPoint
          ? new Date(nextPoint.capturedAt).getTime()
          : session.shiftEndedAt
            ? new Date(session.shiftEndedAt).getTime()
            : Date.now();
        const durationMinutes = Math.max(0, Math.round((segmentEnd - segmentStart) / 60000));
        if (durationMinutes <= 0) continue;

        const nearest = getNearestCandidate(candidates, point.latitude, point.longitude);
        const candidate = nearest?.candidate ?? {
          site: session.site,
          siteLocation: session.siteLocation,
        };
        if (!candidate.site?._id) continue;
        if (site && String(candidate.site._id) !== site) continue;

        const date = formatReportDate(session.shiftDate ?? session.shiftStartedAt);
        const siteLocationId = candidate.siteLocation?._id ? String(candidate.siteLocation._id) : 'site-coordinates';
        const key = `${date}:${String(session.employee?._id ?? session.employee)}:${String(candidate.site._id)}:${siteLocationId}`;
        const existing = rows.get(key) ?? {
          key,
          date,
          employee: session.employee,
          employeeName: getEmployeeName(session.employee),
          employeeCode: session.employee?.employeeId,
          site: candidate.site,
          siteName: candidate.site?.name,
          siteCode: candidate.site?.code,
          siteLocation: candidate.siteLocation,
          siteLocationName: candidate.siteLocation?.name,
          durationMinutes: 0,
          sessions: new Set<string>(),
          firstSeenAt: point.capturedAt,
          lastSeenAt: point.capturedAt,
          minDistanceMeters: nearest?.distanceMeters,
          maxDistanceMeters: nearest?.distanceMeters,
        };

        existing.durationMinutes += durationMinutes;
        existing.sessions.add(String(session._id));
        if (dayjs(point.capturedAt).isBefore(existing.firstSeenAt)) existing.firstSeenAt = point.capturedAt;
        if (dayjs(point.capturedAt).isAfter(existing.lastSeenAt)) existing.lastSeenAt = point.capturedAt;
        if (nearest?.distanceMeters != null) {
          existing.minDistanceMeters = existing.minDistanceMeters == null
            ? nearest.distanceMeters
            : Math.min(existing.minDistanceMeters, nearest.distanceMeters);
          existing.maxDistanceMeters = existing.maxDistanceMeters == null
            ? nearest.distanceMeters
            : Math.max(existing.maxDistanceMeters, nearest.distanceMeters);
        }
        rows.set(key, existing);
      }
    }

    const data = Array.from(rows.values())
      .map((row) => ({
        ...row,
        sessionCount: row.sessions.size,
        sessions: undefined,
      }))
      .sort((a, b) => {
        const dateSort = String(b.date).localeCompare(String(a.date));
        if (dateSort !== 0) return dateSort;
        const employeeSort = String(a.employeeName).localeCompare(String(b.employeeName));
        if (employeeSort !== 0) return employeeSort;
        return String(a.siteName).localeCompare(String(b.siteName));
      });

    return {
      rows: data,
      totals: {
        durationMinutes: data.reduce((sum, row) => sum + row.durationMinutes, 0),
        employeeCount: new Set(data.map((row) => String(row.employee?._id ?? row.employee))).size,
        siteCount: new Set(data.map((row) => String(row.site?._id ?? row.site))).size,
        rowCount: data.length,
      },
    };
  }
}
