import { compareSync, hashSync } from 'bcrypt';
const saltRounds = 10;

/**
 * Encryption password with bcrypt
 */
export const encrypt = (password: string): string => {
  return hashSync(password, saltRounds);
};

/**
 * Password compare
 */
export const comparePassword = (password: string, userPassword: string): boolean => {
  return compareSync(password, userPassword);
};
