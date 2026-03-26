// tests/deal-module.spec.js
//
// Smoke Test Suite — Deals Module — Signal CRM
//
// Session design — matches company/property spec pattern exactly:
//   • Single login in beforeAll, shared context for ALL tests
//   • test.describe.serial — ordered execution
//   • test.beforeEach navigates to Deals page (same as original)
//   • Shared state via module-level variables
//
// Dynamic linking:
//   • CREATED_COMPANY_NAME  — set by company suite afterAll (or fallback 'A-C 6548')
//   • CREATED_PROPERTY_NAME — set by property suite afterAll (or fallback 'regression location phase 2')
//   Deal create uses BOTH so the entire flow is end-to-end integrated.
//   Property prefix: 'A-P' as requested — generated via propertyModule.generateUniquePropertyName()
//   in the property suite. When running the full pipeline these will resolve automatically.

const { test, expect } = require('@playwright/test');
const { DealModule }   = require('../../pages/deal-module');
const { performLogin } = require('../../utils/auth/login-action');
const { writeCreatedDealName } = require('../../utils/shared-run-state');

test.describe.serial('Deal Module', () => {
  // Dynamic — populated by preceding suites via env vars, or fallback for standalone run
  const targetCompanyName =
    process.env.DEAL_TEST_COMPANY ||
    process.env.CREATED_COMPANY_NAME ||
    'Regression Phase 2';
  const targetPropertyName =
    process.env.DEAL_TEST_PROPERTY ||
    process.env.CREATED_PROPERTY_NAME ||
    'Regression Location Phase 2';

  let context;
  let page;
  let dealModule;
  let createdDealName;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    context    = await browser.newContext();
    page       = await context.newPage();
    dealModule = new DealModule(page);
    await performLogin(page);
  });

  test.beforeEach(async () => {
    await dealModule.gotoDealsFromMenu();
    await dealModule.assertDealsPageOpened();
  });

  test.afterAll(async () => {
    await context.close();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  ORIGINAL TESTS — DO NOT MODIFY
  // ══════════════════════════════════════════════════════════════════════

  test('TC-DEAL-001 | Deals module opens successfully', async () => {
    test.setTimeout(180_000);
    await dealModule.assertDealsPageOpened();
  });

  test('TC-DEAL-002 | User can create a deal successfully', async () => {
    test.setTimeout(180_000);
    createdDealName = dealModule.generateUniqueDealName();

    await dealModule.createDeal({
      dealName: createdDealName,
      companySearchText:  targetCompanyName.substring(0, 4),
      companyOptionText:  targetCompanyName,
      propertySearchText: targetPropertyName.substring(0, 6),
      propertyOptionText: targetPropertyName
    });

    await dealModule.assertDealCreated();
    writeCreatedDealName(createdDealName);
  });

  // ══════════════════════════════════════════════════════════════════════
  //  NEW SMOKE TESTS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-DEAL-003 | Deals table displays all expected column headers
   *
   * Preconditions: User is on Deals list page
   * Steps: Inspect table column headers
   * Expected: Deal Name, Amount, Deal Owner, Stage, Deal Type,
   *           Property, Address, Created Date, Last Modified Date visible
   * Priority: P1 — High
   */
  test('TC-DEAL-003 | Deals table displays all expected column headers', async () => {
    test.setTimeout(180_000);
    await dealModule.assertDealsTableHasColumns();
  });

  /**
   * TC-DEAL-004 | Pagination is visible with correct format
   *
   * Preconditions: User is on Deals list page
   * Steps: Observe pagination row
   * Expected: Shows "X–Y of Z" format; total > 0
   * Priority: P1 — High
   */
  test('TC-DEAL-004 | Pagination is visible with correct format', async () => {
    test.setTimeout(180_000);
    await dealModule.assertPaginationVisible();
  });

  /**
   * TC-DEAL-005 | Create Deal drawer opens with all required fields
   *
   * Preconditions: User is on Deals list page
   * Steps: Click "Create Deal" button
   * Expected: Drawer heading "Create Deal" (level=3) visible;
   *           Deal Name textbox, Company (Select Company), Property
   *           (Select Property / Property Name) dropdowns visible;
   *           Cancel button present
   * Priority: P0 — Critical
   */
  test('TC-DEAL-005 | Create Deal drawer opens with all required fields', async () => {
    test.setTimeout(180_000);
    await dealModule.openCreateDealModal();
    await dealModule.assertCreateDealDrawerOpen();
  });

  /**
   * TC-DEAL-006 | Company dropdown in Create Deal searches and shows results
   *
   * Preconditions: Create Deal drawer is open
   * Steps:
   *   1. Click "Select Company" heading
   *   2. Search for targetCompanyName prefix
   * Expected: Tooltip with search input; ≥1 paragraph result visible
   *
   * Uses targetCompanyName — the company created/used by Company module suite.
   * Priority: P0 — Critical
   */
  test('TC-DEAL-006 | Company dropdown searches and shows matching results', async () => {
    test.setTimeout(180_000);
    await dealModule.openCreateDealModal();
    await dealModule.assertCreateDealDrawerOpen();

    await dealModule.companySelector.click();
    const tooltip = page.locator('#simple-popper[role="tooltip"]').last()
      .or(page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 10_000 });

    const searchBox = tooltip.getByRole('textbox', { name: 'Search' });
    await searchBox.fill(targetCompanyName);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);

    const matchingResult = tooltip.getByText(targetCompanyName, { exact: false }).first();
    await expect(matchingResult).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  /**
   * TC-DEAL-007 | Property dropdown in Create Deal searches and shows results
   *
   * Preconditions: Create Deal drawer is open
   * Steps:
   *   1. First select a company (required before property dropdown activates)
   *   2. Click "Select Property / Property Name" heading
   *   3. Search for targetPropertyName prefix
   * Expected: Tooltip with search input; ≥1 paragraph result visible
   *
   * Uses targetPropertyName — the property created by Property module suite.
   * Priority: P0 — Critical
   */
  test('TC-DEAL-007 | Property dropdown searches and shows matching results', async () => {
    test.setTimeout(180_000);
    await dealModule.openCreateDealModal();
    await dealModule.assertCreateDealDrawerOpen();
    // Select company first — property dropdown requires a company to be selected
    await dealModule.selectCompany(targetCompanyName.substring(0, 4), targetCompanyName);
    await page.waitForTimeout(2_000);

    await dealModule.propertySelector.click({ force: true });
    const tooltip = page.locator('#simple-popper[role="tooltip"]').last()
      .or(page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 10_000 });

    const searchBox = tooltip.getByRole('textbox', { name: 'Search' });
    await searchBox.fill(targetPropertyName);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);

    const matchingResult = tooltip.getByText(targetPropertyName, { exact: false }).first();
    await expect(matchingResult).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  /**
   * TC-DEAL-008 | Cancel Create Deal closes drawer without creating record
   *
   * Preconditions: Create Deal drawer is open
   * Steps:
   *   1. Type a deal name
   *   2. Click Cancel
   * Expected: Drawer closes; "Create Deal" heading no longer visible
   * Priority: P1 — High
   */
  test('TC-DEAL-008 | Cancel Create Deal closes drawer without creating record', async () => {
    test.setTimeout(180_000);
    const cancelledDealName = `CANCELLED DEAL ${String(Date.now()).slice(-4)}`;
    await dealModule.openCreateDealModal();
    await dealModule.fillDealName(cancelledDealName);
    await dealModule.cancelCreateDeal();
    await dealModule.assertCreateDealDrawerClosed();
    await dealModule.searchDeal(cancelledDealName);
    await dealModule.assertSearchShowsNoResults(cancelledDealName);
    await dealModule.clearDealSearch();
  });

  /**
   * TC-DEAL-009 | Created deal linked to dynamic company and property is searchable
   *
   * Preconditions: Deal from TC-DEAL-002 exists
   * Steps:
   *   1. Search for the created deal name on Deals listing
   *   2. Verify matching row is visible
   * Expected: Created deal appears in list search results
   * Priority: P0 — Critical
   */
  test('TC-DEAL-009 | Created deal linked to dynamic company and property is searchable', async () => {
    test.setTimeout(180_000);
    await dealModule.searchDeal(createdDealName);
    await expect(page.getByText(createdDealName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await dealModule.clearDealSearch();
  });

  /**
   * TC-DEAL-010 | User can search and open an existing deal
   *
   * Preconditions: Deal created in TC-DEAL-009 exists
   * Steps:
   *   1. Navigate to Deals
   *   2. Search for the created deal name
   *   3. Click the matching row
   * Expected: URL changes to /deals/deal/:id;
   *           Deal name heading (level=2) visible on detail page
   * Priority: P0 — Critical
   */
  test('TC-DEAL-010 | User can search and open an existing deal', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.assertDealDetailOpened(createdDealName);
  });

  /**
   * TC-DEAL-011 | Deal detail page shows all sidebar sections
   *
   * Preconditions: User is on deal detail page
   * Steps: Observe sidebar
   * Expected: About this Deal, Company, Property Details, Contact,
   *           Franchise Associated, Attachments • sections all visible
   * Priority: P1 — High
   */
  test('TC-DEAL-011 | Deal detail page shows all sidebar sections', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.assertDealDetailOpened(createdDealName);
    await dealModule.assertDealDetailSectionsVisible();
  });

  /**
   * TC-DEAL-012 | Deal detail page shows stages bar and all overview tabs
   *
   * Preconditions: User is on deal detail page
   * Steps: Observe the right panel
   * Expected: "Deal Stages" heading (level=5) and Proposal Creation stage button visible;
   *           Contract & Terms (default), Activities, Notes, Tasks tabs all present
   * Priority: P1 — High
   */
  test('TC-DEAL-012 | Deal detail shows stages bar and all overview tabs', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.assertDealDetailOpened(createdDealName);
    await dealModule.assertDealStagesBarVisible();
    await dealModule.assertDealDetailTabsVisible();
  });

  /**
   * TC-DEAL-013 | Activities tab loads with at least one dated entry
   *
   * Preconditions: User is on deal detail page
   * Steps: Click Activities tab
   * Expected: Tab becomes active (aria-selected="true");
   *           At least one date-grouped section (e.g. "March, 2026") visible
   * Priority: P1 — High
   */
  test('TC-DEAL-013 | Activities tab loads with at least one dated entry', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.assertDealDetailOpened(createdDealName);
    await dealModule.gotoActivitiesTab();
    await dealModule.assertActivitiesTabActive();
    const dateHeader = page.getByText(/\w+,\s+\d{4}/).first();
    await dateHeader.waitFor({ state: 'visible', timeout: 15_000 });
  });

  /**
   * TC-DEAL-014 | Notes tab visible; Create New Note drawer opens with correct fields
   *
   * Preconditions: User is on deal detail page
   * Steps:
   *   1. Click Notes tab
   *   2. Click "Create New Note"
   * Expected: Notes tab visible; "Add Notes" drawer (heading level=4) opens;
   *           Subject textbox, rdw-editor, "0 / 5000" counter,
   *           Save and Cancel buttons all visible
   * Priority: P0 — Critical
   */
  test('TC-DEAL-014 | Notes tab visible; Create New Note drawer opens with correct fields', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.assertDealDetailOpened(createdDealName);
    await dealModule.assertNotesTabVisible();
    await dealModule.gotoNotesTab();
    await dealModule.assertCreateNewNoteButtonVisible();
    await dealModule.openCreateNoteDrawer();
    await dealModule.assertCreateNoteDrawerOpen();
    await dealModule.cancelCreateNoteDrawer();
    await dealModule.assertCreateNoteDrawerClosed();
  });

  /**
   * TC-DEAL-015 | Tasks tab shows correct columns and New Task button
   *
   * Preconditions: User is on deal detail page
   * Steps: Click Tasks tab
   * Expected: Tasks tab selected; table has Task Title, Task Description,
   *           Created By, Due Date, Priority, Type columns;
   *           "New Task" button visible
   * Priority: P0 — Critical
   */
  test('TC-DEAL-015 | Tasks tab shows correct columns and New Task button', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.assertDealDetailOpened(createdDealName);
    await dealModule.assertTasksTabVisible();
    await dealModule.gotoTasksTab();
    await dealModule.assertTasksTableColumns();
    await dealModule.assertNewTaskButtonVisible();
  });

  /**
   * TC-DEAL-016 | Create New Task drawer opens with all required fields
   *
   * Preconditions: User is on Tasks tab of deal detail
   * Steps: Click "New Task" button
   * Expected: "Create New Task" drawer (heading level=3) visible;
   *           Task Title textbox, rdw-editor, Type (Select Type) heading,
   *           Priority (Select Priority) heading, Save and Cancel visible
   * Priority: P0 — Critical
   */
  test('TC-DEAL-016 | Create New Task drawer opens with all required fields', async () => {
    test.setTimeout(180_000);
    await dealModule.openDealDetail(createdDealName);
    await dealModule.gotoTasksTab();
    await dealModule.openCreateTaskDrawer();
    await dealModule.assertCreateTaskDrawerOpen();
    await dealModule.cancelCreateTaskDrawer();
    await dealModule.assertCreateTaskDrawerClosed();
  });

  /**
   * TC-DEAL-017 | Searching with non-existent deal name returns no results
   *
   * Preconditions: User is on Deals list page
   * Steps:
   *   1. Type a random non-existent string in the search box
   * Expected: Pagination shows "0–0 of 0"
   * Priority: P1 — High
   */
  test('TC-DEAL-017 | Searching with non-existent deal name returns no results', async () => {
    test.setTimeout(180_000);
    await dealModule.searchDeal('zzz_no_match_deal_xyz_99999');
    await dealModule.assertSearchShowsNoResults();
    await dealModule.clearDealSearch();
  });
});
