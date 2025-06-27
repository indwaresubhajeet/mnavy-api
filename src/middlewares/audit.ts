import { NextFunction, Response } from 'express';
import winston from 'winston';

import { db } from '../startup/prisma-db';
import { ICustomRequest } from '../types/common';

export const auditMiddleware = (req: ICustomRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const oldWrite = res.write;
  const oldEnd = res.end;

  const chunks: Buffer[] = [];

  res.write = function (...args: unknown[]): boolean {
    chunks.push(Buffer.from(args[0] as string | Buffer));
    return oldWrite.apply(res, args as Parameters<typeof oldWrite>);
  };

  res.end = function (...args: unknown[]) {
    if (args[0]) {
      chunks.push(Buffer.from(args[0] as string | Buffer));
    }

    // Check if the response contains binary data
    let body = '';
    try {
      body = Buffer.concat(chunks).toString('utf8');
    } catch {
      body = JSON.stringify({ body: '[Binary data]' });
    }

    // Avoid logging binary content by replacing it with a placeholder
    if (body.includes('\u0000')) {
      body = JSON.stringify({ body: '[Binary data]' });
    }

    (res as Response & { body?: string }).body = body; // Optional: Attach the body to res for easier access
    return oldEnd.apply(res, args as Parameters<typeof oldEnd>);
  };

  res.on('finish', async () => {
    const duration = Date.now() - startTime;

    // hide password from audit log
    if (req.body && req.body.password) {
      req.body = { ...req.body, password: '**********' };
    }

    if (req.method === 'OPTIONS') return;

    const auditLog = {
      userId: req.user && req.user.userType !== 'Admin' ? req.user.id : null,
      applicationAdminId: req.user && req.user.userType === 'Admin' ? req.user.id : null,
      userType: req.user ? req.user.userType : null,
      method: req.method,
      path: req.originalUrl,
      body: req.body || {},
      query: req.query,
      headers: req.headers,
      responseStatus: res.statusCode,
      // responseBody: res.body || {},
      duration: duration,
    };

    // Log audit data asynchronously without waiting
    setImmediate(async () => {
      try {
        await db.auditTrail.create({ data: auditLog });
      } catch (err) {
        winston.error('Error saving audit log:', err);
      }
    });
  });

  next();
};
