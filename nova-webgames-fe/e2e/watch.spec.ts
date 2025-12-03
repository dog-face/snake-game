import { test, expect } from './fixtures';

test.describe('Watch Mode', () => {
  test('should display watch page', async ({ authenticatedUser, page }) => {
    await page.goto('/watch');

    // Should see watch page heading
    await expect(page.locator('h2:has-text("Watch Players")')).toBeVisible();
  });

  test('should show active players list', async ({ authenticatedUser, page }) => {
    await page.goto('/watch');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Should see active players section or empty state
    const watchContainer = page.locator('.watch-container, [class*="watch"]');
    await expect(watchContainer.first()).toBeVisible();
  });

  test('should navigate to watch from home', async ({ authenticatedUser, page }) => {
    await page.goto('/');

    // Navigate to watch via navbar
    await page.click('nav a:has-text("Watch")');

    // Should be on watch page
    await page.waitForURL('/watch', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Watch Players")')).toBeVisible();
  });

  test('should refresh active players', async ({ authenticatedUser, page }) => {
    await page.goto('/watch');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Look for refresh button if it exists
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]');
    const refreshCount = await refreshButton.count();
    
    if (refreshCount > 0) {
      await refreshButton.first().click();
      await page.waitForTimeout(1000);
    }

    // Page should still be functional
    await expect(page.locator('h2:has-text("Watch Players")')).toBeVisible();
  });
});

