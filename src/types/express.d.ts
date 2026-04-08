import type { IAuthUser } from '../shared/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
