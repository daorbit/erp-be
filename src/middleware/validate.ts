import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { buildErrorResponse } from '../shared/helpers.js';

/**
 * Express middleware that validates `req.body` against the provided Zod schema.
 * Returns a 400 response with structured error messages when validation fails.
 */
export function validate(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body ?? {});
      // Replace body with the parsed (and potentially transformed) value
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        });

        res.status(400).json(
          buildErrorResponse('Validation failed', messages),
        );
        return;
      }
      next(error);
    }
  };
}
