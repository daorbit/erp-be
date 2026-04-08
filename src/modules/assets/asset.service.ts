import type { FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Asset, { type IAsset, AssetStatus } from './asset.model.js';
import type {
  CreateAssetInput,
  UpdateAssetInput,
  AssignAssetInput,
  ReturnAssetInput,
} from './asset.validator.js';

export class AssetService {
  static async getAll(query: IQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IAsset> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.category) filter.category = filters.category;
    if (filters?.status) filter.status = filters.status;
    if (filters?.condition) filter.condition = filters.condition;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Asset.countDocuments(filter),
    ]);

    return { assets, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string) {
    const asset = await Asset.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignmentHistory.employee', 'firstName lastName email');

    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    return asset;
  }

  static async create(data: CreateAssetInput) {
    const asset = await Asset.create(data);
    return asset;
  }

  static async update(id: string, data: UpdateAssetInput) {
    const asset = await Asset.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('assignedTo', 'firstName lastName email');

    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    return asset;
  }

  static async delete(id: string) {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    if (asset.status === AssetStatus.ASSIGNED) {
      throw new AppError('Cannot delete an assigned asset. Return it first.', 400);
    }

    await asset.deleteOne();
    return asset;
  }

  static async assignToEmployee(assetId: string, data: AssignAssetInput) {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    if (asset.status === AssetStatus.ASSIGNED) {
      throw new AppError('Asset is already assigned. Return it first.', 400);
    }

    if (asset.status === AssetStatus.DISPOSED || asset.status === AssetStatus.LOST) {
      throw new AppError('Cannot assign a disposed or lost asset.', 400);
    }

    asset.assignedTo = data.employeeId as never;
    asset.assignedDate = new Date();
    asset.status = AssetStatus.ASSIGNED;

    asset.assignmentHistory.push({
      employee: data.employeeId as never,
      assignedDate: new Date(),
      notes: data.notes,
    });

    await asset.save();
    return asset;
  }

  static async returnAsset(assetId: string, data: ReturnAssetInput) {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    if (asset.status !== AssetStatus.ASSIGNED) {
      throw new AppError('Asset is not currently assigned.', 400);
    }

    // Update the latest assignment history entry
    const lastAssignment = asset.assignmentHistory[asset.assignmentHistory.length - 1];
    if (lastAssignment && !lastAssignment.returnedDate) {
      lastAssignment.returnedDate = new Date();
      lastAssignment.condition = data.condition;
      if (data.notes) lastAssignment.notes = data.notes;
    }

    asset.assignedTo = undefined;
    asset.assignedDate = undefined;
    asset.status = AssetStatus.AVAILABLE;
    if (data.condition) {
      asset.condition = data.condition as never;
    }

    await asset.save();
    return asset;
  }

  static async getByEmployee(employeeId: string) {
    const assets = await Asset.find({
      assignedTo: employeeId,
      status: AssetStatus.ASSIGNED,
    })
      .sort({ assignedDate: -1 })
      .lean();

    return assets;
  }

  static async getAvailable() {
    const assets = await Asset.find({
      status: AssetStatus.AVAILABLE,
    })
      .sort({ category: 1, name: 1 })
      .lean();

    return assets;
  }

  static async getMaintenanceDue() {
    const now = new Date();
    const assets = await Asset.find({
      warrantyExpiry: { $lte: now },
      status: { $nin: [AssetStatus.DISPOSED, AssetStatus.LOST] },
    })
      .populate('assignedTo', 'firstName lastName email')
      .sort({ warrantyExpiry: 1 })
      .lean();

    return assets;
  }
}
