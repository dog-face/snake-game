import { test, expect } from './fixtures';

test.describe('Authentication Flow', () => {
  test('should sign up a new user', async ({ page }) => {
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const email = `test_${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/signup');

    // Fill in signup form
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page after successful signup
    await page.waitForURL('/', { timeout: 5000 });
    
    // Should see welcome message with username
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator(`text=${username}`)).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    const timestamp = Date.now();
    const username1 = `user1_${timestamp}`;
    const username2 = `user2_${timestamp}`;
    const email = `duplicate_${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Sign up first user
    await page.goto('/signup');
    await page.fill('input[id="username"]', username1);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 5000 });

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login', { timeout: 5000 });

    // Try to sign up with same email
    await page.goto('/signup');
    await page.fill('input[id="username"]', username2);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    const timestamp = Date.now();
    const username = `loginuser_${timestamp}`;
    const email = `login_${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // First sign up
    await page.goto('/signup');
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 5000 });

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login', { timeout: 5000 });

    // Login
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to home
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page.locator(`text=${username}`)).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[id="username"]', 'nonexistent_user');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ authenticatedUser, page }) => {
    // User is already authenticated via fixture
    await page.goto('/');

    // Verify user is logged in
    await expect(page.locator(`text=${authenticatedUser.username}`)).toBeVisible();

    // Click logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await page.waitForURL('/login', { timeout: 5000 });

    // Should not see user-specific content
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.evaluate(() => localStorage.clear());

    // Try to access protected route
    await page.goto('/game');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });

    // Try another protected route
    await page.goto('/leaderboard');
    await page.waitForURL('/login', { timeout: 5000 });

    await page.goto('/watch');
    await page.waitForURL('/login', { timeout: 5000 });
  });
});

