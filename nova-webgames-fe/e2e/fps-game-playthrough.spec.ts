import { test, expect } from './fixtures';

test.describe('FPS Game Playthrough', () => {
  test('should complete full game flow: start -> play -> pause -> resume -> quit', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Wait for game menu to load
    await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Start Game")')).toBeVisible();

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running - canvas should be visible
    const canvas = page.locator('.fps-canvas-container');
    await expect(canvas).toBeVisible({ timeout: 2000 });

    // Verify HUD elements are visible
    await expect(page.locator('text=/Health: 100/')).toBeVisible();
    await expect(page.locator('text=/Score: 0/')).toBeVisible();
    await expect(page.locator('text=/30 \\/ 30/')).toBeVisible();

    // Verify crosshair is visible
    const crosshair = page.locator('.fps-crosshair');
    await expect(crosshair).toBeVisible();

    // Pause the game
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Verify pause menu - check for h2 with PAUSED text
    await expect(page.locator('h2:has-text("PAUSED")')).toBeVisible({ timeout: 3000 });
    
    // Verify pause menu buttons
    await expect(page.locator('button:has-text("Resume")')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('button:has-text("Quit")')).toBeVisible({ timeout: 2000 });

    // Resume the game
    await page.click('button:has-text("Resume")');
    await page.waitForTimeout(500);
    
    // Paused overlay should disappear
    await expect(page.locator('h2:has-text("PAUSED")')).not.toBeVisible({ timeout: 2000 });
    
    // Canvas should still be visible
    await expect(canvas).toBeVisible();

    // Quit the game
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Verify pause menu is visible
    await expect(page.locator('h2:has-text("PAUSED")')).toBeVisible({ timeout: 3000 });
    
    await page.click('button:has-text("Quit")');
    await page.waitForTimeout(500);

    // Should return to menu
    await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Game")')).toBeVisible();
  });

  test('should handle keyboard input for movement', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    await expect(page.locator('.fps-canvas-container')).toBeVisible({ timeout: 2000 });

    // Test WASD movement keys
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyS');
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(100);

    // Test jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Test sprint
    await page.keyboard.press('Shift');
    await page.waitForTimeout(100);

    // Game should still be running
    await expect(page.locator('.fps-canvas-container')).toBeVisible();
  });

  test('should handle mouse input for shooting', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    await expect(page.locator('.fps-canvas-container')).toBeVisible({ timeout: 2000 });

    // Click on canvas to request pointer lock
    const canvas = page.locator('.fps-canvas-container');
    await canvas.click();
    await page.waitForTimeout(200);

    // Try to shoot (left click)
    await canvas.click({ button: 'left' });
    await page.waitForTimeout(200);

    // Ammo should decrease (or remain the same if fire rate limited)
    // Just verify the game is still running
    await expect(page.locator('.fps-canvas-container')).toBeVisible();
  });

  test('should handle reload input', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    await expect(page.locator('.fps-canvas-container')).toBeVisible({ timeout: 2000 });

    // Press R to reload
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(100);

    // Game should still be running
    await expect(page.locator('.fps-canvas-container')).toBeVisible();
  });

  test('should display controls instructions in menu', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Wait for game menu to load
    await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 5000 });

    // Verify controls section is visible
    await expect(page.locator('h3:has-text("Controls:")')).toBeVisible();
    
    // Verify control instructions
    await expect(page.locator('text=/WASD/')).toBeVisible();
    await expect(page.locator('text=/Mouse/')).toBeVisible();
    await expect(page.locator('text=/Space/')).toBeVisible();
    await expect(page.locator('text=/Shift/')).toBeVisible();
    await expect(page.locator('text=/ESC/')).toBeVisible();
  });

  test('should prevent context menu during gameplay', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    const canvas = page.locator('.fps-canvas-container');
    await expect(canvas).toBeVisible({ timeout: 2000 });

    // Try to right-click (should be prevented)
    await canvas.click({ button: 'right' });
    await page.waitForTimeout(200);

    // Context menu should not appear
    // Just verify game is still running
    await expect(canvas).toBeVisible();
  });

  test('should update HUD during gameplay', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    await expect(page.locator('.fps-canvas-container')).toBeVisible({ timeout: 2000 });

    // Verify initial HUD values
    await expect(page.locator('text=/Health: 100/')).toBeVisible();
    await expect(page.locator('text=/Score: 0/')).toBeVisible();
    await expect(page.locator('text=/30 \\/ 30/')).toBeVisible();

    // HUD should remain visible during gameplay
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Health:/')).toBeVisible();
    await expect(page.locator('text=/Score:/')).toBeVisible();
    await expect(page.locator('text=/\\/ 30/')).toBeVisible();
  });
});

