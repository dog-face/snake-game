import { test, expect } from './fixtures';

test.describe('Full User Flow', () => {
  test('complete flow: signup -> play game -> submit score -> view leaderboard', async ({ page }) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const username = `u${timestamp}${random}`.slice(0, 20); // Max 20 chars
    const email = `flow_${timestamp}_${random}@example.com`;
    const password = 'TestPassword123!';

    // Step 1: Sign up
    await page.goto('/signup');
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator(`text=${username}`).first()).toBeVisible();

    // Step 2: Navigate to game (click on Snake game card)
    await page.click('a:has-text("Play Now")');
    await page.waitForURL(/\/games\/snake|\/game/, { timeout: 10000 });

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
    await page.waitForURL('/leaderboard', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Leaderboard")')).toBeVisible();

    // Step 6: Navigate to watch
    await page.click('a:has-text("Watch")');
    await page.waitForURL('/watch', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Watch Players")')).toBeVisible();

    // Step 7: Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login', { timeout: 10000 });
  });

  test('navigation flow: test all main routes', async ({ authenticatedUser, page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('h1:has-text("Welcome to Nova WebGames!")')).toBeVisible();

    // Navigate to game (click on Snake game card)
    await page.click('a:has-text("Play Now")');
    await page.waitForURL(/\/games\/snake|\/game/, { timeout: 10000 });
    await expect(page.locator('h2:has-text("Snake Game")')).toBeVisible();

    // Navigate to leaderboard via navbar
    await page.click('nav a:has-text("Leaderboard")');
    await page.waitForURL('/leaderboard', { timeout: 10000 });

    // Navigate to watch via navbar
    await page.click('nav a:has-text("Watch")');
    await page.waitForURL('/watch', { timeout: 10000 });

    // Navigate back to home via navbar brand
    await page.click('nav a.navbar-brand');
    await page.waitForURL('/', { timeout: 10000 });
  });
});

