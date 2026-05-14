// @ts-check
//
// pages/edge-module/contract.js
// Page Object Model — EDGE 2.0 (OBX Portal) Contract Acknowledgment
//
// The EDGE portal shares the same Auth0 session as the SET (Sales CRM) portal.
// No separate login is required.
//
// Access path (live-verified 2026-05-13):
//   1. Click the user avatar in the SET portal top-right header
//   2. In the profile dropdown menu, click "Switch to Edge 2.0"
//      → opens https://uat.portal.teamsignal.com in a NEW browser tab
//   3. Click [data-testid="dropdown-trigger"] to open franchise selector
//   4. Select franchise from the tooltip popover (env-based, see utils/env-data.js)
//   5. Navigate to Sites (/app/obx/sites) via direct page.goto()
//   6. Search by site name (= SET property name) — searchbox "Search by Site Name"
//   7. Click site row (uses dispatchEvent to bypass fixed pagination overlay)
//   8. Open Contracts tab → URL: ?activeTab=contract&value=0
//   9. Find contract card (MuiAccordion scoped by deal name)
//  10. Read MuiChip badge for status / click 3-dot menu button (svg g#more-vertical)
//
// The same franchise name is used on both platforms (SET and EDGE).
// Use utils/env-data.js → franchise key for the correct env value.

'use strict';

const { TIMEOUTS } = require('../../utils/playwright-timeouts');
const { expect } = require('@playwright/test');

class EdgeContractModule {
  constructor(page) {
    this.page = page;

    // ── EDGE header — Franchise dropdown trigger ──────────────────────────────
    // [data-testid="dropdown-trigger"] is the franchise selector div in the banner.
    // Clicking opens a tooltip popover with a Search textbox + franchise list items.
    // Live-verified: 2026-05-13
    this.franchiseDropdownBtn = page.getByTestId('dropdown-trigger');

    // Search textbox inside the open franchise tooltip popover
    // Live-verified: role=tooltip → role=textbox name="Search". 2026-05-13
    this.franchiseSearchInput = page
      .getByRole('tooltip')
      .getByRole('textbox', { name: 'Search' });

    // ── EDGE sidebar — Sites link ─────────────────────────────────────────────
    // Sidebar link href="/app/obx/sites". goToSites() uses page.goto() instead
    // of clicking this (sidebar items can fall outside viewport). 2026-05-13
    this.sitesSidebarLink = page
      .getByRole('link', { name: /^sites$/i })
      .or(page.locator('a[href*="/app/obx/sites"]'))
      .first();

    // ── Sites list page ───────────────────────────────────────────────────────
    // Search input — placeholder "Search by Site Name". Live-verified: 2026-05-13
    this.siteSearchInput = page.getByRole('searchbox', { name: /site name/i });

    // ── Site detail — Contracts tab ───────────────────────────────────────────
    // tab role "Contracts". On click URL updates to ?activeTab=contract&value=0
    // Live-verified: 2026-05-13
    this.contractsTab = page.getByRole('tab', { name: /^contracts$/i });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Returns a locator for the MuiAccordion-root wrapper of a specific contract.
   * Scoped to the accordion that contains the deal name text.
   * Live-verified: contract cards are MuiAccordion components. 2026-05-13
   * @param {string} dealName
   * @returns {import('@playwright/test').Locator}
   */
  _contractAccordion(dealName) {
    return this.page
      .locator('[class*="MuiAccordion-root"]')
      .filter({ hasText: dealName });
  }

  /**
   * Returns a locator for the contract card header (MuiAccordionSummary).
   * Click to expand/collapse. Has aria-expanded attribute.
   * @param {string} dealName
   * @returns {import('@playwright/test').Locator}
   */
  _contractCardLocator(dealName) {
    return this._contractAccordion(dealName)
      .locator('[class*="MuiAccordionSummary"]')
      .first();
  }

  /**
   * Returns a locator for the 3-dot (more-vertical) icon button on a contract card.
   * No aria-label or data-testid — identified by the SVG icon with g#more-vertical.
   * Live-verified: MuiIconButton containing svg > g#more-vertical. 2026-05-13
   * @param {string} dealName
   * @returns {import('@playwright/test').Locator}
   */
  _contractMenuBtnLocator(dealName) {
    return this._contractAccordion(dealName)
      .locator('[class*="MuiAccordionSummary"]')
      .locator('button:has(svg g#more-vertical), button[class*="MuiIconButton"]')
      .first();
  }

  /**
   * Returns the MuiChip status badge locator scoped to a contract card.
   * Status chip classes: MuiChip-colorSuccess (Active), MuiChip-colorError (Expired),
   * MuiChip-colorWarning (Not Acknowledged), MuiChip-colorPrimary (Acknowledged) — unverified.
   * Live-verified: badge is MuiChip-root inside MuiAccordionSummary. 2026-05-13
   * @param {string} dealName
   * @param {RegExp} statusPattern
   * @returns {import('@playwright/test').Locator}
   */
  _statusBadgeLocator(dealName, statusPattern) {
    return this._contractAccordion(dealName)
      .locator('[class*="MuiChip-root"]')
      .filter({ hasText: statusPattern });
  }

  // ── Public methods ─────────────────────────────────────────────────────────

  /**
   * Static factory — navigate from the SET portal to the EDGE portal.
   *
   * Flow (live-verified 2026-05-13):
   *   1. Click the user avatar in the SET portal banner → profile menu opens
   *   2. Click "Switch to Edge 2.0" link (role=menu → role=link)
   *   3. A new tab opens at https://uat.portal.teamsignal.com/app/obx/dashboard
   *   4. Returns an EdgeContractModule bound to the new tab
   *
   * No EDGE_BASE_URL env var is required — the URL is resolved by the app itself.
   *
   * @param {import('@playwright/test').Page} setPage - authenticated SET portal page
   * @returns {Promise<EdgeContractModule>}
   */
  static async openFromSetPage(setPage) {
    // Click the user profile area (div in banner containing a named avatar img)
    const profileArea = setPage
      .getByRole('banner')
      .locator('div')
      .filter({ has: setPage.locator('img[alt]:not([alt=""])') })
      .last();
    await profileArea.click();

    // Wait for profile menu and click "Switch to Edge 2.0"
    const switchLink = setPage
      .getByRole('menu')
      .getByRole('link', { name: /switch to edge 2\.0/i });
    await expect(switchLink).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });

    // Link opens a new tab — capture it
    const [edgePage] = await Promise.all([
      setPage.context().waitForEvent('page'),
      switchLink.click(),
    ]);
    await edgePage.waitForLoadState('domcontentloaded');
    return new EdgeContractModule(edgePage);
  }

  /**
   * Select a franchise from the top-right franchise dropdown.
   * Env-specific franchise name is in utils/env-data.js (franchise key).
   *
   * @param {string} franchiseName - e.g. "UAT SET 2", "Tkxel Test Franchise"
   */
  async selectFranchise(franchiseName) {
    await this.franchiseDropdownBtn.click();

    // Dropdown renders as a tooltip popover
    const tooltip = this.page.getByRole('tooltip');
    await expect(tooltip).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });

    // Search to filter (handles long franchise lists)
    await this.franchiseSearchInput.fill(franchiseName);

    // Franchise option is a <p> element inside the tooltip
    const option = tooltip.locator('p').filter({ hasText: franchiseName });
    await expect(option).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    await option.click();

    // Confirm the dropdown trigger now shows the selected franchise
    await expect(this.franchiseDropdownBtn).toContainText(franchiseName, {
      timeout: TIMEOUTS.BASE * 20,
    });
  }

  /**
   * Navigate to the Sites list via direct URL.
   * Direct navigation is more reliable than clicking the sidebar link
   * (the link can fall outside the viewport depending on browser window size).
   */
  async goToSites() {
    const origin = new URL(this.page.url()).origin;
    await this.page.goto(`${origin}/app/obx/sites`, { waitUntil: 'domcontentloaded' });
    await expect(this.siteSearchInput).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  /**
   * Search for a site by name and open its detail page.
   * Uses dispatchEvent('click') to bypass the fixed pagination toolbar that
   * intercepts pointer events on table rows. Live-verified fix: 2026-05-13
   *
   * @param {string} siteName - SET property name (= EDGE site name)
   */
  async searchAndOpenSite(siteName) {
    await this.siteSearchInput.fill(siteName);

    const siteCell = this.page
      .getByRole('cell', { name: siteName })
      .or(this.page.locator('td').filter({ hasText: siteName }))
      .first();

    await expect(siteCell).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    // Use dispatchEvent to bypass the fixed pagination toolbar overlay
    await siteCell.dispatchEvent('click');
    await this.page.waitForURL(/sitesDetail/, { timeout: TIMEOUTS.BASE * 20 });
  }

  /**
   * Click the Contracts tab on the site detail page.
   * URL updates to ?activeTab=contract&value=0 on selection. Live-verified: 2026-05-13
   */
  async openContractsTab() {
    await this.contractsTab.click();
    await this.page
      .waitForURL(/activeTab=contract/, { timeout: TIMEOUTS.BASE * 20 })
      .catch(() => {});
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for and return the accordion locator for a contract by deal name.
   * @param {string} dealName
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async findContractCard(dealName) {
    const card = this._contractAccordion(dealName);
    await expect(card).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    return card;
  }

  /**
   * Read the MuiChip badge text from a contract card to determine its status.
   * @param {string} dealName
   * @returns {Promise<'Active'|'Expired'|'Not Acknowledged'|'Acknowledged'|'unknown'>}
   */
  async getContractStatus(dealName) {
    const badge = this._contractAccordion(dealName)
      .locator('[class*="MuiChip-root"]')
      .first();
    await expect(badge).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    const text = (await badge.textContent()).trim();

    if (/not acknowledged/i.test(text)) return 'Not Acknowledged';
    if (/^acknowledged$/i.test(text)) return 'Acknowledged';
    if (/active/i.test(text)) return 'Active';
    if (/expired/i.test(text)) return 'Expired';
    return 'unknown';
  }

  /**
   * Click the 3-dot icon menu button on a specific contract card.
   * @param {string} dealName
   */
  async openContractMenu(dealName) {
    const menuBtn = this._contractMenuBtnLocator(dealName);
    await expect(menuBtn).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    await menuBtn.click();
  }

  /**
   * Return true if the "Not Acknowledged" MuiChip badge is visible on the card.
   * @param {string} dealName
   * @returns {Promise<boolean>}
   */
  async isNotAcknowledgedBadgeVisible(dealName) {
    return this._statusBadgeLocator(dealName, /not acknowledged/i)
      .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Return true if the "Acknowledged" MuiChip badge is visible on the card.
   * Excludes "Not Acknowledged" via word-boundary regex.
   * @param {string} dealName
   * @returns {Promise<boolean>}
   */
  async isAcknowledgedBadgeVisible(dealName) {
    return this._statusBadgeLocator(dealName, /^acknowledged$/i)
      .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Locator for the "Review & Acknowledge" button (auto-renewal contracts).
   * @returns {import('@playwright/test').Locator}
   */
  get reviewAndAcknowledgeBtn() {
    return this.page
      .getByRole('button', { name: /review\s*&?\s*acknowledge/i })
      .or(this.page.locator('button').filter({ hasText: /review.*acknowledge/i }))
      .first();
  }

  /**
   * Locator for the primary Acknowledge button (inside acknowledgment modal/step).
   * @returns {import('@playwright/test').Locator}
   */
  get acknowledgeBtn() {
    return this.page
      .getByRole('button', { name: /^acknowledge$/i })
      .or(this.page.locator('button').filter({ hasText: /^acknowledge$/i }))
      .first();
  }
}

module.exports = { EdgeContractModule };
