import { Request, Response } from 'express'
import { getMongoDb } from '../mongodb'

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

  // Check database connection
  try {
    const dbStart = Date.now()
    const db = await getMongoDb()
    // Perform a simple ping to check connection
    await db.admin().ping()
    const responseTime = Date.now() - dbStart
    
    healthData.database = {
      status: 'connected',
      responseTime
    }
  } catch (error) {
    healthData.status = 'unhealthy'
    healthData.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }

  // Check memory usage
  const memUsage = process.memoryUsage()
  const totalMemory = require('os').totalmem()
  const usedMemory = memUsage.heapUsed + memUsage.external
  
  healthData.memory = {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round((usedMemory / totalMemory) * 100)
  }

  // Determine overall health status
  if (healthData.database.status === 'disconnected') {
    healthData.status = 'unhealthy'
  }

  const statusCode = healthData.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(healthData)
}