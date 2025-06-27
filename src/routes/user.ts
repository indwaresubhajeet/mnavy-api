import { Request, Response, Router } from 'express';

import { comparePassword, encrypt } from '../helpers/encryption';
import { HttpStatusCode } from '../helpers/http-status-codes';
import {
  createPaginationResponse,
  getPaginationParams,
  PAGINATION_CONFIGS,
} from '../helpers/pagination';
import { generateUserToken } from '../helpers/util';
import { isAdmin } from '../middlewares/admin';
import { asyncHandler } from '../middlewares/async-handler';
import { auth } from '../middlewares/auth';
import { CustomError } from '../middlewares/custom-error';
import { db } from '../startup/prisma-db';
import { ICustomRequest } from '../types/common';
import { RegisterBody, LoginBody, UpdateBody } from '../types/user';
import { validateLogin, validateRegistration, validateUpdate } from '../validations/user';

const router: Router = Router();

/**
 * User registration (Only Admin can create users)
 */
router.post(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response): Promise<void> => {
    const body = req.body as RegisterBody;
    const { error } = validateRegistration(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { email: body.email, softDelete: false },
      select: { id: true, email: true },
    });

    if (existingUser) throw new CustomError('User already exists.', HttpStatusCode.Conflict);

    // Create new user
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: encrypt(body.password),
        phone: body.phone,
        userType: body.userType,
      },
      select: { id: true, name: true, email: true, phone: true, userType: true },
    });

    res.status(HttpStatusCode.Created).send({
      statusCode: HttpStatusCode.Created,
      message: 'User Registration Successful.',
      data: user,
    });
  }),
);

/**
 * Get all Users
 */
router.get(
  '/',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response): Promise<void> => {
    const paginationParams = getPaginationParams(req, PAGINATION_CONFIGS.users);

    const [records, count] = await Promise.all([
      db.user.findMany({
        where: { softDelete: false },
        skip: paginationParams.skip,
        take: paginationParams.take,
        orderBy: { [paginationParams.sortBy]: paginationParams.sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          userType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.user.count({ where: { softDelete: false } }),
    ]);

    if (!records.length) throw new CustomError('No records found.', HttpStatusCode.NotFound);

    const paginationResponse = createPaginationResponse(records, count, paginationParams);

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: `${count} record(s) found.`,
      ...paginationResponse,
    });
  }),
);

/**
 * Get User by ID
 */
router.get(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response): Promise<void> => {
    const id = req.params.id;

    if (id === null || id === undefined || id === '') {
      throw new CustomError('User ID is required', HttpStatusCode.BadRequest);
    }

    const user = await db.user.findFirst({
      where: { id, softDelete: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new CustomError('Record not found.', HttpStatusCode.NotFound);

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: `Record found.`,
      data: user,
    });
  }),
);

/**
 * Update User by ID
 */
router.put(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response): Promise<void> => {
    const id = req.params.id;

    if (id === null || id === undefined || id === '') {
      throw new CustomError('User ID is required', HttpStatusCode.BadRequest);
    }

    const body = req.body as UpdateBody;

    const { error } = validateUpdate(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const existing = await db.user.findFirst({ where: { id, softDelete: false } });
    if (!existing) {
      throw new CustomError('Record not found.', HttpStatusCode.NotFound);
    }

    if (body.email) {
      const emailExists = await db.user.findFirst({
        where: { email: body.email, softDelete: false, NOT: { id } },
      });
      if (emailExists) {
        throw new CustomError('Email already in use.', HttpStatusCode.Conflict);
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Record updated.',
      data: updated,
    });
  }),
);

/**
 * Toggle Active Status
 */
router.put(
  '/status/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response): Promise<void> => {
    const id = req.params.id;

    if (id === null || id === undefined || id === '') {
      throw new CustomError('User ID is required', HttpStatusCode.BadRequest);
    }

    const existing = await db.user.findFirst({
      where: { id, softDelete: false },
      select: { id: true, isActive: true },
    });
    if (!existing) {
      throw new CustomError('Record not found.', HttpStatusCode.NotFound);
    }

    await db.user.update({ where: { id }, data: { isActive: !existing.isActive } });

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: 'Record status updated.',
    });
  }),
);

/**
 * Soft Delete / Restore
 */
router.delete(
  '/:id',
  [auth, isAdmin],
  asyncHandler(async (req: ICustomRequest, res: Response): Promise<void> => {
    const id = req.params.id;

    if (id === null || id === undefined || id === '') {
      throw new CustomError('User ID is required', HttpStatusCode.BadRequest);
    }

    const existing = await db.user.findUnique({
      where: { id },
      select: { id: true, softDelete: true },
    });
    if (!existing) {
      throw new CustomError('Record not found.', HttpStatusCode.NotFound);
    }

    await db.user.update({
      where: { id },
      data: { softDelete: !existing.softDelete },
    });

    res.status(HttpStatusCode.Ok).send({
      statusCode: HttpStatusCode.Ok,
      message: `${existing.softDelete ? 'Record restored.' : 'Record deleted.'}`,
    });
  }),
);

/**
 * Email login for User
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginBody;
    const { error } = validateLogin(body);
    if (error) throw new CustomError(error?.message, HttpStatusCode.BadRequest);

    const user = await db.user.findFirst({
      where: { email: body.email, softDelete: false },
      select: { id: true, name: true, email: true, password: true, userType: true, isActive: true },
    });

    if (!user) {
      throw new CustomError('User does not exist.', HttpStatusCode.NotFound);
    }

    const isPasswordValid = comparePassword(body.password, user.password as string);
    if (!isPasswordValid) {
      throw new CustomError('Invalid Credentials.', HttpStatusCode.BadRequest);
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new CustomError(
        'Account is inactive. Contact administrator.',
        HttpStatusCode.Unauthorized,
      );
    }

    const token = await generateUserToken(user);
    res.header('Authorization', token);

    res
      .status(HttpStatusCode.Ok)
      .send({ statusCode: HttpStatusCode.Ok, message: 'Login Successful.' });
  }),
);

export { router as userRoutes };
