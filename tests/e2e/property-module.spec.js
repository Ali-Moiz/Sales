// tests/property-module.spec.js
//
// Smoke Test Suite — Properties Module — Signal CRM
//
// Session design — matches company-module.spec.js exactly:
//   • Single login in beforeAll, one shared browser context for all 17 tests
//   • test.describe — ordered execution, each test depends on previous state
//   • Shared state via module-level variables (createdPropertyName etc.)
//
// Company linkage — fully dynamic:
//   The "Company" dropdown in Create Property requires an existing company.
//   We read from process.env.CREATED_COMPANY_NAME (set by company suite's afterAll)
//   and fall back to 'Regression Phase' (known existing company with related data)
//   if running standalone.

const { test, expect } = require('@playwright/test');
const { performLogin }   = require('../../utils/auth/login-action');
const { PropertyModule } = require('../../pages/property-module');
const {
  readCreatedCompanyName,
  writeCreatedPropertyCompanyName,
  writeCreatedPropertyName,
} = require('../../utils/shared-run-state');
const { DEFAULT_COMPANY_NAME, resolvePropertyCompanyName } = require('../../utils/property-company-selector');
const { registerNotesTasksSuite } = require('../helpers/register-notes-tasks-suite');

test.describe('Property Module', () => {
  // Runtime-selected company name used across the full property suite.
  let targetCompanyName = '';

  // Shared state populated during the test run
  let createdPropertyName;
  let updatedPropertyName;

  let context;
  let page;
  let propertyModule;

  async function ensureCreatedPropertyExists() {
    if (createdPropertyName) {
      return createdPropertyName;
    }

    createdPropertyName = propertyModule.generateUniquePropertyName();
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.createProperty({
      propertyName: createdPropertyName,
      companyName: targetCompanyName
    });
    await propertyModule.assertPropertyCreated();
    process.env.CREATED_PROPERTY_NAME = createdPropertyName;
    process.env.CREATED_PROPERTY_COMPANY_NAME = targetCompanyName;
    writeCreatedPropertyName(createdPropertyName);
    writeCreatedPropertyCompanyName(targetCompanyName);
    await propertyModule.searchProperty(createdPropertyName);
    await propertyModule.openPropertyDetail(createdPropertyName);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    return createdPropertyName;
  }

  async function openCreatedPropertyDetail() {
    const propertyName = await ensureCreatedPropertyExists();
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.searchProperty(propertyName);
    await propertyModule.openPropertyDetail(propertyName);
    await propertyModule.assertPropertyDetailOpened(propertyName);
  }

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    targetCompanyName =
      await resolvePropertyCompanyName() ||
      process.env.CREATED_COMPANY_NAME ||
      readCreatedCompanyName() ||
      DEFAULT_COMPANY_NAME;

    process.env.PROPERTY_TEST_COMPANY = targetCompanyName;
    context        = await browser.newContext();
    page           = await context.newPage();
    propertyModule = new PropertyModule(page);
    await performLogin(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-001 | Properties module opens successfully
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is logged in
   * Steps: Click Properties in sidebar
   * Expected: URL contains /app/sales/locations; "Create Property" button visible
   * Priority: P0 — Critical
   */
  test('TC-PROP-001 | Properties module opens successfully', async () => {
    test.setTimeout(180_000);
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-002 | Properties table displays all expected column headers
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on Properties list page
   * Steps: Inspect table column headers
   * Expected: Property Name, Property Affiliation, Lot Number, Deal Count,
   *           Stage, Type, Created Date, Last Modified Date all visible
   * Priority: P1 — High
   */
  test('TC-PROP-002 | Properties table displays all expected column headers', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.assertPropertiesTableHasColumns();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-003 | Pagination is visible with correct format
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on Properties list page
   * Steps: Observe the pagination row below the table
   * Expected: Shows "X–Y of Z" format; total count > 0
   * Priority: P1 — High
   */
  test('TC-PROP-003 | Pagination is visible with correct format', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.assertPaginationVisible();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-004 | Create Property drawer opens with all required fields
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on Properties list page
   * Steps: Click "Create Property" button
   * Expected: Drawer heading "Create Property" (level=3) visible;
   *           Company (Search Company), Property/Property Name, Property Source,
   *           Choose stage, Select Assignee, Address (Type Address) all visible;
   *           Cancel button present
   * Priority: P0 — Critical
   */
  test('TC-PROP-004 | Create Property drawer opens with all required fields', async () => {
    test.setTimeout(180_000);
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.openCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerOpen();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-005 | Company dropdown searches and shows matching results
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: Create Property drawer is open
   * Steps:
   *   1. Click the "Search Company" heading
   *   2. Type first 4 chars of targetCompanyName in the search box
   * Expected: Tooltip appears with search input and ≥1 paragraph results
   *
   * NOTE: Uses targetCompanyName from env var — the company created by the
   * Company module suite. Makes this test fully dynamic and integrated.
   * Priority: P0 — Critical
   */
  test('TC-PROP-005 | Company dropdown searches and shows matching results', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertCreatePropertyDrawerOpen();

    await propertyModule.companyDropdownTrigger.click();
    const tooltip = page.locator('#simple-popper[role="tooltip"]').first()
      .or(page.getByRole('tooltip').first());
    await tooltip.waitFor({ state: 'visible', timeout: 10_000 });

    const searchInput = tooltip.getByRole('textbox', { name: 'Search' });
    await searchInput.fill(targetCompanyName);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_500);

    const matchingResult = tooltip.getByText(targetCompanyName, { exact: false }).first();
    await expect(matchingResult).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-006 | Cancel Create Property closes drawer without creating record
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: Create Property drawer is open
   * Steps:
   *   1. Type a property name
   *   2. Click Cancel
   * Expected: Drawer closes; "Create Property" heading no longer visible
   * Priority: P1 — High
   */
  test('TC-PROP-006 | Cancel Create Property closes drawer without creating record', async () => {
    test.setTimeout(180_000);
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.openCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerOpen();
    await propertyModule.fillPropertyName('CANCELLED — SHOULD NOT SAVE');
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-007 | User can create a new property linked to existing company
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: Company named by targetCompanyName exists in the system
   * Steps:
   *   1. Click Create Property
   *   2. Select company dynamically (search for targetCompanyName, pick first result)
   *   3. Fill Property Name with a unique timestamp-based name
   *   4. Select Property Source, Stage, Assignee
   *   5. Fill Address with known test-environment address
   *   6. Submit
   * Expected: Drawer closes; property searchable in the list
   * Priority: P0 — Critical
   */
  test('TC-PROP-007 | User can create a new property linked to existing company', async () => {
    test.setTimeout(180_000);
    createdPropertyName = propertyModule.generateUniquePropertyName();

    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.createProperty({
      propertyName: createdPropertyName,
      companyName:  targetCompanyName,
    });

    // Verify property appears in the list after creation
    process.env.CREATED_PROPERTY_NAME = createdPropertyName;
    process.env.CREATED_PROPERTY_COMPANY_NAME = targetCompanyName;
    writeCreatedPropertyName(createdPropertyName);
    writeCreatedPropertyCompanyName(targetCompanyName);
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.searchProperty(createdPropertyName);
    await propertyModule.assertPropertyPresentInSearchResults(createdPropertyName);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-008 | User can search and open an existing property
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: Property created in TC-PROP-007 exists
   * Steps:
   *   1. Navigate to Properties
   *   2. Search for the created property name
   *   3. Click the matching row
   * Expected: URL changes to /locations/location/:id;
   *           Property name heading (level=1) is visible on detail page
   * Priority: P0 — Critical
   */
  test('TC-PROP-008 | User can search and open an existing property', async () => {
    test.setTimeout(180_000);
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.openPropertyDetail(createdPropertyName);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-009 | Property detail page shows all sidebar sections
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps: Observe the left sidebar
   * Expected: Property Details, Companies •, Deals •, Contacts •,
   *           Franchise Associated, Attachments • all visible
   * Priority: P1 — High
   */
  test('TC-PROP-009 | Property detail page shows all sidebar sections', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.assertPropertyDetailSectionsVisible();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-010 | Property detail shows stage bar and all 6 overview tabs
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps: Observe the right panel
   * Expected: "Property Stages" heading (level=5) and stage buttons visible;
   *           Convert Questions (default), Activities, Notes, Tasks,
   *           Emails, Meetings tabs all present
   * Priority: P1 — High
   */
  test('TC-PROP-010 | Property detail shows stage bar and all 6 overview tabs', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.assertPropertyStageBarVisible();
    await propertyModule.assertDetailTabsVisible();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-011 | Activities tab loads and shows at least one dated entry
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps: Click Activities tab
   * Expected: Tab becomes active (aria-selected="true");
   *           At least one date-grouped section (e.g. "March, 2026") visible
   * Priority: P1 — High
   */
  test('TC-PROP-011 | Activities tab loads and shows at least one dated entry', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.gotoActivitiesTab();
    await propertyModule.assertActivitiesTabActive();

    // At least one date-header paragraph visible
    const dateHeader = page.getByText(/\w+,\s+\d{4}/).first();
    await dateHeader.waitFor({ state: 'visible', timeout: 15_000 });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-012 | Edit Property form opens pre-filled; Save disabled without changes
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps:
   *   1. Click Edit button
   * Expected: "Edit Property" drawer (heading level=3) opens;
   *           Property name field is pre-filled;
   *           "Save" button is disabled until a change is made
   * Priority: P1 — High
   */
  test('TC-PROP-012 | Edit Property form opens pre-filled; Save disabled without changes', async () => {
    test.setTimeout(180_000);
    await ensureCreatedPropertyExists();
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.openEditPropertyForm();
    await propertyModule.assertEditPropertyFormOpen();
    await propertyModule.assertSaveEditButtonDisabled();
    await propertyModule.cancelEditPropertyForm();
    await propertyModule.assertEditPropertyFormClosed();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-013 | User can edit property name and verify on detail page
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps:
   *   1. Click Edit
   *   2. Clear the Property Name and fill with a new unique name
   *   3. Submit (click Save)
   * Expected: Drawer closes; detail page heading (level=1) shows updated name
   * Priority: P0 — Critical
   */
  test('TC-PROP-013 | User can edit property name and verify on detail page', async () => {
    test.setTimeout(180_000);
    updatedPropertyName = propertyModule.generateUniqueEditedName();

    await ensureCreatedPropertyExists();
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.openEditPropertyForm();
    await propertyModule.assertEditPropertyFormOpen();
    await propertyModule.fillEditPropertyName(updatedPropertyName);
    await propertyModule.submitEditProperty();
    await propertyModule.assertPropertyDetailOpened(updatedPropertyName);

    // Update reference for remaining tests
    createdPropertyName = updatedPropertyName;
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-014 | Notes tab visible; Create New Note drawer opens correctly
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps:
   *   1. Click Notes tab
   *   2. Click "Create New Note"
   * Expected: Notes tab visible; "Add Notes" drawer (heading level=4) opens;
   *           Subject textbox, rdw-editor, "0 / 5000" counter,
   *           Save and Cancel buttons all visible
   * Priority: P0 — Critical
   */
  test('TC-PROP-014 | Notes tab visible; Create New Note drawer opens with correct fields', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.assertNotesTabVisible();
    await propertyModule.gotoNotesTab();
    await propertyModule.assertCreateNewNoteButtonVisible();
    await propertyModule.openCreateNoteDrawer();
    await propertyModule.assertCreateNoteDrawerOpen();
    await propertyModule.cancelCreateNoteDrawer();
    await propertyModule.assertCreateNoteDrawerClosed();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-015 | Tasks tab shows correct columns and New Task button
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on property detail page
   * Steps: Click Tasks tab
   * Expected: Tasks tab selected; table has Task Title, Task Description,
   *           Created By, Due Date, Priority, Type columns;
   *           "New Task" button visible; "No tasks Added." empty state visible
   * Priority: P0 — Critical
   */
  test('TC-PROP-015 | Tasks tab shows correct columns and New Task button', async () => {
    test.setTimeout(180_000);
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.assertTasksTabVisible();
    await propertyModule.gotoTasksTab();
    await propertyModule.assertTasksTableColumns();
    await propertyModule.assertNewTaskButtonVisible();
    await propertyModule.assertTasksEmptyState();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-016 | Create New Task drawer opens with all required fields
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on Tasks tab of property detail
   * Steps: Click "New Task" button
   * Expected: "Create New Task" drawer (heading level=3) visible;
   *           Task Title textbox, rdw-editor, Type (Select Type) heading,
   *           Priority (Select Priority) heading, Save and Cancel buttons visible
   * Priority: P0 — Critical
   */
  test('TC-PROP-016 | Create New Task drawer opens with all required fields', async () => {
    test.setTimeout(180_000);
    await propertyModule.gotoTasksTab();
    await propertyModule.openCreateTaskDrawer();
    await propertyModule.assertCreateTaskDrawerOpen();
    await propertyModule.cancelCreateTaskDrawer();
    await propertyModule.assertCreateTaskDrawerClosed();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-017 | Searching with non-existent name returns no results
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on Properties list page
   * Steps:
   *   1. Navigate to Properties
   *   2. Type a random non-existent string in the search box
   * Expected: Pagination shows "0–0 of 0"
   * Priority: P1 — High
   */
  test('TC-PROP-017 | Searching with non-existent name returns no results', async () => {
    test.setTimeout(180_000);
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.searchProperty('zzz_no_match_property_xyz_99999');
    await propertyModule.assertSearchShowsNoResults();
    await propertyModule.clearPropertySearch();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-018 | Duplicate address is rejected with geocoordinate error
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions:
   *   - User is logged in
   *   - Property "Dup Address Test Property" already exists in the DB with
   *     address "3500 Dodge St, Omaha, NE 68131" (created during exploratory
   *     session 2026-03-24).  The app geocodes this to a specific lat/lng pair
   *     via Google Maps and stores those coordinates.  Any subsequent property
   *     submission that resolves to the SAME lat/lng will be rejected.
   *
   * Steps:
   *   1. Navigate to Properties list
   *   2. Open the Create Property drawer
   *   3. Fill all required fields (Company, Property Name, Source, Franchise,
   *      Stage, Affiliation, Assignee, Contact)
   *   4. Enter the known-duplicate address: "3500 Dodge St, Omaha"
   *   5. Submit the form
   *
   * Expected:
   *   - Toast alert: "Latitude and longitude has already been taken"
   *   - Create Property drawer remains OPEN (form data is preserved)
   *   - No new property is created
   *
   * Priority: P1 — High
   *
   * Implementation note:
   *   Uniqueness is enforced on GEOCODED COORDINATES, not raw address strings.
   *   Two differently-formatted strings that resolve to the same lat/lng will
   *   both fail this check.  Live-verified 2026-03-24.
   */
  test('TC-PROP-018 | Duplicate address is rejected with geocoordinate error', async () => {
    test.setTimeout(180_000);

    // ── Step 1: Navigate to Properties ──────────────────────────────────────
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();

    // ── Step 2: Open Create Property drawer ─────────────────────────────────
    await propertyModule.openCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerOpen();

    // ── Step 3: Fill required fields ────────────────────────────────────────
    // Use a unique timestamp name so the property name itself is not a
    // duplicate — only the geocoded address should trigger the error.
    const dupTestPropertyName = propertyModule.generateUniquePropertyName();
    await propertyModule.selectCompanyInCreateForm('A-C 6548');
    await propertyModule.fillPropertyName(dupTestPropertyName);
    await propertyModule.selectPropertySource();
    await propertyModule.selectAssociatedFranchise();
    await propertyModule.selectStage();
    await propertyModule.selectPropertyAffiliations();
    await propertyModule.selectAssignee();
    await propertyModule.selectContactAffiliation();

    // ── Step 4: Enter the known-duplicate address ────────────────────────────
    // "3500 Dodge St, Omaha, NE 68131" is already saved in the DB.
    // Geocoding this string returns the same lat/lng as the existing property.
    await propertyModule.fillDuplicateAddress('3500 Dodge St, Omaha, NE');

    // ── Step 5: Submit and verify duplicate-address rejection ────────────────
    // submitAndExpectDuplicateAddressError() clicks Submit, waits for the
    // "Latitude and longitude has already been taken" alert toast, then asserts
    // the drawer is still visible (not auto-closed).
    await propertyModule.submitAndExpectBlockedDuplicateAddress();

    // ── Clean up: dismiss the drawer ────────────────────────────────────────
    await propertyModule.cancelCreatePropertyDrawer();

    // ── Verify duplicate property was not created ──────────────────────────
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
    await propertyModule.searchProperty(dupTestPropertyName);
    await propertyModule.assertSearchShowsNoResults();
    await propertyModule.clearPropertySearch();
  });

  registerNotesTasksSuite({
    test,
    moduleName: 'Property',
    getPage: () => page,
    openEntityDetail: openCreatedPropertyDetail,
  });
});
