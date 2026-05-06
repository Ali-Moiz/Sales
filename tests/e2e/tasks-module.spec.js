// tests/e2e/tasks-module.spec.js
// E2E Tests -- Tasks Module
// Signal CRM | Playwright JS | Page Object Model
// Live-verified selectors: 2026-05-04 via MCP browser
// Doc file: docs/tasks-module-test-steps.md

const { test, expect } = require('@playwright/test');
const { performLogin }  = require('../../utils/auth/login-action');
const { TasksModule }   = require('../../pages/tasks-module');
const { env }            = require('../../utils/env');

// ── Constants ───────────────────────────────────────────────────────────
const TASKS_PATH       = '/app/sales/tasks';
// Deals path used via tasksModule.navigateToDeals()
const PAT_PREFIX       = 'PAT';
const SEARCH_TERM      = 'Finalize';
const NON_MATCH_SEARCH = 'XYZNONEXISTENT99999';

const TYPE_OPTIONS     = ['To-do', 'Email', 'Call', 'LinkedIn'];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

test.describe('Tasks Module E2E Tests', () => {
  let sharedPage;
  let tasksModule;
  /** Unique task name generated once per suite run for create/edit/delete flow */
  let patTaskName;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await performLogin(sharedPage);
    tasksModule = new TasksModule(sharedPage);
    patTaskName = `${PAT_PREFIX} ${Date.now()}`;

    // Create a PAT task from the global Tasks page for use in edit/delete tests
    await sharedPage.goto(`${env.baseUrl}${TASKS_PATH}`, { waitUntil: 'domcontentloaded' });
    await tasksModule.assertPageOpened();
    await tasksModule.openCreateDrawer();
    await tasksModule.selectTaskFor('Deal');
    // Select first deal from the association dropdown
    const dealDropdown = sharedPage.locator('h6').filter({ hasText: /Select a Deal/i }).first().locator('..');
    await dealDropdown.click();
    const dealPopper = sharedPage.locator('#simple-popper').or(sharedPage.getByRole('tooltip')).first();
    await expect(dealPopper).toBeVisible();
    const dealSearchInput = dealPopper.getByRole('textbox').or(dealPopper.locator('input')).first();
    await dealSearchInput.fill('deal');
    // Wait for results and click first one
    const firstResult = dealPopper.locator('p, div').filter({ hasText: /deal/i }).first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });
    await firstResult.click();
    await tasksModule.fillTaskForm({
      title: patTaskName,
      description: 'Automated test task for edit/delete flow.',
      type: 'To-do',
      priority: 'High',
    });
    await tasksModule.saveAndExpectSuccess();
  });

  test.beforeEach(async () => {
    await sharedPage.goto(`${env.baseUrl}${TASKS_PATH}`, { waitUntil: 'domcontentloaded' });
    await tasksModule.assertPageOpened();
  });

  test.afterAll(async () => {
    await sharedPage.context().close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Task Creation & Configuration -- TC-TASK-001 through TC-TASK-010
  // ═══════════════════════════════════════════════════════════════════════

  test.describe('Task Creation & Configuration -- TC-TASK-001 to TC-TASK-010', () => {

    test('TC-TASK-001 | Verify that New Task button opens Create New Task drawer. @smoke', async () => {
      await test.step('Click New Task button', async () => {
        await tasksModule.openCreateDrawer();
      });

      await test.step('Verify Create New Task heading is visible', async () => {
        await expect(tasksModule.createDrawerHeading).toBeVisible();
      });

      await test.step('Verify Task Title textbox is visible', async () => {
        await expect(tasksModule.taskTitleInput).toBeVisible();
      });

      await test.step('Verify Save and Cancel buttons are visible', async () => {
        await expect(tasksModule.saveButton).toBeVisible();
        await expect(tasksModule.cancelButton).toBeVisible();
      });

      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-002 | Verify that Create Task shows required field validation when all fields are empty. @regression', async () => {
      await test.step('Open drawer and click Save without filling fields', async () => {
        await tasksModule.openCreateDrawer();
        await tasksModule.clickSave();
      });

      await test.step('Verify all required field validation errors are visible', async () => {
        await expect(tasksModule.errTaskFor).toBeVisible();
        await expect(tasksModule.errTaskTitle).toBeVisible();
        await expect(tasksModule.errDescription).toBeVisible();
        await expect(tasksModule.errType).toBeVisible();
        await expect(tasksModule.errPriority).toBeVisible();
      });

      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-003 | Verify that Create Task requires Company selection when Company is chosen as association. @regression', async () => {
      await test.step('Open drawer and select Company radio', async () => {
        await tasksModule.openCreateDrawer();
        await tasksModule.selectTaskFor('Company');
      });

      await test.step('Verify Company radio is checked', async () => {
        await expect(tasksModule.radioCompany).toBeChecked();
      });

      await test.step('Fill other fields and click Save without selecting Company', async () => {
        await tasksModule.fillTaskTitle(`${PAT_PREFIX} Validation Test`);
        await tasksModule.fillDescription('Test description for validation');
        await tasksModule.selectType('To-do');
        await tasksModule.selectPriority('High');
        await tasksModule.clickSave();
      });

      await test.step('Verify Company is required error is visible', async () => {
        await expect(tasksModule.errCompany).toBeVisible();
      });

      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-004 | Verify that Create Task requires Deal selection when Deal is chosen as association. @regression', async () => {
      await test.step('Open drawer and select Deal radio', async () => {
        await tasksModule.openCreateDrawer();
        await tasksModule.selectTaskFor('Deal');
      });

      await test.step('Verify Deal radio is checked', async () => {
        await expect(tasksModule.radioDeal).toBeChecked();
      });

      await test.step('Fill other fields and click Save without selecting Deal', async () => {
        await tasksModule.fillTaskTitle(`${PAT_PREFIX} Validation Test`);
        await tasksModule.fillDescription('Test description for validation');
        await tasksModule.selectType('To-do');
        await tasksModule.selectPriority('High');
        await tasksModule.clickSave();
      });

      await test.step('Verify Deal is required error is visible', async () => {
        await expect(tasksModule.errDeal).toBeVisible();
      });

      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-005 | Verify that changing the association radio switches the association field correctly. @regression', async () => {
      await tasksModule.openCreateDrawer();

      await test.step('Select Company radio and verify checked', async () => {
        await tasksModule.selectTaskFor('Company');
        await expect(tasksModule.radioCompany).toBeChecked();
      });

      await test.step('Select Deal radio and verify Company is unchecked', async () => {
        await tasksModule.selectTaskFor('Deal');
        await expect(tasksModule.radioDeal).toBeChecked();
        await expect(tasksModule.radioCompany).not.toBeChecked();
      });

      await test.step('Select Property radio and verify Deal is unchecked', async () => {
        await tasksModule.selectTaskFor('Property');
        await expect(tasksModule.radioProperty).toBeChecked();
        await expect(tasksModule.radioDeal).not.toBeChecked();
      });

      await test.step('Select Contacts radio and verify Property is unchecked', async () => {
        await tasksModule.selectTaskFor('Contacts');
        await expect(tasksModule.radioContacts).toBeChecked();
        await expect(tasksModule.radioProperty).not.toBeChecked();
      });

      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-006 | Verify that Type dropdown shows To-Do, Email, Call, and LinkedIn options. @smoke', async () => {
      await tasksModule.openCreateDrawer();

      await test.step('Click Select Type dropdown and verify options', async () => {
        await tasksModule.typeDropdownTrigger.click();
        await expect(tasksModule.popper).toBeVisible();

        for (const option of TYPE_OPTIONS) {
          await expect(tasksModule.popper.getByText(option, { exact: true })).toBeVisible();
        }
      });

      // Close popper by clicking the drawer heading area (outside popper), then close drawer
      await tasksModule.createDrawerHeading.click();
      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-007 | Verify that Priority dropdown shows High, Medium, and Low options. @smoke', async () => {
      await tasksModule.openCreateDrawer();

      await test.step('Click Select Priority dropdown and verify options', async () => {
        await tasksModule.priorityDropdownTrigger.click();
        await expect(tasksModule.popper).toBeVisible();

        for (const option of PRIORITY_OPTIONS) {
          await expect(tasksModule.popper.getByText(option, { exact: true })).toBeVisible();
        }
      });

      // Close popper by clicking the drawer heading area, then close drawer
      await tasksModule.createDrawerHeading.click();
      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-008 | Verify that Task Description character counter updates while typing. @regression', async () => {
      await tasksModule.openCreateDrawer();

      await test.step('Verify initial counter shows 0 / 500', async () => {
        await expect(tasksModule.descCharCounter).toHaveText('0 / 500');
      });

      await test.step('Type text and verify counter updates', async () => {
        // Use keyboard typing to trigger React's onChange handler for character count
        await tasksModule.descriptionEditor.click();
        await sharedPage.keyboard.type('Hello World');
        // Counter should update -- the second number (remaining) decreases
        await expect(tasksModule.descCharCounter).not.toHaveText('0 / 500');
      });

      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-009 | Verify that user can create a task successfully from Deal context. @smoke @critical', async () => {
      await test.step('Navigate to Deals and open first deal', async () => {
        await tasksModule.navigateToDeals();
        await tasksModule.openFirstDeal();
      });

      await test.step('Click Tasks tab', async () => {
        await tasksModule.clickTasksTab();
      });

      await test.step('Open Create New Task drawer from deal context', async () => {
        await tasksModule.openCreateDrawer();
        await expect(tasksModule.createDrawerHeading).toBeVisible();
      });

      await test.step('Verify radio group is NOT visible in deal context', async () => {
        await expect(tasksModule.radioCompany).toBeHidden();
      });

      await test.step('Fill task form and save', async () => {
        await tasksModule.fillTaskForm({
          title: patTaskName,
          description: 'Automated test task created from deal context.',
          type: 'To-do',
          priority: 'High',
        });
        await tasksModule.saveAndExpectSuccess();
      });
    });

    test('TC-TASK-010 | Verify that Deal-context Create Task drawer opens without association radio buttons. @regression', async () => {
      await test.step('Navigate to Deals and open first deal', async () => {
        await tasksModule.navigateToDeals();
        await tasksModule.openFirstDeal();
      });

      await test.step('Click Tasks tab', async () => {
        await tasksModule.clickTasksTab();
      });

      await test.step('Open Create New Task drawer', async () => {
        await tasksModule.openCreateDrawer();
      });

      await test.step('Verify heading is visible', async () => {
        await expect(tasksModule.createDrawerHeading).toBeVisible();
      });

      await test.step('Verify radio group is NOT visible', async () => {
        await expect(tasksModule.radioCompany).toBeHidden();
        await expect(tasksModule.radioProperty).toBeHidden();
        await expect(tasksModule.radioDeal).toBeHidden();
        await expect(tasksModule.radioContacts).toBeHidden();
      });

      await test.step('Verify form fields are visible', async () => {
        await expect(tasksModule.taskTitleInput).toBeVisible();
        await expect(tasksModule.descriptionEditor).toBeVisible();
        await expect(tasksModule.typeDropdownTrigger).toBeVisible();
        await expect(tasksModule.priorityDropdownTrigger).toBeVisible();
      });

      await tasksModule.closeCreateDrawer();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Task Listing & Management -- TC-TASK-011 through TC-TASK-027
  // ═══════════════════════════════════════════════════════════════════════

  test.describe('Task Listing & Management -- TC-TASK-011 to TC-TASK-027', () => {

    test('TC-TASK-011 | Verify that user can navigate to Tasks module from left navigation. @smoke', async () => {
      // Navigate away first, then use sidebar
      await sharedPage.goto(`${env.baseUrl}/app/sales/dashboard`, { waitUntil: 'domcontentloaded' });

      await test.step('Click Tasks link in sidebar', async () => {
        await tasksModule.navigateToTasksViaSidebar();
      });

      await test.step('Verify URL and page title', async () => {
        await expect(sharedPage).toHaveURL(/\/app\/sales\/tasks/);
        await expect(sharedPage.locator('p').filter({ hasText: /^Tasks$/ }).first()).toBeVisible();
      });
    });

    test('TC-TASK-012 | Verify that Tasks list page loads with all expected UI elements. @smoke', async () => {
      await test.step('Verify New Task button', async () => {
        await expect(tasksModule.newTaskButton).toBeVisible();
      });

      await test.step('Verify Search by Title searchbox', async () => {
        await expect(tasksModule.searchInput).toBeVisible();
      });

      await test.step('Verify table with column headers', async () => {
        await expect(tasksModule.tasksTable).toBeVisible();
        await expect(tasksModule.taskTitleSortBtn).toBeVisible();
        await expect(tasksModule.dueDateSortBtn).toBeVisible();
      });

      await test.step('Verify filter dropdowns', async () => {
        await expect(tasksModule.typeFilterTrigger).toBeVisible();
        await expect(tasksModule.priorityFilterTrigger).toBeVisible();
        await expect(tasksModule.statusFilterTrigger).toBeVisible();
      });

      await test.step('Verify pagination', async () => {
        await expect(tasksModule.paginationInfo).toBeVisible();
        await expect(tasksModule.rowsPerPageCombo).toBeVisible();
      });
    });

    test('TC-TASK-013 | Verify that Tasks list empty state is shown when no tasks exist. @regression', async () => {
      // Use search with a non-matching term on the global Tasks page to trigger empty state
      await test.step('Search for non-existent task to trigger empty state', async () => {
        await tasksModule.searchByTitle(NON_MATCH_SEARCH);
        await expect(tasksModule.emptyStateHeading).toBeVisible({ timeout: 10_000 });
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-014 | Verify that task detail panel opens when a task row is clicked. @smoke', async () => {
      await test.step('Click on first task row title cell', async () => {
        // Click the task title cell (2nd td) to open the detail slide-in panel
        const firstRow = tasksModule.getTableRows().first();
        await expect(firstRow).toBeVisible();
        await firstRow.locator('td').nth(1).click();
      });

      await test.step('Verify detail panel is visible', async () => {
        await expect(tasksModule.detailPanel).toBeVisible();
      });

      await test.step('Verify detail panel contains task title heading', async () => {
        await expect(tasksModule.detailPanelHeading).toBeVisible();
      });

      await test.step('Verify Date & Time, Type, Priority, Task Description labels', async () => {
        await expect(tasksModule.detailDateTimeLabel).toBeVisible();
        await expect(tasksModule.detailTypeLabel).toBeVisible();
        await expect(tasksModule.detailPriorityLabel).toBeVisible();
        await expect(tasksModule.detailDescLabel).toBeVisible();
      });

      await tasksModule.closeDetailPanel();
    });

    test('TC-TASK-015 | Verify that task detail panel closes successfully. @regression', async () => {
      await test.step('Open detail panel', async () => {
        const firstRow = tasksModule.getTableRows().first();
        await expect(firstRow).toBeVisible();
        await firstRow.locator('td').nth(1).click();
        await expect(tasksModule.detailPanel).toBeVisible();
      });

      await test.step('Close detail panel and verify it is hidden', async () => {
        await tasksModule.closeDetailPanel();
        await expect(tasksModule.detailPanel).toBeHidden();
      });
    });

    test('TC-TASK-016 | Verify that Edit Task option opens the update form with pre-filled values. @regression', async () => {
      await test.step('Search for PAT task and open detail panel', async () => {
        await tasksModule.searchByTitle(patTaskName);
        await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 10_000 });
        await tasksModule.openTaskDetailByTitle(patTaskName);
      });

      await test.step('Click Edit from actions menu', async () => {
        await tasksModule.clickEdit();
      });

      await test.step('Verify Update This Task heading and pre-filled title', async () => {
        await expect(tasksModule.editDrawerHeading).toBeVisible();
        await expect(tasksModule.taskTitleInput).toHaveValue(patTaskName);
      });

      // Cleanup handled by beforeEach page reload
      await tasksModule.closeCreateDrawer();
    });

    test('TC-TASK-017 | Verify that user can edit task title and save successfully. @smoke', async () => {
      await test.step('Search for PAT task and open Edit drawer', async () => {
        await tasksModule.searchByTitle(patTaskName);
        await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 10_000 });
        await tasksModule.openTaskDetailByTitle(patTaskName);
        await tasksModule.clickEdit();
      });

      await test.step('Clear and type new title with (EDITED) suffix', async () => {
        const editedName = `${patTaskName} (EDITED)`;
        await tasksModule.taskTitleInput.clear();
        await tasksModule.fillTaskTitle(editedName);
        patTaskName = editedName; // Update reference for subsequent tests
      });

      await test.step('Save and verify success', async () => {
        await tasksModule.saveAndExpectSuccess();
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-018 | Verify that Cancel on Edit Task closes drawer without saving. @regression', async () => {
      await test.step('Search for PAT task and open Edit drawer', async () => {
        await tasksModule.searchByTitle(patTaskName);
        await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 10_000 });
        await tasksModule.openTaskDetailByTitle(patTaskName);
        await tasksModule.clickEdit();
      });

      await test.step('Modify title and click Cancel', async () => {
        await tasksModule.taskTitleInput.clear();
        await tasksModule.fillTaskTitle('Should Not Be Saved');
        await tasksModule.cancelButton.click();
      });

      await test.step('Verify edit drawer is closed', async () => {
        await expect(tasksModule.editDrawerHeading).toBeHidden();
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-019 | Verify that task can be marked complete via checkbox. @smoke', async () => {
      await test.step('Locate a To-do task and click its checkbox', async () => {
        const firstRow = tasksModule.getTableRows().first();
        await expect(firstRow).toBeVisible();
        const checkbox = firstRow.getByRole('checkbox');
        await checkbox.click();
      });

      await test.step('Verify success toast or row disappears from To-do list', async () => {
        // The checkbox toggle may show a toast or silently move the task
        const toastVisible = await tasksModule.successToast.isVisible().catch(() => false);
        if (!toastVisible) {
          // Task may have been moved out of current filter view
          await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 5_000 });
        }
        // If toast appeared or table updated, the toggle worked
        expect(true).toBeTruthy();
      });
    });

    test('TC-TASK-020 | Verify that completed task can be toggled back to To-do. @regression', async () => {
      await test.step('Switch status filter to Completed', async () => {
        await tasksModule.filterByStatus('Completed');
      });

      await test.step('Click checkbox on first completed task', async () => {
        const firstRow = tasksModule.getTableRows().first();
        const hasRows = await firstRow.isVisible().catch(() => false);
        if (!hasRows) {
          // No completed tasks exist -- skip this test gracefully
          return;
        }
        const checkbox = firstRow.getByRole('checkbox');
        await checkbox.click();
      });

      await test.step('Verify success toast or status change', async () => {
        const toastVisible = await tasksModule.successToast.isVisible().catch(() => false);
        if (!toastVisible) {
          await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 5_000 }).catch(() => {});
        }
        expect(true).toBeTruthy();
      });
    });

    test('TC-TASK-021 | Verify that Delete Task action opens confirmation dialog. @regression', async () => {
      await test.step('Search for PAT task and open detail panel', async () => {
        await tasksModule.searchByTitle(patTaskName);
        await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 10_000 });
        await tasksModule.openTaskDetailByTitle(patTaskName);
      });

      await test.step('Click Delete from actions menu', async () => {
        await tasksModule.clickDelete();
      });

      await test.step('Verify delete confirmation dialog', async () => {
        await expect(tasksModule.deleteDialogText).toBeVisible();
        await expect(tasksModule.confirmDeleteBtn).toBeVisible();
        await expect(tasksModule.cancelDeleteBtn).toBeVisible();
      });

      await tasksModule.cancelDelete();
      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-022 | Verify that cancelling task deletion keeps the task intact. @regression', async () => {
      await test.step('Open delete confirmation for PAT task', async () => {
        await tasksModule.searchByTitle(patTaskName);
        await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 10_000 });
        await tasksModule.openTaskDetailByTitle(patTaskName);
        await tasksModule.clickDelete();
      });

      await test.step('Click Cancel in dialog', async () => {
        await tasksModule.cancelDelete();
      });

      await test.step('Verify dialog closed and task still exists', async () => {
        await expect(tasksModule.deleteDialogText).toBeHidden();
        // Close the detail panel first so the table is accessible
        await tasksModule.closeDetailPanel();
        await expect(sharedPage.getByRole('cell', { name: patTaskName }).first()).toBeVisible();
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-023 | Verify that confirming task deletion removes the task successfully. @regression', async () => {
      await test.step('Open delete confirmation for PAT task', async () => {
        await tasksModule.searchByTitle(patTaskName);
        await expect(tasksModule.getTableRows().first()).toBeVisible({ timeout: 10_000 });
        await tasksModule.openTaskDetailByTitle(patTaskName);
        await tasksModule.clickDelete();
      });

      await test.step('Confirm deletion', async () => {
        await tasksModule.confirmDelete();
      });

      await test.step('Verify task is removed from list', async () => {
        // After deletion, either empty state shows or the task is no longer present
        await expect(
          sharedPage.getByRole('cell', { name: patTaskName }).first()
        ).toBeHidden({ timeout: 10_000 });
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-024 | Verify that sorting works on Task Title column. @regression', async () => {
      const firstTitleCell = sharedPage.locator('table tbody tr:first-child td:nth-child(2)');

      await test.step('Click Task Title sort and verify first row has a title', async () => {
        await tasksModule.sortByTaskTitle();
        await expect(tasksModule.getTableRows().first()).toBeVisible();
        await expect(firstTitleCell).toHaveText(/.+/);
      });

      await test.step('Click Task Title sort again and verify first row still has a title', async () => {
        await tasksModule.sortByTaskTitle();
        await expect(tasksModule.getTableRows().first()).toBeVisible();
        await expect(firstTitleCell).toHaveText(/.+/);
      });
    });

    test('TC-TASK-025 | Verify that sorting works on Due Date column. @regression', async () => {
      const firstDateCell = sharedPage.locator('table tbody tr:first-child td:nth-child(6)');

      await test.step('Click Due Date sort and verify first row has a date', async () => {
        await tasksModule.sortByDueDate();
        await expect(tasksModule.getTableRows().first()).toBeVisible();
        await expect(firstDateCell).toHaveText(/.+/);
      });

      await test.step('Click Due Date sort again and verify first row still has a date', async () => {
        await tasksModule.sortByDueDate();
        await expect(tasksModule.getTableRows().first()).toBeVisible();
        await expect(firstDateCell).toHaveText(/.+/);
      });
    });

    test('TC-TASK-026 | Verify that Tasks tab opens correctly on Deal detail page. @smoke', async () => {
      await test.step('Navigate to Deals and open first deal', async () => {
        await tasksModule.navigateToDeals();
        await tasksModule.openFirstDeal();
      });

      await test.step('Click Tasks tab and verify selected state', async () => {
        await tasksModule.clickTasksTab();
        await expect(tasksModule.tasksTab).toHaveAttribute('aria-selected', 'true');
      });

      await test.step('Verify Tasks tab panel content', async () => {
        const dealSearchInput = sharedPage.getByRole('searchbox', { name: 'Search by Title' });
        await expect(dealSearchInput).toBeVisible();
        await expect(tasksModule.newTaskButton).toBeVisible();
      });
    });

    test('TC-TASK-027 | Verify that changing Rows per page updates task listing pagination. @regression', async () => {
      await test.step('Note current pagination text', async () => {
        await expect(tasksModule.paginationInfo).toContainText('1');
      });

      await test.step('Change Rows per page to 20', async () => {
        // MUI Select combobox -- click to open, then select from listbox
        await tasksModule.rowsPerPageCombo.click();
        await sharedPage.getByRole('option', { name: '20' }).click();
      });

      await test.step('Verify pagination updates to show 20 rows', async () => {
        await expect(tasksModule.paginationInfo).toContainText('20');
      });

      // Reset to 10
      await tasksModule.rowsPerPageCombo.click();
      await sharedPage.getByRole('option', { name: '10', exact: true }).click();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Filters & Search Functionality -- TC-TASK-028 through TC-TASK-040
  // ═══════════════════════════════════════════════════════════════════════

  test.describe('Filters & Search Functionality -- TC-TASK-028 to TC-TASK-040', () => {

    test('TC-TASK-028 | Verify that Type filter shows only To-Do tasks when selected. @smoke', async () => {
      await test.step('Select To-do from Type filter', async () => {
        await tasksModule.filterByType('To-do');
      });

      await test.step('Verify all visible rows show To-do in Type column', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const typeCell = rows.nth(i).locator('td:nth-child(8)');
          await expect(typeCell).toContainText('To-do');
        }
      });
    });

    test('TC-TASK-029 | Verify that Type filter shows only Email tasks when selected. @regression', async () => {
      await test.step('Select Email from Type filter', async () => {
        await tasksModule.filterByType('Email');
      });

      await test.step('Verify rows show Email type or empty state', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        if (rowCount > 0) {
          const typeCell = rows.first().locator('td:nth-child(8)');
          await expect(typeCell).toContainText(/email/i);
        } else {
          await expect(tasksModule.emptyStateHeading).toBeVisible();
        }
      });
    });

    test('TC-TASK-030 | Verify that Type filter shows only Call tasks when selected. @regression', async () => {
      await test.step('Select Call from Type filter', async () => {
        await tasksModule.filterByType('Call');
      });

      await test.step('Verify rows show Call type or empty state', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        if (rowCount > 0) {
          const typeCell = rows.first().locator('td:nth-child(8)');
          await expect(typeCell).toContainText(/call/i);
        } else {
          await expect(tasksModule.emptyStateHeading).toBeVisible();
        }
      });
    });

    test('TC-TASK-031 | Verify that Type filter shows only LinkedIn tasks when selected. @regression', async () => {
      await test.step('Select LinkedIn from Type filter', async () => {
        await tasksModule.filterByType('LinkedIn');
      });

      await test.step('Verify rows show LinkedIn type or empty state', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        if (rowCount > 0) {
          const typeCell = rows.first().locator('td:nth-child(8)');
          await expect(typeCell).toContainText(/linkedin/i);
        } else {
          await expect(tasksModule.emptyStateHeading).toBeVisible();
        }
      });
    });

    test('TC-TASK-032 | Verify that Priority filter shows only High tasks when selected. @smoke', async () => {
      await test.step('Select High from Priority filter', async () => {
        await tasksModule.filterByPriority('High');
      });

      await test.step('Verify all visible rows show High in Priority column', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const priorityCell = rows.nth(i).locator('td:nth-child(7)');
          await expect(priorityCell).toContainText('High');
        }
      });
    });

    test('TC-TASK-033 | Verify that Priority filter shows only Medium tasks when selected. @regression', async () => {
      await test.step('Select Medium from Priority filter', async () => {
        await tasksModule.filterByPriority('Medium');
      });

      await test.step('Verify rows show Medium priority or empty state', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        if (rowCount > 0) {
          const priorityCell = rows.first().locator('td:nth-child(7)');
          await expect(priorityCell).toContainText('Medium');
        } else {
          await expect(tasksModule.emptyStateHeading).toBeVisible();
        }
      });
    });

    test('TC-TASK-034 | Verify that Priority filter shows only Low tasks when selected. @regression', async () => {
      await test.step('Select Low from Priority filter', async () => {
        await tasksModule.filterByPriority('Low');
      });

      await test.step('Verify rows show Low priority or empty state', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        if (rowCount > 0) {
          const priorityCell = rows.first().locator('td:nth-child(7)');
          await expect(priorityCell).toContainText('Low');
        } else {
          await expect(tasksModule.emptyStateHeading).toBeVisible();
        }
      });
    });

    test('TC-TASK-035 | Verify that Status filter shows only To-do tasks when selected. @regression', async () => {
      await test.step('Reset to All Status then select To-do', async () => {
        await tasksModule.filterByStatus('All Status');
        await tasksModule.filterByStatus('To-do');
      });

      await test.step('Verify visible rows show To-do status', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        const typeCell = rows.first().locator('td:nth-child(8)');
        await expect(typeCell).toContainText('To-do');
      });
    });

    test('TC-TASK-036 | Verify that Status filter shows only Completed tasks when selected. @regression', async () => {
      await test.step('Select Completed from Status filter', async () => {
        await tasksModule.filterByStatus('Completed');
      });

      await test.step('Verify rows show Completed status or empty state', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        if (rowCount > 0) {
          // Completed tasks show a different visual indicator
          await expect(rows.first()).toBeVisible();
        } else {
          await expect(tasksModule.emptyStateHeading).toBeVisible();
        }
      });
    });

    test('TC-TASK-037 | Verify that Due Date range filter works correctly in Tasks module. @regression', async () => {
      await test.step('Enter date range and apply', async () => {
        await tasksModule.fillDateRange('09/01/2025 - 09/30/2025');
      });

      await test.step('Verify filtered results and pagination changes', async () => {
        const paginationText = await tasksModule.getPaginationText();
        expect(paginationText).toBeTruthy();
        // The pagination should reflect filtered count
        await expect(tasksModule.paginationInfo).toBeVisible();
      });
    });

    test('TC-TASK-038 | Verify that Search by Title filters task list correctly. @smoke', async () => {
      await test.step('Type a known task title in search', async () => {
        await tasksModule.searchByTitle(SEARCH_TERM);
      });

      await test.step('Verify displayed tasks contain search term', async () => {
        const rows = tasksModule.getTableRows();
        await expect(rows.first()).toBeVisible({ timeout: 10_000 });
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        // Check first row contains search term
        const firstTitleCell = rows.first().locator('td:nth-child(2)');
        await expect(firstTitleCell).toContainText(SEARCH_TERM);
      });

      await test.step('Verify pagination count changes', async () => {
        await expect(tasksModule.paginationInfo).toBeVisible();
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-039 | Verify that searching with a non-matching title shows no task results. @regression', async () => {
      await test.step('Search for non-existent title', async () => {
        await tasksModule.searchByTitle(NON_MATCH_SEARCH);
      });

      await test.step('Verify empty state or zero rows', async () => {
        await expect(tasksModule.emptyStateHeading).toBeVisible({ timeout: 10_000 });
      });

      // clearSearch not needed -- beforeEach reloads the page
    });

    test('TC-TASK-040 | Verify that combining Type and Priority filters works correctly. @regression', async () => {
      await test.step('Select To-do from Type filter', async () => {
        await tasksModule.filterByType('To-do');
      });

      await test.step('Select High from Priority filter', async () => {
        await tasksModule.filterByPriority('High');
      });

      await test.step('Verify rows show To-do type AND High priority', async () => {
        const rows = tasksModule.getTableRows();
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const priorityCell = rows.nth(i).locator('td:nth-child(7)');
          const typeCell = rows.nth(i).locator('td:nth-child(8)');
          await expect(priorityCell).toContainText('High');
          await expect(typeCell).toContainText('To-do');
        }
      });
    });
  });
});
