import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use a dummy connection string if none provided
const dbUrl = process.env.DATABASE_URL || 'postgresql://demo:demo@localhost:5432/framekraft';

let pool: any;
let db: any;

// Create a mock database object for development
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost')) {
  console.log('⚠️ Using mock database for development');
  
  // Create mock objects that won't crash
  pool = {} as any;
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
    execute: () => Promise.resolve({ rows: [] }),
  } as any;
} else {
  pool = new Pool({ connectionString: dbUrl });
  db = drizzle({ client: pool, schema });
}

export { pool, db };