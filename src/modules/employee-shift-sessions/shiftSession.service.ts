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

const SITE_POPULATE_SELECT = 'name code siteType division address01 address02 address03 city pincode stateName latitude longitude';
const LOCATION_POPULATE_SELECT = 'name site address1 address2 address3 city pinCode locationType latitude longitude approxLocationKm';

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
    return session;
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
}
