import { Request, Response } from 'express'
import { db } from '../db'
import { sql } from 'drizzle-orm'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  database: {
    status: 'connected' | 'disconnected'
    responseTime?: number
    error?: string
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  environment: string
}

const startTime = Date.now()

export async function healthCheck(req: Request, res: Response) {
  const healthData: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: {
      status: 'disconnected'
    },
    memory: {
      used: 0,
      total: 0,
      percentage: 0
    },
    environment: process.env.NODE_ENV || 'development'
  }

  try {
    // Test database connection
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1`)
    const dbResponseTime = Date.now() - dbStart
    
    healthData.database = {
      status: 'connected',
      responseTime: dbResponseTime
    }
  } catch (error) {
    healthData.status = 'unhealthy'
    healthData.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }

  // Memory usage
  const memUsage = process.memoryUsage()
  const totalMem = memUsage.heapTotal
  const usedMem = memUsage.heapUsed
  
  healthData.memory = {
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
    percentage: Math.round((usedMem / totalMem) * 100)
  }

  // Set response status
  const statusCode = healthData.status === 'healthy' ? 200 : 503
  
  res.status(statusCode).json(healthData)
}