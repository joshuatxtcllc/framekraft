/**
 * Process cleanup utilities to prevent memory leaks and ensure graceful shutdown
 */

import type { Server } from 'http';
import mongoose from 'mongoose';

// Track if cleanup has already been initiated
let isCleaningUp = false;

// Increase max listeners to prevent warnings during development hot reloads
if (process.env.NODE_ENV === 'development') {
  process.setMaxListeners(20);
}

/**
 * Clean up resources and exit the process
 */
export async function cleanupAndExit(server?: Server, exitCode = 0): Promise<void> {
  if (isCleaningUp) {
    console.log('Cleanup already in progress...');
    return;
  }
  
  isCleaningUp = true;
  
  // In development with tsx watch, exit immediately to allow quick restart
  if (process.env.NODE_ENV === 'development' && process.env.TSX_WATCH_MODE === 'true') {
    console.log('Quick exit for tsx watch reload...');
    process.exit(exitCode);
    return;
  }
  
  console.log('\nStarting cleanup process...');

  const cleanupTasks: Promise<void>[] = [];

  // Close HTTP server if provided
  if (server) {
    cleanupTasks.push(
      new Promise<void>((resolve) => {
        // Set a timeout for server close
        const timeout = setTimeout(() => {
          console.log('⚠️ Server close timeout, forcing...');
          resolve();
        }, 1000);
        
        server.close(() => {
          clearTimeout(timeout);
          console.log('✓ HTTP server closed');
          resolve();
        });
      })
    );
  }

  // Close MongoDB connection
  if (mongoose.connection.readyState === 1) {
    cleanupTasks.push(
      Promise.race([
        mongoose.connection.close().then(() => {
          console.log('✓ MongoDB connection closed');
        }),
        new Promise<void>((resolve) => setTimeout(() => {
          console.log('⚠️ MongoDB close timeout');
          resolve();
        }, 1000))
      ]).catch((error) => {
        console.error('Error closing MongoDB:', error);
      })
    );
  }

  // Wait for all cleanup tasks with shorter timeout for development
  const timeout = process.env.NODE_ENV === 'development' ? 2000 : 5000;
  
  try {
    await Promise.race([
      Promise.all(cleanupTasks),
      new Promise((resolve) => setTimeout(resolve, timeout))
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
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGUSR2', 'SIGHUP'];
  
  signals.forEach((signal) => {
    // Remove existing listeners for this signal
    process.removeAllListeners(signal);
  });
  
  // Also clean up exit and beforeExit listeners
  process.removeAllListeners('exit');
  process.removeAllListeners('beforeExit');

  // For development, use immediate exit for faster hot reloads
  signals.forEach((signal) => {
    process.once(signal, () => {
      console.log(`\nReceived ${signal}, quick exit for hot reload...`);
      // Don't await cleanup in development for faster restarts
      if (server) {
        server.close(() => {});
      }
      // Close MongoDB connection without waiting
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.close().catch(() => {});
      }
      // Exit immediately
      process.exit(0);
    });
  });
  
  // Handle normal exit
  process.once('beforeExit', (code) => {
    if (!isCleaningUp) {
      process.exit(code);
    }
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
  // Remove existing exception handlers to prevent accumulation
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  
  // Register fresh handlers
  process.once('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await cleanupAndExit(server, 1);
  });

  process.once('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In development, we might want to continue running
    if (process.env.NODE_ENV === 'production') {
      await cleanupAndExit(server, 1);
    } else {
      console.error('Continuing in development mode...');
    }
  });
}