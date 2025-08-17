import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { securityHeaders, sanitizeRequest, apiSecurity } from '../../middleware/security'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(securityHeaders)
  app.use(sanitizeRequest)
  app.use(apiSecurity)
  
  app.get('/test', (req, res) => res.json({ success: true }))
  app.post('/test', (req, res) => res.json({ body: req.body }))
  
  return app
}

describe('Security Middleware', () => {
  const app = createTestApp()

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app).get('/test')
      
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('Request Sanitization', () => {
    it('should remove null bytes from request body', async () => {
      const maliciousData = { test: 'value\0with\0nulls' }
      
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send(maliciousData)
      
      expect(response.body.body.test).toBe('valuewithulls')
    })
  })

  describe('API Security', () => {
    it('should require application/json content-type for POST', async () => {
      await request(app)
        .post('/test')
        .set('Content-Type', 'text/plain')
        .send('invalid')
        .expect(415)
    })

    it('should accept valid application/json content-type', async () => {
      await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })
        .expect(200)
    })
  })
})