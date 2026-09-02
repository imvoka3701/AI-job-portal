import { test, expect } from '@playwright/test';

test.describe('Admin AI Logs Page', () => {
  // Use admin auth state for all tests in this describe block
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test('smoke test - should load the ai logs page and display main elements', async ({ page }) => {
    // Intercept API calls to prevent failing if backend is not running
    await page.route('**/api/admin/ai/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_calls_today: 150,
          total_calls_week: 1000,
          total_cost_today_usd: 5.5,
          total_cost_month_usd: 120.0,
          total_cost_week_usd: 30.0,
          error_rate_pct: 2.5,
          by_feature: [
            { feature: 'cv_evaluate', total_calls: 100, success_calls: 95, failed_calls: 5, total_cost_usd: 2.5 }
          ]
        })
      });
    });

    await page.route('**/api/admin/ai/logs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [],
          total: 0,
          page: 1,
          page_size: 15,
          total_pages: 0
        })
      });
    });

    // Go to the AI logs page
    await page.goto('/admin/ai/logs');

    // Check if main heading is visible
    await expect(page.locator('h1', { hasText: 'AI Call Logs' })).toBeVisible();

    // Check if KPIs are visible
    await expect(page.locator('text=Calls hôm nay')).toBeVisible();
    await expect(page.locator('text=Chi phí hôm nay')).toBeVisible();
    await expect(page.locator('text=Tỉ lệ lỗi')).toBeVisible();

    // Check if filters exist
    await expect(page.locator('#filter-feature')).toBeVisible();
    await expect(page.locator('#filter-status')).toBeVisible();

    // The empty state should be visible since we mocked 0 items
    await expect(page.locator('text=Chưa có log nào')).toBeVisible();
  });
});
