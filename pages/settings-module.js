// @ts-check
//
// pages/settings-module.js
// Page Object Model — Settings Module, Signal CRM
//
// Covers: Settings → Pricing Configurations tab
//
// Access path: /app/settings → click "Pricing Configurations" tab
//              → click franchise dropdown → select franchise
//
// ALL locators live-verified via MCP browser on 2026-05-20.
// URL pattern: https://uat.sales.teamsignal.com/app/settings?activeTab=pricingConfigurations

const { TIMEOUTS } = require('../utils/playwright-timeouts');
const { expect } = require('@playwright/test');

class SettingsModule {
  constructor(page) {
    this.page = page;

    // ── Settings top-level tabs ──────────────────────────────────────────────
    // Live-verified 2026-05-20: tablist has six tabs; Pricing Configurations is 4th.
    this.pricingConfigTab = page.getByRole('tab', { name: 'Pricing Configurations' });

    // ── Pricing Configurations — Franchise dropdown ──────────────────────────
    // Live-verified 2026-05-20: the trigger is an h6 heading inside a cursor:pointer
    // generic container. Its text is either "Select a Franchise" (no selection) or
    // "216 - Omaha, NE, Oli..." (truncated) after selection.
    // The tooltip/popper lists franchises as <p> elements.
    this.franchiseDropdownTrigger = page
      .getByRole('tabpanel', { name: 'Pricing Configurations' })
      .getByRole('heading', { level: 6 })
      .filter({ hasText: /Select a Franchise|Omaha|216|Oliver/i });

    // ── Pricing Configurations — Section headings (level 5) ─────────────────
    // Live-verified 2026-05-20: each pricing section uses an h5 heading label.
    this.fasChargesHeading = page.getByRole('heading', {
      name: 'FAS Charges (% of Revenue)',
      level: 5,
    });
    this.payrollTaxesHeading = page.getByRole('heading', {
      name: 'Payroll Taxes',
      level: 5,
    });
    this.vehicleExpensesHeading = page.getByRole('heading', {
      name: 'Monthly Expenses per Vehicle',
      level: 5,
    });
    this.adminExpensesHeading = page.getByRole('heading', {
      name: 'Administration Expenses (% of Revenue)',
      level: 5,
    });
    this.overheadHeading = page.getByRole('heading', {
      name: 'Overhead',
      level: 5,
    });
    this.paymentTermsAdjHeading = page.getByRole('heading', {
      name: 'Payment Terms Adjustments (Dedicated Only)',
      level: 5,
    });
    this.vehicleAssumptionsHeading = page.getByRole('heading', {
      name: 'Vehicle Assumptions',
      level: 5,
    });
    this.vehicleUsageHeading = page.getByRole('heading', {
      name: 'Vehicle Usage and Allocation (Dedicated)',
      level: 5,
    });

    // ── FAS Charges spinbuttons — scoped by row heading ──────────────────────
    // Live-verified 2026-05-20: each row is a generic container with an h6 heading
    // and an adjacent spinbutton. Scope via the h6 heading's parent container.
    // Pattern: getByRole('heading', { name: '...', level: 6 }).locator('..').getByRole('spinbutton')
    this.fasRoyaltyInput = page
      .getByRole('heading', { name: 'Royalty', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasTerritoryInput = page
      .getByRole('heading', { name: 'Teritory', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasGlInsuranceInput = page
      .getByRole('heading', { name: 'GL Insurance (excluded from dedicated vehicle)', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasAutoInsuranceInput = page
      .getByRole('heading', { name: 'Auto Insurance', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasInterestInput = page
      .getByRole('heading', { name: 'Interest', level: 6 })
      .first() // "Interest" appears in both FAS and Admin sections
      .locator('..')
      .getByRole('spinbutton');
    this.fasConventionInput = page
      .getByRole('heading', { name: 'Convention', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasDispatchInput = page
      .getByRole('heading', { name: 'Dispatch', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasAlnInput = page
      .getByRole('heading', { name: 'ALN', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.fasEmailInput = page
      .getByRole('heading', { name: 'Email', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    // Live-verified 2026-05-20: FAS section structure:
    //   h5 "FAS Charges (% of Revenue)"
    //     └── parent: div.MuiBox-root.css-k008qs  (contains ONLY the h5 — no total h6 here)
    //         └── grandparent: div.MuiBox-root  (section root — also contains total row)
    //             └── ... (item rows) ...
    //             └── div.jss175 > h6 "19.00 %"  (Total value)
    // Fix: go up TWO levels from h5 to reach the section root, then find the total h6.
    this.fasTotalValueHeading = page
      .getByRole('heading', { name: 'FAS Charges (% of Revenue)', level: 5 })
      .locator('../..')
      .getByRole('heading', { name: /\d+\.\d+ %/, level: 6 });

    // ── Payroll Taxes spinbuttons ────────────────────────────────────────────
    this.payrollSocialSecurityInput = page
      .getByRole('heading', { name: 'Social Security', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.payrollSutaInput = page
      .getByRole('heading', { name: 'SUTA', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.payrollFutaInput = page
      .getByRole('heading', { name: 'FUTA', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.payrollMedicareInput = page
      .getByRole('heading', { name: 'Medicare Taxes', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.payrollTotalValueHeading = page
      .getByRole('heading', { name: 'Payroll Taxes', level: 5 })
      .locator('../..')
      .getByRole('heading', { name: /\d+\.\d+ %/, level: 6 });

    // ── Monthly Vehicle Expenses spinbuttons ─────────────────────────────────
    // Scoped to vehicle section grandparent to avoid matching "Payment Terms Adjustment"
    // which also contains the word "Payment". exact:true avoids partial-name ambiguity.
    this.vehiclePaymentInput = page
      .getByRole('heading', { name: 'Monthly Expenses per Vehicle', level: 5 })
      .locator('../..')
      .getByRole('heading', { name: 'Payment', level: 6, exact: true })
      .locator('..')
      .getByRole('spinbutton');
    this.vehicleInsuranceInput = page
      .getByRole('heading', { name: 'Monthly Expenses per Vehicle', level: 5 })
      .locator('../..')
      .getByRole('heading', { name: 'Insurance', level: 6, exact: true })
      .locator('..')
      .getByRole('spinbutton');
    this.vehicleRepairsInput = page
      .getByRole('heading', { name: 'Repairs & Maintenance', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.vehicleTaxesInput = page
      .getByRole('heading', { name: 'Taxes & Registration', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    // Live-verified 2026-05-20: vehicle total heading text is "1160.00 $"
    this.vehicleTotalValueHeading = page
      .getByRole('heading', { name: 'Monthly Expenses per Vehicle', level: 5 })
      .locator('../..')
      .getByRole('heading', { name: /\d+\.\d+ \$/, level: 6 });

    // ── Admin Expenses ───────────────────────────────────────────────────────
    this.adminTotalValueHeading = page
      .getByRole('heading', { name: 'Administration Expenses (% of Revenue)', level: 5 })
      .locator('../..')
      .getByRole('heading', { name: /\d+\.\d+ %/, level: 6 });

    // ── Overhead spinbuttons ─────────────────────────────────────────────────
    this.overheadDedicatedInput = page
      .getByRole('heading', { name: 'Dedicated (Included Employer taxes)', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.overheadPatrolInput = page
      .getByRole('heading', { name: 'Patrol (Excluded Employer Taxes)', level: 6 })
      .locator('..')
      .getByRole('spinbutton');

    // ── Payment Terms Adjustment spinbutton ──────────────────────────────────
    this.paymentTermsAdjInput = page
      .getByRole('heading', { name: 'Payment Terms Adjustment', level: 6 })
      .locator('..')
      .getByRole('spinbutton');

    // ── Vehicle Usage (Dedicated) ─────────────────────────────────────────────
    this.vehicleUnrelatedHoursInput = page
      .getByRole('heading', { name: 'Hours vehicle is used for unrelated activities', level: 6 })
      .locator('..')
      .getByRole('spinbutton');
    this.dedicatedVehicleUsageInput = page
      .getByRole('heading', { name: 'Dedicated Vehicle Usage', level: 6 })
      .locator('..')
      .getByRole('spinbutton');

    // ── Save / Cancel buttons ────────────────────────────────────────────────
    // Live-verified 2026-05-20: these buttons only appear after a value is changed.
    this.saveChangesBtn = page.getByRole('button', { name: 'Save Changes' });
    this.cancelChangesBtn = page.getByRole('button', { name: 'Cancel' });

    // ── Save Confirmation Dialog ─────────────────────────────────────────────
    // Live-verified 2026-05-20: clicking "Save Changes" triggers a MUI Dialog:
    //   "Are you sure? You are about to update pricing configuration. Do you want to proceed?"
    //   with Cancel and Yes buttons. The save API is only called after clicking "Yes".
    // API endpoint: POST .../leads/api/v1/web/pricing_configurations/save
    this.saveConfirmYesBtn = page.getByRole('button', { name: 'Yes' });
    this.saveConfirmDialog = page.getByRole('dialog');

    // ── Section root locators (grandparent of each h5 heading) ───────────────
    // Used to scope spinbutton discovery for sum-verification tests.
    // Each section root is the MuiBox container that holds all item rows + the Total h6.
    // Pattern: h5 heading → parent (contains only h5) → grandparent (section root)
    this.fasSectionRoot = page
      .getByRole('heading', { name: 'FAS Charges (% of Revenue)', level: 5 })
      .locator('../..');
    this.payrollSectionRoot = page
      .getByRole('heading', { name: 'Payroll Taxes', level: 5 })
      .locator('../..');
    this.vehicleSectionRoot = page
      .getByRole('heading', { name: 'Monthly Expenses per Vehicle', level: 5 })
      .locator('../..');
    this.adminSectionRoot = page
      .getByRole('heading', { name: 'Administration Expenses (% of Revenue)', level: 5 })
      .locator('../..');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  /** Navigate to Settings page */
  async gotoSettings() {
    await this.page.goto('/app/settings', { waitUntil: 'domcontentloaded' });
    await expect(this.pricingConfigTab).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
  }

  /** Click the Pricing Configurations tab */
  async openPricingConfigTab() {
    await this.pricingConfigTab.click();
    await expect(this.pricingConfigTab).toHaveAttribute('aria-selected', 'true', {
      timeout: TIMEOUTS.BASE * 20,
    });
  }

  /**
   * Select a franchise from the dropdown.
   * Live-verified 2026-05-20: trigger is an h6 inside the Pricing Configurations tabpanel.
   * Options render as <p> elements inside a MUI Tooltip/Popper (#simple-popper equivalent).
   * @param {string} franchiseName — exact franchise name text, e.g. "216 - Omaha, NE, Oliver"
   */
  async selectFranchise(franchiseName) {
    // Use real click on h6 heading — not force:true (SKILL.md §22)
    await this.franchiseDropdownTrigger.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 });
    await this.franchiseDropdownTrigger.click();

    // The franchise list renders as a tooltip/popper with <p> elements
    const option = this.page.getByText(franchiseName, { exact: true });
    await option.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 16 });
    await option.click();

    // Wait for the pricing content to load after franchise selection
    await expect(this.fasChargesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
  }

  /** Assert the FAS Charges section heading is visible */
  async assertFasChargesSectionVisible() {
    await expect(this.fasChargesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /** Assert the Payroll Taxes section is visible */
  async assertPayrollTaxesSectionVisible() {
    await expect(this.payrollTaxesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /** Assert the Monthly Vehicle Expenses section is visible */
  async assertVehicleExpensesSectionVisible() {
    await expect(this.vehicleExpensesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /** Assert the Administration Expenses section is visible */
  async assertAdminExpensesSectionVisible() {
    await expect(this.adminExpensesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /** Assert the Overhead section is visible */
  async assertOverheadSectionVisible() {
    await expect(this.overheadHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /** Assert the Payment Terms Adjustments section is visible */
  async assertPaymentTermsAdjSectionVisible() {
    await expect(this.paymentTermsAdjHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /**
   * Edit the Royalty spinbutton with a new value.
   * Uses fill() which clears then types — safe for spinbuttons in scrollable containers.
   * @param {string|number} newValue
   */
  async editRoyalty(newValue) {
    await this.fasRoyaltyInput.scrollIntoViewIfNeeded();
    await this.fasRoyaltyInput.fill(String(newValue));
    await this.fasRoyaltyInput.press('Tab');
  }

  /**
   * Click Save Changes, confirm the "Are you sure?" dialog, then wait for the
   * save API response and button disappearance.
   *
   * Live-verified 2026-05-20: clicking "Save Changes" opens a MUI Dialog with a "Yes" button.
   * The actual POST to /pricing_configurations/save only fires after "Yes" is clicked.
   * API endpoint: POST .../leads/api/v1/web/pricing_configurations/save => [200]
   */
  async saveChanges() {
    await expect(this.saveChangesBtn).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    await this.saveChangesBtn.click();

    // Wait for the confirmation dialog and click Yes
    await expect(this.saveConfirmYesBtn).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    await Promise.all([
      this.page
        .waitForResponse(
          (r) => r.url().includes('pricing_configurations/save') && r.ok(),
          { timeout: TIMEOUTS.BASE * 60 },
        )
        .catch(() => null),
      this.saveConfirmYesBtn.click(),
    ]);

    // After save, the confirmation dialog closes and the Save Changes button disappears
    await expect(this.saveConfirmDialog).not.toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
    await expect(this.saveChangesBtn).not.toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
  }

  /**
   * Read the current text value of the FAS Total heading.
   * @returns {Promise<string>} e.g. "19.00 %"
   */
  async getFasTotalText() {
    await this.fasTotalValueHeading.scrollIntoViewIfNeeded().catch(() => {});
    return this.fasTotalValueHeading.textContent();
  }

  /**
   * Read the current numeric value of the Royalty spinbutton.
   * @returns {Promise<string>}
   */
  async getRoyaltyValue() {
    return this.fasRoyaltyInput.inputValue();
  }

  // ── Sum verification helpers (for TC-PRICING-026 … TC-PRICING-029) ──────────

  /**
   * Sum all spinbutton input values inside a section root locator.
   * Used to verify that the displayed Total = sum of all individual line items.
   * @param {import('@playwright/test').Locator} sectionRootLocator
   * @returns {Promise<number>} sum rounded to 3 decimal places
   */
  async sumSectionSpinbuttons(sectionRootLocator) {
    const inputs = sectionRootLocator.getByRole('spinbutton');
    const count = await inputs.count();
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const value = await inputs.nth(i).inputValue();
      sum += parseFloat(value) || 0;
    }
    return Math.round(sum * 1000) / 1000;
  }

  /**
   * Parse a percentage total heading text "N.NN %" → float.
   * @param {import('@playwright/test').Locator} headingLocator
   * @returns {Promise<number>}
   */
  async parsePctTotal(headingLocator) {
    await headingLocator.scrollIntoViewIfNeeded().catch(() => {});
    const text = await headingLocator.textContent({ timeout: TIMEOUTS.BASE * 10 });
    const match = text?.match(/([\d.]+)\s*%/);
    return match ? parseFloat(match[1]) : NaN;
  }

  /**
   * Parse a dollar total heading text "N.NN $" → float.
   * @param {import('@playwright/test').Locator} headingLocator
   * @returns {Promise<number>}
   */
  async parseDollarTotal(headingLocator) {
    await headingLocator.scrollIntoViewIfNeeded().catch(() => {});
    const text = await headingLocator.textContent({ timeout: TIMEOUTS.BASE * 10 });
    const match = text?.match(/([\d.]+)\s*\$/);
    return match ? parseFloat(match[1]) : NaN;
  }
}

module.exports = { SettingsModule };
