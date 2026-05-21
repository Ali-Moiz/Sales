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

const { TIMEOUTS } = require('../utils/playwright-timeouts');
const { expect } = require("@playwright/test");

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class NotesTaskPage {
  constructor(page) {
    this.page = page;

    // ── SHARED ──────────────────────────────────────────────────
    // Toast notification – appears on successful create / update / delete
    this.successToast = page.getByRole("alert");

    // ── NOTES TAB ───────────────────────────────────────────────
    // Why: tab role with /^Notes/ matches both "Notes" and "Notes 1" (count badge)
    this.notesTab = page.getByRole("tab", { name: /^Notes/ });

    // "Create New Note" button – appears in the Overview header when Notes tab is active
    // Why: role-based, stable text, no fragile CSS chain
    this.createNoteBtn = page.getByRole("button", { name: "Create New Note" });

    // ── Add / Edit Notes Drawer ──────────────────────────────────
    // Drawer heading identifies which mode (Add vs Edit) is open
    // Why: heading level + text is unique – no other h4 with these names on page
    this.addNoteDrawerHeading = page.getByRole("heading", {
      name: "Add Notes",
      level: 4,
    });
    this.editNoteDrawerHeading = page.getByRole("heading", {
      name: "Edit Notes",
      level: 4,
    });

    // Subject field – DOM id="title", confirmed via MCP exploration
    // Why: id attribute is the most stable selector available; Playwright auto-resolved it
    this.noteSubjectInput = page.locator("#title");

    // Description rich-text editor (Draft.js / rdw-editor)
    // Why: role=textbox with aria-label "rdw-editor" is set by the editor library
    this.noteDescEditor = page.getByRole("textbox", { name: "rdw-editor" });

    // Character counter ("39 / 4961") – confirms description was typed
    this.noteCharCounter = page
      .locator("p")
      .filter({ hasText: /\d+ \/ [45]\d{3}/ });

    // Drawer action buttons – scoped by text (one drawer is open at a time)
    // Why: Save / Cancel appear uniquely inside the active drawer; no ambiguity while drawer is open
    this.noteSaveBtn = page.getByRole("button", { name: "Save" });
    this.noteCancelBtn = page.getByRole("button", { name: "Cancel" });

    // ── Notes Tab Panel ──────────────────────────────────────────
    // Container for the notes list – scoped to avoid selecting buttons from main page header
    // Why: tabpanel role + name matching /Notes/ isolates note-area buttons (Edit/Delete)
    //      from the module-level "Edit" button (e.g. "Edit Contact" in the header)
    this.notesTabPanel = page.getByRole("tabpanel", { name: /Notes/ });

    // Empty state shown when no notes exist
    this.noteEmptyHeading = this.notesTabPanel.getByText(
      "Oops, It's Empty Here!",
    );
    this.noteEmptySubtext = this.notesTabPanel.getByText(
      "Get Started and Fill It Up!",
    );

    // ── Delete Note Confirmation Dialog ──────────────────────────
    // Why: role=dialog with accessible name "Delete Note!" pinpoints this specific dialog
    this.deleteNoteDialog = page.getByRole("dialog", { name: "Delete Note!" });
    this.deleteNoteText = page.getByText(
      "Are you sure you want to delete this note?",
    );
    this.deleteNoteConfirmBtn = page.getByRole("button", {
      name: "Delete Note",
    });

    // ── TASKS TAB ────────────────────────────────────────────────
    // Why: /^Tasks/ matches "Tasks" and "Tasks (n)" badge variants
    this.tasksTab = page.getByRole("tab", { name: /^Tasks/ });

    // "New Task" button in the module-context tasks toolbar
    // Why: role + name; no XPath or fragile CSS needed
    this.newTaskBtn = page.getByRole("button", { name: "New Task" });

    // Task search box in the tasks toolbar
    this.taskSearchInput = page
      .getByRole("searchbox", { name: "Search by Title" })
      .or(page.locator('input[placeholder*="Search by Title"]').first())
      .or(page.getByRole("searchbox").first());

    // Filter dropdowns inside the tasks tab toolbar
    // Why: h6 text changes to the active filter value after selection (e.g. "Type" → "Email"),
    //       so we match both the default label AND all possible active-value texts.
    // Fix: 2026-05-05 — locator timed out because h6 showed "Email" instead of "Type" after filtering.
    this.typeFilterTrigger = page
      .locator("h6")
      .filter({ hasText: /^(Type|All|To-do|Email|Call|LinkedIn)$/ })
      .first();
    this.priorityFilterTrigger = page
      .locator("h6")
      .filter({ hasText: /^(Priority|All|High|Medium|Low)$/ })
      .first();
    this.statusFilterTrigger = page
      .locator("h6")
      .filter({ hasText: /^(Status|All Status|All|To-do|To Do|Completed|In Progress)$/ })
      .first();

    // Due Date range picker (MUI DateRangePicker)
    // Live-verified via MCP browser on 2026-05-05
    this.dueDateRangeInput = page.locator(
      'input[placeholder="MM/DD/YYYY - MM/DD/YYYY"]',
    );
    this.dueDatePickerBtn = page.getByRole("button", { name: "Choose date" });

    // ── Create / Edit Task Drawer ────────────────────────────────
    // Why: heading level 3 + exact name uniquely identifies the drawer mode
    this.createTaskDrawerHeading = page.getByRole("heading", {
      name: "Create New Task",
      level: 3,
    });
    this.editTaskDrawerHeading = page.getByRole("heading", {
      name: "Update This Task",
      level: 3,
    });

    // Task title textbox
    // Why: placeholder "Task Title" is a stable, role-based selector
    this.taskTitleInput = page.getByRole("textbox", { name: "Task Title" });

    // Task description editor (same Draft.js component as notes)
    this.taskDescEditor = page.getByRole("textbox", { name: "rdw-editor" });

    // Task char counter (500 char limit for tasks vs 5000 for notes)
    this.taskCharCounter = page
      .locator("p")
      .filter({ hasText: /\d+ \/ 5\d\d/ });

    // Type dropdown trigger – reflects current selection or placeholder
    // Why: h6 text cycles through "Select Type" / "To-do" / "Email" / "Call" / "LinkedIn"
    this.taskTypeDropdown = page
      .locator("h6")
      .filter({ hasText: /^(Select Type|To-do|Email|Call|LinkedIn)$/ })
      .first();

    // Priority dropdown trigger
    // Why: same pattern – h6 reflects current value or placeholder
    this.taskPriorityDropdown = page
      .locator("h6")
      .filter({ hasText: /^(Select Priority|High|Medium|Low)$/ })
      .first();

    // Due Date input – placeholder text is garbled ("un5efine5") from a rendering quirk
    // Why: partial placeholder match "*efine*" is the only reliable way to target this input
    this.taskDueDateInput = page.locator('input[placeholder*="efine"]').first();

    // Drawer action buttons (one drawer open at a time → no ambiguity)
    this.taskSaveBtn = page.getByRole("button", { name: "Save" });
    this.taskCancelBtn = page.getByRole("button", { name: "Cancel" });

    // ── Tasks Table ──────────────────────────────────────────────
    this.taskTable = page.getByRole("table");
    this.taskEmptyHeading = page
      .getByRole("heading", { name: "No tasks Added." })
      .or(page.getByText("No tasks Added.", { exact: true }));
    this.taskRowsPerPage = page.getByRole("combobox", {
      name: /Rows per page/,
    });
    this.taskPagination = page
      .locator("p")
      .filter({ hasText: /\d+–\d+ of \d+/ });

    // ── Task Detail Panel ────────────────────────────────────────
    // Three-dot actions menu inside the detail panel
    // Why: [class*="active"] scopes to the open slide-in panel
    this.taskMoreActionsBtn = page.locator('[class*="active"] button').first();
    this.taskEditMenuItem = page.getByRole("menuitem", { name: "Edit" });
    this.taskDeleteMenuItem = page.getByRole("menuitem", { name: "Delete" });

    // Close detail panel (X link)
    this.taskDetailCloseBtn = page.locator('a[href="#"]');

    // ── Delete Task Confirmation Dialog ──────────────────────────
    this.deleteTaskDialog = page.getByRole("dialog", { name: "Delete Task" });
    this.deleteTaskText = page.getByText(
      "Are you sure you want to delete this task?",
    );
    this.deleteTaskConfirmBtn = page.getByRole("button", { name: "Delete" });
  }

  async waitForMutationFeedback(closeTarget) {
    await Promise.any([
      this.successToast.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 10 }),
      closeTarget.waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 16 }),
    ]).catch(() => {});

    await closeTarget
      .waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 16 })
      .catch(() => {});
    // Cap networkidle at 5 s — CRM apps keep open polling/WS connections so the
    // default 30 s navigationTimeout is always exhausted before .catch() fires.
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.BASE * 10 })
      .catch(() => {});
  }

  async getVisibleLocator(locator) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = locator.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        return candidate;
      }
    }

    return locator.first();
  }

  async hasVisibleLocator(locator) {
    return (await this.countVisibleLocators(locator)) > 0;
  }

  async countVisibleLocators(locator) {
    const count = await locator.count().catch(() => 0);
    let visibleCount = 0;

    for (let i = 0; i < count; i += 1) {
      if (await locator.nth(i).isVisible().catch(() => false)) {
        visibleCount += 1;
      }
    }

    return visibleCount;
  }

  async hasVisibleText(locator, pattern) {
    const count = await locator.count().catch(() => 0);

    for (let i = 0; i < count; i += 1) {
      const candidate = locator.nth(i);
      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }

      const text = (await candidate.textContent().catch(() => ""))?.trim() || "";
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  async getVisibleNoteSubjectInput() {
    return this.getVisibleLocator(this.noteSubjectInput);
  }

  async getVisibleNoteEditor() {
    return this.getVisibleLocator(this.noteDescEditor);
  }

  async getVisibleNoteSaveButton() {
    return this.getVisibleLocator(this.noteSaveBtn);
  }

  async getVisibleNoteCancelButton() {
    return this.getVisibleLocator(this.noteCancelBtn);
  }

  // ════════════════════════════════════════════════════════════
  //  NOTES METHODS
  // ════════════════════════════════════════════════════════════

  /** Click the Notes tab in the module detail page Overview section */
  async clickNotesTab() {
    await this.notesTab.click();
    await expect(this.notesTab).toHaveAttribute("aria-selected", "true", {
      timeout: TIMEOUTS.BASE * 8,
    });
  }

  /** Click "Create New Note" and wait for drawer to open */
  async openCreateNoteDrawer() {
    await this.createNoteBtn.click();
    await this.addNoteDrawerHeading.waitFor({
      state: "visible",
      timeout: TIMEOUTS.BASE * 12,
    });
  }

  /**
   * Fill the Add Notes / Edit Notes drawer fields.
   * @param {Object} data
   * @param {string} data.subject     - note subject (required)
   * @param {string} data.description - note body (required)
   */
  async fillNoteForm({ subject, description }) {
    const subjectInput = await this.getVisibleNoteSubjectInput();
    const noteEditor = await this.getVisibleNoteEditor();

    // Subject field (id="title")
    await subjectInput.click();
    await subjectInput.fill(subject);

    // Description editor – click first to ensure focus, then fill
    await noteEditor.click();
    await noteEditor.fill(description);
    await expect(noteEditor).toContainText(description, {
      timeout: TIMEOUTS.BASE * 4,
    });
  }

  /** Click Save and wait for success toast */
  async saveNote() {
    const saveButton = await this.getVisibleNoteSaveButton();
    await saveButton.click();
    await this.waitForMutationFeedback(this.addNoteDrawerHeading);
  }

  /** Click Cancel in the note drawer */
  async cancelNote() {
    const cancelButton = await this.getVisibleNoteCancelButton();
    await cancelButton.click();
    // Drawer should close
    await this.addNoteDrawerHeading
      .waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 10 })
      .catch(() => {}); // may already be gone
  }

  /**
   * Full Note Create flow.
   * @param {{ subject: string, description: string }} data
   */
  async createNote(data) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.openCreateNoteDrawer();
      await this.fillNoteForm(data);
      await this.saveNote();
      await this.clickNotesTab();

      const created = await expect(this.getNoteBySubject(data.subject).first())
        .toBeVisible({ timeout: TIMEOUTS.BASE * 20 })
        .then(() => true)
        .catch(() => false);

      if (created) return;

      if (await this.addNoteDrawerHeading.isVisible().catch(() => false)) {
        await this.cancelNote().catch(() => {});
      }

      await this.addNoteDrawerHeading
        .waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 8 })
        .catch(() => {});
    }

    await expect(this.getNoteBySubject(data.subject).first()).toBeVisible({
      timeout: TIMEOUTS.BASE * 20,
    });
  }

  /**
   * Click the Edit button on the first note matching the given subject.
   * Scoped to notesTabPanel to avoid conflicting with the module-level Edit button.
   * @param {string} [subject] - optional; if omitted, clicks the first note's Edit
   */
  async clickEditNote(subject) {
    if (subject) {
      const noteTitle = this.getNoteBySubject(subject).first();
      await expect(noteTitle).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      const noteContainer = noteTitle.locator(
        'xpath=ancestor::div[.//button[normalize-space()="Edit"]][1]',
      );
      await noteContainer
        .getByRole("button", { name: "Edit" })
        .first()
        .click();
    } else {
      // Click the first Edit button inside the notes panel
      await this.notesTabPanel
        .getByRole("button", { name: "Edit" })
        .first()
        .click();
    }
    await this.editNoteDrawerHeading.waitFor({
      state: "visible",
      timeout: TIMEOUTS.BASE * 12,
    });
  }

  /**
   * Fill the Edit Notes drawer with updated values.
   * Pass only the fields you want to change.
   * @param {Object} data
   * @param {string} [data.subject]
   * @param {string} [data.description]
   */
  async fillEditNoteForm({ subject, description } = {}) {
    const subjectInput = await this.getVisibleNoteSubjectInput();
    const noteEditor = await this.getVisibleNoteEditor();

    if (subject !== undefined) {
      await subjectInput.click();
      await subjectInput
        .press(`${process.platform === "darwin" ? "Meta" : "Control"}+A`)
        .catch(() => {});
      await subjectInput.fill(subject);
    }
    if (description !== undefined) {
      // Triple-click to select all existing text, then replace
      await noteEditor.click({ clickCount: 3 });
      await noteEditor.fill(description);
      await expect(noteEditor).toContainText(description, {
        timeout: TIMEOUTS.BASE * 4,
      });
    }
  }

  /** Click Save in the Edit Notes drawer and wait for success toast */
  async saveEditedNote() {
    const saveButton = await this.getVisibleNoteSaveButton();
    await saveButton.click();
    await this.waitForMutationFeedback(this.editNoteDrawerHeading);
  }

  /**
   * Click the Delete button on the first note matching the given subject,
   * then wait for the confirmation dialog.
   * @param {string} [subject] - optional
   */
  async clickDeleteNote(subject) {
    if (subject) {
      const noteContainer = this.notesTabPanel
        .locator("div")
        .filter({ hasText: new RegExp(`Note: ${escapeRegExp(subject)}`) })
        .first();
      // Wait for the note to appear in the DOM before looking for its Delete button.
      await noteContainer.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });
      await noteContainer
        .getByRole("button", { name: /delete/i })
        .first()
        .click();
    } else {
      await this.notesTabPanel
        .getByRole("button", { name: /delete/i })
        .first()
        .click();
    }
    await this.deleteNoteDialog.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 10 });
  }

  /** Click "Delete Note" in the confirmation dialog and wait for toast */
  async confirmDeleteNote() {
    await this.deleteNoteConfirmBtn.click();
    await this.waitForMutationFeedback(this.deleteNoteDialog);
  }

  /** Click "Cancel" in the Delete Note confirmation dialog */
  async cancelDeleteNote() {
    await this.deleteNoteDialog.getByRole("button", { name: "Cancel" }).click();
    await this.deleteNoteDialog.waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 10 });
  }

  /** Returns true if the notes empty state is visible */
  async isNotesEmptyStateVisible() {
    await this.notesTab
      .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 10 })
      .catch(() => {});

    let noteState = "pending";
    await expect
      .poll(
        async () => {
          const emptyVisible = await this.noteEmptyHeading
            .isVisible()
            .catch(() => false);
          if (emptyVisible) {
            noteState = "empty";
            return noteState;
          }

          const noteCount = await this.getNoteCount().catch(() => 0);
          if (noteCount > 0) {
            noteState = "has-notes";
            return noteState;
          }

          return "pending";
        },
        { timeout: TIMEOUTS.BASE * 10, intervals: [TIMEOUTS.BASE / 2] },
      )
      .not.toBe("pending")
      .catch(() => {});

    if (noteState === "empty") {
      return true;
    }

    if (noteState === "has-notes") {
      return false;
    }

    const emptyVisible = await this.noteEmptyHeading
      .isVisible()
      .catch(() => false);
    return emptyVisible;
  }

  /**
   * Returns the visible note item locator by subject text.
   * Useful for asserting a note exists or is gone.
   * @param {string} subject
   */
  getNoteBySubject(subject) {
    return this.notesTabPanel.locator("p").filter({
      hasText: new RegExp(`Note: ${escapeRegExp(subject)}`),
    });
  }

  /** Returns the count of visible note items in the Notes tab panel */
  async getNoteCount() {
    const subjectCount = await this.notesTabPanel
      .locator("p")
      .filter({ hasText: /^Note:/ })
      .count();

    if (subjectCount > 0) {
      return subjectCount;
    }

    return this.notesTabPanel.getByRole("button", { name: "Edit" }).count();
  }

  getTaskTitleSnippet(taskTitle) {
    return taskTitle.length > 20 ? taskTitle.slice(0, 20) : taskTitle;
  }

  getTaskRowByTitle(taskTitle) {
    return this.page
      .locator("table tbody tr")
      .filter({ hasText: this.getTaskTitleSnippet(taskTitle) });
  }

  getTaskCheckboxByTitle(taskTitle) {
    return this.getTaskRowByTitle(taskTitle)
      .first()
      .getByRole("checkbox")
      .first();
  }

  async waitForTaskUpdateResponse() {
    await this.page.waitForResponse((response) => {
      const request = response.request();

      return request.method() === "PUT" &&
        response.status() >= 200 &&
        response.status() < 300 &&
        response.url().includes("/shared/tasks/") &&
        response.url().includes("/task/");
    }, { timeout: TIMEOUTS.BASE * 30 });
  }

  getNonEmptyTaskRows() {
    return this.page
      .locator("table tbody tr")
      .filter({ hasNot: this.page.locator("[colspan]") });
  }

  getTaskDetailHeading(taskTitle = this.currentTaskTitle) {
    const escapedTitle = taskTitle
      ? taskTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      : ".*";

    return this.page.getByRole("heading", {
      name: new RegExp(escapedTitle, "i"),
      level: 3,
    });
  }

  async waitForTaskSearchState(term) {
    const normalizedTerm = term.trim();

    await expect
      .poll(
        async () => {
          if (
            (await this.hasVisibleLocator(this.taskEmptyHeading)) ||
            (await this.hasVisibleText(this.taskPagination, /^0[–-]0 of 0$/))
          ) {
            return "empty";
          }

          if (await this.hasVisibleLocator(this.getTaskRowByTitle(term))) {
            return "match";
          }

          if (normalizedTerm) {
            return "pending";
          }

          if ((await this.countVisibleLocators(this.getNonEmptyTaskRows())) > 0) {
            return "rows";
          }

          return "pending";
        },
        {
          timeout: TIMEOUTS.BASE * 60,
          intervals: [
            TIMEOUTS.BASE,
            TIMEOUTS.BASE * 2,
            TIMEOUTS.BASE * 4,
            TIMEOUTS.BASE * 8,
          ],
        },
      )
      .not.toBe("pending");
  }

  async closeOpenTaskDetailPanel() {
    const panel = this.page
      .locator("[active]")
      .filter({ has: this.page.getByText("Task Description") })
      .last();

    if (!(await panel.isVisible().catch(() => false))) {
      return;
    }

    const panelHeading = panel.getByRole("heading", { level: 3 }).first();
    const buttons = panel.locator("button");
    const buttonCount = await buttons.count().catch(() => 0);

    for (let i = 0; i < buttonCount; i += 1) {
      const button = buttons.nth(i);

      if (!(await button.isVisible().catch(() => false))) {
        continue;
      }

      await button.click().catch(() => {});

      const closed = await panelHeading
        .waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 4 })
        .then(() => true)
        .catch(() => false);

      if (closed) {
        return;
      }

      await this.page.keyboard.press("Escape").catch(() => {});
    }

    await this.page.keyboard.press("Escape").catch(() => {});
    await panelHeading.waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 10 }).catch(() => {});
  }

  // ════════════════════════════════════════════════════════════
  //  TASKS METHODS
  // ════════════════════════════════════════════════════════════

  /** Click the Tasks tab in the module detail page Overview section */
  async clickTasksTab() {
    await this.tasksTab.click();
    await expect(this.tasksTab).toHaveAttribute("aria-selected", "true", {
      timeout: TIMEOUTS.BASE * 8,
    });
  }

  /** Click "New Task" and wait for the create drawer to open */
  async openCreateTaskDrawer() {
    await this.newTaskBtn.click();
    await this.createTaskDrawerHeading.waitFor({
      state: "visible",
      timeout: TIMEOUTS.BASE * 12,
    });
  }

  /**
   * Select a Type option from the custom dropdown tooltip.
   * @param {'To-do'|'Email'|'Call'|'LinkedIn'} typeOption
   */
  async selectTaskType(typeOption) {
    await this.taskTypeDropdown.click();
    await this.page
      .getByRole("tooltip")
      .getByText(typeOption, { exact: true })
      .click();
    await expect(this.taskTypeDropdown).toContainText(typeOption, {
      timeout: TIMEOUTS.BASE * 4,
    });
  }

  /**
   * Select a Priority option from the custom dropdown tooltip.
   * @param {'High'|'Medium'|'Low'} priorityOption
   */
  async selectTaskPriority(priorityOption) {
    await this.taskPriorityDropdown.click();
    await this.page
      .getByRole("tooltip")
      .getByText(priorityOption, { exact: true })
      .click();
    await expect(this.taskPriorityDropdown).toContainText(priorityOption, {
      timeout: TIMEOUTS.BASE * 4,
    });
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
    if (type) await this.selectTaskType(type);
    if (priority) await this.selectTaskPriority(priority);
    await expect(this.taskDescEditor).toContainText(description, {
      timeout: TIMEOUTS.BASE * 4,
    });
  }

  /** Click Save in the task drawer and wait for success toast */
  async saveTask() {
    // Determine which drawer is open BEFORE clicking Save — evaluating isVisible() after the
    // click violates SKILL.md §4 ("isVisible() as render-gate before critical interaction —
    // forbidden"): the click may start the close animation immediately, causing isVisible() to
    // return false and the wrong closeTarget to be passed to waitForMutationFeedback, which then
    // resolves instantly (element was never visible) and returns before the task list refreshes.
    const closeTarget = (await this.editTaskDrawerHeading.isVisible().catch(() => false))
      ? this.editTaskDrawerHeading
      : this.createTaskDrawerHeading;
    await this.taskSaveBtn.click();
    await this.waitForMutationFeedback(closeTarget);
  }

  /** Click Cancel in the task drawer */
  async cancelTask() {
    await this.taskCancelBtn.click();
    await this.createTaskDrawerHeading
      .waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 10 })
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
   * Type in the Search by Title box and wait for the field to reflect the query.
   * @param {string} term
   */
  async searchTask(term) {
    await this.taskSearchInput.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 30 });
    await this.taskSearchInput.fill(term);
    await expect(this.taskSearchInput).toHaveValue(term, {
      timeout: TIMEOUTS.BASE * 4,
    });
    await this.waitForTaskSearchState(term);
  }

  /** Clear the task search box */
  async clearTaskSearch() {
    await this.taskSearchInput.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 30 });
    await this.taskSearchInput.clear();
    await expect(this.taskSearchInput).toHaveValue("", {
      timeout: TIMEOUTS.BASE * 4,
    });
  }

  /**
   * Select an option from a task filter dropdown (Type, Priority, Status).
   * @param {import('@playwright/test').Locator} triggerLocator - the h6 filter trigger
   * @param {string} optionText - exact text of the option to select
   */
  async selectTaskFilterOption(triggerLocator, optionText) {
    await triggerLocator.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });
    await triggerLocator.click();
    const popper = this.page
      .locator("#simple-popper")
      .or(this.page.getByRole("tooltip"));
    await popper.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 10 });
    await popper.getByText(optionText, { exact: true }).click();
    await popper.waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 8 }).catch(() => {});
  }

  /**
   * Click a task row in the table to open its detail slide-in panel.
   * @param {string} taskTitle - partial or full title
   */
  async openTaskDetail(taskTitle) {
    this.currentTaskTitle = taskTitle;
    const currentDetailHeading = this.getTaskDetailHeading(taskTitle);

    if (!(await currentDetailHeading.isVisible().catch(() => false))) {
      await this.closeOpenTaskDetailPanel();
      await this.searchTask(taskTitle);
    }

    let row = this.getTaskRowByTitle(taskTitle).first();

    if (!(await row.isVisible().catch(() => false))) {
      row = this.getNonEmptyTaskRows().first();
    }

    await row.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });
    await row.scrollIntoViewIfNeeded();
    await row.locator("td").nth(1).click();
    const opened = await currentDetailHeading
      .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 })
      .then(() => true)
      .catch(() => false);

    if (!opened) {
      await this.page.keyboard.press("Escape").catch(() => {});
    }

    return opened;
  }

  getTaskDetailPanel() {
    const detailHeading = this.getTaskDetailHeading();

    return this.page
      .locator(
        '[active], [class*="active"], [role="dialog"], [class*="drawer"]',
      )
      .filter({ has: detailHeading })
      .last();
  }

  getTaskActionsMenu() {
    return this.page
      .locator('[role="menu"], [role="tooltip"], #simple-popper, .MuiPopover-root')
      .filter({ hasText: /Edit|Delete/ })
      .last();
  }

  getTaskActionMenuItem(name) {
    const actionsMenu = this.getTaskActionsMenu();

    return actionsMenu
      .getByRole("menuitem", { name })
      .or(actionsMenu.getByText(name, { exact: true }))
      .first();
  }

  async isTaskActionsMenuVisible() {
    const editVisible = await this.getTaskActionMenuItem("Edit")
      .isVisible()
      .catch(() => false);
    const deleteVisible = await this.getTaskActionMenuItem("Delete")
      .isVisible()
      .catch(() => false);

    return editVisible || deleteVisible;
  }

  async waitForTaskActionsMenu() {
    await expect
      .poll(
        async () => (await this.isTaskActionsMenuVisible() ? "open" : "pending"),
        {
          timeout: TIMEOUTS.BASE * 12,
          intervals: [TIMEOUTS.BASE, TIMEOUTS.BASE * 2, TIMEOUTS.BASE * 4],
        },
      )
      .toBe("open");
  }

  /** Open the three-dot ⋮ menu inside the task detail panel */
  async openTaskMoreActionsMenu() {
    const openMenuFromDetailPanel = async () => {
      const detailHeading = this.getTaskDetailHeading();
      if (!(await detailHeading.isVisible().catch(() => false))) {
        return false;
      }

      const detailHeader = detailHeading.locator("xpath=..");
      const detailPanelButtons = detailHeader.getByRole("button");
      const detailPanelButtonCount = await detailPanelButtons
        .count()
        .catch(() => 0);

      for (let i = Math.max(detailPanelButtonCount - 1, 0); i >= 0; i -= 1) {
        const panelButton = detailPanelButtons.nth(i);

        if (!(await panelButton.isVisible().catch(() => false))) {
          continue;
        }

        await panelButton.scrollIntoViewIfNeeded().catch(() => {});
        await panelButton.click({ force: true }).catch(() => {});

        const menuOpened = await this.waitForTaskActionsMenu()
          .then(() => true)
          .catch(() => false);

        if (menuOpened) {
          return true;
        }
      }

      return false;
    };

    if (await openMenuFromDetailPanel()) {
      return;
    }

    let targetRow = this.currentTaskTitle
      ? this.getTaskRowByTitle(this.currentTaskTitle).first()
      : null;
    let rowActionButton = targetRow
      ? targetRow.locator("td").last().getByRole("button").last()
      : null;

    if (
      !rowActionButton ||
      !(await rowActionButton.isVisible().catch(() => false))
    ) {
      if (this.currentTaskTitle) {
        await this.searchTask(this.currentTaskTitle);
      }

      targetRow = this.getNonEmptyTaskRows().first();
      rowActionButton = targetRow.locator("td").last().getByRole("button").last();
    }

    await rowActionButton.scrollIntoViewIfNeeded().catch(() => {});
    await rowActionButton.click().catch(async () => {
      await rowActionButton.click({ force: true });
    });
    await this.waitForTaskActionsMenu();
  }

  /** Open detail panel → click Edit from the three-dot menu */
  async clickEditTaskFromMenu() {
    await this.openTaskMoreActionsMenu();
    await this.getTaskActionMenuItem("Edit").click();
    await this.editTaskDrawerHeading.waitFor({
      state: "visible",
      timeout: TIMEOUTS.BASE * 12,
    });
  }

  /** Open detail panel → click Delete from the three-dot menu */
  async clickDeleteTaskFromMenu() {
    await this.openTaskMoreActionsMenu();
    await this.getTaskActionMenuItem("Delete").click();
    await this.deleteTaskDialog.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 10 });
  }

  /** Click "Delete" in the task confirmation dialog and wait for toast */
  async confirmDeleteTask() {
    await this.deleteTaskConfirmBtn.click();
    await this.waitForMutationFeedback(this.deleteTaskDialog);
  }

  /** Click "Cancel" in the task confirmation dialog */
  async cancelDeleteTask() {
    await this.deleteTaskDialog.getByRole("button", { name: "Cancel" }).click();
    await this.deleteTaskDialog.waitFor({ state: "hidden", timeout: TIMEOUTS.BASE * 10 });
  }

  /**
   * Toggle the task's complete checkbox in the tasks table row.
   * @param {string} taskTitle - used to locate the correct row
   */
  async toggleTaskComplete(taskTitle) {
    await this.searchTask(taskTitle);
    const wasChecked = await this.isTaskChecked(taskTitle);
    await this.setTaskComplete(taskTitle, !wasChecked);
  }

  /**
   * Set the task completion checkbox to the requested state.
   * @param {string} taskTitle - used to locate the correct row
   * @param {boolean} completed - desired checkbox state
   */
  async setTaskComplete(taskTitle, completed) {
    await this.searchTask(taskTitle);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const checkbox = this.getTaskCheckboxByTitle(taskTitle);
      await checkbox.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });

      if ((await checkbox.isChecked()) === completed) {
        return;
      }

      const updateResponse = this.waitForTaskUpdateResponse().catch(() => {});
      await checkbox.locator("..").click();
      await updateResponse;

      const settled = await expect
        .poll(() => this.isTaskChecked(taskTitle), {
          timeout: TIMEOUTS.BASE * 24,
          intervals: [
            TIMEOUTS.BASE,
            TIMEOUTS.BASE * 2,
            TIMEOUTS.BASE * 4,
          ],
        })
        .toBe(completed)
        .then(() => true)
        .catch(() => false);

      if (settled) {
        return;
      }
    }

    await expect(this.getTaskCheckboxByTitle(taskTitle)).toBeChecked({
      checked: completed,
      timeout: TIMEOUTS.BASE * 30,
    });
  }

  /**
   * Returns whether the checkbox for a given task is checked.
   * @param {string} taskTitle
   */
  async isTaskChecked(taskTitle) {
    const checkbox = this.getTaskCheckboxByTitle(taskTitle);
    await checkbox.waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 20 });
    return checkbox.isChecked();
  }

  /** Returns true if the tasks empty state heading is visible */
  async isTasksEmptyStateVisible() {
    return this.hasVisibleLocator(this.taskEmptyHeading);
  }

  /** Returns the count of non-empty task rows in the table */
  async getTaskRowCount() {
    return this.countVisibleLocators(this.getNonEmptyTaskRows());
  }

  /** Returns the pagination info text (e.g. "1–5 of 5") */
  async getTaskPaginationText() {
    return this.taskPagination.textContent();
  }

  /** Waits for the success toast to appear */
  async waitForSuccessToast() {
    await this.successToast
      .waitFor({ state: "visible", timeout: TIMEOUTS.BASE * 16 })
      .catch(() => {});
  }

  // ── Assertion Helpers ────────────────────────────────────────

  /** Assert note is visible in the notes panel by subject text */
  async assertNoteVisible(subject) {
    const { expect } = require("@playwright/test");
    await expect(this.getNoteBySubject(subject).first()).toBeVisible({
      timeout: TIMEOUTS.BASE * 20,
    });
  }

  /** Assert note is NOT visible in the notes panel */
  async assertNoteNotVisible(subject) {
    const { expect } = require("@playwright/test");
    await expect(this.getNoteBySubject(subject)).not.toBeVisible();
  }

  /** Assert task title cell is visible in the tasks table */
  async assertTaskVisible(taskTitle) {
    const { expect } = require("@playwright/test");
    await this.searchTask(taskTitle);
    await expect(this.getTaskRowByTitle(taskTitle).first()).toBeVisible({
      timeout: TIMEOUTS.BASE * 20,
    });
  }

  /** Assert task title cell is NOT visible in the tasks table */
  async assertTaskNotVisible(taskTitle) {
    const { expect } = require("@playwright/test");
    await this.searchTask(taskTitle);
    await expect
      .poll(() => this.getTaskRowCount(), { timeout: TIMEOUTS.BASE * 20 })
      .toBe(0);
  }

  /** Assert the Add Notes drawer is open */
  async assertAddNoteDrawerOpen() {
    const { expect } = require("@playwright/test");
    await expect(this.addNoteDrawerHeading).toBeVisible();
  }

  /** Assert the Edit Notes drawer is open */
  async assertEditNoteDrawerOpen() {
    const { expect } = require("@playwright/test");
    await expect(this.editNoteDrawerHeading).toBeVisible();
  }

  /** Assert the Create Task drawer is open */
  async assertCreateTaskDrawerOpen() {
    const { expect } = require("@playwright/test");
    await expect(this.createTaskDrawerHeading).toBeVisible();
  }

  /** Assert the Delete Note dialog is visible */
  async assertDeleteNoteDialogVisible() {
    const { expect } = require("@playwright/test");
    await expect(this.deleteNoteDialog).toBeVisible();
    await expect(this.deleteNoteText).toBeVisible();
    await expect(this.deleteNoteConfirmBtn).toBeVisible();
  }

  /** Assert the Delete Task dialog is visible */
  async assertDeleteTaskDialogVisible() {
    const { expect } = require("@playwright/test");
    await expect(this.deleteTaskDialog).toBeVisible();
    await expect(this.deleteTaskText).toBeVisible();
    await expect(this.deleteTaskConfirmBtn).toBeVisible();
  }
}

module.exports = { NotesTaskPage };
