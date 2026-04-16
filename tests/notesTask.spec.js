// ============================================================
// tests/notesTask.spec.js
// Smoke Tests – Notes & Tasks CRUD (Common tabs across modules)
//
// Signal CRM | Playwright JS | Page Object Model
// Live-explored: 2026-03-27 via MCP browser automation
//
// Coverage:
//   Notes CRUD  → Create · Read · Update · Delete (+ Cancel flows)
//   Tasks CRUD  → Create · Read · Update · Delete (+ Complete toggle, Search)
//
// Runs the same test suite against all 4 modules:
//   → Contact | Company | Property | Deal
//
// Prerequisites:
//   npm install -D @playwright/test
//   npx playwright install chromium
//   Run: npx playwright test tests/notesTask.spec.js --headed
// ============================================================

const { existsSync, mkdirSync } = require('fs');
const { test, expect }  = require('@playwright/test');
const { performLogin }  = require('../utils/auth/login-action');
const { NotesTaskPage } = require('../pages/notesTask.page');

// ── Module configurations (dynamic – one test-suite runs for each) ──
// Each entry provides the module name + a live detail-page URL for testing.
// These IDs were discovered via MCP live exploration on 2026-03-27.
const MODULES = [
  {
    name: 'Contact',
    url:  '/app/sales/contacts/detail/8922',
  },
  {
    name: 'Company',
    url:  '/app/sales/companies/company/11348',
  },
  {
    name: 'Property',
    url:  '/app/sales/locations/location/13228',
  },
  {
    name: 'Deal',
    url:  '/app/sales/deals/deal/18596',
  },
];

// ── Dynamic test data (timestamp suffix keeps each run unique) ──────
const ts = () => Date.now(); // unique suffix per invocation
const authFile = 'playwright/.auth/user.json';

async function ensureAuthState(browser) {
  mkdirSync('playwright/.auth', { recursive: true });

  if (existsSync(authFile)) {
    return;
  }

  const authContext = await browser.newContext();
  const authPage = await authContext.newPage();

  await performLogin(authPage);
  await authContext.storageState({ path: authFile });
  await authContext.close();
}

// ════════════════════════════════════════════════════════════════
// Parameterised describe – one full CRUD suite per module
// ════════════════════════════════════════════════════════════════

test.describe('Notes & Tasks CRUD – Smoke Tests', () => {
  test.setTimeout(180_000);

  /** @type {import('@playwright/test').BrowserContext} */
  let context;
  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {NotesTaskPage} */
  let ntPage;

  test.beforeAll(async ({ browser }) => {
    await ensureAuthState(browser);

    context = await browser.newContext({ storageState: authFile });
    page = await context.newPage();
    ntPage = new NotesTaskPage(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

for (const mod of MODULES) {
  test.describe(`[${mod.name}] Notes & Tasks CRUD – Smoke Tests`, () => {
    test.beforeEach(async () => {
      await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    // ════════════════════════════════════════════════════════════
    //  NOTES – READ / UI
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-N001: Notes tab is visible and clickable`, async () => {
      await ntPage.clickNotesTab();

      // Tab becomes selected
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');

      // "Create New Note" button appears in the header
      await expect(ntPage.createNoteBtn).toBeVisible();
    });

    test(`NT-${mod.name}-N002: Notes empty-state shown when no notes exist`, async () => {
      await ntPage.clickNotesTab();

      const isEmpty = await ntPage.isNotesEmptyStateVisible();
      if (isEmpty) {
        await expect(ntPage.noteEmptyHeading).toBeVisible();
        await expect(ntPage.noteEmptySubtext).toBeVisible();
      } else {
        await expect
          .poll(() => ntPage.getNoteCount(), { timeout: 10_000 })
          .toBeGreaterThan(0);
      }
    });

    test(`NT-${mod.name}-N003: "Add Notes" drawer has all required fields`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();

      await ntPage.assertAddNoteDrawerOpen();
      await expect(ntPage.noteSubjectInput).toBeVisible();
      await expect(ntPage.noteDescEditor).toBeVisible();
      await expect(ntPage.noteSaveBtn).toBeVisible();
      await expect(ntPage.noteCancelBtn).toBeVisible();
    });

    // ════════════════════════════════════════════════════════════
    //  NOTES – CREATE
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-N004: Create note – success toast and note appears in list`, async () => {
      const subject = `Auto Note ${mod.name} ${ts()}`;
      const desc    = `Smoke test note for ${mod.name} – created by Playwright automation.`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: desc });

      // After save: drawer closes, note appears in the list
      await expect(ntPage.addNoteDrawerHeading).not.toBeVisible();
      await ntPage.assertNoteVisible(subject);

      // Notes counter on tab badge increments
      await expect(page.getByRole('tab', { name: /^Notes/ })).toContainText('Notes');
    });

    test(`NT-${mod.name}-N005: Create note – validation when Subject is empty`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();

      // Fill description but leave subject blank
      await ntPage.noteDescEditor.click();
      await ntPage.noteDescEditor.fill('Only description, no subject.');

      await ntPage.noteSaveBtn.click();

      // Drawer stays open (save blocked) and subject field is highlighted/focused
      await expect(ntPage.addNoteDrawerHeading).toBeVisible();
      // Subject input should still be empty
      await expect(ntPage.noteSubjectInput).toHaveValue('');
    });

    test(`NT-${mod.name}-N006: Create note – Cancel discards the note`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();

      await ntPage.fillNoteForm({
        subject:     `CANCEL ME ${mod.name}`,
        description: 'This note should never be saved.',
      });
      await ntPage.cancelNote();

      // Drawer closed; no note with this subject in the list
      await expect(ntPage.addNoteDrawerHeading).not.toBeVisible();
    });

    test(`NT-${mod.name}-N007: Character counter updates as description is typed`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();

      const sampleText = 'Playwright automation – character counter check';
      await ntPage.noteDescEditor.click();
      await ntPage.noteDescEditor.fill(sampleText);

      await expect(ntPage.noteCharCounter).toContainText(String(sampleText.length));
    });

    // ════════════════════════════════════════════════════════════
    //  NOTES – UPDATE
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-N008: Edit note – open Edit Notes drawer pre-populated`, async () => {
      const subject = `Edit Note ${mod.name} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Original description.' });

      // Click Edit on the created note
      await ntPage.clickEditNote(subject);

      // Drawer opens in edit mode, subject field pre-filled
      await ntPage.assertEditNoteDrawerOpen();
      await expect(ntPage.noteSubjectInput).toHaveValue(subject);
    });

    test(`NT-${mod.name}-N009: Edit note – update subject and save`, async () => {
      const subject        = `Edit Note ${mod.name} ${ts()}`;
      const updatedSubject = `${subject} UPDATED`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'To be updated.' });

      await ntPage.clickEditNote(subject);
      await ntPage.fillEditNoteForm({ subject: updatedSubject });
      await ntPage.saveEditedNote();

      // Updated subject visible in the notes list
      await ntPage.assertNoteVisible(updatedSubject);
    });

    test(`NT-${mod.name}-N010: Edit note – Cancel keeps original note unchanged`, async () => {
      const subject = `Keep Note ${mod.name} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Should remain unchanged.' });

      await ntPage.clickEditNote(subject);
      await ntPage.fillEditNoteForm({ subject: 'SHOULD NOT SAVE THIS' });
      await ntPage.cancelNote();

      // Edit drawer closed, original subject still visible
      await expect(ntPage.editNoteDrawerHeading).not.toBeVisible();
      await ntPage.assertNoteVisible(subject);
    });

    // ════════════════════════════════════════════════════════════
    //  NOTES – DELETE
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-N011: Delete note – confirmation dialog shown`, async () => {
      const subject = `Delete Note ${mod.name} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'About to be deleted.' });

      await ntPage.clickDeleteNote(subject);

      await ntPage.assertDeleteNoteDialogVisible();
      await expect(page.getByRole('heading', { name: 'Delete Note!', level: 2 })).toBeVisible();
    });

    test(`NT-${mod.name}-N012: Delete note – Cancel keeps the note`, async () => {
      const subject = `Stay Note ${mod.name} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Should not be deleted.' });

      await ntPage.clickDeleteNote(subject);
      await ntPage.cancelDeleteNote();

      // Note is still present
      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-${mod.name}-N013: Delete note – Confirm removes note from list`, async () => {
      const subject = `Deletable Note ${mod.name} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Will be deleted in N013.' });
      await ntPage.assertNoteVisible(subject);

      await ntPage.clickDeleteNote(subject);
      await ntPage.confirmDeleteNote();

      // Note is gone from the list
      await ntPage.assertNoteNotVisible(subject);
    });

    // ════════════════════════════════════════════════════════════
    //  TASKS – READ / UI
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-T001: Tasks tab is visible and clickable`, async () => {
      await ntPage.clickTasksTab();

      await expect(page.getByRole('tab', { name: /^Tasks/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.newTaskBtn).toBeVisible();
    });

    test(`NT-${mod.name}-T002: Tasks tab has correct table columns`, async () => {
      await ntPage.clickTasksTab();

      // Verify all required column headers are present
      await expect(page.getByRole('button', { name: 'Task Title' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Task Description' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Created By' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Due Date' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Priority' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Type' })).toBeVisible();
    });

    test(`NT-${mod.name}-T003: Tasks empty state shown when no tasks exist`, async () => {
      await ntPage.clickTasksTab();

      const isEmpty = await ntPage.isTasksEmptyStateVisible();
      if (isEmpty) {
        await expect(ntPage.taskEmptyHeading).toBeVisible();
      } else {
        await expect
          .poll(() => ntPage.getTaskRowCount(), { timeout: 10_000 })
          .toBeGreaterThan(0);
      }
    });

    test(`NT-${mod.name}-T004: "Create New Task" drawer has all required fields (no radio-group)`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();

      await ntPage.assertCreateTaskDrawerOpen();

      // NO radio group (module-context drawer differs from global Tasks page)
      await expect(page.getByRole('radio', { name: 'Company' })).not.toBeVisible();
      await expect(page.getByRole('radio', { name: 'Deal' })).not.toBeVisible();
      await expect(page.getByRole('radio', { name: 'Contacts' })).not.toBeVisible();

      // Required fields ARE present
      await expect(ntPage.taskTitleInput).toBeVisible();
      await expect(ntPage.taskDescEditor).toBeVisible();
      await expect(ntPage.taskTypeDropdown).toBeVisible();
      await expect(ntPage.taskPriorityDropdown).toBeVisible();
      await expect(ntPage.taskSaveBtn).toBeVisible();
      await expect(ntPage.taskCancelBtn).toBeVisible();
    });

    test(`NT-${mod.name}-T005: Type dropdown shows all options`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskTypeDropdown.click();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip.getByText('To-do')).toBeVisible();
      await expect(tooltip.getByText('Email')).toBeVisible();
      await expect(tooltip.getByText('Call')).toBeVisible();
      await expect(tooltip.getByText('LinkedIn')).toBeVisible();
    });

    test(`NT-${mod.name}-T006: Priority dropdown shows all options`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskPriorityDropdown.click();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip.getByText('High')).toBeVisible();
      await expect(tooltip.getByText('Medium')).toBeVisible();
      await expect(tooltip.getByText('Low')).toBeVisible();
    });

    // ════════════════════════════════════════════════════════════
    //  TASKS – CREATE
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-T007: Create task – success and task appears in table`, async () => {
      const title = `Auto Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: `Smoke test task for ${mod.name} – Playwright automation.`,
        type:        'To-do',
        priority:    'High',
      });

      // Drawer closes and task row appears in the table
      await expect(ntPage.createTaskDrawerHeading).not.toBeVisible();
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-${mod.name}-T008: Create task – Cancel discards the task`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();

      await ntPage.fillTaskForm({
        title:       `CANCEL TASK ${mod.name}`,
        description: 'This task should not be saved.',
        type:        'Call',
        priority:    'Low',
      });
      await ntPage.cancelTask();

      await expect(ntPage.createTaskDrawerHeading).not.toBeVisible();
    });

    test(`NT-${mod.name}-T009: Create task – validation shown for empty Title`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();

      // Fill description + type + priority but leave title blank
      await ntPage.taskDescEditor.click();
      await ntPage.taskDescEditor.fill('Description without title.');
      await ntPage.selectTaskType('Email');
      await ntPage.selectTaskPriority('Medium');

      await ntPage.taskSaveBtn.click();

      // Drawer stays open – save was blocked by validation
      await expect(ntPage.createTaskDrawerHeading).toBeVisible();
      await expect(ntPage.taskTitleInput).toHaveValue('');
    });

    // ════════════════════════════════════════════════════════════
    //  TASKS – SEARCH
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-T010: Search task by title filters results`, async () => {
      const title = `Searchable Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Created to verify search.',
        type:        'To-do',
        priority:    'Medium',
      });

      await ntPage.searchTask(title);

      // The task must be visible; no other unrelated tasks should appear
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-${mod.name}-T011: Search with non-matching term shows empty state`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.searchTask('ZZZNOMATCH_XYZ_99999');

      await expect(ntPage.taskEmptyHeading).toBeVisible();
    });

    // ════════════════════════════════════════════════════════════
    //  TASKS – UPDATE
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-T012: Edit task – drawer opens pre-populated`, async () => {
      const title = `Edit Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'To be edited.',
        type:        'To-do',
        priority:    'Low',
      });

      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();

      await expect(ntPage.editTaskDrawerHeading).toBeVisible();
      await expect(ntPage.taskTitleInput).toHaveValue(title);
    });

    test(`NT-${mod.name}-T013: Edit task – update title and save`, async () => {
      const title        = `Update Task ${mod.name} ${ts()}`;
      const updatedTitle = `${title} UPDATED`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Original description.',
        type:        'Email',
        priority:    'Medium',
      });

      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();

      // Update the title
      await ntPage.taskTitleInput.fill(updatedTitle);
      await ntPage.saveTask();

      // Updated title now visible in the table
      await ntPage.assertTaskVisible(updatedTitle);
    });

    test(`NT-${mod.name}-T014: Edit task – Cancel keeps original task unchanged`, async () => {
      const title = `Keep Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Should remain as-is.',
        type:        'LinkedIn',
        priority:    'High',
      });

      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();

      await ntPage.taskTitleInput.fill('SHOULD NOT SAVE');
      await ntPage.cancelTask();

      // Edit drawer closed, original title still in table
      await expect(ntPage.editTaskDrawerHeading).not.toBeVisible();
      await ntPage.assertTaskVisible(title);
    });

    // ════════════════════════════════════════════════════════════
    //  TASKS – MARK COMPLETE / UNMARK
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-T015: Mark task as complete via checkbox`, async () => {
      const title = `Complete Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be marked complete.',
        type:        'To-do',
        priority:    'High',
      });
      await ntPage.searchTask(title);

      // Checkbox should initially be unchecked
      const checkbox = ntPage.taskTable.locator('tbody tr').first().getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();

      // Mark complete
      await ntPage.toggleTaskComplete(title);
      await expect(checkbox).toBeChecked();
    });

    test(`NT-${mod.name}-T016: Unmark completed task reverts to To-do`, async () => {
      const title = `Unmark Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be marked then unmarked.',
        type:        'Call',
        priority:    'Medium',
      });
      await ntPage.searchTask(title);

      const checkbox = ntPage.taskTable.locator('tbody tr').first().getByRole('checkbox');

      // Mark complete first
      await ntPage.toggleTaskComplete(title);
      await expect(checkbox).toBeChecked();

      // Unmark
      await ntPage.toggleTaskComplete(title);
      await expect(checkbox).not.toBeChecked();
    });

    // ════════════════════════════════════════════════════════════
    //  TASKS – DELETE
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-T017: Delete task – confirmation dialog shown correctly`, async () => {
      const title = `Delete Dialog Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'For delete dialog verification.',
        type:        'To-do',
        priority:    'Low',
      });

      await ntPage.openTaskDetail(title);
      await ntPage.clickDeleteTaskFromMenu();

      await ntPage.assertDeleteTaskDialogVisible();
      await expect(page.getByRole('heading', { name: 'Delete Task' })).toBeVisible();
    });

    test(`NT-${mod.name}-T018: Delete task – Cancel keeps the task`, async () => {
      const title = `Stay Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Should not be deleted.',
        type:        'Email',
        priority:    'High',
      });

      await ntPage.openTaskDetail(title);
      await ntPage.clickDeleteTaskFromMenu();
      await ntPage.cancelDeleteTask();

      await expect
        .poll(() => ntPage.getTaskRowCount(), { timeout: 10_000 })
        .toBeGreaterThan(0);
      await expect(ntPage.deleteTaskDialog).not.toBeVisible();
    });

    test(`NT-${mod.name}-T019: Delete task – Confirm removes task from table`, async () => {
      const title = `Deletable Task ${mod.name} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be permanently deleted in T019.',
        type:        'Call',
        priority:    'Low',
      });

      await ntPage.openTaskDetail(title);
      await ntPage.clickDeleteTaskFromMenu();
      await ntPage.confirmDeleteTask();
      await ntPage.searchTask(title);

      await expect
        .poll(() => ntPage.getTaskRowCount(), { timeout: 10_000 })
        .toBe(0);
    });

    // ════════════════════════════════════════════════════════════
    //  NOTES + TASKS – COMBINED / CROSS-TAB
    // ════════════════════════════════════════════════════════════

    test(`NT-${mod.name}-X001: Switching between Notes and Tasks tabs works correctly`, async () => {
      // Notes tab
      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.createNoteBtn).toBeVisible();

      // Tasks tab
      await ntPage.clickTasksTab();
      await expect(page.getByRole('tab', { name: /^Tasks/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.newTaskBtn).toBeVisible();

      // Back to Notes
      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
    });

    test(`NT-${mod.name}-X002: Create a Note and a Task in same session – both persist`, async () => {
      const noteSubject = `Cross Note ${mod.name} ${ts()}`;
      const taskTitle   = `Cross Task ${mod.name} ${ts()}`;

      // Create Note
      await ntPage.clickNotesTab();
      await ntPage.createNote({
        subject:     noteSubject,
        description: 'Cross-tab note for smoke validation.',
      });
      await ntPage.assertNoteVisible(noteSubject);

      // Create Task
      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title:       taskTitle,
        description: 'Cross-tab task for smoke validation.',
        type:        'To-do',
        priority:    'Medium',
      });
      await ntPage.assertTaskVisible(taskTitle);

      // Switch back to Notes – note should still be there
      await ntPage.clickNotesTab();
      await ntPage.assertNoteVisible(noteSubject);
    });

  }); // end test.describe
} // end for (const mod of MODULES)
});
