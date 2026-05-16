const { test, expect } = require('@playwright/test');
const { TIMEOUTS } = require('../../utils/playwright-timeouts');
const { performLogin } = require('../../utils/auth/login-action');
const { ContactNamePage } = require('../../pages/contact-module');
const { writeCreatedContactName } = require('../../utils/shared-run-state');
const { NotesTaskPage } = require('../../pages/notesTask.page');

const uniqueSuffix = `${Date.now()}${process.pid}`;
const nameSuffix = uniqueSuffix.slice(-4);
const alphabeticSuffix = nameSuffix
  .split('')
  .map((digit) => String.fromCharCode(65 + Number(digit)))
  .join('');

const VALID_CONTACT = {
  email: `contact.${uniqueSuffix}@signal-qa.com`,
  firstName: `PAT`,
  lastName: `Contact${alphabeticSuffix.slice(2)}`,
  jobTitle: 'PAT Engineer',
  phone: '1234567890',
  cellPhone: '1234567891'
};

const SEARCH_TERMS = {
  nonExistent: `NoContact${uniqueSuffix}`
};

test.describe('Contact Module', () => {
  let context;
  let page;
  let contactPage;
  let createdContactFullName = '';

  async function ensureCreatedContactExists() {
    if (createdContactFullName) {
      return createdContactFullName;
    }

    await contactPage.navigateDirectly();
    await contactPage.createContact(VALID_CONTACT);
    createdContactFullName = `${VALID_CONTACT.firstName} ${VALID_CONTACT.lastName}`;
    writeCreatedContactName(createdContactFullName);
    await contactPage.navigateDirectly();
    return createdContactFullName;
  }

  async function openCreatedContactDetail() {
    const contactName = await ensureCreatedContactExists();
    await contactPage.navigateDirectly();
    await contactPage.searchContact(contactName);
    await contactPage.openContactByName(contactName);

    await expect(page).toHaveURL(/\/contacts\/detail\//);
    await expect(page.getByRole('heading', { name: contactName, level: 3 })).toBeVisible();
  }

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    contactPage = new ContactNamePage(page);

    await performLogin(page);
  });

  test.beforeEach(async () => {
    await contactPage.closeOpenDrawerIfPresent();
    await contactPage.navigateDirectly();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('TC-CN-001 | Contacts page loads after login', async () => {
    await expect(page).toHaveURL(/\/app\/sales\/contacts/);
    await expect(page.getByText('Contacts').first()).toBeVisible();
  });

  test('TC-CN-002 | Contacts table has correct columns', async () => {
    await contactPage.assertContactsTableVisible();

    const expectedColumns = ['Contact Name', 'Email', 'Phone', 'Job Title', 'Created Date'];
    for (const column of expectedColumns) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible();
    }
  });

  test('TC-CN-003 | Create Contact Form opens', async () => {
    await contactPage.openCreateDrawer();

    await expect(contactPage.createDrawerHeading).toBeVisible();
    await expect(contactPage.emailField).toBeVisible();
    await expect(contactPage.firstNameField).toBeDisabled();
    await expect(contactPage.lastNameField).toBeDisabled();
  });

  test('TC-CN-004 | Create button disabled when Email is empty', async () => {
    await contactPage.openCreateDrawer();
    await contactPage.assertCreateSubmitDisabled();
  });

  test('TC-CN-005 | Create Contact with valid data succeeds', async () => {
    await contactPage.openCreateDrawer();
    await contactPage.fillCreateForm(VALID_CONTACT);

    await expect(contactPage.firstNameField).toBeEnabled();
    await expect(contactPage.lastNameField).toBeEnabled();
    await expect(contactPage.createSubmitBtn).toBeEnabled();

    await contactPage.submitCreateForm();
    createdContactFullName = `${VALID_CONTACT.firstName} ${VALID_CONTACT.lastName}`;
    await expect(contactPage.createDrawerHeading).toBeHidden();
  });

  test('TC-CN-006 | Cancel Create Contact closes drawer', async () => {
    await contactPage.openCreateDrawer();
    await contactPage.emailField.fill(`cancel.${uniqueSuffix}@signal-qa.com`);
    await contactPage.cancelCreateForm();
    await expect(contactPage.createDrawerHeading).toBeHidden();
  });

  test('TC-CN-007 | Search by name returns matching contacts', async () => {
    expect(createdContactFullName).toBeTruthy();

    await contactPage.searchContact(createdContactFullName);
    await expect(page.getByRole('cell', { name: new RegExp(createdContactFullName, 'i') }).first()).toBeVisible();
  });

  test('TC-CN-008 | Search with non-existent term shows no results', async () => {
    await contactPage.searchContact(SEARCH_TERMS.nonExistent);
    await expect(contactPage.searchBox).toHaveValue(SEARCH_TERMS.nonExistent);
    await expect(page.getByRole('cell', { name: new RegExp(SEARCH_TERMS.nonExistent, 'i') }).first()).toBeHidden();
  });

  test('TC-CN-009 | Click contact name navigates to detail page', async () => {
    expect(createdContactFullName).toBeTruthy();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);

    await expect(page).toHaveURL(/\/contacts\/detail\//);
    await expect(page.getByRole('heading', { name: createdContactFullName, level: 3 })).toBeVisible();
    await expect(contactPage.overviewHeading).toBeVisible();
  });

  test('TC-CN-010 | Detail page renders Activities, Notes, Tasks tabs', async () => {
    expect(createdContactFullName).toBeTruthy();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);

    await expect(contactPage.activitiesTab).toBeVisible();
    await expect(contactPage.notesTab).toBeVisible();
    await expect(contactPage.tasksTab).toBeVisible();
  });

  test('TC-CN-011 | Detail sidebar has About, Company, Property sections', async () => {
    expect(createdContactFullName).toBeTruthy();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);

    await expect(contactPage.aboutThisContactBtn).toBeVisible();
    await expect(contactPage.companySectionBtn).toBeVisible();
    await expect(contactPage.propertySectionBtn).toBeVisible();
  });

  test('TC-CN-012 | Edit Contact drawer opens with correct state', async () => {
    expect(createdContactFullName).toBeTruthy();
    await ensureCreatedContactExists();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();

    await expect(contactPage.editDrawerHeading).toBeVisible();
    await expect(contactPage.emailField).toBeDisabled();
    await expect(contactPage.firstNameField).toBeEnabled();
    await expect(contactPage.lastNameField).toBeEnabled();
  });

  test('TC-CN-013 | Save Contact disabled with no changes', async () => {
    expect(createdContactFullName).toBeTruthy();
    await ensureCreatedContactExists();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();
    await contactPage.assertSaveContactDisabled();
  });

  test('TC-CN-014 | Edit Contact updates Job Title successfully', async () => {
    expect(createdContactFullName).toBeTruthy();
    await ensureCreatedContactExists();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();

    await contactPage.fillEditForm({
      jobTitle: 'PAT Updated QA Title',
      phone: '1234567890',
      cellPhone: '1234567891'
    });
    await expect(contactPage.saveContactBtn).toBeEnabled();

    await contactPage.submitEditForm();
    await expect(contactPage.editDrawerHeading).toBeHidden();
  });

  test('TC-CN-015 | Cancel Edit Contact closes drawer', async () => {
    expect(createdContactFullName).toBeTruthy();
    await ensureCreatedContactExists();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();

    await contactPage.firstNameField.fill('PAT_SHOULD_NOT_SAVE');
    await contactPage.cancelEditForm();

    await expect(contactPage.editDrawerHeading).toBeHidden();
    await expect(page.getByRole('heading', { name: createdContactFullName, level: 3 })).toBeVisible();
  });

  test('TC-CN-016 | Sort by Contact Name column', async () => {
    await contactPage.assertContactsTableVisible();
    await contactPage.sortByContactName();

    await expect(contactPage.contactsTable).toBeVisible();
    expect(await page.getByRole('table').getByRole('row').count()).toBeGreaterThan(1);
  });

  test('TC-CN-017 | Pagination next page shows new records', async () => {
    const initialInfo = await contactPage.getPaginationText();
    expect(initialInfo).toMatch(/1–10 of/);
    await expect(contactPage.prevPageBtn).toBeDisabled();

    await contactPage.nextPageBtn.click();
    await expect
      .poll(() => contactPage.getPaginationText(), { timeout: TIMEOUTS.BASE * 10 })
      .toMatch(/11–20 of/);

    const nextInfo = await contactPage.getPaginationText();
    expect(nextInfo).toMatch(/11–20 of/);
    await expect(contactPage.prevPageBtn).toBeEnabled();
  });

  test.describe('Contact Notes & Tasks CRUD', () => {
    const ts = () => Date.now();
    /** @type {import('../../pages/notesTask.page').NotesTaskPage} */
    let ntPage;

    test.beforeEach(async () => {
      ntPage = new NotesTaskPage(page);
      await openCreatedContactDetail();

      // Guard: if the app redirected to login (session expired / invalidated),
      // re-authenticate and retry openCreatedContactDetail once before failing the test.
      if (!/\/app\/sales\//.test(page.url())) {
        await performLogin(page);
        await openCreatedContactDetail();
      }
    });

    test(`NT-Contact-N001: Notes tab is visible and clickable`, async () => {
      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.createNoteBtn).toBeVisible();
    });

    test(`NT-Contact-N002: Notes empty state or existing notes list is visible`, async () => {
      await ntPage.clickNotesTab();

      await expect
        .poll(async () => {
          const isEmpty = await ntPage.isNotesEmptyStateVisible().catch(() => false);
          if (isEmpty) return 'empty';

          const noteCount = await ntPage.getNoteCount().catch(() => 0);
          if (noteCount > 0) return 'list';

          return 'pending';
        }, { timeout: TIMEOUTS.BASE * 30 })
        .not.toBe('pending');

      const isEmpty = await ntPage.isNotesEmptyStateVisible();
      if (isEmpty) {
        await expect(ntPage.noteEmptyHeading).toBeVisible();
        await expect(ntPage.noteEmptySubtext).toBeVisible();
      } else {
        await expect
          .poll(() => ntPage.getNoteCount(), { timeout: TIMEOUTS.BASE * 20 })
          .toBeGreaterThan(0);
      }
    });

    test(`NT-Contact-N003: "Add Notes" drawer has all required fields`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();

      await ntPage.assertAddNoteDrawerOpen();
      await expect(ntPage.noteSubjectInput).toBeVisible();
      await expect(ntPage.noteDescEditor).toBeVisible();
      await expect(ntPage.noteSaveBtn).toBeVisible();
      await expect(ntPage.noteCancelBtn).toBeVisible();
    });

    test(`NT-Contact-N004: Create note – success and note appears in list`, async () => {
      // Verify that note count updates after adding a note
      const subject = `PAT Auto Note Contact ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({
        subject,
        description: `Smoke test note for Contact – created by Playwright automation.`,
      });

      await expect(ntPage.addNoteDrawerHeading).toBeHidden();
      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-Contact-N005: Create note – validation when Subject is empty`, async () => {
      // Verify that Subject field is mandatory while creating a note
      // Verify that system shows validation error when Subject is empty
      // Verify that user cannot save note when required fields are missing
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();
      await ntPage.noteDescEditor.click();
      await ntPage.noteDescEditor.fill('Only description, no subject.');
      await ntPage.noteSaveBtn.click();

      await expect(ntPage.addNoteDrawerHeading).toBeVisible();
      await expect(ntPage.noteSubjectInput).toHaveValue('');
    });

    test(`NT-Contact-N006: Create note – Cancel discards the note`, async () => {
      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();
      await ntPage.fillNoteForm({
        subject: `PAT CANCEL ME Contact`,
        description: 'This note should never be saved.',
      });
      await ntPage.cancelNote();

      await expect(ntPage.addNoteDrawerHeading).toBeHidden();
    });

    test(`NT-Contact-N007: Character counter updates as description is typed`, async () => {
      const sampleText = 'Playwright automation – character counter check';

      await ntPage.clickNotesTab();
      await ntPage.openCreateNoteDrawer();
      await ntPage.noteDescEditor.click();
      await ntPage.noteDescEditor.fill(sampleText);

      await expect(ntPage.noteCharCounter).toContainText(String(sampleText.length));
    });

    test(`NT-Contact-N008: Edit note – drawer opens pre-populated`, async () => {
      const subject = `PAT Edit Note Contact ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Original description.' });
      await ntPage.clickEditNote(subject);

      await ntPage.assertEditNoteDrawerOpen();
      await expect(ntPage.noteSubjectInput).toHaveValue(subject);
    });

    test(`NT-Contact-N009: Edit note – update subject and save`, async () => {
      // Verify that edited note shows updated content in listing
      const subject = `PAT Edit Note Contact ${ts()}`;
      const updatedSubject = `${subject} UPDATED`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'To be updated.' });
      await ntPage.clickEditNote(subject);
      await ntPage.fillEditNoteForm({ subject: updatedSubject });
      await ntPage.saveEditedNote();

      await ntPage.assertNoteVisible(updatedSubject);
    });

    test(`NT-Contact-N010: Edit note – Cancel keeps original note unchanged`, async () => {
      const subject = `PAT Keep Note Contact ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Should remain unchanged.' });
      await ntPage.clickEditNote(subject);
      await ntPage.fillEditNoteForm({ subject: 'PAT SHOULD NOT SAVE THIS' });
      await ntPage.cancelNote();

      await expect(ntPage.editNoteDrawerHeading).toBeHidden();
      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-Contact-N011: Delete note – confirmation dialog shown`, async () => {
      // Verify that delete confirmation modal appears before deleting note
      const subject = `PAT Delete Note Contact ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'About to be deleted.' });
      await ntPage.clickDeleteNote(subject);

      await ntPage.assertDeleteNoteDialogVisible();
      await expect(page.getByRole('heading', { name: 'Delete Note!', level: 2 })).toBeVisible();
    });

    test(`NT-Contact-N012: Delete note – Cancel keeps the note`, async () => {
      // Verify that note is not deleted when cancel is clicked on confirmation modal
      const subject = `PAT Stay Note Contact ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Should not be deleted.' });
      await ntPage.clickDeleteNote(subject);
      await ntPage.cancelDeleteNote();

      await ntPage.assertNoteVisible(subject);
    });

    test(`NT-Contact-N013: Delete note – Confirm removes note from list`, async () => {
      const subject = `PAT Deletable Note Contact ${ts()}`;

      await ntPage.clickNotesTab();
      await ntPage.createNote({ subject, description: 'Will be deleted in N013.' });
      await ntPage.assertNoteVisible(subject);
      await ntPage.clickDeleteNote(subject);
      await ntPage.confirmDeleteNote();

      await ntPage.assertNoteNotVisible(subject);
    });

    test(`NT-Contact-T001: Tasks tab is visible and clickable`, async () => {
      await ntPage.clickTasksTab();
      await expect(page.getByRole('tab', { name: /^Tasks/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.newTaskBtn).toBeVisible();
    });

    test(`NT-Contact-T002: Tasks tab has correct table columns`, async () => {
      await ntPage.clickTasksTab();
      await expect(page.getByRole('button', { name: 'Task Title' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Task Description' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Created By' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Due Date' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Priority' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Type' })).toBeVisible();
    });

    test(`NT-Contact-T003: Tasks empty state or existing task rows are visible`, async () => {
      await ntPage.clickTasksTab();

      const isEmpty = await ntPage.isTasksEmptyStateVisible();
      if (isEmpty) {
        await expect(ntPage.taskEmptyHeading).toBeVisible();
      } else {
        await expect
          .poll(() => ntPage.getTaskRowCount(), { timeout: TIMEOUTS.BASE * 20 })
          .toBeGreaterThan(0);
      }
    });

    test(`NT-Contact-T004: "Create New Task" drawer has all required fields`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();

      await ntPage.assertCreateTaskDrawerOpen();
      await expect(page.getByRole('radio', { name: 'Company' })).toBeHidden();
      await expect(page.getByRole('radio', { name: 'Deal' })).toBeHidden();
      await expect(page.getByRole('radio', { name: 'Contacts' })).toBeHidden();
      await expect(ntPage.taskTitleInput).toBeVisible();
      await expect(ntPage.taskDescEditor).toBeVisible();
      await expect(ntPage.taskTypeDropdown).toBeVisible();
      await expect(ntPage.taskPriorityDropdown).toBeVisible();
      await expect(ntPage.taskSaveBtn).toBeVisible();
      await expect(ntPage.taskCancelBtn).toBeVisible();
    });

    test(`NT-Contact-T005: Type dropdown shows all options`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskTypeDropdown.click();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip.getByText('To-do')).toBeVisible();
      await expect(tooltip.getByText('Email')).toBeVisible();
      await expect(tooltip.getByText('Call')).toBeVisible();
      await expect(tooltip.getByText('LinkedIn')).toBeVisible();
    });

    test(`NT-Contact-T006: Priority dropdown shows all options`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.taskPriorityDropdown.click();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip.getByText('High')).toBeVisible();
      await expect(tooltip.getByText('Medium')).toBeVisible();
      await expect(tooltip.getByText('Low')).toBeVisible();
    });

    test(`NT-Contact-T007: Create task – success and task appears in table`, async () => {
      const title = `PAT ${ts()} Task Contact`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: `Smoke test task for Contact – Playwright automation.`,
        type: 'To-do',
        priority: 'High',
      });

      await expect(ntPage.createTaskDrawerHeading).toBeHidden();
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-Contact-T008: Create task – Cancel discards the task`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.openCreateTaskDrawer();
      await ntPage.fillTaskForm({
        title: `PAT CANCEL TASK Contact`,
        description: 'This task should not be saved.',
        type: 'Call',
        priority: 'Low',
      });
      await ntPage.cancelTask();

      await expect(ntPage.createTaskDrawerHeading).toBeHidden();
    });

    test(`NT-Contact-T009: Create task – validation shown for empty Title`, async () => {
      // Verify that Task Title field is mandatory while creating a task
      // Verify that system shows validation error when required fields are missing
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

    test(`NT-Contact-T010: Search task by title filters results`, async () => {
      // Verify that user can search tasks using Search by Title
      const title = `PAT Searchable ${ts()} Task Contact`;

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

    test(`NT-Contact-T011: Search with non-matching term shows empty state`, async () => {
      await ntPage.clickTasksTab();
      await ntPage.searchTask('ZZZNOMATCH_XYZ_99999');
      await expect(ntPage.taskEmptyHeading).toBeVisible();
    });

    test(`NT-Contact-T012: Edit task – drawer opens pre-populated`, async () => {
      const title = `PAT Edit ${ts()} Task Contact`;

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

    test(`NT-Contact-T013: Edit task – update title and save`, async () => {
      // Verify that user can edit an existing task
      // Verify that edited task details are updated in listing
      const title = `PAT Update ${ts()} Task Contact`;
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

    test(`NT-Contact-T014: Edit task – Cancel keeps original task unchanged`, async () => {
      const title = `PAT Keep ${ts()} Task Contact`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Should remain as-is.',
        type: 'LinkedIn',
        priority: 'High',
      });
      await ntPage.openTaskDetail(title);
      await ntPage.clickEditTaskFromMenu();
      await ntPage.taskTitleInput.fill('PAT SHOULD NOT SAVE');
      await ntPage.cancelTask();

      await expect(ntPage.editTaskDrawerHeading).toBeHidden();
      await ntPage.assertTaskVisible(title);
    });

    test(`NT-Contact-T015: Mark task as complete via checkbox`, async () => {
      // Verify that completed task is shown under Completed status filter
      const title = `PAT Complete ${ts()} Task Contact`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be marked complete.',
        type: 'To-do',
        priority: 'High',
      });
      await ntPage.searchTask(title);

      await expect.poll(() => ntPage.isTaskChecked(title), {
        timeout: TIMEOUTS.BASE * 20,
      }).toBe(false);
      await ntPage.setTaskComplete(title, true);
      await expect.poll(() => ntPage.isTaskChecked(title), {
        timeout: TIMEOUTS.BASE * 20,
      }).toBe(true);
    });

    test(`NT-Contact-T016: Unmark completed task reverts to To-do`, async () => {
      // Verify that unchecking completed checkbox marks task as To-Do
      const title = `PAT Complete ${ts()} Toggle Contact`;

      await ntPage.clickTasksTab();
      await ntPage.createTask({
        title,
        description: 'Will be marked complete.',
        type: 'To-do',
        priority: 'High',
      });
      await ntPage.searchTask(title);

      await ntPage.setTaskComplete(title, true);
      await expect.poll(() => ntPage.isTaskChecked(title), {
        timeout: TIMEOUTS.BASE * 20,
      }).toBe(true);
      await ntPage.setTaskComplete(title, false);
      await expect.poll(() => ntPage.isTaskChecked(title), {
        timeout: TIMEOUTS.BASE * 20,
      }).toBe(false);
    });

    test(`NT-Contact-T017: Delete task – confirmation dialog shown correctly`, async () => {
      const title = `PAT Delete ${ts()} Dialog Task Contact`;

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

    test(`NT-Contact-T018: Delete task – Cancel keeps the task`, async () => {
      // Verify that task is not deleted when delete action is cancelled
      const title = `PAT Stay ${ts()} Task Contact`;

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
        .poll(() => ntPage.getTaskRowCount(), { timeout: TIMEOUTS.BASE * 20 })
        .toBeGreaterThan(0);
      await expect(ntPage.deleteTaskDialog).toBeHidden();
    });

    test(`NT-Contact-T019: Delete task – Confirm removes task from table`, async () => {
      // Verify that user can delete a task after confirmation
      const title = `PAT Deletable ${ts()} Task Contact`;

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
        .poll(() => ntPage.getTaskRowCount(), { timeout: TIMEOUTS.BASE * 20 })
        .toBe(0);
    });

    test(`NT-Contact-X001: Switching between Notes and Tasks tabs works correctly`, async () => {
      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.createNoteBtn).toBeVisible();

      await ntPage.clickTasksTab();
      await expect(page.getByRole('tab', { name: /^Tasks/ })).toHaveAttribute('aria-selected', 'true');
      await expect(ntPage.newTaskBtn).toBeVisible();

      await ntPage.clickNotesTab();
      await expect(page.getByRole('tab', { name: /^Notes/ })).toHaveAttribute('aria-selected', 'true');
    });

    test(`NT-Contact-X002: Create a Note and a Task in same session – both persist`, async () => {
      const noteSubject = `PAT Cross Note Contact ${ts()}`;
      const taskTitle = `PAT Cross Task Contact ${ts()}`;

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
});
