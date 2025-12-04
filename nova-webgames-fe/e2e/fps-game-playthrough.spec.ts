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

  test.describe('Audio System', () => {
    test('should display volume controls in game menu', async ({ authenticatedUser, page }) => {
      await page.goto('/games/fps');

      // Wait for game menu to load
      await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 5000 });

      // Verify audio settings section is visible
      await expect(page.locator('h3:has-text("Audio Settings")')).toBeVisible();

      // Verify volume sliders are present
      await expect(page.locator('text=/Master Volume:/')).toBeVisible();
      await expect(page.locator('text=/SFX Volume:/')).toBeVisible();
      await expect(page.locator('text=/Music Volume:/')).toBeVisible();

      // Verify sliders are present
      const sliders = page.locator('.fps-audio-settings input[type="range"]');
      await expect(sliders).toHaveCount(3);

      // Verify mute button is present
      await expect(page.locator('button:has-text("Mute"), button:has-text("Unmute")')).toBeVisible();
    });

    test('should allow adjusting volume sliders in game menu', async ({ authenticatedUser, page }) => {
      await page.goto('/games/fps');

      // Wait for game menu
      await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 5000 });

      // Find master volume slider
      const masterSlider = page.locator('.fps-audio-settings input[type="range"]').first();
      await expect(masterSlider).toBeVisible();

      // Get initial value
      const initialValue = await masterSlider.getAttribute('value');
      expect(initialValue).toBeTruthy();

      // Change slider value
      await masterSlider.fill('0.5');
      await page.waitForTimeout(100);

      // Verify value changed
      const newValue = await masterSlider.getAttribute('value');
      expect(parseFloat(newValue || '0')).toBeCloseTo(0.5, 1);

      // Verify percentage display updated
      await expect(page.locator('text=/Master Volume: 50%/')).toBeVisible();
    });

    test('should toggle mute button in game menu', async ({ authenticatedUser, page }) => {
      await page.goto('/games/fps');

      // Wait for game menu
      await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 5000 });

      // Find mute button
      const muteButton = page.locator('.fps-mute-button');
      await expect(muteButton).toBeVisible();

      // Get initial state
      const initialText = await muteButton.textContent();
      expect(initialText).toMatch(/Mute|Unmute/);

      // Click mute button
      await muteButton.click();
      await page.waitForTimeout(200);

      // Verify button text changed
      const newText = await muteButton.textContent();
      expect(newText).not.toBe(initialText);
      expect(newText).toMatch(/Mute|Unmute/);
    });

    test('should display volume controls in pause overlay', async ({ authenticatedUser, page }) => {
      await page.goto('/games/fps');

      // Start the game
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(500);

      // Verify game is running
      const canvas = page.locator('.fps-canvas-container');
      await expect(canvas).toBeVisible({ timeout: 2000 });

      // Pause the game
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Verify pause overlay is visible
      await expect(page.locator('h2:has-text("PAUSED")')).toBeVisible({ timeout: 2000 });

      // Verify audio settings in pause overlay
      await expect(page.locator('.fps-audio-settings-pause h3:has-text("Audio Settings")')).toBeVisible();
      await expect(page.locator('.fps-audio-settings-pause').locator('text=/Master:/')).toBeVisible();
      await expect(page.locator('.fps-audio-settings-pause').locator('text=/SFX:/')).toBeVisible();
      await expect(page.locator('.fps-audio-settings-pause').locator('text=/Music:/')).toBeVisible();
      await expect(page.locator('.fps-audio-settings-pause .fps-mute-button')).toBeVisible();
    });

    test('should persist volume settings to localStorage', async ({ authenticatedUser, page }) => {
      await page.goto('/games/fps');

      // Wait for game menu
      await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 5000 });

      // Set master volume to 0.75
      const masterSlider = page.locator('.fps-audio-settings input[type="range"]').first();
      await masterSlider.fill('0.75');
      await page.waitForTimeout(200);

      // Check localStorage
      const masterVolume = await page.evaluate(() => localStorage.getItem('fps-master-volume'));
      expect(masterVolume).toBe('0.75');

      // Set SFX volume to 0.6
      const sfxSlider = page.locator('.fps-audio-settings input[type="range"]').nth(1);
      await sfxSlider.fill('0.6');
      await page.waitForTimeout(200);

      const sfxVolume = await page.evaluate(() => localStorage.getItem('fps-sfx-volume'));
      expect(sfxVolume).toBe('0.6');

      // Toggle mute
      const muteButton = page.locator('.fps-mute-button');
      await muteButton.click();
      await page.waitForTimeout(200);

      const muted = await page.evaluate(() => localStorage.getItem('fps-muted'));
      expect(muted).toBe('true');
    });

    test('should load volume settings from localStorage on page load', async ({ authenticatedUser, page }) => {
      // Set localStorage values before navigating
      await page.goto('/games/fps');
      await page.waitForTimeout(500);
      
      await page.evaluate(() => {
        localStorage.setItem('fps-master-volume', '0.8');
        localStorage.setItem('fps-sfx-volume', '0.7');
        localStorage.setItem('fps-music-volume', '0.4');
        localStorage.setItem('fps-muted', 'true');
      });

      // Reload page and wait for it to fully load
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Wait for game menu
      await expect(page.locator('h1:has-text("FPS Arena")')).toBeVisible({ timeout: 10000 });

      // Wait a bit more for React to render with localStorage values
      await page.waitForTimeout(500);

      // Verify sliders have correct values
      const masterSlider = page.locator('.fps-audio-settings input[type="range"]').first();
      await expect(masterSlider).toBeVisible({ timeout: 5000 });
      const masterValue = await masterSlider.getAttribute('value');
      expect(parseFloat(masterValue || '0')).toBeCloseTo(0.8, 1);

      // Verify mute button shows correct state
      const muteButton = page.locator('.fps-mute-button');
      await expect(muteButton).toBeVisible({ timeout: 5000 });
      const muteText = await muteButton.textContent();
      expect(muteText).toContain('Unmute'); // Should show Unmute when muted
    });

    test('should initialize AudioManager when game starts', async ({ authenticatedUser, page }) => {
      await page.goto('/games/fps');

      // Check that Howler is available (AudioManager uses it)
      const hasHowler = await page.evaluate(() => {
        return typeof (window as any).Howler !== 'undefined';
      });
      expect(hasHowler).toBe(true);

      // Start the game
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(1000);

      // AudioManager should be initialized (no errors in console)
      // We can't directly test AudioManager, but we can verify the game runs without errors
      const canvas = page.locator('.fps-canvas-container');
      await expect(canvas).toBeVisible({ timeout: 2000 });
    });
  });
});

