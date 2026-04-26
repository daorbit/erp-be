import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { CompanyGstService } from './companyGst.service.js';

export class CompanyGstController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 200,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    const result = await CompanyGstService.getAll(query, req.user.company);
    res.status(200).json(buildResponse(true, result.data, 'GST entries retrieved', result.pagination));
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.getById(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, row, 'GST entry retrieved'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, row, 'GST entry created'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, row, 'GST entry updated'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.delete(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, row, 'GST entry deactivated'));
  });

  // Effective-dated addresses
  static addAddress = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.addAddress(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, row, 'Address added'));
  });

  static updateAddress = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.updateAddress(
      req.params.id as string,
      req.params.addressId as string,
      req.body,
      req.user.company,
    );
    res.status(200).json(buildResponse(true, row, 'Address updated'));
  });

  static removeAddress = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await CompanyGstService.removeAddress(
      req.params.id as string,
      req.params.addressId as string,
      req.user.company,
    );
    res.status(200).json(buildResponse(true, row, 'Address removed'));
  });

  // E-invoice credentials
  static saveEInvoice = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { apiUser = '', apiPassword = '' } = req.body ?? {};
    const row = await CompanyGstService.saveEInvoice(
      req.params.id as string,
      apiUser,
      apiPassword,
      req.user.company,
    );
    res.status(200).json(buildResponse(true, row, 'E-invoice credentials saved'));
  });
}
