const { test: setup, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const { performLogin } = require('../../utils/auth/login-action');

const authFile = 'playwright/.auth/user.json';
setup.setTimeout(180_000);

setup('authenticate', async ({ page }) => {
  mkdirSync('playwright/.auth', { recursive: true });
  await performLogin(page);
  await expect(page).toHaveURL(/\/app\/sales\//);
  await page.context().storageState({ path: authFile });
});
