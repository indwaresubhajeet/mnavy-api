import path from 'path';
import { fileURLToPath } from 'url';

import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

import { HttpStatusCode } from '../helpers/http-status-codes';
import { asyncHandler } from '../middlewares/async-handler';
import { auditMiddleware } from '../middlewares/audit';
import { CustomError } from '../middlewares/custom-error';
import { errorHandler } from '../middlewares/error';
import { applicationAdminRoutes } from '../routes/application-admin';
import { userRoutes } from '../routes/user';

import { config } from './config';

export const routes = (app: Express): void => {
  // Add only allowed origins/urls of dev & prod of frontend
  const allowedOrigins = [
    'http://localhost:7002', //local admin npm run dev
    'http://localhost:7003', //local admin npm run start
    'http://localhost:8002', //local web npm run dev
    'http://localhost:8003', //local web npm run start
  ];
  app.use((req: Request, res: Response, next: NextFunction): void => {
    const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Ws-Scope-Id',
    );
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  app.use(
    express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../', 'uploads')),
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Api request logging
  if (config.nodeEnv === 'development') {
    // log all
    app.use(morgan('dev'));
  } else {
    // log only 4xx and 5xx responses to console
    app.use(
      morgan('dev', {
        skip: function (_req: Request, res: Response): boolean {
          return res.statusCode < 400;
        },
      }),
    );
  }

  // Health check api
  app.use(
    '/api/healthcheck',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      res
        .status(HttpStatusCode.Ok)
        .send({ statusCode: HttpStatusCode.Ok, message: 'Maritime Navy API is healthy.' });
    }),
  );

  // Audit middleware
  app.use(auditMiddleware);

  //Add api routes here
  app.use('/api/application-admin/', applicationAdminRoutes);
  app.use('/api/user/', userRoutes);

  // Unknown route custom error handler
  app.use((req: Request, _res: Response, next: NextFunction): void => {
    const err = new CustomError(
      `You're lost, check your route ! Can't find ${req.method} : ${req.originalUrl} on the server`,
      404,
    );
    next(err);
  });
  app.use(errorHandler);
};
