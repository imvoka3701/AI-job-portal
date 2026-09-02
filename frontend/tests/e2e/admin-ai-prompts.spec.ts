import { test, expect } from '@playwright/test';

test.describe('Admin AI Prompts Page', () => {
  // Use admin auth state for all tests in this describe block
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test('smoke test - should load the ai prompts page and display main elements', async ({ page }) => {
    // Intercept API calls
    await page.route('**/api/admin/ai/prompts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'prompt-1',
            feature: 'cv_evaluate',
            version: 'v1.0',
            content: 'Evaluate this CV',
            is_active: true,
            model: 'gpt-4',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z'
          }
        ])
      });
    });

    // Go to the AI prompts page
    await page.goto('/admin/ai/prompts');

    // Check if main heading is visible
    await expect(page.locator('h1', { hasText: 'Quản lý Prompt AI' })).toBeVisible();

    // Check if prompt list is visible
    await expect(page.locator('text=Đánh giá CV')).toBeVisible();
    await expect(page.locator('text=v1.0')).toBeVisible();
    await expect(page.locator('text=gpt-4')).toBeVisible();
  });
});
