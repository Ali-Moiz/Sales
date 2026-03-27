// ============================================================
// pages/marketVerticals.page.js
// Market Verticals Page Object Model
// Covers: List Page + Detail Page + Add/Edit Question Form
// ============================================================

const { expect } = require('@playwright/test');

class MarketVerticalsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ─── LIST PAGE LOCATORS ─────────────────────────────────────────────────
    // Why getByRole('searchbox'): stable role + accessible name; avoids CSS/XPath fragility
    this.industrySearchInput = page.getByRole('searchbox', { name: 'Search by Industry' });

    // Why getByRole('table'): semantic HTML element, stable across renders
    this.industriesTable = page.getByRole('table').first();

    // Why getByRole('columnheader'): accessible column headers on the list table
    this.colIndustries    = page.getByRole('columnheader', { name: 'Industries' });
    this.colNoOfDeals     = page.getByRole('columnheader', { name: 'No. of Deals' });
    this.colNoOfCompanies = page.getByRole('columnheader', { name: 'No. of Companies' });
    this.colSyncedFrom    = page.getByRole('columnheader', { name: 'Synced From' });
    this.colLastSyncedOn  = page.getByRole('columnheader', { name: 'Last Synced On' });

    // Why getByText for pagination: stable visible text unique to this control
    this.rowsPerPageDropdown = page.getByRole('combobox', { name: /Rows per page/ });
    this.paginationPrev      = page.getByRole('button', { name: 'Go to previous page' });
    this.paginationNext      = page.getByRole('button', { name: 'Go to next page' });
    this.headerTitle         = page.locator('header').getByText('Market Verticals', { exact: true });

    // ─── DETAIL PAGE LOCATORS (left sidebar) ────────────────────────────────
    // Why getByRole('searchbox') with exact name: two searchboxes exist on page; name differentiates
    this.sidebarSearchInput = page.getByRole('searchbox', { name: 'Search', exact: true });

    // ─── DETAIL PAGE LOCATORS (right panel) ─────────────────────────────────
    // Why getByRole('searchbox'): matches the accessible name on the question search
    this.questionSearchInput = page.getByRole('searchbox', { name: 'Search by Question' });

    // Why getByRole('button') with name: unambiguous stable text label
    this.addQuestionBtn = page.getByRole('button', { name: 'Add Question' });

    // Table in the right panel (second table on the detail page)
    this.questionsTable = page.getByRole('table').last();

    // ─── ADD / EDIT QUESTION FORM LOCATORS ──────────────────────────────────
    // Why getByRole('textbox') with accessible name: form label text = accessible name
    this.questionStatementInput = page.getByRole('textbox', { name: 'Question Statement *' });

    // Why getByRole('textbox') with accessible name: placeholder-based accessible name
    this.instructionsInput = page.getByRole('textbox', { name: 'Instructions (optional)' });

    // Why getByRole('button') for custom dropdowns: the dropdowns are styled <div> buttons
    // We use filter + hasText for robustness
    this.answerTypeDropdown      = page.getByRole('heading', { name: 'Multiple Selection' }).or(
                                   page.getByRole('heading', { name: 'DropDown' })).or(
                                   page.getByRole('heading', { name: 'Radio Buttons (Single Selection)' }));

    // Why getByRole('button') for Add option: stable visible text
    this.addOptionBtn = page.getByRole('button', { name: 'Add option' });

    // Why getByRole('checkbox') with name: accessible label text
    this.requiredCheckbox = page.getByRole('checkbox', { name: 'Required' });

    // Why getByRole('button') with name: Save and Cancel buttons use visible text
    this.saveBtn   = page.getByRole('button', { name: 'Save' }).first();
    this.cancelBtn = page.getByRole('button', { name: 'Cancel' }).first();
    this.backBtn   = page.getByRole('button', { name: 'Back' });

    // ─── QUESTION DETAIL PANEL LOCATORS ─────────────────────────────────────
    this.questionDetailPanel = page.getByRole('heading', { name: 'Question', level: 2 });
    this.editBtnInPanel      = page.getByRole('button', { name: 'Edit' });

    // ─── DELETE CONFIRMATION DIALOG LOCATORS ────────────────────────────────
    // Why getByRole('dialog'): semantic ARIA role for modal dialogs
    this.deleteDialog        = page.getByRole('dialog', { name: 'Delete Question' });
    this.deleteConfirmBtn    = page.getByRole('button', { name: 'Delete Question' });
    this.deleteCancelBtn     = page.getByRole('button', { name: 'Cancel' });

    // ─── VALIDATION MESSAGE LOCATORS ────────────────────────────────────────
    // Why getByText: validation messages are unique visible text strings
    this.validationQuestionRequired = page.getByText('Question statement is required.');
    this.validationMinOptions       = page.getByText('Question Option must have at least 2 items.');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NAVIGATION METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate directly to the Market Verticals list page.
   */
  async navigateToListPage() {
    await this.page.goto('/app/sales/marketVerticals', { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/\/app\/sales\/marketVerticals/, { timeout: 15_000 });
    await this.industrySearchInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.waitForSkeletonsToClear();
    await expect(this.industriesTable).toBeVisible();
  }

  async waitForSkeletonsToClear(timeout = 20_000) {
    await expect
      .poll(async () => this.page.locator('.MuiSkeleton-root').evaluateAll((nodes) => (
        nodes.filter((node) => {
          const element = node;
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getBoundingClientRect().height > 0;
        }).length
      )).catch(() => 0), { timeout })
      .toBe(0);
  }

  /**
   * Click a vertical by name in the list table to open its detail page.
   * @param {string} verticalName - e.g. 'Commercial'
   */
  async clickVerticalInList(verticalName) {
    // Why getByRole('cell') with name: cell text is the industry name
    await this.page.getByRole('cell', { name: verticalName }).click();
    await expect(this.page).toHaveURL(/\/marketVerticals\/\d+\/questions/, { timeout: 15_000 });
    await this.waitForSkeletonsToClear();
    await expect(this.addQuestionBtn).toBeVisible();
  }

  /**
   * Click a vertical in the left sidebar on the detail page.
   * @param {string} verticalName - e.g. 'Distribution'
   */
  async selectVerticalInSidebar(verticalName) {
    await this.page.getByText(verticalName, { exact: true }).first().click();
    await this.waitForSkeletonsToClear();
    await expect(this.addQuestionBtn).toBeVisible();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST PAGE METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Search by industry name on the list page.
   * @param {string} term
   */
  async searchIndustry(term) {
    await this.industrySearchInput.clear();
    await this.industrySearchInput.fill(term);
    await this.page.waitForTimeout(500);
    await this.waitForSkeletonsToClear(10_000);
  }

  /**
   * Get all visible industry names from the list table.
   * @returns {Promise<string[]>}
   */
  async getListedIndustryNames() {
    // Why 'cell' role with column scope: first column cells are industry names
    const rows = await this.page.getByRole('row').all();
    const names = [];
    for (const row of rows.slice(1)) { // skip header
      const firstCell = row.getByRole('cell').first();
      const text = await firstCell.textContent();
      if (text?.trim()) names.push(text.trim());
    }
    return names;
  }

  /**
   * Get pagination info text (e.g. "1–5 of 5").
   * @returns {Promise<string>}
   */
  async getPaginationText() {
    // Why getByText with regex: matches "1–5 of 5" pattern dynamically
    const paginationEl = this.page.locator('p').filter({ hasText: /\d+–\d+ of \d+/ });
    return (await paginationEl.textContent()) ?? '';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL PAGE — SIDEBAR METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Search verticals in the left sidebar.
   * @param {string} term
   */
  async searchSidebarVertical(term) {
    await this.sidebarSearchInput.clear();
    await this.sidebarSearchInput.fill(term);
    await this.page.waitForTimeout(500);
    await this.waitForSkeletonsToClear(10_000);
  }

  /**
   * Clear the sidebar search by clicking the X button.
   */
  async clearSidebarSearch() {
    // Why getByRole('button') inside the search input parent: the X is adjacent to the input
    const clearBtn = this.page.locator('[role="searchbox"][name="Search"] ~ button, input[placeholder="Search"] + button')
      .or(this.page.getByLabel('Clear').first());
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    } else {
      await this.sidebarSearchInput.clear();
    }
  }

  /**
   * Get all visible vertical names in the left sidebar.
   * @returns {Promise<string[]>}
   */
  async getSidebarVerticalNames() {
    const knownVerticals = ['Commercial', 'Distribution', 'Industrial', 'Manufacturing', 'Residential'];
    const names = [];

    for (const name of knownVerticals) {
      const visible = await this.page.getByText(name, { exact: true }).first().isVisible().catch(() => false);
      if (visible) names.push(name);
    }

    return names;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL PAGE — QUESTIONS TABLE METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Search questions in the right panel.
   * @param {string} term
   */
  async searchQuestions(term) {
    await this.questionSearchInput.clear();
    await this.questionSearchInput.fill(term);
    await this.questionSearchInput.press('Enter').catch(() => {});
    await this.page.waitForTimeout(500);
    await this.waitForSkeletonsToClear(10_000);
  }

  /**
   * Get all visible question statement texts from the questions table.
   * @returns {Promise<string[]>}
   */
  async getQuestionStatements() {
    // Why getByRole('cell') inside the questions table: stable semantic role
    const rows = await this.questionsTable.getByRole('row').all();
    const statements = [];
    for (const row of rows.slice(1)) {
      const cells = await row.getByRole('cell').all();
      if (cells.length > 1) {
        const text = await cells[1].textContent();
        if (text?.trim()) statements.push(text.trim());
      }
    }
    return statements;
  }

  /**
   * Get the question count shown in the heading area.
   * Returns the numeric portion from text like "sales.industryVerticals.noOfQuestions: 10"
   * @returns {Promise<number>}
   */
  async getQuestionCount() {
    const bodyText = await this.page.locator('body').textContent();
    const match = bodyText?.match(/noOfQuestions:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Open the 3-dot context menu on a question row by question text (partial match).
   * @param {string} questionText
   */
  async openQuestionMenu(questionText) {
    // Why getByRole('row') filtered by text: stable match on question text
    const row = this.page.getByRole('row', { name: new RegExp(questionText, 'i') });
    await row.getByRole('button').last().click();
  }

  /**
   * Click Edit from the 3-dot menu for a given question.
   * @param {string} questionText
   */
  async clickEditFromMenu(questionText) {
    await this.openQuestionMenu(questionText);
    // Why getByRole('heading') with name 'Edit': the dropdown items have headings
    await this.page.getByRole('heading', { name: 'Edit' }).click();
    await expect(this.questionStatementInput).toBeVisible();
  }

  /**
   * Click Delete from the 3-dot menu for a given question.
   * @param {string} questionText
   */
  async clickDeleteFromMenu(questionText) {
    await this.openQuestionMenu(questionText);
    await this.page.getByRole('heading', { name: 'Delete' }).click();
    await expect(this.deleteDialog).toBeVisible();
  }

  /**
   * Click on a question row to open the detail side panel.
   * @param {string} questionText - Partial or full question text
   */
  async openQuestionDetailPanel(questionText) {
    // Why getByRole('cell') with name regex: matches the question cell by visible text
    await this.page.getByRole('cell', { name: new RegExp(questionText, 'i') }).click();
    await expect(this.questionDetailPanel).toBeVisible();
  }

  /**
   * Close the question detail side panel using the X button.
   */
  async closeQuestionDetailPanel() {
    const closeButton = this.editBtnInPanel.locator('xpath=following-sibling::button[1]');
    await closeButton.click();
    await expect(this.questionDetailPanel).not.toBeVisible();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADD / EDIT QUESTION FORM METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Click the Add Question button to navigate to the create form.
   */
  async clickAddQuestion() {
    await this.addQuestionBtn.click();
    await expect(this.questionStatementInput).toBeVisible();
  }

  /**
   * Fill the question statement field.
   * @param {string} text
   */
  async fillQuestionStatement(text) {
    await this.questionStatementInput.clear();
    await this.questionStatementInput.fill(text);
  }

  /**
   * Fill the instructions field.
   * @param {string} text
   */
  async fillInstructions(text) {
    await this.instructionsInput.fill(text);
  }

  /**
   * Select an Answer Type from the dropdown.
   * @param {'Multiple Selection' | 'Radio Buttons (Single Selection)' | 'DropDown'} type
   */
  async selectAnswerType(type) {
    // Click the currently displayed answer type heading to open dropdown
    await this.page.getByRole('heading', { name: /Multiple Selection|DropDown|Radio Buttons/ }).click();
    const dropdown = this.page.locator('#simple-popper').last();
    await dropdown.getByText(type, { exact: true }).click();
  }

  /**
   * Select one or more market verticals from the multi-select dropdown.
   * @param {string[]} verticals - Array of vertical names to select
   */
  async selectMarketVerticals(verticals) {
    // Click the Market Verticals dropdown
    await this.page.getByRole('heading', { name: /Market Verticals/ }).click();
    for (const vertical of verticals) {
      await this.page.getByText(vertical, { exact: true }).first().click();
    }
    // Close dropdown by pressing Escape
    await this.page.keyboard.press('Escape');
  }

  /**
   * Add a single option row with label and points.
   * @param {string} label - Option label text
   * @param {number} points - Points value
   */
  async addOption(label, points) {
    await this.addOptionBtn.click();
    // Fill the last option label input
    const optionInputs = await this.page.getByRole('textbox', { name: 'Option Label' }).all();
    const lastInput = optionInputs[optionInputs.length - 1];
    await lastInput.fill(label);

    // Fill the last spinbutton (points)
    const spinButtons = await this.page.getByRole('spinbutton').all();
    const lastSpin = spinButtons[spinButtons.length - 1];
    await lastSpin.fill(String(points));
  }

  /**
   * Delete an option row by its index (0-based).
   * @param {number} index
   */
  async deleteOption(index) {
    // Why locator by img within each option row: delete icons are img-based buttons
    const deleteIcons = await this.page.locator('[cursor=pointer] img').all();
    if (deleteIcons[index]) await deleteIcons[index].click();
  }

  /**
   * Toggle the Required checkbox.
   */
  async toggleRequired() {
    await this.requiredCheckbox.click();
  }

  /**
   * Click Save on the question form.
   */
  async saveQuestion() {
    await this.saveBtn.click();
  }

  /**
   * Click Cancel on the question form.
   */
  async cancelForm() {
    await this.cancelBtn.click();
  }

  /**
   * Click Back on the question form.
   */
  async clickBack() {
    await this.backBtn.click();
  }

  /**
   * Create a full question with all required fields.
   * @param {Object} params
   * @param {string} params.statement - Question statement text
   * @param {string} [params.instructions] - Optional instructions
   * @param {'Multiple Selection'|'Radio Buttons (Single Selection)'|'DropDown'} params.answerType
   * @param {string[]} params.verticals - Market verticals to select
   * @param {{label: string, points: number}[]} params.options - Options list (min 2 for selection types)
   * @param {boolean} [params.required] - Whether to mark as required
   */
  async createQuestion({ statement, instructions, answerType, verticals, options, required = false }) {
    await this.fillQuestionStatement(statement);
    if (instructions) await this.fillInstructions(instructions);
    if (answerType) await this.selectAnswerType(answerType);
    if (verticals?.length) await this.selectMarketVerticals(verticals);
    if (options?.length) {
      for (const opt of options) {
        await this.addOption(opt.label, opt.points);
      }
    }
    if (required) await this.toggleRequired();
    await this.saveQuestion();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Confirm deletion in the dialog.
   */
  async confirmDelete() {
    await this.deleteConfirmBtn.click();
    await expect(this.deleteDialog).not.toBeVisible();
  }

  /**
   * Cancel deletion in the dialog.
   */
  async cancelDelete() {
    await this.deleteCancelBtn.click();
    await expect(this.deleteDialog).not.toBeVisible();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ASSERTION HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Assert that a vertical name appears as the detail page heading.
   * @param {string} verticalName
   */
  async assertVerticalHeading(verticalName) {
    await expect(this.page.getByRole('heading', { name: verticalName, level: 1 })).toBeVisible();
  }

  /**
   * Assert a question exists in the questions table.
   * @param {string} questionText
   */
  async assertQuestionExists(questionText) {
    await expect(
      this.page.getByRole('cell', { name: new RegExp(questionText, 'i') })
    ).toBeVisible();
  }

  /**
   * Assert a question does NOT exist in the questions table.
   * @param {string} questionText
   */
  async assertQuestionNotExists(questionText) {
    await expect(
      this.page.getByRole('cell', { name: new RegExp(questionText, 'i') })
    ).not.toBeVisible();
  }

  /**
   * Assert validation messages are shown on the form.
   */
  async assertValidationErrors() {
    await expect(this.validationQuestionRequired).toBeVisible();
    await expect(this.validationMinOptions).toBeVisible();
  }

  /**
   * Assert a specific industry row exists in the list table.
   * @param {string} industryName
   */
  async assertIndustryInList(industryName) {
    await expect(
      this.page.getByRole('cell', { name: industryName })
    ).toBeVisible();
  }

  /**
   * Assert the delete confirmation dialog is visible with correct text.
   */
  async assertDeleteDialogVisible() {
    await expect(this.deleteDialog).toBeVisible();
    await expect(
      this.page.getByText('Are you sure you want to delete this question? This action cannot be undone!')
    ).toBeVisible();
  }
}

module.exports = { MarketVerticalsPage };
