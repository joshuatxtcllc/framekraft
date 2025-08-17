import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index'

describe('Authentication API', () => {
  let server: any

  beforeAll(() => {
    server = app.listen(0)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('GET /api/auth/user', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(401)

      expect(response.body).toEqual({ message: 'Unauthorized' })
    })

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'malformed-token')
        .expect(401)

      expect(response.body.message).toBe('Unauthorized')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      // Make multiple requests quickly to trigger rate limit
      const requests = Array(12).fill(null).map(() => 
        request(app).get('/api/auth/user')
      )
      
      const responses = await Promise.all(requests)
      
      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })
})