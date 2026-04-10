import type { FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import TrainingProgram, {
  type ITrainingProgram,
  ParticipantStatus,
  TrainingStatus,
} from './training.model.js';
import type {
  CreateTrainingInput,
  UpdateTrainingInput,
  CompleteTrainingInput,
} from './training.validator.js';

export class TrainingService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<ITrainingProgram> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.category) filter.category = filters.category;
    if (filters?.status) filter.status = filters.status;
    if (filters?.mode) filter.mode = filters.mode;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [trainings, total] = await Promise.all([
      TrainingProgram.find(filter)
        .populate('createdBy', 'firstName lastName')
        .populate('participants.employee', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      TrainingProgram.countDocuments(filter),
    ]);

    return { trainings, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string) {
    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const training = await TrainingProgram.findOne(findFilter)
      .populate('createdBy', 'firstName lastName email')
      .populate('participants.employee', 'firstName lastName email');

    if (!training) {
      throw new AppError('Training program not found.', 404);
    }

    return training;
  }

  static async create(data: CreateTrainingInput & { createdBy: string }) {
    const training = await TrainingProgram.create(data);
    return training;
  }

  static async update(id: string, data: UpdateTrainingInput, companyId?: string) {
    const updateFilter: Record<string, unknown> = { _id: id };
    if (companyId) updateFilter.company = companyId;

    const training = await TrainingProgram.findOneAndUpdate(
      updateFilter,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('createdBy', 'firstName lastName')
      .populate('participants.employee', 'firstName lastName email');

    if (!training) {
      throw new AppError('Training program not found.', 404);
    }

    return training;
  }

  static async delete(id: string, companyId?: string) {
    const deleteFilter: Record<string, unknown> = { _id: id };
    if (companyId) deleteFilter.company = companyId;

    const training = await TrainingProgram.findOneAndDelete(deleteFilter);
    if (!training) {
      throw new AppError('Training program not found.', 404);
    }
    return training;
  }

  static async enrollEmployee(trainingId: string, employeeId: string, companyId?: string) {
    const enrollFilter: Record<string, unknown> = { _id: trainingId };
    if (companyId) enrollFilter.company = companyId;

    const training = await TrainingProgram.findOne(enrollFilter);
    if (!training) {
      throw new AppError('Training program not found.', 404);
    }

    if (training.status === TrainingStatus.CANCELLED) {
      throw new AppError('Cannot enroll in a cancelled training program.', 400);
    }

    if (training.status === TrainingStatus.COMPLETED) {
      throw new AppError('Cannot enroll in a completed training program.', 400);
    }

    const activeParticipants = training.participants.filter(
      (p) => p.status !== ParticipantStatus.DROPPED,
    );

    if (training.maxParticipants && activeParticipants.length >= training.maxParticipants) {
      throw new AppError('Training program is full.', 400);
    }

    const alreadyEnrolled = training.participants.find(
      (p) => p.employee.toString() === employeeId && p.status !== ParticipantStatus.DROPPED,
    );

    if (alreadyEnrolled) {
      throw new AppError('Employee is already enrolled in this training.', 409);
    }

    training.participants.push({
      employee: employeeId as never,
      status: ParticipantStatus.ENROLLED,
    });

    await training.save();
    return training;
  }

  static async completeTraining(
    trainingId: string,
    employeeId: string,
    data: CompleteTrainingInput,
    companyId?: string,
  ) {
    const completeFilter: Record<string, unknown> = { _id: trainingId };
    if (companyId) completeFilter.company = companyId;

    const training = await TrainingProgram.findOne(completeFilter);
    if (!training) {
      throw new AppError('Training program not found.', 404);
    }

    const participant = training.participants.find(
      (p) =>
        p.employee.toString() === employeeId &&
        p.status !== ParticipantStatus.DROPPED,
    );

    if (!participant) {
      throw new AppError('Employee is not enrolled in this training.', 404);
    }

    if (participant.status === ParticipantStatus.COMPLETED) {
      throw new AppError('Training is already marked as completed for this employee.', 400);
    }

    participant.status = ParticipantStatus.COMPLETED;
    participant.completedAt = new Date();
    if (data.score !== undefined) participant.score = data.score;
    if (data.certificate) participant.certificate = data.certificate;

    await training.save();
    return training;
  }

  static async dropEmployee(trainingId: string, employeeId: string, companyId?: string) {
    const dropFilter: Record<string, unknown> = { _id: trainingId };
    if (companyId) dropFilter.company = companyId;

    const training = await TrainingProgram.findOne(dropFilter);
    if (!training) {
      throw new AppError('Training program not found.', 404);
    }

    const participant = training.participants.find(
      (p) =>
        p.employee.toString() === employeeId &&
        p.status !== ParticipantStatus.DROPPED,
    );

    if (!participant) {
      throw new AppError('Employee is not enrolled in this training.', 404);
    }

    participant.status = ParticipantStatus.DROPPED;
    await training.save();
    return training;
  }

  static async getMyTrainings(employeeId: string, query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 10, sortBy = 'startDate', sortOrder = 'desc' } = query;

    const filter: FilterQuery<ITrainingProgram> = {
      'participants.employee': employeeId,
      'participants.status': { $ne: ParticipantStatus.DROPPED },
    };
    if (companyId) filter.company = companyId;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [trainings, total] = await Promise.all([
      TrainingProgram.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      TrainingProgram.countDocuments(filter),
    ]);

    return { trainings, pagination: buildPagination(page, limit, total) };
  }

  static async getUpcoming(companyId?: string) {
    const now = new Date();
    const upcomingFilter: Record<string, unknown> = {
      startDate: { $gt: now },
      status: { $in: [TrainingStatus.PLANNED] },
    };
    if (companyId) upcomingFilter.company = companyId;

    const trainings = await TrainingProgram.find(upcomingFilter)
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: 1 })
      .lean();

    return trainings;
  }
}
