import { test as base } from '@playwright/test';
import { apiService } from '@/services/api';

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
    // Use a shorter username to stay within 20 character limit (username must be 3-20 chars)
    // Add random component to avoid collisions when tests run in parallel
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const username = `u${timestamp}${random}`.slice(0, 20); // Max 20 chars
    const email = `e2e_${timestamp}_${random}@test.com`;
    const password = 'TestPassword123!';

    // Sign up the user
    await page.goto('/signup');
    
    // Wait for form to be ready
    await page.waitForSelector('input[id="username"]', { timeout: 5000 });
    
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    
    // Set up response and navigation listeners before clicking
    const signupResponsePromise = page.waitForResponse(
      response => response.url().includes('/auth/signup'),
      { timeout: 20000 }
    );
    
    const navigationPromise = page.waitForURL('/', { timeout: 20000 });
    
    // Wait for button to be enabled and click
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();
    
    // Wait for signup API to complete
    const response = await signupResponsePromise;
    
    // Check response status (201 = Created is success for signup)
    if (response.status() !== 201 && response.status() !== 200) {
      const responseBody = await response.text().catch(() => 'Unable to read response');
      const errorMsg = await page.locator('.error-message').textContent({ timeout: 2000 }).catch(() => null);
      throw new Error(`Signup API failed with status ${response.status()}. Response: ${responseBody}. UI Error: ${errorMsg || 'None'}`);
    }
    
    // Wait for navigation to home page
    await navigationPromise;
    
    // Wait for the page to be fully loaded and user to be visible (use first() to avoid strict mode)
    await page.waitForSelector(`text=${username}`, { timeout: 15000 });

    await use({ username, email, password });

    // Cleanup: Try to delete user via API (if endpoint exists)
    // For now, we'll just clear localStorage safely
    try {
      await page.evaluate(() => {
        if (window.location.origin === window.location.origin) {
          localStorage.clear();
        }
      });
    } catch (e) {
      // Ignore localStorage errors during cleanup
    }
  },
});

export { expect } from '@playwright/test';

