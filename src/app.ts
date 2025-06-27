import express from 'express';
import winston from 'winston';

import { configValidation, config } from './startup/config';
import { logger, uncaughtException, unhandledRejection } from './startup/logging';
import { initDatabase } from './startup/prisma-db';
import { configureResponse } from './startup/prod';
import { routes } from './startup/routes';

const app = express();

// Initialize logging and exception handling
logger();
uncaughtException();

// Configure routes and response handling
routes(app);
configureResponse(app);

// Start server with database initialization
async function startServer(): Promise<void> {
  try {
    // Validate configuration first
    await configValidation();

    // Initialize database connection and show stats
    await initDatabase();

    // Start the server
    const server = app.listen(config.port, (): void => {
      winston.info(`Maritime Navy API Server running on port ${config.port}`);
    });

    // Setup unhandled rejection handling
    unhandledRejection(server);
  } catch (error) {
    winston.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
