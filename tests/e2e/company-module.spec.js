const { test } = require('@playwright/test');
const { performLogin }   = require('../../utils/auth/login-action');
const { CompanyModule }  = require('../../pages/company-module');
const { writeCreatedCompanyName } = require('../../utils/shared-run-state');
const { registerNotesTasksSuite } = require('../helpers/register-notes-tasks-suite');

test.describe.serial('Company Module', () => {
  const companyAddress = 'S 9th St, Omaha, NE 68102, USA';
  let createdCompanyName = '';
  let updatedCompanyDetails;
  let context;
  let page;
  let companyModule;

  async function ensureCreatedCompanyDetailOpened() {
    const companyName = await ensureCreatedCompanyExists();
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.openCompanyDetail(companyName);
    await companyModule.assertCompanyDetailOpened(companyName);
    return companyName;
  }

  async function ensureCreatedCompanyExists() {
    if (createdCompanyName) {
      return createdCompanyName;
    }

    createdCompanyName = companyModule.generateUniqueCompanyName();
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.createCompany({
      companyName: createdCompanyName,
      address: companyAddress,
    });
    process.env.CREATED_COMPANY_NAME = createdCompanyName;
    writeCreatedCompanyName(createdCompanyName);
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.searchForCompany(createdCompanyName);
    await companyModule.openCompanyDetail(createdCompanyName);
    await companyModule.assertCompanyDetailOpened(createdCompanyName);

    return createdCompanyName;
  }

  async function openCreatedCompanyDetail() {
    const companyName = await ensureCreatedCompanyExists();
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.openCompanyDetail(companyName);
    await companyModule.assertCompanyDetailOpened(companyName);
  }

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    context = await browser.newContext();
    page    = await context.newPage();
    companyModule = new CompanyModule(page);

    await performLogin(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  ORIGINAL TESTS — DO NOT MODIFY
  // ══════════════════════════════════════════════════════════════════════════

  test('TC-COMP-001 | Companies module opens successfully', async () => {
    test.setTimeout(180_000);
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
  });

  test('TC-COMP-002 | User can search and open the newly created company successfully', async () => {
    test.setTimeout(180_000);
    const companyName = await ensureCreatedCompanyExists();
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.searchForCompany(companyName);
    await companyModule.openCompanyDetail(companyName);
    await companyModule.assertCompanyDetailOpened(companyName);
  });

  test('TC-COMP-003 | Activities tab shows company creation activity for the created company', async () => {
    test.setTimeout(180_000);
    const companyName = await ensureCreatedCompanyExists();
    await companyModule.assertCompanyDetailOpened(companyName);
    await companyModule.gotoActivitiesTab();
    await companyModule.assertCompanyCreationActivity(companyName);
  });

  test('TC-COMP-004 | User can edit the searched company and verify updated values in About this Company', async () => {
    test.setTimeout(180_000);
    updatedCompanyDetails = companyModule.generateRandomCompanyEditData();
    await ensureCreatedCompanyDetailOpened();
    await companyModule.updateCompanyDetails(updatedCompanyDetails);
    await companyModule.openAboutCompanySection();
    await companyModule.assertAboutCompanyDetails(updatedCompanyDetails);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  NEW SMOKE TESTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * TC-COMP-005 | Companies table displays all expected column headers
   *
   * Preconditions: User is on the Companies list page
   * Steps:
   *   1. Navigate to Companies module
   *   2. Inspect table column headers
   * Expected: Company Name, Parent Company, Company Owner, Market Vertical,
   *           Sub Market Vertical, Revenue, Created Date, Last Modified Date
   *           columns are all visible
   * Priority: P1 — High
   */
  test('TC-COMP-005 | Companies table displays all expected column headers', async () => {
    test.setTimeout(180_000);
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.assertCompaniesTableHasColumns();
  });

  /**
   * TC-COMP-006 | Create Company modal opens with all required fields visible
   *
   * Preconditions: User is on the Companies list page
   * Steps:
   *   1. Click the "Create Company" button
   * Expected: Modal heading "Create a New Company" is visible;
   *           Company Name, Market Vertical (Select Industry), Address fields present;
   *           Cancel button present
   * Priority: P0 — Critical
   */
  test('TC-COMP-006 | Create Company modal opens with all required fields visible', async () => {
    test.setTimeout(180_000);
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.openCreateCompanyModal();
    await companyModule.assertCreateCompanyModalOpen();
  });

  /**
   * TC-COMP-007 | Create Company submit button is disabled without required fields
   *
   * Preconditions: Create Company modal is open
   * Steps:
   *   1. Open Create Company modal
   *   2. Do NOT fill any required fields
   *   3. Inspect the Create Company submit button
   * Expected: Submit button is disabled until Company Name, Market Vertical,
   *           and Address are filled
   * Priority: P1 — High
   */
  test('TC-COMP-007 | Create Company submit button is disabled without required fields', async () => {
    test.setTimeout(180_000);
    await companyModule.assertCreateCompanyModalOpen();
    await companyModule.assertCreateCompanySubmitDisabled();
  });

  /**
   * TC-COMP-008 | Cancel on Create Company modal closes it without creating a record
   *
   * Preconditions: Create Company modal is open
   * Steps:
   *   1. Type a company name in the input
   *   2. Click Cancel
   * Expected: Modal closes; no new company appears in the list
   * Priority: P1 — High
   */
  test('TC-COMP-008 | Cancel on Create Company modal closes it without creating a record', async () => {
    test.setTimeout(180_000);
    await companyModule.assertCreateCompanyModalOpen();
    await companyModule.fillCompanyName('CANCELLED — SHOULD NOT SAVE');
    await companyModule.cancelCreateCompanyModal();
    await companyModule.assertCreateCompanyModalClosed();
  });

  /**
   * TC-COMP-009 | Searching with a non-existent company name returns no results
   *
   * Preconditions: User is on the Companies list page
   * Steps:
   *   1. Navigate to Companies module
   *   2. Type a random non-existent string in the search box
   * Expected: Table shows 0–0 of 0 (no results)
   * Priority: P1 — High
   */
  test('TC-COMP-009 | Searching with a non-existent company name returns no results', async () => {
    test.setTimeout(180_000);
    const companyName = await ensureCreatedCompanyExists();
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.searchForCompany('zzz_no_match_company_xyz_99999');
    await companyModule.assertSearchShowsNoResults(companyName);
    await companyModule.clearCompanySearch();
  });

  /**
   * TC-COMP-010 | Market Vertical filter dropdown shows all correct options
   *
   * Preconditions: User is on the Companies list page
   * Steps:
   *   1. Navigate to Companies module
   *   2. Click the "Market Vertical" filter heading
   * Expected: Tooltip shows: Commercial, Distribution, Industrial,
   *           Manufacturing, Residential
   * Priority: P2 — Medium
   */
  test('TC-COMP-010 | Market Vertical filter dropdown shows all correct options', async () => {
    test.setTimeout(180_000);
    await companyModule.gotoCompaniesFromMenu();
    await companyModule.assertCompaniesPageOpened();
    await companyModule.assertMarketVerticalFilterOptions();
  });

  /**
   * TC-COMP-011 | Company detail page shows all sidebar sections
   *
   * Preconditions: User has opened the target company detail page
   * Steps:
   *   1. Navigate to Companies module
   *   2. Search and open target company
   * Expected: About this Company, Properties, Deals, Contacts,
   *           Attachments accordion sections are all visible
   * Priority: P1 — High
   */
  test('TC-COMP-011 | Company detail page shows all sidebar sections', async () => {
    test.setTimeout(180_000);
    await ensureCreatedCompanyDetailOpened();
    await companyModule.assertCompanyDetailSectionsVisible();
  });

  /**
   * TC-COMP-012 | Notes tab is visible and Create New Note drawer opens with correct fields
   *
   * Preconditions: User is on company detail page
   * Steps:
   *   1. Click the "Notes" tab
   *   2. Click "Create New Note"
   * Expected: Tab visible; "Add Notes" drawer opens with Subject field,
   *           description editor (rdw-editor), char counter "0 / 5000",
   *           Save and Cancel buttons
   * Priority: P0 — Critical
   */
  test('TC-COMP-012 | Notes tab is visible and Create New Note drawer opens with correct fields', async () => {
    test.setTimeout(180_000);
    await ensureCreatedCompanyDetailOpened();
    await companyModule.assertNotesTabVisible();
    await companyModule.gotoNotesTab();
    await companyModule.assertCreateNewNoteButtonVisible();
    await companyModule.openCreateNoteDrawer();
    await companyModule.assertCreateNoteDrawerOpen();
    await companyModule.cancelCreateNoteDrawer();
    await companyModule.assertCreateNoteDrawerClosed();
  });

  /**
   * TC-COMP-013 | Tasks tab shows table with correct columns, New Task button, and empty state
   *
   * Preconditions: User is on company detail page
   * Steps:
   *   1. Click the "Tasks" tab
   * Expected: Tasks tab visible; table has Task Title, Task Description,
   *           Created By, Due Date, Priority, Type columns;
   *           "New Task" button visible; empty state "No tasks Added." visible
   * Priority: P0 — Critical
   */
  test('TC-COMP-013 | Tasks tab shows correct columns, New Task button, and empty state', async () => {
    test.setTimeout(180_000);
    await ensureCreatedCompanyDetailOpened();
    await companyModule.assertTasksTabVisible();
    await companyModule.gotoTasksTab();
    await companyModule.assertTasksTableColumns();
    await companyModule.assertNewTaskButtonVisible();
    await companyModule.assertTasksEmptyState();
  });

  /**
   * TC-COMP-014 | Create New Task drawer opens with all required fields
   *
   * Preconditions: User is on Tasks tab of company detail
   * Steps:
   *   1. Click "New Task" button
   * Expected: Drawer heading "Create New Task" is visible;
   *           Task Title, description editor, Type (Select Type),
   *           Priority (Select Priority) dropdowns, Save, Cancel visible
   * Priority: P0 — Critical
   */
  test('TC-COMP-014 | Create New Task drawer opens with all required fields', async () => {
    test.setTimeout(180_000);
    await ensureCreatedCompanyDetailOpened();
    await companyModule.gotoTasksTab();
    await companyModule.openCreateTaskDrawer();
    await companyModule.assertCreateTaskDrawerOpen();
    await companyModule.cancelCreateTaskDrawer();
    await companyModule.assertCreateTaskDrawerClosed();
  });

  /**
   * TC-COMP-015 | Edit Company form opens with pre-filled data; Update button disabled without changes
   *
   * Preconditions: User is on company detail page
   * Steps:
   *   1. Click Edit button on the company detail page
   * Expected: Edit Company drawer opens; all fields (Sub Market Vertical,
   *           NAICS Codes, Revenue, Year Founded) are pre-filled with existing values;
   *           Update Company button is disabled until a change is made
   * Priority: P1 — High
   */
  test('TC-COMP-015 | Edit Company form opens with pre-filled data and Update button is disabled without changes', async () => {
    test.setTimeout(180_000);
    await ensureCreatedCompanyDetailOpened();
    await companyModule.openEditCompanyForm();
    await companyModule.assertEditCompanyFormOpen();
    await companyModule.assertUpdateButtonDisabled();
    await companyModule.cancelEditCompanyForm();
    await companyModule.assertEditCompanyFormClosed();
  });

  registerNotesTasksSuite({
    test,
    moduleName: 'Company',
    getPage: () => page,
    openEntityDetail: openCreatedCompanyDetail,
  });
});
