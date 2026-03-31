const { expect } = require('@playwright/test');
const { NotesTaskPage } = require('../../pages/notesTask.page');

const ts = () => Date.now();

function registerNotesTasksSuite({ test, moduleName, getPage, openEntityDetail }) {
  test.describe(`${moduleName} Notes & Tasks CRUD`, () => {
    /** @type {import('../../pages/notesTask.page').NotesTaskPage} */
    let ntPage;
    /** @type {import('@playwright/test').Page} */
    let page;

    test.beforeEach(async () => {
      page = getPage();
      ntPage = new NotesTaskPage(page);
      await openEntityDetail();
    });

    test(`NT-${moduleName}-N001: Notes tab is visible and clickable`, async () => {
      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.createNoteBtn).toBeVisible();
    });

    test(`NT-${moduleName}-N002: Notes empty state or existing notes list is visible`, async () => {
      await ntPage.clickNotesTab();

      await expect
        .poll(async () => {
          const isEmpty = await ntPage.isNotesEmptyStateVisible().catch(() => false);
          if (isEmpty) return 'empty';

          const noteCount = await ntPage.getNoteCount().catch(() => 0);
          if (noteCount > 0) return 'list';

          return 'pending';
        }, { timeout: 15_000 })
        .not.toBe('pending');

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

    test(`NT-${moduleName}-N003: "Add Notes" drawer has all required fields`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();

      await ntPage.assertAddNoteDrawerOpen();
      await expect(ntPage.noteSubjectInput).toBeVisible();
      await expect(ntPage.noteDescEditor).toBeVisible();
      await expect(ntPage.noteSaveBtn).toBeVisible();
      await expect(ntPage.noteCancelBtn).toBeVisible();
    });

    test(`NT-${moduleName}-N004: Create note – success and note appears in list`, async () => {
      const subject = `Auto Note ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({
        subject,
        description: `Smoke test note for ${moduleName} – created by Playwright automation.`,
      });

      await expect(ntPage.addNoteDrawerHeading).not.toBeVisible();
      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-${moduleName}-N005: Create note – validation when Subject is empty`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();
      await ntPage.noteDescEditor.click();
      await ntPage.noteDescEditor.fill('Only description, no subject.');
      await ntPage.noteSaveBtn.click();

      await expect(ntPage.addNoteDrawerHeading).toBeVisible();
      await expect(ntPage.noteSubjectInput).toHaveValue('');
    });

    test(`NT-${moduleName}-N006: Create note – Cancel discards the note`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();
      await ntPage.fillNoteForm({
        subject: `CANCEL ME ${moduleName}`,
        description: 'This note should never be saved.',
      });
      await ntPage.cancelNote();

      await expect(ntPage.addNoteDrawerHeading).not.toBeVisible();
    });

    test(`NT-${moduleName}-N007: Character counter updates as description is typed`, async () => {
      const sampleText = 'Playwright automation – character counter check';

      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();
      await ntPage.noteDescEditor.click();
      await ntPage.noteDescEditor.fill(sampleText);

      await expect(ntPage.noteCharCounter).toContainText(String(sampleText.length));
    });

    test(`NT-${moduleName}-N008: Edit note – drawer opens pre-populated`, async () => {
      const subject = `Edit Note ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Original description.' });
      await ntPage.clickEditNote(subject);

      await ntPage.assertEditNoteDrawerOpen();
      await expect(ntPage.noteSubjectInput).toHaveValue(subject);
    });

    test(`NT-${moduleName}-N009: Edit note – update subject and save`, async () => {
      const subject = `Edit Note ${moduleName} ${ts()}`;
      const updatedSubject = `${subject} UPDATED`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'To be updated.' });
      await ntPage.clickEditNote(subject);
      await ntPage.fillEditNoteForm({ subject: updatedSubject });
      await ntPage.saveEditedNote();

      await ntPage.assertNoteVisible(updatedSubject);
    });

    test(`NT-${moduleName}-N010: Edit note – Cancel keeps original note unchanged`, async () => {
      const subject = `Keep Note ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Should remain unchanged.' });
      await ntPage.clickEditNote(subject);
      await ntPage.fillEditNoteForm({ subject: 'SHOULD NOT SAVE THIS' });
      await ntPage.cancelNote();

      await expect(ntPage.editNoteDrawerHeading).not.toBeVisible();
      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-${moduleName}-N011: Delete note – confirmation dialog shown`, async () => {
      const subject = `Delete Note ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'About to be deleted.' });
      await ntPage.clickDeleteNote(subject);

      await ntPage.assertDeleteNoteDialogVisible();
      await expect(page.getByRole('heading', { name: 'Delete Note!', level: 2 })).toBeVisible();
    });

    test(`NT-${moduleName}-N012: Delete note – Cancel keeps the note`, async () => {
      const subject = `Stay Note ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Should not be deleted.' });
      await ntPage.clickDeleteNote(subject);
      await ntPage.cancelDeleteNote();

      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-${moduleName}-N013: Delete note – Confirm removes note from list`, async () => {
      const subject = `Deletable Note ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Will be deleted in N013.' });
      await ntPage.assertNoteVisible(subject);
      await ntPage.clickDeleteNote(subject);
      await ntPage.confirmDeleteNote();

      await ntPage.assertNoteNotVisible(subject);
    });

    test(`NT-${moduleName}-T001: Tasks tab is visible and clickable`, async () => {
      await ntPage.clickTasksTab();
      await expect(page.getByRole('tab', { name: /^Tasks/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.newTaskBtn).toBeVisible();
    });

    test(`NT-${moduleName}-T002: Tasks tab has correct table columns`, async () => {
      await ntPage.clickTasksTab();
      await expect(page.getByRole('button', { name: 'Task Title' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Task Description' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Created By' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Due Date' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Priority' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Type' })).toBeVisible();
    });

    test(`NT-${moduleName}-T003: Tasks empty state or existing task rows are visible`, async () => {
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

    test(`NT-${moduleName}-T004: "Create New Task" drawer has all required fields`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();

      await ntPage.assertCreateTaskDrawerOpen();
      await expect(page.getByRole('radio', { name: 'Company' })).not.toBeVisible();
      await expect(page.getByRole('radio', { name: 'Deal' })).not.toBeVisible();
      await expect(page.getByRole('radio', { name: 'Contacts' })).not.toBeVisible();
      await expect(ntPage.taskTitleInput).toBeVisible();
      await expect(ntPage.taskDescEditor).toBeVisible();
      await expect(ntPage.taskTypeDropdown).toBeVisible();
      await expect(ntPage.taskPriorityDropdown).toBeVisible();
      await expect(ntPage.taskSaveBtn).toBeVisible();
      await expect(ntPage.taskCancelBtn).toBeVisible();
    });

    test(`NT-${moduleName}-T005: Type dropdown shows all options`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskTypeDropdown.click();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip.getByText('To-do')).toBeVisible();
      await expect(tooltip.getByText('Email')).toBeVisible();
      await expect(tooltip.getByText('Call')).toBeVisible();
      await expect(tooltip.getByText('LinkedIn')).toBeVisible();
    });

    test(`NT-${moduleName}-T006: Priority dropdown shows all options`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskPriorityDropdown.click();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip.getByText('High')).toBeVisible();
      await expect(tooltip.getByText('Medium')).toBeVisible();
      await expect(tooltip.getByText('Low')).toBeVisible();
    });

    test(`NT-${moduleName}-T007: Create task – success and task appears in table`, async () => {
      const title = `Auto Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: `Smoke test task for ${moduleName} – Playwright automation.`,
        type: 'To-do',
        priority: 'High',
      });

      await expect(ntPage.createTaskDrawerHeading).not.toBeVisible();
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-${moduleName}-T008: Create task – Cancel discards the task`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.fillTaskForm({
        title: `CANCEL TASK ${moduleName}`,
        description: 'This task should not be saved.',
        type: 'Call',
        priority: 'Low',
      });
      await ntPage.cancelTask();

      await expect(ntPage.createTaskDrawerHeading).not.toBeVisible();
    });

    test(`NT-${moduleName}-T009: Create task – validation shown for empty Title`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskDescEditor.click();
      await ntPage.taskDescEditor.fill('Description without title.');
      await ntPage.selectTaskType('Email');
      await ntPage.selectTaskPriority('Medium');
      await ntPage.taskSaveBtn.click();

      await expect(ntPage.createTaskDrawerHeading).toBeVisible();
      await expect(ntPage.taskTitleInput).toHaveValue('');
    });

    test(`NT-${moduleName}-T010: Search task by title filters results`, async () => {
      const title = `Searchable Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Created to verify search.',
        type: 'To-do',
        priority: 'Medium',
      });
      await ntPage.searchTask(title);
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-${moduleName}-T011: Search with non-matching term shows empty state`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.searchTask('ZZZNOMATCH_XYZ_99999');
      await expect(ntPage.taskEmptyHeading).toBeVisible();
    });

    test(`NT-${moduleName}-T012: Edit task – drawer opens pre-populated`, async () => {
      test.setTimeout(120_000);
      const title = `Edit Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'To be edited.',
        type: 'To-do',
        priority: 'Low',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();

      await expect(ntPage.editTaskDrawerHeading).toBeVisible();
      await expect(ntPage.taskTitleInput).toHaveValue(title);
    });

    test(`NT-${moduleName}-T013: Edit task – update title and save`, async () => {
      test.setTimeout(120_000);
      const title = `Update Task ${moduleName} ${ts()}`;
      const updatedTitle = `${title} UPDATED`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Original description.',
        type: 'Email',
        priority: 'Medium',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();
      await ntPage.taskTitleInput.fill(updatedTitle);
      await ntPage.saveTask();

      await ntPage.assertTaskVisible(updatedTitle);
    });

    test(`NT-${moduleName}-T014: Edit task – Cancel keeps original task unchanged`, async () => {
      test.setTimeout(120_000);
      const title = `Keep Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Should remain as-is.',
        type: 'LinkedIn',
        priority: 'High',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();
      await ntPage.taskTitleInput.fill('SHOULD NOT SAVE');
      await ntPage.cancelTask();

      await expect(ntPage.editTaskDrawerHeading).not.toBeVisible();
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-${moduleName}-T015: Mark task as complete via checkbox`, async () => {
      test.setTimeout(120_000);
      const title = `Complete Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be marked complete.',
        type: 'To-do',
        priority: 'High',
      });
      await ntPage.searchTask(title);

      const checkbox = ntPage.taskTable.locator('tbody tr').first().getByRole('checkbox');
      await expect(checkbox).not.toBeChecked();
      await ntPage.toggleTaskComplete(title);
      await expect(checkbox).toBeChecked();
    });

    test(`NT-${moduleName}-T016: Unmark completed task reverts to To-do`, async () => {
      test.setTimeout(120_000);
      const title = `Unmark Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be marked then unmarked.',
        type: 'Call',
        priority: 'Medium',
      });
      await ntPage.searchTask(title);

      const checkbox = ntPage.taskTable.locator('tbody tr').first().getByRole('checkbox');
      await ntPage.toggleTaskComplete(title);
      await expect(checkbox).toBeChecked();
      await ntPage.toggleTaskComplete(title);
      await expect(checkbox).not.toBeChecked();
    });

    test(`NT-${moduleName}-T017: Delete task – confirmation dialog shown correctly`, async () => {
      test.setTimeout(120_000);
      const title = `Delete Dialog Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'For delete dialog verification.',
        type: 'To-do',
        priority: 'Low',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickDeleteTaskFromMenu();

      await ntPage.assertDeleteTaskDialogVisible();
      await expect(page.getByRole('heading', { name: 'Delete Task' })).toBeVisible();
    });

    test(`NT-${moduleName}-T018: Delete task – Cancel keeps the task`, async () => {
      test.setTimeout(120_000);
      const title = `Stay Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Should not be deleted.',
        type: 'Email',
        priority: 'High',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickDeleteTaskFromMenu();
      await ntPage.cancelDeleteTask();

      await expect
        .poll(() => ntPage.getTaskRowCount(), { timeout: 10_000 })
        .toBeGreaterThan(0);
      await expect(ntPage.deleteTaskDialog).not.toBeVisible();
    });

    test(`NT-${moduleName}-T019: Delete task – Confirm removes task from table`, async () => {
      test.setTimeout(120_000);
      const title = `Deletable Task ${moduleName} ${ts()}`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be permanently deleted in T019.',
        type: 'Call',
        priority: 'Low',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickDeleteTaskFromMenu();
      await ntPage.confirmDeleteTask();
      await ntPage.searchTask(title);

      await expect
        .poll(() => ntPage.getTaskRowCount(), { timeout: 10_000 })
        .toBe(0);
    });

    test(`NT-${moduleName}-X001: Switching between Notes and Tasks tabs works correctly`, async () => {
      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.createNoteBtn).toBeVisible();

      await ntPage.clickTasksTab();
      await expect(page.getByRole('tab', { name: /^Tasks/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.newTaskBtn).toBeVisible();

      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
    });

    test(`NT-${moduleName}-X002: Create a Note and a Task in same session – both persist`, async () => {
      const noteSubject = `Cross Note ${moduleName} ${ts()}`;
      const taskTitle = `Cross Task ${moduleName} ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({
        subject: noteSubject,
        description: 'Cross-tab note for smoke validation.',
      });
      await ntPage.assertNoteVisible(noteSubject);

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title: taskTitle,
        description: 'Cross-tab task for smoke validation.',
        type: 'To-do',
        priority: 'Medium',
      });
      await ntPage.assertTaskVisible(taskTitle);

      await ntPage.clickNotesTab();
      await ntPage.assertNoteVisible(noteSubject);
    });
  });
}

module.exports = {
  registerNotesTasksSuite,
};
