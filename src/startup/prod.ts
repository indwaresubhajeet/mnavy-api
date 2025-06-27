import compression from 'compression';
import { Express, Request, Response } from 'express';
import helmet from 'helmet';

const shouldCompress = (req: Request, res: Response): boolean => {
  if (typeof req.headers['x-no-compression'] !== 'undefined') {
    // Will not compress responses, if this header is present
    return false;
  }
  // Resort to standard compression
  return compression.filter(req, res);
};

export const configureResponse = (app: Express): void => {
  app.use(helmet());
  app.use(
    compression({
      filter: shouldCompress,
      threshold: 0,
    }),
  );
};
