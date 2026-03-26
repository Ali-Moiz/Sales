// ============================================================
// pages/task.page.js
// Page Object Model – Tasks Module
//
// Signal CRM | Playwright JS | POM
// Live-explored: 2026-03-25 via MCP browser automation
//
// Covers:
//   - Global Tasks list page (/app/sales/tasks)
//   - Create New Task drawer (global context)
//   - Create New Task drawer (deal context – no radio group)
//   - Task detail slide-in panel
//   - Edit Task drawer ("Update This Task")
//   - Delete Task confirmation dialog
//   - Mark/Unmark task complete (checkbox toggle)
//   - All filter, search, sort interactions
// ============================================================

const TASKS_URL = '/app/sales/tasks';

class TaskPage {
  constructor(page) {
    this.page = page;

    // ── Page-level elements ──────────────────────────────────
    this.pageTitle         = page.getByRole('paragraph').filter({ hasText: 'Tasks' });
    this.newTaskButton     = page.getByRole('button', { name: 'New Task' });

    // ── Search & Filters ─────────────────────────────────────
    this.searchInput       = page.getByRole('searchbox', { name: 'Search by Title' });
    this.typeFilterBtn     = page.locator('div').filter({ hasText: /^All Types$/ }).first();
    this.propertyFilterBtn = page.locator('h6').filter({ hasText: 'Property/ Company/ Deals' });
    this.priorityFilterBtn = page.locator('h6').filter({ hasText: /^Priority$/ });
    this.statusFilterBtn   = page.locator('h6').filter({ hasText: /^(To-do|All Status|Completed)$/ }).first();
    this.dateRangeInput    = page.getByPlaceholder('MM/DD/YYYY - MM/DD/YYYY');

    // ── Table ────────────────────────────────────────────────
    this.tableBody          = page.locator('table tbody');
    this.taskTitleColHeader = page.getByRole('button', { name: 'Task Title' });
    this.dueDateColHeader   = page.getByRole('button', { name: 'Due Date' });
    this.priorityColHeader  = page.getByRole('button', { name: 'Priority' });
    this.typeColHeader      = page.getByRole('button', { name: 'Type' });
    this.emptyStateHeading  = page.getByRole('heading', { name: 'No tasks Added.' });
    this.rowsPerPageSelect  = page.getByRole('combobox', { name: /Rows per page/ });
    this.paginationInfo     = page.locator('p').filter({ hasText: /\d+–\d+ of \d+/ });

    // ── Create / Edit Drawer ─────────────────────────────────
    // Drawer headings
    this.createDrawerHeading = page.getByRole('heading', { name: 'Create New Task' });
    this.editDrawerHeading   = page.getByRole('heading', { name: 'Update This Task' });

    // "Create task for" radio group (global Tasks page only)
    this.radioCompany   = page.getByRole('radio', { name: 'Company' });
    this.radioProperty  = page.getByRole('radio', { name: 'Property' });
    this.radioDeal      = page.getByRole('radio', { name: 'Deal' });
    this.radioContacts  = page.getByRole('radio', { name: 'Contacts' });

    // Association dropdown triggers (label-anchored, rendered by radio selection)
    this.companyAssocDropdown   = page.locator('label[for="company"] + div, div[aria-label*="Company"]').first();
    this.propertyAssocDropdown  = page.locator('label[for="property"] + div, div[aria-label*="Property"]').first();
    this.dealAssocDropdown      = page.locator('h6').filter({ hasText: 'Select a Deal' }).first();
    this.contactAssocDropdown   = page.locator('h6').filter({ hasText: 'Select a Contact' }).first();

    // Common drawer fields
    this.taskTitleInput   = page.getByRole('textbox', { name: 'Task Title' });
    this.descriptionEditor = page.getByRole('textbox', { name: 'rdw-editor' });
    this.descCharCounter  = page.locator('p').filter({ hasText: /\d+ \/ \d+/ });

    // Type custom dropdown (inside drawer)
    this.typeDropdownTrigger = page.locator('h6').filter({ hasText: /^(Select Type|To-do|Email|Call|LinkedIn)$/ }).first();

    // Priority custom dropdown (inside drawer)
    this.priorityDropdownTrigger = page.locator('h6').filter({ hasText: /^(Select Priority|High|Medium|Low)$/ }).first();

    // Due Date
    this.dueDateInput     = page.locator('input[placeholder*="efine"]').first();
    this.dueDateCalBtn    = page.getByRole('button', { name: /Choose date/ });

    // Drawer actions
    this.cancelButton     = page.getByRole('button', { name: 'Cancel' });
    this.saveButton       = page.getByRole('button', { name: 'Save' });

    // ── Validation errors ────────────────────────────────────
    this.errTaskFor      = page.getByText('Task For is required.');
    this.errTaskTitle    = page.getByText('Task Title is required.');
    this.errDescription  = page.getByText('Task Description is required.');
    this.errType         = page.getByText('Task Type is required.');
    this.errPriority     = page.getByText('Task Priority is required.');
    this.errDeal         = page.getByText('Deal is required.');
    this.errCompany      = page.getByText('Company is required.');

    // ── Task detail panel ────────────────────────────────────
    this.detailPanel        = page.locator('[class*="drawer"], [role="dialog"], [data-testid*="detail"]').last();
    this.detailTitle        = page.locator('[class*="active"] h3, [class*="detail"] h3').first();
    this.detailTypeLabel    = page.locator('[class*="active"]').getByText('Type').locator('..').locator('p, span, div').last();
    this.detailPriorityLabel = page.locator('[class*="active"]').getByText('Priority').locator('..').locator('h6').first();
    this.detailDescription  = page.locator('[class*="active"] p').last();
    this.moreActionsBtn     = page.locator('[class*="active"] button img[src*="dots"], [class*="active"] button').first();
    this.editMenuItem       = page.getByRole('menuitem', { name: 'Edit' });
    this.deleteMenuItem     = page.getByRole('menuitem', { name: 'Delete' });
    this.closeDetailBtn     = page.locator('[class*="active"] a[href="#"] img, [class*="active"] button').last();

    // ── Delete confirmation dialog ───────────────────────────
    this.deleteDialog        = page.getByRole('dialog', { name: 'Delete Task' });
    this.deleteDialogText    = page.getByText('Are you sure you want to delete this task?');
    this.confirmDeleteBtn    = page.getByRole('button', { name: 'Delete' });
    this.cancelDeleteBtn     = page.getByRole('button', { name: 'Cancel' });

    // ── Toast notifications ──────────────────────────────────
    this.successToast        = page.getByRole('alert');
  }

  // ── Navigation ─────────────────────────────────────────────

  async navigateToTasks() {
    await this.page.goto(TASKS_URL);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToTasksViaNav() {
    await this.page.getByRole('link', { name: /tasks/i }).first().click();
    await this.page.waitForURL(`**${TASKS_URL}`);
  }

  // ── Create Task (global page) ───────────────────────────────

  async openCreateDrawer() {
    await this.newTaskButton.click();
    await this.createDrawerHeading.waitFor({ state: 'visible', timeout: 6_000 });
  }

  async selectCreateTaskFor(entity) {
    // entity: 'Company' | 'Property' | 'Deal' | 'Contacts'
    const radioMap = {
      Company:  this.radioCompany,
      Property: this.radioProperty,
      Deal:     this.radioDeal,
      Contacts: this.radioContacts,
    };
    await radioMap[entity].click();
    await this.page.waitForTimeout(300);
  }

  async fillTaskTitle(title) {
    await this.taskTitleInput.fill(title);
  }

  async fillTaskDescription(text) {
    await this.descriptionEditor.click();
    await this.descriptionEditor.fill(text);
  }

  async selectType(typeOption) {
    // typeOption: 'To-do' | 'Email' | 'Call' | 'LinkedIn'
    await this.typeDropdownTrigger.click();
    await this.page.getByRole('tooltip').getByText(typeOption, { exact: true }).click();
    await this.page.waitForTimeout(300);
  }

  async selectPriority(priorityOption) {
    // priorityOption: 'High' | 'Medium' | 'Low'
    await this.priorityDropdownTrigger.click();
    await this.page.getByRole('tooltip').getByText(priorityOption, { exact: true }).click();
    await this.page.waitForTimeout(300);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Fill all required fields for a task (deal-context or standalone with no association needed).
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string} opts.description
   * @param {string} opts.type - 'To-do' | 'Email' | 'Call' | 'LinkedIn'
   * @param {string} opts.priority - 'High' | 'Medium' | 'Low'
   */
  async fillTaskForm({ title, description, type, priority }) {
    await this.fillTaskTitle(title);
    await this.fillTaskDescription(description);
    await this.selectType(type);
    await this.selectPriority(priority);
    await this.page.waitForTimeout(300);
  }

  async saveTask() {
    await this.saveButton.click();
    await this.successToast.waitFor({ state: 'visible', timeout: 8_000 });
  }

  // ── Filters ────────────────────────────────────────────────

  async filterByType(option) {
    // option: 'To-Do' | 'Email' | 'Call' | 'LinkedIn' | 'All Types'
    await this.typeFilterBtn.click();
    await this.page.getByText(option, { exact: true }).first().click();
    await this.page.waitForTimeout(500);
  }

  async filterByPriority(option) {
    // option: 'High' | 'Medium' | 'Low' | 'All Priority'
    await this.priorityFilterBtn.click();
    await this.page.getByText(option, { exact: true }).first().click();
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(option) {
    // option: 'To-do' | 'Completed' | 'All Status'
    await this.statusFilterBtn.click();
    await this.page.getByText(option, { exact: true }).first().click();
    await this.page.waitForTimeout(500);
  }

  async filterByDateRange(startDate, endDate) {
    // startDate / endDate: 'MM/DD/YYYY' format
    await this.dateRangeInput.fill(`${startDate} - ${endDate}`);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async searchByTitle(term) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(800); // debounce
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(800);
  }

  // ── Sort ───────────────────────────────────────────────────

  async sortByTaskTitle() {
    await this.taskTitleColHeader.click();
    await this.page.waitForTimeout(500);
  }

  async sortByDueDate() {
    await this.dueDateColHeader.click();
    await this.page.waitForTimeout(500);
  }

  // ── Task row interactions ──────────────────────────────────

  /**
   * Click on a task row to open the detail panel.
   * @param {string} taskTitle - partial or full task title
   */
  async openTaskDetail(taskTitle) {
    await this.page.getByRole('cell', { name: taskTitle }).first().click();
    await this.page.waitForTimeout(600);
  }

  /**
   * Toggle the task complete checkbox for a given task title.
   * @param {string} taskTitle
   */
  async toggleTaskComplete(taskTitle) {
    const row = this.page.getByRole('row').filter({ hasText: taskTitle });
    const checkbox = row.getByRole('checkbox');
    await checkbox.click();
    await this.page.waitForTimeout(500);
  }

  async isTaskChecked(taskTitle) {
    const row = this.page.getByRole('row').filter({ hasText: taskTitle });
    const checkbox = row.getByRole('checkbox');
    return await checkbox.isChecked();
  }

  // ── Detail Panel actions ───────────────────────────────────

  async openMoreActionsMenu() {
    // Click the ⋮ three-dot menu in the task detail panel
    await this.page.locator('[class*="active"] button').first().click();
    await this.page.getByRole('menuitem', { name: 'Edit' }).waitFor({ state: 'visible', timeout: 5_000 });
  }

  async clickEditFromMenu() {
    await this.openMoreActionsMenu();
    await this.editMenuItem.click();
    await this.editDrawerHeading.waitFor({ state: 'visible', timeout: 6_000 });
  }

  async clickDeleteFromMenu() {
    await this.openMoreActionsMenu();
    await this.deleteMenuItem.click();
    await this.deleteDialog.waitFor({ state: 'visible', timeout: 5_000 });
  }

  // ── Edit Task ─────────────────────────────────────────────

  async editTask({ title, description, type, priority }) {
    if (title)       await this.fillTaskTitle(title);
    if (description) await this.fillTaskDescription(description);
    if (type)        await this.selectType(type);
    if (priority)    await this.selectPriority(priority);
  }

  async saveEditedTask() {
    await this.saveButton.click();
    await this.successToast.waitFor({ state: 'visible', timeout: 8_000 });
  }

  // ── Delete Task ────────────────────────────────────────────

  async confirmDelete() {
    await this.confirmDeleteBtn.click();
    await this.successToast.waitFor({ state: 'visible', timeout: 8_000 });
  }

  async cancelDelete() {
    await this.cancelDeleteBtn.click();
  }

  // ── Helper assertions (state checks) ──────────────────────

  async isEmptyStateVisible() {
    return await this.emptyStateHeading.isVisible();
  }

  async getTaskRowCount() {
    const rows = this.page.locator('table tbody tr').filter({ hasNot: this.page.locator('[colspan]') });
    return await rows.count();
  }

  async getPaginationText() {
    return await this.paginationInfo.textContent();
  }

  async isCreateDrawerOpen() {
    return await this.createDrawerHeading.isVisible();
  }

  async isEditDrawerOpen() {
    return await this.editDrawerHeading.isVisible();
  }

  async isDeleteDialogVisible() {
    return await this.deleteDialog.isVisible();
  }

  async isValidationErrorVisible(errorLocator) {
    return await errorLocator.isVisible();
  }

  async waitForSuccessToast() {
    await this.successToast.waitFor({ state: 'visible', timeout: 8_000 });
  }
}

module.exports = { TaskPage };
