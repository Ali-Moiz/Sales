// pages/contactName.page.js
// Page Object for the Contacts module (Contact Name)
// Covers: list view, create, edit, view detail, search

const { expect } = require('@playwright/test');

class ContactNamePage {
  constructor(page) {
    this.page = page;

    // ── Navigation ────────────────────────────────────────────
    this.contactsNavLink = page
      .getByRole('listitem', { name: 'Contacts' })
      .getByRole('link');

    // ── List Page ─────────────────────────────────────────────
    this.pageHeading       = page.getByRole('paragraph').filter({ hasText: 'Contacts' }).first();
    this.totalCountHeading = page.getByRole('heading', { level: 1 }).filter({ hasText: /\d/ }).first();
    this.searchBox         = page.getByRole('searchbox', { name: 'Search' });
    this.createContactBtn  = page.getByRole('button', { name: 'Create Contact' });
    this.contactsTable     = page.getByRole('table');
    this.contactNameHeader = page.getByRole('columnheader', { name: 'Contact Name' });

    // Pagination
    this.rowsPerPageCombo = page.getByRole('combobox', { name: /Rows per page/ });
    this.nextPageBtn      = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn      = page.getByRole('button', { name: 'Go to previous page' });
    this.paginationInfo   = page.getByText(/\d+–\d+ of \d+/);

    // ── Create Contact Drawer ─────────────────────────────────
    this.createDrawerHeading = page.getByRole('heading', { name: 'Create Contact', level: 3 });
    this.emailField          = page.getByRole('textbox', { name: 'Email' });
    this.firstNameField      = page.getByRole('textbox', { name: 'First Name' });
    this.lastNameField       = page.getByRole('textbox', { name: 'Last Name' });
    this.jobTitleField       = page.getByRole('textbox', { name: 'Job Title' });
    this.contactPhoneField   = page.getByRole('textbox', { name: 'Enter phone number' }).first();
    this.cellPhoneField      = page.getByRole('textbox', { name: 'Enter phone number' }).last();
    this.createSubmitBtn     = page.getByRole('button', { name: 'Create Contact' }).last();
    this.cancelBtn           = page.getByRole('button', { name: 'Cancel' });

    // ── Edit Contact Drawer ────────────────────────────────────
    this.editDrawerHeading = page.getByRole('heading', { name: 'Edit Contact', level: 3 });
    this.saveContactBtn    = page.getByRole('button', { name: 'Save Contact' });

    // ── Detail Page ───────────────────────────────────────────
    this.editBtn              = page.getByRole('button', { name: 'Edit' });
    this.aboutThisContactBtn  = page.getByRole('button', { name: 'About this Contact' });
    this.companySectionBtn    = page.getByRole('button', { name: /Company/ });
    this.propertySectionBtn   = page.getByRole('button', { name: /Property/ });
    this.overviewHeading      = page.getByRole('heading', { name: 'Overview', level: 1 });
    this.activitiesTab        = page.getByRole('tab', { name: 'Activities' });
    this.notesTab             = page.getByRole('tab', { name: /Notes/ });
    this.tasksTab             = page.getByRole('tab', { name: /Tasks/ });

    // ── Sorting ───────────────────────────────────────────────
    this.sortByContactNameBtn  = page.getByRole('button', { name: 'Contact Name' });
    this.sortByCreatedDateBtn  = page.getByRole('button', { name: 'Created Date' });
    this.sortByLastActivityBtn = page.getByRole('button', { name: 'Last Activity' });
  }

  // ── Navigation Actions ────────────────────────────────────

  /** Navigate to /app/sales/contacts */
  async navigateToModule() {
    const clicked = await this.contactsNavLink.click({ timeout: 10_000 }).then(() => true).catch(() => false);
    if (!clicked) {
      await this.navigateDirectly();
      return;
    }

    await this.page.waitForURL(/\/app\/sales\/contacts$/, { timeout: 15_000 }).catch(async () => {
      await this.navigateDirectly();
    });
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async navigateDirectly() {
    await this.page.goto('/app/sales/contacts', { waitUntil: 'domcontentloaded' });
    await this.page.waitForURL(/\/app\/sales\/contacts$/, { timeout: 15_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async closeOpenDrawerIfPresent() {
    if (await this.createDrawerHeading.isVisible().catch(() => false)) {
      await this.cancelBtn.click().catch(() => {});
      await expect(this.createDrawerHeading).not.toBeVisible({ timeout: 8_000 });
    }

    if (await this.editDrawerHeading.isVisible().catch(() => false)) {
      await this.cancelBtn.click().catch(() => {});
      await expect(this.editDrawerHeading).not.toBeVisible({ timeout: 8_000 });
    }
  }

  // ── List Page Actions ─────────────────────────────────────

  /** Search by name or email in the list search box */
  async searchContact(term) {
    await this.searchBox.fill(term);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  /** Clear search box */
  async clearSearch() {
    await this.searchBox.clear();
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  /** Return all visible contact name cells from the table */
  async getContactNameCells() {
    return this.page
      .getByRole('table')
      .getByRole('cell')
      .filter({ has: this.page.locator('div') });
  }

  /** Click a contact row by its name to open detail page */
  async openContactByName(name) {
    await this.page.getByRole('cell', { name }).click();
    await this.page.waitForURL(/\/contacts\/detail\//);
  }

  /** Get pagination info text e.g. "1–10 of 8420" */
  async getPaginationText() {
    return await this.paginationInfo.textContent();
  }

  // ── Create Contact ─────────────────────────────────────────

  async openCreateDrawer() {
    await this.createContactBtn.click();
    await expect(this.createDrawerHeading).toBeVisible();
  }

  /**
   * Fill the create form.
   * Email is required first; First/Last Name fields unlock after email is entered.
   */
  async fillCreateForm({ email, firstName, lastName, jobTitle, phone, cellPhone }) {
    // Email first — unlocks other fields
    await this.emailField.fill(email);
    await this.page.keyboard.press('Tab'); // trigger validation/unlock

    if (firstName) await this.firstNameField.fill(firstName);
    if (lastName)  await this.lastNameField.fill(lastName);
    if (jobTitle)  await this.jobTitleField.fill(jobTitle);
    if (phone)     await this.contactPhoneField.fill(phone);
    if (cellPhone) await this.cellPhoneField.fill(cellPhone);
  }

  async submitCreateForm() {
    await this.createSubmitBtn.click();
    // Wait for drawer to close / list to refresh
    await expect(this.createDrawerHeading).not.toBeVisible({ timeout: 8000 });
  }

  async cancelCreateForm() {
    await this.cancelBtn.click();
    await expect(this.createDrawerHeading).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Full create flow helper.
   * Returns after successful creation.
   */
  async createContact(contactData) {
    await this.openCreateDrawer();
    await this.fillCreateForm(contactData);
    await this.submitCreateForm();
  }

  // ── Edit Contact ───────────────────────────────────────────

  async openEditDrawer() {
    await this.editBtn.click();
    await expect(this.editDrawerHeading).toBeVisible();
  }

  async fillEditForm({ firstName, lastName, jobTitle, phone, cellPhone }) {
    if (firstName) {
      await this.firstNameField.fill(firstName);
    }
    if (lastName)  await this.lastNameField.fill(lastName);
    if (jobTitle)  await this.jobTitleField.fill(jobTitle);
    if (phone)     await this.contactPhoneField.fill(phone);
    if (cellPhone) await this.cellPhoneField.fill(cellPhone);
  }

  async submitEditForm() {
    await this.saveContactBtn.click();
    await expect(this.editDrawerHeading).not.toBeVisible({ timeout: 8000 });
  }

  async cancelEditForm() {
    await this.cancelBtn.click();
    await expect(this.editDrawerHeading).not.toBeVisible({ timeout: 5000 });
  }

  /** Full edit flow helper */
  async editContact(data) {
    await this.openEditDrawer();
    await this.fillEditForm(data);
    await this.submitEditForm();
  }

  // ── Detail Page Actions ────────────────────────────────────

  /** Assert we are on the contact detail page */
  async assertOnDetailPage(contactName) {
    await expect(this.page).toHaveURL(/\/contacts\/detail\//);
    await expect(
      this.page.getByRole('heading', { name: contactName, level: 3 })
    ).toBeVisible();
  }

  async switchToNotesTab() {
    await this.notesTab.click();
  }

  async switchToTasksTab() {
    await this.tasksTab.click();
  }

  // ── Sorting ────────────────────────────────────────────────

  async sortByContactName() {
    await this.sortByContactNameBtn.click();
    await this.page.waitForTimeout(400);
  }

  async sortByCreatedDate() {
    await this.sortByCreatedDateBtn.click();
    await this.page.waitForTimeout(400);
  }

  // ── Assertions ─────────────────────────────────────────────

  async assertContactsTableVisible() {
    await expect(this.contactsTable).toBeVisible();
    await expect(this.contactNameHeader).toBeVisible();
  }

  async assertContactInTable(name) {
    await expect(
      this.page.getByRole('cell', { name })
    ).toBeVisible();
  }

  async assertContactNotInTable(name) {
    await expect(
      this.page.getByRole('cell', { name })
    ).not.toBeVisible();
  }

  async assertCreateButtonEnabled() {
    await expect(this.createContactBtn).toBeEnabled();
  }

  async assertCreateSubmitDisabled() {
    await expect(this.createSubmitBtn).toBeDisabled();
  }

  async assertSaveContactDisabled() {
    await expect(this.saveContactBtn).toBeDisabled();
  }
}

module.exports = { ContactNamePage };
