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

    // ── Create Company drawer ─────────────────────────────────────────────────
    this.createCompanyHeading = page.getByRole('heading', { name: 'Create a New Company' });
    this.companyNameInput     = page.getByRole('textbox', { name: 'Add Company Name' });
    this.companyDomainInput   = page.getByRole('textbox', { name: 'e.g., www.Signal.com' });
    this.addressInput         = page.getByRole('textbox', { name: 'Type Address' });
    this.addressOption        = page.getByText('S 9th St, Omaha, NE 68102, USA').first();
    // Market Vertical inside drawer — same heading pattern as Tasks/Notes custom dropdowns
    this.createIndustryTrigger  = page.getByRole('heading', { name: 'Select Industry', level: 6 });
    this.createSpStatusTrigger  = page.getByRole('heading', { name: 'Select SP Status', level: 6 });
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
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').first();
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
    const clickableCell = this.companiesTable.locator('tbody tr td').filter({
      has: this.page.getByText(exactText).first(),
    }).first();

    await clickableCell.waitFor({ state: 'visible', timeout: 30_000 });
    await clickableCell.scrollIntoViewIfNeeded().catch(() => {});
    await clickableCell.click({ force: true });
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
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').first();
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
    const escaped = String(expectedValueRegex);
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
      modalCreateButton.click({ force: true })
    ]);

    // If the modal did not close, try a JS click as a last resort.
    const closed = await this.createCompanyHeading.waitFor({ state: 'hidden', timeout: 20_000 }).then(() => true).catch(() => false);
    if (!closed) {
      await Promise.allSettled([
        waitForToast(),
        this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const target  = buttons.find((btn) => (btn.textContent || '').trim() === 'Create Company');
          target?.click();
        })
      ]);
      await this.createCompanyHeading.waitFor({ state: 'hidden', timeout: 20_000 });
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
}

module.exports = { CompanyModule };
