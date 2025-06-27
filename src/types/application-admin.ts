export interface ApplicationAdmin {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LoginBody = Pick<ApplicationAdmin, 'email' | 'password'>;
export type RegisterBody = Pick<ApplicationAdmin, 'email' | 'password'>; // For development only
