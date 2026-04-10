import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { OnboardingService } from './onboarding.service.js';

export class OnboardingController {
  /** GET / — List all onboarding records (admin). */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const records = await OnboardingService.getAll(req.user.company);
    res.status(200).json(buildResponse(true, records, 'Onboarding records retrieved'));
  });

  /** GET /me — Get own onboarding record (self). */
  static getMe = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await OnboardingService.getOrCreate(req.user.id, req.user.company!);
    res.status(200).json(buildResponse(true, record, 'Onboarding retrieved'));
  });

  /** GET /:userId — Get a user's onboarding record (admin). */
  static getByUser = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await OnboardingService.getByUser(req.params.userId as string, req.user.company);
    res.status(200).json(buildResponse(true, record, 'Onboarding retrieved'));
  });

  /** PATCH /me/step/:step — Save a step (self). */
  static saveStep = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const step = parseInt(req.params.step as string, 10);
    const record = await OnboardingService.saveStep(req.user.id, req.user.company!, step, req.body);
    res.status(200).json(buildResponse(true, record, 'Step saved'));
  });

  /** POST /me/submit — Submit onboarding (self). */
  static submit = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await OnboardingService.submit(req.user.id, req.user.company!);
    res.status(200).json(buildResponse(true, record, 'Onboarding submitted'));
  });

  /** PATCH /:userId/step/:step — Admin save a step on behalf of a user. */
  static adminSaveStep = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const step = parseInt(req.params.step as string, 10);
    const record = await OnboardingService.saveStep(req.params.userId as string, req.user.company!, step, req.body);
    res.status(200).json(buildResponse(true, record, 'Step saved'));
  });

  /** POST /:userId/submit — Admin submit onboarding on behalf of a user. */
  static adminSubmit = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await OnboardingService.submit(req.params.userId as string, req.user.company!);
    res.status(200).json(buildResponse(true, record, 'Onboarding submitted'));
  });

  /** PUT /:userId — Admin update onboarding data. */
  static adminUpdate = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await OnboardingService.adminUpdate(req.params.userId as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, record, 'Onboarding updated'));
  });

  /** DELETE /:userId — Admin delete onboarding record. */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    await OnboardingService.delete(req.params.userId as string, req.user.company);
    res.status(200).json(buildResponse(true, null, 'Onboarding record deleted'));
  });

  /** PATCH /:userId/review — Admin approve/reject. */
  static review = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { action, remarks } = req.body;
    const record = await OnboardingService.review(
      req.params.userId as string, action, req.user.id, remarks, req.user.company,
    );
    res.status(200).json(buildResponse(true, record, `Onboarding ${action}`));
  });
}
