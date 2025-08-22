/**
 * Process cleanup utilities to prevent memory leaks and ensure graceful shutdown
 */

import type { Server } from 'http';
import mongoose from 'mongoose';

// Track if cleanup has already been initiated
let isCleaningUp = false;

/**
 * Clean up resources and exit the process
 */
export async function cleanupAndExit(server?: Server, exitCode = 0): Promise<void> {
  if (isCleaningUp) {
    console.log('Cleanup already in progress...');
    return;
  }
  
  isCleaningUp = true;
  console.log('\nStarting cleanup process...');

  const cleanupTasks: Promise<void>[] = [];

  // Close HTTP server if provided
  if (server) {
    cleanupTasks.push(
      new Promise<void>((resolve) => {
        server.close(() => {
          console.log('✓ HTTP server closed');
          resolve();
        });
      })
    );
  }

  // Close MongoDB connection
  if (mongoose.connection.readyState === 1) {
    cleanupTasks.push(
      mongoose.connection.close().then(() => {
        console.log('✓ MongoDB connection closed');
      }).catch((error) => {
        console.error('Error closing MongoDB:', error);
      })
    );
  }

  // Wait for all cleanup tasks with timeout
  try {
    await Promise.race([
      Promise.all(cleanupTasks),
      new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second timeout
    ]);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }

  console.log('Cleanup complete, exiting...');
  process.exit(exitCode);
}

/**
 * Register cleanup handlers for development mode
 * This prevents memory leaks from hot reloads
 */
export function registerDevelopmentCleanup(server?: Server): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Remove all existing listeners to prevent accumulation
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGUSR2'); // nodemon restart signal

  // Register single cleanup handler
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
  
  signals.forEach((signal) => {
    process.once(signal, async () => {
      console.log(`\nReceived ${signal} in development mode`);
      await cleanupAndExit(server, 0);
    });
  });
}

/**
 * Register cleanup handlers for production mode
 */
export function registerProductionCleanup(server?: Server): void {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  // Only register once
  if (process.listenerCount('SIGINT') > 0 || process.listenerCount('SIGTERM') > 0) {
    return;
  }

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  
  signals.forEach((signal) => {
    process.once(signal, async () => {
      console.log(`\nReceived ${signal} in production mode`);
      await cleanupAndExit(server, 0);
    });
  });
}

/**
 * Setup uncaught exception handlers
 */
export function setupExceptionHandlers(server?: Server): void {
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await cleanupAndExit(server, 1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await cleanupAndExit(server, 1);
  });
}