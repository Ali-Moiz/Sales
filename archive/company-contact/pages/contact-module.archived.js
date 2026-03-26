const { credentials } = require('../data/credentials');

class ContactModule {
  constructor(page) {
    this.page = page;
    this.baseUrl = credentials.baseUrl;
    this.appHost = new URL(this.baseUrl).hostname;
  }

  async login() {
    // Block only Auth0-hosted images during login.
    // Do not block application images after auth redirect.
    await this.page.route('**/*', route => {
      const request = route.request();
      const url = request.url();
      const resourceType = request.resourceType();
      const isAuth0Request = /auth0\.com/i.test(url);
      const isImage = resourceType === 'image' || /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
      if (isAuth0Request && isImage) {
        return route.abort();
      }
      return route.continue();
    }).catch(() => {});

    // Navigate to root and continue normal app loading.
    await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle', timeout: 30_000 }).catch(async () => {
      await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
    });

    // Click Login button to reveal the inline login form or trigger Auth0 redirect
    if (!(/auth0\.com|\/app\//.test(this.page.url()))) {
      const loginCandidates = [
        this.page.getByRole('button', { name: /^Login$/i }).first(),
        this.page.getByText('Login', { exact: true }).first()
      ];
      for (const candidate of loginCandidates) {
        await Promise.allSettled([
          this.page.waitForURL(/auth0\.com|\/app\//, { timeout: 7_000 }),
          candidate.click({ force: true })
        ]);
        if (/auth0\.com|\/app\//.test(this.page.url())) break;
      }
    }

    // Handle inline app login form (shown after clicking Login button)
    const appEmail = this.page.getByPlaceholder('Enter your Email');
    const appPassword = this.page.getByPlaceholder('Enter your Password');
    const appLogIn = this.page.getByRole('button', { name: 'Log In' });

    if (
      !/auth0\.com/.test(this.page.url()) &&
      !/\/app\//.test(this.page.url()) &&
      !(await appEmail.isVisible().catch(() => false))
    ) {
      await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }

    if (await appEmail.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await appEmail.fill(credentials.email);
      await appPassword.fill(credentials.password);
      await Promise.allSettled([
        this.page.waitForURL(/auth0\.com|\/app\//, { timeout: 15_000 }),
        appLogIn.click()
      ]);
    }

    // Handle Auth0 login form
    const auth0User = this.page.locator('input[name="username"], input[type="email"]').first();
    const auth0Pass = this.page.locator('input[name="password"], input[type="password"]').first();
    // Use role-based selector so we target the visible "Log In" button specifically
    const auth0Submit = this.page.getByRole('button', { name: /^log in$/i });

    if (/auth0\.com/.test(this.page.url()) || await auth0User.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await auth0User.fill(credentials.email);
      await auth0Pass.fill(credentials.password);
      if (/auth0\.com/.test(this.page.url())) {
        // Try role-based click first; fall back to pressing Enter in the password field
        const clicked = await auth0Submit.click({ timeout: 8_000 }).then(() => true).catch(() => false);
        if (!clicked) {
          await auth0Pass.press('Enter').catch(() => {});
        }
      }
    }

    // Wait for auth0 to redirect back to the app (only meaningful if we're on auth0).
    // The redirect_uri is the site root, so first leave auth0.com, then wait for /app/.
    if (/auth0\.com/.test(this.page.url())) {
      await this.page.waitForURL(
        url => !url.includes('auth0.com'),
        { timeout: 60_000 }
      ).catch(() => {});
    }
    // Now wait for the React app to process the code exchange and land on /app/
    await this.page.waitForURL(/\/app\//, { timeout: 60_000 }).catch(async () => {
      await this.page.goto(`${this.baseUrl}/app/sales/contacts`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
      await this.page.waitForURL(/\/app\//, { timeout: 30_000 }).catch(() => {});
    });

    // Handle profile completion page
    if (/\/app\/settings\/profile/.test(this.page.url())) {
      const lastNameField = this.page.getByRole('textbox', { name: 'Last Name' });
      if (await lastNameField.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const currentVal = await lastNameField.inputValue().catch(() => '');
        if (!currentVal) await lastNameField.fill('User');
      }
      const saveBtn = this.page.getByRole('button', { name: 'Save' });
      if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        await this.page.waitForTimeout(2000);
      }
      await this.page.goto(`${this.baseUrl}/app/sales/contacts`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
      await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    }

    // Remove the temporary Auth0-only route after login is complete.
    await this.page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
  }

  async goToContactsFromMenu() {
    await this.page
      .waitForSelector('li[aria-label="Contacts"], a[href="/app/sales/contacts"]', { timeout: 20_000 })
      .catch(() => {});

    const menuCandidates = [
      this.page.locator('li[aria-label="Contacts"]').first(),
      this.page.locator('a[href="/app/sales/contacts"]').first(),
      this.page.getByRole('link', { name: /contacts/i }).first(),
      this.page.getByRole('button', { name: /contacts/i }).first(),
      this.page.getByText('Contacts', { exact: true }).first()
    ];

    let navigated = false;
    for (const candidate of menuCandidates) {
      await Promise.allSettled([
        this.page.waitForURL(/\/app\/sales\/contacts/, { timeout: 15_000 }),
        candidate.click({ force: true }).catch(() => {})
      ]);

      if (/\/app\/sales\/contacts/.test(this.page.url())) {
        navigated = true;
        break;
      }
    }

    if (!navigated) {
      await this.page.goto(`${this.baseUrl}/app/sales/contacts`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
      await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      if (/\/app\/sales\/contacts/.test(this.page.url())) {
        navigated = true;
      }
    }

    if (!navigated) {
      throw new Error(`Unable to navigate to Contacts from left panel menu. Current URL: ${this.page.url()}`);
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async gotoContactDetail(contactId) {
    await this.page.goto(`${this.baseUrl}/app/sales/contacts/detail/${contactId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoReviews() {
    await this.page.goto(`${this.baseUrl}/app/sales/contacts/reviews`);
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = { ContactModule };
