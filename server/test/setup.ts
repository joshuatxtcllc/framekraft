import { beforeAll, afterAll, beforeEach } from 'vitest'
import { app } from '../index'

let server: any

beforeAll(async () => {
  // Start test server
  server = app.listen(0) // Use random port for tests
})

afterAll(async () => {
  // Close test server
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

beforeEach(() => {
  // Reset any test state between tests
})

export { server }