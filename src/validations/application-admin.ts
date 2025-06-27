import { z } from 'zod';

type ValidationResult = {
  error: { message: string } | null;
};

// Development-only registration schema
const registrationSchema: z.ZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/,
      'Password should be between 6-12 characters and consist of uppercase, lowercase, number and special characters',
    ),
});

const loginSchema: z.ZodSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,12}$/,
      'Password should be between 6-12 characters and consist of uppercase, lowercase, number and special characters',
    ),
});

export function validateRegistration(body: unknown): ValidationResult {
  const result = registrationSchema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err: z.ZodIssue): string => err.message)
      .join(', ');
    return { error: { message: errorMessage } };
  }
  return { error: null };
}

export function validateLogin(body: unknown): ValidationResult {
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err: z.ZodIssue): string => err.message)
      .join(', ');
    return { error: { message: errorMessage } };
  }
  return { error: null };
}

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
