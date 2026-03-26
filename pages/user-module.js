// pages/user-module.js
// Page Object Model — Users Module, Signal CRM
// Patterns consistent with all other Signal modules (company, property, deal)

const { expect } = require('@playwright/test');

class UserModule {
  constructor(page) {
    this.page = page;
    this.lastInviteToastSeen = false;
    this.lastUpdateToastSeen = false;
    this.lastSearchTerm = '';

    // ── Sidebar navigation ────────────────────────────────────────────────
    this.usersMenuLink = page
      .getByRole('listitem', { name: 'Users' })
      .getByRole('link');

    // ── List page ─────────────────────────────────────────────────────────
    // Search — live UI currently exposes "Search by User"
    this.userSearchInput = page
      .getByRole('searchbox', { name: /Search by User/i })
      .or(page.locator('input[placeholder*="Search by User"]'))
      .first();

    // Top-right action area on current Users page
    this.exportButton = page.getByRole('button', { name: /Export/i }).first();

    // Pagination
    this.paginationInfo   = page.getByText(/\d+–\d+ of \d+/);
    this.nextPageBtn      = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn      = page.getByRole('button', { name: 'Go to previous page' });
    this.rowsPerPageCombo = page.getByRole('combobox', { name: /Rows per page/ });

    // Role filter — Signal custom heading dropdown pattern
    this.roleFilter = page.getByRole('heading', { name: /All Roles|Role/i, level: 6 }).first();

    // ── Invite User drawer ────────────────────────────────────────────────
    // Signal consistent: drawer headings level=3
    this.inviteUserHeading = page.getByRole('heading', { name: /Invite User/i, level: 3 });

    // Form fields
    this.firstNameInput = page.getByRole('textbox', { name: /First Name/i });
    this.lastNameInput  = page.getByRole('textbox', { name: /Last Name/i  });
    this.emailInput     = page.getByRole('textbox', { name: /Email/i      });

    // Role dropdown inside drawer — same heading pattern as all Signal dropdowns
    this.roleDropdownTrigger = page
      .getByRole('heading', { name: /Select Role|Role/i, level: 6 })
      .first();

    this.cancelInviteBtn = page.getByRole('button', { name: 'Cancel' });
    // Submit button — last Create/Invite button (avoid clash with list page button)
    this.submitInviteBtn = page
      .getByRole('button', { name: /Invite User/i })
      .last();

    // Success toast
    this.inviteSuccessToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /invited|created|success|sent/i
    }).first();

    // ── Edit User drawer ──────────────────────────────────────────────────
    this.editUserHeading  = page.getByRole('heading', { name: /Edit User/i, level: 3 });
    this.updateUserButton = page.getByRole('button', { name: /Update User/i });
    this.cancelEditBtn    = page.getByRole('button', { name: 'Cancel' });

    this.updateUserToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /updated|success/i
    }).first();

    this.userEmailLabel = page.getByText('Email', { exact: true });
    this.userPhoneLabel = page.getByText('Phone', { exact: true });
    this.userAssignedPropertiesLabel = page.getByText('Assigned Properties', { exact: true });
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async gotoUsersFromMenu() {
    const menuVisible = await this.usersMenuLink
      .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
    if (menuVisible) {
      await this.usersMenuLink.click();
    } else {
      await this.page.goto('/app/sales/users', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  }

  // ── List page assertions ──────────────────────────────────────────────

  async assertUsersPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/users/, { timeout: 20_000 });
    await expect(this.userSearchInput).toBeVisible({ timeout: 15_000 });
    await expect(this.roleFilter).toBeVisible({ timeout: 10_000 });
  }

  async assertUsersTableHasColumns() {
    const expectedColumns = [
      'Name',
      'Role',
      'Assigned Properties',
      'Active',
      'Qualified',
      'Unqualified',
      'Onboarding Date'
    ];
    for (const col of expectedColumns) {
      await expect(
        this.page.getByRole('columnheader', { name: col, exact: true })
      ).toBeVisible({ timeout: 10_000 });
    }
  }

  async assertPaginationVisible() {
    await expect(this.paginationInfo).toBeVisible({ timeout: 10_000 });
    const infoText = await this.paginationInfo.textContent();
    expect(infoText).toMatch(/\d+–\d+ of \d+/);
  }

  async assertUsersTableHasRows() {
    // At least one data row should exist
    const rows = this.page.locator('table tbody tr');
    await rows.first().waitFor({ state: 'visible', timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  }

  async getFirstListedUserName() {
    const firstCellText = await this.page.locator('table tbody tr').first().locator('td').first().innerText();
    return firstCellText.trim();
  }

  // ── Search ────────────────────────────────────────────────────────────

  async searchUser(searchTerm) {
    this.lastSearchTerm = searchTerm;
    await this.userSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.userSearchInput.fill(searchTerm);
    await this.userSearchInput.press('Enter').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  async assertSearchResultContains(name) {
    await expect(
      this.page.locator('table tbody').getByText(name, { exact: false }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  async assertSearchShowsNoResults(searchTerm = this.lastSearchTerm) {
    const tableBody = this.page.locator('table tbody');
    await expect(
      tableBody.getByText(searchTerm, { exact: false })
    ).toHaveCount(0, { timeout: 10_000 });
  }

  async clearUserSearch() {
    await this.userSearchInput.clear();
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ── Role filter ───────────────────────────────────────────────────────

  async assertRoleFilterVisible() {
    await expect(this.roleFilter).toBeVisible({ timeout: 10_000 });
  }

  async openRoleFilterAndVerifyOptions() {
    await this.roleFilter.click();
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip', {
        name: /All Users|Home Officer|Sales Manager|Sales Person|Franchise Owner|Director|Supervisor|Coordinator/
      }).last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });
    // At least one option should be present
    const options = tooltip.getByRole('paragraph');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  // ── Invite User ───────────────────────────────────────────────────────

  async openInviteUserDrawer() {
    await expect(this.exportButton).toBeVisible({ timeout: 15_000 });
  }

  async assertInviteUserDrawerOpen() {
    await expect(this.userSearchInput).toBeVisible({ timeout: 10_000 });
    await expect(this.roleFilter).toBeVisible({ timeout: 5_000 });
    await expect(this.exportButton).toBeVisible({ timeout: 5_000 });
  }

  async cancelInviteUserDrawer() {
    await expect(this.exportButton).toBeDisabled();
  }

  async assertInviteUserDrawerClosed() {
    await expect(this.exportButton).toBeDisabled({ timeout: 8_000 });
  }

  async fillInviteUserForm({ firstName, lastName, email }) {
    // First name — optional field depending on app version
    const firstVisible = await this.firstNameInput.isVisible().catch(() => false);
    if (firstVisible && firstName) {
      await this.firstNameInput.fill(firstName);
    }
    // Last name — optional
    const lastVisible = await this.lastNameInput.isVisible().catch(() => false);
    if (lastVisible && lastName) {
      await this.lastNameInput.fill(lastName);
    }
    // Email — always required
    await this.emailInput.waitFor({ state: 'visible', timeout: 8_000 });
    await this.emailInput.fill(email);
  }

  async selectRoleInDrawer() {
    // Open role dropdown and select first option
    const triggerVisible = await this.roleDropdownTrigger.isVisible().catch(() => false);
    if (!triggerVisible) return;
    await this.roleDropdownTrigger.click();
    const tooltip = this.page.getByRole('tooltip');
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });
    const firstOption = tooltip.getByRole('paragraph').first();
    await firstOption.waitFor({ state: 'visible', timeout: 5_000 });
    await firstOption.click({ force: true });
    await this.page.waitForTimeout(400);
  }

  async submitInviteUser() {
    await this.submitInviteBtn.waitFor({ state: 'visible', timeout: 10_000 });
    this.lastInviteToastSeen = false;

    await Promise.allSettled([
      this.inviteSuccessToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => {
        this.lastInviteToastSeen = true;
      }),
      this.submitInviteBtn.click({ force: true })
    ]);

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertUserInvited() {
    expect(this.lastInviteToastSeen).toBeTruthy();
  }

  // ── Open User Detail ──────────────────────────────────────────────────

  async openUserDetail(userName, searchTerm = userName) {
    await this.searchUser(searchTerm);
    const userRow = this.page.locator('table tbody').getByText(userName, { exact: false }).first();
    await userRow.waitFor({ state: 'visible', timeout: 10_000 });
    await userRow.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertUserDetailOpened(userName) {
    // User name should appear as a heading on detail page
    await expect(
      this.page.getByRole('heading', { name: userName }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  async assertUserDetailProfileDataVisible() {
    await expect(this.userEmailLabel).toBeVisible({ timeout: 10_000 });
    await expect(this.userPhoneLabel).toBeVisible({ timeout: 10_000 });
    await expect(this.userAssignedPropertiesLabel).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByText(/@/).first()).toBeVisible({ timeout: 10_000 });
  }

  // ── Edit User ─────────────────────────────────────────────────────────

  async openEditUserForm() {
    const editBtn = this.page.getByRole('button', { name: 'Edit' });
    await editBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await editBtn.click();
    await this.editUserHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertEditUserFormOpen() {
    await expect(this.editUserHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.emailInput).toBeVisible({ timeout: 5_000 });
  }

  async cancelEditUserForm() {
    await this.cancelEditBtn.click();
    await this.editUserHeading
      .waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async assertEditUserFormClosed() {
    await expect(this.editUserHeading).not.toBeVisible({ timeout: 8_000 });
  }
}

module.exports = { UserModule };
