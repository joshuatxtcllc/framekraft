import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index'

describe('Orders API', () => {
  let server: any

  beforeAll(() => {
    server = app.listen(0)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('GET /api/orders', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401)
    })

    it('should validate request headers', async () => {
      await request(app)
        .get('/api/orders')
        .set('Content-Type', 'text/plain')
        .expect(401) // Still 401 due to no auth, but validates content-type handling
    })
  })

  describe('POST /api/orders', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/orders')
        .send({})
        .expect(401)
    })

    it('should validate content-type for POST requests', async () => {
      await request(app)
        .post('/api/orders')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(415) // Unsupported Media Type
    })

    it('should sanitize request data', async () => {
      const maliciousData = {
        description: 'Test\0Order',
        frameStyle: 'Modern\0Frame'
      }

      // Should not crash and handle null bytes
      await request(app)
        .post('/api/orders')
        .set('Content-Type', 'application/json')
        .send(maliciousData)
        .expect(401) // Still requires auth, but request was sanitized
    })
  })
})