import { Response, NextFunction } from 'express';

import { HttpStatusCode } from '../helpers/http-status-codes';
import { verifyToken } from '../helpers/util';
import { ICustomRequest } from '../types/common';

import { CustomError } from './custom-error';

/**
 * Middleware function for user
 * check user valid or not
 * with jwt signing token from header
 */
export function auth(req: ICustomRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.header('Authorization');
    if (
      authHeader === null ||
      authHeader === undefined ||
      authHeader === '' ||
      authHeader === 'undefined'
    ) {
      throw new CustomError('Access denied. No token provided.', HttpStatusCode.Unauthorized);
    }

    // const token = req.header('Authorization')?.replace('Bearer ', '');
    const token = req.header('Authorization')?.split(' ')[1]; // Authorization: 'Bearer TOKEN'

    if (token === null || token === undefined || token === '') {
      throw new CustomError('Access denied. No token provided.', HttpStatusCode.Unauthorized);
    }

    const verified = verifyToken(token);
    req.user = verified as {
      id: string;
      name?: string;
      email: string;
      isAdmin: boolean;
      status: boolean;
      userType: 'Admin' | 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';
    };

    if (!req.user?.status) {
      throw new CustomError(
        'Account is inactive. Contact administrator.',
        HttpStatusCode.Unauthorized,
      );
    }
    next();
  } catch (ex) {
    if (ex instanceof CustomError) {
      next(ex);
    } else {
      next(new CustomError('Invalid token.', HttpStatusCode.Unauthorized));
    }
  }
}
