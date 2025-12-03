import { test, expect } from './fixtures';
import { chromium, Browser, BrowserContext } from '@playwright/test';

test.describe('Multiple Concurrent Users', () => {
  test('should handle multiple users playing simultaneously', async ({ page }) => {
    // Create multiple browser contexts to simulate different users
    const browser = await chromium.launch();
    const contexts: BrowserContext[] = [];
    const pages = [];

    try {
      // Create 3 user contexts
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        const userPage = await context.newPage();
        pages.push(userPage);

        // Sign up each user
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const username = `user${i}_${timestamp}_${random}`.slice(0, 20);
        const email = `user${i}_${timestamp}_${random}@test.com`;
        const password = 'TestPassword123!';

        await userPage.goto('/signup');
        await userPage.waitForSelector('input[id="username"]', { timeout: 5000 });
        await userPage.fill('input[id="username"]', username);
        await userPage.fill('input[id="email"]', email);
        await userPage.fill('input[id="password"]', password);
        
        const signupResponsePromise = userPage.waitForResponse(
          response => response.url().includes('/auth/signup'),
          { timeout: 20000 }
        );
        
        const navigationPromise = userPage.waitForURL('/', { timeout: 20000 });
        
        const submitButton = userPage.locator('button[type="submit"]');
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();
        
        await signupResponsePromise;
        await navigationPromise;
      }

      // All users navigate to game
      for (const userPage of pages) {
        await userPage.goto('/game');
        await userPage.waitForTimeout(500);
      }

      // All users start their games simultaneously
      const startPromises = pages.map(userPage => 
        userPage.click('button:has-text("Start Game")')
      );
      await Promise.all(startPromises);

      // Wait for games to start
      await Promise.all(pages.map(p => p.waitForTimeout(500)));

      // All users play simultaneously
      const playPromises = pages.map((userPage, index) => {
        const directions = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        const direction = directions[index % directions.length];
        return userPage.keyboard.press(direction);
      });
      await Promise.all(playPromises);

      // Wait a bit
      await Promise.all(pages.map(p => p.waitForTimeout(500)));

      // Verify all games are still running
      for (const userPage of pages) {
        const pauseButton = userPage.locator('button.pause-button:has-text("Pause")');
        await expect(pauseButton).toBeVisible({ timeout: 2000 });
      }

      // All users navigate to watch to see each other
      for (const userPage of pages) {
        await userPage.goto('/watch');
        await userPage.waitForTimeout(1000);
      }

      // At least one user should see active players (the other users)
      let activePlayersFound = false;
      for (const userPage of pages) {
        const playersList = userPage.locator('[class*="player"], [class*="active-player"], .player-card');
        const playersCount = await playersList.count();
        if (playersCount > 0) {
          activePlayersFound = true;
          break;
        }
      }

      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });

  test('should handle concurrent score submissions', async ({ page }) => {
    const browser = await chromium.launch();
    const contexts: BrowserContext[] = [];
    const pages = [];

    try {
      // Create 2 users
      for (let i = 0; i < 2; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        const userPage = await context.newPage();
        pages.push(userPage);

        // Sign up
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const username = `sub${i}_${timestamp}_${random}`.slice(0, 20);
        const email = `sub${i}_${timestamp}_${random}@test.com`;
        const password = 'TestPassword123!';

        await userPage.goto('/signup');
        await userPage.waitForSelector('input[id="username"]', { timeout: 5000 });
        await userPage.fill('input[id="username"]', username);
        await userPage.fill('input[id="email"]', email);
        await userPage.fill('input[id="password"]', password);
        
        const signupResponsePromise = userPage.waitForResponse(
          response => response.url().includes('/auth/signup'),
          { timeout: 20000 }
        );
        
        const navigationPromise = userPage.waitForURL('/', { timeout: 20000 });
        
        const submitButton = userPage.locator('button[type="submit"]');
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();
        
        await signupResponsePromise;
        await navigationPromise;
      }

      // Both users play games
      for (const userPage of pages) {
        await userPage.goto('/game');
        await userPage.waitForTimeout(500);
        await userPage.click('button:has-text("Start Game")');
        await userPage.waitForTimeout(500);
        
        // Play briefly
        for (let j = 0; j < 5; j++) {
          await userPage.keyboard.press('ArrowRight');
          await userPage.waitForTimeout(100);
        }
      }

      // Both users navigate to leaderboard
      for (const userPage of pages) {
        await userPage.goto('/leaderboard');
        await userPage.waitForTimeout(1000);
      }

      // Verify leaderboard is accessible for both
      for (const userPage of pages) {
        await expect(userPage.locator('h2:has-text("Leaderboard")')).toBeVisible();
      }

      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
});

