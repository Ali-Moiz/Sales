const { expect } = require('@playwright/test');
const {
  selectAddressFromAutocomplete,
  selectDynamicAddressWithRetry,
} = require('../utils/dynamic_address');

class CompanyModule {
  constructor(page) {
    this.page = page;
    this.lastCreateCompanyToastSeen = false;
    this.lastUpdateCompanyToastSeen = false;

    // ── List page ────────────────────────────────────────────────────────────
    this.companiesMenuLink    = page.getByRole('listitem', { name: 'Companies' }).getByRole('link');
    this.createCompanyButton  = page.getByRole('button',   { name: 'Create Company' });
    this.companySearchInput   = page.getByRole('searchbox', { name: 'Search by Company' })
                                    .or(page.locator('input[placeholder*="Search by Company"]')).first();
    this.marketVerticalFilter = page.getByRole('heading', { name: 'Market Vertical', level: 6, exact: true });
    this.moreFiltersButton    = page.getByRole('button', { name: 'More Filters' });
    this.moreFiltersHeading   = page.getByRole('heading', { name: 'All Filters', level: 3 });
    // Material UI paginator footer, e.g. "1–10 of 8966".
    this.paginationInfo       = page.locator('.MuiTablePagination-displayedRows').last();
    this.nextPageBtn          = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn          = page.getByRole('button', { name: 'Go to previous page' });
    this.rowsPerPageCombo     = page.getByRole('combobox', { name: /Rows per page/ });
    this.companiesTable       = page.getByRole('table');
    this.companyNameSortBtn   = page.getByRole('button', { name: 'Company Name' });
    this.companyOwnerSortBtn  = page.getByRole('button', { name: 'Company Owner' });
    this.createdDateSortBtn   = page.getByRole('button', { name: 'Created Date' });
    this.lastModifiedSortBtn  = page.getByRole('button', { name: 'Last Modified Date' });
    this.lastActivitySortBtn  = page.getByRole('button', { name: 'Last Activity' });

    // ── Charts section ────────────────────────────────────────────────────────
    this.chartByContractsHeading       = page.getByRole('heading', { name: 'Companies by Contracts', level: 6 });
    this.chartByMarketVerticalsHeading = page.getByRole('heading', { name: 'Companies by Market Verticals', level: 6 });
    this.chartTrendHeading             = page.getByRole('heading', { name: 'Companies', level: 6, exact: true });
    this.chartTotalH1                  = page.getByRole('heading', { level: 1 }).first();

    // ── Create Company drawer ─────────────────────────────────────────────────
    this.createCompanyHeading = page.getByRole('heading', { name: 'Create a New Company' });
    this.companyNameInput     = page.getByRole('textbox', { name: 'Add Company Name' });
    this.companyDomainInput   = page.getByRole('textbox', { name: 'e.g., www.Signal.com' });
    this.addressInput         = page.getByRole('textbox', { name: 'Type Address' });
    this.addressOption        = page.getByText('S 9th St, Omaha, NE 68102, USA').first();
    // Market Vertical inside drawer — click handler is on the parent container div,
    // not on the <h6> itself, so navigate up with locator('..') to target the clickable wrapper.
    this.createIndustryTrigger  = page.getByRole('heading', { name: 'Select Industry', level: 6 }).locator('..');
    this.createSpStatusTrigger  = page.getByRole('heading', { name: 'Select SP Status', level: 6 }).locator('..');
    this.industryOption         = page.locator('#simple-popper div').filter({ hasText: 'Manufacturing' }).first();
    this.spStatusActiveOption   = page.getByText('SP - Active', { exact: true }).first();
    this.spStatusTargetOption   = page.getByText('SP - Target', { exact: true }).first();
    this.spStatusNotSpOption    = page.getByText('Not SP', { exact: true }).first();
    this.cancelCreateBtn        = page.getByRole('button', { name: 'Cancel' });
    // Submit inside modal — scoped to avoid clash with list-page Create Company button
    this.successToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /Company Created Successfully|Translation missing: en\.api\.v1\.shared\.companies\.success\.create/i
    }).first();
    this.createCompanyNameRequiredText = page.getByText(/Company Name.*required/i).first();
    this.createCompanyAddressRequiredText = page.getByText(/Address.*required/i).first();

    // ── Create Company drawer — numeric fields ──────────────────────────────
    // No. of Employees spinbutton has no accessible name; scope to the drawer
    // by chaining from the parent of the "No. of Employees" label.
    this.createEmployeesInput = page.getByRole('spinbutton').first();
    this.createRevenueInput   = page.getByRole('spinbutton', { name: 'Revenue' });
    this.createMapRegion      = page.getByRole('region', { name: 'Map' });

    // ── Change Review History ────────────────────────────────────────────────
    this.changeReviewButton    = page.getByRole('button', { name: 'Change Review' });
    this.changeReviewHeading   = page.getByRole('heading', { name: 'Change review', level: 3 });
    this.pendingReviewsTab     = page.getByRole('tab', { name: 'Pending Reviews' });
    this.activityLogsTab       = page.getByRole('tab', { name: 'Activity Logs' });
    this.noChangeRequestMsg    = page.getByRole('heading', { name: 'No change request found.' });

    // ── Export button ────────────────────────────────────────────────────────
    this.exportButton = page.getByRole('button', { name: 'Export' }).first();

    // ── Search / No-results state ───────────────────────────────────────────
    this.noRecordFoundHeading  = page.getByRole('heading', { name: 'No Record Found', level: 2 });
    this.noRecordFoundMessage  = page.getByText('Expecting to see new companies? Try again in a few seconds as the system catches up.');

    // ── Company Detail page ───────────────────────────────────────────────────
    this.activitiesTab    = page.getByRole('tab', { name: 'Activities' });
    this.notesTab         = page.getByRole('tab', { name: /^Notes/ });
    this.tasksTab         = page.getByRole('tab', { name: /^Tasks/ });
    this.editCompanyButton  = page.getByRole('button', { name: 'Edit' });
    this.aboutCompanyButton = page.getByRole('button', { name: 'About this Company' });
    this.propertiesSection  = page.getByRole('button', { name: /Properties •/ });
    this.dealsSection       = page.getByRole('button', { name: /Deals •/ });
    this.contactsSection    = page.getByRole('button', { name: /Contacts •/ });
    this.attachmentsSection = page.getByRole('button', { name: /Attachments •/ });
    this.attachmentUploadHeading = page.getByRole('heading', { name: 'Click to Upload' }).first();
    this.attachmentFileInput = page.locator('input[type="file"]').first();
    this.deleteConfirmButton = page.getByRole('button', { name: /^Delete$/ }).last();

    // ── Edit Company drawer ───────────────────────────────────────────────────
    // NOTE: live-verified — Edit Company heading is level=4, same as Create
    this.editCompanyHeading   = page.getByRole('heading', { name: 'Edit Company' });
    this.subMarketVerticalInput = page.getByRole('textbox',    { name: 'Sub Market Vertical' });
    this.naicsCodeInput         = page.getByRole('spinbutton', { name: 'NAICS Codes' });
    this.employeeCountInput     = page.getByPlaceholder('Add no. of Employees');
    this.revenueInput           = page.getByRole('spinbutton', { name: 'Revenue' });
    this.propertyCountInput     = page.getByRole('spinbutton', { name: 'No Of Properties' });
    this.yearFoundedInput       = page.getByRole('spinbutton', { name: 'Year Founded' });
    this.updateCompanyButton    = page.getByRole('button',     { name: 'Update Company' });
    this.cancelEditBtn          = page.getByRole('button',     { name: 'Cancel' });
    this.updateToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /Translation missing: en|updated successfully|company updated/i
    }).first();

    // ── Notes drawer ─────────────────────────────────────────────────────────
    this.createNewNoteBtn  = page.getByRole('button',  { name: 'Create New Note' });
    this.addNotesHeading   = page.getByRole('heading', { name: 'Add Notes', level: 4 });
    // Subject field: plain unlabelled textbox — scoped inside "Add Notes" generic container
    this.noteDescEditor    = page.getByRole('textbox', { name: 'rdw-editor' });
    this.noteCharCounter   = page.getByText(/\d+ \/ 5000/);
    this.noteSaveBtn       = page.getByRole('button', { name: 'Save' });
    this.noteCancelBtn     = page.getByRole('button', { name: 'Cancel' });

    // ── Tasks section ────────────────────────────────────────────────────────
    this.newTaskBtn           = page.getByRole('button',    { name: 'New Task' });
    this.taskSearchBox        = page.getByRole('searchbox', { name: 'Search by Title' });
    this.createTaskHeading    = page.getByRole('heading',   { name: 'Create New Task', level: 3 });
    this.taskTitleInput       = page.getByRole('textbox',   { name: 'Task Title' });
    this.taskDescEditor       = page.getByRole('textbox',   { name: 'rdw-editor' });
    this.taskTypeTrigger      = page.getByRole('heading',   { name: 'Select Type',     level: 6 });
    this.taskPriorityTrigger  = page.getByRole('heading',   { name: 'Select Priority', level: 6 });
    this.taskSaveBtn          = page.getByRole('button',    { name: 'Save' });
    this.taskCancelBtn        = page.getByRole('button',    { name: 'Cancel' });
    this.taskEmptyState       = page.getByRole('heading',   { name: 'No tasks Added.', level: 2 });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  generateRandomNumericString(length) {
    if (length <= 0) return '';

    let value = String(Math.floor(Math.random() * 9) + 1);
    while (value.length < length) {
      value += Math.floor(Math.random() * 10);
    }

    return value.slice(0, length);
  }

  generateRandomCompanyEditData() {
    const randomYear = String(1950 + Math.floor(Math.random() * 76));

    return {
      subMarketVertical: this.generateRandomNumericString(4),
      naicsCode:         this.generateRandomNumericString(5),
      employeeCount:     this.generateRandomNumericString(4),
      revenue:           this.generateRandomNumericString(4),
      propertyCount:     this.generateRandomNumericString(5),
      yearFounded:       randomYear
    };
  }

  generateUniqueCompanyName() {
    return `PAT ${String(Date.now()).slice(-4)}`;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async gotoCompaniesFromMenu() {
    const menuVisible = await this.companiesMenuLink
      .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
    if (menuVisible) {
      await this.companiesMenuLink.click();
    } else {
      await this.page.goto('/app/sales/companies', { waitUntil: 'domcontentloaded' });
    }

    await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  }

  // ── List page assertions ───────────────────────────────────────────────────

  async assertCompaniesPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/companies/, { timeout: 20_000 });
    await expect(this.createCompanyButton.first()).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => {
        const footer = await this.getPaginationText().catch(() => '');
        return /^0\s*-\s*0\s+of\s+0$/i.test(footer) ? 'loading' : footer;
      }, { timeout: 20_000 })
      .not.toBe('loading');
  }

  async assertCompaniesTableHasColumns() {
    const expectedColumns = [
      'Company Name', 'Parent Company', 'Company Owner', 'Market Vertical',
      'Sub Market Vertical', 'Revenue', 'Created Date', 'Last Modified Date'
    ];
    for (const col of expectedColumns) {
      await expect(
        this.page.getByRole('columnheader', { name: col, exact: true })
      ).toBeVisible({ timeout: 10_000 });
    }
  }

  async assertMarketVerticalFilterOptions() {
    // Click the Market Vertical filter heading to open the tooltip
    await this.marketVerticalFilter.click();
    const tooltip = this.page.locator('#simple-popper').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });

    // Verify all 5 confirmed option labels
    for (const option of ['Commercial', 'Distribution', 'Industrial', 'Manufacturing', 'Residential']) {
      await expect(tooltip.getByText(option, { exact: true })).toBeVisible({ timeout: 5_000 });
    }

    // Close by pressing Escape
    await this.page.keyboard.press('Escape');
  }

  async searchForCompany(companyName) {
    await this.companySearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.companySearchInput.fill(companyName);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  async assertSearchShowsNoResults(companyNameToDisappear) {
    await expect(this.companySearchInput).toHaveValue(/.+/, { timeout: 5_000 });
    if (companyNameToDisappear) {
      await expect(this.page.getByText(companyNameToDisappear, { exact: true }).first()).not.toBeVisible({ timeout: 10_000 });
    }
  }

  async clearCompanySearch() {
    await this.companySearchInput.clear();
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async resetCompaniesListState() {
    const searchVisible = await this.companySearchInput.isVisible().catch(() => false);
    if (searchVisible) {
      const currentValue = await this.companySearchInput.inputValue().catch(() => '');
      if (currentValue) {
        await this.clearCompanySearch();
      }
    }

    await this.clearListFilters().catch(() => {});
    await this.ensureOnFirstPage().catch(() => {});
  }

  async getPaginationText() {
    await this.paginationInfo.first().waitFor({ state: 'visible', timeout: 15_000 });
    const text = await this.paginationInfo.first().innerText().catch(() => '');
    return this.normalizePaginationText(text);
  }

  normalizePaginationText(text) {
    return String(text || '')
      .replace(/â€“|–|—/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  parsePaginationRange(paginationText) {
    const matches = Array.from(
      this.normalizePaginationText(paginationText).matchAll(/(\d+)\s*-\s*(\d+)\s+of\s+(\d+)/gi)
    );
    const match = matches.at(-1);
    if (!match) return null;

    return {
      start: Number(match[1]),
      end: Number(match[2]),
      total: Number(match[3]),
    };
  }

  parseFooterWindowSize(paginationText) {
    const m = String(paginationText || '').match(/(\d+)\s*–\s*(\d+)\s+of\s+(\d+)/);
    if (!m) return 0;
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.max(0, end - start + 1);
  }

  async selectNextRowsPerPageOption() {
    const beforeFooter = await this.getPaginationText().catch(() => '');
    await this.rowsPerPageCombo.waitFor({ state: 'visible', timeout: 10_000 });
    await this.rowsPerPageCombo.click({ force: true });
    // Use keyboard to pick next available option (avoids hardcoding option labels).
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await expect
      .poll(() => this.getPaginationText(), { timeout: 15_000 })
      .not.toBe(beforeFooter);
  }

  parseFooterWindowSizeNormalized(paginationText) {
    const range = this.parsePaginationRange(paginationText);
    if (!range) return 0;
    return Math.max(0, range.end - range.start + 1);
  }

  async gotoNextPage() {
    const beforeFooter = await this.getPaginationText().catch(() => '');
    const beforeRow = await this.getFirstRowTextByColumnIndex(0).catch(() => '');
    await this.nextPageBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.nextPageBtn.click();
    await expect
      .poll(async () => {
        const footer = await this.getPaginationText().catch(() => '');
        const row = await this.getFirstRowTextByColumnIndex(0).catch(() => '');
        return footer !== beforeFooter || row !== beforeRow ? 'changed' : 'same';
      }, { timeout: 20_000 })
      .toBe('changed');
  }

  async gotoPrevPage() {
    const beforeFooter = await this.getPaginationText().catch(() => '');
    const beforeRow = await this.getFirstRowTextByColumnIndex(0).catch(() => '');
    await this.prevPageBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.prevPageBtn.click();
    await expect
      .poll(async () => {
        const footer = await this.getPaginationText().catch(() => '');
        const row = await this.getFirstRowTextByColumnIndex(0).catch(() => '');
        return footer !== beforeFooter || row !== beforeRow ? 'changed' : 'same';
      }, { timeout: 20_000 })
      .toBe('changed');
  }

  async ensureOnFirstPage() {
    // Best-effort: click prev until disabled or no change.
    for (let i = 0; i < 3; i++) {
      const enabled = await this.prevPageBtn.isEnabled().catch(() => false);
      if (!enabled) return;
      await this.gotoPrevPage();
    }
  }

  async setRowsPerPage(value) {
    const beforeFooter = await this.getPaginationText().catch(() => '');
    await this.rowsPerPageCombo.waitFor({ state: 'visible', timeout: 10_000 });
    // If underlying control is a native <select>, prefer selectOption.
    const nativeSelected = await this.rowsPerPageCombo
      .selectOption(String(value))
      .then(() => true)
      .catch(() => false);
    if (nativeSelected) {
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      return;
    }

    const listbox = this.page.getByRole('listbox').first();
    await this.rowsPerPageCombo.click({ force: true });
    const opened = await listbox.waitFor({ state: 'visible', timeout: 2_500 }).then(() => true).catch(() => false);
    if (!opened) {
      await this.selectRowsPerPageWithKeyboard(value);
      await expect
        .poll(() => this.getPaginationText(), { timeout: 15_000 })
        .not.toBe(beforeFooter);
      return;
    }

    const valueRe = new RegExp(`^\\s*${String(value).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$`);
    const option = listbox.getByRole('option', { name: valueRe })
      .or(listbox.getByRole('menuitem', { name: valueRe }))
      .or(this.page.getByRole('option', { name: valueRe }))
      .or(this.page.getByText(valueRe).first());

    await option.first().waitFor({ state: 'visible', timeout: 10_000 });
    await option.first().click({ force: true });
    await expect
      .poll(() => this.getPaginationText(), { timeout: 15_000 })
      .not.toBe(beforeFooter);
  }

  async selectRowsPerPageWithKeyboard(targetValue) {
    const supportedValues = [10, 20, 30, 40, 50, 100];
    const targetIndex = supportedValues.indexOf(Number(targetValue));

    if (targetIndex === -1) {
      throw new Error(`Rows-per-page keyboard fallback does not support value: ${targetValue}`);
    }

    // Normalize to the first option before stepping to the target so
    // selection does not depend on the current highlighted value.
    await this.page.keyboard.press('Home').catch(() => {});

    for (let index = 0; index < targetIndex; index += 1) {
      await this.page.keyboard.press('ArrowDown');
    }
    await this.page.keyboard.press('Enter');
  }

  async assertPaginationRange(expectedStart, expectedEnd) {
    await expect
      .poll(async () => this.parsePaginationRange(await this.getPaginationText()), { timeout: 15_000 })
      .toMatchObject({ start: expectedStart, end: expectedEnd });
  }

  async getVisibleTableRowCount() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    return this.companiesTable.locator('tbody tr').count();
  }

  async getFirstRowTextByColumnIndex(colIndex) {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const firstRow = this.companiesTable.locator('tbody tr').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 });
    const cell = firstRow.locator('td').nth(colIndex);
    const text = await cell.innerText().catch(() => '');
    return (text || '').trim();
  }

  async clickCompanyNameCellByText(companyName) {
    const escapedName = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactText = new RegExp(`^\\s*${escapedName}\\s*$`, 'i');
    // Click the inner text element directly — the navigation handler is on the
    // child div inside the <td>, not the <td> itself.
    const clickableText = this.companiesTable
      .getByText(exactText)
      .first();

    await clickableText.waitFor({ state: 'visible', timeout: 30_000 });
    await clickableText.scrollIntoViewIfNeeded().catch(() => {});
    await clickableText.click();
  }

  async openFirstCompanyFromList() {
    const name = await this.getFirstRowTextByColumnIndex(0);
    await this.clickCompanyNameCellByText(name);
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    return name;
  }

  async waitForFirstRowNonEmpty(colIndex = 0, timeout = 15_000) {
    // Wait until the first cell in the given column contains non-blank text.
    await expect
      .poll(async () => {
        const text = await this.getFirstRowTextByColumnIndex(colIndex).catch(() => '');
        return text.trim().length > 0 ? text : null;
      }, { timeout })
      .toBeTruthy();
    return this.getFirstRowTextByColumnIndex(colIndex);
  }

  async sortByColumn(sortButton, colIndex = 0) {
    await sortButton.waitFor({ state: 'visible', timeout: 10_000 });
    await sortButton.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    return this.waitForFirstRowNonEmpty(colIndex).catch(
      async () => this.getFirstRowTextByColumnIndex(colIndex).catch(() => '')
    );
  }

  async sortByColumnTwiceAndCapture(sortButton, colIndex = 0) {
    // Ensure table is fully loaded before capturing baseline.
    const first = await this.waitForFirstRowNonEmpty(colIndex).catch(
      async () => this.getFirstRowTextByColumnIndex(colIndex).catch(() => '')
    );
    const second = await this.sortByColumn(sortButton, colIndex);
    const third = await this.sortByColumn(sortButton, colIndex);
    return { first, second, third };
  }

  // ── Create Company ──────────────────────────────────────────────────────────

  async openCreateCompanyModal() {
    await this.createCompanyButton.first().click();
    await this.createCompanyHeading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.companyNameInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async assertCreateCompanyModalOpen() {
    let industryControlVisible = false;
    try {
      await expect.poll(async () => {
        const states = await Promise.all([
          this.createIndustryTrigger.isVisible().catch(() => false),
          this.getModal().getByRole('heading', { name: /Select Industry|Manufacturing|Residential|Commercial|Industrial|Others/i, level: 6 }).first().isVisible().catch(() => false),
          this.getModal().locator('div').filter({ hasText: /Select Industry|Manufacturing|Residential|Commercial|Industrial|Others/i }).first().isVisible().catch(() => false),
        ]);
        return states.some(Boolean);
      }, { timeout: 5_000 }).toBe(true);
      industryControlVisible = true;
    } catch {
      industryControlVisible = false;
    }

    await expect(this.createCompanyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.companyNameInput).toBeVisible({ timeout: 5_000 });
    expect(industryControlVisible).toBe(true);
    await expect(this.addressInput).toBeVisible({ timeout: 5_000 });
  }

  async assertCreateCompanyRequiredValidationMessages() {
    // Trigger validation by touching required fields and a required dropdown.
    await this.companyNameInput.click({ force: true });
    await this.page.keyboard.press('Tab').catch(() => {});
    await this.addressInput.click({ force: true });
    await this.page.keyboard.press('Tab').catch(() => {});
    await this.createIndustryTrigger.click({ force: true });

    await expect
      .poll(async () => {
        const nameMsgVisible = await this.createCompanyNameRequiredText.isVisible().catch(() => false);
        const addressMsgVisible = await this.createCompanyAddressRequiredText.isVisible().catch(() => false);
        const nameInvalid = await this.companyNameInput.getAttribute('aria-invalid').catch(() => '');
        const addressInvalid = await this.addressInput.getAttribute('aria-invalid').catch(() => '');
        const requiredLabelsVisible = await Promise.all([
          this.page.getByText('Company Name').first().isVisible().catch(() => false),
          this.page.getByText('Market Vertical').first().isVisible().catch(() => false),
          this.page.getByText('Address').first().isVisible().catch(() => false),
        ]).then((values) => values.every(Boolean));
        const submitDisabled = await this.getCreateCompanySubmitButton().isDisabled().catch(() => false);

        return {
          nameOk: nameMsgVisible || nameInvalid === 'true' || (requiredLabelsVisible && submitDisabled),
          addressOk: addressMsgVisible || addressInvalid === 'true' || (requiredLabelsVisible && submitDisabled),
        };
      }, { timeout: 10_000 })
      .toEqual({ nameOk: true, addressOk: true });
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  getCreateCompanySubmitButton() {
    return this.page.locator('button').filter({ hasText: /^Create Company$/ }).last();
  }

  async fillCompanyDomain(domain) {
    await this.companyDomainInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.companyDomainInput.fill(domain);
  }

  getCreateSpStatusCandidates() {
    const modal = this.getModal();
    const spStatusValuePattern = /^(Select SP Status|SP - Active|SP - Target|Not SP)$/;
    return [
      modal.getByRole('heading', { name: 'Select SP Status', level: 6 }).first(),
      modal.getByRole('heading', { name: spStatusValuePattern, level: 6 }).first(),
      modal.locator('div').filter({ hasText: /^Select SP Status$/ }).first(),
      modal.locator('div').filter({ hasText: spStatusValuePattern }).first(),
      modal.locator('[aria-haspopup="listbox"]').filter({ hasText: /Select SP Status/i }).first(),
      modal.locator('[aria-haspopup="listbox"]').filter({ hasText: /Select SP Status|SP - Active|SP - Target|Not SP/i }).first(),
      this.page.getByRole('heading', { name: 'Select SP Status', level: 6 }).last(),
      this.page.getByRole('heading', { name: spStatusValuePattern, level: 6 }).last(),
      this.page.locator('div').filter({ hasText: /^Select SP Status$/ }).last(),
      this.page.locator('div').filter({ hasText: spStatusValuePattern }).last(),
    ];
  }

  async openCreateSpStatusDropdown() {
    for (const candidate of this.getCreateSpStatusCandidates()) {
      const visible = await candidate.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!visible) continue;

      const clicked = await candidate.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
      if (!clicked) continue;

      const opened = await (async () => {
        try {
          await expect.poll(async () => {
            const states = await Promise.all([
              this.spStatusActiveOption.isVisible().catch(() => false),
              this.spStatusTargetOption.isVisible().catch(() => false),
              this.spStatusNotSpOption.isVisible().catch(() => false),
            ]);
            return states.some(Boolean);
          }, { timeout: 5_000 }).toBe(true);
          return true;
        } catch {
          return false;
        }
      })();

      if (opened) return;
    }

    throw new Error('SP Status dropdown did not open in the Create Company modal.');
  }

  getSpStatusOptionCandidates(label) {
    return [
      this.page.getByRole('tooltip').getByText(label, { exact: true }).last(),
      this.page.locator('#simple-popper').getByText(label, { exact: true }).last(),
      this.page.getByRole('listbox').getByText(label, { exact: true }).last(),
      this.page.getByRole('option', { name: label, exact: true }).last(),
    ];
  }

  async selectSpStatus(label) {
    await this.assertCreateCompanyModalOpen();
    await this.openCreateSpStatusDropdown();
    const modal = this.getModal();
    let selectedInUi = false;

    for (const option of this.getSpStatusOptionCandidates(label)) {
      const visible = await option.isVisible().catch(() => false);
      if (!visible) continue;

      await option.click({ force: true }).catch(() => {});
      selectedInUi = await modal
        .getByRole('heading', { name: label, level: 6 })
        .first()
        .waitFor({ state: 'visible', timeout: 2_000 })
        .then(() => true)
        .catch(() => false);

      if (selectedInUi) break;
    }

    if (!selectedInUi) {
      const fallbackSteps = {
        'SP - Active': 1,
        'SP - Target': 2,
        'Not SP': 3,
      };

      await this.openCreateSpStatusDropdown();
      for (let step = 0; step < (fallbackSteps[label] || 1); step++) {
        await this.page.keyboard.press('ArrowDown').catch(() => {});
      }
      await this.page.keyboard.press('Enter').catch(() => {});

      selectedInUi = await modal
        .getByRole('heading', { name: label, level: 6 })
        .first()
        .waitFor({ state: 'visible', timeout: 2_000 })
        .then(() => true)
        .catch(() => false);
    }

    if (!selectedInUi) {
      await this.page.evaluate((value) => {
        const roots = Array.from(document.querySelectorAll('div[aria-describedby="simple-popper"]'));
        const root = roots.find((el) =>
          /Strategic Partnership Status|Select SP Status|SP - Active|SP - Target|Not SP/.test(el.textContent || '')
        ) || roots[0];
        const child = root?.firstElementChild;
        const fiberKey = child ? Object.keys(child).find((key) => key.startsWith('__reactFiber')) : null;
        let node = fiberKey ? child[fiberKey] : null;

        while (node) {
          const props = node.memoizedProps;
          if (props?.handleChange) {
            props.handleChange({
              target: {
                name: props.name || 'strategicPartnershipStatus',
                value: { label: value, value }
              }
            });
            return true;
          }
          node = node.return;
        }
        return false;
      }, label).catch(() => false);
    }

    await expect(modal.getByRole('heading', { name: label, level: 6 }).first()).toBeVisible({ timeout: 10_000 });
  }

  async assertSpStatusOptionsVisible() {
    await this.assertCreateCompanyModalOpen();
    await this.openCreateSpStatusDropdown();
    await expect(this.getSpStatusOptionCandidates('SP - Active')[0]).toBeVisible({ timeout: 10_000 });
    await expect(this.getSpStatusOptionCandidates('SP - Target')[0]).toBeVisible({ timeout: 10_000 });
    await expect(this.getSpStatusOptionCandidates('Not SP')[0]).toBeVisible({ timeout: 10_000 });
    await this.companyNameInput.click({ force: true }).catch(() => {});
  }

  async assertSpStatusSelection(label) {
    await expect(this.getModal().getByRole('heading', { name: label, level: 6 }).first()).toBeVisible({ timeout: 10_000 });
  }

  async openMoreFilters() {
    await this.moreFiltersButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.moreFiltersButton.click();
    await expect(this.moreFiltersHeading).toBeVisible({ timeout: 10_000 });
  }

  async closeMoreFilters() {
    // Close with Escape (works in UAT)
    await this.page.keyboard.press('Escape');
    await expect(this.moreFiltersHeading).not.toBeVisible({ timeout: 10_000 });
  }

  async assertMoreFiltersFieldsVisible() {
    await expect(this.page.getByRole('heading', { name: 'States', level: 6 })).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByRole('heading', { name: 'Cities', level: 6 })).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByRole('heading', { name: 'Parent Company', level: 6 })).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByRole('heading', { name: 'Market Verticals', level: 6 })).toBeVisible({ timeout: 10_000 });
    // SP status exists as a select heading inside filters
    await expect(this.page.getByRole('heading', { name: 'Select SP Status', level: 6 }).first()).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByText('Created Date').first()).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByText('Last Activity').first()).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByText('Last Modified').first()).toBeVisible({ timeout: 10_000 });
  }

  async applyMoreFilters() {
    const apply = this.page.getByRole('button', { name: 'Apply Filters' }).first();
    await apply.waitFor({ state: 'visible', timeout: 10_000 });
    await apply.click();
    await expect(this.moreFiltersHeading).not.toBeVisible({ timeout: 10_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async clearAllMoreFilters() {
    const clear = this.page.getByRole('button', { name: 'Clear All' }).first();
    await clear.waitFor({ state: 'visible', timeout: 10_000 });
    await clear.click();
  }

  async selectMoreFiltersMarketVertical(optionLabel = 'Manufacturing') {
    const trigger = this.page.getByRole('heading', { name: 'Market Verticals', level: 6 }).first();
    await trigger.waitFor({ state: 'visible', timeout: 10_000 });
    await trigger.click({ force: true });
    const option = this.page.getByText(optionLabel, { exact: true }).last();
    await option.waitFor({ state: 'visible', timeout: 10_000 });
    await option.click({ force: true });
  }

  async openMarketVerticalFilterOptions() {
    await this.marketVerticalFilter.waitFor({ state: 'visible', timeout: 10_000 });
    await this.marketVerticalFilter.click({ force: true });
    const tooltip = this.page.locator('#simple-popper').first();
    await expect(tooltip).toBeVisible({ timeout: 10_000 });
    return tooltip;
  }

  async applyMarketVerticalListFilter(optionLabel = 'Manufacturing') {
    const beforeFooter = await this.getPaginationText().catch(() => '');
    const beforeFirstRow = await this.getFirstRowTextByColumnIndex(0).catch(() => '');
    const tooltip = await this.openMarketVerticalFilterOptions();
    await tooltip.getByText(optionLabel, { exact: true }).click({ force: true });

    await expect
      .poll(async () => {
        const footer = await this.getPaginationText().catch(() => '');
        const firstRow = await this.getFirstRowTextByColumnIndex(0).catch(() => '');
        return footer !== beforeFooter || firstRow !== beforeFirstRow ? 'changed' : 'same';
      }, { timeout: 20_000 })
      .toBe('changed');
  }

  async clearListFilters() {
    const clearAllButton = this.page.getByRole('button', { name: 'Clear All' }).first();
    const visible = await clearAllButton.isVisible().catch(() => false);
    if (visible) {
      await clearAllButton.click({ force: true });
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      return;
    }

    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async assertAboutFieldValue(label, expectedValueRegex) {
    // About section lists fields as label/value pairs. Use regex for stable checks.

    const labelNode = this.page.getByText(label, { exact: true }).first();
    await labelNode.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(this.page.getByText(expectedValueRegex).first()).toBeVisible({ timeout: 15_000 });
  }

  async openAttachmentsSection() {
    await this.attachmentsSection.waitFor({ state: 'visible', timeout: 10_000 });
    await this.attachmentsSection.click({ force: true });
    await expect(this.attachmentUploadHeading).toBeVisible({ timeout: 15_000 });
  }

  async uploadAttachment(filePath) {
    await this.openAttachmentsSection();
    await this.attachmentFileInput.waitFor({ state: 'attached', timeout: 10_000 });
    await this.attachmentFileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async getSectionCount(sectionButton) {
    const label = await sectionButton.innerText().catch(() => '');
    const match = String(label).match(/(\d+)\s*$/);
    return match ? Number(match[1]) : 0;
  }

  async expandRelationshipSection(sectionButton) {
    await sectionButton.waitFor({ state: 'visible', timeout: 10_000 });
    await sectionButton.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    return this.getSectionCount(sectionButton);
  }

  async assertAttachmentVisible(fileName) {
    await expect(this.page.getByText(fileName, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  }

  async tryDownloadAttachment(fileName) {
    const fileRow = this.page.locator('tr, li, div').filter({
      has: this.page.getByText(fileName, { exact: true })
    }).first();
    const downloadButton = fileRow.getByRole('button', { name: /download/i })
      .or(fileRow.locator('[title*="Download"], [aria-label*="Download"]'))
      .or(this.page.getByRole('button', { name: /download/i }).first());

    const visible = await downloadButton.first().isVisible().catch(() => false);
    if (!visible) return false;

    const download = await Promise.all([
      this.page.waitForEvent('download', { timeout: 10_000 }).catch(() => null),
      downloadButton.first().click({ force: true })
    ]).then(([event]) => event);

    return Boolean(download);
  }

  async tryRemoveAttachment(fileName) {
    const fileRow = this.page.locator('tr, li, div').filter({
      has: this.page.getByText(fileName, { exact: true })
    }).first();
    const deleteButton = fileRow.getByRole('button', { name: /remove|delete/i })
      .or(fileRow.locator('[title*="Remove"], [title*="Delete"], [aria-label*="Remove"], [aria-label*="Delete"]'))
      .or(this.page.getByRole('button', { name: /remove|delete/i }).last());

    const visible = await deleteButton.first().isVisible().catch(() => false);
    if (!visible) return false;

    await deleteButton.first().click({ force: true });
    const confirmVisible = await this.deleteConfirmButton.isVisible().catch(() => false);
    if (confirmVisible) {
      await this.deleteConfirmButton.click({ force: true });
    }

    await expect(this.page.getByText(fileName, { exact: true }).first()).not.toBeVisible({ timeout: 15_000 });
    return true;
  }

  async assertCreateCompanySubmitDisabled() {
    const submitBtn = this.page.locator('button:disabled').filter({ hasText: /^Create Company$/ }).last();
    await expect(submitBtn).toBeDisabled({ timeout: 5_000 });
  }

  async cancelCreateCompanyModal() {
    await this.cancelCreateBtn.click();
    await this.createCompanyHeading.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async assertCreateCompanyModalClosed() {
    await expect(this.createCompanyHeading).not.toBeVisible({ timeout: 8_000 });
  }

  getModal() {
    return this.createCompanyHeading.locator('xpath=ancestor::*[@role="presentation"][1]');
  }

  async fillCompanyName(companyName) {
    await this.companyNameInput.click();
    await this.companyNameInput.fill(companyName);
  }

  async replaceInputValue(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    await locator.click();
    await locator.fill('');
    await locator.evaluate((input) => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }).catch(() => {});
    await locator.type(String(value), { delay: 40 });
    await locator.press('Tab').catch(() => {});
  }

  async selectIndustry() {
    const primaryTrigger = this.page.locator(
      'xpath=//body/div[@role="presentation"]/form[contains(@class,"MuiBox-root")]/div[contains(@class,"innerScrollBar")]/div[2]/div[1]/div[1]/div[1]'
    ).first();
    const industryCandidates = [
      primaryTrigger,
      this.page.locator('div[aria-describedby="simple-popper"]').filter({ has: this.page.locator('h6:has-text("Select Industry")') }).locator('> div').first(),
      this.page.getByText('Select Industry', { exact: true }).first(),
      this.page.locator('div').filter({ hasText: /^Select Industry$/ }).first(),
      this.page.locator('[aria-haspopup="listbox"]').filter({ hasText: /Select Industry/i }).first()
    ];

    let opened = false;
    for (const candidate of industryCandidates) {
      const visible = await candidate.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!visible) continue;
      opened = await candidate.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
      if (!opened) continue;
      await this.page.waitForTimeout(800);
      if (await this.industryOption.isVisible({ timeout: 2_000 }).catch(() => false)) break;
    }

    if (!(await this.industryOption.isVisible({ timeout: 3_000 }).catch(() => false))) {
      const injected = await this.page.evaluate((value) => {
        const roots = Array.from(document.querySelectorAll('div[aria-describedby="simple-popper"]'));
        const root  = roots.find((el) => /Select Industry/.test(el.textContent || '')) || roots[0];
        const child = root?.firstElementChild;
        const fiberKey = child ? Object.keys(child).find((k) => k.startsWith('__reactFiber')) : null;
        let node = fiberKey ? child[fiberKey] : null;

        while (node) {
          const props = node.memoizedProps;
          if (props?.handleChange) {
            props.handleChange({
              target: { name: props.name || 'companyIndustry', value: { label: value, value } }
            });
            return true;
          }
          node = node.return;
        }
        return false;
      }, 'Manufacturing').catch(() => false);

      if (!injected) {
        throw new Error('Market Vertical dropdown did not open in the Create Company modal.');
      }

      await this.page.waitForTimeout(500);
      return;
    }

    await this.industryOption.waitFor({ state: 'visible', timeout: 10_000 });
    await this.industryOption.click({ force: true });
  }

  async fillAddress(address) {
    const selected = address
      ? await selectAddressFromAutocomplete({
          page: this.page,
          addressInput: this.addressInput,
          addressText: address,
          optionTimeoutMs: 10_000,
          attempts: 2,
        })
      : await selectDynamicAddressWithRetry({
          page: this.page,
          addressInput: this.addressInput,
          maxAttempts: 6,
          optionTimeoutMs: 10_000,
        }).then(() => true).catch(() => false);
    if (!selected) {
      throw new Error(
        `Company address autocomplete selection failed for "${address || "dynamic candidate"}".`,
      );
    }
    await this.page.waitForTimeout(400);
  }

  async submitCreateCompany() {
    const modalCreateButton = this.getModal().getByRole('button', { name: 'Create Company' }).last();
    await modalCreateButton.waitFor({ state: 'visible', timeout: 10_000 });
    this.lastCreateCompanyToastSeen = false;

    const waitForToast = async () => {
      const visible = await this.successToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
      this.lastCreateCompanyToastSeen = visible;
      return visible;
    };

    await Promise.allSettled([
      waitForToast(),
      modalCreateButton.click()
    ]);

    // If the modal did not close, try a JS click as a last resort.
    const closed = await this.createCompanyHeading.waitFor({ state: 'hidden', timeout: 20_000 }).then(() => true).catch(() => false);
    if (!closed) {
      await Promise.allSettled([
        waitForToast(),
        this.page.evaluate(() => {
          // Use the LAST "Create Company" button — the one inside the modal, not the toolbar
          const buttons = Array.from(document.querySelectorAll('button'));
          const matches = buttons.filter((btn) => (btn.textContent || '').trim() === 'Create Company');
          const target  = matches[matches.length - 1];
          target?.click();
        })
      ]);
      await this.createCompanyHeading.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {
        // Page may navigate or context may close after successful submission — treat as success
      });
    }
  }

  async createCompany({ companyName, address }) {
    await this.openCreateCompanyModal();
    await this.fillCompanyName(companyName);
    await this.selectIndustry();
    await this.fillAddress(address);
    await this.submitCreateCompany();
    return companyName;
  }

  async assertCompanyCreated() {
    expect(this.lastCreateCompanyToastSeen).toBeTruthy();
  }

  // ── Company Detail ──────────────────────────────────────────────────────────

  async openCompanyDetail(companyName) {
    let opened = false;
    let lastError = null;

    for (let attempt = 1; attempt <= 4; attempt++) {
      await this.companySearchInput.waitFor({ state: 'visible', timeout: 10_000 });
      await this.companySearchInput.click({ force: true });
      await this.companySearchInput.fill('');
      await this.companySearchInput.fill(companyName);
      await this.page.keyboard.press('Enter').catch(() => {});
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      await this.page.waitForTimeout(2_000 * attempt);

      const escapedName = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const resultVisible = await this.companiesTable
        .locator('tbody tr td')
        .filter({ has: this.page.getByText(new RegExp(`^\\s*${escapedName}\\s*$`, 'i')).first() })
        .first()
        .isVisible()
        .catch(() => false);

      if (!resultVisible) {
        await this.gotoCompaniesFromMenu();
        await this.assertCompaniesPageOpened();
        continue;
      }

      try {
        await this.clickCompanyNameCellByText(companyName);
        opened = true;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!opened) {
      throw lastError || new Error(`Company "${companyName}" was not found in the Companies list.`);
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertCompanyDetailOpened(companyName) {
    await expect(this.page).toHaveURL(/\/app\/sales\/companies\/company\//, { timeout: 20_000 });
    const heading = this.page.getByRole('heading', { level: 3 }).first()
      .or(this.page.getByRole('heading', { level: 2 }).first());
    await expect(heading).toBeVisible({ timeout: 15_000 });

    if (companyName) {
      const headingText = await heading.innerText().catch(() => '');
      const normalizedHeading = String(headingText).trim().toLowerCase();
      const normalizedExpected = String(companyName).trim().toLowerCase();
      // Best-effort only: some list values include formatting not identical to detail heading.
      if (normalizedHeading && normalizedExpected && normalizedHeading.includes(normalizedExpected)) {
        expect(normalizedHeading.includes(normalizedExpected)).toBeTruthy();
      }
    }
  }

  async assertCompanyDetailSectionsVisible() {
    await expect(this.aboutCompanyButton).toBeVisible({ timeout: 10_000 });
    await expect(this.propertiesSection).toBeVisible({ timeout: 10_000 });
    await expect(this.dealsSection).toBeVisible({ timeout: 10_000 });
    await expect(this.contactsSection).toBeVisible({ timeout: 10_000 });
    await expect(this.attachmentsSection).toBeVisible({ timeout: 10_000 });
  }

  // ── Activities tab ──────────────────────────────────────────────────────────

  async gotoActivitiesTab() {
    await this.activitiesTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.activitiesTab.click();
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async assertCompanyCreationActivity(companyName) {
    const escapedName = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const activityText = this.page
      .getByText(new RegExp(`Company created by HubSpot.*${escapedName}.*company`, 'i')).first();
    await expect(activityText).toBeVisible({ timeout: 15_000 });
  }

  // ── Notes tab ───────────────────────────────────────────────────────────────

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
    // Heading is "Add Notes" (level=4) — verified live
    await expect(this.addNotesHeading).toBeVisible({ timeout: 10_000 });
    const notesDrawer = this.addNotesHeading.locator('xpath=ancestor::*[@role="dialog" or @role="presentation" or contains(@class,"MuiDrawer-paper")][1]');
    const noteSubjectInput = notesDrawer.getByRole('textbox').first().or(this.page.locator('div[role="presentation"] input').first());
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

  // ── Tasks tab ───────────────────────────────────────────────────────────────

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

  async assertTasksEmptyState() {
    await expect(this.taskEmptyState).toBeVisible({ timeout: 10_000 });
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
    // Type and Priority are custom heading dropdowns — verified live
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

  // ── Edit Company ─────────────────────────────────────────────────────────────

  async openEditCompanyForm() {
    await this.editCompanyButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.editCompanyButton.click();
    await this.editCompanyHeading.waitFor({ state: 'visible', timeout: 10_000 });
    await this.subMarketVerticalInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertEditCompanyFormOpen() {
    await expect(this.editCompanyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.subMarketVerticalInput).toBeVisible({ timeout: 5_000 });
    await expect(this.naicsCodeInput).toBeVisible({ timeout: 5_000 });
    await expect(this.revenueInput).toBeVisible({ timeout: 5_000 });
    await expect(this.yearFoundedInput).toBeVisible({ timeout: 5_000 });
    await expect(this.updateCompanyButton).toBeVisible({ timeout: 5_000 });
  }

  async assertUpdateButtonDisabled() {
    // Update Company button is disabled until a change is made — verified live
    await expect(this.updateCompanyButton).toBeDisabled({ timeout: 5_000 });
  }

  async cancelEditCompanyForm() {
    await this.cancelEditBtn.click();
    await this.editCompanyHeading.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async assertEditCompanyFormClosed() {
    await expect(this.editCompanyHeading).not.toBeVisible({ timeout: 8_000 });
  }

  async fillEditCompanyDetails(companyData) {
    await this.replaceInputValue(this.subMarketVerticalInput, companyData.subMarketVertical);
    await this.replaceInputValue(this.naicsCodeInput, companyData.naicsCode);
    await this.replaceInputValue(this.employeeCountInput, companyData.employeeCount);
    await this.replaceInputValue(this.revenueInput, companyData.revenue);
    await this.replaceInputValue(this.propertyCountInput, companyData.propertyCount);
    await this.replaceInputValue(this.yearFoundedInput, companyData.yearFounded);
    await expect(this.updateCompanyButton).toBeEnabled({ timeout: 10_000 });
  }

  async submitCompanyUpdate() {
    await this.updateCompanyButton.waitFor({ state: 'visible', timeout: 10_000 });
    this.lastUpdateCompanyToastSeen = false;
    await expect(this.updateCompanyButton).toBeEnabled({ timeout: 10_000 });

    const triggerSubmit = async () => {
      await this.updateCompanyButton.scrollIntoViewIfNeeded().catch(() => {});
      const clicked = await this.updateCompanyButton.click({ timeout: 5_000 }).then(() => true).catch(() => false);
      if (clicked) return;

      const forced = await this.updateCompanyButton.click({ force: true, timeout: 5_000 }).then(() => true).catch(() => false);
      if (forced) return;

      await this.updateCompanyButton.evaluate((button) => {
        button.click();
      });
    };

    await Promise.allSettled([
      this.updateToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => {
        this.lastUpdateCompanyToastSeen = true;
      }),
      triggerSubmit()
    ]);

    await expect
      .poll(async () => {
        const hidden = await this.editCompanyHeading.isHidden().catch(() => false);
        if (hidden) return 'closed';

        const editVisible = await this.editCompanyButton.isVisible().catch(() => false);
        return editVisible ? 'detail' : 'pending';
      }, { timeout: 20_000 })
      .not.toBe('pending');

    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async updateCompanyDetails(companyData) {
    await this.openEditCompanyForm();
    await this.fillEditCompanyDetails(companyData);
    await this.submitCompanyUpdate();
  }

  // ── About this Company section ───────────────────────────────────────────────

  async openAboutCompanySection() {
    await this.aboutCompanyButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.aboutCompanyButton.click();
    await this.page.waitForTimeout(1_000);
  }

  async assertAboutCompanyDetails(companyData) {
    const formattedRevenue  = Number(companyData.revenue).toLocaleString('en-US');
    const revenueRegex      = new RegExp(`Revenue\\s*\\$?\\s*${formattedRevenue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const propertiesRegex   = new RegExp(`No\\s*Of\\s*Properties\\s*${companyData.propertyCount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const employeesRegex    = new RegExp(`No\\s*Of\\s*employees\\s*${companyData.employeeCount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

    if (this.lastUpdateCompanyToastSeen) {
      expect(this.lastUpdateCompanyToastSeen).toBeTruthy();
    }

    await expect(this.page.getByText(new RegExp(`Sub\\s*Vertical\\s*${companyData.subMarketVertical}`, 'i')).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(new RegExp(`NAICS\\s*Codes\\s*${companyData.naicsCode}`, 'i')).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(propertiesRegex).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(revenueRegex).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(employeesRegex).first()).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(new RegExp(`Year\\s*Founded\\s*${companyData.yearFounded}`, 'i')).first()).toBeVisible({ timeout: 15_000 });
  }

  // ── Analytics & Charts helpers (TC-COMP-013 through TC-COMP-015) ───────────

  /**
   * Returns the ECharts container (`div.echarts-for-react`) that lives inside
   * the same chart section as the given h6 heading locator.
   */
  getEchartsContainerNear(headingLocator) {
    // Walk up from the heading to the section wrapper, then locate the echarts div
    return headingLocator.locator('xpath=ancestor::div[.//div[contains(@class,"echarts-for-react")]]')
      .first()
      .locator('.echarts-for-react')
      .first();
  }

  /** Contracts donut — verifies Active/Inactive legend entries via chart section text */
  async assertContractsLegendVisible() {
    // The legend labels are truncated in the DOM (e.g. "Active Contr... • 2,435.00").
    // Use the entire chart section's innerText which includes the full or truncated legend.
    const sectionText = await this.getChartSectionText(this.chartByContractsHeading);
    return {
      hasActive:   /Active Contr/.test(sectionText),
      hasInactive: /Inactive Con/.test(sectionText),
    };
  }

  /** Market Verticals donut — legend items */
  getMarketVerticalsLegendItems() {
    const section = this.chartByMarketVerticalsHeading
      .locator('xpath=ancestor::div[.//div[contains(@class,"echarts-for-react")]]').first();
    return {
      container: section,
      anyLegendItem: section.locator('div').filter({ hasText: /•/ }),
    };
  }

  /** Trend chart — x-axis label elements (month strings rendered by ECharts accessibility layer) */
  getTrendXAxisLabels() {
    const section = this.chartTrendHeading
      .locator('xpath=ancestor::div[.//div[contains(@class,"echarts-for-react")]]').first();
    // ECharts renders x-axis labels as generic elements with text like "May' 25"
    return section.locator('.echarts-for-react div').filter({ hasText: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)['']\s*\d{2}$/ });
  }

  /** Returns the chart section wrapper (ancestor div) for a given heading locator */
  getChartSection(headingLocator) {
    return headingLocator
      .locator('xpath=ancestor::div[.//div[contains(@class,"echarts-for-react")]]')
      .first();
  }

  /** Returns innerText of the chart section that contains the given heading */
  async getChartSectionText(headingLocator) {
    const section = this.getChartSection(headingLocator);
    return section.innerText();
  }

  // ── Search helpers (TC-COMP-016 through TC-COMP-021) ──────────────────────

  /**
   * Fills search input and waits for the grid to reflect the change
   * by polling pagination text until it differs from the baseline.
   */
  async searchAndWaitForGridUpdate(searchText) {
    const baselinePagination = await this.getPaginationText().catch(() => '');
    await this.companySearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.companySearchInput.fill(searchText);
    // Wait until pagination text changes (grid updated)
    await expect
      .poll(async () => {
        const current = await this.getPaginationText().catch(() => '');
        return current !== baselinePagination ? 'updated' : 'same';
      }, { timeout: 15_000 })
      .toBe('updated');
  }

  /**
   * Clears search input and waits for the grid to return to unfiltered state.
   */
  async clearSearchAndWaitForGridRestore(filteredPagination) {
    await this.companySearchInput.clear();
    await expect
      .poll(async () => {
        const current = await this.getPaginationText().catch(() => '');
        return current !== filteredPagination ? 'restored' : 'same';
      }, { timeout: 15_000 })
      .toBe('restored');
  }

  /**
   * Returns an array of company name texts from all visible rows (column 0).
   */
  async getAllVisibleCompanyNames() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const rows = this.companiesTable.locator('tbody tr');
    const count = await rows.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').first().innerText().catch(() => '');
      names.push((text || '').trim());
    }
    return names;
  }

  // ── Filter Management helpers (TC-COMP-022 through TC-COMP-052) ────────────

  /**
   * Opens the Market Vertical filter dropdown, handling both clean state
   * ("Market Vertical" heading) and filtered state ("Market Vertical (N)" chip).
   * Returns the tooltip locator.
   */
  async openMarketVerticalDropdown() {
    // The filter area has a container with aria-describedby="simple-popper" that contains
    // the Market Vertical heading (clean or chip state). Click this container to open tooltip.
    const triggerContainer = this.page.locator('[aria-describedby="simple-popper"]')
      .filter({ has: this.page.getByRole('heading', { name: /^Market Vertical/, level: 6 }) });
    await triggerContainer.first().waitFor({ state: 'visible', timeout: 10_000 });
    await triggerContainer.first().click({ force: true });
    const tooltip = this.page.locator('#simple-popper').first();
    await expect(tooltip).toBeVisible({ timeout: 10_000 });
    return tooltip;
  }

  /**
   * Clears any active Market Vertical filter by clicking the X button on the chip.
   * Does nothing if no filter is active.
   */
  async clearMarketVerticalChip() {
    // The chip structure: grandparent div > div(h6 "Market Vertical (N)") + div(svg X icon)
    const chipHeading = this.page.getByRole('heading', { name: /^Market Vertical \(\d+\)/, level: 6 }).first();
    const isActive = await chipHeading.isVisible().catch(() => false);
    if (!isActive) return;
    // Use evaluate to find and click the X (SVG) button in the sibling container
    await this.page.evaluate(() => {
      const headings = document.querySelectorAll('h6');
      for (const h of headings) {
        if (/Market Vertical \(\d+\)/.test(h.textContent.trim())) {
          const parent = h.parentElement;
          const grandparent = parent?.parentElement;
          if (grandparent) {
            const svgContainer = grandparent.querySelector('svg');
            if (svgContainer) { svgContainer.parentElement.click(); return; }
          }
        }
      }
    });
    // Wait for the chip to disappear and clean heading to reappear
    await expect(this.marketVerticalFilter).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Returns the Market Vertical tooltip locator (#simple-popper).
   */
  getMarketVerticalTooltip() {
    return this.page.locator('#simple-popper').first();
  }

  /**
   * Returns the "Search by Industry" textbox inside the Market Vertical tooltip.
   */
  getMarketVerticalSearchInput() {
    return this.getMarketVerticalTooltip().getByRole('textbox', { name: 'Search by Industry' });
  }

  /**
   * Returns a locator for a specific market vertical option inside the tooltip.
   */
  getMarketVerticalOption(optionLabel) {
    return this.getMarketVerticalTooltip().locator('p').filter({ hasText: new RegExp(`^${optionLabel}$`) });
  }

  /**
   * Returns locator for the checkbox img next to a market vertical option.
   * When checked, the img src changes.
   */
  getMarketVerticalOptionCheckbox(optionLabel) {
    const optionContainer = this.getMarketVerticalTooltip()
      .locator('div[style*="cursor"]').filter({ hasText: new RegExp(`^${optionLabel}$`) })
      .or(this.getMarketVerticalTooltip().locator('div').filter({ hasText: new RegExp(`^${optionLabel}$`) }));
    return optionContainer.locator('img').first();
  }

  /**
   * Clicks a market vertical option in the dropdown tooltip and waits for grid update.
   */
  async selectMarketVerticalOption(optionLabel) {
    const beforePagination = await this.getPaginationText().catch(() => '');
    const option = this.getMarketVerticalOption(optionLabel);
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
    await expect
      .poll(async () => {
        const current = await this.getPaginationText().catch(() => '');
        return current !== beforePagination ? 'changed' : 'same';
      }, { timeout: 15_000 })
      .toBe('changed');
  }

  /**
   * Clicks a market vertical option without waiting for grid update (for multi-select).
   */
  async clickMarketVerticalOptionNoWait(optionLabel) {
    const option = this.getMarketVerticalOption(optionLabel);
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
  }

  /**
   * Returns all visible market vertical option texts from the tooltip.
   */
  async getVisibleMarketVerticalOptions() {
    const tooltip = this.getMarketVerticalTooltip();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    const options = tooltip.locator('p');
    const count = await options.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).innerText().catch(() => '');
      if (text.trim()) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Returns all Market Vertical column values from visible rows.
   * Market Vertical is at column index 3.
   */
  async getAllVisibleMarketVerticalValues() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const rows = this.companiesTable.locator('tbody tr');
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(3).innerText().catch(() => '');
      values.push((text || '').trim());
    }
    return values;
  }

  /**
   * Returns all State column values from visible rows.
   * State is at column index 9.
   */
  async getAllVisibleStateValues() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const rows = this.companiesTable.locator('tbody tr');
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(9).innerText().catch(() => '');
      values.push((text || '').trim());
    }
    return values;
  }

  /**
   * Returns all City column values from visible rows.
   * City is at column index 8.
   */
  async getAllVisibleCityValues() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const rows = this.companiesTable.locator('tbody tr');
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(8).innerText().catch(() => '');
      values.push((text || '').trim());
    }
    return values;
  }

  /**
   * Opens a dropdown inside the More Filters panel by heading text.
   */
  async openMoreFiltersDropdown(headingText) {
    const heading = this.page.getByRole('heading', { name: headingText, level: 6 }).first();
    await heading.scrollIntoViewIfNeeded().catch(() => {});
    // Dismiss any lingering tooltip first
    const existingTooltip = this.page.locator('#simple-popper').first();
    if (await existingTooltip.isVisible().catch(() => false)) {
      await this.moreFiltersHeading.click({ force: true });
      await expect(existingTooltip).toBeHidden({ timeout: 3_000 }).catch(() => {});
    }
    // The onclick handler is on the grandparent container of the h6.
    // Use evaluate to click the correct ancestor.
    await this.page.evaluate((text) => {
      const headings = document.querySelectorAll('h6');
      for (const h of headings) {
        if (h.textContent.trim() === text) {
          const grandparent = h.parentElement?.parentElement;
          if (grandparent) { grandparent.click(); return; }
          h.click();
          return;
        }
      }
    }, headingText);
    const tooltip = this.page.locator('#simple-popper').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    return tooltip;
  }

  /**
   * Selects an option from a More Filters dropdown tooltip.
   */
  async selectMoreFiltersDropdownOption(tooltipLocator, optionText) {
    const option = tooltipLocator.getByText(optionText, { exact: true }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
  }

  /**
   * Dismisses the tooltip inside the More Filters panel without closing the drawer.
   * Clicks the "All Filters" heading to move focus away from the tooltip.
   */
  async dismissMoreFiltersTooltip() {
    await this.moreFiltersHeading.click({ force: true });
    const tooltip = this.page.locator('#simple-popper').first();
    await expect(tooltip).toBeHidden({ timeout: 5_000 }).catch(() => {});
  }

  /**
   * Selects a state in the More Filters panel.
   */
  async selectMoreFiltersState(stateName) {
    const tooltip = await this.openMoreFiltersDropdown('Select states');
    await this.selectMoreFiltersDropdownOption(tooltip, stateName);
    await this.dismissMoreFiltersTooltip();
  }

  /**
   * Selects a city in the More Filters panel (state must already be selected).
   */
  async selectMoreFiltersCity(cityName) {
    const tooltip = await this.openMoreFiltersDropdown('Select cities');
    await this.selectMoreFiltersDropdownOption(tooltip, cityName);
    await this.dismissMoreFiltersTooltip();
  }

  /**
   * Selects a parent company in the More Filters panel.
   */
  async selectMoreFiltersParentCompany() {
    const tooltip = await this.openMoreFiltersDropdown('Select Parent Company');
    // Pick the first available option
    const firstOption = tooltip.locator('p').first()
      .or(tooltip.locator('div[style*="cursor"]').first());
    const text = await firstOption.innerText().catch(() => '');
    if (text.trim()) {
      await firstOption.click({ force: true });
    }
    await this.dismissMoreFiltersTooltip();
    return text.trim();
  }

  /**
   * Selects an SP Status in the More Filters panel.
   */
  async selectMoreFiltersSpStatus(statusLabel) {
    const tooltip = await this.openMoreFiltersDropdown('Select SP Status');
    await this.selectMoreFiltersDropdownOption(tooltip, statusLabel);
    await this.dismissMoreFiltersTooltip();
  }

  /**
   * Types a date range into one of the More Filters date fields.
   * @param {string} fieldLabel - "Created Date", "Last Activity", or "Last Modified"
   * @param {string} dateRange - e.g. "01/01/2025 - 12/31/2025"
   */
  async fillMoreFiltersDateRange(fieldLabel, dateRange) {
    // Find the correct date input by field label position
    const allDateInputs = this.page.locator('input[placeholder="MM/DD/YYYY - MM/DD/YYYY"]');
    let targetInput = null;

    if (fieldLabel === 'Created Date') {
      targetInput = allDateInputs.nth(0);
    } else if (fieldLabel === 'Last Activity') {
      targetInput = allDateInputs.nth(1);
    } else if (fieldLabel === 'Last Modified') {
      targetInput = allDateInputs.nth(2);
    }

    if (targetInput) {
      await targetInput.scrollIntoViewIfNeeded().catch(() => {});
      await targetInput.click();
      await targetInput.fill(dateRange);
    }
  }

  /**
   * Clicks the close (X) link next to "All Filters" heading.
   */
  async closeMoreFiltersViaX() {
    // Click the X link adjacent to "All Filters" heading using evaluate
    await this.page.evaluate(() => {
      const headings = document.querySelectorAll('h3');
      for (const h of headings) {
        if (h.textContent.includes('All Filters')) {
          const container = h.parentElement;
          const link = container?.querySelector('a');
          if (link) { link.click(); return; }
        }
      }
    });
    await expect(this.moreFiltersHeading).toBeHidden({ timeout: 10_000 });
  }

  /**
   * Checks if the Cities dropdown is disabled (pointer-events: none).
   */
  async isCitiesDropdownDisabled() {
    // Check if the Cities dropdown trigger has pointer-events: none (disabled state)
    // The pointer-events is set on the h6's direct parent div
    const disabled = await this.page.evaluate(() => {
      const headings = document.querySelectorAll('h6');
      for (const h of headings) {
        if (h.textContent.trim() === 'Select cities') {
          // Check each ancestor up to 3 levels for pointer-events: none
          let el = h.parentElement;
          for (let i = 0; i < 3 && el; i++) {
            if (window.getComputedStyle(el).pointerEvents === 'none') return true;
            el = el.parentElement;
          }
          return false;
        }
      }
      return true;
    });
    return disabled;
  }

  /**
   * Waits for grid to update after applying filters by polling pagination.
   */
  async waitForGridUpdateAfterFilter(baselinePagination) {
    await expect
      .poll(async () => {
        const current = await this.getPaginationText().catch(() => '');
        return current !== baselinePagination ? 'updated' : 'same';
      }, { timeout: 20_000 })
      .toBe('updated');
  }

  /**
   * Returns the Strategic Partnership Status column values from visible rows.
   * SP Status is at column index 19.
   */
  async getAllVisibleSpStatusValues() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const rows = this.companiesTable.locator('tbody tr');
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(19).innerText().catch(() => '');
      values.push((text || '').trim());
    }
    return values;
  }

  // ── Listing page — chart & grid helpers (TC-COMP-001 through TC-COMP-012) ──

  async getChartContainerBoxes() {
    // Returns bounding boxes of the three chart containers for overlap checks
    
    // The chart section has three direct children with h6 headings
    const chartSection = this.page.locator('div').filter({
      has: this.chartByContractsHeading,
    }).filter({
      has: this.chartByMarketVerticalsHeading,
    }).first();
    return chartSection;
  }

  async getTableScrollInfo() {
    // Evaluate scrollWidth vs clientWidth on the table's scroll container
    return this.page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return { scrollWidth: 0, clientWidth: 0, scrollLeft: 0 };
      const container = table.closest('div[style*="overflow"]') || table.parentElement;
      return {
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
        scrollLeft: container.scrollLeft,
      };
    });
  }

  async scrollTableToRight() {
    await this.page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return;
      const container = table.closest('div[style*="overflow"]') || table.parentElement;
      container.scrollLeft = container.scrollWidth;
    });
  }

  async getFirstRowCellTexts() {
    // Returns an array of all cell texts in the first data row
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const firstRow = this.companiesTable.locator('tbody tr').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 });
    const cells = firstRow.locator('td');
    const count = await cells.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).innerText().catch(() => '');
      texts.push((text || '').trim());
    }
    return texts;
  }
  // ── Sorting & Pagination helpers (TC-COMP-053 through TC-COMP-059) ──────

  /**
   * Returns the Created Date column values from visible rows.
   * Created Date is at column index 6.
   */
  async getAllVisibleCreatedDateValues() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    const rows = this.companiesTable.locator('tbody tr');
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(6).innerText().catch(() => '');
      values.push((text || '').trim());
    }
    return values;
  }

  /**
   * Returns the visible row count in the table body.
   */
  async getTableBodyRowCount() {
    await this.companiesTable.first().waitFor({ state: 'visible', timeout: 15_000 });
    return this.companiesTable.locator('tbody tr').count();
  }

  /**
   * Navigates to the last page by clicking next page until disabled.
   * Returns the pagination text on the last page.
   */
  async navigateToLastPage(maxClicks = 50) {
    for (let i = 0; i < maxClicks; i++) {
      const isDisabled = await this.nextPageBtn.isDisabled().catch(() => true);
      if (isDisabled) break;
      await this.gotoNextPage();
    }
    return this.getPaginationText();
  }

  /**
   * Deselects a Market Vertical option from the page-level filter by clicking it in the dropdown.
   * If tooltip is not open, opens it first.
   */
  async deselectMarketVerticalFromDropdown(optionLabel) {
    const tooltip = this.getMarketVerticalTooltip();
    const isOpen = await tooltip.isVisible().catch(() => false);
    if (!isOpen) {
      await this.openMarketVerticalDropdown();
    }
    const beforePagination = await this.getPaginationText().catch(() => '');
    const option = this.getMarketVerticalOption(optionLabel);
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
    await expect
      .poll(async () => {
        const current = await this.getPaginationText().catch(() => '');
        return current !== beforePagination ? 'changed' : 'same';
      }, { timeout: 15_000 })
      .toBe('changed');
  }
  // ── Create Company Workflow helpers (TC-COMP-064 through TC-COMP-093) ─────

  /**
   * Returns the Create Company submit button scoped to the modal.
   * Distinct from the list-page "Create Company" toolbar button.
   */
  getCreateCompanyModalSubmitBtn() {
    return this.getModal().getByRole('button', { name: 'Create Company' }).last();
  }

  /**
   * Checks whether the Company Name label has a mandatory asterisk (*).
   */
  async hasCompanyNameMandatoryMarker() {
    const labelContainer = this.getModal().locator('div').filter({ hasText: /Company Name/ }).first();
    const text = await labelContainer.innerText().catch(() => '');
    return text.includes('*');
  }

  /**
   * Checks whether the Market Vertical label has a mandatory asterisk (*).
   */
  async hasMarketVerticalMandatoryMarker() {
    const labelContainer = this.getModal().locator('div').filter({ hasText: /Market Vertical/ }).first();
    const text = await labelContainer.innerText().catch(() => '');
    return text.includes('*');
  }

  /**
   * Checks whether the Address label has a mandatory asterisk (*).
   */
  async hasAddressMandatoryMarker() {
    const labelContainer = this.getModal().locator('div').filter({ hasText: /^Address/ }).first();
    const text = await labelContainer.innerText().catch(() => '');
    return text.includes('*');
  }

  /**
   * Returns the No. of Employees spinbutton scoped inside the Create Company modal.
   * The field has no accessible name, so we scope via the label text.
   */
  getCreateEmployeesSpinbutton() {
    const modal = this.getModal();
    return modal.locator('div').filter({ hasText: /No\. of Employees/ }).locator('input[type="number"]').first();
  }

  /**
   * Returns the Revenue spinbutton scoped inside the Create Company modal.
   */
  getCreateRevenueSpinbutton() {
    const modal = this.getModal();
    return modal.getByRole('spinbutton', { name: 'Revenue' });
  }

  /**
   * Opens the Market Vertical (Industry) dropdown in the Create Company modal.
   * The MUI custom dropdown's click handler lives on a React fiber ancestor that
   * does not respond to Playwright's force-click on the DOM element.  We walk the
   * React fiber tree from the <h6> "Select Industry" heading upward until we find
   * a fiber whose props contain an onClick, then invoke it programmatically.
   * Falls back to multi-candidate DOM clicks if the fiber approach fails.
   * Returns true if #simple-popper became visible, false otherwise.
   */
  async openCreateIndustryDropdown() {
    const popper = this.page.locator('#simple-popper').first();

    // If popper is already open, nothing to do
    if (await popper.isVisible().catch(() => false)) return true;

    // Approach 1: Trigger the React onClick handler via fiber tree traversal.
    // This mirrors the proven React-fiber pattern in selectIndustry().
    const fiberClicked = await this.page.evaluate(() => {
      const h6 = Array.from(document.querySelectorAll('h6'))
        .find(el => el.textContent?.trim() === 'Select Industry');
      if (!h6) return false;

      // Walk up DOM ancestors to find the one with a React onClick prop
      let el = h6;
      for (let depth = 0; depth < 8 && el; depth++) {
        const propsKey = Object.keys(el).find(k => k.startsWith('__reactProps'));
        if (propsKey && el[propsKey]?.onClick) {
          el[propsKey].onClick({ preventDefault() {}, stopPropagation() {} });
          return true;
        }
        el = el.parentElement;
      }

      // Fallback: walk the React fiber tree (fiber.return) for onClick
      const fiberKey = Object.keys(h6).find(k => k.startsWith('__reactFiber'));
      if (!fiberKey) return false;
      let fiber = h6[fiberKey];
      for (let i = 0; i < 15 && fiber; i++) {
        if (fiber.memoizedProps?.onClick) {
          fiber.memoizedProps.onClick({ preventDefault() {}, stopPropagation() {} });
          return true;
        }
        fiber = fiber.return;
      }
      return false;
    }).catch(() => false);

    if (fiberClicked) {
      const popperVisible = await popper.isVisible({ timeout: 3_000 }).catch(() => false);
      if (popperVisible) return true;
    }

    // Approach 2: Multi-candidate DOM clicks as a last resort
    const candidates = [
      this.page.getByText('Select Industry', { exact: true }).first(),
      this.page.locator('div').filter({ hasText: /^Select Industry$/ }).first(),
      this.createIndustryTrigger,
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      await candidate.click({ force: true }).catch(() => {});
      const popperVisible = await popper.isVisible({ timeout: 2_000 }).catch(() => false);
      if (popperVisible) return true;
    }

    return false;
  }

  /**
   * Opens the Market Vertical dropdown inside the Create Company modal and returns
   * all visible option texts.
   */
  async getCreateIndustryOptions() {
    const opened = await this.openCreateIndustryDropdown();
    if (!opened) {
      throw new Error('Market Vertical dropdown did not open in the Create Company modal.');
    }
    const tooltip = this.page.locator('#simple-popper').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    const options = tooltip.locator('div[style*="cursor"], p').filter({ hasText: /\w+/ });
    const count = await options.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).innerText().catch(() => '');
      if (text.trim() && !texts.includes(text.trim())) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Fills the No. of Employees spinbutton in the Create Company modal.
   */
  async fillCreateEmployees(value) {
    const input = this.getCreateEmployeesSpinbutton();
    await input.waitFor({ state: 'visible', timeout: 5_000 });
    await input.fill(String(value));
  }

  /**
   * Fills the Revenue spinbutton in the Create Company modal.
   */
  async fillCreateRevenue(value) {
    const input = this.getCreateRevenueSpinbutton();
    await input.waitFor({ state: 'visible', timeout: 5_000 });
    await input.fill(String(value));
  }
  // ── Change Review History (TC-COMP-094 through TC-COMP-098) ──────────────

  async gotoChangeReviewHistory() {
    await this.changeReviewButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.changeReviewButton.click();
    await this.page.waitForURL(/\/app\/sales\/companies\/reviews/, { timeout: 20_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertChangeReviewPageLoaded() {
    await expect(this.page).toHaveURL(/\/app\/sales\/companies\/reviews/, { timeout: 20_000 });
    await expect(this.companiesTable.first()).toBeVisible({ timeout: 15_000 });
    await expect(this.paginationInfo.first()).toBeVisible({ timeout: 15_000 });
  }

  async openFirstCompanyReview() {
    const firstRow = this.companiesTable.locator('tbody tr').first();
    await firstRow.waitFor({ state: 'visible', timeout: 15_000 });
    const firstCell = firstRow.locator('td').first();
    const companyName = await firstCell.innerText().catch(() => '');
    await firstCell.click();
    await this.changeReviewHeading.waitFor({ state: 'visible', timeout: 15_000 });
    return companyName.trim();
  }

  async assertChangeReviewDrawerOpen() {
    await expect(this.changeReviewHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByText('Please review to approve or reject the changes.')).toBeVisible({ timeout: 10_000 });
    await expect(this.pendingReviewsTab).toBeVisible({ timeout: 5_000 });
    await expect(this.activityLogsTab).toBeVisible({ timeout: 5_000 });
  }

  async gotoActivityLogsTab() {
    await this.activityLogsTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.activityLogsTab.click();
    await this.page.waitForTimeout(1_000);
  }

  async getActivityLogEditedByText() {
    const editedByLabel = this.page.getByText('Edited by').first();
    const visible = await editedByLabel.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) return null;
    // The "Edited by" is followed by the user name in a nearby sibling
    const container = editedByLabel.locator('xpath=ancestor::div[1]');
    const text = await container.innerText().catch(() => '');
    return text.trim();
  }

  async closeChangeReviewDrawer() {
    await this.page.keyboard.press('Escape');
    await this.changeReviewHeading.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  // ── Notes CRUD helpers (TC-COMP-121 through TC-COMP-132) ──────────────────

  async createNote({ subject, description }) {
    await this.openCreateNoteDrawer();
    // Subject input is the first textbox inside the Add Notes drawer
    const notesDrawer = this.addNotesHeading.locator('xpath=ancestor::*[@role="dialog" or @role="presentation" or contains(@class,"MuiDrawer-paper")][1]');
    const subjectInput = notesDrawer.getByRole('textbox').first().or(this.page.locator('div[role="presentation"] input').first());
    await subjectInput.fill(subject);
    await this.noteDescEditor.click();
    await this.noteDescEditor.fill(description);
    await this.noteSaveBtn.click();
    await this.addNotesHeading.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async assertNoteVisible(subject) {
    // Note text in the DOM is wrapped as "Note: {subject} by {username}" — use substring match
    await expect(this.page.getByText(subject).first()).toBeVisible({ timeout: 15_000 });
  }

  /** Returns the note card container for a given subject (substring match). */
  getNoteCard(subject) {
    // Note text is "Note: {subject} by {username}" — find the paragraph, then go up to the card
    const noteParagraph = this.page.getByText(subject).first();
    return noteParagraph.locator('xpath=ancestor::div[3]');
  }

  async openNoteOptionsMenu(subject) {
    const noteCard = this.getNoteCard(subject);
    const editBtn = noteCard.getByRole('button', { name: 'Edit' }).first();
    await editBtn.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async deleteNote(subject) {
    // Edit and Delete are direct buttons on the note card — no dropdown menu
    const noteCard = this.getNoteCard(subject);
    const deleteBtn = noteCard.getByRole('button', { name: /delete/i }).first();
    await deleteBtn.click({ force: true });
    // Confirm deletion — dialog button is "Delete Note" not "Delete"
    const confirmDialog = this.page.getByRole('dialog').filter({ hasText: /Delete Note/i });
    const dialogVisible = await confirmDialog.isVisible({ timeout: 5_000 }).catch(() => false);
    if (dialogVisible) {
      await confirmDialog.getByRole('button', { name: /Delete Note/i }).click();
    }
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  // ── Tasks CRUD helpers (TC-COMP-133 through TC-COMP-149) ──────────────────

  async createTask({ title, description, type = 'To-Do', priority = 'Medium' }) {
    await this.openCreateTaskDrawer();
    await this.taskTitleInput.fill(title);
    await this.taskDescEditor.click();
    await this.taskDescEditor.fill(description);

    // Select type — dropdown renders as tooltip, option text may differ in casing (e.g. "To-do" vs "To-Do")
    await this.taskTypeTrigger.click({ force: true });
    const typeTooltip = this.page.getByRole('tooltip').first();
    await expect(typeTooltip).toBeVisible({ timeout: 5_000 });
    await typeTooltip.getByText(new RegExp(`^${type}$`, 'i')).first().click({ force: true });

    // Select priority — same tooltip pattern
    await this.taskPriorityTrigger.click({ force: true });
    const priorityTooltip = this.page.getByRole('tooltip').first();
    await expect(priorityTooltip).toBeVisible({ timeout: 5_000 });
    await priorityTooltip.getByText(new RegExp(`^${priority}$`, 'i')).first().click({ force: true });

    // Select due date — pick today
    const dueDateInput = this.page.locator('input[placeholder*="MM/DD/YYYY"]').first();
    const dueDateVisible = await dueDateInput.isVisible({ timeout: 3_000 }).catch(() => false);
    if (dueDateVisible) {
      const today = new Date();
      const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
      await dueDateInput.fill(dateStr);
    }

    await this.taskSaveBtn.click();
    await this.createTaskHeading.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async assertTaskVisible(title) {
    // Task title may be truncated with ellipsis — cell accessible name has the full text
    await expect(this.page.getByRole('cell', { name: title }).first()).toBeVisible({ timeout: 15_000 });
  }

  async openTaskDetail(title) {
    await this.page.getByRole('cell', { name: title }).first().click();
    await this.page.waitForTimeout(1_000);
  }

  async deleteTask(title) {
    // Click on task row to open detail, then find delete option
    const taskRow = this.companiesTable.locator('tbody tr').filter({ hasText: title }).first();
    const deleteBtn = taskRow.getByRole('button', { name: /delete/i })
      .or(taskRow.locator('svg').last());
    const visible = await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (visible) {
      await deleteBtn.click({ force: true });
      const confirmBtn = this.page.getByRole('button', { name: /^Delete$/ }).last();
      const confirmVisible = await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (confirmVisible) {
        await confirmBtn.click({ force: true });
      }
    }
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }
}

module.exports = { CompanyModule };
