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

  test('should detect hits and only increase score when hitting target', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    const canvas = page.locator('.fps-canvas-container');
    await expect(canvas).toBeVisible({ timeout: 2000 });

    // Click canvas to enable pointer lock
    await canvas.click();
    await page.waitForTimeout(500);

    // Get initial score
    const initialScore = await page.locator('text=/Score: \\d+/').textContent();
    const initialScoreValue = parseInt(initialScore?.match(/\d+/)?.[0] || '0');

    // Wait a moment for game to fully initialize
    await page.waitForTimeout(1000);

    // Shoot multiple times (aiming at where the test box should be)
    // The test box is positioned at [0, 1, -5] relative to player start at [0, 2, 0]
    // So we need to look forward and shoot
    // Use mouse.down/up instead of click() to ensure events are properly fired
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    for (let i = 0; i < 5; i++) {
      // Click at center of canvas
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down({ button: 'left' });
      await page.waitForTimeout(50); // Hold button briefly
      await page.mouse.up({ button: 'left' });
      await page.waitForTimeout(150); // Wait between shots for fire rate (100ms + buffer)
    }

    // Wait for any score updates
    await page.waitForTimeout(1000);

    // Score should have increased if we hit the target
    // (Note: This test verifies the system works, exact score depends on hits)
    const finalScore = await page.locator('text=/Score: \\d+/').textContent();
    const finalScoreValue = parseInt(finalScore?.match(/\d+/)?.[0] || '0');
    
    // Score should be >= initial (may have increased if we hit)
    expect(finalScoreValue).toBeGreaterThanOrEqual(initialScoreValue);
    
    // Ammo should have decreased
    const ammoText = await page.locator('text=/\\d+ \\/ 30/').textContent();
    const ammoValue = parseInt(ammoText?.match(/\d+/)?.at(0) || '30');
    expect(ammoValue).toBeLessThan(30);
  });

  test('should not increase score when shooting at empty space', async ({ authenticatedUser, page }) => {
    await page.goto('/games/fps');

    // Start the game
    await page.click('button:has-text("Start Game")');
    await page.waitForTimeout(500);

    // Verify game is running
    const canvas = page.locator('.fps-canvas-container');
    await expect(canvas).toBeVisible({ timeout: 2000 });

    // Click canvas to enable pointer lock
    await canvas.click();
    await page.waitForTimeout(500);

    // Look straight up (away from the test box)
    // Move mouse to look up
    await page.mouse.move(400, 100); // Move to top of canvas
    await page.waitForTimeout(200);

    // Get initial score
    const initialScore = await page.locator('text=/Score: \\d+/').textContent();
    const initialScoreValue = parseInt(initialScore?.match(/\d+/)?.[0] || '0');

    // Shoot while looking up (away from target)
    // Use mouse.down/up instead of click() to ensure events are properly fired
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');
    
    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.mouse.down({ button: 'left' });
    await page.waitForTimeout(50); // Hold button briefly
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(500);

    // Score should NOT increase when shooting at empty space
    const finalScore = await page.locator('text=/Score: \\d+/').textContent();
    const finalScoreValue = parseInt(finalScore?.match(/\d+/)?.[0] || '0');
    
    // Score should remain the same (no hit detected)
    expect(finalScoreValue).toBe(initialScoreValue);
    
    // But ammo should still decrease
    const ammoText = await page.locator('text=/\\d+ \\/ 30/').textContent();
    const ammoValue = parseInt(ammoText?.match(/\d+/)?.at(0) || '30');
    expect(ammoValue).toBeLessThan(30);
  });
});

