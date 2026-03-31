// ============================================================
// pages/notesTask.page.js
// Page Object Model – Notes & Tasks tabs (Common across modules)
//
// Signal CRM | Playwright JS | POM
// Live-explored: 2026-03-27 via MCP browser automation
//
// Supported Modules:
//   - Contacts  (/app/sales/contacts/detail/:id)
//   - Companies (/app/sales/companies/company/:id)
//   - Properties(/app/sales/locations/location/:id)
//   - Deals     (/app/sales/deals/deal/:id)
//
// Notes CRUD:
//   - Create note (Subject + Description)
//   - Read / verify note in list
//   - Edit note (opens "Edit Notes" drawer)
//   - Delete note (with confirmation dialog)
//
// Tasks CRUD (module-context – no radio-group):
//   - Create task (Title + Description + Type + Priority)
//   - Read / verify task in list
//   - Search task by title
//   - Edit task (via task detail panel → three-dot menu)
//   - Delete task (with confirmation dialog)
//   - Mark / Unmark task as complete
// ============================================================

class NotesTaskPage {
  constructor(page) {
    this.page = page;

    // ── SHARED ──────────────────────────────────────────────────
    // Toast notification – appears on successful create / update / delete
    this.successToast = page.getByRole('alert');

    // ── NOTES TAB ───────────────────────────────────────────────
    // Why: tab role with /^Notes/ matches both "Notes" and "Notes 1" (count badge)
    this.notesTab = page.getByRole('tab', { name: /^Notes/ });

    // "Create New Note" button – appears in the Overview header when Notes tab is active
    // Why: role-based, stable text, no fragile CSS chain
    this.createNoteBtn = page.getByRole('button', { name: 'Create New Note' });

    // ── Add / Edit Notes Drawer ──────────────────────────────────
    // Drawer heading identifies which mode (Add vs Edit) is open
    // Why: heading level + text is unique – no other h4 with these names on page
    this.addNoteDrawerHeading  = page.getByRole('heading', { name: 'Add Notes',  level: 4 });
    this.editNoteDrawerHeading = page.getByRole('heading', { name: 'Edit Notes', level: 4 });

    // Subject field – DOM id="title", confirmed via MCP exploration
    // Why: id attribute is the most stable selector available; Playwright auto-resolved it
    this.noteSubjectInput = page.locator('#title');

    // Description rich-text editor (Draft.js / rdw-editor)
    // Why: role=textbox with aria-label "rdw-editor" is set by the editor library
    this.noteDescEditor = page.getByRole('textbox', { name: 'rdw-editor' });

    // Character counter ("39 / 4961") – confirms description was typed
    this.noteCharCounter = page.locator('p').filter({ hasText: /\d+ \/ [45]\d{3}/ });

    // Drawer action buttons – scoped by text (one drawer is open at a time)
    // Why: Save / Cancel appear uniquely inside the active drawer; no ambiguity while drawer is open
    this.noteSaveBtn   = page.getByRole('button', { name: 'Save' });
    this.noteCancelBtn = page.getByRole('button', { name: 'Cancel' });

    // ── Notes Tab Panel ──────────────────────────────────────────
    // Container for the notes list – scoped to avoid selecting buttons from main page header
    // Why: tabpanel role + name matching /Notes/ isolates note-area buttons (Edit/Delete)
    //      from the module-level "Edit" button (e.g. "Edit Contact" in the header)
    this.notesTabPanel = page.getByRole('tabpanel', { name: /Notes/ });

    // Empty state shown when no notes exist
    this.noteEmptyHeading = this.notesTabPanel.getByText("Oops, It's Empty Here!");
    this.noteEmptySubtext = this.notesTabPanel.getByText('Get Started and Fill It Up!');

    // ── Delete Note Confirmation Dialog ──────────────────────────
    // Why: role=dialog with accessible name "Delete Note!" pinpoints this specific dialog
    this.deleteNoteDialog    = page.getByRole('dialog', { name: 'Delete Note!' });
    this.deleteNoteText      = page.getByText('Are you sure you want to delete this note?');
    this.deleteNoteConfirmBtn = page.getByRole('button', { name: 'Delete Note' });

    // ── TASKS TAB ────────────────────────────────────────────────
    // Why: /^Tasks/ matches "Tasks" and "Tasks (n)" badge variants
    this.tasksTab = page.getByRole('tab', { name: /^Tasks/ });

    // "New Task" button in the module-context tasks toolbar
    // Why: role + name; no XPath or fragile CSS needed
    this.newTaskBtn = page.getByRole('button', { name: 'New Task' });

    // Task search box in the tasks toolbar
    this.taskSearchInput = page
      .getByRole('searchbox', { name: 'Search by Title' })
      .or(page.locator('input[placeholder*="Search by Title"]').first())
      .or(page.getByRole('searchbox').first());

    // Filter dropdowns inside the tasks tab toolbar
    // Why: h6 with exact text is the rendered trigger for each custom dropdown
    this.typeFilterTrigger     = page.locator('h6').filter({ hasText: /^Type$/ }).first();
    this.priorityFilterTrigger = page.locator('h6').filter({ hasText: /^Priority$/ }).first();
    this.statusFilterTrigger   = page.locator('h6').filter({ hasText: /^Status$/ }).first();

    // ── Create / Edit Task Drawer ────────────────────────────────
    // Why: heading level 3 + exact name uniquely identifies the drawer mode
    this.createTaskDrawerHeading = page.getByRole('heading', { name: 'Create New Task', level: 3 });
    this.editTaskDrawerHeading   = page.getByRole('heading', { name: 'Update This Task', level: 3 });

    // Task title textbox
    // Why: placeholder "Task Title" is a stable, role-based selector
    this.taskTitleInput = page.getByRole('textbox', { name: 'Task Title' });

    // Task description editor (same Draft.js component as notes)
    this.taskDescEditor = page.getByRole('textbox', { name: 'rdw-editor' });

    // Task char counter (500 char limit for tasks vs 5000 for notes)
    this.taskCharCounter = page.locator('p').filter({ hasText: /\d+ \/ 5\d\d/ });

    // Type dropdown trigger – reflects current selection or placeholder
    // Why: h6 text cycles through "Select Type" / "To-do" / "Email" / "Call" / "LinkedIn"
    this.taskTypeDropdown = page
      .locator('h6')
      .filter({ hasText: /^(Select Type|To-do|Email|Call|LinkedIn)$/ })
      .first();

    // Priority dropdown trigger
    // Why: same pattern – h6 reflects current value or placeholder
    this.taskPriorityDropdown = page
      .locator('h6')
      .filter({ hasText: /^(Select Priority|High|Medium|Low)$/ })
      .first();

    // Due Date input – placeholder text is garbled ("un5efine5") from a rendering quirk
    // Why: partial placeholder match "*efine*" is the only reliable way to target this input
    this.taskDueDateInput = page.locator('input[placeholder*="efine"]').first();

    // Drawer action buttons (one drawer open at a time → no ambiguity)
    this.taskSaveBtn   = page.getByRole('button', { name: 'Save' });
    this.taskCancelBtn = page.getByRole('button', { name: 'Cancel' });

    // ── Tasks Table ──────────────────────────────────────────────
    this.taskTable        = page.getByRole('table');
    this.taskEmptyHeading = page.getByRole('heading', { name: 'No tasks Added.' });
    this.taskRowsPerPage  = page.getByRole('combobox', { name: /Rows per page/ });
    this.taskPagination   = page.locator('p').filter({ hasText: /\d+–\d+ of \d+/ });

    // ── Task Detail Panel ────────────────────────────────────────
    // Three-dot actions menu inside the detail panel
    // Why: [class*="active"] scopes to the open slide-in panel
    this.taskMoreActionsBtn = page.locator('[class*="active"] button').first();
    this.taskEditMenuItem   = page.getByRole('menuitem', { name: 'Edit' });
    this.taskDeleteMenuItem = page.getByRole('menuitem', { name: 'Delete' });

    // Close detail panel (X link)
    this.taskDetailCloseBtn = page.locator('a[href="#"]');

    // ── Delete Task Confirmation Dialog ──────────────────────────
    this.deleteTaskDialog     = page.getByRole('dialog', { name: 'Delete Task' });
    this.deleteTaskText       = page.getByText('Are you sure you want to delete this task?');
    this.deleteTaskConfirmBtn = page.getByRole('button', { name: 'Delete' });
  }

  async waitForMutationFeedback(closeTarget) {
    await Promise.any([
      this.successToast.waitFor({ state: 'visible', timeout: 5_000 }),
      closeTarget.waitFor({ state: 'hidden', timeout: 8_000 }),
    ]).catch(() => {});

    await closeTarget.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(400);
  }

  // ════════════════════════════════════════════════════════════
  //  NOTES METHODS
  // ════════════════════════════════════════════════════════════

  /** Click the Notes tab in the module detail page Overview section */
  async clickNotesTab() {
    await this.notesTab.click();
    await this.page.waitForTimeout(400);
  }

  /** Click "Create New Note" and wait for drawer to open */
  async openCreateNoteDrawer() {
    await this.createNoteBtn.click();
    await this.addNoteDrawerHeading.waitFor({ state: 'visible', timeout: 6_000 });
  }

  /**
   * Fill the Add Notes / Edit Notes drawer fields.
   * @param {Object} data
   * @param {string} data.subject     - note subject (required)
   * @param {string} data.description - note body (required)
   */
  async fillNoteForm({ subject, description }) {
    // Subject field (id="title")
    await this.noteSubjectInput.fill(subject);

    // Description editor – click first to ensure focus, then fill
    await this.noteDescEditor.click();
    await this.noteDescEditor.fill(description);
    await this.page.waitForTimeout(200);
  }

  /** Click Save and wait for success toast */
  async saveNote() {
    await this.noteSaveBtn.click();
    await this.waitForMutationFeedback(this.addNoteDrawerHeading);
  }

  /** Click Cancel in the note drawer */
  async cancelNote() {
    await this.noteCancelBtn.click();
    // Drawer should close
    await this.addNoteDrawerHeading
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {}); // may already be gone
  }

  /**
   * Full Note Create flow.
   * @param {{ subject: string, description: string }} data
   */
  async createNote(data) {
    await this.openCreateNoteDrawer();
    await this.fillNoteForm(data);
    await this.saveNote();
  }

  /**
   * Click the Edit button on the first note matching the given subject.
   * Scoped to notesTabPanel to avoid conflicting with the module-level Edit button.
   * @param {string} [subject] - optional; if omitted, clicks the first note's Edit
   */
  async clickEditNote(subject) {
    if (subject) {
      // Find the note container that contains this subject text, then click its Edit button
      await this.notesTabPanel
        .locator('div')
        .filter({ hasText: new RegExp(`Note: ${subject}`) })
        .getByRole('button', { name: 'Edit' })
        .first()
        .click();
    } else {
      // Click the first Edit button inside the notes panel
      await this.notesTabPanel.getByRole('button', { name: 'Edit' }).first().click();
    }
    await this.editNoteDrawerHeading.waitFor({ state: 'visible', timeout: 6_000 });
  }

  /**
   * Fill the Edit Notes drawer with updated values.
   * Pass only the fields you want to change.
   * @param {Object} data
   * @param {string} [data.subject]
   * @param {string} [data.description]
   */
  async fillEditNoteForm({ subject, description } = {}) {
    if (subject !== undefined) {
      await this.noteSubjectInput.clear();
      await this.noteSubjectInput.fill(subject);
    }
    if (description !== undefined) {
      // Triple-click to select all existing text, then replace
      await this.noteDescEditor.click({ clickCount: 3 });
      await this.noteDescEditor.fill(description);
    }
    await this.page.waitForTimeout(200);
  }

  /** Click Save in the Edit Notes drawer and wait for success toast */
  async saveEditedNote() {
    await this.noteSaveBtn.click();
    await this.waitForMutationFeedback(this.editNoteDrawerHeading);
  }

  /**
   * Click the Delete button on the first note matching the given subject,
   * then wait for the confirmation dialog.
   * @param {string} [subject] - optional
   */
  async clickDeleteNote(subject) {
    if (subject) {
      await this.notesTabPanel
        .locator('div')
        .filter({ hasText: new RegExp(`Note: ${subject}`) })
        .getByRole('button', { name: /delete/i })
        .first()
        .click();
    } else {
      await this.notesTabPanel.getByRole('button', { name: /delete/i }).first().click();
    }
    await this.deleteNoteDialog.waitFor({ state: 'visible', timeout: 5_000 });
  }

  /** Click "Delete Note" in the confirmation dialog and wait for toast */
  async confirmDeleteNote() {
    await this.deleteNoteConfirmBtn.click();
    await this.waitForMutationFeedback(this.deleteNoteDialog);
  }

  /** Click "Cancel" in the Delete Note confirmation dialog */
  async cancelDeleteNote() {
    await this.deleteNoteDialog.getByRole('button', { name: 'Cancel' }).click();
    await this.deleteNoteDialog.waitFor({ state: 'hidden', timeout: 5_000 });
  }

  /** Returns true if the notes empty state is visible */
  async isNotesEmptyStateVisible() {
    await this.notesTab.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    const startedAt = Date.now();
    while (Date.now() - startedAt < 5_000) {
      const emptyVisible = await this.noteEmptyHeading.isVisible().catch(() => false);
      if (emptyVisible) {
        return true;
      }

      const noteCount = await this.getNoteCount().catch(() => 0);
      if (noteCount > 0) {
        return false;
      }

      await this.page.waitForTimeout(250);
    }

    return this.noteEmptyHeading.isVisible().catch(() => false);
  }

  /**
   * Returns the visible note item locator by subject text.
   * Useful for asserting a note exists or is gone.
   * @param {string} subject
   */
  getNoteBySubject(subject) {
    return this.notesTabPanel.locator('p').filter({
      hasText: new RegExp(`Note: ${subject}`),
    });
  }

  /** Returns the count of visible note items in the Notes tab panel */
  async getNoteCount() {
    const subjectCount = await this.notesTabPanel
      .locator('p')
      .filter({ hasText: /^Note:/ })
      .count();

    if (subjectCount > 0) {
      return subjectCount;
    }

    return this.notesTabPanel.getByRole('button', { name: 'Edit' }).count();
  }

  getTaskTitleSnippet(taskTitle) {
    return taskTitle.length > 26 ? taskTitle.slice(0, 26) : taskTitle;
  }

  getTaskRowByTitle(taskTitle) {
    return this.page
      .locator('table tbody tr')
      .filter({ hasText: this.getTaskTitleSnippet(taskTitle) });
  }

  // ════════════════════════════════════════════════════════════
  //  TASKS METHODS
  // ════════════════════════════════════════════════════════════

  /** Click the Tasks tab in the module detail page Overview section */
  async clickTasksTab() {
    await this.tasksTab.click();
    await this.page.waitForTimeout(400);
  }

  /** Click "New Task" and wait for the create drawer to open */
  async openCreateTaskDrawer() {
    await this.newTaskBtn.click();
    await this.createTaskDrawerHeading.waitFor({ state: 'visible', timeout: 6_000 });
  }

  /**
   * Select a Type option from the custom dropdown tooltip.
   * @param {'To-do'|'Email'|'Call'|'LinkedIn'} typeOption
   */
  async selectTaskType(typeOption) {
    await this.taskTypeDropdown.click();
    await this.page.getByRole('tooltip').getByText(typeOption, { exact: true }).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Select a Priority option from the custom dropdown tooltip.
   * @param {'High'|'Medium'|'Low'} priorityOption
   */
  async selectTaskPriority(priorityOption) {
    await this.taskPriorityDropdown.click();
    await this.page.getByRole('tooltip').getByText(priorityOption, { exact: true }).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Fill all required task form fields.
   * @param {Object} data
   * @param {string} data.title       - task title (required)
   * @param {string} data.description - task description (required)
   * @param {string} [data.type]      - 'To-do'|'Email'|'Call'|'LinkedIn'
   * @param {string} [data.priority]  - 'High'|'Medium'|'Low'
   */
  async fillTaskForm({ title, description, type, priority }) {
    await this.taskTitleInput.fill(title);
    await this.taskDescEditor.click();
    await this.taskDescEditor.fill(description);
    if (type)     await this.selectTaskType(type);
    if (priority) await this.selectTaskPriority(priority);
    await this.page.waitForTimeout(200);
  }

  /** Click Save in the task drawer and wait for success toast */
  async saveTask() {
    await this.taskSaveBtn.click();
    await this.waitForMutationFeedback(
      await this.editTaskDrawerHeading.isVisible().catch(() => false)
        ? this.editTaskDrawerHeading
        : this.createTaskDrawerHeading
    );
  }

  /** Click Cancel in the task drawer */
  async cancelTask() {
    await this.taskCancelBtn.click();
    await this.createTaskDrawerHeading
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }

  /**
   * Full Task Create flow in module context.
   * @param {{ title: string, description: string, type: string, priority: string }} data
   */
  async createTask(data) {
    await this.openCreateTaskDrawer();
    await this.fillTaskForm(data);
    await this.saveTask();
  }

  /**
   * Type in the Search by Title box and wait for debounce.
   * @param {string} term
   */
  async searchTask(term) {
    await this.taskSearchInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.taskSearchInput.fill(term);
    await this.page.waitForTimeout(800); // debounce
  }

  /** Clear the task search box */
  async clearTaskSearch() {
    await this.taskSearchInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.taskSearchInput.clear();
    await this.page.waitForTimeout(800);
  }

  /**
   * Click a task row in the table to open its detail slide-in panel.
   * @param {string} taskTitle - partial or full title
   */
  async openTaskDetail(taskTitle) {
    this.currentTaskTitle = taskTitle;
    let row = this.getTaskRowByTitle(taskTitle).first();

    if (await row.count().catch(() => 0) === 0) {
      await this.searchTask(taskTitle);
      row = this.page
        .locator('table tbody tr')
        .filter({ hasNot: this.page.locator('[colspan]') })
        .first();
    }

    await row.locator('td').nth(1).click();
    await Promise.any([
      this.page.getByText('Task Description').waitFor({ state: 'visible', timeout: 5_000 }),
      this.page.getByRole('heading', { name: new RegExp(taskTitle) }).waitFor({ state: 'visible', timeout: 5_000 }),
    ]).catch(() => {});
    await this.page.waitForTimeout(400);
  }

  getTaskDetailPanel() {
    const escapedTitle = this.currentTaskTitle
      ? this.currentTaskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      : '.*';
    const detailHeading = this.page.getByRole('heading', {
      name: new RegExp(escapedTitle, 'i'),
      level: 3,
    });

    return this.page
      .locator('[active], [class*="active"], [role="dialog"], [class*="drawer"]')
      .filter({ has: detailHeading })
      .last();
  }

  /** Open the three-dot ⋮ menu inside the task detail panel */
  async openTaskMoreActionsMenu() {
    const waitForTaskMenu = async () => Promise.any([
      this.taskEditMenuItem.waitFor({ state: 'visible', timeout: 3_000 }),
      this.taskDeleteMenuItem.waitFor({ state: 'visible', timeout: 3_000 }),
    ]);

    const detailHeading = this.page.getByRole('heading', {
      name: new RegExp(this.currentTaskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      level: 3,
    });
    await detailHeading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

    const detailHeader = detailHeading.locator('xpath=..');
    const detailPanelButtons = detailHeader.getByRole('button');
    const detailPanelButtonCount = await detailPanelButtons.count().catch(() => 0);

    for (let i = Math.max(detailPanelButtonCount - 1, 0); i >= 0; i -= 1) {
      const panelButton = detailPanelButtons.nth(i);

      if (!await panelButton.isVisible().catch(() => false)) {
        continue;
      }

      await panelButton.scrollIntoViewIfNeeded().catch(() => {});
      await panelButton.click({ force: true }).catch(() => {});

      const menuOpened = await waitForTaskMenu()
        .then(() => true)
        .catch(() => false);

      if (menuOpened) {
        return;
      }
    }

    let rowActionButton = this.currentTaskTitle
      ? this.getTaskRowByTitle(this.currentTaskTitle).first().getByRole('button').last()
      : null;

    if (!rowActionButton || !await rowActionButton.isVisible().catch(() => false)) {
      if (this.currentTaskTitle) {
        await this.searchTask(this.currentTaskTitle);
      }

      rowActionButton = this.page
        .locator('table tbody tr')
        .filter({ hasNot: this.page.locator('[colspan]') })
        .first()
        .getByRole('button')
        .last();
    }

    await rowActionButton.scrollIntoViewIfNeeded().catch(() => {});
    await rowActionButton.click({ force: true });
    await waitForTaskMenu();
  }

  /** Open detail panel → click Edit from the three-dot menu */
  async clickEditTaskFromMenu() {
    await this.openTaskMoreActionsMenu();
    await this.taskEditMenuItem.click();
    await this.editTaskDrawerHeading.waitFor({ state: 'visible', timeout: 6_000 });
  }

  /** Open detail panel → click Delete from the three-dot menu */
  async clickDeleteTaskFromMenu() {
    await this.openTaskMoreActionsMenu();
    await this.taskDeleteMenuItem.click();
    await this.deleteTaskDialog.waitFor({ state: 'visible', timeout: 5_000 });
  }

  /** Click "Delete" in the task confirmation dialog and wait for toast */
  async confirmDeleteTask() {
    await this.deleteTaskConfirmBtn.click();
    await this.waitForMutationFeedback(this.deleteTaskDialog);
  }

  /** Click "Cancel" in the task confirmation dialog */
  async cancelDeleteTask() {
    await this.deleteTaskDialog.getByRole('button', { name: 'Cancel' }).click();
    await this.deleteTaskDialog.waitFor({ state: 'hidden', timeout: 5_000 });
  }

  /**
   * Toggle the task's complete checkbox in the tasks table row.
   * @param {string} taskTitle - used to locate the correct row
   */
  async toggleTaskComplete(taskTitle) {
    await this.searchTask(taskTitle);
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('[colspan]') })
      .first();
    await row.getByRole('checkbox').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Returns whether the checkbox for a given task is checked.
   * @param {string} taskTitle
   */
  async isTaskChecked(taskTitle) {
    const row = this.page.getByRole('row').filter({ hasText: taskTitle });
    return row.getByRole('checkbox').isChecked();
  }

  /** Returns true if the tasks empty state heading is visible */
  async isTasksEmptyStateVisible() {
    return this.taskEmptyHeading.isVisible();
  }

  /** Returns the count of non-empty task rows in the table */
  async getTaskRowCount() {
    const rows = this.page
      .locator('table tbody tr')
      .filter({ hasNot: this.page.locator('[colspan]') });
    return rows.count();
  }

  /** Returns the pagination info text (e.g. "1–5 of 5") */
  async getTaskPaginationText() {
    return this.taskPagination.textContent();
  }

  /** Waits for the success toast to appear */
  async waitForSuccessToast() {
    await this.successToast.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
  }

  // ── Assertion Helpers ────────────────────────────────────────

  /** Assert note is visible in the notes panel by subject text */
  async assertNoteVisible(subject) {
    const { expect } = require('@playwright/test');
    await expect(this.getNoteBySubject(subject)).toBeVisible();
  }

  /** Assert note is NOT visible in the notes panel */
  async assertNoteNotVisible(subject) {
    const { expect } = require('@playwright/test');
    await expect(this.getNoteBySubject(subject)).not.toBeVisible();
  }

  /** Assert task title cell is visible in the tasks table */
  async assertTaskVisible(taskTitle) {
    const { expect } = require('@playwright/test');
    await this.searchTask(taskTitle);
    await expect
      .poll(() => this.getTaskRowCount(), { timeout: 10_000 })
      .toBeGreaterThan(0);
  }

  /** Assert task title cell is NOT visible in the tasks table */
  async assertTaskNotVisible(taskTitle) {
    const { expect } = require('@playwright/test');
    await this.searchTask(taskTitle);
    await expect
      .poll(() => this.getTaskRowCount(), { timeout: 10_000 })
      .toBe(0);
  }

  /** Assert the Add Notes drawer is open */
  async assertAddNoteDrawerOpen() {
    const { expect } = require('@playwright/test');
    await expect(this.addNoteDrawerHeading).toBeVisible();
  }

  /** Assert the Edit Notes drawer is open */
  async assertEditNoteDrawerOpen() {
    const { expect } = require('@playwright/test');
    await expect(this.editNoteDrawerHeading).toBeVisible();
  }

  /** Assert the Create Task drawer is open */
  async assertCreateTaskDrawerOpen() {
    const { expect } = require('@playwright/test');
    await expect(this.createTaskDrawerHeading).toBeVisible();
  }

  /** Assert the Delete Note dialog is visible */
  async assertDeleteNoteDialogVisible() {
    const { expect } = require('@playwright/test');
    await expect(this.deleteNoteDialog).toBeVisible();
    await expect(this.deleteNoteText).toBeVisible();
    await expect(this.deleteNoteConfirmBtn).toBeVisible();
  }

  /** Assert the Delete Task dialog is visible */
  async assertDeleteTaskDialogVisible() {
    const { expect } = require('@playwright/test');
    await expect(this.deleteTaskDialog).toBeVisible();
    await expect(this.deleteTaskText).toBeVisible();
    await expect(this.deleteTaskConfirmBtn).toBeVisible();
  }
}

module.exports = { NotesTaskPage };
