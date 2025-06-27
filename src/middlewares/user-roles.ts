import { NextFunction, Response } from 'express';

import { HttpStatusCode } from '../helpers/http-status-codes';
import { ICustomRequest } from '../types/common';

import { CustomError } from './custom-error';

type MaritimeRole = 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';

/**
 * Check if user has any of the specified maritime roles
 * Only accepts: SHIP_COMPANY_ADMIN, SHIP_ADMIN, CAPTAIN, SECOND_OFFICER
 */
export function requireMaritimeRole(allowedRoles: MaritimeRole[]) {
  return (req: ICustomRequest, _res: Response, next: NextFunction): void => {
    if (!req.user?.userType || !allowedRoles.includes(req.user.userType as MaritimeRole)) {
      throw new CustomError('Access denied.', HttpStatusCode.Forbidden);
    }
    next();
  };
}
