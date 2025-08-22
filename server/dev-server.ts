#!/usr/bin/env node

/**
 * Development server wrapper to handle TSX watch process cleanly
 * This prevents memory leaks and zombie processes during hot reloads
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set max listeners for the parent process
process.setMaxListeners(20);

// Track child process
let child: ReturnType<typeof spawn> | null = null;
let isExiting = false;

// Function to start the server
function startServer() {
  const serverPath = path.join(__dirname, 'index.ts');
  
  child = spawn('tsx', ['watch', '--clear-screen=false', serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      TSX_WATCH_MODE: 'true',
    },
  });

  child.on('exit', (code, signal) => {
    if (!isExiting) {
      console.log(`Server process exited with code ${code} and signal ${signal}`);
      // Restart only if it wasn't a deliberate shutdown
      if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
        console.log('Restarting server...');
        setTimeout(startServer, 1000);
      }
    }
  });

  child.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
}

// Cleanup function
async function cleanup() {
  if (isExiting) return;
  isExiting = true;
  
  console.log('\nShutting down development server...');
  
  if (child && !child.killed) {
    child.kill('SIGTERM');
    
    // Give it 5 seconds to exit gracefully
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (child && !child.killed) {
          console.log('Force killing server...');
          child.kill('SIGKILL');
        }
        resolve(undefined);
      }, 5000);
      
      if (child) {
        child.once('exit', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      }
    });
  }
  
  console.log('Development server shutdown complete');
  process.exit(0);
}

// Register cleanup handlers
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
signals.forEach((signal) => {
  process.once(signal, () => {
    console.log(`\nReceived ${signal}`);
    cleanup();
  });
});

process.once('exit', () => {
  if (child && !child.killed) {
    child.kill('SIGKILL');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
console.log('Starting development server...');
startServer();