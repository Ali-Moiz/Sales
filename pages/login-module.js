const { TIMEOUTS } = require('../utils/playwright-timeouts');
const { expect } = require("@playwright/test");
const { env } = require("../utils/env");
const {
  enableSliderImageBlocking,
  disableSliderImageBlocking,
} = require("../utils/auth/slider-image-blocker");

const LOGIN_LAUNCH_ATTEMPTS = 2;

class LoginModule {
  constructor(page) {
    this.page = page;
    this.baseUrl = env.baseUrl;

    // ── Locators ──────────────────────────────────────────────────────────
    this.emailInput = page.getByPlaceholder("Enter your Email");
    this.passwordInput = page.getByPlaceholder("Enter your Password");
    this.landingLoginButton = page
      .getByRole("button", { name: /^Login$/i })
      .first();
    this.loginButton = page.getByRole("button", { name: "Log In" });
    this.forgotPasswordLink = page.getByRole("link", {
      name: "Forgot Password?",
    });
    this.microsoftLoginBtn = page.getByRole("button", {
      name: "Login with Microsoft",
    });
    this.passwordEye = page.locator(".password-eye");
    this.errorBanner = page.locator("p.invalid-feedback");
    this.logoutButton = page.getByRole("button", { name: "Logout" });
    this.userMenuAvatar = page.locator("div.jss51").first();
    this.signalLogo = page.locator(".logo-image");
    this.welcomeHeading = page.getByRole("heading", { name: "Welcome!" });
    this.tagline = page.getByText(
      "Manage your Franchise and Guards better & efficient.",
    );
    this.copyright = page.getByText("@2026 Signal. All rights reserved.");
    // Dashboard breadcrumb text visible at top-left after successful login
    this.dashboardLink = page
      .locator('a[href*="/app/sales/dashboard"], [aria-label*="Dashboard" i]')
      .first();
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  async goto() {
    await enableSliderImageBlocking(this.page);

    for (let attempt = 0; attempt < LOGIN_LAUNCH_ATTEMPTS; attempt++) {
      await this.page.goto(this.baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUTS.BASE * 120,
      });

      const formAlreadyVisible = await this.emailInput
        .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 8 })
        .then(() => true)
        .catch(() => false);
      if (formAlreadyVisible) break;

      const cta = this.page.getByRole("button", { name: "Login" });
      const ctaVisible = await cta
        .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 40 })
        .then(() => true)
        .catch(() => false);

      if (ctaVisible) {
        await cta.click();
        const formReady = await Promise.race([
          this.emailInput
            .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 60 })
            .then(() => true)
            .catch(() => false),
          this.page
            .waitForURL((url) => url.href.includes("loginError"), {
              timeout: TIMEOUTS.BASE * 60,
              waitUntil: "commit",
            })
            .then(() => false)
            .catch(() => false),
        ]);
        if (formReady) break;
      }

      if (!this.page.url().includes("loginError") || attempt === LOGIN_LAUNCH_ATTEMPTS - 1) {
        break;
      }

      await this.page.context().clearCookies();
      await this.page
        .evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        })
        .catch(() => {});
    }

    await expect(this.emailInput).toBeVisible({ timeout: TIMEOUTS.BASE * 60 });
    // Wait for auth0 scripts (auth0.min.js) to fully initialise before interacting
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.BASE * 60 })
      .catch(() => {});
  }

  async waitForDashboard() {
    const dashboardUrl = `${this.baseUrl}/app/sales/dashboard`;
    const dashboardPath = /\/app\/sales\/dashboard/;
    const dashboardHeading = this.page
      .getByText("Sales Insights", { exact: true })
      .first();

    await this.waitForLoginResult();

    if (!dashboardPath.test(this.page.url())) {
      await this.page.goto(dashboardUrl, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUTS.BASE * 60,
      });
    }

    await expect(this.page).toHaveURL(dashboardPath, {
      timeout: TIMEOUTS.BASE * 60,
    });
    await expect(dashboardHeading).toBeVisible({
      timeout: TIMEOUTS.BASE * 60,
    });
    await disableSliderImageBlocking(this.page);
  }

  async waitForLoginResult() {
    await this._waitForAuthResult();

    if (this.page.url().includes("loginError")) {
      return this.page.url();
    }

    if (new URL(this.page.url()).searchParams.has("code")) {
      await this.page
        .waitForURL((url) => !url.searchParams.has("code"), {
          timeout: TIMEOUTS.BASE * 40,
          waitUntil: "commit",
        })
        .catch(() => {});
    }

    if (!/\/app\//.test(this.page.url())) {
      await this._enterAppFromLandingSession();
    }

    return this.page.url();
  }

  _isAuthResultUrl(value) {
    const url = typeof value === "string" ? new URL(value) : value;
    return (
      url.pathname.startsWith("/app/") ||
      url.searchParams.has("code") ||
      url.href.includes("loginError")
    );
  }

  async _waitForAuthResult() {
    await expect
      .poll(async () => this._isAuthResultUrl(this.page.url()), {
        timeout: TIMEOUTS.BASE * 120,
      })
      .toBe(true);
  }

  async _enterAppFromLandingSession() {
    const appPath = /\/app\//;
    if (appPath.test(this.page.url())) return;

    const ctaVisible = await this.landingLoginButton
      .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 })
      .then(() => true)
      .catch(() => false);
    if (!ctaVisible) return;
    if (appPath.test(this.page.url())) return;

    const clickResult = (async () => {
      await this.landingLoginButton.click();
      await this._waitForAuthResult();
    })().catch((error) => {
      if (appPath.test(this.page.url())) return;
      throw error;
    });

    const redirectResult = this.page
      .waitForURL((url) => appPath.test(url.pathname), {
        timeout: TIMEOUTS.BASE * 40,
        waitUntil: "commit",
      })
      .then(() => true)
      .catch(() => clickResult);

    await Promise.race([redirectResult, clickResult]);

    if (new URL(this.page.url()).searchParams.has("code")) {
      await this.page
        .waitForURL((url) => !url.searchParams.has("code"), {
          timeout: TIMEOUTS.BASE * 40,
          waitUntil: "commit",
        })
        .catch(() => {});
    }
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
    await this.passwordInput.press("Enter");
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  // TODO: deprecated — jss51 and /user/i selectors are stale, use openUserMenuV2
  async openUserMenu() {
    const candidates = [
      this.userMenuAvatar,
      this.page.getByRole("heading", { name: /user/i }).first(),
      this.page.getByRole("img", { name: /user/i }).first(),
      this.page.getByText(/user/i).first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate
        .isVisible({ timeout: TIMEOUTS.BASE * 6 })
        .catch(() => false);
      if (!visible) continue;
      const clicked = await candidate
        .click({ force: true, timeout: TIMEOUTS.BASE * 10 })
        .then(() => true)
        .catch(() => false);
      if (!clicked) continue;
      const logoutVisible = await this.logoutButton
        .isVisible({ timeout: TIMEOUTS.BASE * 4 })
        .catch(() => false);
      if (logoutVisible) return;
    }

    throw new Error("User menu trigger was not clickable after login.");
  }

  async dismissHeaderOverlayIfPresent() {
    const dismissCandidates = [
      this.page.locator(".MuiBackdrop-root").first(),
      this.page.locator(".jss83 > svg").first(),
    ];

    for (const candidate of dismissCandidates) {
      const visible = await candidate
        .isVisible({ timeout: TIMEOUTS.BASE * 3 })
        .catch(() => false);
      if (!visible) continue;
      const clicked = await candidate
        .click({ force: true, timeout: TIMEOUTS.BASE * 6 })
        .then(() => true)
        .catch(() => false);
      if (clicked) break;
    }
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });
    await this.logoutButton.click();
  }

  // Verified via MCP DOM snapshot 2026-05-04 — username heading (level 6) inside banner
  async openUserMenuV2() {
    const banner = this.page.getByRole("banner");
    const userHeading = banner.getByRole("heading", { level: 6 }).first();
    await userHeading.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });
    await userHeading.click();
    await this.logoutButton.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 10 });
  }

  async logoutV2() {
    await this.openUserMenuV2();
    await this.logoutButton.click();
  }

  async togglePasswordVisibility() {
    const currentType = await this.passwordInput.getAttribute("type");
    const expectedType = currentType === "password" ? "text" : "password";
    await this.passwordEye.click();
    await expect(this.passwordInput).toHaveAttribute("type", expectedType, {
      timeout: TIMEOUTS.BASE * 4,
    });
  }

  // ── Assertions / Getters ─────────────────────────────────────────────────
  async getError() {
    // Auth0 calls the API and then populates the error via JS — allow up to 25 s
    const bannerVisible = await this.errorBanner
      .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 50 })
      .then(() => true)
      .catch(() => false);
    if (bannerVisible) return (await this.errorBanner.textContent()).trim();

    return this.page
      .locator("input:invalid")
      .first()
      .evaluate((input) => input.validationMessage)
      .then((message) => message.trim())
      .catch(() => "");
  }

  async getPasswordFieldType() {
    return await this.passwordInput.getAttribute("type");
  }

  async assertLoginFormVisible() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    await expect(this.emailInput).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    await expect(this.passwordInput).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    await expect(this.loginButton).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
  }

  async assertLoggedOut() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });

    const landingCtaVisible = await this.landingLoginButton
      .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 8 })
      .then(() => true)
      .catch(() => false);
    if (landingCtaVisible) return;

    await expect(this.emailInput).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    await expect(this.passwordInput).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    await expect(this.loginButton).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
  }
}

module.exports = { LoginModule };
