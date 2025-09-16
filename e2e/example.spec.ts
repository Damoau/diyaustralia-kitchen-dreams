import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check for key navigation items
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible());
  });

  test('should display the hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for hero content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Product Catalog', () => {
  test('should navigate to products page', async ({ page }) => {
    await page.goto('/');
    
    // Click on products link
    await page.getByRole('link', { name: /products/i }).click();
    
    // Should be on products page
    await expect(page).toHaveURL(/\/products/);
  });

  test('should display cabinet categories', async ({ page }) => {
    await page.goto('/products');
    
    // Check for cabinet categories
    await expect(page.getByText(/base cabinets/i)).toBeVisible();
    await expect(page.getByText(/top cabinets/i)).toBeVisible();
  });
});

test.describe('Cart Functionality', () => {
  test('should add items to cart', async ({ page }) => {
    await page.goto('/shop/base-cabinets');
    
    // Find a cabinet and configure it
    const firstCabinet = page.locator('[data-testid="cabinet-item"]').first();
    await firstCabinet.getByRole('button', { name: /configure/i }).click();
    
    // Configure the cabinet (mock implementation)
    await page.getByRole('button', { name: /add to cart/i }).click();
    
    // Check that cart icon shows item count
    await expect(page.getByTestId('cart-count')).toContainText('1');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set viewport for mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that mobile navigation works
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});