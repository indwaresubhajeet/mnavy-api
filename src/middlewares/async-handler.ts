import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (handler: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      // Sending error to error handler middleware
      next(error);
    }
  };
};
