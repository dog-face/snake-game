import { test as base } from '@playwright/test';
import { apiService } from '../src/services/api';

/**
 * Custom fixtures for E2E tests
 */

type TestFixtures = {
  authenticatedUser: {
    username: string;
    email: string;
    password: string;
  };
};

export const test = base.extend<TestFixtures>({
  authenticatedUser: async ({ page }, use) => {
    // Create a unique user for each test
    const timestamp = Date.now();
    const username = `e2e_user_${timestamp}`;
    const email = `e2e_${timestamp}@test.com`;
    const password = 'TestPassword123!';

    // Sign up the user
    await page.goto('/signup');
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after signup
    await page.waitForURL('/', { timeout: 5000 });

    await use({ username, email, password });

    // Cleanup: Try to delete user via API (if endpoint exists)
    // For now, we'll just clear localStorage
    await page.evaluate(() => localStorage.clear());
  },
});

export { expect } from '@playwright/test';

