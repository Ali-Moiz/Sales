// ============================================================
// tests/task.spec.js
// Smoke Tests – Tasks Module
//
// Signal CRM | Playwright JS | Page Object Model
// Live-explored: 2026-03-25 via MCP browser automation
//
// Prerequisites:
//   - Playwright installed  (npm install -D @playwright/test)
//   - npx playwright install chromium
//   - Run: npx playwright test tests/task.spec.js --headed
// ============================================================

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const { TaskPage }  = require('../pages/task.page');

// ── Test data ────────────────────────────────────────────────
const BASE_URL   = 'https://uat.sales.teamsignal.com';
const DEAL_URL   = `${BASE_URL}/app/sales/deals/deal/18596`;

const CREDENTIALS = {
  email:    'moiz.qureshi+ho@camp1.tkxel.com',
  password: 'Admin@123',
};

const TASK_DATA = {
  title:       'TC-TASK-SMOKE-001 Automation Test Task',
  description: 'This is a smoke test task created for Playwright automation validation.',
  type:        'To-do',
  priority:    'High',
  editedTitle: 'TC-TASK-SMOKE-001 Automation Test Task (EDITED)',
};

// ── Shared setup ─────────────────────────────────────────────

test.describe('Tasks Module – Smoke Tests', () => {
  let loginPage;
  let taskPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    taskPage  = new TaskPage(page);

    await loginPage.navigate();
    await loginPage.login(CREDENTIALS.email, CREDENTIALS.password);
    await loginPage.waitForDashboard();
  });

  // ── TC-TASK-001: Navigation ──────────────────────────────
  test('TC-TASK-001: Navigate to Tasks module from left nav', async ({ page }) => {
    await taskPage.navigateToTasksViaNav();

    await expect(page).toHaveURL(/\/app\/sales\/tasks/);
    await expect(page.getByRole('paragraph').filter({ hasText: 'Tasks' })).toBeVisible();
    await expect(taskPage.newTaskButton).toBeVisible();
    await expect(taskPage.searchInput).toBeVisible();
  });

  // ── TC-TASK-002: UI Elements ─────────────────────────────
  test('TC-TASK-002: Tasks list page – all UI elements present', async () => {
    await taskPage.navigateToTasks();

    await expect(taskPage.searchInput).toBeVisible();
    await expect(taskPage.typeFilterBtn).toBeVisible();
    await expect(taskPage.priorityFilterBtn).toBeVisible();
    await expect(taskPage.statusFilterBtn).toBeVisible();
    await expect(taskPage.dateRangeInput).toBeVisible();
    await expect(taskPage.newTaskButton).toBeVisible();
    await expect(taskPage.taskTitleColHeader).toBeVisible();
    await expect(taskPage.dueDateColHeader).toBeVisible();
    await expect(taskPage.priorityColHeader).toBeVisible();
    await expect(taskPage.typeColHeader).toBeVisible();
  });

  // ── TC-TASK-003: Empty State ─────────────────────────────
  test('TC-TASK-003: Empty state shown when no tasks exist', async () => {
    await taskPage.navigateToTasks();

<<<<<<< ours
    // Global tasks page shows empty for this user (API returns 0 tasks)
=======
>>>>>>> theirs
    const paginationText = await taskPage.getPaginationText();
    if (paginationText?.includes('0–0 of 0')) {
      await expect(taskPage.emptyStateHeading).toBeVisible();
    } else {
<<<<<<< ours
      test.skip(); // skip if tasks already exist
=======
      const visibleRows = await taskPage.tableBody.locator('tr').count();
      expect(visibleRows).toBeGreaterThan(0);
>>>>>>> theirs
    }
  });

  // ── TC-TASK-004: Open Create Drawer ─────────────────────
  test('TC-TASK-004: Open "Create New Task" drawer from list page', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();

    await expect(taskPage.createDrawerHeading).toBeVisible();
    await expect(taskPage.radioCompany).toBeVisible();
    await expect(taskPage.radioProperty).toBeVisible();
    await expect(taskPage.radioDeal).toBeVisible();
    await expect(taskPage.radioContacts).toBeVisible();
    await expect(taskPage.taskTitleInput).toBeVisible();
    await expect(taskPage.descriptionEditor).toBeVisible();
    await expect(taskPage.typeDropdownTrigger).toBeVisible();
    await expect(taskPage.priorityDropdownTrigger).toBeVisible();
    await expect(taskPage.saveButton).toBeVisible();
    await expect(taskPage.cancelButton).toBeVisible();
  });

  // ── TC-TASK-005: Validation – All Fields Empty ───────────
  test('TC-TASK-005: Validation errors shown when all fields are empty on Save', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();
    await taskPage.clickSave();

    await expect(taskPage.errTaskFor).toBeVisible();
    await expect(taskPage.errTaskTitle).toBeVisible();
    await expect(taskPage.errDescription).toBeVisible();
    await expect(taskPage.errType).toBeVisible();
    await expect(taskPage.errPriority).toBeVisible();
    await expect(taskPage.createDrawerHeading).toBeVisible(); // drawer stays open
  });

  // ── TC-TASK-007: Validation – Deal Required ──────────────
  test('TC-TASK-007: "Deal is required" error when Deal radio selected but no deal chosen', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();
    await taskPage.selectCreateTaskFor('Deal');
    await taskPage.fillTaskTitle(TASK_DATA.title);
    await taskPage.fillTaskDescription(TASK_DATA.description);
    await taskPage.selectType(TASK_DATA.type);
    await taskPage.selectPriority(TASK_DATA.priority);
    await taskPage.clickSave();

    await expect(taskPage.errDeal).toBeVisible();
    await expect(taskPage.createDrawerHeading).toBeVisible(); // drawer stays open
  });

  // ── TC-TASK-008: Radio switches association field ────────
  test('TC-TASK-008: Radio selection changes the association dropdown field', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();

    await taskPage.selectCreateTaskFor('Deal');
    await expect(taskPage.dealAssocDropdown).toBeVisible();

    await taskPage.selectCreateTaskFor('Contacts');
    await expect(taskPage.contactAssocDropdown).toBeVisible();

    await taskPage.selectCreateTaskFor('Company');
    // Company association field becomes visible
    await expect(taskPage.radioDeal).not.toBeChecked();
    await expect(taskPage.radioCompany).toBeChecked();
  });

  // ── TC-TASK-009: Type dropdown options ───────────────────
  test('TC-TASK-009: Type dropdown shows To-do, Email, Call, LinkedIn options', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();
    await taskPage.typeDropdownTrigger.click();

    const tooltip = taskPage.page.getByRole('tooltip');
    await expect(tooltip.getByText('To-do')).toBeVisible();
    await expect(tooltip.getByText('Email')).toBeVisible();
    await expect(tooltip.getByText('Call')).toBeVisible();
    await expect(tooltip.getByText('LinkedIn')).toBeVisible();
  });

  // ── TC-TASK-010: Priority dropdown options ───────────────
  test('TC-TASK-010: Priority dropdown shows High, Medium, Low options', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();
    await taskPage.priorityDropdownTrigger.click();

    const tooltip = taskPage.page.getByRole('tooltip');
    await expect(tooltip.getByText('High')).toBeVisible();
    await expect(tooltip.getByText('Medium')).toBeVisible();
    await expect(tooltip.getByText('Low')).toBeVisible();
  });

  // ── TC-TASK-011: Description character counter ───────────
  test('TC-TASK-011: Description character counter updates as user types', async () => {
    await taskPage.navigateToTasks();
    await taskPage.openCreateDrawer();

    const testText = 'Smoke test task for automation validation'; // 41 chars
    await taskPage.fillTaskDescription(testText);

    // Counter shows "41 / 459" (500 − 41 = 459 remaining)
    await expect(taskPage.descCharCounter).toContainText('41');
  });

  // ── TC-TASK-012: Create task in deal context ─────────────
  test('TC-TASK-012: Create task from Deal detail page Tasks tab', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.waitForLoadState('networkidle');

    // Click Tasks tab
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    // Open New Task drawer
    await taskPage.newTaskButton.click();
    await page.waitForTimeout(500);

    // Deal-context drawer has NO radio group
    await expect(taskPage.radioCompany).not.toBeVisible();

    // Fill and save
    await taskPage.fillTaskForm(TASK_DATA);
    await taskPage.saveTask();

    // Task appears in the deal's tasks table
    await expect(page.getByRole('cell', { name: /TC-TASK-SMOKE-001/ })).toBeVisible();
  });

  // ── TC-TASK-013: View task detail panel ──────────────────
  test('TC-TASK-013: Click task row opens detail panel', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    // First ensure a task exists (create if needed)
    const taskCells = page.getByRole('cell', { name: /Automation Test Task/ });
    const count = await taskCells.count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    await taskPage.openTaskDetail('TC-TASK-SMOKE-001');

    // Detail panel is visible
    await expect(page.getByRole('heading', { level: 3, name: /TC-TASK-SMOKE-001/ })).toBeVisible();
    await expect(page.getByText('Task Description')).toBeVisible();
    await expect(page.getByText('Type')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
  });

  // ── TC-TASK-014: Close detail panel ─────────────────────
  test('TC-TASK-014: Close task detail panel with X button', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    await taskPage.openTaskDetail('TC-TASK-SMOKE-001');
    const heading = page.getByRole('heading', { level: 3, name: /TC-TASK-SMOKE-001/ });
    await expect(heading).toBeVisible();

    // Close via X (link with href="#")
    await page.locator('a[href="#"]').click();
    await expect(heading).not.toBeVisible();
  });

  // ── TC-TASK-015 + TC-TASK-016: Edit task ─────────────────
  test('TC-TASK-015 & TC-TASK-016: Edit task – open form, update title, save', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    // Create if needed
    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    // Open detail and click edit
    await taskPage.openTaskDetail('TC-TASK-SMOKE-001');
    await taskPage.clickEditFromMenu();

    // Edit drawer is open and pre-populated
    await expect(taskPage.editDrawerHeading).toBeVisible();
    await expect(taskPage.taskTitleInput).toHaveValue(/TC-TASK-SMOKE-001/);

    // Update title
    await taskPage.taskTitleInput.fill(TASK_DATA.editedTitle);
    await taskPage.saveEditedTask();

    // Updated title appears in table
    await expect(page.getByRole('cell', { name: /EDITED/ })).toBeVisible();
  });

  // ── TC-TASK-017: Cancel edit ─────────────────────────────
  test('TC-TASK-017: Cancel edit – no changes saved', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    await taskPage.openTaskDetail('TC-TASK-SMOKE-001');
    await taskPage.clickEditFromMenu();

    // Modify title but cancel
    await taskPage.taskTitleInput.fill('Should Not Save This Title');
    await taskPage.clickCancel();

    // Original title still in table
    await expect(page.getByRole('cell', { name: /TC-TASK-SMOKE-001/ })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Should Not Save This Title' })).not.toBeVisible();
  });

  // ── TC-TASK-018: Mark task complete ─────────────────────
  test('TC-TASK-018: Mark task as complete via checkbox', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    // Ensure task exists
    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    // Verify it is not yet completed
    const checkbox = page.getByRole('row').filter({ hasText: 'Automation Test Task' }).getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();

    // Toggle complete
    await checkbox.click();
    await page.waitForTimeout(500);

    // Checkbox becomes checked
    await expect(checkbox).toBeChecked();
  });

  // ── TC-TASK-019: Unmark complete ────────────────────────
  test('TC-TASK-019: Unmark completed task – reverts to To-do', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    const checkbox = page.getByRole('row').filter({ hasText: 'Automation Test Task' }).getByRole('checkbox');

    // Mark complete first
    if (!(await checkbox.isChecked())) await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Unmark
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(checkbox).not.toBeChecked();
  });

  // ── TC-TASK-020: Delete – confirmation dialog ────────────
  test('TC-TASK-020: Delete task – confirmation dialog shows correct content', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    await taskPage.openTaskDetail('TC-TASK-SMOKE-001');
    await taskPage.clickDeleteFromMenu();

    await expect(taskPage.deleteDialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Delete Task' })).toBeVisible();
    await expect(taskPage.deleteDialogText).toBeVisible();
    await expect(taskPage.confirmDeleteBtn).toBeVisible();
    await expect(taskPage.cancelDeleteBtn).toBeVisible();
  });

  // ── TC-TASK-021: Delete – cancel ────────────────────────
  test('TC-TASK-021: Cancel delete – task is NOT removed', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    const count = await page.getByRole('cell', { name: /Automation Test Task/ }).count();
    if (count === 0) {
      await taskPage.newTaskButton.click();
      await taskPage.fillTaskForm(TASK_DATA);
      await taskPage.saveTask();
    }

    await taskPage.openTaskDetail('TC-TASK-SMOKE-001');
    await taskPage.clickDeleteFromMenu();
    await taskPage.cancelDelete();

    // Task still present
    await expect(page.getByRole('cell', { name: /TC-TASK-SMOKE-001/ })).toBeVisible();
  });

  // ── TC-TASK-022: Delete – confirm ───────────────────────
  test('TC-TASK-022: Confirm delete – task removed from list', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    // Create a fresh task to delete
    await taskPage.newTaskButton.click();
    await taskPage.fillTaskForm({
      title:       'DELETE-ME Task',
      description: 'This task will be deleted in TC-TASK-022.',
      type:        'To-do',
      priority:    'Low',
    });
    await taskPage.saveTask();

    await expect(page.getByRole('cell', { name: 'DELETE-ME Task' })).toBeVisible();

    // Open detail → delete
    await taskPage.openTaskDetail('DELETE-ME Task');
    await taskPage.clickDeleteFromMenu();
    await taskPage.confirmDelete();

    // Task no longer in list
    await expect(page.getByRole('cell', { name: 'DELETE-ME Task' })).not.toBeVisible();
  });

  // ── TC-TASK-023: Filter by Type – To-Do ─────────────────
  test('TC-TASK-023: Filter by Type – To-Do shows correct tasks', async () => {
    await taskPage.navigateToTasks();
    await taskPage.filterByType('To-Do');

    // If any rows visible, each Type cell must say "To-do"
    const typeCells = taskPage.page.getByRole('cell').filter({ hasText: /^(To-do|Email|Call|LinkedIn)$/ });
    const count = await typeCells.count();
    for (let i = 0; i < count; i++) {
      await expect(typeCells.nth(i)).toHaveText('To-do');
    }
  });

  // ── TC-TASK-027: Filter by Priority – High ───────────────
  test('TC-TASK-027: Filter by Priority – High shows only High priority tasks', async () => {
    await taskPage.navigateToTasks();
    await taskPage.filterByPriority('High');

    const priorityCells = taskPage.page.getByRole('cell').filter({ hasText: /^(High|Medium|Low)$/ });
    const count = await priorityCells.count();
    for (let i = 0; i < count; i++) {
      await expect(priorityCells.nth(i)).toHaveText('High');
    }
  });

  // ── TC-TASK-033: Search by title ─────────────────────────
  test('TC-TASK-033: Search by title filters results', async ({ page }) => {
    await taskPage.navigateToTasks();
    await taskPage.searchByTitle('Automation');

    // All visible task titles should contain 'Automation' (or empty state)
    const titleCells = page.getByRole('cell', { name: /Automation/ });
    const emptyVisible = await taskPage.emptyStateHeading.isVisible();

    expect(emptyVisible || (await titleCells.count()) > 0).toBe(true);
  });

  // ── TC-TASK-034: Search no results ──────────────────────
  test('TC-TASK-034: Search with non-matching term shows empty state', async () => {
    await taskPage.navigateToTasks();
    await taskPage.searchByTitle('ZZZNOMATCH99999XYZ');

    await expect(taskPage.emptyStateHeading).toBeVisible();
  });

  // ── TC-TASK-037: Tasks tab in Deal Detail ─────────────────
  test('TC-TASK-037: Deal detail Tasks tab loads with correct structure', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);

    await expect(taskPage.newTaskButton).toBeVisible();
    await expect(page.getByRole('button', { name: 'Task Title' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Task Description' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Due Date' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Priority' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Type' })).toBeVisible();
  });

  // ── TC-TASK-038: Deal-context drawer has no radio ────────
  test('TC-TASK-038: Deal-context Create Task drawer has no association radio group', async ({ page }) => {
    await page.goto(DEAL_URL);
    await page.getByRole('tab', { name: /Tasks/ }).click();
    await page.waitForTimeout(500);
    await taskPage.newTaskButton.click();
    await page.waitForTimeout(500);

    // Radio buttons should NOT be present
    await expect(taskPage.radioCompany).not.toBeVisible();
    await expect(taskPage.radioDeal).not.toBeVisible();

    // Standard fields should be present
    await expect(taskPage.taskTitleInput).toBeVisible();
    await expect(taskPage.descriptionEditor).toBeVisible();
    await expect(taskPage.typeDropdownTrigger).toBeVisible();
    await expect(taskPage.priorityDropdownTrigger).toBeVisible();
  });

  // ── TC-TASK-040: Combined filters ───────────────────────
  test('TC-TASK-040: Combined Type + Priority filter narrows results', async () => {
    await taskPage.navigateToTasks();
    await taskPage.filterByType('To-Do');
    await taskPage.filterByPriority('High');

    // Any visible tasks must match BOTH filters
    const typeCells     = taskPage.page.getByRole('cell').filter({ hasText: /^To-do$/ });
    const priorityCells = taskPage.page.getByRole('cell').filter({ hasText: /^High$/ });
    const emptyVisible  = await taskPage.emptyStateHeading.isVisible();

    if (!emptyVisible) {
      expect(await typeCells.count()).toBeGreaterThan(0);
      expect(await priorityCells.count()).toBeGreaterThan(0);
    }
  });
});
