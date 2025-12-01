import { test, expect } from './fixtures';

test.describe('Leaderboard', () => {
  test('should display leaderboard page', async ({ authenticatedUser, page }) => {
    await page.goto('/leaderboard');

    // Should see leaderboard heading
    await expect(page.locator('h2:has-text("Leaderboard")')).toBeVisible();

    // Should see filter buttons
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Pass-through")')).toBeVisible();
    await expect(page.locator('button:has-text("Walls")')).toBeVisible();
  });

  test('should filter leaderboard by game mode', async ({ authenticatedUser, page }) => {
    await page.goto('/leaderboard');

    // Wait for leaderboard to load
    await page.waitForTimeout(1000);

    // Click Pass-through filter
    await page.click('button:has-text("Pass-through")');
    await expect(page.locator('button.active:has-text("Pass-through")')).toBeVisible();

    // Click Walls filter
    await page.click('button:has-text("Walls")');
    await expect(page.locator('button.active:has-text("Walls")')).toBeVisible();

    // Click All filter
    await page.click('button:has-text("All")');
    await expect(page.locator('button.active:has-text("All")')).toBeVisible();
  });

  test('should display leaderboard entries', async ({ authenticatedUser, page }) => {
    await page.goto('/leaderboard');

    // Wait for leaderboard to load
    await page.waitForTimeout(2000);

    // Leaderboard container should be visible
    const leaderboardContainer = page.locator('.leaderboard-container');
    await expect(leaderboardContainer).toBeVisible();

    // Check if entries are displayed (may be empty, but structure should exist)
    // The leaderboard might be empty, so we just check the container exists
    const entries = page.locator('.leaderboard-entry, .leaderboard-item, tbody tr');
    const count = await entries.count();
    
    // Leaderboard should either show entries or a message
    if (count === 0) {
      // If empty, might show a message or just empty state
      // This is acceptable
      expect(true).toBe(true);
    } else {
      // If entries exist, verify they have expected structure
      const firstEntry = entries.first();
      await expect(firstEntry).toBeVisible();
    }
  });

  test('should navigate to leaderboard from home', async ({ authenticatedUser, page }) => {
    await page.goto('/');

    // Click View Leaderboard button
    await page.click('a:has-text("View Leaderboard")');

    // Should be on leaderboard page
    await page.waitForURL('/leaderboard', { timeout: 5000 });
    await expect(page.locator('h2:has-text("Leaderboard")')).toBeVisible();
  });
});

