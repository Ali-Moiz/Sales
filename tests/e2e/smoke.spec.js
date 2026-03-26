const { test, expect } = require('../../fixtures/test-fixtures');

test.describe('Smoke Suite', () => {
  test('should load signal login page', async ({ homePage, page }) => {
    await homePage.goto();
    await expect(page).toHaveTitle(/Signal/i);
    await expect(page.getByText('Login', { exact: true }).first()).toBeVisible();
  });
});
