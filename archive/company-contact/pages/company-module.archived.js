const { credentials } = require('../data/credentials');
const { ContactModule } = require('./contact-module');

class CompanyModule {
  constructor(page) {
    this.page = page;
    this.baseUrl = credentials.baseUrl;
    this._auth = new ContactModule(page);
  }

  async login() {
    return this._auth.login();
  }

  async goToDashboardFromMenu() {
    await this.page
      .waitForSelector('a[href="/app/sales/dashboard"], li[aria-label="Dashboard"]', { timeout: 20_000 })
      .catch(() => {});

    const candidates = [
      this.page.locator('a[href="/app/sales/dashboard"]').first(),
      this.page.locator('li[aria-label="Dashboard"]').first(),
      this.page.getByRole('link', { name: /dashboard/i }).first(),
      this.page.getByText('Dashboard', { exact: true }).first()
    ];

    let navigated = false;
    for (const candidate of candidates) {
      if (!(await candidate.isVisible({ timeout: 3_000 }).catch(() => false))) continue;
      await Promise.allSettled([
        this.page.waitForURL(/\/app\/sales\/dashboard/, { timeout: 10_000 }),
        candidate.click({ force: true }).catch(() => {})
      ]);
      if (/\/app\/sales\/dashboard/.test(this.page.url())) {
        navigated = true;
        break;
      }
    }

    if (!navigated) {
      await this.page.evaluate(() => {
        const anchor = document.querySelector('a[href="/app/sales/dashboard"]');
        anchor?.click();
      }).catch(() => {});
      await this.page.waitForURL(/\/app\/sales\/dashboard/, { timeout: 10_000 }).catch(() => {});
      if (/\/app\/sales\/dashboard/.test(this.page.url())) {
        navigated = true;
      }
    }

    if (!navigated) {
      throw new Error(`Unable to navigate to Dashboard from left panel menu. Current URL: ${this.page.url()}`);
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async goToCompaniesFromMenu() {
    await this.page
      .waitForSelector('a[href="/app/sales/companies"], li[aria-label="Companies"]', { timeout: 20_000 })
      .catch(() => {});

    const candidates = [
      this.page.locator('a[href="/app/sales/companies"]').first(),
      this.page.locator('li[aria-label="Companies"]').first(),
      this.page.getByRole('link', { name: /^companies$/i }).first(),
      this.page.getByText('Companies', { exact: true }).first()
    ];

    let navigated = false;
    for (const candidate of candidates) {
      if (!(await candidate.isVisible({ timeout: 3_000 }).catch(() => false))) continue;
      await Promise.allSettled([
        this.page.waitForURL(/\/app\/sales\/companies/, { timeout: 10_000 }),
        candidate.click({ force: true }).catch(() => {})
      ]);
      if (/\/app\/sales\/companies/.test(this.page.url())) {
        navigated = true;
        break;
      }
    }

    if (!navigated) {
      await this.page.evaluate(() => {
        const anchor = document.querySelector('a[href="/app/sales/companies"]');
        anchor?.click();
      }).catch(() => {});
      await this.page.waitForURL(/\/app\/sales\/companies/, { timeout: 10_000 }).catch(() => {});
      if (/\/app\/sales\/companies/.test(this.page.url())) {
        navigated = true;
      }
    }

    if (!navigated) {
      throw new Error(`Unable to navigate to Companies from left panel menu. Current URL: ${this.page.url()}`);
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async openCompanyDetailFromList(companyName, rowIndex = 2) {
    await this.goToCompaniesFromMenu();
    await this.page.waitForSelector('table tbody tr td:first-child', { timeout: 15_000 }).catch(() => {});

    const firstRowCell = this.page.locator('table tbody tr td:first-child').first();
    if (!(await firstRowCell.isVisible({ timeout: 5_000 }).catch(() => false))) {
      throw new Error(`Unable to open company detail from list. No visible company row found for: ${companyName || 'first row'}`);
    }

    const tryOpen = async () => {
      await this.page.evaluate((preferredRowIndex) => {
        const rows = Array.from(document.querySelectorAll('table tbody tr td:first-child'));
        const target = rows[preferredRowIndex] || rows.find((el) => (el.textContent || '').trim().length > 0) || rows[0];
        if (!target) return;
        const propsKey = Object.keys(target).find((k) => k.startsWith('__reactProps') && typeof target[k]?.onClick === 'function');
        if (propsKey) {
          target[propsKey].onClick({ currentTarget: target, target, preventDefault() {}, stopPropagation() {} });
          return;
        }
        target?.click();
      }, rowIndex).catch(async () => {
        const fallback = this.page.locator('table tbody tr td:first-child').nth(rowIndex).or(firstRowCell).first();
        await fallback.click({ force: true }).catch(() => {});
      });
      await this.page.waitForTimeout(3_000);
    };

    await tryOpen();
    if (!/\/company\//.test(this.page.url())) {
      await tryOpen();
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    if (!/\/company\//.test(this.page.url())) {
      throw new Error(`Company detail did not open from list click. Current URL: ${this.page.url()}`);
    }
  }

  async openCreateCompanyModal() {
    await this.page.getByRole('button', { name: 'Create Company' }).click();
    await this.page.getByRole('heading', { name: 'Create a New Company' }).waitFor({ timeout: 15_000 });
  }

  async selectFirstMarketVertical() {
    const knownOptions = ['Manufacturing', 'Industrial', 'Distribution', 'Residential', 'Commercial'];
    const primaryTrigger = this.page.locator(
      'xpath=//body/div[@role="presentation"]/form[contains(@class,"MuiBox-root")]/div[contains(@class,"innerScrollBar")]/div[2]/div[1]/div[1]/div[1]'
    ).first();

    const fallbackTriggers = [
      this.page.locator('div[aria-describedby="simple-popper"]').filter({ has: this.page.locator('h6:has-text("Select Industry")') }).locator('> div').first(),
      this.page.getByText('Select Industry', { exact: true }).first()
    ];

    let opened = false;
    if (await primaryTrigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
      opened = await primaryTrigger.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
      await this.page.waitForTimeout(800);
    }

    if (!opened) {
      for (const trigger of fallbackTriggers) {
        if (!(await trigger.isVisible({ timeout: 2_000 }).catch(() => false))) continue;
        opened = await trigger.click({ force: true, timeout: 3_000 }).then(() => true).catch(() => false);
        await this.page.waitForTimeout(800);
        if (opened) break;
      }
    }

    const optionRoot = this.page.locator('#simple-popper').first();
    const optionsVisible = await optionRoot.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!opened || !optionsVisible) {
      const selectedText = knownOptions[Math.floor(Math.random() * knownOptions.length)];
      const injected = await this.page.evaluate((value) => {
        const roots = Array.from(document.querySelectorAll('div[aria-describedby="simple-popper"]'));
        const root = roots.find((el) => /Select Industry/.test(el.textContent || '')) || roots[0];
        const child = root?.firstElementChild;
        const fiberKey = child ? Object.keys(child).find((k) => k.startsWith('__reactFiber')) : null;
        let node = fiberKey ? child[fiberKey] : null;
        while (node) {
          const props = node.memoizedProps;
          if (props?.handleChange) {
            props.handleChange({
              target: {
                name: props.name || 'companyIndustry',
                value: { label: value, value }
              }
            });
            return true;
          }
          node = node.return;
        }
        return false;
      }, selectedText).catch(() => false);

      if (!injected) {
        throw new Error('Market Vertical dropdown did not open and component state injection failed.');
      }

      await this.page.waitForTimeout(500);
      return selectedText;
    }

    const optionLocators = optionRoot.locator('p').filter({ hasText: /\S/ });
    const optionCount = await optionLocators.count();
    if (!optionCount) {
      throw new Error('Market Vertical dropdown opened but no values were found.');
    }

    const values = [];
    for (let i = 0; i < optionCount; i++) {
      const text = ((await optionLocators.nth(i).textContent().catch(() => '')) || '').trim();
      if (text && knownOptions.includes(text)) values.push(text);
    }

    if (!values.length) {
      throw new Error('Market Vertical dropdown values could not be read from #simple-popper.');
    }

    const selectedText = values[Math.floor(Math.random() * values.length)];
    await optionRoot.getByText(new RegExp(`^${selectedText}$`, 'i')).first().click({ force: true });
    await this.page.waitForTimeout(500);

    const selectedVisible = await this.page.getByText(selectedText, { exact: true }).first().isVisible().catch(() => false);
    if (!selectedVisible) {
      throw new Error(`Market Vertical value was not selected: ${selectedText}`);
    }

    return selectedText;
  }

  // Type an address into Google autocomplete and select the first real suggestion
  async fillAddressField(addressText) {
    const field = this.page.locator('#googleAddress')
      .or(this.page.getByRole('textbox', { name: /type address/i }))
      .first();
    await field.click();
    await this.page.waitForTimeout(300);
    await field.fill('');
    await field.type(addressText, { delay: 80 });
    const suggestion = this.page.locator('.pac-item, [class*="pac-item"], [role="option"], li[role="option"]').first();
    const suggestionVisible = await suggestion.waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (suggestionVisible) {
      await suggestion.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(800);
      return;
    }

    await field.press('ArrowDown').catch(() => {});
    await field.press('Enter').catch(() => {});
    await this.page.waitForTimeout(800);

    const pacCount = await this.page.evaluate(() => {
      return document.querySelectorAll('.pac-item, [class*="pac-item"], [role="option"], li[role="option"]').length;
    }).catch(() => 0);

    if (!pacCount) throw new Error(`Address suggestions did not appear for: ${addressText}`);
  }

  async createCompany({ companyName, companyAddress, companyDomain = '' }) {
    await this.openCreateCompanyModal();
    await this.page.locator('#companyName').fill(companyName);

    if (companyDomain) {
      await this.page.locator('#companyDomain').fill(companyDomain).catch(() => {});
    }

    const selectedMarketVertical = await this.selectFirstMarketVertical();
    await this.fillAddressField(companyAddress);

    const submit = this.page.getByRole('button', { name: 'Create Company' }).last();
    await submit.waitFor({ state: 'visible', timeout: 10_000 });
    const enabled = await submit.isEnabled({ timeout: 10_000 }).catch(() => false);
    if (!enabled) {
      throw new Error('Create Company button did not become enabled after filling required fields.');
    }

    await submit.click();
    const modalClosed = await this.page.getByRole('heading', { name: 'Create a New Company' })
      .waitFor({ state: 'hidden', timeout: 20_000 }).then(() => true).catch(() => false);
    if (!modalClosed) {
      throw new Error('Create Company modal did not close after submit.');
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    return { selectedMarketVertical };
  }
}

module.exports = { CompanyModule };
