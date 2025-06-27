import { NextFunction, Response } from 'express';

import { HttpStatusCode } from '../helpers/http-status-codes';
import { ICustomRequest } from '../types/common';

import { CustomError } from './custom-error';

export function isAdmin(req: ICustomRequest, _res: Response, next: NextFunction): void {
  // Check if user exists and has admin privileges
  if (!req.user?.isAdmin || req.user?.userType !== 'Admin') {
    throw new CustomError('Access denied.', HttpStatusCode.Forbidden);
  }
  next();
}
