import { Request, Response, Router } from 'express';

import { comparePassword, encrypt } from '../helpers/encryption';
import { HttpStatusCode } from '../helpers/http-status-codes';
import { generateAdminToken } from '../helpers/util';
import { asyncHandler } from '../middlewares/async-handler';
import { CustomError } from '../middlewares/custom-error';
import { config } from '../startup/config';
import { db } from '../startup/prisma-db';
import { LoginBody, RegisterBody } from '../types/application-admin';
import { validateLogin, validateRegistration } from '../validations/application-admin';

const router: Router = Router();

/**
 * Email login for Application Admin
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginBody;
    const { error } = validateLogin(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const admin = await db.applicationAdmin.findFirst({
      where: { email: body.email },
      select: { id: true, email: true, password: true },
    });

    if (!admin) {
      throw new CustomError('Admin does not exist.', HttpStatusCode.NotFound);
    }

    const isPasswordValid = comparePassword(body.password, admin.password as string);
    if (!isPasswordValid) {
      throw new CustomError('Invalid Credentials.', HttpStatusCode.BadRequest);
    }

    const token = await generateAdminToken(admin);
    res.header('Authorization', token);

    res
      .status(HttpStatusCode.Ok)
      .send({ statusCode: HttpStatusCode.Ok, message: 'Login Successful.' });
  }),
);

/**
 * Admin registration - FOR DEVELOPMENT ONLY
 * TODO: Remove this endpoint in production
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Development environment check
    if (config.isProduction()) {
      throw new CustomError('Registration not allowed in production.', HttpStatusCode.Forbidden);
    }

    const body = req.body as RegisterBody;
    const { error } = validateRegistration(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    // Check if admin already exists
    const existingAdmin = await db.applicationAdmin.findFirst({
      where: { email: body.email },
      select: { id: true, email: true },
    });

    if (existingAdmin) throw new CustomError('Admin already exists.', HttpStatusCode.Conflict);

    // Create new admin
    const admin = await db.applicationAdmin.create({
      data: {
        email: body.email,
        password: encrypt(body.password),
      },
      select: { id: true, email: true, createdAt: true },
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'Admin Registration Successful (Development Only).',
      data: admin,
    });
  }),
);

export { router as applicationAdminRoutes };
