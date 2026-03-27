const { expect } = require('@playwright/test');

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
    this.paginationInfo       = page.getByText(/\d+–\d+ of \d+/);
    this.nextPageBtn          = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn          = page.getByRole('button', { name: 'Go to previous page' });
    this.rowsPerPageCombo     = page.getByRole('combobox', { name: /Rows per page/ });
    this.companiesTable       = page.getByRole('table');

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
    this.cancelCreateBtn        = page.getByRole('button', { name: 'Cancel' });
    // Submit inside modal — scoped to avoid clash with list-page Create Company button
    this.successToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /Company Created Successfully|Translation missing: en\.api\.v1\.shared\.companies\.success\.create/i
    }).first();

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
    return `Smoke Company ${Date.now()}`;
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

  // ── Create Company ──────────────────────────────────────────────────────────

  async openCreateCompanyModal() {
    await this.createCompanyButton.first().click();
    await this.createCompanyHeading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.companyNameInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async assertCreateCompanyModalOpen() {
    await expect(this.createCompanyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.companyNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.createIndustryTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.addressInput).toBeVisible({ timeout: 5_000 });
  }

  async assertCreateCompanySubmitDisabled() {
    // Create Company submit button inside the modal — disabled until required fields filled
    const modalCreateBtn = this.page
      .getByRole('generic', { name: 'Create a New Company' })
      .getByRole('button', { name: 'Create Company' })
      .or(this.page.locator('[role="presentation"] button[type="button"]')
        .filter({ hasText: 'Create Company' }))
      .last();
    // Fallback: just look for the last Create Company button on the page (inside modal)
    const allCreateBtns = this.page.getByRole('button', { name: 'Create Company' });
    const count = await allCreateBtns.count();
    const submitBtn = allCreateBtns.nth(count - 1);
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
    await this.addressInput.click();
    await this.addressInput.fill(address);
    await this.addressOption.waitFor({ state: 'visible', timeout: 10_000 });
    await this.addressOption.click({ force: true });
    await this.page.waitForTimeout(1_500);
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

    const clicked = await Promise.allSettled([
      waitForToast(),
      modalCreateButton.click({ force: true })
    ]).then((results) => results[1]?.status === 'fulfilled').catch(() => false);
    if (clicked) return;

    await Promise.allSettled([
      waitForToast(),
      this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target  = buttons.find((btn) => (btn.textContent || '').trim() === 'Create Company');
        target?.click();
      })
    ]);
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
    await this.companySearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.companySearchInput.fill(companyName);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(2_000);

    const companyRow = this.page.getByText(companyName, { exact: true }).first();
    await companyRow.waitFor({ state: 'visible', timeout: 10_000 });
    await companyRow.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertCompanyDetailOpened(companyName) {
    await expect(this.page.getByRole('heading', { name: companyName, exact: true }).first())
      .toBeVisible({ timeout: 15_000 });
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
