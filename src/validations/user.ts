import { z } from 'zod';

type ValidationResult = {
  error: { message: string } | null;
};

const registrationSchema = z.object({
  name: z.string().max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .email('Invalid email format')
    .refine(
      (email: string): boolean => {
        const validTlds = ['com', 'net', 'in'];
        const domain = email.split('@')[1];
        const tld = domain?.split('.').pop();
        return typeof tld === 'string' && tld.length > 0 && validTlds.includes(tld);
      },
      { message: 'Email must have a valid TLD (com, net, in)' },
    ),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/,
      'Password should be between 6-12 characters and consist of uppercase, lowercase, number and special characters',
    ),
  phone: z.string().max(50, 'Phone must be less than 50 characters'),
  userType: z.enum(['SHIP_COMPANY_ADMIN', 'SHIP_ADMIN', 'CAPTAIN', 'SECOND_OFFICER']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/,
      'Password Should be between 6-12 characters and consist uppercase, lowercase, number and special characters',
    ),
});

const updateSchema = z.object({
  name: z.string().max(50, 'Name must be less than 50 characters').optional(),
  phone: z.string().max(50, 'Phone must be less than 50 characters').optional(),
  email: z
    .string()
    .email('Invalid email format')
    .refine(
      (email: string): boolean => {
        const validTlds = ['com', 'net', 'in'];
        const domain = email.split('@')[1];
        const tld = domain?.split('.').pop();
        return typeof tld === 'string' && tld.length > 0 && validTlds.includes(tld);
      },
      { message: 'Email must have a valid TLD (com, net, in)' },
    )
    .optional(),
});

export function validateRegistration(body: unknown): ValidationResult {
  const result = registrationSchema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err: { message: string }): string => err.message)
      .join(', ');
    return { error: { message: errorMessage } };
  }
  return { error: null };
}

export function validateLogin(body: unknown): ValidationResult {
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err: { message: string }): string => err.message)
      .join(', ');
    return { error: { message: errorMessage } };
  }
  return { error: null };
}

export function validateUpdate(body: unknown): ValidationResult {
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err: { message: string }): string => err.message)
      .join(', ');
    return { error: { message: errorMessage } };
  }
  return { error: null };
}
