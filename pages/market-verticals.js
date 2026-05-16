// ============================================================
// pages/marketVerticals.page.js
// Market Verticals Page Object Model
// Covers: List Page + Detail Page + Add/Edit Question Form
// ============================================================

const { TIMEOUTS } = require('../utils/playwright-timeouts');
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
    await expect(this.page).toHaveURL(/\/app\/sales\/marketVerticals/, { timeout: TIMEOUTS.BASE * 30 });
    await this.industrySearchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 30 });
    await this.waitForSkeletonsToClear();
    await expect(this.industriesTable).toBeVisible();
  }

  async waitForSkeletonsToClear(timeout = TIMEOUTS.BASE * 40) {
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
    await expect(this.page).toHaveURL(/\/marketVerticals\/\d+\/questions/, { timeout: TIMEOUTS.BASE * 30 });
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
    await expect(this.industrySearchInput).toHaveValue(term, {
      timeout: TIMEOUTS.BASE * 4,
    });
    await this.waitForSkeletonsToClear(TIMEOUTS.BASE * 20);
    await this.waitForIndustrySearchResults(term);
  }

  async waitForIndustrySearchResults(term) {
    const normalizedTerm = term.trim().toLowerCase();

    await expect
      .poll(
        async () => {
          const names = await this.getListedIndustryNames();

          if (!normalizedTerm) {
            return names.length > 0 ? 'settled' : 'pending';
          }

          if (names.length === 0) {
            return 'settled';
          }

          return names.every((name) => name.toLowerCase().includes(normalizedTerm))
            ? 'settled'
            : 'pending';
        },
        {
          timeout: TIMEOUTS.BASE * 40,
          intervals: [TIMEOUTS.BASE, TIMEOUTS.BASE * 2, TIMEOUTS.BASE * 4],
        },
      )
      .toBe('settled');
  }

  /**
   * Get all visible industry names from the list table.
   * @returns {Promise<string[]>}
   */
  async getListedIndustryNames() {
    await this.industriesTable.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 30 });

    return this.industriesTable.evaluate((table) => {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows
        .filter((row) => {
          const style = window.getComputedStyle(row);
          return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            row.getBoundingClientRect().height > 0;
        })
        .map((row) => row.querySelector('td')?.textContent?.trim() ?? '')
        .filter(Boolean);
    });
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
    await this.waitForSkeletonsToClear(TIMEOUTS.BASE * 20);
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
    const responsePromise = this.waitForQuestionSearchResponse(term);

    await this.questionSearchInput.clear();
    await this.questionSearchInput.fill(term);
    await expect(this.questionSearchInput).toHaveValue(term, {
      timeout: TIMEOUTS.BASE * 4,
    });
    await responsePromise;
    await this.waitForSkeletonsToClear(TIMEOUTS.BASE * 20);
    await this.waitForQuestionSearchResults(term);
  }

  async waitForQuestionSearchResponse(term) {
    const expectedStatement = term.trim();

    await this.page.waitForResponse((response) => {
      if (response.status() !== 200) return false;

      try {
        const url = new URL(response.url());
        return url.pathname.includes('/industryVerticals/') &&
          url.pathname.includes('/questions') &&
          (url.searchParams.get('questionStatement') ?? '') === expectedStatement;
      } catch {
        return false;
      }
    }, { timeout: TIMEOUTS.BASE * 60 });
  }

  async waitForQuestionSearchResults(term) {
    const normalizedTerm = term.trim().toLowerCase();

    await expect
      .poll(
        async () => {
          const statements = await this.getQuestionStatements();

          if (!normalizedTerm) {
            return statements.length > 0 ? 'settled' : 'pending';
          }

          if (statements.length === 0) {
            return 'settled';
          }

          return statements.every((statement) => statement.toLowerCase().includes(normalizedTerm))
            ? 'settled'
            : 'pending';
        },
        {
          timeout: TIMEOUTS.BASE * 40,
          intervals: [TIMEOUTS.BASE, TIMEOUTS.BASE * 2, TIMEOUTS.BASE * 4],
        },
      )
      .toBe('settled');
  }

  /**
   * Get all visible question statement texts from the questions table.
   * @returns {Promise<string[]>}
   */
  async getQuestionStatements() {
    // Extract all question statements in a single evaluate() call to avoid
    // stale element handles when the table re-renders during iteration.
    await this.questionsTable.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 30 });
    return this.questionsTable.evaluate((table) => {
      const rows = Array.from(table.querySelectorAll('tbody tr, [role="row"]'));
      return rows
        .filter((row) => {
          const style = window.getComputedStyle(row);
          return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            row.getBoundingClientRect().height > 0 &&
            row.querySelector('td, [role="cell"]');
        })
        .map((row) => {
          const cells = row.querySelectorAll('td, [role="cell"]');
          return cells.length > 1 ? (cells[1].textContent ?? '').trim() : '';
        })
        .filter(Boolean);
    });
  }

  async waitForQuestionsTableData() {
    await expect
      .poll(async () => (await this.getQuestionStatements()).length, {
        timeout: TIMEOUTS.BASE * 40,
      })
      .toBeGreaterThan(0);
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

  // ══════════════════════════════════════════════════════════════════════════
  // ANSWER TYPE DROPDOWN METHODS (added for TC-MV-005)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Open the Answer Type dropdown and return all visible option texts.
   * Closes the dropdown after reading.
   * @returns {Promise<string[]>}
   */
  async getAnswerTypeOptions() {
    // Click the currently displayed answer type heading to open dropdown
    await this.page.getByRole('heading', { name: /Multiple Selection|DropDown|Radio Buttons/ }).click();
    const popper = this.page.locator('#simple-popper').last();
    await expect(popper).toBeVisible();
    const paragraphs = await popper.locator('p').all();
    const options = [];
    for (const p of paragraphs) {
      const text = await p.textContent();
      if (text?.trim()) options.push(text.trim());
    }
    // Close the dropdown
    await this.page.keyboard.press('Escape');
    return options;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MARKET VERTICALS DROPDOWN METHODS (added for TC-MV-006, TC-MV-007)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Open the Market Verticals dropdown and return all visible option texts.
   * Closes the dropdown after reading.
   * @returns {Promise<string[]>}
   */
  async getMarketVerticalOptions() {
    await this.page.getByRole('heading', { name: /Market Verticals/ }).click();
    const popper = this.page.locator('#simple-popper').last();
    await expect(popper).toBeVisible();
    const items = await popper.locator('p').all();
    const options = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text?.trim()) options.push(text.trim());
    }
    await this.page.keyboard.press('Escape');
    return options;
  }

  /**
   * Open the Market Verticals dropdown, type a search term, and return filtered option texts.
   * Does NOT close the dropdown — caller decides next action.
   * @param {string} term
   * @returns {Promise<string[]>}
   */
  async searchMarketVerticalInDropdown(term) {
    await this.page.getByRole('heading', { name: /Market Verticals/ }).click();
    const popper = this.page.locator('#simple-popper').last();
    await expect(popper).toBeVisible();
    const searchInput = popper.getByRole('textbox', { name: 'Search' });
    await searchInput.fill(term);
    // Read filtered options (paragraphs inside popper, excluding the search input area)
    const items = await popper.locator('p').all();
    const options = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text?.trim()) options.push(text.trim());
    }
    return options;
  }

  /**
   * Select a market vertical option from an already-open dropdown by text.
   * @param {string} verticalName
   */
  async selectMarketVerticalFromOpenDropdown(verticalName) {
    const popper = this.page.locator('#simple-popper').last();
    await popper.getByText(verticalName, { exact: true }).click();
  }

  /**
   * Close the Market Verticals dropdown if open.
   */
  async closeMarketVerticalDropdown() {
    await this.page.keyboard.press('Escape');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OPTION ROW HELPERS (added for TC-MV-009)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the current count of option label input rows on the form.
   * @returns {Promise<number>}
   */
  async getOptionRowCount() {
    const optionInputs = await this.page.getByRole('textbox', { name: 'Option Label' }).all();
    return optionInputs.length;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUESTION ROW DETAIL HELPERS (added for TC-MV-014, TC-MV-015)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get details (Last Edited By, Last Edited On, Answer Type) from a question row.
   * @param {string} questionText - Partial or full question text
   * @returns {Promise<{editedBy: string, editedOn: string, answerType: string}>}
   */
  async getQuestionRowDetails(questionText) {
    const row = this.page.getByRole('row', { name: new RegExp(questionText, 'i') });
    const cells = await row.getByRole('cell').all();
    // Columns: [drag-handle, Question Statement, Last Edited By, Last Edited On, Answer Type, 3-dot menu]
    const editedBy = (await cells[2]?.textContent())?.trim() ?? '';
    const editedOn = (await cells[3]?.textContent())?.trim() ?? '';
    const answerType = (await cells[4]?.textContent())?.trim() ?? '';
    return { editedBy, editedOn, answerType };
  }

  /**
   * Assert the form is on the create/edit page (Question Statement input visible).
   */
  async assertFormOpened() {
    await expect(this.questionStatementInput).toBeVisible();
  }

  /**
   * Assert we are back on the questions detail page (Add Question button visible).
   */
  async assertQuestionsPageOpened() {
    await expect(this.addQuestionBtn).toBeVisible();
  }

  /**
   * Get the selected market vertical chips/tags shown on the form.
   * On the edit form, selected verticals appear as heading text inside the dropdown trigger.
   * @returns {Promise<string>}
   */
  async getSelectedMarketVerticalsText() {
    const heading = this.page.getByRole('heading', { name: /Market Verticals/ });
    return (await heading.textContent())?.trim() ?? '';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST PAGE — ROW DATA HELPERS (added for TC-MV-016 through TC-MV-023)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get cell data for a specific industry row on the list page.
   * @param {string} industryName - e.g. 'Commercial'
   * @returns {Promise<{deals: string, companies: string, syncedFrom: string, lastSyncedOn: string}>}
   */
  async getIndustryRowData(industryName) {
    const row = this.page.getByRole('row', { name: new RegExp(industryName, 'i') });
    const cells = await row.getByRole('cell').all();
    // Columns: Industries | No. of Deals | No. of Companies | Synced From | Last Synced On
    return {
      deals: (await cells[1]?.textContent())?.trim() ?? '',
      companies: (await cells[2]?.textContent())?.trim() ?? '',
      syncedFrom: (await cells[3]?.textContent())?.trim() ?? '',
      lastSyncedOn: (await cells[4]?.textContent())?.trim() ?? '',
    };
  }

  /**
   * Get row data for ALL visible industry rows on the list page.
   * @returns {Promise<Array<{name: string, deals: string, companies: string, syncedFrom: string, lastSyncedOn: string}>>}
   */
  async getAllIndustryRowData() {
    const rows = await this.industriesTable.getByRole('row').all();
    const data = [];
    for (const row of rows.slice(1)) { // skip header row
      const cells = await row.getByRole('cell').all();
      if (cells.length >= 5) {
        data.push({
          name: (await cells[0]?.textContent())?.trim() ?? '',
          deals: (await cells[1]?.textContent())?.trim() ?? '',
          companies: (await cells[2]?.textContent())?.trim() ?? '',
          syncedFrom: (await cells[3]?.textContent())?.trim() ?? '',
          lastSyncedOn: (await cells[4]?.textContent())?.trim() ?? '',
        });
      }
    }
    return data;
  }

  /**
   * Clear the list page "Search by Industry" input.
   */
  async clearIndustrySearch() {
    await this.industrySearchInput.clear();
    await expect(this.industrySearchInput).toHaveValue('', {
      timeout: TIMEOUTS.BASE * 4,
    });
    await this.waitForSkeletonsToClear(TIMEOUTS.BASE * 20);
    await this.waitForIndustrySearchResults('');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL PAGE — SIDEBAR DATA HELPERS (added for TC-MV-024 through TC-MV-029)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get all sidebar industry buttons with their company counts.
   * Reads from the list element containing buttons like "Commercial No. of Companies: 2597".
   * @returns {Promise<Array<{name: string, companyCount: string}>>}
   */
  async getSidebarIndustryButtons() {
    // Wait for at least one sidebar button to render
    await this.page.getByRole('button', { name: /No\. of Companies/i }).first().waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 30 });
    // Use evaluate() to read all button data atomically, avoiding stale handles
    const sidebarList = this.page.locator('ul, ol, [role="list"]').filter({
      has: this.page.getByRole('button', { name: /No\. of Companies/i }),
    }).first();
    return sidebarList.evaluate((list) => {
      const buttons = Array.from(list.querySelectorAll('button, [role="button"]'));
      return buttons
        .filter((btn) => /No\. of Companies/i.test(btn.textContent))
        .map((btn) => {
          const heading = btn.querySelector('h1, h2, h3, h4, h5, h6');
          const name = heading ? heading.textContent.trim() : btn.textContent.replace(/No\. of Companies:\s*\d+/gi, '').trim();
          const countMatch = btn.textContent.match(/No\. of Companies:\s*(\d+)/i);
          return {
            name,
            companyCount: countMatch ? countMatch[1] : '0',
          };
        });
    });
  }

  /**
   * Get the currently active/selected industry name from the sidebar.
   * The active button typically has a distinct visual style (aria-selected, class, etc.).
   * Falls back to reading the h1 heading on the right panel.
   * @returns {Promise<string>}
   */
  async getActiveSidebarIndustry() {
    // The most reliable indicator is the h1 heading on the right panel
    const heading = this.page.getByRole('heading', { level: 1 });
    return (await heading.textContent())?.trim() ?? '';
  }

  /**
   * Get visible sidebar industry names (reads directly from button headings).
   * More reliable than the text-matching approach in getSidebarVerticalNames().
   * @returns {Promise<string[]>}
   */
  async getVisibleSidebarIndustryNames() {
    // Wait for at least one sidebar button to render
    await this.page.getByRole('button', { name: /No\. of Companies/i }).first().waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 30 });
    // Use evaluate() to read all names atomically, avoiding stale handles
    // when the sidebar re-renders during iteration.
    const sidebarList = this.page.locator('ul, ol, [role="list"]').filter({
      has: this.page.getByRole('button', { name: /No\. of Companies/i }),
    }).first();
    return sidebarList.evaluate((list) => {
      const buttons = Array.from(list.querySelectorAll('button, [role="button"]'));
      return buttons
        .map((btn) => {
          const heading = btn.querySelector('h1, h2, h3, h4, h5, h6');
          if (heading) return heading.textContent.trim();
          // Fallback: strip "No. of Companies: NNN" from full text
          return btn.textContent.replace(/No\. of Companies:\s*\d+/gi, '').trim();
        })
        .filter(Boolean);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUESTIONS TABLE COLUMN HELPERS (added for TC-MV-030)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get all visible column header texts from the questions table.
   * Returns an array of header texts (empty string for unnamed headers like drag-handle and actions).
   * @returns {Promise<string[]>}
   */
  async getQuestionTableColumnHeaders() {
    const headers = await this.questionsTable.getByRole('columnheader').all();
    const texts = [];
    for (const header of headers) {
      const text = (await header.textContent())?.trim() ?? '';
      texts.push(text);
    }
    return texts;
  }

  /**
   * Scroll the questions table to the bottom and measure whether the first
   * data column remains horizontally aligned with its header.
   */
  async getQuestionsTableLastRowAlignmentDelta() {
    await this.waitForQuestionsTableData();

    return this.questionsTable.evaluate((table) => {
      let scrollable = table.parentElement;
      while (scrollable && scrollable.scrollHeight <= scrollable.clientHeight) {
        scrollable = scrollable.parentElement;
      }

      if (scrollable) {
        scrollable.scrollTop = scrollable.scrollHeight;
      }

      const headerCells = Array.from(table.querySelectorAll('thead th, [role="columnheader"]'));
      const rows = Array.from(table.querySelectorAll('tbody tr, [role="row"]'))
        .filter((row) => row.querySelector('td, [role="cell"]'));
      const lastRow = rows.at(-1);
      const lastCells = lastRow ? Array.from(lastRow.querySelectorAll('td, [role="cell"]')) : [];
      const headerCell = headerCells[1];
      const lastCell = lastCells[1];
      const headerBox = headerCell?.getBoundingClientRect();
      const cellBox = lastCell?.getBoundingClientRect();

      return {
        cellX: cellBox ? cellBox.x : null,
        delta: headerBox && cellBox ? Math.abs(headerBox.x - cellBox.x) : null,
        headerX: headerBox ? headerBox.x : null,
        rowCount: rows.length,
      };
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUESTION DETAIL PANEL HELPERS (added for TC-MV-038 through TC-MV-041)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Close the question detail panel using the X button (non-xpath version).
   * Finds the close button as the sibling button after the Edit button in the panel header.
   */
  async closeQuestionDetailPanelV2() {
    // Structure: grandparent div > [div with h2] + [div with Edit btn + Close btn]
    // Go up two levels from the h2 to reach the container holding both divs
    const headerGrandparent = this.questionDetailPanel.locator('../..');
    const closeBtn = headerGrandparent.getByRole('button').filter({ hasNotText: 'Edit' }).first();
    await closeBtn.click();
    await expect(this.questionDetailPanel).not.toBeVisible();
  }

  /**
   * Get the Associated Industries chips from the open detail panel.
   * @returns {Promise<string[]>}
   */
  async getDetailPanelIndustryChips() {
    const drawer = this.page.locator('.MuiDrawer-root');
    await expect(drawer).toBeVisible();
    // Wait for the Associated Industries section to fully render with chips
    // Poll until the drawer contains at least one industry chip after the h3
    await expect.poll(async () => {
      return drawer.evaluate((el) => {
        const h3s = Array.from(el.querySelectorAll('h3'));
        const assocH3 = h3s.find((h) => h.textContent.includes('Associated Industries'));
        if (!assocH3) return 0;
        const container = assocH3.nextElementSibling;
        if (!container || container.tagName === 'HR') return 0;
        return container.children.length;
      });
    }, { timeout: TIMEOUTS.BASE * 20 }).toBeGreaterThan(0);
    // Now read the chip names
    const names = await drawer.evaluate((el) => {
      const h3s = Array.from(el.querySelectorAll('h3'));
      const assocH3 = h3s.find((h) => h.textContent.includes('Associated Industries'));
      if (!assocH3) return [];
      const container = assocH3.nextElementSibling;
      if (!container || container.tagName === 'HR') return [];
      return Array.from(container.children).map((c) => c.textContent.trim()).filter(Boolean);
    });
    return names;
  }

  /**
   * Get all option rows from the open detail panel.
   * Each option has a label (paragraph) and points (paragraph like "N Points").
   * @returns {Promise<Array<{label: string, points: string}>>}
   */
  async getDetailPanelOptions() {
    // Options are inside the MUI drawer panel
    // Each option row: parent div > [div with checkbox + p label] + [p "N Points"]
    const drawer = this.page.locator('.MuiDrawer-root');
    await expect(drawer).toBeVisible();
    // Wait for at least one option to render (async load)
    await expect.poll(async () => {
      return drawer.evaluate((el) => {
        return Array.from(el.querySelectorAll('p')).filter((p) => /\d+ Points?/.test(p.textContent)).length;
      });
    }, { timeout: TIMEOUTS.BASE * 20 }).toBeGreaterThan(0);
    // Now read the options
    const options = await drawer.evaluate((el) => {
      const result = [];
      const pointsPs = Array.from(el.querySelectorAll('p')).filter((p) => /\d+ Points?/.test(p.textContent));
      for (const pp of pointsPs) {
        const parent = pp.parentElement;
        const sibDiv = parent ? parent.querySelector('div') : null;
        const labelP = sibDiv ? sibDiv.querySelector('p') : null;
        if (labelP) {
          result.push({
            label: labelP.textContent.trim(),
            points: pp.textContent.trim(),
          });
        }
      }
      return result;
    });
    return options;
  }

  /**
   * Get the "No. of Questions" count from the detail page heading area.
   * Reads from the text "No. of Questions: N" next to the h1.
   * @returns {Promise<number>}
   */
  async getNoOfQuestionsCount() {
    const headingContainer = this.page.getByRole('heading', { level: 1 }).locator('..');
    const fullText = (await headingContainer.textContent()) ?? '';
    const match = fullText.match(/No\.\s*of\s*Questions:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : -1;
  }

  async waitForNoOfQuestionsCount(expectedCount) {
    await expect
      .poll(async () => this.getNoOfQuestionsCount(), {
        timeout: TIMEOUTS.BASE * 40,
      })
      .toBe(expectedCount);
  }
}

module.exports = { MarketVerticalsPage };
