import { Request } from 'express';

// Common utility types for dynamic objects
export interface DataObject {
  [key: string]: unknown;
}

export interface StringKeyObject {
  [key: string]: string;
}

export interface FilterObject {
  [key: string]: unknown;
}

// Specific types for database operations

export interface ICreate {
  data: DataObject;
  select?: string;
}

export interface IUpdate {
  id: string;
  newData: DataObject;
  select?: string;
}

export interface IUpdateMany {
  [key: string]: unknown; // Allows other dynamic keys with any type
  where: {
    [key: string]: unknown; // Dynamic keys with string values in 'where' object
  };
}

export interface IFind {
  [key: string]: unknown;
  select?: string;
}
export interface IEmailOtp {
  EmailData: string;
  Otp: number;
}
export interface IToken {
  id: string;
  name?: string;
  email: string;
  isAdmin: boolean;
  status: boolean;
  userType?: string;
}

export interface ICustomRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email: string;
    isAdmin: boolean;
    status: boolean;
    userType: 'Admin' | 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';
  };
}

export interface IActiveDelete {
  isActive: boolean;
  softDelete: boolean;
}
