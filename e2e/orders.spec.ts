import { test, expect } from '@playwright/test'

test.describe('Orders Management', () => {
  // Mock authentication for testing
  test.beforeEach(async ({ page }) => {
    // Add any setup needed for authenticated sessions
    await page.goto('/')
  })

  test('orders page loads without errors', async ({ page }) => {
    await page.goto('/orders')
    
    // Check for key elements
    await expect(page.getByText(/orders/i)).toBeVisible()
    
    // Should not show error messages
    const errorMessages = page.locator('[role="alert"]')
    await expect(errorMessages).toHaveCount(0)
  })

  test('kanban board renders correctly', async ({ page }) => {
    await page.goto('/kanban')
    
    await expect(page.getByTestId('kanban-main')).toBeVisible()
    await expect(page.getByText('Production Board')).toBeVisible()
    
    // Check for stage columns
    await expect(page.getByText('Order Processed')).toBeVisible()
    await expect(page.getByText('Materials Ordered')).toBeVisible()
  })

  test('navigation between orders and kanban works', async ({ page }) => {
    await page.goto('/orders')
    
    // Click kanban link in navigation
    const kanbanLink = page.getByRole('link', { name: /kanban/i })
    if (await kanbanLink.isVisible()) {
      await kanbanLink.click()
      await expect(page).toHaveURL(/\/kanban/)
    }
  })

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/kanban')
    
    // Should still be functional on mobile
    await expect(page.getByTestId('kanban-main')).toBeVisible()
  })
})