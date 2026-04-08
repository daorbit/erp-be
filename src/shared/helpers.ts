import type { IApiResponse, IPagination } from './types.js';

/**
 * Build a pagination metadata object.
 */
export function buildPagination(
  page: number,
  limit: number,
  total: number,
): IPagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Build a successful or general API response.
 */
export function buildResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  pagination?: IPagination,
): IApiResponse<T> {
  const response: IApiResponse<T> = { success };
  if (data !== undefined) response.data = data;
  if (message !== undefined) response.message = message;
  if (pagination !== undefined) response.pagination = pagination;
  return response;
}

/**
 * Build a standardized error response.
 */
export function buildErrorResponse(
  message: string,
  errors?: string[],
): IApiResponse<null> {
  const response: IApiResponse<null> = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) response.errors = errors;
  return response;
}

/**
 * Generate a unique employee ID in the format EMP-YYYY-NNN.
 * Uses the current year and a random 3-digit suffix. In a real system the
 * numeric portion would be a database sequence; here we combine a timestamp
 * fragment with randomness to keep things stateless.
 */
export function generateEmployeeId(): string {
  const year = new Date().getFullYear();
  const sequence = String(
    Math.floor(Math.random() * 900) + 100 + (Date.now() % 1000),
  ).slice(-3);
  return `EMP-${year}-${sequence}`;
}
