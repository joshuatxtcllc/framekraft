import { spawn } from 'child_process';
import { log } from './vite';

let serverProcess: any = null;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_DELAY_MS = 2000;

function startServer() {
  console.log('🚀 Starting server...');
  
  serverProcess = spawn('tsx', ['watch', '--clear-screen=false', '--ignore', '**/*.test.ts', '--ignore', '**/dist/**', 'index.ts'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  serverProcess.on('error', (error: any) => {
    console.error('❌ Server process error:', error);
    handleServerCrash();
  });

  serverProcess.on('exit', (code: number | null, signal: string | null) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Server exited with code ${code}, signal: ${signal}`);
      handleServerCrash();
    } else if (signal === 'SIGTERM' || signal === 'SIGINT') {
      console.log('Server stopped by user');
      process.exit(0);
    }
  });

  // Reset restart attempts on successful run
  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      restartAttempts = 0;
      console.log('✅ Server running successfully');
    }
  }, 5000);
}

function handleServerCrash() {
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error(`❌ Server crashed ${MAX_RESTART_ATTEMPTS} times. Giving up.`);
    process.exit(1);
  }

  restartAttempts++;
  console.log(`🔄 Attempting to restart server (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`);
  
  setTimeout(() => {
    startServer();
  }, RESTART_DELAY_MS);
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  process.exit(0);
});

// Start the server
startServer();