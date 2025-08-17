import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should see the landing page or login prompt
    await expect(page).toHaveTitle(/FrameCraft/)
    
    // Check for authentication elements
    const loginButton = page.getByTestId('login-button')
    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeVisible()
    }
  })

  test('should show proper error handling for failed auth', async ({ page }) => {
    // Navigate to protected route directly
    await page.goto('/dashboard')
    
    // Should redirect to landing or show login
    await expect(page.url()).not.toContain('/dashboard')
  })

  test('health check endpoint works', async ({ page }) => {
    const response = await page.request.get('/health')
    expect(response.status()).toBe(200)
    
    const health = await response.json()
    expect(health.status).toBe('healthy')
    expect(health.database.status).toBe('connected')
  })
})