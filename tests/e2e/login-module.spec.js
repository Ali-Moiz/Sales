const { test, expect } = require('@playwright/test');
const { LoginModule } = require('../../pages/login-module');
const { env } = require('../../utils/env');
const { performLogin } = require('../../utils/auth/login-action');

const VALID_EMAIL   = env.email;
const VALID_PASS    = env.password;
const WRONG_PASS    = 'WrongPass@9999';
const UNKNOWN_EMAIL = 'ghost.xyz@notexist.com';

test.describe('Login Module — Signal App', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginModule(page);
    await loginPage.goto();
  });

  // TC-001 | UI Elements Present
  test('TC-001 | Login page renders all required UI elements', async () => {
    await expect(loginPage.signalLogo).toBeVisible();
    await expect(loginPage.welcomeHeading).toBeVisible();
    await expect(loginPage.tagline).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.microsoftLoginBtn).toBeVisible();
    await expect(loginPage.copyright).toBeVisible();
  });

  // TC-002 | Successful Login
  test('TC-002 | Valid credentials navigate to dashboard', async ({ page }) => {
    test.setTimeout(180_000);
    await loginPage.login(VALID_EMAIL, VALID_PASS);
    await loginPage.waitForDashboard();
    await expect(page).toHaveURL(/app\/sales\/dashboard/);
    await expect(page.getByText('Sales Insights', { exact: true }).first()).toBeVisible();
  });

  // TC-003 | Empty Form Submit
  test('TC-003 | Empty form submission shows required fields error', async ({ page }) => {
    await loginPage.clickLoginButton();
    expect(await loginPage.getError()).toBe('Both email and password are required fields');
    await expect(loginPage.emailInput).toHaveClass(/error-field/);
    await expect(page).not.toHaveURL(/app\/sales\/dashboard/);
  });

  // TC-004 | Email Only (No Password)
  test('TC-004 | Email only with empty password shows server error', async ({ page }) => {
    await loginPage.fillEmail(VALID_EMAIL);
    await loginPage.clickLoginButton();
    expect(await loginPage.getError()).toBe('Wrong email or password');
    await expect(page).not.toHaveURL(/app\/sales\/dashboard/);
  });

  // TC-005 | Wrong Password
  test('TC-005 | Wrong password shows invalid credentials error', async ({ page }) => {
    await loginPage.login(VALID_EMAIL, WRONG_PASS);
    expect(await loginPage.getError()).toBe('Wrong email or password');
    await expect(loginPage.emailInput).toHaveValue(VALID_EMAIL);
    await expect(page).not.toHaveURL(/app\/sales\/dashboard/);
  });

  // TC-006 | Non-existent Email
  test('TC-006 | Non-existent email shows invalid credentials error', async () => {
    await loginPage.login(UNKNOWN_EMAIL, VALID_PASS);
    expect(await loginPage.getError()).toBe('Wrong email or password');
  });

  // TC-007 | Malformed Email Format
  test('TC-007 | Malformed email blocked by HTML5 validation', async () => {
    await loginPage.fillEmail('notanemail');
    await loginPage.fillPassword(VALID_PASS);
    await loginPage.clickLoginButton();
    const isValid = await loginPage.emailInput.evaluate(el => el.validity.valid);
    expect(isValid).toBe(false);
    await expect(loginPage.errorBanner).not.toBeVisible();
  });

  // TC-008 | Show Password Toggle
  test('TC-008 | Eye icon reveals password (type changes to text)', async () => {
    await loginPage.fillPassword('Admin@123');
    expect(await loginPage.getPasswordFieldType()).toBe('password');
    await loginPage.togglePasswordVisibility();
    expect(await loginPage.getPasswordFieldType()).toBe('text');
    await expect(loginPage.passwordInput).toHaveValue('Admin@123');
  });

  // TC-009 | Hide Password Toggle
  test('TC-009 | Eye icon hides password on second click (type back to password)', async () => {
    await loginPage.fillPassword('Admin@123');
    await loginPage.togglePasswordVisibility(); // show
    expect(await loginPage.getPasswordFieldType()).toBe('text');
    await loginPage.togglePasswordVisibility(); // hide
    expect(await loginPage.getPasswordFieldType()).toBe('password');
  });

  // TC-010 | Enter Key Submits Form
  test('TC-010 | Pressing Enter on password field submits the form', async ({ page }) => {
    await loginPage.fillEmail(VALID_EMAIL);
    await loginPage.fillPassword(VALID_PASS);
    await loginPage.pressEnterOnPassword();
    await loginPage.waitForDashboard();
    await expect(page).toHaveURL(/app\/sales\/dashboard/);
  });

  // TC-011 | Forgot Password Link
  test('TC-011 | Forgot Password link navigates to forgot-password page', async ({ page }) => {
    await expect(loginPage.forgotPasswordLink).toHaveAttribute('href', /forgot-password/);
    await Promise.all([
      page.waitForURL(/forgot-password/, { timeout: 15_000 }),
      loginPage.clickForgotPassword(),
    ]);
    expect(page.url()).toContain('forgot-password');
  });

  // TC-012 | Error Clears on Successful Retry
  test('TC-012 | Error clears when correct credentials entered after failed attempt', async ({ page }) => {
    await loginPage.login(VALID_EMAIL, WRONG_PASS);
    await expect(loginPage.errorBanner).toBeVisible();
    await loginPage.fillPassword(VALID_PASS);
    await loginPage.clickLoginButton();
    await loginPage.waitForDashboard();
    await expect(page).toHaveURL(/app\/sales\/dashboard/);
  });

  // TC-013 | Microsoft Login Button Enabled
  test('TC-013 | Login with Microsoft button is visible and enabled', async () => {
    await expect(loginPage.microsoftLoginBtn).toBeVisible();
    await expect(loginPage.microsoftLoginBtn).toBeEnabled();
  });

  // TC-014 | Successful Logout
  test('TC-014 | User can log out and is redirected to the login page', async ({ page }) => {
    test.setTimeout(180_000);
    await performLogin(page);
    await page.goto(`${env.baseUrl}/app/sales/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await loginPage.logout();
    await loginPage.assertLoggedOut();
  });
});
