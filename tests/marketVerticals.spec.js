// ============================================================
// tests/marketVerticals.spec.js
// Market Verticals — Smoke Test Suite
// Framework: Playwright (JavaScript) + Page Object Model
// ============================================================

const { test, expect } = require('@playwright/test');
const { MarketVerticalsPage } = require('../pages/marketVerticals.page');
const { existsSync, mkdirSync } = require('node:fs');
const { performLogin } = require('../utils/auth/login-action');

// ─── Dynamic Test Data ──────────────────────────────────────────────────────
// Using timestamps to ensure unique question names across runs
const timestamp = Date.now();
const TEST_QUESTION = `Smoke Test Question ${timestamp}`;
const TEST_QUESTION_EDIT = `Edited Smoke Test Question ${timestamp}`;
const authFile = 'playwright/.auth/user.json';

async function ensureAuthState(browser) {
  if (existsSync(authFile)) return;
  mkdirSync('playwright/.auth', { recursive: true });
  const authContext = await browser.newContext();
  const authPage = await authContext.newPage();
  await performLogin(authPage);
  await authContext.storageState({ path: authFile });
  await authContext.close();
}

// ─── Fixture Setup ──────────────────────────────────────────────────────────
test.describe('Market Verticals Module — Smoke Tests', () => {
  let context;
  let page;
  let mvPage;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    await ensureAuthState(browser);
    context = await browser.newContext({ storageState: authFile });
    page = await context.newPage();
    mvPage = new MarketVerticalsPage(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LIST PAGE TESTS
  // ══════════════════════════════════════════════════════════════════════════

  test.describe('List Page', () => {

    test('TC-MV-001 | Navigate to Market Verticals from sidebar', async () => {
      await mvPage.navigateToListPage();
      await expect(page).toHaveURL(/\/app\/sales\/marketVerticals/);
      await expect(mvPage.headerTitle).toBeVisible();
      await expect(mvPage.industrySearchInput).toBeVisible();
      await expect(mvPage.industriesTable).toBeVisible();
    });

    test('TC-MV-002 | Verify all table columns on list page', async () => {
      await mvPage.navigateToListPage();
      await expect(mvPage.colIndustries).toBeVisible();
      await expect(mvPage.colNoOfDeals).toBeVisible();
      await expect(mvPage.colNoOfCompanies).toBeVisible();
      await expect(mvPage.colSyncedFrom).toBeVisible();
      await expect(mvPage.colLastSyncedOn).toBeVisible();
    });

    test('TC-MV-003 | Verify all 5 industry verticals are listed', async () => {
      await mvPage.navigateToListPage();
      const expectedVerticals = ['Commercial', 'Distribution', 'Industrial', 'Manufacturing', 'Residential'];
      for (const name of expectedVerticals) {
        await mvPage.assertIndustryInList(name);
      }
      // Pagination shows 5 of 5
      const paginationText = await mvPage.getPaginationText();
      expect(paginationText).toContain('5');
    });

    test('TC-MV-004 | Search by industry name filters the list', async () => {
      await mvPage.navigateToListPage();
      await mvPage.searchIndustry('Commercial');
      await mvPage.assertIndustryInList('Commercial');
      // Other verticals should be hidden
      await expect(mvPage.page.getByRole('cell', { name: 'Distribution' })).toBeHidden();
      await expect(mvPage.page.getByRole('cell', { name: 'Industrial' })).toBeHidden();
    });

    test('TC-MV-005 | Search with no match shows empty table', async () => {
      await mvPage.navigateToListPage();
      await mvPage.searchIndustry('XYZABC_NOMATCH');
      for (const name of ['Commercial', 'Distribution', 'Industrial', 'Manufacturing', 'Residential']) {
        await expect(mvPage.page.getByRole('cell', { name, exact: true })).toBeHidden();
      }
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL PAGE TESTS
  // ══════════════════════════════════════════════════════════════════════════

  test.describe('Detail Page — Vertical Navigation', () => {

    test('TC-MV-006 | Clicking vertical row opens detail page', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await expect(mvPage.page).toHaveURL(/\/marketVerticals\/\d+\/questions/);
      await mvPage.assertVerticalHeading('Commercial');
      await expect(mvPage.addQuestionBtn).toBeVisible();
    });

    test('TC-MV-007 | Left sidebar shows all 5 verticals with company counts', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await expect(page.getByText('Commercial', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Distribution', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Industrial', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Manufacturing', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Residential', { exact: true }).first()).toBeVisible();
      await expect(mvPage.page.getByText('No. of Companies: 2595')).toBeVisible();
      await expect(mvPage.page.getByText('No. of Companies: 83')).toBeVisible();
    });

    test('TC-MV-008 | Switching verticals via sidebar updates the right panel', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.assertVerticalHeading('Commercial');

      // Switch to Distribution
      await mvPage.selectVerticalInSidebar('Distribution');
      await mvPage.assertVerticalHeading('Distribution');
      await expect(mvPage.page).toHaveURL(/\/marketVerticals\/\d+\/questions/);
    });

  });

  test.describe('Detail Page — Sidebar Search', () => {

    test('TC-MV-009 | Left sidebar search filters verticals', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');

      await mvPage.searchSidebarVertical('Comm');

      await expect(page.getByText('Commercial', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Distribution', { exact: true }).first()).toBeHidden();
      await expect(page.getByText('Industrial', { exact: true }).first()).toBeHidden();
    });

    test('TC-MV-010 | Clearing sidebar search restores all verticals', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.searchSidebarVertical('Comm');

      await mvPage.sidebarSearchInput.clear();
      await page.waitForTimeout(500);
      await mvPage.waitForSkeletonsToClear(10_000);

      await expect(page.getByText('Commercial', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Distribution', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Industrial', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Manufacturing', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Residential', { exact: true }).first()).toBeVisible();
    });

  });

  test.describe('Detail Page — Question Search', () => {

    test('TC-MV-011 | Search by question filters results in the right panel', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');

      await mvPage.searchQuestions('budget');
      await expect
        .poll(async () => await mvPage.getQuestionStatements(), { timeout: 15_000 })
        .toHaveLength(1);
      const [statement] = await mvPage.getQuestionStatements();
      expect(statement.toLowerCase()).toContain('budget');
    });

    test('TC-MV-012 | Clearing question search restores all questions', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');

      await mvPage.searchQuestions('budget');
      await expect
        .poll(async () => (await mvPage.getQuestionStatements()).length, { timeout: 15_000 })
        .toBe(1);

      // Clear the search
      await mvPage.questionSearchInput.clear();
      await mvPage.questionSearchInput.press('Enter').catch(() => {});
      await page.waitForTimeout(500);
      await expect
        .poll(async () => (await mvPage.getQuestionStatements()).length, { timeout: 15_000 })
        .toBeGreaterThan(1);
    });

  });

  test.describe('Detail Page — Question Detail Panel', () => {

    test('TC-MV-013 | Clicking a question opens the detail side panel', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.openQuestionDetailPanel('What security services are you currently using');

      await expect(mvPage.questionDetailPanel).toBeVisible();
      await expect(mvPage.editBtnInPanel).toBeVisible();
      // Associated Industries section should show tags
      await expect(mvPage.page.getByText('Associated Industries')).toBeVisible();
      await expect(mvPage.page.getByText('Commercial', { exact: true }).first()).toBeVisible();
    });

    test('TC-MV-014 | Close button dismisses the detail panel', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.openQuestionDetailPanel('What security services are you currently using');

      await mvPage.closeQuestionDetailPanel();
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADD QUESTION FORM TESTS
  // ══════════════════════════════════════════════════════════════════════════

  test.describe('Add Question Form', () => {

    test('TC-MV-015 | Add Question button navigates to create form', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();

      await expect(page).toHaveURL(/questionBank\/create/);
      await expect(mvPage.questionStatementInput).toBeVisible();
      await expect(mvPage.instructionsInput).toBeVisible();
      await expect(mvPage.addOptionBtn).toBeVisible();
      await expect(mvPage.requiredCheckbox).toBeVisible();
      await expect(mvPage.saveBtn).toBeVisible();
      await expect(mvPage.cancelBtn).toBeVisible();
      await expect(mvPage.backBtn).toBeVisible();
    });

    test('TC-MV-016 | Saving empty form shows validation errors', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();
      await mvPage.saveQuestion();

      await mvPage.assertValidationErrors();
    });

    test('TC-MV-017 | Answer Type dropdown shows all 3 options', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();

      // Open the Answer Type dropdown
      await page.getByRole('heading', { name: 'Multiple Selection' }).click();
      const dropdown = page.locator('#simple-popper').last();

      await expect(dropdown.getByText('Multiple Selection', { exact: true })).toBeVisible();
      await expect(dropdown.getByText('Radio Buttons (Single Selection)', { exact: true })).toBeVisible();
      await expect(dropdown.getByText('DropDown', { exact: true })).toBeVisible();
    });

    test('TC-MV-018 | Market Verticals dropdown shows all 5 options with search', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();

      // Open Market Verticals dropdown
      await page.getByRole('heading', { name: /Market Verticals/ }).click();
      const dropdown = page.locator('#simple-popper').last();

      await expect(dropdown.getByText('Manufacturing', { exact: true })).toBeVisible();
      await expect(dropdown.getByText('Industrial', { exact: true })).toBeVisible();
      await expect(dropdown.getByText('Distribution', { exact: true })).toBeVisible();
      await expect(dropdown.getByText('Residential', { exact: true })).toBeVisible();
      await expect(dropdown.getByText('Commercial', { exact: true })).toBeVisible();
      // Dropdown has a search input
      await expect(dropdown.getByRole('textbox', { name: 'Search' })).toBeVisible();

      await page.keyboard.press('Escape');
    });

    test('TC-MV-019 | Add option button creates a new option row', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();

      await mvPage.addOptionBtn.click();
      // Option row should appear with label input, points spinbutton, delete icon
      await expect(page.getByRole('textbox', { name: 'Option Label' }).first()).toBeVisible();
      await expect(page.getByRole('spinbutton').first()).toBeVisible();
    });

    test('TC-MV-020 | Successfully create a new question (Multiple Selection)', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');

      await mvPage.clickAddQuestion();

      await mvPage.createQuestion({
        statement: TEST_QUESTION,
        instructions: 'Automation test instructions',
        answerType: 'Multiple Selection',
        verticals: ['Commercial'],
        options: [
          { label: 'Option Alpha', points: 5 },
          { label: 'Option Beta',  points: 10 },
        ],
        required: true,
      });

      // Should navigate back to the questions list
      await expect(page).toHaveURL(/\/questions$/);
      await mvPage.assertQuestionExists(TEST_QUESTION);
    });

    test('TC-MV-021 | Cancel button discards form and navigates back', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();

      await mvPage.fillQuestionStatement('Cancel Test Question - Should Not Persist');
      await mvPage.cancelForm();

      await expect(page).toHaveURL(/\/questions$/);
      await mvPage.assertQuestionNotExists('Cancel Test Question - Should Not Persist');
    });

    test('TC-MV-022 | Back button navigates to questions list without saving', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickAddQuestion();

      await mvPage.fillQuestionStatement('Back Button Test Question - Should Not Persist');
      await mvPage.clickBack();

      await expect(page).toHaveURL(/\/questions$/);
      await mvPage.assertQuestionNotExists('Back Button Test Question - Should Not Persist');
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // EDIT QUESTION TESTS
  // ══════════════════════════════════════════════════════════════════════════

  test.describe('Edit Question', () => {

    test('TC-MV-023 | Edit via 3-dot menu opens pre-populated edit form', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickEditFromMenu('What security services are you currently using');

      await expect(page).toHaveURL(/questionBank\/edit\/\d+/);
      await expect(mvPage.questionStatementInput).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Multiple Selection' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Market Verticals' })).toBeVisible();
    });

    test('TC-MV-024 | Edit via question detail panel opens pre-populated form', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.openQuestionDetailPanel('What security services are you currently using');
      await mvPage.editBtnInPanel.click();

      await expect(page).toHaveURL(/questionBank\/edit\/\d+/);
      await expect(mvPage.questionStatementInput).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Multiple Selection' })).toBeVisible();
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE QUESTION TESTS
  // ══════════════════════════════════════════════════════════════════════════

  test.describe('Delete Question', () => {

    test('TC-MV-025 | Delete via 3-dot menu shows confirmation dialog', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickDeleteFromMenu('What security services are you currently using');

      await mvPage.assertDeleteDialogVisible();
    });

    test('TC-MV-026 | Cancel delete dismisses dialog without deleting', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      await mvPage.clickDeleteFromMenu('What security services are you currently using');
      await mvPage.cancelDelete();

      // Question should still exist
      await mvPage.assertQuestionExists('What security services are you currently using');
    });

    test('TC-MV-027 | Confirm delete removes the question from the list', async () => {
      // First create a question to delete so we don't affect existing data
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');

      const deleteTarget = `Delete Target ${timestamp}`;
      await mvPage.clickAddQuestion();
      await mvPage.createQuestion({
        statement: deleteTarget,
        answerType: 'Multiple Selection',
        verticals: ['Commercial'],
        options: [
          { label: 'Yes', points: 5 },
          { label: 'No',  points: 0 },
        ],
      });

      await expect(page).toHaveURL(/\/questions$/);
      await mvPage.assertQuestionExists(deleteTarget);

      await mvPage.clickDeleteFromMenu(deleteTarget);
      await mvPage.confirmDelete();

      await mvPage.assertQuestionNotExists(deleteTarget);
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL UI VALIDATION TESTS
  // ══════════════════════════════════════════════════════════════════════════

  test.describe('Additional UI Validations', () => {

    test('TC-MV-028 | Rows per page dropdown and pagination visible on list page', async () => {
      await mvPage.navigateToListPage();
      await expect(mvPage.rowsPerPageDropdown).toBeVisible();
      const paginationText = await mvPage.getPaginationText();
      expect(paginationText).toMatch(/1–5 of 5/);
      // Both pagination buttons are disabled since all records fit on one page
      await expect(mvPage.paginationPrev).toBeDisabled();
      await expect(mvPage.paginationNext).toBeDisabled();
    });

    test('TC-MV-029 | Drag handles are visible on all question rows', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');
      const rows = await mvPage.questionsTable.getByRole('row').all();
      // Each data row (skip header) should have a drag handle button
      for (const row of rows.slice(1)) {
        const dragBtn = row.getByRole('button').first();
        await expect(dragBtn).toBeVisible();
      }
    });

    test('TC-MV-030 | Questions table has all expected column headers', async () => {
      await mvPage.navigateToListPage();
      await mvPage.clickVerticalInList('Commercial');

      await expect(mvPage.page.getByRole('columnheader', { name: 'Question Statement' })).toBeVisible();
      await expect(mvPage.page.getByRole('columnheader', { name: 'Last Edited By' })).toBeVisible();
      await expect(mvPage.page.getByRole('columnheader', { name: 'Last Edited On' })).toBeVisible();
      await expect(mvPage.page.getByRole('columnheader', { name: 'Answer Type' })).toBeVisible();
    });

  });

});
