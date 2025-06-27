import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

import { config } from '../startup/config';

import { CustomError } from './custom-error';

// Database error interface for PostgreSQL errors
interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  column?: string;
  table?: string;
  statusCode?: number;
  status?: string;
  stack?: string;
}

// Error handlers for additional PostgreSQL error types

const handleUniqueViolationError = (err: DatabaseError): CustomError => {
  const constraintName = err.constraint;
  const msg = `Unique constraint violation: Constraint '${constraintName}' violated`;
  return new CustomError(msg, 400);
};

const handleTypeCastError = (err: DatabaseError): CustomError => {
  const msg = `Invalid data type for column: ${err.column}`;
  return new CustomError(msg, 400);
};

const handleForeignKeyViolationError = (err: DatabaseError): CustomError => {
  const constraintName = err.constraint;
  const msg = `Foreign key constraint violation: Constraint '${constraintName}' violated`;
  return new CustomError(msg, 400);
};

const handleUndefinedColumnError = (err: DatabaseError): CustomError => {
  const column = err.column;
  const msg = `Undefined column: '${column}'`;
  return new CustomError(msg, 400);
};

const handleUndefinedTableError = (err: DatabaseError): CustomError => {
  const table = err.table;
  const msg = `Undefined table: '${table}'`;
  return new CustomError(msg, 400);
};

const handleSyntaxError = (err: DatabaseError): CustomError => {
  const msg = `Code: ${err.code}, Syntax error or invalid SQL statement`;
  return new CustomError(msg, 400);
};

const handleInsufficientPrivilegesError = (_err: DatabaseError): CustomError => {
  const msg = 'Insufficient privileges';
  return new CustomError(msg, 403);
};

const handleConnectionError = (_err: DatabaseError): CustomError => {
  const msg = 'Database connection error';
  return new CustomError(msg, 500);
};

const handleClientConnectionClosedError = (_err: DatabaseError): CustomError => {
  const msg = 'Client connection closed unexpectedly';
  return new CustomError(msg, 500);
};

const handleDeadlockDetectedError = (_err: DatabaseError): CustomError => {
  const msg = 'Deadlock detected';
  return new CustomError(msg, 500);
};

const handleDataSerializationFailureError = (_err: DatabaseError): CustomError => {
  const msg = 'Data serialization failure';
  return new CustomError(msg, 500);
};

const devErrors = (res: Response, err: CustomError): void => {
  res.status(err.statusCode).send({
    statusCode: err.statusCode,
    message: err.message,
    stackTrace: err.stack,
    error: err,
  });
};

const prodErrors = (res: Response, err: CustomError): void => {
  if (err.isOperational) {
    res.status(err.statusCode).send({
      statusCode: err.statusCode,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).send({
      statusCode: err.statusCode,
      message: 'Something Went Wrong',
      error: err.stack,
    });
  }
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Type guard to check if error has expected properties
  const err = error as DatabaseError;
  err.statusCode =
    typeof err.statusCode === 'number' && !isNaN(err.statusCode) && err.statusCode > 0
      ? err.statusCode
      : 500;
  err.status = typeof err.status === 'string' && err.status.trim() !== '' ? err.status : 'error';
  winston.error(err);

  // Convert database errors to custom errors
  let customError: CustomError;

  if (err instanceof CustomError) {
    customError = err;
  } else if (typeof err.code === 'string' && err.code.trim() !== '') {
    // Handle database errors with error codes
    switch (err.code) {
      case '23505':
        // PostgreSQL unique violation error code
        customError = handleUniqueViolationError(err);
        break;
      case '22P02':
      case '23502':
        // PostgreSQL type cast error code or not-null violation error code
        customError = handleTypeCastError(err);
        break;
      case '23503':
        // PostgreSQL foreign key violation error code
        customError = handleForeignKeyViolationError(err);
        break;
      case '42703':
        // PostgreSQL undefined column error code
        customError = handleUndefinedColumnError(err);
        break;
      case '42P01':
        // PostgreSQL undefined table error code
        customError = handleUndefinedTableError(err);
        break;
      case '42601':
      case '42000':
        // PostgreSQL syntax error or invalid SQL statement error code
        customError = handleSyntaxError(err);
        break;
      case '42501':
        // PostgreSQL insufficient privileges error code
        customError = handleInsufficientPrivilegesError(err);
        break;
      case '08006':
      case '08001':
        // PostgreSQL connection errors
        customError = handleConnectionError(err);
        break;
      case '57P01':
        // PostgreSQL client connection closed unexpectedly error code
        customError = handleClientConnectionClosedError(err);
        break;
      case '40P01':
        // PostgreSQL deadlock detected error code
        customError = handleDeadlockDetectedError(err);
        break;
      case '40001':
        // PostgreSQL data serialization failure error code
        customError = handleDataSerializationFailureError(err);
        break;
      default:
        customError = new CustomError(
          err.message || 'Internal Server Error',
          err.statusCode || 500,
        );
        break;
    }
  } else {
    // Handle generic errors
    const message = err.message || 'Internal Server Error';
    customError = new CustomError(message, err.statusCode || 500);
  }

  config.nodeEnv === 'development' ? devErrors(res, customError) : prodErrors(res, customError);
};
