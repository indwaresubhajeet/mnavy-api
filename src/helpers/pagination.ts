import { Request } from 'express';

export interface PaginationOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
  allowedSortFields?: readonly string[];
  defaultSortField?: string;
}

export interface PaginationParams {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pageIndex: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  data: T[];
  count: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Extract and validate pagination parameters from request query
 */
export function getPaginationParams(
  req: Request,
  options: PaginationOptions = {},
): PaginationParams {
  const {
    defaultPageSize = 10,
    maxPageSize = 100,
    allowedSortFields = ['id', 'createdAt', 'updatedAt'],
    defaultSortField = 'createdAt',
  } = options;

  // Validate and sanitize pagination parameters
  const pageIndex = Math.max(1, parseInt(req.query.pageNo as string) || 1);
  const requestedPageSize = parseInt(req.query.pageLimit as string) || defaultPageSize;
  const pageSize = Math.min(Math.max(1, requestedPageSize), maxPageSize);

  // Validate sortBy field to prevent injection
  const requestedSortBy = req.query.sortBy as string;
  const sortBy = allowedSortFields.includes(requestedSortBy) ? requestedSortBy : defaultSortField;

  const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
  const skip = (pageIndex - 1) * pageSize;

  return {
    skip,
    take: pageSize,
    sortBy,
    sortOrder,
    pageIndex,
    pageSize,
  };
}

/**
 * Create pagination response with metadata
 */
export function createPaginationResponse<T>(
  data: T[],
  count: number,
  params: PaginationParams,
): PaginationResponse<T> {
  const totalPages = Math.ceil(count / params.pageSize);
  const hasNext = params.pageIndex < totalPages;
  const hasPrevious = params.pageIndex > 1;

  return {
    data,
    count,
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    totalPages,
    hasNext,
    hasPrevious,
  };
}

/**
 * Default pagination configuration for different entities
 */
export const PAGINATION_CONFIGS = {
  users: {
    defaultPageSize: 10,
    maxPageSize: 100,
    allowedSortFields: [
      'id',
      'name',
      'email',
      'phone',
      'userType',
      'isActive',
      'createdAt',
      'updatedAt',
    ],
    defaultSortField: 'createdAt',
  },
  admins: {
    defaultPageSize: 10,
    maxPageSize: 50,
    allowedSortFields: ['id', 'email', 'createdAt', 'updatedAt'],
    defaultSortField: 'createdAt',
  },
  // Can be extended for other entities
} as const;
