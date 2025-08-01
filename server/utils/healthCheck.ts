import { Request, Response } from "express";
import { db } from "../db";

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // Check database connection
    const dbStart = Date.now();
    await db.execute('SELECT 1');
    const dbResponseTime = Date.now() - dbStart;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.rss + memUsage.heapUsed + memUsage.external;

    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: {
        status: 'connected',
        responseTime: dbResponseTime
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(totalMem / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / totalMem) * 100)
      }
    };

    // Check for warning conditions
    const responseTime = Date.now() - startTime;
    if (responseTime > 5000 || dbResponseTime > 1000) {
      health.status = 'unhealthy';
      res.status(503);
    }

    if (health.memory.percentage > 90) {
      health.status = 'unhealthy';
      res.status(503);
    }

    res.json(health);

  } catch (error) {
    const health: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: {
        status: 'disconnected'
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    };

    console.error('Health check failed:', error);
    res.status(503).json(health);
  }
}