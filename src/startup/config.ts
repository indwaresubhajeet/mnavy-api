import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables from .env file
dotenv.config();

// Helper function to get required environment variable
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`${key} environment variable is required`);
  }
  return value;
};

// Helper function to get optional environment variable with default
const getOptionalEnv = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
};

// Helper function to get required number environment variable
const getRequiredNumber = (key: string): number => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`${key} environment variable is required`);
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${key} environment variable must be a valid number`);
  }
  return num;
};

type Config = {
  readonly nodeEnv: string;
  readonly appName: string;
  readonly port: number;
  readonly database: {
    readonly url: string;
  };
  readonly jwt: {
    readonly secret: string;
    readonly expiresInDays: number;
  };
  readonly azure: {
    readonly storage: {
      readonly url: string;
      readonly accessKey: string;
      readonly secretAccessKey: string;
    };
  };
  readonly email: {
    readonly user: string;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly refreshToken: string;
    readonly accessToken: string;
  };
  readonly isDevelopment: () => boolean;
  readonly isProduction: () => boolean;
  readonly isTest: () => boolean;
  readonly isEmailConfigured: () => boolean;
  readonly isAzureStorageConfigured: () => boolean;
};

export const config: Config = {
  // App configuration
  nodeEnv: getRequiredEnv('NODE_ENV'),
  appName: getRequiredEnv('APP_NAME'),
  port: getRequiredNumber('PORT'),

  // Database configuration
  database: {
    url: getRequiredEnv('DATABASE_URL'),
  },

  // JWT configuration
  jwt: {
    secret: getRequiredEnv('JWT_SECRET'),
    expiresInDays: getRequiredNumber('JWT_EXPIRES_IN_DAYS'),
  },

  // Azure Storage configuration
  azure: {
    storage: {
      url: getRequiredEnv('AZURE_STORAGE_URL'),
      accessKey: getRequiredEnv('AZURE_STORAGE_ACCESS_KEY'),
      secretAccessKey: getRequiredEnv('AZURE_STORAGE_SECRET_ACCESS_KEY'),
    },
  },

  // Email configuration (optional)
  email: {
    user: getOptionalEnv('EMAIL_USER', ''),
    clientId: getOptionalEnv('EMAIL_CLIENT_ID', ''),
    clientSecret: getOptionalEnv('EMAIL_CLIENT_SECRET', ''),
    refreshToken: getOptionalEnv('EMAIL_REFRESH_TOKEN', ''),
    accessToken: getOptionalEnv('EMAIL_ACCESS_TOKEN', ''),
  },

  // Environment helpers
  isDevelopment: (): boolean => config.nodeEnv === 'development' || config.nodeEnv === 'dev',
  isProduction: (): boolean => config.nodeEnv === 'production',
  isTest: (): boolean => config.nodeEnv === 'test',

  // Service availability helpers
  isEmailConfigured: (): boolean =>
    !!(config.email.user && config.email.clientId && config.email.clientSecret),
  isAzureStorageConfigured: (): boolean =>
    !!(
      config.azure.storage.url &&
      config.azure.storage.accessKey &&
      config.azure.storage.secretAccessKey
    ),
} as const;

/**
 * Validate application configuration for startup
 * This performs both basic env var validation and business-logic validation
 */
export const configValidation = async (): Promise<void> => {
  try {
    // Basic validation - accessing required fields will trigger validation
    const requiredConfigs = [
      config.appName,
      config.nodeEnv,
      config.port,
      config.database.url,
      config.jwt.secret,
      config.jwt.expiresInDays,
      config.azure.storage.url,
      config.azure.storage.accessKey,
      config.azure.storage.secretAccessKey,
    ];

    // Check if any required config is missing
    const missingConfigs = requiredConfigs.filter(
      (conf): boolean => conf === undefined || conf === null || conf === '',
    );
    if (missingConfigs.length > 0) {
      throw new Error('FATAL ERROR: Required configuration is missing');
    }

    // Business logic validation
    if (config.jwt.secret.length < 32) {
      throw new Error('FATAL ERROR: JWT secret must be at least 32 characters long');
    }

    // Warn about optional services
    if (!config.isEmailConfigured()) {
      winston.warn('Email configuration not provided - notifications will not work');
    }

    winston.info(`Configuration validated for ${config.nodeEnv} environment`);
  } catch (error) {
    winston.error('Configuration validation failed:', (error as Error).message);
    process.exit(1);
  }
};
