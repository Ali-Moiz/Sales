// pages/tasks-module.js
// Page Object Model -- Tasks Module, Signal CRM
// ALL locators live-verified via MCP browser on 2026-05-04
// Covers:
//   - Global Tasks list page (/app/sales/tasks)
//   - Create New Task drawer (global context with radio group)
//   - Create New Task drawer (deal context -- no radio group)
//   - Task detail slide-in panel
//   - Edit Task drawer ("Update This Task")
//   - Delete Task confirmation dialog
//   - Checkbox toggle (mark complete / revert to To-do)
//   - Filters, search, sort, pagination

const { expect } = require('@playwright/test');
const { env } = require('../utils/env');

const DEALS_PATH = '/app/sales/deals';

class TasksModule {
  constructor(page) {
    this.page = page;

    // ── Sidebar navigation ──────────────────────────────────────────────
    this.tasksMenuLink = page.getByRole('listitem', { name: 'Tasks' }).getByRole('link');

    // ── Page header ─────────────────────────────────────────────────────
    this.pageTitleParagraph = page.locator('banner paragraph').first()
      || page.locator('p').filter({ hasText: /^Tasks$/ }).first();

    // ── List page ───────────────────────────────────────────────────────
    this.newTaskButton    = page.getByRole('button', { name: 'New Task' });
    this.searchInput      = page.getByRole('searchbox', { name: 'Search by Title' });
    this.tasksTable       = page.getByRole('table');

    // Filter dropdowns (heading-based triggers, live-verified)
    // MCP-verified order in the filter bar: [0]=Type, [1]=Association, [2]=Priority, [3]=Status
    // Each filter is a div container with an h6 heading + chevron img.
    // Status default text is "To-do" which can clash with type filter, so we use
    // a sibling-based approach: the status filter container is the one AFTER the Priority heading.
    this.typeFilterTrigger     = page.locator('h6').filter({ hasText: /^(All Types|To-do|Email|Call|LinkedIn)$/ }).first().locator('..');
    this.associationFilterTrigger = page.locator('h6').filter({ hasText: 'Property/ Company/ Deals' }).locator('..');
    this.priorityFilterTrigger = page.locator('h6').filter({ hasText: /^(Priority|High|Medium|Low)$/ }).first().locator('..');
    // Status filter: last heading in the filter bar area (4th filter)
    this.statusFilterTrigger   = page.locator('h6').filter({ hasText: /^(To-do|All Status|Completed)$/ }).last().locator('..');

    // Date range
    this.dateRangeInput = page.locator('input[placeholder="MM/DD/YYYY - MM/DD/YYYY"]');

    // Column sort buttons
    this.taskTitleSortBtn  = page.getByRole('columnheader', { name: 'Task Title' }).getByRole('button');
    this.dueDateSortBtn    = page.getByRole('columnheader', { name: 'Due Date' }).getByRole('button');
    this.prioritySortBtn   = page.getByRole('columnheader', { name: 'Priority' }).getByRole('button');
    this.typeSortBtn       = page.getByRole('columnheader', { name: 'Type' }).getByRole('button');

    // Pagination
    this.paginationInfo    = page.locator('p').filter({ hasText: /\d+.\d+ of \d+/ });
    this.rowsPerPageCombo  = page.getByRole('combobox', { name: /Rows per page/ });
    this.nextPageBtn       = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn       = page.getByRole('button', { name: 'Go to previous page' });

    // Empty state
    this.emptyStateHeading = page.getByRole('heading', { name: 'No tasks Added.', level: 2 });

    // ── Create / Edit Drawer ────────────────────────────────────────────
    this.createDrawerHeading = page.getByRole('heading', { name: 'Create New Task', level: 3 });
    this.editDrawerHeading   = page.getByRole('heading', { name: 'Update This Task', level: 3 });

    // Close drawer link (anchor with href="#")
    this.drawerCloseLink = page.locator('.MuiDrawer-root a[href="#"]');

    // "Create task for" radio group (global context only)
    this.radioCompany  = page.getByRole('radio', { name: 'Company' });
    this.radioProperty = page.getByRole('radio', { name: 'Property' });
    this.radioDeal     = page.getByRole('radio', { name: 'Deal' });
    this.radioContacts = page.getByRole('radio', { name: 'Contacts' });
    this.radioGroup    = page.locator('radiogroup');

    // Common form fields
    this.taskTitleInput     = page.getByRole('textbox', { name: 'Task Title' });
    this.descriptionEditor  = page.getByRole('textbox', { name: 'rdw-editor' });
    // Character counter near the description editor
    // Live-verified: paragraph with pattern "N / M" (e.g., "0 / 500", "11 / 489")
    // The counter shows typed/remaining, and remaining decreases as you type
    this.descCharCounter    = page.locator('p').filter({ hasText: /^\d+ \/ \d+$/ });

    // Type dropdown (custom MUI, inside drawer)
    // Live-verified: heading "Select Type" h6 is inside a clickable container div
    this.typeDropdownTrigger = page.locator('h6').filter({ hasText: /^Select Type$/ }).locator('..');
    // Priority dropdown (custom MUI, inside drawer)
    this.priorityDropdownTrigger = page.locator('h6').filter({ hasText: /^Select Priority$/ }).locator('..');

    // Due Date
    this.dueDateInput = page.locator('.MuiDrawer-root input[placeholder*="AM"], .MuiDrawer-root input[placeholder*="PM"]').first();

    // Drawer action buttons
    this.saveButton   = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });

    // ── Validation errors ───────────────────────────────────────────────
    this.errTaskFor     = page.getByText('Task For is required.');
    this.errTaskTitle   = page.getByText('Task Title is required.');
    this.errDescription = page.getByText('Task Description is required.');
    this.errType        = page.getByText('Task Type is required.');
    this.errPriority    = page.getByText('Task Priority is required.');
    this.errDeal        = page.getByText('Deal is required.');
    this.errCompany     = page.getByText('Company is required.');

    // ── MUI Popper (dropdown options) ───────────────────────────────────
    // Per SKILL: use #simple-popper (id only, no role attribute).
    // Fallback to role=tooltip if popper id not present.
    this.popper = page.locator('#simple-popper').or(page.getByRole('tooltip')).first();

    // ── Task detail panel ─────────────────────────────────────────────────
    // Live-verified 2026-05-04: the slide-in panel is a MuiDrawer (right-anchored).
    // DOM: div.MuiDrawer-root > div.MuiDrawer-paper > … > h3 + close button
    const drawerPaper = page.locator('.MuiDrawer-paper');
    this.detailPanel         = drawerPaper;
    this.detailPanelHeading  = drawerPaper.locator('h3').first();
    this.detailDateTimeLabel = drawerPaper.getByText('Date & Time');
    this.detailTypeLabel     = drawerPaper.getByText('Type', { exact: true });
    this.detailPriorityLabel = drawerPaper.getByText('Priority', { exact: true });
    this.detailDescLabel     = drawerPaper.getByText('Task Description');
    this.detailCloseBtn      = drawerPaper.getByRole('button').last();

    // ── Detail panel actions (three-dot menu) ───────────────────────────
    // Note: three-dot menu only appears for user-created tasks, not HubSpot-imported tasks.
    // For user-created tasks, there are 2 buttons: actions (3-dot) and close (X).
    // For HubSpot tasks, there's only 1 button (close).
    this.moreActionsBtn = drawerPaper.getByRole('button').first();
    this.editMenuItem   = page.getByRole('menuitem', { name: 'Edit' });
    this.deleteMenuItem = page.getByRole('menuitem', { name: 'Delete' });

    // ── Delete confirmation dialog ──────────────────────────────────────
    this.deleteDialogText   = page.getByText('Are you sure you want to delete this task?');
    this.confirmDeleteBtn   = page.getByRole('button', { name: 'Delete' });
    // Cancel button in delete dialog -- use last Cancel button on page
    // (the drawer Cancel and the dialog Cancel may co-exist)
    this.cancelDeleteBtn    = page.getByRole('button', { name: 'Cancel' }).last();

    // ── Toast notifications ─────────────────────────────────────────────
    this.successToast = page.locator('.Toastify__toast-body[role="alert"]').first();

    // ── Deal detail page ────────────────────────────────────────────────
    this.tasksTab       = page.getByRole('tab', { name: 'Tasks' });
    this.tasksTabPanel  = page.getByRole('tabpanel', { name: 'Tasks' });
  }

  // ── Navigation ──────────────────────────────────────────────────────

  async assertPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/tasks/);
    await expect(this.newTaskButton).toBeVisible();
    // Wait for JS event handlers to hydrate
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async navigateToTasksViaSidebar() {
    await this.tasksMenuLink.click();
    await expect(this.page).toHaveURL(/\/app\/sales\/tasks/);
  }

  // ── Create Task drawer ──────────────────────────────────────────────

  async openCreateDrawer() {
    await this.newTaskButton.click();
    await expect(this.createDrawerHeading).toBeVisible();
  }

  async closeCreateDrawer() {
    // Only attempt to close if the drawer is currently visible
    const isOpen = await this.createDrawerHeading.isVisible().catch(() => false);
    if (isOpen) {
      await this.cancelButton.click();
      await expect(this.createDrawerHeading).toBeHidden();
    }
  }

  async selectTaskFor(entity) {
    const radioMap = {
      Company:  this.radioCompany,
      Property: this.radioProperty,
      Deal:     this.radioDeal,
      Contacts: this.radioContacts,
    };
    await radioMap[entity].click();
  }

  async fillTaskTitle(title) {
    await this.taskTitleInput.fill(title);
  }

  async fillDescription(text) {
    await this.descriptionEditor.click();
    await this.descriptionEditor.fill(text);
  }

  async selectType(option) {
    await this.typeDropdownTrigger.click();
    await expect(this.popper).toBeVisible();
    await this.popper.getByText(option, { exact: true }).click();
  }

  async selectPriority(option) {
    await this.priorityDropdownTrigger.click();
    await expect(this.popper).toBeVisible();
    await this.popper.getByText(option, { exact: true }).click();
  }

  async fillTaskForm({ title, description, type, priority }) {
    await this.fillTaskTitle(title);
    await this.fillDescription(description);
    await this.selectType(type);
    await this.selectPriority(priority);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async saveAndExpectSuccess() {
    await this.saveButton.click();
    await expect(this.successToast).toBeVisible({ timeout: 8_000 });
  }

  // ── Filters ─────────────────────────────────────────────────────────

  async filterByType(option) {
    await this.typeFilterTrigger.click();
    await expect(this.popper).toBeVisible();
    await this.popper.getByText(option, { exact: true }).click();
  }

  async filterByPriority(option) {
    await this.priorityFilterTrigger.click();
    await expect(this.popper).toBeVisible();
    await this.popper.getByText(option, { exact: true }).click();
  }

  async filterByStatus(option) {
    await this.statusFilterTrigger.click();
    await expect(this.popper).toBeVisible();
    await this.popper.getByText(option, { exact: true }).click();
  }

  async fillDateRange(dateRange) {
    await this.dateRangeInput.fill(dateRange);
    await this.page.keyboard.press('Enter');
  }

  async searchByTitle(term) {
    await this.searchInput.fill(term);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  // ── Sort ────────────────────────────────────────────────────────────

  async sortByTaskTitle() {
    await this.taskTitleSortBtn.click();
  }

  async sortByDueDate() {
    await this.dueDateSortBtn.click();
  }

  // ── Table helpers ───────────────────────────────────────────────────

  getTableRows() {
    return this.page.locator('table tbody tr').filter({ hasNot: this.page.locator('[colspan]') });
  }

  async getTaskRowCount() {
    return await this.getTableRows().count();
  }

  async getPaginationText() {
    return await this.paginationInfo.textContent();
  }

  // ── Task row interactions ───────────────────────────────────────────

  async openTaskDetailByTitle(taskTitle) {
    // Click the task title cell to open the detail slide-in panel
    await this.page.getByRole('cell', { name: taskTitle }).first().click();
    await expect(this.detailPanel).toBeVisible({ timeout: 5_000 });
  }

  async closeDetailPanel() {
    await this.detailCloseBtn.click();
    await expect(this.detailPanel).toBeHidden();
  }

  async toggleTaskCheckbox(taskTitle) {
    const row = this.page.getByRole('row').filter({ hasText: taskTitle });
    await row.getByRole('checkbox').click();
  }

  // ── Detail panel actions ────────────────────────────────────────────

  async openActionsMenu() {
    await this.moreActionsBtn.click();
    await expect(this.editMenuItem).toBeVisible();
  }

  async clickEdit() {
    await this.openActionsMenu();
    await this.editMenuItem.click();
    await expect(this.editDrawerHeading).toBeVisible();
  }

  async clickDelete() {
    await this.openActionsMenu();
    await this.deleteMenuItem.click();
    await expect(this.deleteDialogText).toBeVisible();
  }

  async confirmDelete() {
    await this.confirmDeleteBtn.click();
    await expect(this.successToast).toBeVisible({ timeout: 8_000 });
  }

  async cancelDelete() {
    await this.cancelDeleteBtn.click();
  }

  // ── Deal context navigation ─────────────────────────────────────────

  async navigateToDeals() {
    await this.page.goto(`${env.baseUrl}${DEALS_PATH}`, { waitUntil: 'domcontentloaded' });
  }

  async openFirstDeal() {
    // Wait for the table to fully render (network idle = JS event handlers attached)
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    const firstDealCell = this.page.locator('table tbody tr:first-child td:nth-child(2)');
    await expect(firstDealCell).toBeVisible({ timeout: 10_000 });
    await firstDealCell.scrollIntoViewIfNeeded();
    // Click the already-located cell directly (avoids truncated text mismatch with getByRole name)
    await firstDealCell.click();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    // SPA navigation -- use polling-based URL assertion
    await expect(this.page).toHaveURL(/\/app\/sales\/deals\/deal\/\d+/, { timeout: 15_000 });
  }

  async clickTasksTab() {
    await this.tasksTab.click();
    await expect(this.tasksTab).toHaveAttribute('aria-selected', 'true');
  }
}

module.exports = { TasksModule };
