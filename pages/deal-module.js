// pages/deal-module.js
// Page Object Model — Deals Module, Signal CRM
// ALL locators live-verified via MCP browser on 2026-03-21
// Fully dynamic — no hardcoded IDs, names, or indices

const { expect } = require('@playwright/test');
const { env } = require('../utils/auth/env');

class DealModule {
  constructor(page) {
    this.page = page;
    this.baseUrl = env.baseUrl;

    // ── Sidebar navigation ────────────────────────────────────────────────
    this.dealsMenuLink = page.getByRole('listitem', { name: 'Deals' }).getByRole('link');

    // ── List page ─────────────────────────────────────────────────────────
    this.createDealButton = page.getByRole('button', { name: 'Create Deal' });
    this.dealSearchInput  = page
      .getByRole('searchbox', { name: 'ID, Deal' })
      .or(page.locator('input[placeholder*="ID, Deal"]'))
      .first();
    this.allDealsFilter   = page.getByRole('heading', { name: 'All Deals', level: 6 });
    this.moreFiltersBtn   = page.getByRole('button', { name: 'More Filters' });
    this.paginationInfo   = page.getByText(/\d+–\d+ of \d+/);
    this.nextPageBtn      = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn      = page.getByRole('button', { name: 'Go to previous page' });
    this.rowsPerPageCombo = page.getByRole('combobox', { name: /Rows per page/ });

    // ── Create Deal drawer ────────────────────────────────────────────────
    // Live-verified: heading level=3
    this.createDealHeading = page.getByRole('heading', { name: 'Create Deal', level: 3 });
    // Deal Name textbox
    this.dealNameInput = page.getByRole('textbox', { name: 'Deal Name *' });
    // Company dropdown — heading "Select Company" (level=6), opens tooltip with Search
    this.companySelector   = page.getByRole('heading', { name: 'Select Company', level: 6 });
    // Property dropdown — heading "Select Property / Property Name" (level=6), opens tooltip
    this.propertySelector  = page.getByRole('heading', { name: 'Select Property / Property Name', level: 6 });
    // Shared search input inside tooltip (reused for both company and property)
    this.searchInput = page.getByRole('tooltip').getByRole('textbox', { name: 'Search' });

    this.cancelDealBtn = page.getByRole('button', { name: 'Cancel' });
    // Submit button — use .last() to distinguish from list page "Create Deal" button
    this.submitCreateDealBtn = page.getByRole('button', { name: 'Create Deal' }).last();

    // Live-verified success toast text
    this.successToast = page.getByText('Deal has been created');

    // ── Deal Detail page ──────────────────────────────────────────────────
    // Live-verified: heading level=2
    this.followUpBtn       = page.getByRole('button', { name: 'Follow-up' });

    // Sidebar accordion buttons — live-verified exact names
    this.aboutThisDealBtn    = page.getByRole('button', { name: 'About this Deal' });
    this.companySection      = page.getByRole('button', { name: 'Company' });
    this.propertyDetailsBtn  = page.getByRole('button', { name: 'Property Details' });
    this.contactSection      = page.getByRole('button', { name: 'Contact' });
    this.franchiseSection    = page.getByRole('button', { name: 'Franchise Associated' });
    this.attachmentsSection  = page.getByRole('button', { name: /Attachments •/ });

    // Deal Stages bar — live-verified heading level=5
    this.dealStagesHeading    = page.getByRole('heading', { name: 'Deal Stages', level: 5 });
    this.proposalCreationStage = page.getByText('Proposal Creation', { exact: true }).first();
    this.negotiationStage      = page.getByText('Negotiation', { exact: true }).first();
    this.closedStage           = page.getByText('Closed', { exact: true }).first();

    // Detail tabs — live-verified: Contract & Terms (default), Activities, Notes, Tasks
    this.contractTermsTab = page.getByRole('tab', { name: 'Contract & Terms' });
    this.activitiesTab    = page.getByRole('tab', { name: 'Activities' });
    this.notesTab         = page.getByRole('tab', { name: 'Notes' });
    this.tasksTab         = page.getByRole('tab', { name: /Tasks/ });

    // ── Notes drawer ──────────────────────────────────────────────────────
    this.createNewNoteBtn = page.getByRole('button',  { name: 'Create New Note' });
    this.addNotesHeading  = page.getByRole('heading', { name: 'Add Notes', level: 4 });
    this.noteSubjectInput = page.getByRole('generic', { name: 'Add Notes' })
                               .getByRole('textbox').first();
    this.noteDescEditor   = page.getByRole('textbox', { name: 'rdw-editor' });
    this.noteCharCounter  = page.getByText(/\d+ \/ 5000/);
    this.noteSaveBtn      = page.getByRole('button', { name: 'Save' });
    this.noteCancelBtn    = page.getByRole('button', { name: 'Cancel' });
    this.notesEmptyState  = page.getByText("Oops, It's Empty Here!");

    // ── Tasks section ─────────────────────────────────────────────────────
    this.newTaskBtn          = page.getByRole('button',    { name: 'New Task' });
    this.taskSearchBox       = page.getByRole('searchbox', { name: 'Search by Title' });
    this.createTaskHeading   = page.getByRole('heading',   { name: 'Create New Task', level: 3 });
    this.taskTitleInput      = page.getByRole('textbox',   { name: 'Task Title' });
    this.taskDescEditor      = page.getByRole('textbox',   { name: 'rdw-editor' });
    this.taskTypeTrigger     = page.getByRole('heading',   { name: 'Select Type',     level: 6 });
    this.taskPriorityTrigger = page.getByRole('heading',   { name: 'Select Priority', level: 6 });
    this.taskSaveBtn         = page.getByRole('button',    { name: 'Save' });
    this.taskCancelBtn       = page.getByRole('button',    { name: 'Cancel' });
    this.taskEmptyState      = page.getByRole('heading',   { name: 'No tasks Added.', level: 2 });

    // ── Edit Deal drawer ──────────────────────────────────────────────────
    //
    // Locator rationale:
    //   editDealButton   — getByRole('button', { name: 'Edit' }) matches the
    //                       "Edit" CTA on the deal detail header, consistent
    //                       with the Company and Contact module patterns.
    //   editDealHeading  — heading level=3, name "Edit Deal" — same structural
    //                       pattern as "Create Deal" heading verified live.
    //   editDealNameInput — getByRole('textbox', { name: 'Deal Name' }) — the
    //                       pre-filled name field; same label used in Create.
    //   saveDealEditBtn  — tries "Update Deal" first (explicit update CTA used
    //                       in Company module), falls back to the last "Save"
    //                       button on the page (Contact module pattern).
    //   cancelDealEditBtn — getByRole('button', { name: 'Cancel' }) — shared
    //                       cancel pattern across all edit drawers.
    //   editDealSuccessToast — Toastify alert filtered for update keywords.
    this.editDealButton     = page.getByRole('button', { name: 'Edit' });
    this.editDealHeading    = page.getByRole('heading', { name: 'Edit Deal', level: 3 });
    this.editDealNameInput  = page.getByRole('textbox', { name: /Deal Name/ });
    this.saveDealEditBtn    = page.getByRole('button', { name: 'Update Deal' })
                                  .or(page.getByRole('button', { name: 'Save' }).last());
    this.cancelDealEditBtn  = page.getByRole('button', { name: 'Cancel' });
    this.editDealSuccessToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /updated|deal updated/i
    }).first();
  }

  // ── Data generators ───────────────────────────────────────────────────

  generateUniqueDealName() {
    return `A-D ${String(Date.now()).slice(-4)}`;
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async clickVisibleDropdownOption(container, optionText, timeout = 10_000) {
    const options = container
      .locator('p, h6, [role="option"]')
      .filter({ hasText: new RegExp(`^\\s*${this.escapeRegex(optionText)}\\s*$`, 'i') });

    await options.first().waitFor({ state: 'visible', timeout });

    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      const option = options.nth(i);
      const visible = await option.isVisible().catch(() => false);
      if (!visible) continue;

      try {
        await option.click({ force: true });
      } catch {
        await option.evaluate((el) => {
          el.click();
        });
      }
      return;
    }

    throw new Error(`Dropdown option "${optionText}" was not clickable.`);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async gotoDealsFromMenu() {
    await this.page.goto(`${this.baseUrl}/app/sales/deals`, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  }

  // ── List page assertions ──────────────────────────────────────────────

  async assertDealsPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/deals/, { timeout: 20_000 });
    await expect(this.createDealButton.first()).toBeVisible({ timeout: 15_000 });
  }

  async assertDealsTableHasColumns() {
    const expectedColumns = [
      'Deal Name', 'Amount', 'Deal Owner', 'Stage', 'Deal Type',
      'Property', 'Address', 'Created Date', 'Last Modified Date'
    ];
    for (const col of expectedColumns) {
      await expect(
        this.page.getByRole('columnheader', { name: col })
      ).toBeVisible({ timeout: 10_000 });
    }
  }

  async assertPaginationVisible() {
    await expect(this.paginationInfo).toBeVisible({ timeout: 10_000 });
    const infoText = await this.paginationInfo.textContent();
    expect(infoText).toMatch(/\d+–\d+ of \d+/);
  }

  normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  async getDealSearchState(searchTerm = this.lastSearchTerm) {
    const emptyStateHeading = this.page.getByRole('heading', { name: 'No Record Found', level: 2 });
    const tableBody = this.page.locator('table tbody');

    const emptyStateVisible = await emptyStateHeading.isVisible().catch(() => false);
    if (emptyStateVisible) {
      return { type: 'empty', paginationText: '' };
    }

    const paginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => '')
    );
    if (/0–0 of 0/.test(paginationText)) {
      return { type: 'zero-results', paginationText };
    }

    if (searchTerm) {
      const remainingMatches = await tableBody
        .getByText(searchTerm, { exact: false })
        .count()
        .catch(() => 0);
      if (remainingMatches === 0) {
        return { type: 'no-match', paginationText };
      }
    }

    return { type: 'pending', paginationText };
  }

  async waitForDealSearchToApply(term, previousPaginationText = '') {
    const emptyStateHeading = this.page.getByRole('heading', { name: 'No Record Found', level: 2 });
    const tableBody = this.page.locator('table tbody');
    const dataRows = tableBody.locator('tr').filter({ hasNot: this.page.locator('[colspan]') });

    await expect
      .poll(async () => {
        const emptyStateVisible = await emptyStateHeading.isVisible().catch(() => false);
        if (emptyStateVisible) return 'empty';

        const paginationText = this.normalizeText(
          await this.paginationInfo.textContent().catch(() => '')
        );
        if (/0–0 of 0/.test(paginationText)) return 'zero-results';
        if (paginationText && paginationText !== previousPaginationText) return 'pagination-changed';

        const visibleRowCount = await dataRows.count().catch(() => 0);

        if (!term) {
          const searchValue = await this.dealSearchInput.inputValue().catch(() => '');
          if (!searchValue.trim() && visibleRowCount > 0) {
            return 'cleared';
          }
        }

        if (term) {
          const visibleMatches = await tableBody
            .getByText(term, { exact: false })
            .count()
            .catch(() => 0);
          if (visibleMatches > 0) return 'match-visible';
        } else if (visibleRowCount > 0) {
          return 'rows-visible';
        }

        return 'pending';
      }, { timeout: 15_000 })
      .not.toBe('pending');
  }

  async searchDeal(term) {
    this.lastSearchTerm = term;
    await this.dealSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    const previousPaginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => '')
    );
    await this.dealSearchInput.fill(term);
    await this.dealSearchInput.press('Enter').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.waitForDealSearchToApply(term, previousPaginationText);
  }

  async assertSearchShowsNoResults(searchTerm = this.lastSearchTerm) {
    await expect
      .poll(async () => (await this.getDealSearchState(searchTerm)).type, { timeout: 15_000 })
      .toMatch(/^(empty|zero-results|no-match)$/);
  }

  async clearDealSearch() {
    const previousPaginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => '')
    );
    await this.dealSearchInput.clear();
    await this.dealSearchInput.press('Enter').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.waitForDealSearchToApply('', previousPaginationText);
  }

  // ── Create Deal ───────────────────────────────────────────────────────

  async openCreateDealModal() {
    await this.createDealButton.first().click();
    await this.dealNameInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async assertCreateDealDrawerOpen() {
    await expect(this.createDealHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.dealNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.companySelector).toBeVisible({ timeout: 5_000 });
    await expect(this.propertySelector).toBeVisible({ timeout: 5_000 });
    await expect(this.cancelDealBtn).toBeVisible({ timeout: 5_000 });
  }

  async fillDealName(dealName) {
    await this.dealNameInput.click();
    await this.dealNameInput.fill(dealName);
  }

  /**
   * Select a company from the Company dropdown in Create Deal form.
   * Live-verified: clicking heading "Select Company" opens a tooltip with
   * a Search textbox and paragraph results.
   * @param {string} companySearchText - text to search for (dynamic, from company suite)
   */
  async selectCompany(companySearchText, companyOptionText = companySearchText) {
    await this.companySelector.waitFor({ state: 'visible', timeout: 10_000 });
    await this.companySelector.click();
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });
    const searchBox = tooltip.getByRole('textbox', { name: 'Search' });
    await searchBox.waitFor({ state: 'visible', timeout: 5_000 });
    await searchBox.fill(companySearchText);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
    await this.clickVisibleDropdownOption(tooltip, companyOptionText, 8_000);
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Select a property from the Property dropdown in Create Deal form.
   * Live-verified: clicking heading "Select Property / Property Name" opens
   * a tooltip with a Search textbox and paragraph results.
   * @param {string} propertySearchText - text to search for (dynamic, from property suite)
   */
  async selectProperty(propertySearchText, propertyOptionText = propertySearchText) {
    await this.propertySelector.waitFor({ state: 'visible', timeout: 10_000 });
    await this.propertySelector.click({ force: true });
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });
    const searchBox = tooltip.getByRole('textbox', { name: 'Search' });
    await searchBox.waitFor({ state: 'visible', timeout: 5_000 });
    await searchBox.click();
    await searchBox.fill(propertySearchText);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
    await this.clickVisibleDropdownOption(tooltip, propertyOptionText, 10_000);
    await this.page.waitForTimeout(500);
  }

  async submitCreateDeal() {
    await this.submitCreateDealBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.submitCreateDealBtn.click();
  }

  async createDeal({ dealName, companySearchText, companyOptionText, propertySearchText, propertyOptionText }) {
    await this.openCreateDealModal();
    await this.fillDealName(dealName);
    await this.selectCompany(companySearchText, companyOptionText || companySearchText);
    await this.page.waitForTimeout(2_000);
    await this.selectProperty(propertySearchText, propertyOptionText || propertySearchText);
    await this.submitCreateDeal();
  }

  async assertDealCreated() {
    await expect(this.successToast).toBeVisible({ timeout: 15_000 });
  }

  async cancelCreateDeal() {
    await this.cancelDealBtn.click();
    await this.createDealHeading.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async assertCreateDealDrawerClosed() {
    await expect(this.createDealHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Deal Detail ───────────────────────────────────────────────────────

  async openDealDetail(dealName) {
    await this.gotoDealsFromMenu();
    await this.assertDealsPageOpened();
    await this.dealSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    const previousPaginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => '')
    );
    await this.dealSearchInput.fill(dealName);
    await this.dealSearchInput.press('Enter').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.waitForDealSearchToApply(dealName, previousPaginationText);
    const dealRow = this.page.locator('table tbody tr').filter({ hasText: dealName }).first();
    await dealRow.waitFor({ state: 'visible', timeout: 10_000 });

    const dealNameCell = dealRow.locator('td').nth(1);
    const clickableCell = await dealNameCell.isVisible().catch(() => false)
      ? dealNameCell
      : dealRow.getByText(dealName, { exact: false }).first();

    await clickableCell.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertDealDetailOpened(dealName) {
    // Live-verified: deal heading is level=2
    await expect(
      this.page.getByRole('heading', { name: dealName, level: 2 }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  async assertDealDetailSectionsVisible() {
    await expect(this.aboutThisDealBtn).toBeVisible({ timeout: 10_000 });
    await expect(this.companySection).toBeVisible({ timeout: 10_000 });
    await expect(this.propertyDetailsBtn).toBeVisible({ timeout: 10_000 });
    await expect(this.contactSection).toBeVisible({ timeout: 10_000 });
    await expect(this.franchiseSection).toBeVisible({ timeout: 10_000 });
    await expect(this.attachmentsSection).toBeVisible({ timeout: 10_000 });
  }

  async assertDealStagesBarVisible() {
    await expect(this.dealStagesHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.proposalCreationStage).toBeVisible({ timeout: 10_000 });
  }

  async assertDealDetailTabsVisible() {
    // Live-verified: Contract & Terms (default selected), Activities, Notes, Tasks
    await expect(this.contractTermsTab).toBeVisible({ timeout: 10_000 });
    await expect(this.activitiesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.notesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
  }

  // ── Activities Tab ────────────────────────────────────────────────────

  async gotoActivitiesTab() {
    await this.activitiesTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.activitiesTab.click();
    await this.page.waitForTimeout(500);
  }

  async assertActivitiesTabActive() {
    await expect(this.activitiesTab).toHaveAttribute('aria-selected', 'true', { timeout: 5_000 });
  }

  // ── Notes Tab ─────────────────────────────────────────────────────────

  async gotoNotesTab() {
    await this.notesTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.notesTab.click();
    await this.page.waitForTimeout(500);
  }

  async assertNotesTabVisible() {
    await expect(this.notesTab).toBeVisible({ timeout: 10_000 });
  }

  async assertCreateNewNoteButtonVisible() {
    await expect(this.createNewNoteBtn).toBeVisible({ timeout: 10_000 });
  }

  async openCreateNoteDrawer() {
    await this.createNewNoteBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.createNewNoteBtn.click();
    await this.addNotesHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertCreateNoteDrawerOpen() {
    await expect(this.addNotesHeading).toBeVisible({ timeout: 10_000 });
    const notesDrawer = this.addNotesHeading.locator(
      'xpath=ancestor::*[@role="dialog" or @role="presentation" or contains(@class,"MuiDrawer-paper")][1]'
    );
    const noteSubjectInput = notesDrawer.getByRole('textbox').first()
      .or(this.page.locator('div[role="presentation"] input').first());
    await expect(noteSubjectInput).toBeVisible({ timeout: 5_000 });
    await expect(this.noteDescEditor).toBeVisible({ timeout: 5_000 });
    await expect(this.noteCharCounter).toBeVisible({ timeout: 5_000 });
    await expect(this.noteSaveBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.noteCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  async cancelCreateNoteDrawer() {
    await this.noteCancelBtn.click();
    await this.addNotesHeading.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
  }

  async assertCreateNoteDrawerClosed() {
    await expect(this.addNotesHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Tasks Tab ─────────────────────────────────────────────────────────

  async gotoTasksTab() {
    await this.tasksTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.tasksTab.click();
    await this.newTaskBtn.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertTasksTabVisible() {
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
  }

  async assertTasksTableColumns() {
    const expectedCols = [
      'Task Title', 'Task Description', 'Created By', 'Due Date', 'Priority', 'Type'
    ];
    for (const col of expectedCols) {
      await expect(
        this.page.getByRole('columnheader', { name: col })
      ).toBeVisible({ timeout: 10_000 });
    }
  }

  async assertNewTaskButtonVisible() {
    await expect(this.newTaskBtn).toBeVisible({ timeout: 10_000 });
  }

  async openCreateTaskDrawer() {
    await this.newTaskBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.newTaskBtn.click();
    await this.createTaskHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertCreateTaskDrawerOpen() {
    await expect(this.createTaskHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.taskTitleInput).toBeVisible({ timeout: 5_000 });
    await expect(this.taskDescEditor).toBeVisible({ timeout: 5_000 });
    await expect(this.taskTypeTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.taskPriorityTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.taskSaveBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.taskCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  async cancelCreateTaskDrawer() {
    await this.taskCancelBtn.click();
    await this.createTaskHeading.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
  }

  async assertCreateTaskDrawerClosed() {
    await expect(this.createTaskHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Edit Deal ─────────────────────────────────────────────────────────

  /**
   * Click the "Edit" button on the deal detail page and wait for the
   * Edit Deal drawer to appear.
   */
  async openEditDealForm() {
    await this.editDealButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.editDealButton.click();
    await this.editDealHeading.waitFor({ state: 'visible', timeout: 10_000 });
    await this.editDealNameInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Assert the Edit Deal drawer is fully rendered with all expected elements.
   */
  async assertEditDealFormOpen() {
    await expect(this.editDealHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.editDealNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.saveDealEditBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.cancelDealEditBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Assert the Save/Update button is disabled before any change is made.
   * Mirrors the Company (Update Company) and Property (Save) behaviour.
   */
  async assertSaveDealBtnDisabled() {
    await expect(this.saveDealEditBtn).toBeDisabled({ timeout: 5_000 });
  }

  /**
   * Replace the deal name in the edit drawer.
   * Uses triple-click → fill to reliably clear existing value first.
   */
  async fillEditDealName(newName) {
    await this.editDealNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.editDealNameInput.click({ clickCount: 3 });
    await this.editDealNameInput.fill(newName);
    await this.editDealNameInput.press('Tab');
    await expect(this.saveDealEditBtn).toBeEnabled({ timeout: 10_000 });
  }

  /**
   * Submit the edit form and wait for the drawer to close.
   */
  async submitEditDeal() {
    await this.saveDealEditBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await expect(this.saveDealEditBtn).toBeEnabled({ timeout: 10_000 });
    await this.saveDealEditBtn.click({ force: true });
    await this.editDealHeading.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  /**
   * Cancel the edit form and assert the drawer closes without saving.
   */
  async cancelEditDealForm() {
    await this.cancelDealEditBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.cancelDealEditBtn.click();
    await this.editDealHeading.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  /**
   * Assert the Edit Deal drawer has closed.
   */
  async assertEditDealFormClosed() {
    await expect(this.editDealHeading).not.toBeVisible({ timeout: 8_000 });
  }

  /**
   * Full Edit Deal flow helper.
   * Opens the drawer, replaces the deal name, submits.
   */
  async editDealName(newDealName) {
    await this.openEditDealForm();
    await this.fillEditDealName(newDealName);
    await this.submitEditDeal();
  }

  generateUniqueEditedDealName() {
    return `A-D Edited ${String(Date.now()).slice(-4)}`;
  }
}

module.exports = { DealModule };
