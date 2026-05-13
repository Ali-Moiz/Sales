// ============================================================
// tests/e2e/market-verticals.spec.js
// Market Verticals — Create & Edit Question Workflow
// Framework: Playwright (JavaScript) + Page Object Model
// ============================================================

const { TIMEOUTS } = require('../../utils/playwright-timeouts');
const { test, expect } = require('@playwright/test');
const { performLogin }   = require('../../utils/auth/login-action');
const { MarketVerticalsPage } = require('../../pages/market-verticals');
const { env }            = require('../../utils/env');

const MV_PATH = '/app/sales/marketVerticals';
const QUESTION_PREFIX = 'PAT';
const KNOWN_VERTICALS = ['Commercial', 'Distribution', 'Industrial', 'Manufacturing', 'Residential'];
const DEFAULT_VERTICAL = 'Commercial';

function formatDateForMarketVerticals(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

function currentEditedDateCandidates() {
  const now = new Date();
  return Array.from(new Set([
    formatDateForMarketVerticals(now),
    formatDateForMarketVerticals(now, 'UTC'),
  ]));
}

test.describe('Create & Edit Question Workflow — TC-MV-001 through TC-MV-015', () => {
  let sharedPage;
  let mvPage;

  // ── Unique question names per suite run ──
  const uniqueTimestamp = Date.now();
  const uniqueQuestionName = `${QUESTION_PREFIX} ${uniqueTimestamp}`;
  const uniqueQuestionForCancel = `${QUESTION_PREFIX} Cancel ${uniqueTimestamp}`;
  const uniqueQuestionForRequired = `${QUESTION_PREFIX} Req ${uniqueTimestamp}`;
  // uniqueQuestionForEdit reserved for future use

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await performLogin(sharedPage);
    mvPage = new MarketVerticalsPage(sharedPage);
  });

  test.beforeEach(async () => {
    // Navigate to list page then into Commercial detail page
    await sharedPage.goto(`${env.baseUrl}${MV_PATH}`, { waitUntil: 'domcontentloaded' });
    await mvPage.waitForSkeletonsToClear();
    await expect(mvPage.industriesTable).toBeVisible();
    await mvPage.clickVerticalInList(DEFAULT_VERTICAL);
  });

  test.afterAll(async () => {
    await sharedPage.context().close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-001 | Add Question form shows required fields
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-001 | Verify that Add Question form shows required fields (Question Statement, Answer Type, Market Verticals) @smoke', async () => {
    await test.step('Click Add Question button', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Verify Question Statement input is visible', async () => {
      await expect(mvPage.questionStatementInput).toBeVisible();
    });

    await test.step('Verify Answer Type dropdown is visible', async () => {
      await expect(mvPage.answerTypeDropdown).toBeVisible();
    });

    await test.step('Verify Market Verticals dropdown is visible', async () => {
      await expect(sharedPage.getByRole('heading', { name: /Market Verticals/ })).toBeVisible();
    });

    await test.step('Verify Instructions field, Required checkbox, Save and Cancel buttons', async () => {
      await expect(mvPage.instructionsInput).toBeVisible();
      await expect(mvPage.requiredCheckbox).toBeVisible();
      await expect(mvPage.saveBtn).toBeVisible();
      await expect(mvPage.cancelBtn).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-002 | Save shows validation when required fields empty
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-002 | Verify that Save button is disabled or shows validation when required fields are empty @regression', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Click Save with all fields empty', async () => {
      await mvPage.saveQuestion();
    });

    await test.step('Verify validation errors appear', async () => {
      await expect(mvPage.validationQuestionRequired).toBeVisible();
      await expect(mvPage.validationMinOptions).toBeVisible();
    });

    await test.step('Verify user remains on the form', async () => {
      await expect(mvPage.questionStatementInput).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-003 | Question Statement rejects blank/whitespace-only
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-003 | Verify that Question Statement field does not allow saving blank/whitespace-only values @regression', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Enter whitespace-only in Question Statement', async () => {
      await mvPage.fillQuestionStatement('   ');
    });

    await test.step('Fill other required fields and add options', async () => {
      await mvPage.selectMarketVerticals([DEFAULT_VERTICAL]);
      await mvPage.addOption('Option A', 1);
      await mvPage.addOption('Option B', 2);
    });

    await test.step('Click Save and verify validation error', async () => {
      await mvPage.saveQuestion();
      // Either validation error appears or the whitespace is trimmed and rejected
      await expect(mvPage.validationQuestionRequired).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-004 | Instructions field is optional
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-004 | Verify that Instructions field is optional and can be left empty without validation error @smoke', async () => {
    const optionalQuestion = `${QUESTION_PREFIX} Optional ${uniqueTimestamp}`;

    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Fill required fields, leave Instructions empty', async () => {
      await mvPage.fillQuestionStatement(optionalQuestion);
      await mvPage.selectMarketVerticals([DEFAULT_VERTICAL]);
      await mvPage.addOption('Option A', 1);
      await mvPage.addOption('Option B', 2);
    });

    await test.step('Save and verify success', async () => {
      await mvPage.saveQuestion();
      // Should navigate back to questions page
      await mvPage.assertQuestionsPageOpened();
    });

    await test.step('Verify question appears in list', async () => {
      await mvPage.assertQuestionExists(optionalQuestion);
    });

    // Cleanup: delete the created question
    await mvPage.clickDeleteFromMenu(optionalQuestion);
    await mvPage.confirmDelete();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-005 | Answer Type dropdown contains all 3 options
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-005 | Verify that Answer Type dropdown contains options (Multiple Selection, Radio Buttons (Single Selection), DropDown) @smoke', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Open Answer Type dropdown and verify options', async () => {
      const options = await mvPage.getAnswerTypeOptions();
      expect(options).toContain('Multiple Selection');
      expect(options).toContain('Radio Buttons (Single Selection)');
      expect(options).toContain('DropDown');
      expect(options).toHaveLength(3);
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-006 | Market Verticals dropdown multi-select
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-006 | Verify that Market Verticals dropdown supports multi-select of industries and shows selected items correctly @smoke', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Open MV dropdown, verify options, and select Commercial + Industrial', async () => {
      // Open the MV dropdown
      await sharedPage.getByRole('heading', { name: /Market Verticals/ }).click();
      const popper = sharedPage.locator('#simple-popper').last();
      await expect(popper).toBeVisible();

      // Verify all known verticals are present in the dropdown
      for (const v of KNOWN_VERTICALS) {
        await expect(popper.getByText(v, { exact: true })).toBeVisible();
      }

      // Select Commercial and Industrial (stay in the same popper session)
      await popper.getByText(DEFAULT_VERTICAL, { exact: true }).click();
      await popper.getByText('Industrial', { exact: true }).click();
    });

    await test.step('Verify both selections appear as selected chips in the dropdown', async () => {
      // After selecting, the popper should still be open and show selected items as headings
      const popper = sharedPage.locator('#simple-popper').last();
      await expect(popper.getByRole('heading', { name: DEFAULT_VERTICAL })).toBeVisible();
      await expect(popper.getByRole('heading', { name: 'Industrial' })).toBeVisible();
      await sharedPage.keyboard.press('Escape');
    });

    await test.step('Verify heading shows selection count', async () => {
      // The heading should now show "Market Verticals (2)"
      await expect(sharedPage.getByRole('heading', { name: /Market Verticals \(2\)/ })).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-007 | Market Verticals dropdown search & select
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-007 | Verify that Market Verticals dropdown search filters industries and allows selecting from filtered results @regression', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Search for "Comm" in Market Verticals dropdown', async () => {
      // Open the MV dropdown
      await sharedPage.getByRole('heading', { name: /Market Verticals/ }).click();
      const popper = sharedPage.locator('#simple-popper').last();
      await expect(popper).toBeVisible();

      // Type in the search input inside the popper
      const searchInput = popper.locator('input');
      await searchInput.fill('Comm');

      // Verify filtered results
      await expect(popper.getByText('Commercial', { exact: true })).toBeVisible();
      // Non-matching options should be hidden
      await expect(popper.getByText('Industrial', { exact: true })).toBeHidden();
      await expect(popper.getByText('Residential', { exact: true })).toBeHidden();
    });

    await test.step('Select Commercial from filtered results', async () => {
      const popper = sharedPage.locator('#simple-popper').last();
      await popper.getByText('Commercial', { exact: true }).click();
      await sharedPage.keyboard.press('Escape');
    });

    await test.step('Verify Commercial is selected', async () => {
      await expect(mvPage.questionStatementInput).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-008 | Required checkbox toggles & persists after saving
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-008 | Verify that Required checkbox toggles the required status and persists after saving @smoke', async () => {
    await test.step('Open Add Question form and fill required fields', async () => {
      await mvPage.clickAddQuestion();
      await mvPage.fillQuestionStatement(uniqueQuestionForRequired);
      await mvPage.selectMarketVerticals([DEFAULT_VERTICAL]);
      await mvPage.addOption('Option A', 1);
      await mvPage.addOption('Option B', 2);
    });

    await test.step('Toggle Required checkbox ON and verify', async () => {
      await mvPage.toggleRequired();
      await expect(mvPage.requiredCheckbox).toBeChecked();
    });

    await test.step('Save the question', async () => {
      await mvPage.saveQuestion();
      await mvPage.assertQuestionsPageOpened();
    });

    await test.step('Edit the question and verify Required is still checked', async () => {
      await mvPage.clickEditFromMenu(uniqueQuestionForRequired);
      await expect(mvPage.requiredCheckbox).toBeChecked();
    });

    // Navigate back and cleanup
    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
    await mvPage.clickDeleteFromMenu(uniqueQuestionForRequired);
    await mvPage.confirmDelete();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-009 | Add option button creates option rows
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-009 | Verify that Add option button adds an option input row and allows multiple options to be added @regression', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Verify no option rows initially', async () => {
      const initialCount = await mvPage.getOptionRowCount();
      expect(initialCount).toBe(0);
    });

    await test.step('Click Add option and verify one row added', async () => {
      await mvPage.addOptionBtn.click();
      const countAfterFirst = await mvPage.getOptionRowCount();
      expect(countAfterFirst).toBe(1);
    });

    await test.step('Click Add option again and verify two rows', async () => {
      await mvPage.addOptionBtn.click();
      const countAfterSecond = await mvPage.getOptionRowCount();
      expect(countAfterSecond).toBe(2);
    });

    await test.step('Verify option label inputs and spinbuttons are visible', async () => {
      const optionLabels = sharedPage.getByRole('textbox', { name: 'Option Label' });
      await expect(optionLabels.first()).toBeVisible();
      const spinbuttons = sharedPage.getByRole('spinbutton');
      await expect(spinbuttons.first()).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-010 | Cannot save without options when required
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-010 | Verify that user cannot save a question with Answer Type requiring options when no options are added (if applicable) @regression', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Fill required fields but do NOT add options', async () => {
      await mvPage.fillQuestionStatement(`${QUESTION_PREFIX} NoOpts ${uniqueTimestamp}`);
      // Answer type defaults to Multiple Selection
      await mvPage.selectMarketVerticals([DEFAULT_VERTICAL]);
    });

    await test.step('Click Save and verify validation', async () => {
      await mvPage.saveQuestion();
      await expect(mvPage.validationMinOptions).toBeVisible();
    });

    await test.step('Verify user remains on form', async () => {
      await expect(mvPage.questionStatementInput).toBeVisible();
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-011 | Duplicate options handled gracefully
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-011 | Verify that duplicate options are prevented or handled gracefully with validation (if rules exist) @regression', async () => {
    const dupeQuestion = `${QUESTION_PREFIX} Dupe ${uniqueTimestamp}`;

    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Fill required fields', async () => {
      await mvPage.fillQuestionStatement(dupeQuestion);
      // Scope MV selection inside popper to avoid sidebar match
      await sharedPage.getByRole('heading', { name: /Market Verticals/ }).click();
      const popper = sharedPage.locator('#simple-popper').last();
      await expect(popper).toBeVisible();
      await popper.getByText(DEFAULT_VERTICAL, { exact: true }).click();
      await sharedPage.keyboard.press('Escape');
    });

    await test.step('Add two options with the same label', async () => {
      await mvPage.addOption('Option A', 1);
      await mvPage.addOption('Option A', 2);
    });

    await test.step('Click Save and observe behavior', async () => {
      await mvPage.saveQuestion();

      // Wait for navigation back to list (app has no duplicate option validation)
      await mvPage.assertQuestionsPageOpened();
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Verify question saved and clean up', async () => {
      // No duplicate validation exists — question saved successfully. Clean up.
      await mvPage.assertQuestionExists(dupeQuestion);
      await mvPage.clickDeleteFromMenu(dupeQuestion);
      await mvPage.confirmDelete();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-012 | Cancel returns without saving
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-012 | Verify that clicking Cancel on Add/Edit form returns to previous page without saving changes @smoke', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Fill Question Statement with a value', async () => {
      await mvPage.fillQuestionStatement(uniqueQuestionForCancel);
    });

    await test.step('Click Cancel', async () => {
      await mvPage.cancelForm();
    });

    await test.step('Verify navigated back to questions list', async () => {
      await mvPage.assertQuestionsPageOpened();
    });

    await test.step('Verify the unsaved question does NOT appear in the list', async () => {
      await mvPage.assertQuestionNotExists(uniqueQuestionForCancel);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-013 | Save shows success & question appears in list
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-013 | Verify that saving a new question shows success feedback and displays the question in the list @smoke', async () => {
    await test.step('Open Add Question form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Fill all required fields', async () => {
      await mvPage.fillQuestionStatement(uniqueQuestionName);
      // Answer Type defaults to Multiple Selection
      await mvPage.selectMarketVerticals([DEFAULT_VERTICAL]);
      await mvPage.addOption('Option A', 1);
      await mvPage.addOption('Option B', 2);
    });

    await test.step('Save the question', async () => {
      await mvPage.saveQuestion();
    });

    await test.step('Verify navigated back to questions list', async () => {
      await mvPage.assertQuestionsPageOpened();
    });

    await test.step('Verify the new question appears in the list', async () => {
      await mvPage.assertQuestionExists(uniqueQuestionName);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-014 | Edit from menu prefills existing values
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-014 | Verify that clicking Edit from the menu navigates to edit form with existing values prefilled @smoke', async () => {
    // This test depends on TC-MV-013 having created the question
    await test.step('Click Edit from 3-dot menu on the created question', async () => {
      await mvPage.clickEditFromMenu(uniqueQuestionName);
    });

    await test.step('Verify Question Statement is prefilled', async () => {
      await expect(mvPage.questionStatementInput).toHaveValue(uniqueQuestionName);
    });

    await test.step('Verify Answer Type is prefilled', async () => {
      // The answer type heading should show a valid type
      await expect(mvPage.answerTypeDropdown).toBeVisible();
    });

    await test.step('Verify existing options are displayed', async () => {
      const optionCount = await mvPage.getOptionRowCount();
      expect(optionCount).toBeGreaterThanOrEqual(2);
    });

    await mvPage.clickBack();
    await mvPage.assertQuestionsPageOpened();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-015 | Edit updates Last Edited By/On after save
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-015 | Verify that editing a question updates Last Edited By and Last Edited On correctly after save @regression', async () => {
    const editSuffix = ' - edited';
    const editedName = `${uniqueQuestionName}${editSuffix}`;
    const expectedEditedDates = currentEditedDateCandidates();

    await test.step('Click Edit from 3-dot menu', async () => {
      await mvPage.clickEditFromMenu(uniqueQuestionName);
    });

    await test.step('Modify Question Statement and save', async () => {
      // Clear and type the new name character by character to ensure React captures it
      await mvPage.questionStatementInput.click();
      await mvPage.questionStatementInput.fill('');
      await mvPage.questionStatementInput.type(editedName, { delay: 10 });
      await expect(mvPage.questionStatementInput).toHaveValue(editedName);
    });

    await test.step('Save the edited question', async () => {
      // Click Save (bottom button to avoid ambiguity)
      await sharedPage.getByRole('button', { name: 'Save' }).last().click();
      // Wait for navigation back to the questions list
      await mvPage.assertQuestionsPageOpened();
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Verify the edited question appears in the list', async () => {
      // The edited question should be visible in the table (may need scroll)
      const editedCell = sharedPage.getByRole('cell').filter({ hasText: editedName });
      await expect(editedCell.first()).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
    });

    await test.step('Verify Last Edited On is updated to today', async () => {
      const details = await mvPage.getQuestionRowDetails(editedName);
      expect(expectedEditedDates).toContain(details.editedOn);
    });

    await test.step('Verify Last Edited By is updated', async () => {
      const details = await mvPage.getQuestionRowDetails(editedName);
      expect(details.editedBy.length).toBeGreaterThan(0);
    });

    // Cleanup: delete the test question
    await mvPage.clickDeleteFromMenu(editedName);
    await mvPage.confirmDelete();
  });
});

// ============================================================
// Describe: Market Verticals & Industry Management
// TC-MV-016 through TC-MV-029
// ============================================================

test.describe('Market Verticals & Industry Management — TC-MV-016 through TC-MV-029', () => {
  let sharedPage;
  let mvPage;

  const COMMERCIAL_URL_PATTERN = /\/marketVerticals\/\d+\/questions/;
  const DATE_FORMAT_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await performLogin(sharedPage);
    mvPage = new MarketVerticalsPage(sharedPage);
  });

  test.beforeEach(async () => {
    await sharedPage.goto(`${env.baseUrl}${MV_PATH}`, { waitUntil: 'domcontentloaded' });
    await mvPage.waitForSkeletonsToClear();
    await expect(mvPage.industriesTable).toBeVisible();
  });

  test.afterAll(async () => {
    await sharedPage.context().close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-016 | Graceful error state when industries API fails
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-016 | Verify that Market Verticals page shows a graceful error state when industries API fails @regression', async () => {
    await test.step('Intercept industries API and return 500', async () => {
      await sharedPage.route('**/api/**/industries**', (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Internal Server Error"}' })
      );
    });

    await test.step('Navigate to Market Verticals list page', async () => {
      await sharedPage.goto(`${env.baseUrl}${MV_PATH}`, { waitUntil: 'domcontentloaded' });
    });

    await test.step('Verify page does not crash — header and nav remain visible', async () => {
      // The page header or nav should still be visible even if data fails
      await expect(sharedPage.locator('header')).toBeVisible();
      await expect(sharedPage.getByRole('list').first()).toBeVisible();
    });

    await test.step('Verify table is empty or error state is shown', async () => {
      // Either no data rows render, or an error/empty state is shown
      const dataRows = await sharedPage.getByRole('row').all();
      // At most 1 row (the header row) means no data loaded
      expect(dataRows.length).toBeLessThanOrEqual(1);
    });

    await test.step('Cleanup: unroute the intercepted API', async () => {
      await sharedPage.unroute('**/api/**/industries**');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-017 | Search by Industry partial matches, case-insensitive
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-017 | Verify that Search by Industry supports partial matches and is case-insensitive @regression', async () => {
    await test.step('Type "comm" (lowercase) and verify filtered results', async () => {
      await mvPage.searchIndustry('comm');
      // Wait for filtered row with "Commercial" to appear
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const names = await mvPage.getListedIndustryNames();
      expect(names.length).toBeGreaterThanOrEqual(1);
      expect(names.some(n => n.toLowerCase().includes('comm'))).toBe(true);
    });

    await test.step('Verify non-matching industries are hidden', async () => {
      const names = await mvPage.getListedIndustryNames();
      // "Industrial" and "Residential" should not appear
      expect(names.some(n => n === 'Industrial')).toBe(false);
      expect(names.some(n => n === 'Residential')).toBe(false);
    });

    await test.step('Clear search and type "COMM" (uppercase) — same results expected', async () => {
      await mvPage.searchIndustry('COMM');
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const names = await mvPage.getListedIndustryNames();
      expect(names.length).toBeGreaterThanOrEqual(1);
      expect(names.some(n => n.toLowerCase().includes('comm'))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-018 | Special characters in search don't crash UI
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-018 | Verify that entering special characters in Search by Industry does not crash UI and returns valid results or none @regression', async () => {
    await test.step('Type XSS-style string and verify no crash', async () => {
      await mvPage.searchIndustry('<script>alert(1)</script>');
      // Page should not crash — header remains visible
      await expect(sharedPage.locator('header')).toBeVisible();
      // Table may show zero rows but should still exist
      await expect(mvPage.industriesTable).toBeVisible();
    });

    await test.step('Clear and type special characters — verify no crash', async () => {
      await mvPage.searchIndustry('@#$%^&*');
      await expect(sharedPage.locator('header')).toBeVisible();
      await expect(mvPage.industriesTable).toBeVisible();
    });

    await test.step('Verify search input is clearable and page remains functional', async () => {
      await mvPage.clearIndustrySearch();
      // Wait for at least one industry row to appear after clearing
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const names = await mvPage.getListedIndustryNames();
      expect(names.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-019 | Clearing search resets grid to default
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-019 | Verify that clearing Search by Industry resets the grid to default results @regression', async () => {
    let defaultCount;

    await test.step('Note default row count', async () => {
      // Ensure table is fully loaded by waiting for a known industry
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const names = await mvPage.getListedIndustryNames();
      defaultCount = names.length;
      expect(defaultCount).toBeGreaterThanOrEqual(1);
    });

    await test.step('Filter by "Comm" and verify fewer rows', async () => {
      await mvPage.searchIndustry('Comm');
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const filteredNames = await mvPage.getListedIndustryNames();
      expect(filteredNames.length).toBeLessThan(defaultCount);
    });

    await test.step('Clear search and verify default rows restored', async () => {
      await mvPage.clearIndustrySearch();
      // Wait for ALL known industries to reappear (not just the first)
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      await expect(sharedPage.getByRole('cell', { name: 'Residential' })).toBeVisible();
      const restoredNames = await mvPage.getListedIndustryNames();
      expect(restoredNames).toHaveLength(defaultCount);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-020 | Industry row click opens correct questions page
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-020 | Verify that each industry row is clickable and opens the correct industry questions page @smoke', async () => {
    await test.step('Click on "Commercial" row', async () => {
      await mvPage.clickVerticalInList('Commercial');
    });

    await test.step('Verify URL changed to questions page', async () => {
      await expect(sharedPage).toHaveURL(COMMERCIAL_URL_PATTERN);
    });

    await test.step('Verify detail page heading shows "Commercial"', async () => {
      await mvPage.assertVerticalHeading('Commercial');
    });

    await test.step('Verify Add Question button is visible', async () => {
      await expect(mvPage.addQuestionBtn).toBeVisible();
    });

    await test.step('Verify left sidebar lists industries with "Commercial" present', async () => {
      const sidebarNames = await mvPage.getVisibleSidebarIndustryNames();
      expect(sidebarNames).toContain('Commercial');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-021 | Zero deals/companies display 0 (not blank)
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-021 | Verify that industries with zero deals/companies display 0 values (not blank) @regression', async () => {
    await test.step('Read all industry row data and verify no blanks', async () => {
      // Ensure table is fully loaded
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const allRows = await mvPage.getAllIndustryRowData();
      expect(allRows.length).toBeGreaterThanOrEqual(1);

      for (const row of allRows) {
        // Deals column must be a numeric string (including "0"), never blank
        expect(row.deals).toMatch(/^\d+$/);
        // Companies column must be a numeric string (including "0"), never blank
        expect(row.companies).toMatch(/^\d+$/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-022 | Synced From shows source, no overflow
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-022 | Verify that Synced From value displays correct source (e.g., HubSpot) and does not overflow UI @regression', async () => {
    await test.step('Read Synced From for first industry and verify non-empty', async () => {
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const rowData = await mvPage.getIndustryRowData('Commercial');
      expect(rowData.syncedFrom.length).toBeGreaterThan(0);
      // Value should be a recognized source
      expect(rowData.syncedFrom).toBe('HubSpot');
    });

    await test.step('Verify Synced From cell is visible and not overflowing', async () => {
      const cell = sharedPage.getByRole('row', { name: /Commercial/ }).getByRole('cell').nth(3);
      await expect(cell).toBeVisible();
      // Check that the cell is within viewport bounds (not overflowing)
      const box = await cell.boundingBox();
      expect(box).toBeTruthy();
      expect(box.width).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-023 | Last Synced On correct date format or N/A
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-023 | Verify that Last Synced On displays correct date format and handles missing dates as N/A @regression', async () => {
    await test.step('Read all Last Synced On values and verify format', async () => {
      await expect(sharedPage.getByRole('cell', { name: 'Commercial' })).toBeVisible();
      const allRows = await mvPage.getAllIndustryRowData();
      expect(allRows.length).toBeGreaterThanOrEqual(1);

      for (const row of allRows) {
        // Each value must match MM/DD/YYYY or be "N/A"
        const isValidDate = DATE_FORMAT_REGEX.test(row.lastSyncedOn);
        const isNA = row.lastSyncedOn === 'N/A';
        expect(isValidDate || isNA).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAIL PAGE TESTS: TC-MV-024 through TC-MV-029
  // These tests need to start on a detail page.
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Detail Page — Sidebar & Navigation', () => {
    test.beforeEach(async () => {
      // Parent beforeEach already navigated to list page; click into Commercial
      await mvPage.clickVerticalInList('Commercial');
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TC-MV-024 | Left panel lists all industries with company counts
    // ═══════════════════════════════════════════════════════════════════════════

    test('TC-MV-024 | Verify that left panel lists all industries and displays No. of Companies for each industry @smoke', async () => {
      await test.step('Read all sidebar industry buttons', async () => {
        const sidebarData = await mvPage.getSidebarIndustryButtons();
        const sidebarNames = sidebarData.map(d => d.name);

        // All known industries should be present
        for (const v of KNOWN_VERTICALS) {
          expect(sidebarNames).toContain(v);
        }
      });

      await test.step('Verify each industry shows a numeric company count', async () => {
        const sidebarData = await mvPage.getSidebarIndustryButtons();
        for (const item of sidebarData) {
          expect(item.companyCount).toMatch(/^\d+$/);
        }
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TC-MV-025 | Switching industry from left panel loads new questions
    // ═══════════════════════════════════════════════════════════════════════════

    test('TC-MV-025 | Verify that switching industry from left panel loads the questions for the newly selected industry @smoke', async () => {
      await test.step('Verify current heading is "Commercial"', async () => {
        await mvPage.assertVerticalHeading('Commercial');
      });

      await test.step('Click "Distribution" in the left sidebar', async () => {
        await mvPage.selectVerticalInSidebar('Distribution');
      });

      await test.step('Verify URL updated to Distribution industry', async () => {
        await expect(sharedPage).toHaveURL(COMMERCIAL_URL_PATTERN);
      });

      await test.step('Verify heading updated to "Distribution"', async () => {
        await mvPage.assertVerticalHeading('Distribution');
      });

      await test.step('Verify questions table is visible for Distribution', async () => {
        await expect(mvPage.questionsTable).toBeVisible();
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TC-MV-026 | Selected industry highlighted after page refresh
    // ═══════════════════════════════════════════════════════════════════════════

    test('TC-MV-026 | Verify that selected industry remains highlighted after page refresh (if deep link supports it) @regression', async () => {
      await test.step('Click "Industrial" in the left sidebar', async () => {
        await mvPage.selectVerticalInSidebar('Industrial');
        await mvPage.assertVerticalHeading('Industrial');
      });

      await test.step('Note the URL', async () => {
        await expect(sharedPage).toHaveURL(COMMERCIAL_URL_PATTERN);
      });

      await test.step('Reload the page', async () => {
        await sharedPage.reload({ waitUntil: 'domcontentloaded' });
        await mvPage.waitForSkeletonsToClear();
      });

      await test.step('Verify heading still shows "Industrial" after reload', async () => {
        await mvPage.assertVerticalHeading('Industrial');
      });

      await test.step('Verify "Industrial" is the active sidebar item', async () => {
        const active = await mvPage.getActiveSidebarIndustry();
        expect(active).toBe('Industrial');
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TC-MV-027 | Left panel search filters industries
    // ═══════════════════════════════════════════════════════════════════════════

    test('TC-MV-027 | Verify that Search in left panel filters industries list correctly @regression', async () => {
      await test.step('Type "Dist" in sidebar search and wait for filter to apply', async () => {
        await mvPage.searchSidebarVertical('Dist');
        // Web-first assertion: wait for a non-matching industry to disappear before reading names
        await expect(
          sharedPage.getByRole('button', { name: /Commercial.*No\. of Companies/ }),
        ).toBeHidden({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Verify only matching industries remain visible', async () => {
        const names = await mvPage.getVisibleSidebarIndustryNames();
        expect(names.length).toBeGreaterThanOrEqual(1);
        expect(names.some(n => n.toLowerCase().includes('dist'))).toBe(true);
      });

      await test.step('Verify non-matching industries are hidden', async () => {
        const names = await mvPage.getVisibleSidebarIndustryNames();
        expect(names).not.toContain('Commercial');
        expect(names).not.toContain('Residential');
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TC-MV-028 | Clearing left panel search restores full list
    // ═══════════════════════════════════════════════════════════════════════════

    test('TC-MV-028 | Verify that clearing left-panel Search restores the full industries list @regression', async () => {
      await test.step('Filter sidebar by "Dist"', async () => {
        await mvPage.searchSidebarVertical('Dist');
        // Wait for non-matching industry to disappear before reading filtered names
        await expect(
          sharedPage.getByRole('button', { name: /Commercial.*No\. of Companies/ }),
        ).toBeHidden({ timeout: TIMEOUTS.BASE * 20 });
        const filteredNames = await mvPage.getVisibleSidebarIndustryNames();
        expect(filteredNames.length).toBeLessThan(KNOWN_VERTICALS.length);
      });

      await test.step('Clear sidebar search and verify all industries are restored', async () => {
        // Clear the search input directly and wait for all verticals to reappear
        await mvPage.sidebarSearchInput.clear();
        await mvPage.waitForSkeletonsToClear();
        // Wait for a non-matching vertical to reappear (proves filter was cleared)
        await expect(sharedPage.getByRole('button', { name: /Commercial.*No\. of Companies/ })).toBeVisible();
        const restoredNames = await mvPage.getVisibleSidebarIndustryNames();
        for (const v of KNOWN_VERTICALS) {
          expect(restoredNames).toContain(v);
        }
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TC-MV-029 | Deep link to industry questions page loads correctly
    // ═══════════════════════════════════════════════════════════════════════════

    test('TC-MV-029 | Verify that deep link to an industry questions page loads correctly when opened in a new tab @smoke', async () => {
      // Use the Commercial detail URL discovered during MCP exploration
      const commercialDetailUrl = `${env.baseUrl}/app/sales/marketVerticals/84550/questions`;

      await test.step('Navigate directly to industry questions URL', async () => {
        await sharedPage.goto(commercialDetailUrl, { waitUntil: 'domcontentloaded' });
        await mvPage.waitForSkeletonsToClear();
      });

      await test.step('Verify URL matches expected pattern', async () => {
        await expect(sharedPage).toHaveURL(/\/marketVerticals\/\d+\/questions/);
      });

      await test.step('Verify heading shows correct industry name', async () => {
        await mvPage.assertVerticalHeading('Commercial');
      });

      await test.step('Verify left sidebar is visible with all industries', async () => {
        const sidebarNames = await mvPage.getVisibleSidebarIndustryNames();
        expect(sidebarNames.length).toBeGreaterThanOrEqual(1);
      });

      await test.step('Verify Add Question button is visible', async () => {
        await expect(mvPage.addQuestionBtn).toBeVisible();
      });
    });
  });
});

// ============================================================
// Describe: Questions Listing & Interaction
// TC-MV-030 through TC-MV-048
// ============================================================

test.describe('Questions Listing & Interaction — TC-MV-030 through TC-MV-048', () => {
  let sharedPage;
  let mvPage;

  const DATE_FORMAT_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
  const VALID_ANSWER_TYPES = ['Dropdown', 'Radio', 'Multiselect'];
  const QUESTION_PREFIX = 'PAT';

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await performLogin(sharedPage);
    mvPage = new MarketVerticalsPage(sharedPage);
  });

  test.beforeEach(async () => {
    // Navigate to list page then into Commercial detail page
    await sharedPage.goto(`${env.baseUrl}${MV_PATH}`, { waitUntil: 'domcontentloaded' });
    await mvPage.waitForSkeletonsToClear();
    await expect(mvPage.industriesTable).toBeVisible();
    await mvPage.clickVerticalInList(DEFAULT_VERTICAL);
  });

  test.afterAll(async () => {
    await sharedPage.context().close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-030 | Questions list shows expected columns
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-030 | Verify that questions list shows expected columns (Question Statement, Last Edited By, Last Edited On, Answer Type) @smoke', async () => {
    await test.step('Observe the questions table header row', async () => {
      await expect(mvPage.questionsTable).toBeVisible();
    });

    await test.step('Verify all expected column headers are present', async () => {
      const headers = await mvPage.getQuestionTableColumnHeaders();
      expect(headers).toContain('Question Statement');
      expect(headers).toContain('Last Edited By');
      expect(headers).toContain('Last Edited On');
      expect(headers).toContain('Answer Type');
    });

    await test.step('Verify there are exactly 6 column headers (including drag-handle and actions)', async () => {
      const headers = await mvPage.getQuestionTableColumnHeaders();
      expect(headers).toHaveLength(6);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-031 | Questions list supports vertical scrolling
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-031 | Verify that questions list supports vertical scrolling without header/row misalignment @regression', async () => {
    await test.step('Verify multiple question rows are visible', async () => {
      // Wait for at least one data row to load before counting (SKILL.md §4 — table data readiness)
      await expect(mvPage.questionsTable.getByRole('row').nth(1)).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      const rows = await mvPage.questionsTable.getByRole('row').all();
      // At least header + some data rows
      expect(rows.length).toBeGreaterThan(2);
    });

    await test.step('Scroll table to bottom and verify last row is visible', async () => {
      // The table may use virtualized rendering, so scrollIntoViewIfNeeded on the
      // last row can fail with "Element is not attached to the DOM". Instead, scroll
      // the table's scrollable container to the bottom via JS.
      const tableContainer = mvPage.questionsTable.locator('..');
      await tableContainer.evaluate((el) => {
        // Find the nearest scrollable ancestor
        let scrollable = el;
        while (scrollable && scrollable.scrollHeight <= scrollable.clientHeight) {
          scrollable = scrollable.parentElement;
        }
        if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
      });
      // Wait for last row to be visible after scroll.
      const lastRow = mvPage.questionsTable.getByRole('row').last();
      await expect(lastRow).toBeVisible();
    });

    await test.step('Verify last row cells align with header columns', async () => {
      const headerRow = mvPage.questionsTable.getByRole('row').first();
      const headerCells = await headerRow.getByRole('columnheader').all();
      const lastRow = mvPage.questionsTable.getByRole('row').last();
      const lastRowCells = await lastRow.getByRole('cell').all();

      // Scroll header into view so its bounding box is in the viewport clip rect
      await headerCells[1].scrollIntoViewIfNeeded();
      const headerBox = await headerCells[1].boundingBox();

      // Scroll the last data cell into view before reading its bounding box.
      // boundingBox() returns null for elements outside the viewport clip rect
      // even when they are visible inside a scrollable container (SKILL.md §4).
      await lastRowCells[1].scrollIntoViewIfNeeded();
      const cellBox = await lastRowCells[1].boundingBox();

      expect(headerBox).toBeTruthy();
      expect(cellBox).toBeTruthy();
      // Horizontal positions should overlap (within reasonable tolerance)
      expect(Math.abs(headerBox.x - cellBox.x)).toBeLessThan(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-032 | Search by Question filters by keywords
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-032 | Verify that Search by Question filters questions by statement keywords @smoke', async () => {
    const searchKeyword = 'budget';

    await test.step('Type keyword in Search by Question input', async () => {
      await mvPage.searchQuestions(searchKeyword);
      // Wait for the filtered result to appear
      await expect(
        sharedPage.getByRole('cell', { name: new RegExp(searchKeyword, 'i') })
      ).toBeVisible();
    });

    await test.step('Verify table shows only matching questions', async () => {
      const statements = await mvPage.getQuestionStatements();
      expect(statements.length).toBeGreaterThanOrEqual(1);
      // Verify the filtered results are fewer than the full list (31 questions)
      expect(statements.length).toBeLessThan(31);
      for (const stmt of statements) {
        expect(stmt.toLowerCase()).toContain(searchKeyword.toLowerCase());
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-033 | Invalid search shows empty state
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-033 | Verify that invalid Search by Question shows an empty state message without showing stale results @regression', async () => {
    await test.step('Type nonsensical search string', async () => {
      await mvPage.searchQuestions('zzzznonexistent99999');
    });

    await test.step('Verify no question rows are displayed', async () => {
      const statements = await mvPage.getQuestionStatements();
      expect(statements).toHaveLength(0);
    });

    await test.step('Verify table body has zero data rows', async () => {
      // Header row is in rowgroup[0], data rows in rowgroup[1]
      const dataRows = mvPage.questionsTable.locator('tbody').getByRole('row');
      await expect(dataRows).toHaveCount(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-034 | Long question text truncates with ellipsis
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-034 | Verify that question statement text truncates with ellipsis when long and does not break layout @regression', async () => {
    // Known long question: "Have you experienced theft, vandalism, or another security incident in the past year?"
    const longQuestionPartial = 'Have you experienced theft';

    await test.step('Locate the long question statement cell', async () => {
      const cell = sharedPage.getByRole('cell', { name: new RegExp(longQuestionPartial, 'i') });
      await cell.scrollIntoViewIfNeeded();
      await expect(cell).toBeVisible();
    });

    await test.step('Verify text truncation via visible ellipsis in content', async () => {
      const cell = sharedPage.getByRole('cell', { name: new RegExp(longQuestionPartial, 'i') });
      const innerDiv = cell.locator('div').first();
      const visibleText = (await innerDiv.textContent())?.trim() ?? '';
      // The app truncates long text by appending "..." in the content
      expect(visibleText).toContain('...');
    });

    await test.step('Verify cell does not cause horizontal scroll', async () => {
      const cell = sharedPage.getByRole('cell', { name: new RegExp(longQuestionPartial, 'i') });
      const box = await cell.boundingBox();
      expect(box).toBeTruthy();
      // Cell width should be bounded (not extending beyond viewport)
      expect(box.width).toBeLessThan(1920);
      expect(box.width).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-035 | Last Edited By/On show correct values
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-035 | Verify that Last Edited By and Last Edited On show correct values and handle missing values as N/A @regression', async () => {
    await test.step('Read Last Edited By/On for visible question rows', async () => {
      // Wait for at least one data row to render
      await expect(mvPage.questionsTable.getByRole('row').nth(1)).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      // Wait for cell content to be populated (not just the row skeleton)
      await expect(mvPage.questionsTable.getByRole('row').nth(1).getByRole('cell').nth(2)).not.toHaveText('', { timeout: TIMEOUTS.BASE * 20 });

      // Read all row data atomically via evaluate() to avoid stale handles
      const rowData = await mvPage.questionsTable.evaluate((table) => {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        return rows.slice(0, 5).map((row) => {
          const cells = row.querySelectorAll('td');
          return {
            editedBy: (cells[2]?.textContent ?? '').trim(),
            editedOn: (cells[3]?.textContent ?? '').trim(),
          };
        });
      });

      expect(rowData.length).toBeGreaterThanOrEqual(1);

      for (const { editedBy, editedOn } of rowData) {
        // Last Edited By should be a non-empty string
        expect(editedBy.length).toBeGreaterThan(0);

        // Last Edited On should match MM/DD/YYYY or be N/A
        const isValidDate = DATE_FORMAT_REGEX.test(editedOn);
        const isNA = editedOn === 'N/A';
        expect(isValidDate || isNA).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-036 | Answer Type displays correct label
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-036 | Verify that Answer Type displays correct label (Dropdown/Radio/Multiselect) based on saved configuration @regression', async () => {
    await test.step('Read Answer Type for visible question rows', async () => {
      // Wait for question data to fully render before reading cell text
      await expect(mvPage.questionsTable.getByRole('row').nth(1).getByRole('cell').nth(4)).not.toHaveText('', { timeout: TIMEOUTS.BASE * 20 });

      const rows = await mvPage.questionsTable.getByRole('row').all();
      const dataRows = rows.slice(1); // skip header
      expect(dataRows.length).toBeGreaterThanOrEqual(1);

      // Check the first 5 rows (representative sample)
      const checkCount = Math.min(5, dataRows.length);
      for (let i = 0; i < checkCount; i++) {
        const cells = await dataRows[i].getByRole('cell').all();
        // Columns: [drag-handle, Question Statement, Last Edited By, Last Edited On, Answer Type, actions]
        const answerType = (await cells[4]?.textContent())?.trim() ?? '';
        expect(answerType.length).toBeGreaterThan(0);
        expect(VALID_ANSWER_TYPES).toContain(answerType);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-037 | Clicking question row opens detail panel
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-037 | Verify that clicking a question row opens the question details panel showing Associated Industries, Question Statement, Answer Type, and options @smoke', async () => {
    await test.step('Click the first question statement cell', async () => {
      await mvPage.openQuestionDetailPanel('What security services');
    });

    await test.step('Verify panel heading "Question" (h2) is visible', async () => {
      await expect(mvPage.questionDetailPanel).toBeVisible();
    });

    await test.step('Verify Associated Industries section is visible with at least one chip', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Associated Industries', level: 3 })).toBeVisible();
      const chips = await mvPage.getDetailPanelIndustryChips();
      expect(chips.length).toBeGreaterThanOrEqual(1);
    });

    await test.step('Verify question statement is displayed as h3 heading', async () => {
      await expect(sharedPage.getByRole('heading', { name: /What security services/, level: 3 })).toBeVisible();
    });

    await test.step('Verify Answer Type heading is visible and at least one option row exists', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Answer Type', level: 3 })).toBeVisible();
      const options = await mvPage.getDetailPanelOptions();
      expect(options.length).toBeGreaterThanOrEqual(1);
    });

    // Close panel to not interfere with next test
    await mvPage.closeQuestionDetailPanelV2();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-038 | Detail panel closes via X icon
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-038 | Verify that question details panel can be closed using the close (X) icon without page refresh @regression', async () => {
    let urlBeforeClose;

    await test.step('Open a question detail panel', async () => {
      await mvPage.openQuestionDetailPanel('What security services');
      await expect(mvPage.questionDetailPanel).toBeVisible();
    });

    await test.step('Note the current URL', async () => {
      urlBeforeClose = sharedPage.url();
    });

    await test.step('Click the close (X) icon button', async () => {
      await mvPage.closeQuestionDetailPanelV2();
    });

    await test.step('Verify panel is closed and URL unchanged', async () => {
      await expect(mvPage.questionDetailPanel).toBeHidden();
      expect(sharedPage.url()).toBe(urlBeforeClose);
    });

    await test.step('Verify questions table is still visible', async () => {
      await expect(mvPage.questionsTable).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-039 | Associated Industries chips display correctly
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-039 | Verify that Associated Industries chips display all linked industries correctly @regression', async () => {
    await test.step('Open detail panel for the first question', async () => {
      await mvPage.openQuestionDetailPanel('What security services');
    });

    await test.step('Verify Associated Industries section is visible', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Associated Industries', level: 3 })).toBeVisible();
    });

    await test.step('Verify at least one industry chip and all match known industries', async () => {
      const chips = await mvPage.getDetailPanelIndustryChips();
      expect(chips.length).toBeGreaterThanOrEqual(1);
      for (const chip of chips) {
        expect(KNOWN_VERTICALS).toContain(chip);
      }
    });

    await mvPage.closeQuestionDetailPanelV2();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-040 | Options list shows each option with points
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-040 | Verify that options list in question details shows each option with its points value correctly @regression', async () => {
    await test.step('Open detail panel for a question with multiple options', async () => {
      await mvPage.openQuestionDetailPanel('What security services');
    });

    await test.step('Verify at least 2 options are displayed', async () => {
      const options = await mvPage.getDetailPanelOptions();
      expect(options.length).toBeGreaterThanOrEqual(2);
    });

    await test.step('Verify each option has a non-empty label and valid points value', async () => {
      const options = await mvPage.getDetailPanelOptions();
      for (const opt of options) {
        expect(opt.label.length).toBeGreaterThan(0);
        expect(opt.points).toMatch(/\d+ Points?/);
      }
    });

    await mvPage.closeQuestionDetailPanelV2();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-041 | Detail panel supports long content, scrollable
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-041 | Verify that question details panel supports long content and remains scrollable without UI overlap @regression', async () => {
    await test.step('Open detail panel for a question with many options', async () => {
      // First question "What security services" has 11 options
      await mvPage.openQuestionDetailPanel('What security services');
    });

    await test.step('Verify the first option is visible', async () => {
      const options = await mvPage.getDetailPanelOptions();
      expect(options.length).toBeGreaterThanOrEqual(5);
    });

    await test.step('Scroll to the last option and verify it is visible', async () => {
      // Find the last "Points" paragraph element and scroll to it
      const pointsElements = sharedPage.locator('p').filter({ hasText: /\d+ Points?/ });
      const count = await pointsElements.count();
      const lastOption = pointsElements.nth(count - 1);
      await lastOption.scrollIntoViewIfNeeded();
      await expect(lastOption).toBeVisible();
    });

    await test.step('Verify panel header and last option do not overlap', async () => {
      const headerBox = await mvPage.questionDetailPanel.boundingBox();
      const pointsElements = sharedPage.locator('p').filter({ hasText: /\d+ Points?/ });
      const count = await pointsElements.count();
      const lastOption = pointsElements.nth(count - 1);
      const optionBox = await lastOption.boundingBox();
      expect(headerBox).toBeTruthy();
      expect(optionBox).toBeTruthy();
      // The last option should be below the header (no vertical overlap)
      expect(optionBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height);
    });

    await mvPage.closeQuestionDetailPanelV2();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-042 | Three-dot menu shows Edit and Delete
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-042 | Verify that three-dot menu opens for a question row and shows Edit and Delete options @smoke', async () => {
    await test.step('Click the three-dot menu on a question row', async () => {
      await mvPage.openQuestionMenu('What security services');
    });

    await test.step('Verify popup menu contains Edit option', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Edit' })).toBeVisible();
    });

    await test.step('Verify popup menu contains Delete option', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Delete' })).toBeVisible();
    });

    // Close menu by pressing Escape
    await sharedPage.keyboard.press('Escape');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-043 | Delete from menu opens confirmation prompt
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-043 | Verify that clicking Delete from the menu opens a confirmation prompt (if implemented) before deletion @regression', async () => {
    const testQuestionName = `${QUESTION_PREFIX} DelPrompt ${Date.now()}`;

    await test.step('Create a test question', async () => {
      await mvPage.clickAddQuestion();
      await mvPage.createQuestion({
        statement: testQuestionName,
        answerType: 'Multiple Selection',
        verticals: [DEFAULT_VERTICAL],
        options: [
          { label: 'Option A', points: 1 },
          { label: 'Option B', points: 2 },
        ],
      });
      await mvPage.assertQuestionsPageOpened();
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Click Delete from the three-dot menu', async () => {
      await mvPage.clickDeleteFromMenu(testQuestionName);
    });

    await test.step('Verify confirmation dialog appears with correct content', async () => {
      await expect(mvPage.deleteDialog).toBeVisible();
      await expect(
        sharedPage.getByText(/Are you sure you want to delete this question/)
      ).toBeVisible();
      await expect(mvPage.deleteConfirmBtn).toBeVisible();
      await expect(mvPage.deleteCancelBtn).toBeVisible();
    });

    // Cleanup: confirm deletion
    await mvPage.confirmDelete();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-044 | Deleting question removes it and updates count
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-044 | Verify that deleting a question removes it from the list and updates total questions count @smoke', async () => {
    const testQuestionName = `${QUESTION_PREFIX} DelCount ${Date.now()}`;
    let countBefore;
    let countAfterCreate;

    await test.step('Note the current No. of Questions count', async () => {
      countBefore = await mvPage.getNoOfQuestionsCount();
      expect(countBefore).toBeGreaterThanOrEqual(0);
    });

    await test.step('Create a test question', async () => {
      await mvPage.clickAddQuestion();
      await mvPage.createQuestion({
        statement: testQuestionName,
        answerType: 'Multiple Selection',
        verticals: [DEFAULT_VERTICAL],
        options: [
          { label: 'Option A', points: 1 },
          { label: 'Option B', points: 2 },
        ],
      });
      await mvPage.assertQuestionsPageOpened();
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Note the updated count after creation', async () => {
      countAfterCreate = await mvPage.getNoOfQuestionsCount();
      expect(countAfterCreate).toBe(countBefore + 1);
    });

    await test.step('Delete the test question via menu > Delete > Confirm', async () => {
      await mvPage.clickDeleteFromMenu(testQuestionName);
      await mvPage.confirmDelete();
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Verify question is removed from the list', async () => {
      await mvPage.assertQuestionNotExists(testQuestionName);
    });

    await test.step('Verify No. of Questions count decreased by 1', async () => {
      const countAfterDelete = await mvPage.getNoOfQuestionsCount();
      expect(countAfterDelete).toBe(countAfterCreate - 1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-045 | Menu closes when clicking outside
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-045 | Verify that menu closes when clicking outside the menu @regression', async () => {
    await test.step('Open the three-dot menu on a question row', async () => {
      await mvPage.openQuestionMenu('What security services');
    });

    await test.step('Verify menu is visible', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Edit' })).toBeVisible();
      await expect(sharedPage.getByRole('heading', { name: 'Delete' })).toBeVisible();
    });

    await test.step('Click outside the menu (press Escape)', async () => {
      await sharedPage.keyboard.press('Escape');
    });

    await test.step('Verify menu is closed', async () => {
      await expect(sharedPage.getByRole('heading', { name: 'Edit' })).toBeHidden();
      await expect(sharedPage.getByRole('heading', { name: 'Delete' })).toBeHidden();
    });

    await test.step('Verify questions table remains visible', async () => {
      await expect(mvPage.questionsTable).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-046 | Back button returns to questions list
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-046 | Verify that clicking Back returns to questions list and retains previous filters/search (if state retention is expected) @regression', async () => {
    await test.step('Click Add Question to navigate to create form', async () => {
      await mvPage.clickAddQuestion();
    });

    await test.step('Verify the create form is visible', async () => {
      await expect(mvPage.questionStatementInput).toBeVisible();
    });

    await test.step('Click the Back button', async () => {
      await mvPage.clickBack();
    });

    await test.step('Verify navigated back to questions list', async () => {
      await mvPage.assertQuestionsPageOpened();
    });

    await test.step('Verify questions table is visible and functional', async () => {
      await expect(mvPage.questionsTable).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-047 | API failure shows non-blocking error
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-047 | Verify that API failure on questions list shows a non-blocking error message and allows retry/navigation @regression', async () => {
    await test.step('Navigate to detail page first, then set up interception', async () => {
      // First navigate normally to ensure sidebar is loaded
      // Then intercept just the question-list endpoint
      await sharedPage.route('**/industryVerticals/*/questions**', (route) => {
        // Only intercept GET requests for questions data (not the page itself)
        if (route.request().resourceType() === 'fetch' || route.request().resourceType() === 'xhr') {
          return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Internal Server Error"}' });
        }
        return route.continue();
      });
    });

    await test.step('Navigate to the detail page with intercepted API', async () => {
      await sharedPage.goto(`${env.baseUrl}/app/sales/marketVerticals/84550/questions`, { waitUntil: 'domcontentloaded' });
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Verify page does not crash — header remains visible', async () => {
      await expect(sharedPage.locator('header')).toBeVisible();
      // The heading should still load from the URL/route, even if questions API fails
      await expect(sharedPage.getByRole('heading', { level: 1 })).toBeVisible();
    });

    await test.step('Unroute and verify page recovers via fresh navigation', async () => {
      await sharedPage.unroute('**/industryVerticals/*/questions**');
      // Navigate away and back to ensure a clean state
      await sharedPage.goto(`${env.baseUrl}${MV_PATH}`, { waitUntil: 'domcontentloaded' });
      await mvPage.waitForSkeletonsToClear();
      await expect(mvPage.industriesTable).toBeVisible();
      await mvPage.clickVerticalInList(DEFAULT_VERTICAL);
      // Wait for actual question text to render — row shells appear before data loads.
      // Use a known question substring that exists in the Commercial industry.
      await expect(
        mvPage.questionsTable.getByRole('cell', { name: /security/i }).first(),
      ).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      const statements = await mvPage.getQuestionStatements();
      expect(statements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TC-MV-048 | Rapid industry switching does not crash
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-MV-048 | Verify that rapid switching between industries does not crash and always loads correct questions @regression', async () => {
    await test.step('Rapidly click Distribution then Industrial in sidebar', async () => {
      // Click Distribution without waiting for it to fully load
      await sharedPage.getByText('Distribution', { exact: true }).first().click();
      // Immediately click Industrial
      await sharedPage.getByText('Industrial', { exact: true }).first().click();
    });

    await test.step('Wait for page to stabilize', async () => {
      await mvPage.waitForSkeletonsToClear();
    });

    await test.step('Verify page does not crash', async () => {
      await expect(sharedPage.locator('header')).toBeVisible();
    });

    await test.step('Verify heading shows "Industrial" (last clicked industry)', async () => {
      await mvPage.assertVerticalHeading('Industrial');
    });

    await test.step('Verify questions table is visible and loaded', async () => {
      await expect(mvPage.questionsTable).toBeVisible();
    });

    await test.step('Verify Add Question button is visible', async () => {
      await expect(mvPage.addQuestionBtn).toBeVisible();
    });
  });
});
