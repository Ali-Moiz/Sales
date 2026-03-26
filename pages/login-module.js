const { expect } = require('@playwright/test');
const { credentials } = require('../data/credentials');
const {
  enableSliderImageBlocking,
  disableSliderImageBlocking
} = require('../utils/auth/slider-image-blocker');

class LoginModule {
  constructor(page) {
    this.page = page;
    this.baseUrl = credentials.baseUrl;

    // ── Locators ──────────────────────────────────────────────────────────
    this.emailInput          = page.getByPlaceholder('Enter your Email');
    this.passwordInput       = page.getByPlaceholder('Enter your Password');
    this.landingLoginButton  = page.getByRole('button', { name: /^Login$/i }).first();
    this.loginButton         = page.getByRole('button', { name: 'Log In' });
    this.forgotPasswordLink  = page.getByRole('link', { name: 'Forgot Password?' });
    this.microsoftLoginBtn   = page.getByRole('button', { name: 'Login with Microsoft' });
    this.passwordEye         = page.locator('.password-eye');
    this.errorBanner         = page.locator('p.invalid-feedback');
    this.logoutButton        = page.getByRole('button', { name: 'Logout' });
    this.userMenuAvatar      = page.locator('div.jss51').first();
    this.signalLogo          = page.locator('.logo-image');
    this.welcomeHeading      = page.getByRole('heading', { name: 'Welcome!' });
    this.tagline             = page.getByText('Manage your Franchise and Guards better & efficient.');
    this.copyright           = page.getByText('@2026 Signal. All rights reserved.');
    // Dashboard breadcrumb text visible at top-left after successful login
    this.dashboardLink       = page.locator('a[href*="/app/sales/dashboard"], [aria-label*="Dashboard" i]').first();
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  async goto() {
    await enableSliderImageBlocking(this.page);
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });
    const cta = this.page.getByRole('button', { name: 'Login' });
    await cta.waitFor({ state: 'visible', timeout: 20_000 });
    await cta.click();
    await this.emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    // Wait for auth0 scripts (auth0.min.js) to fully initialise before interacting
    await this.page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  }

  async waitForDashboard() {
    await this.page.waitForURL(/\/app\/sales\/dashboard/, { timeout: 60_000 });
    // Wait for the page content to render (Sales Insights heading = dashboard fully loaded)
    await this.page.getByText('Sales Insights', { exact: true }).first().waitFor({ state: 'visible', timeout: 30_000 });
    await disableSliderImageBlocking(this.page);
  }

  // ── Form Actions ─────────────────────────────────────────────────────────
  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickLoginButton() {
    await this.loginButton.click();
  }

  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLoginButton();
  }

  async pressEnterOnPassword() {
    await this.passwordInput.press('Enter');
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async openUserMenu() {
    const candidates = [
      this.userMenuAvatar,
      this.page.getByRole('heading', { name: /user/i }).first(),
      this.page.getByRole('img', { name: /user/i }).first(),
      this.page.getByText(/user/i).first()
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible({ timeout: 3_000 }).catch(() => false);
      if (!visible) continue;
      const clicked = await candidate.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
      if (!clicked) continue;
      const logoutVisible = await this.logoutButton.isVisible({ timeout: 2_000 }).catch(() => false);
      if (logoutVisible) return;
    }

    throw new Error('User menu trigger was not clickable after login.');
  }

  async dismissHeaderOverlayIfPresent() {
    const dismissCandidates = [
      this.page.locator('.MuiBackdrop-root').first(),
      this.page.locator('.jss83 > svg').first()
    ];

    for (const candidate of dismissCandidates) {
      const visible = await candidate.isVisible({ timeout: 1_500 }).catch(() => false);
      if (!visible) continue;
      const clicked = await candidate.click({ force: true, timeout: 3_000 }).then(() => true).catch(() => false);
      if (clicked) break;
    }
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.logoutButton.click();
  }

  async togglePasswordVisibility() {
    await this.passwordEye.click();
    // Small wait for the JS-driven type toggle to apply to the DOM
    await this.page.waitForTimeout(300);
  }

  // ── Assertions / Getters ─────────────────────────────────────────────────
  async getError() {
    // Auth0 calls the API and then populates the error via JS — allow up to 25 s
    await this.errorBanner.waitFor({ state: 'visible', timeout: 25_000 });
    return (await this.errorBanner.textContent()).trim();
  }

  async getPasswordFieldType() {
    return await this.passwordInput.getAttribute('type');
  }

  async assertLoggedOut() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.landingLoginButton).toBeVisible({ timeout: 15_000 });
  }
}

module.exports = { LoginModule };
