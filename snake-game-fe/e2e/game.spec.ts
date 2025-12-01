import { test, expect } from './fixtures';

test.describe('Game Flow', () => {
  test('should navigate to game page when authenticated', async ({ authenticatedUser, page }) => {
    await page.goto('/');

    // Click Play Game button
    await page.click('a:has-text("Play Game")');

    // Should be on game page
    await page.waitForURL('/game', { timeout: 5000 });
    await expect(page.locator('h2:has-text("Snake Game")')).toBeVisible();
  });

  test('should start and pause game', async ({ authenticatedUser, page }) => {
    await page.goto('/game');

    // Start the game
    await page.click('button:has-text("Start Game")');
    
    // Wait for game to start
    await page.waitForTimeout(500);
    
    // Game should be running (pause button should be visible)
    const pauseButton = page.locator('button.pause-button:has-text("Pause")');
    await expect(pauseButton).toBeVisible({ timeout: 2000 });

    // Pause the game
    await page.click('button.pause-button:has-text("Pause")');
    
    // Paused overlay should appear with Resume button
    await expect(page.locator('.game-overlay h3:has-text("Paused")')).toBeVisible();
    await expect(page.locator('button:has-text("Resume")')).toBeVisible();
  });

  test('should change game mode', async ({ authenticatedUser, page }) => {
    await page.goto('/game');

    // Check default mode (pass-through) - radio button should be checked
    const passThroughRadio = page.locator('input[type="radio"][value="pass-through"]');
    await expect(passThroughRadio).toBeChecked();

    // Switch to Walls mode
    await page.click('input[type="radio"][value="walls"]');
    const wallsRadio = page.locator('input[type="radio"][value="walls"]');
    await expect(wallsRadio).toBeChecked();

    // Switch back to Pass-through
    await page.click('input[type="radio"][value="pass-through"]');
    await expect(passThroughRadio).toBeChecked();
  });

  test('should display game board', async ({ authenticatedUser, page }) => {
    await page.goto('/game');

    // Game board should be visible
    const gameBoard = page.locator('.game-board');
    await expect(gameBoard).toBeVisible();

    // Game board should have proper dimensions
    const boardBox = await gameBoard.boundingBox();
    expect(boardBox).not.toBeNull();
    expect(boardBox!.width).toBeGreaterThan(0);
    expect(boardBox!.height).toBeGreaterThan(0);
  });

  test('should handle keyboard controls', async ({ authenticatedUser, page }) => {
    await page.goto('/game');

    // Start the game
    await page.click('button:has-text("Start Game")');
    
    // Wait for game to start
    await page.waitForTimeout(500);

    // Press arrow keys to control snake
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowUp');

    // Game should still be running
    await expect(page.locator('button.pause-button')).toBeVisible();
  });
});

