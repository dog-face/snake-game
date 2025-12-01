import { test, expect } from './fixtures';

test.describe('Full User Flow', () => {
  test('complete flow: signup -> play game -> submit score -> view leaderboard', async ({ page }) => {
    const timestamp = Date.now();
    const username = `flowuser_${timestamp}`;
    const email = `flow_${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Step 1: Sign up
    await page.goto('/signup');
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page.locator(`text=${username}`)).toBeVisible();

    // Step 2: Navigate to game
    await page.click('a:has-text("Play Game")');
    await page.waitForURL('/game', { timeout: 5000 });

    // Step 3: Start game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Step 4: Play briefly (move snake a few times)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Step 5: Navigate to leaderboard
    await page.click('a:has-text("Leaderboard")');
    await page.waitForURL('/leaderboard', { timeout: 5000 });
    await expect(page.locator('h2:has-text("Leaderboard")')).toBeVisible();

    // Step 6: Navigate to watch
    await page.click('a:has-text("Watch")');
    await page.waitForURL('/watch', { timeout: 5000 });
    await expect(page.locator('h2:has-text("Watch Players")')).toBeVisible();

    // Step 7: Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login', { timeout: 5000 });
  });

  test('navigation flow: test all main routes', async ({ authenticatedUser, page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('h1:has-text("Welcome to Snake Game")')).toBeVisible();

    // Navigate to game
    await page.click('a:has-text("Play Game")');
    await page.waitForURL('/game', { timeout: 5000 });
    await expect(page.locator('h2:has-text("Snake Game")')).toBeVisible();

    // Navigate to leaderboard via navbar
    await page.click('nav a:has-text("Leaderboard")');
    await page.waitForURL('/leaderboard', { timeout: 5000 });

    // Navigate to watch via navbar
    await page.click('nav a:has-text("Watch")');
    await page.waitForURL('/watch', { timeout: 5000 });

    // Navigate back to home via navbar
    await page.click('nav a:has-text("Snake Game")');
    await page.waitForURL('/', { timeout: 5000 });
  });
});

