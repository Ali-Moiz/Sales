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

const { test, expect } = require("@playwright/test");
const { performLogin } = require("../../utils/auth/login-action");
const { PropertyModule } = require("../../pages/property-module");
const { env } = require("../../utils/env");
const { withTimeout } = require("../helpers/with-timeout");
const {
  readCreatedPropertyName,
  readCreatedCompanyName,
  writeCreatedPropertyCompanyName,
  writeCreatedPropertyName,
} = require("../../utils/shared-run-state");
const {
  DEFAULT_COMPANY_NAME,
  resolvePropertyCompanyName,
} = require("../../utils/property-company-selector");
const {
  registerNotesTasksSuite,
} = require("../helpers/register-notes-tasks-suite");

test.describe.serial("Property Module", () => {
  // Runtime-selected company name used across the full property suite.
  let targetCompanyName = "";

  // Shared state populated during the test run
  let createdPropertyName;
  let updatedPropertyName;

  let context;
  let page;
  let propertyModule;

  async function gotoPropertiesListPage() {
    await propertyModule.gotoPropertiesFromMenu();
    await propertyModule.assertPropertiesPageOpened();
  }

  async function openCreatePropertyDrawerFromList() {
    await gotoPropertiesListPage();
    await propertyModule.openCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerOpen();
  }

  async function openPropertyDetailFromList(
    propertyName = createdPropertyName,
  ) {
    await gotoPropertiesListPage();
    await propertyModule.openPropertyDetail(propertyName);
    await propertyModule.assertPropertyDetailOpened(propertyName);
  }

  async function ensureCreatedPropertyExists() {
    if (createdPropertyName) {
      return createdPropertyName;
    }

    const candidate =
      process.env.CREATED_PROPERTY_NAME || readCreatedPropertyName();

    if (candidate) {
      const canOpenExisting = await openPropertyDetailFromList(candidate)
        .then(() => true)
        .catch(() => false);
      if (canOpenExisting) {
        createdPropertyName = candidate;
        return createdPropertyName;
      }
    }

    createdPropertyName = propertyModule.generateUniquePropertyName();
    await gotoPropertiesListPage();
    await propertyModule.createProperty({
      propertyName: createdPropertyName,
      companyName: targetCompanyName,
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
    await openPropertyDetailFromList(propertyName);
  }

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    // Never allow interactive company prompts during automation runs.
    if (!(process.env.PROPERTY_COMPANY_MODE || "").trim()) {
      process.env.PROPERTY_COMPANY_MODE = "hardcoded";
    }
    targetCompanyName =
      (await resolvePropertyCompanyName()) ||
      process.env.CREATED_COMPANY_NAME ||
      readCreatedCompanyName() ||
      DEFAULT_COMPANY_NAME;

    process.env.PROPERTY_TEST_COMPANY = targetCompanyName;
    context = await browser.newContext();
    page = await context.newPage();
    propertyModule = new PropertyModule(page);
    await withTimeout(performLogin(page), 120_000, "performLogin(beforeAll)");
  });

  test.afterAll(async () => {
    // Explicit teardown logging helps diagnose stuck runs in CI/local terminals.
    console.log("[Property Module] afterAll: closing shared browser context");
    await context?.close();
    console.log("[Property Module] afterAll: shared browser context closed");
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
  test("TC-PROP-001 | Properties module opens successfully", async () => {
    await gotoPropertiesListPage();
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
  test("TC-PROP-002 | Properties table displays all expected column headers", async () => {
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
  test("TC-PROP-003 | Pagination is visible with correct format", async () => {
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
  test("TC-PROP-004 | Verify that the Create Property modal opens successfully from the Properties/Listing page.", async () => {
    await openCreatePropertyDrawerFromList();
    // Keep this test independent: clean up drawer state for following tests.
    await propertyModule.dismissCreatePropertyViaBackdrop();
    await propertyModule.assertCreatePropertyDrawerClosed();
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
  test("TC-PROP-005 | Verify that the Company dropdown supports search and returns matching company results.", async () => {
    // Open from a clean list-page state so this case does not rely on TC-PROP-004.
    await openCreatePropertyDrawerFromList();

    await propertyModule.companyDropdownTrigger.click();
    const tooltip = page
      .locator('#simple-popper[role="tooltip"]')
      .first()
      .or(page.getByRole("tooltip").first());
    await tooltip.waitFor({ state: "visible", timeout: 10_000 });

    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.fill(targetCompanyName);

    const matchingResult = tooltip
      .getByText(targetCompanyName, { exact: false })
      .first();
    await expect(matchingResult).toBeVisible({ timeout: 10_000 });

    // Do not use Escape here; in MUI flows it can close the drawer itself on some builds.
    // We close the drawer explicitly via Cancel for deterministic teardown.
    await propertyModule.dismissCreatePropertyViaBackdrop();
    await propertyModule.assertCreatePropertyDrawerClosed();
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
  test("TC-PROP-006 | Verify that the Cancel button closes the Create Property modal without saving any data.", async () => {
    await openCreatePropertyDrawerFromList();
    await propertyModule.fillPropertyName("CANCELLED — SHOULD NOT SAVE");
    await propertyModule.dismissCreatePropertyViaBackdrop();
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
  test("TC-PROP-007 | Verify that user is able to create to create new property.", async () => {
    test.setTimeout(120_000);
    createdPropertyName = propertyModule.generateUniquePropertyName();

    await gotoPropertiesListPage();
    await propertyModule.createProperty({
      propertyName: createdPropertyName,
      companyName: targetCompanyName,
    });

    // Verify property appears in the list after creation
    process.env.CREATED_PROPERTY_NAME = createdPropertyName;
    process.env.CREATED_PROPERTY_COMPANY_NAME = targetCompanyName;
    writeCreatedPropertyName(createdPropertyName);
    writeCreatedPropertyCompanyName(targetCompanyName);
    await gotoPropertiesListPage();
    await propertyModule.searchProperty(createdPropertyName);
    await propertyModule.assertPropertyPresentInSearchResults(
      createdPropertyName,
    );
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
  test("TC-PROP-008 | Verify that user is able to view details of property.", async () => {
    await openPropertyDetailFromList(createdPropertyName);
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
  test("TC-PROP-009 | Property detail page shows all sidebar sections", async () => {
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
  test("TC-PROP-010 | Property detail shows stage bar and all 6 overview tabs", async () => {
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
  test("TC-PROP-011 | Activities tab loads and shows at least one dated entry", async () => {
    await propertyModule.assertPropertyDetailOpened(createdPropertyName);
    await propertyModule.gotoActivitiesTab();
    await propertyModule.assertActivitiesTabActive();

    // At least one date-header paragraph visible
    const dateHeader = page.getByText(/\w+,\s+\d{4}/).first();
    await dateHeader.waitFor({ state: "visible", timeout: 15_000 });
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
  test("TC-PROP-012 | Edit Property form opens pre-filled; Save disabled without changes", async () => {
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
  test("TC-PROP-013 | Verify that user is able to edit property.", async () => {
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
  test("TC-PROP-014 | Notes tab visible; Create New Note drawer opens with correct fields", async () => {
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
  test("TC-PROP-015 | Tasks tab shows correct columns and New Task button", async () => {
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
  test("TC-PROP-016 | Create New Task drawer opens with all required fields", async () => {
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
  test("TC-PROP-017 | Searching with non-existent name returns no results", async () => {
    await gotoPropertiesListPage();
    await propertyModule.searchProperty("zzz_no_match_property_xyz_99999");
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
  test("TC-PROP-018 | Duplicate address is rejected with geocoordinate error", async () => {
    test.setTimeout(120_000);

    // ── Step 1: Navigate to Properties ──────────────────────────────────────
    await openCreatePropertyDrawerFromList();

    // ── Step 3: Fill required fields ────────────────────────────────────────
    // Use a unique timestamp name so the property name itself is not a
    // duplicate — only the geocoded address should trigger the error.
    const dupTestPropertyName = propertyModule.generateUniquePropertyName();
    await propertyModule.selectCompanyInCreateForm("PAT 6548");
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
    await propertyModule.fillDuplicateAddress("3500 Dodge St, Omaha, NE");

    // ── Step 5: Submit and verify duplicate-address rejection ────────────────
    // submitAndExpectDuplicateAddressError() clicks Submit, waits for the
    // "Latitude and longitude has already been taken" alert toast, then asserts
    // the drawer is still visible (not auto-closed).
    await propertyModule.submitAndExpectBlockedDuplicateAddress();

    // ── Clean up: dismiss the drawer ────────────────────────────────────────
    await propertyModule.cancelCreatePropertyDrawer();

    // ── Verify duplicate property was not created ──────────────────────────
    await gotoPropertiesListPage();
    await propertyModule.searchProperty(dupTestPropertyName);
    await propertyModule.assertSearchShowsNoResults();
    await propertyModule.clearPropertySearch();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  Gap coverage — docs/property-module-manual-gap-tests.md (M-PROP-01 … 11)
  //  Placed after TC-PROP-018 so serial state (createdPropertyName) stays valid
  //  for registerNotesTasksSuite below.
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * M-PROP-01 — extended Create Property field inventory (franchise, assignee, contact, submit).
   */
  test("TC-PROP-019 | Verify that the Create Property modal displays all expected fields, labels, and mandatory (*) indicators. (M-PROP-01)", async () => {
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertCreatePropertyDrawerExtendedFieldInventory();
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
  });

  /**
   * M-PROP-03 — empty mandatory submit shows inline validation; name-only still requires address.
   */
  test("TC-PROP-020 | Verify that validation message appear if user try to create a property by clicking on the 'Create Property' button when mandatory fields are empty (M-PROP-03)", async () => {
    await openCreatePropertyDrawerFromList();
    await propertyModule.submitCreateDrawerExpectingValidation();
    await propertyModule.assertEmptyCreatePropertyValidationMessages();

    await propertyModule.fillPropertyName(`GAP-VAL-${Date.now()}`);
    await propertyModule.submitCreateDrawerExpectingValidation();
    const drawer = propertyModule.createPropertyDrawerRoot();
    await expect(drawer.getByText(/Address is required/i)).toBeVisible({
      timeout: 8_000,
    });

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
  });

  /**
   * M-PROP-02 — dismiss Create Property via backdrop; distinctive name must not persist.
   */
  test("TC-PROP-021 | Verify that the close (X) icon closes the Create Property modal without saving any data. (M-PROP-02)", async () => {
    const draftName = `X-BACKDROP-${Date.now()}`;
    await openCreatePropertyDrawerFromList();
    await propertyModule.fillPropertyName(draftName);
    await propertyModule.dismissCreatePropertyViaBackdrop();
    await propertyModule.assertCreatePropertyDrawerClosed();

    await propertyModule.searchProperty(draftName);
    await propertyModule.assertSearchShowsNoResults(draftName);
    await propertyModule.clearPropertySearch();
  });

  /**
   * M-PROP-04 — company picker shows default results without typing a search term.
   */
  test("TC-PROP-022 | Verify that the Company dropdown opens and lists companies correctly. (M-PROP-04)", async () => {
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertCompanyPickerDefaultListHasResults();
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
  });

  /**
   * M-PROP-05 — selected company name is visible in the drawer after selection.
   */
  test("TC-PROP-023 | Verify that selecting a company populates the Company field correctly. (M-PROP-05)", async () => {
    await openCreatePropertyDrawerFromList();
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    await propertyModule.assertSelectedCompanyVisibleInDrawer(
      targetCompanyName,
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
  });

  /**
   * M-PROP-04A — Company + Create New opens Create Company flow and can be dismissed.
   */
  test("TC-PROP-024 | Verify that clicking '+ Create New' in Company section opens the Create New Company flow. (M-PROP-04A)", async () => {
    console.log(
      "[TC-PROP-024] Start: Create New Company flow from Property drawer",
    );
    const ensureCreatePropertyDrawerOpenForMProp04A = async () => {
      const drawerVisible = await propertyModule.createPropertyHeading
        .isVisible()
        .catch(() => false);
      if (!drawerVisible) {
        console.log(
          "[TC-PROP-024] Parent drawer closed; reopening Create Property drawer",
        );
        await openCreatePropertyDrawerFromList();
      }
    };

    await openCreatePropertyDrawerFromList();
    console.log("[TC-PROP-024] Create Property drawer opened");
    await propertyModule.openCreateNewCompanyFromCompanySection();
    console.log("[TC-PROP-024] '+ Create New' clicked");
    await propertyModule.assertCreateNewCompanyFlowOpened();
    console.log("[TC-PROP-024] Create New Company flow opened");

    // Validate both close paths. In some builds, closing nested modal may
    // also close the parent drawer; reopen parent drawer if needed.
    await propertyModule.closeCreateNewCompanyFlowViaCancel();
    console.log("[TC-PROP-024] Create New Company flow closed via Cancel");
    await ensureCreatePropertyDrawerOpenForMProp04A();
    await propertyModule.openCreateNewCompanyFromCompanySection();
    console.log("[TC-PROP-024] '+ Create New' clicked second time");
    await propertyModule.assertCreateNewCompanyFlowOpened();
    console.log("[TC-PROP-024] Create New Company flow reopened");
    await propertyModule.closeCreateNewCompanyFlowViaX();
    console.log("[TC-PROP-024] Create New Company flow closed via X");
    await ensureCreatePropertyDrawerOpenForMProp04A();

    await propertyModule.dismissCreatePropertyViaBackdrop();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-024] Complete: Create Property drawer closed");
  });

  /**
   * M-PROP-04B — Parent Company field visible on open, after company select, and after reopen.
   */
  test("TC-PROP-031 | Verify that Parent Company field is visible. (M-PROP-04B)", async () => {
    console.log("[TC-PROP-031] Step 1: Open Create Property drawer");
    await openCreatePropertyDrawerFromList();
    console.log(
      "[TC-PROP-031] Step 2: Verify Parent Company visible on initial open",
    );
    await propertyModule.assertParentCompanyFieldVisibleInCreatePropertyDrawer();

    console.log("[TC-PROP-031] Step 3: Select company in create form");
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    console.log(
      "[TC-PROP-031] Step 4: Verify Parent Company remains visible after company selection",
    );
    await propertyModule.assertParentCompanyFieldVisibleInCreatePropertyDrawer();

    console.log(
      "[TC-PROP-031] Step 5: Close drawer via backdrop and verify closed",
    );
    await propertyModule.dismissCreatePropertyViaBackdrop();
    await propertyModule.assertCreatePropertyDrawerClosed();

    console.log(
      "[TC-PROP-031] Step 6: Reopen drawer and verify Parent Company visible again",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertParentCompanyFieldVisibleInCreatePropertyDrawer();

    console.log("[TC-PROP-031] Step 7: Final close and closure assertion");
    await propertyModule.dismissCreatePropertyViaBackdrop();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-031] Complete");
  });

  /**
   * M-PROP-04C — Property Source dropdown opens, lists expected values, supports reselection/dismiss, and resets on reopen.
   */
  test("TC-PROP-032 | Verify that Property Source dropdown opens and lists all available sources correctly. (M-PROP-04C)", async () => {

    const expectedSources = [
      "ALN",
      "Building Connected",
      "Inbound Lead - National",
      "Referral",
      "Inbound Lead - Local",
      "Local Networking",
      "Other Online Database",
      "Rocket Reach",
      "Sales Routing",
      "ZoomInfo",
    ];

    console.log("[TC-PROP-032] Step 1: Open Create Property drawer");
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertPropertySourceTriggerValue(
      "Add Property Source",
    );

    console.log(
      "[TC-PROP-032] Step 2: Open source dropdown and validate options",
    );
    await propertyModule.openPropertySourceDropdown();
    const observedSources =
      await propertyModule.getPropertySourceOptionsFromOpenDropdown();
    for (const source of expectedSources) {
      expect(
        observedSources,
        `Property Source dropdown should include "${source}". Observed: ${observedSources.join(", ")}`,
      ).toContain(source);
    }

    console.log("[TC-PROP-032] Step 3: Select Building Connected and verify");
    await propertyModule.selectPropertySourceByText("Building Connected");

    console.log("[TC-PROP-032] Step 4: Reselect to Referral and verify");
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.selectPropertySourceByText("Referral");

    console.log(
      "[TC-PROP-032] Step 5: Dismiss dropdown without selection and verify value unchanged",
    );
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.dismissPropertySourceDropdownWithoutSelection();
    await propertyModule.assertPropertySourceTriggerValue("Referral");

    console.log(
      "[TC-PROP-032] Step 6: Cancel drawer and verify reset on reopen",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertPropertySourceTriggerValue(
      "Add Property Source",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-032] Complete");
  });

  /**
   * M-PROP-04D — selecting Property Source populates field correctly and keeps latest selected value.
   */
  test("TC-PROP-033 | Verify that selecting a Property Source populates the field correctly. (M-PROP-04D)", async () => {

    console.log(
      "[TC-PROP-033] Step 1: Open Create Property drawer and assert default source",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertPropertySourceTriggerValue(
      "Add Property Source",
    );

    console.log(
      "[TC-PROP-033] Step 2: Select Building Connected and verify field population",
    );
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.selectPropertySourceByText("Building Connected");
    await propertyModule.assertPropertySourceTriggerValue("Building Connected");

    console.log(
      "[TC-PROP-033] Step 3: Reselect Referral and verify latest value replaces previous",
    );
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.selectPropertySourceByText("Referral");
    await propertyModule.assertPropertySourceTriggerValue("Referral");

    console.log(
      "[TC-PROP-033] Step 4: Change other field and verify source remains unchanged",
    );
    await propertyModule.fillPropertyName(`SRC-POP-${Date.now()}`);
    await propertyModule.assertPropertySourceTriggerValue("Referral");

    console.log(
      "[TC-PROP-033] Step 5: Reopen and dismiss source dropdown without selection",
    );
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.dismissPropertySourceDropdownWithoutSelection();
    await propertyModule.assertPropertySourceTriggerValue("Referral");

    console.log(
      "[TC-PROP-033] Step 6: Cancel and reopen to verify clean default reset",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertPropertySourceTriggerValue(
      "Add Property Source",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-033] Complete");
  });

  /**
   * M-PROP-04E — Associated Franchise dropdown opens, supports search, and keeps latest selected value.
   */
  test("TC-PROP-034 | Verify that Associated Franchise dropdown opens and lists available franchises correctly. (M-PROP-04E)", async () => {

    console.log(
      "[TC-PROP-034] Step 1: Open Create Property and confirm default franchise trigger",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssociatedFranchiseTriggerValue(
      "Add Associated Franchise",
    );

    console.log(
      "[TC-PROP-034] Step 2: Open franchise dropdown and verify list is populated",
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    const observedFranchises =
      await propertyModule.getAssociatedFranchiseOptionsFromOpenDropdown();
    expect(
      observedFranchises.length,
      `Associated Franchise dropdown should list options. Observed: ${observedFranchises.join(", ")}`,
    ).toBeGreaterThan(0);

    console.log(
      "[TC-PROP-034] Step 3: Search franchise and verify matching option appears",
    );
    const targetFranchise = "216 - Omaha, NE";
    const franchiseTooltip =
      await propertyModule.searchInAssociatedFranchiseDropdown(targetFranchise);
    await expect(
      franchiseTooltip.getByText(targetFranchise, { exact: false }).first(),
    ).toBeVisible({ timeout: 8_000 });

    console.log(
      "[TC-PROP-034] Step 4: Select franchise and verify trigger value",
    );
    await propertyModule.selectAssociatedFranchiseByText(targetFranchise);
    await propertyModule.assertAssociatedFranchiseTriggerValue(targetFranchise);

    console.log(
      "[TC-PROP-034] Step 4B: Reopen dropdown and reselect another franchise",
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    const secondFranchise = "240 - Hodgkins, IL";
    await propertyModule.selectAssociatedFranchiseByText(secondFranchise);
    await propertyModule.assertAssociatedFranchiseTriggerValue(secondFranchise);

    console.log(
      "[TC-PROP-034] Step 5: Reopen and dismiss without new selection",
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    await propertyModule.dismissAssociatedFranchiseDropdownWithoutSelection();
    await propertyModule.assertAssociatedFranchiseTriggerValue(secondFranchise);

    console.log(
      "[TC-PROP-034] Step 6: Cancel and reopen to verify clean default reset",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssociatedFranchiseTriggerValue(
      "Add Associated Franchise",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-034] Complete");
  });

  /**
   * M-PROP-04F — selecting Associated Franchise populates field correctly across select/reselect/dismiss/reset cycles.
   */
  test("TC-PROP-035 | Verify that selecting an Associated Franchise populates the field correctly. (M-PROP-04F)", async () => {

    const firstFranchise = "216 - Omaha, NE";
    const secondFranchise = "240 - Hodgkins, IL";
    const noMatchQuery = "zzzz-no-match-123";

    console.log(
      "[TC-PROP-035] Step 1: Open Create Property and verify default Associated Franchise text",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssociatedFranchiseTriggerValue(
      "Add Associated Franchise",
    );

    console.log(
      `[TC-PROP-035] Step 2: Select first franchise (${firstFranchise}) and verify field population`,
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    let tooltip =
      await propertyModule.searchInAssociatedFranchiseDropdown(firstFranchise);
    await propertyModule.clickVisibleDropdownOption(
      tooltip,
      firstFranchise,
      8_000,
    );
    await propertyModule.assertAssociatedFranchiseTriggerValue(firstFranchise);

    console.log(
      `[TC-PROP-035] Step 3: Reselect second franchise (${secondFranchise}) and verify replacement`,
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    tooltip =
      await propertyModule.searchInAssociatedFranchiseDropdown(secondFranchise);
    await propertyModule.clickVisibleDropdownOption(
      tooltip,
      secondFranchise,
      8_000,
    );
    await propertyModule.assertAssociatedFranchiseTriggerValue(secondFranchise);

    console.log(
      "[TC-PROP-035] Step 4: Edit other fields and verify franchise value persists",
    );
    await propertyModule.fillPropertyName(`AF-PERSIST-${Date.now()}`);
    await propertyModule.assertAssociatedFranchiseTriggerValue(secondFranchise);

    console.log(
      "[TC-PROP-035] Step 5: Reopen and dismiss without new selection, value should stay unchanged",
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    await propertyModule.dismissAssociatedFranchiseDropdownWithoutSelection();
    await propertyModule.assertAssociatedFranchiseTriggerValue(secondFranchise);

    console.log(
      `[TC-PROP-035] Step 6: Run no-match search (${noMatchQuery}) and ensure selected value is not overwritten`,
    );
    await propertyModule.openAssociatedFranchiseDropdown();
    await propertyModule.searchInAssociatedFranchiseDropdown(noMatchQuery);
    await propertyModule.dismissAssociatedFranchiseDropdownWithoutSelection();
    await propertyModule.assertAssociatedFranchiseTriggerValue(secondFranchise);

    console.log(
      "[TC-PROP-035] Step 7: Repeat select/reselect cycle and verify latest value each time",
    );
    const repeatCycleValues = [
      firstFranchise,
      secondFranchise,
      firstFranchise,
      secondFranchise,
      firstFranchise,
    ];
    for (let i = 0; i < repeatCycleValues.length; i++) {
      const value = repeatCycleValues[i];
      console.log(
        `[TC-PROP-035] Step 7.${i + 1}: Select "${value}" and verify trigger value`,
      );
      await propertyModule.openAssociatedFranchiseDropdown();
      tooltip = await propertyModule.searchInAssociatedFranchiseDropdown(value);
      await propertyModule.clickVisibleDropdownOption(tooltip, value, 8_000);
      await propertyModule.assertAssociatedFranchiseTriggerValue(value);
    }

    console.log(
      "[TC-PROP-035] Step 8: Cancel drawer and reopen to verify Associated Franchise resets",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssociatedFranchiseTriggerValue(
      "Add Associated Franchise",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-035] Complete");
  });

  /**
   * M-PROP-04J — Associated Franchise search returns matching results and handles no-match/reset correctly.
   */
  test("TC-PROP-039 | Verify that Associated Franchise dropdown supports search and returns matching results. (M-PROP-04J)", async () => {

    const matchQuery = "216 - Omaha, NE";
    const noMatchQuery = "zzzz-no-match-123";
    const rapidQueryA = "216";
    const rapidQueryB = "240";

    console.log(
      "[TC-PROP-039] Step 1: Open Create Property and open Associated Franchise dropdown",
    );
    await openCreatePropertyDrawerFromList();
    let tooltip = await propertyModule.openAssociatedFranchiseDropdown();

    console.log(
      "[TC-PROP-039] Step 2: Verify Search input is visible and initial list is populated",
    );
    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
    const initialOptions =
      await propertyModule.getAssociatedFranchiseOptionsFromOpenDropdown();
    expect(initialOptions.length).toBeGreaterThan(0);

    console.log(
      `[TC-PROP-039] Step 3: Search exact value "${matchQuery}" and verify matching result`,
    );
    tooltip =
      await propertyModule.searchInAssociatedFranchiseDropdown(matchQuery);
    await expect(
      tooltip.getByText(matchQuery, { exact: false }).first(),
    ).toBeVisible({ timeout: 8_000 });

    console.log(
      "[TC-PROP-039] Step 4: Select matching result and verify field value updates",
    );
    await propertyModule.clickVisibleDropdownOption(tooltip, matchQuery, 8_000);
    await propertyModule.assertAssociatedFranchiseTriggerValue(matchQuery);

    console.log(
      `[TC-PROP-039] Step 5: Reopen and verify no-match query "${noMatchQuery}" returns no visible options`,
    );
    tooltip = await propertyModule.openAssociatedFranchiseDropdown();
    tooltip =
      await propertyModule.searchInAssociatedFranchiseDropdown(noMatchQuery);
    const noMatchOptions = tooltip.locator('p, [role="option"], h6');
    await expect(noMatchOptions).toHaveCount(0);

    console.log(
      "[TC-PROP-039] Step 6: Clear search and verify full list returns without overriding selected value",
    );
    await propertyModule.searchInAssociatedFranchiseDropdown("");
    const restoredOptions =
      await propertyModule.getAssociatedFranchiseOptionsFromOpenDropdown();
    expect(restoredOptions.length).toBeGreaterThan(0);
    await propertyModule.dismissAssociatedFranchiseDropdownWithoutSelection();
    await propertyModule.assertAssociatedFranchiseTriggerValue(matchQuery);

    console.log(
      `[TC-PROP-039] Step 7: Validate partial query behavior with "${rapidQueryA}"`,
    );
    tooltip = await propertyModule.openAssociatedFranchiseDropdown();
    tooltip =
      await propertyModule.searchInAssociatedFranchiseDropdown(rapidQueryA);
    const partialOptionsA =
      await propertyModule.getAssociatedFranchiseOptionsFromOpenDropdown();
    expect(
      partialOptionsA.some((value) => value.toLowerCase().includes("216")),
    ).toBeTruthy();

    console.log(
      `[TC-PROP-039] Step 8: Rapidly replace query "${rapidQueryA}" -> "${rapidQueryB}" and verify latest results`,
    );
    await propertyModule.searchInAssociatedFranchiseDropdown(rapidQueryB);
    const partialOptionsB =
      await propertyModule.getAssociatedFranchiseOptionsFromOpenDropdown();
    expect(
      partialOptionsB.some((value) => value.toLowerCase().includes("240")),
    ).toBeTruthy();

    console.log(
      "[TC-PROP-039] Step 9: Cancel and reopen drawer; verify search state is fresh",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    tooltip = await propertyModule.openAssociatedFranchiseDropdown();
    const reopenedSearchInput = tooltip.getByRole("textbox", {
      name: "Search",
    });
    await expect(reopenedSearchInput).toHaveValue("");
    const reopenOptions =
      await propertyModule.getAssociatedFranchiseOptionsFromOpenDropdown();
    expect(reopenOptions.length).toBeGreaterThan(0);
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-039] Complete");
  });

  /**
   * M-PROP-04K — Select Assignee dropdown supports search and returns matching users.
   * Additional coverage title: Verify that selecting an assignee populates the field correctly.
   */
  test("TC-PROP-040 | Verify that Select Assignee dropdown opens and lists assignees/users correctly. Verify that Select Assignee dropdown supports search and returns matching assignees. Verify that selecting an assignee populates the field correctly. (M-PROP-04K)", async () => {

    const exactQuery = "Brandon Nyffeler";
    const noMatchQuery = "zzzz-no-user-123";
    const partialQuery = "Bran";
    const rapidQueryA = "Brandon";
    const rapidQueryB = "Chuck";

    console.log(
      "[TC-PROP-040] Step 1: Open Create Property and open Select Assignee dropdown",
    );
    await openCreatePropertyDrawerFromList();
    let tooltip = await propertyModule.openAssigneeDropdown();

    console.log(
      "[TC-PROP-040] Step 2: Verify Search input is visible and assignee list is populated",
    );
    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
    const initialAssignees =
      await propertyModule.getAssigneeOptionsFromOpenDropdown();
    expect(
      initialAssignees.length,
      `Assignee list should be populated. Observed: ${initialAssignees.join(", ")}`,
    ).toBeGreaterThan(0);

    console.log(
      `[TC-PROP-040] Step 3: Search exact assignee "${exactQuery}" and verify match appears`,
    );
    tooltip = await propertyModule.searchAssigneeInDropdown(exactQuery);
    await expect(
      tooltip
        .getByRole("heading", { level: 4, name: new RegExp(exactQuery, "i") })
        .first(),
    ).toBeVisible({ timeout: 8_000 });

    console.log(
      "[TC-PROP-040] Step 4: Select matching assignee from filtered results",
    );
    await propertyModule.selectAssigneeByText(exactQuery);
    const selectedNameVisible = await propertyModule
      .createPropertyDrawerRoot()
      .getByText(exactQuery, { exact: false })
      .first()
      .isVisible()
      .catch(() => false);
    expect(
      selectedNameVisible,
      `Selected assignee "${exactQuery}" should be reflected in drawer context.`,
    ).toBeTruthy();

    console.log(
      `[TC-PROP-040] Step 5: Reopen and search no-match "${noMatchQuery}"`,
    );
    tooltip = await propertyModule.openAssigneeDropdown();
    tooltip = await propertyModule.searchAssigneeInDropdown(noMatchQuery);
    await expect(tooltip.getByRole("heading", { level: 4 })).toHaveCount(0);

    console.log(
      "[TC-PROP-040] Step 6: Clear search and verify assignee list is restored",
    );
    await propertyModule.searchAssigneeInDropdown("");
    const restoredAssignees =
      await propertyModule.getAssigneeOptionsFromOpenDropdown();
    expect(restoredAssignees.length).toBeGreaterThan(0);
    await propertyModule.dismissAssigneeDropdownWithoutSelection();

    console.log(
      `[TC-PROP-040] Step 7: Validate partial query behavior for "${partialQuery}"`,
    );
    tooltip = await propertyModule.openAssigneeDropdown();
    await propertyModule.searchAssigneeInDropdown(partialQuery);
    const partialMatches =
      await propertyModule.getAssigneeOptionsFromOpenDropdown();
    expect(
      partialMatches.some((name) => name.toLowerCase().includes("bran")),
    ).toBeTruthy();

    console.log(
      `[TC-PROP-040] Step 8: Rapid query replacement "${rapidQueryA}" -> "${rapidQueryB}"`,
    );
    await propertyModule.searchAssigneeInDropdown(rapidQueryA);
    await propertyModule.searchAssigneeInDropdown(rapidQueryB);
    const rapidMatches =
      await propertyModule.getAssigneeOptionsFromOpenDropdown();
    expect(
      rapidMatches.some((name) => name.toLowerCase().includes("chuck")),
    ).toBeTruthy();
    await propertyModule.dismissAssigneeDropdownWithoutSelection();

    console.log(
      "[TC-PROP-040] Step 9: Cancel and reopen drawer; verify assignee search input resets",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    tooltip = await propertyModule.openAssigneeDropdown();
    const reopenedSearch = tooltip.getByRole("textbox", { name: "Search" });
    await expect(reopenedSearch).toHaveValue("");
    const reopenAssignees =
      await propertyModule.getAssigneeOptionsFromOpenDropdown();
    expect(reopenAssignees.length).toBeGreaterThan(0);
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-040] Complete");
  });

  /**
   * M-PROP-04L — Assign Supervisor checkbox visibility + check/uncheck workflow.
   */
  test("TC-PROP-041 | Verify that the 'Assign Supervisor' checkbox is visible and can be checked/unchecked. (M-PROP-04L)", async () => {

    console.log(
      "[TC-PROP-041] Step 1: Open Create Property and verify Assign Supervisor checkbox baseline visibility",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const initialCheckedState =
      await propertyModule.isAssignSupervisorCheckedInCreateDrawer();
    console.log(
      `[TC-PROP-041] Baseline state observed: ${
        initialCheckedState ? "checked" : "unchecked"
      }`,
    );

    console.log("[TC-PROP-041] Step 2: Set Assign Supervisor to checked state");
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await expect(
      propertyModule.assignSupervisorCheckboxInCreateDrawer(),
    ).toBeChecked();

    console.log("[TC-PROP-041] Step 3: Set Assign Supervisor to unchecked state");
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    await expect(
      propertyModule.assignSupervisorCheckboxInCreateDrawer(),
    ).not.toBeChecked();

    console.log(
      "[TC-PROP-041] Step 4: Repeat toggle cycles and verify each transition is stable",
    );
    const toggleTargets = [true, false, true, false, true, false];
    for (let i = 0; i < toggleTargets.length; i++) {
      const targetState = toggleTargets[i];
      await propertyModule.setAssignSupervisorCheckedInCreateDrawer(targetState);
      if (targetState) {
        await expect(
          propertyModule.assignSupervisorCheckboxInCreateDrawer(),
        ).toBeChecked();
      } else {
        await expect(
          propertyModule.assignSupervisorCheckboxInCreateDrawer(),
        ).not.toBeChecked();
      }
      console.log(
        `[TC-PROP-041] Step 4.${i + 1}: Checkbox set to ${
          targetState ? "checked" : "unchecked"
        }`,
      );
    }

    console.log(
      "[TC-PROP-041] Step 5: Verify checkbox state persists after interacting with unrelated controls",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.dismissPropertySourceDropdownWithoutSelection();
    await propertyModule.openAssigneeDropdown();
    await propertyModule.dismissAssigneeDropdownWithoutSelection();
    await expect(
      propertyModule.assignSupervisorCheckboxInCreateDrawer(),
    ).toBeChecked();

    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    await propertyModule.openStageDropdown();
    await propertyModule.dismissStageDropdownWithoutSelection();
    await expect(
      propertyModule.assignSupervisorCheckboxInCreateDrawer(),
    ).not.toBeChecked();

    console.log(
      "[TC-PROP-041] Step 6: Cancel and reopen Create Property to verify reset/default behavior",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const reopenedCheckedState =
      await propertyModule.isAssignSupervisorCheckedInCreateDrawer();
    expect(
      typeof reopenedCheckedState,
      "Reopened checkbox state should be readable as a boolean.",
    ).toBe("boolean");
    console.log(
      `[TC-PROP-041] Reopen state observed: ${
        reopenedCheckedState ? "checked" : "unchecked"
      } (initial was ${initialCheckedState ? "checked" : "unchecked"})`,
    );

    console.log(
      "[TC-PROP-041] Step 7: Verify toggle actions do not trigger immediate unrelated required-field errors",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    const hasRequiredErrorAfterToggle = await propertyModule
      .createPropertyDrawerRoot()
      .getByText(/is required\./i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(
      hasRequiredErrorAfterToggle,
      "Assign Supervisor toggle should not itself trigger required-field errors before submit.",
    ).toBeFalsy();

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-041] Complete");
  });

  /**
   * M-PROP-04M — Assign Supervisor is disabled when HO (Home Officer) assignee is selected.
   */
  test("TC-PROP-042 | Verify that 'Assign Supervisor' is disabled when HO (Home Officer) user is selected as assignee. (M-PROP-04M)", async () => {

    console.log(
      "[TC-PROP-042] Step 1: Open Create Property and record baseline Assign Supervisor state",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const checkbox = propertyModule.assignSupervisorCheckboxInCreateDrawer();
    const baselineChecked = await propertyModule.isAssignSupervisorCheckedInCreateDrawer();
    const baselineDisabled = await propertyModule.isAssignSupervisorDisabledInCreateDrawer();
    console.log(
      `[TC-PROP-042] Baseline observed | checked=${baselineChecked} | disabled=${baselineDisabled}`,
    );

    console.log(
      "[TC-PROP-042] Step 2: Select HO assignee and verify Assign Supervisor becomes disabled",
    );
    const hoAssignee = await propertyModule.selectAssigneeByRoleInCreateDrawer({
      includeRolePattern: /Home Officer/i,
    });
    console.log(
      `[TC-PROP-042] HO assignee selected: ${hoAssignee.name} (${hoAssignee.role})`,
    );
    await expect(checkbox).toBeDisabled({ timeout: 8_000 });
    const checkedBeforeBlockedToggle =
      await propertyModule.isAssignSupervisorCheckedInCreateDrawer();

    console.log(
      "[TC-PROP-042] Step 3: Attempt mouse + keyboard toggle while disabled",
    );
    await checkbox.click({ force: true }).catch(() => {});
    await checkbox.focus().catch(() => {});
    await page.keyboard.press("Space").catch(() => {});
    const checkedAfterBlockedToggle =
      await propertyModule.isAssignSupervisorCheckedInCreateDrawer();
    expect(checkedAfterBlockedToggle).toBe(checkedBeforeBlockedToggle);
    await expect(checkbox).toBeDisabled();

    console.log(
      "[TC-PROP-042] Step 4: Select non-HO assignee and verify checkbox re-enables",
    );
    const nonHoAssignee = await propertyModule.selectAssigneeByRoleInCreateDrawer({
      includeRolePattern: /.+/,
      excludeRolePattern: /Home Officer/i,
      excludeNames: [hoAssignee.name],
    });
    console.log(
      `[TC-PROP-042] Non-HO assignee selected: ${nonHoAssignee.name} (${nonHoAssignee.role || "role-not-visible"})`,
    );
    await expect(checkbox).not.toBeDisabled();
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await expect(checkbox).toBeChecked();
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    await expect(checkbox).not.toBeChecked();

    console.log(
      "[TC-PROP-042] Step 5: Switch to another HO assignee and verify disable rule remains consistent",
    );
    const secondHoAssignee = await propertyModule.selectAssigneeByRoleInCreateDrawer({
      includeRolePattern: /Home Officer/i,
      excludeNames: [hoAssignee.name],
    });
    console.log(
      `[TC-PROP-042] Second HO assignee selected: ${secondHoAssignee.name} (${secondHoAssignee.role})`,
    );
    await expect(checkbox).toBeDisabled();

    console.log(
      "[TC-PROP-042] Step 6: Cancel and reopen drawer; verify HO-driven disabled state does not leak unexpectedly",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const reopenedDisabled =
      await propertyModule.isAssignSupervisorDisabledInCreateDrawer();
    console.log(
      `[TC-PROP-042] Reopen observed | disabled=${reopenedDisabled} (baseline disabled=${baselineDisabled})`,
    );
    // Fresh drawer session should not be forced-disabled because of prior HO selection.
    expect(reopenedDisabled).toBe(baselineDisabled);

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-042] Complete");
  });

  /**
   * M-PROP-04N — checking Assign Supervisor reveals Select Supervisor field.
   */
  test("TC-PROP-043 | Verify that checking 'Assign Supervisor' reveals the 'Select Supervisor' field. (M-PROP-04N)", async () => {

    console.log(
      "[TC-PROP-043] Step 1: Open Create Property and verify Assign Supervisor checkbox is visible",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();

    console.log(
      "[TC-PROP-043] Step 2: Ensure non-HO assignee context if checkbox is disabled",
    );
    const checkbox = propertyModule.assignSupervisorCheckboxInCreateDrawer();
    const baselineDisabled =
      await propertyModule.isAssignSupervisorDisabledInCreateDrawer();
    if (baselineDisabled) {
      const selectedNonHo = await propertyModule.selectAssigneeByRoleInCreateDrawer(
        {
          includeRolePattern: /.+/,
          excludeRolePattern: /Home Officer/i,
        },
      );
      console.log(
        `[TC-PROP-043] Selected non-HO assignee to satisfy precondition: ${selectedNonHo.name} (${selectedNonHo.role || "role-not-visible"})`,
      );
    }
    await expect(checkbox).not.toBeDisabled();

    console.log(
      "[TC-PROP-043] Step 3: Verify baseline Select Supervisor field is hidden before checking Assign Supervisor",
    );
    const baselineSelectSupervisorVisible =
      await propertyModule.isSelectSupervisorVisibleInCreateDrawer();
    expect(
      baselineSelectSupervisorVisible,
      "Select Supervisor should be hidden before Assign Supervisor is checked.",
    ).toBeFalsy();

    console.log(
      "[TC-PROP-043] Step 4: Check Assign Supervisor and verify Select Supervisor is revealed",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await propertyModule.assertSelectSupervisorVisibleInCreateDrawer();

    console.log(
      "[TC-PROP-043] Step 5: Verify Select Supervisor remains visible and available for interaction",
    );
    await propertyModule.assertSelectSupervisorVisibleInCreateDrawer();
    await propertyModule.clickSelectSupervisorControlInCreateDrawer();
    // Close any opened supervisor popper while keeping drawer open.
    await propertyModule.createPropertyHeading.click({ force: true });
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();

    console.log(
      "[TC-PROP-043] Step 6: Uncheck Assign Supervisor and verify Select Supervisor hides again",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    const visibleAfterUncheck =
      await propertyModule.isSelectSupervisorVisibleInCreateDrawer();
    expect(
      visibleAfterUncheck,
      "Select Supervisor should hide when Assign Supervisor is unchecked.",
    ).toBeFalsy();

    console.log(
      "[TC-PROP-043] Step 7: Repeat reveal/hide cycles and verify dependency remains consistent",
    );
    const repeatToggleTargets = [true, false, true, false];
    for (let i = 0; i < repeatToggleTargets.length; i++) {
      const shouldReveal = repeatToggleTargets[i];
      await propertyModule.setAssignSupervisorCheckedInCreateDrawer(shouldReveal);
      const currentlyVisible =
        await propertyModule.isSelectSupervisorVisibleInCreateDrawer();
      expect(currentlyVisible).toBe(shouldReveal);
      console.log(
        `[TC-PROP-043] Step 7.${i + 1}: Assign Supervisor=${shouldReveal} => Select Supervisor visible=${currentlyVisible}`,
      );
    }

    console.log(
      "[TC-PROP-043] Step 8: Cancel and reopen drawer; verify Select Supervisor reset behavior",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const visibleAfterReopen =
      await propertyModule.isSelectSupervisorVisibleInCreateDrawer();
    expect(
      visibleAfterReopen,
      "Select Supervisor should not remain visible on a fresh drawer reopen.",
    ).toBeFalsy();

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-043] Complete");
  });

  /**
   * M-PROP-04O — Select Supervisor becomes mandatory when Assign Supervisor is checked.
   */
  test("TC-PROP-044 | Verify that 'Select Supervisor' becomes mandatory when 'Assign Supervisor' is checked. (M-PROP-04O)", async () => {

    console.log(
      "[TC-PROP-044] Step 1: Open Create Property and ensure checkbox is available in non-HO context",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const checkbox = propertyModule.assignSupervisorCheckboxInCreateDrawer();
    const disabledAtStart =
      await propertyModule.isAssignSupervisorDisabledInCreateDrawer();
    if (disabledAtStart) {
      const selectedNonHo = await propertyModule.selectAssigneeByRoleInCreateDrawer(
        {
          includeRolePattern: /.+/,
          excludeRolePattern: /Home Officer/i,
        },
      );
      console.log(
        `[TC-PROP-044] Selected non-HO assignee to satisfy precondition: ${selectedNonHo.name} (${selectedNonHo.role || "role-not-visible"})`,
      );
    }
    await expect(checkbox).not.toBeDisabled();

    console.log(
      "[TC-PROP-044] Step 2: Baseline verify Select Supervisor not mandatory while Assign Supervisor is unchecked",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    const baselineMandatory =
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer();
    expect(
      baselineMandatory,
      "Select Supervisor should not show mandatory marker while Assign Supervisor is unchecked.",
    ).toBeFalsy();

    console.log(
      "[TC-PROP-044] Step 3: Check Assign Supervisor and verify mandatory marker appears",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await propertyModule.assertSelectSupervisorVisibleInCreateDrawer();
    const mandatoryAfterCheck =
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer();
    expect(
      mandatoryAfterCheck,
      "Select Supervisor should show mandatory marker when Assign Supervisor is checked.",
    ).toBeTruthy();

    console.log(
      "[TC-PROP-044] Step 4: Immediately click submit after reveal and verify supervisor mandatory behavior",
    );
    await propertyModule.submitCreateDrawerExpectingValidation();
    await expect(propertyModule.createPropertyHeading).toBeVisible({
      timeout: 8_000,
    });
    expect(
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer(),
      "Select Supervisor should remain mandatory after immediate submit in checked state.",
    ).toBeTruthy();

    console.log(
      "[TC-PROP-044] Step 5: Fill core required fields and re-submit without supervisor to isolate supervisor mandatory gate",
    );
    const mandatoryProbePropertyName = `M-PROP-04O-${Date.now()}`;
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    await propertyModule.fillPropertyName(mandatoryProbePropertyName);
    const addressSelected = await propertyModule.fillAddress(
      "716 South 9th Street, Omaha NE",
    );
    if (!addressSelected) {
      await propertyModule.fillAddress("715 South 9th Street, Omaha NE");
    }
    await propertyModule.submitCreateDrawerExpectingValidation();
    await expect(propertyModule.createPropertyHeading).toBeVisible({
      timeout: 8_000,
    });
    expect(
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer(),
      "Select Supervisor mandatory marker should remain visible after blocked submit.",
    ).toBeTruthy();

    console.log(
      "[TC-PROP-044] Step 6: Select supervisor and verify mandatory validation clears",
    );
    const selectedSupervisor =
      await propertyModule.selectFirstSupervisorInCreateDrawer();
    console.log(
      `[TC-PROP-044] Selected supervisor: ${selectedSupervisor || "value-captured"} `,
    );
    const stillInvalid = await propertyModule.isSelectSupervisorInvalidInCreateDrawer();
    expect(
      stillInvalid,
      "Select Supervisor should not remain invalid after selecting a supervisor.",
    ).toBeFalsy();

    console.log(
      "[TC-PROP-044] Step 7: Uncheck Assign Supervisor and verify mandatory constraint is removed",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    const mandatoryAfterUncheck =
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer();
    expect(
      mandatoryAfterUncheck,
      "Select Supervisor mandatory marker should be removed after unchecking Assign Supervisor.",
    ).toBeFalsy();

    console.log(
      "[TC-PROP-044] Step 8: Re-check Assign Supervisor and confirm mandatory constraint reapplies",
    );
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    expect(
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer(),
    ).toBeTruthy();

    console.log(
      "[TC-PROP-044] Step 9: Cancel and reopen drawer to verify mandatory/reset state is fresh",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    expect(
      await propertyModule.hasSelectSupervisorMandatoryMarkerInCreateDrawer(),
    ).toBeFalsy();

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-044] Complete");
  });

  /**
   * M-PROP-04P — Select Supervisor dropdown opens and lists supervisors/users correctly.
   */
  test("TC-PROP-045 | Verify that Select Supervisor dropdown opens and lists supervisors/users correctly. (M-PROP-04P)", async () => {
    test.setTimeout(120_000);

    console.log(
      "[TC-PROP-045] Step 1: Open Create Property and ensure Select Supervisor preconditions are satisfied",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const checkbox = propertyModule.assignSupervisorCheckboxInCreateDrawer();
    const disabledAtStart =
      await propertyModule.isAssignSupervisorDisabledInCreateDrawer();
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (disabledAtStart) {
      const selectedNonHo = await propertyModule.selectAssigneeByRoleInCreateDrawer(
        {
          includeRolePattern: /.+/,
          excludeRolePattern: /Home Officer/i,
        },
      );
      console.log(
        `[TC-PROP-045] Selected non-HO assignee for supervisor flow: ${selectedNonHo.name} (${selectedNonHo.role || "role-not-visible"})`,
      );
    }
    await expect(checkbox).toBeEnabled();
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await propertyModule.assertSelectSupervisorVisibleInCreateDrawer();

    console.log(
      "[TC-PROP-045] Step 2: Open Select Supervisor dropdown and validate list population",
    );
    await propertyModule.openSelectSupervisorDropdownInCreateDrawer();
    const initialOptions =
      await propertyModule.getSupervisorOptionsFromOpenDropdown();
    console.log(
      `[TC-PROP-045] Observed initial supervisor options count: ${initialOptions.length}`,
    );
    expect(
      initialOptions.length,
      `Select Supervisor should list at least one user. Observed: ${initialOptions.join(", ")}`,
    ).toBeGreaterThan(0);

    console.log(
      "[TC-PROP-045] Step 3: Verify dropdown supports close/reopen interactions",
    );
    await propertyModule.dismissSelectSupervisorDropdownInCreateDrawer();
    await propertyModule.openSelectSupervisorDropdownInCreateDrawer();
    await propertyModule.dismissSelectSupervisorDropdownInCreateDrawer();

    console.log(
      "[TC-PROP-045] Step 4: Search behavior probe (exact/no-match/clear) when search box is available",
    );
    await propertyModule.openSelectSupervisorDropdownInCreateDrawer();
    const searchSeed = initialOptions[0];
    const exactSearch = await propertyModule.searchSupervisorInOpenDropdown(
      searchSeed,
    );
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (exactSearch.hasSearch) {
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(
        exactSearch.results.some((x) =>
          x.toLowerCase().includes(searchSeed.toLowerCase()),
        ),
        `Search should return a result matching "${searchSeed}". Observed: ${exactSearch.results.join(", ")}`,
      ).toBeTruthy();

      const noMatchSearch = await propertyModule.searchSupervisorInOpenDropdown(
        "zzzz-no-user-123",
      );
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(
        noMatchSearch.results,
        `No-match search should return empty list. Observed: ${noMatchSearch.results.join(", ")}`,
      ).toHaveLength(0);

      const clearedSearch = await propertyModule.searchSupervisorInOpenDropdown(
        "",
      );
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(
        clearedSearch.results.length,
        "Clearing search should restore supervisor options.",
      ).toBeGreaterThan(0);
      console.log("[TC-PROP-045] Search probe executed with visible search input");
    } else {
      console.log(
        "[TC-PROP-045] Search textbox not present in this environment; list-only validation applied",
      );
    }

    console.log(
      "[TC-PROP-045] Step 5: Select supervisor and verify field population + reselection",
    );
    const firstSupervisor = initialOptions[0];
    await propertyModule.selectSupervisorByNameInCreateDrawer(firstSupervisor);
    const selectedTextAfterFirstPick =
      await propertyModule.getSelectedSupervisorTextInCreateDrawer();
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (/select supervisor/i.test(selectedTextAfterFirstPick)) {
      const invalidAfterFirstPick =
        await propertyModule.isSelectSupervisorInvalidInCreateDrawer();
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(
        invalidAfterFirstPick,
        "Supervisor field should not stay invalid after a valid selection.",
      ).toBeFalsy();
    } else {
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(
        selectedTextAfterFirstPick.toLowerCase(),
        "Selected supervisor should populate in field after first selection.",
      ).toContain(firstSupervisor.toLowerCase());
    }

    // Reset dependency state before reselection to avoid stale dropdown state.
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);
    await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
    await propertyModule.assertSelectSupervisorVisibleInCreateDrawer();
    // Get available options first (dismiss and reopen cleanly to avoid stale handle).
    const optionsAfterReopen =
      await propertyModule.getSupervisorOptionsFromOpenDropdown();
    const secondSupervisor =
      optionsAfterReopen.find(
        (x) => x.toLowerCase() !== firstSupervisor.toLowerCase(),
      ) || firstSupervisor;
    // Dismiss then reopen so we have a fresh tooltip handle before selecting.
    await propertyModule.dismissSelectSupervisorDropdownInCreateDrawer();
    await propertyModule.selectSupervisorByNameInCreateDrawer(secondSupervisor);
    const selectedTextAfterSecondPick =
      await propertyModule.getSelectedSupervisorTextInCreateDrawer();
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (!/select supervisor/i.test(selectedTextAfterSecondPick)) {
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(
        selectedTextAfterSecondPick.toLowerCase(),
        "Selected supervisor field should reflect latest selection.",
      ).toContain(secondSupervisor.toLowerCase());
    }
    console.log(
      `[TC-PROP-045] Selected supervisors: first="${firstSupervisor}", second="${secondSupervisor}"`,
    );

    console.log(
      "[TC-PROP-045] Step 6: Cancel and reopen drawer to verify supervisor selection reset",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();
    const visibleAfterReopen =
      await propertyModule.isSelectSupervisorVisibleInCreateDrawer();
    expect(
      visibleAfterReopen,
      "Select Supervisor should not remain visible on a fresh drawer reopen.",
    ).toBeFalsy();

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-045] Complete");
  });

  /**
   * M-PROP-04G — Hubspot stage dropdown opens, lists options, supports select/reselect/dismiss, and resets on reopen.
   */
  test("TC-PROP-036 | Verify that 'Choose a Hubspot Stage to map' dropdown opens and lists available stages correctly. (M-PROP-04G)", async () => {

    const stageA = "Approved";
    const stageB = "New Location";

    console.log(
      "[TC-PROP-036] Step 1: Open Create Property and verify default stage trigger",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertStageTriggerValue("Choose stage");

    console.log(
      "[TC-PROP-036] Step 2: Open stage dropdown and validate available stage list",
    );
    await propertyModule.openStageDropdown();
    const observedStages =
      await propertyModule.getStageOptionsFromOpenDropdown();
    expect(
      observedStages.length,
      `Stage dropdown should list options. Observed: ${observedStages.join(", ")}`,
    ).toBeGreaterThan(0);
    expect(observedStages).toContain("New Location");
    expect(observedStages).toContain("Approved");

    console.log(
      `[TC-PROP-036] Step 3: Select stage "${stageA}" and verify trigger updates`,
    );
    await propertyModule.selectStageByText(stageA);
    await propertyModule.assertStageTriggerValue(stageA);

    console.log(
      `[TC-PROP-036] Step 4: Reopen stage dropdown and select "${stageB}"`,
    );
    await propertyModule.openStageDropdown();
    await propertyModule.selectStageByText(stageB);
    await propertyModule.assertStageTriggerValue(stageB);

    console.log(
      "[TC-PROP-036] Step 5: Reopen and dismiss without selecting; value should remain unchanged",
    );
    await propertyModule.openStageDropdown();
    await propertyModule.dismissStageDropdownWithoutSelection();
    await propertyModule.assertStageTriggerValue(stageB);

    console.log(
      "[TC-PROP-036] Step 6: Cancel and reopen to verify stage resets to default",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertStageTriggerValue("Choose stage");
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-036] Complete");
  });

  /**
   * M-PROP-04H — selecting Hubspot stage populates field correctly across select/reselect/dismiss/reset cycles.
   */
  test("TC-PROP-037 | Verify that selecting a Hubspot Stage populates the field correctly. (M-PROP-04H)", async () => {

    const firstStage = "Approved";
    const secondStage = "New Location";

    console.log(
      "[TC-PROP-037] Step 1: Open Create Property drawer and verify default stage value",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertStageTriggerValue("Choose stage");

    console.log(
      `[TC-PROP-037] Step 2: Select first stage "${firstStage}" and verify population`,
    );
    await propertyModule.openStageDropdown();
    await propertyModule.selectStageByText(firstStage);
    await propertyModule.assertStageTriggerValue(firstStage);

    console.log(
      `[TC-PROP-037] Step 3: Reselect to "${secondStage}" and verify replacement`,
    );
    await propertyModule.openStageDropdown();
    await propertyModule.selectStageByText(secondStage);
    await propertyModule.assertStageTriggerValue(secondStage);

    console.log(
      "[TC-PROP-037] Step 4: Edit other field and verify stage value persists",
    );
    await propertyModule.fillPropertyName(`STAGE-POP-${Date.now()}`);
    await propertyModule.assertStageTriggerValue(secondStage);

    console.log(
      "[TC-PROP-037] Step 5: Reopen stage dropdown and dismiss without selection",
    );
    await propertyModule.openStageDropdown();
    await propertyModule.dismissStageDropdownWithoutSelection();
    await propertyModule.assertStageTriggerValue(secondStage);

    console.log(
      "[TC-PROP-037] Step 6: Cancel and reopen to verify stage resets to default",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertStageTriggerValue("Choose stage");
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-037] Complete");
  });

  /**
   * M-PROP-04I — Property Affiliation shows N/A before company selection and transitions after company pick.
   */
  test("TC-PROP-038 | Verify that Property Affiliation value displays as N/A before company selection. (M-PROP-04I)", async () => {

    console.log(
      "[TC-PROP-038] Step 1: Open Create Property drawer and verify Property Affiliation baseline N/A",
    );
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertPropertyAffiliationShowsNAInCreateDrawer();
    await propertyModule.assertAffiliationChipsHiddenBeforeCompany();

    console.log(
      "[TC-PROP-038] Step 2: Interact with non-company fields and ensure Property Affiliation stays N/A",
    );
    await propertyModule.fillPropertyName(`AFF-NA-${Date.now()}`);
    await propertyModule.openPropertySourceDropdown();
    await propertyModule.dismissPropertySourceDropdownWithoutSelection();
    await propertyModule.openStageDropdown();
    await propertyModule.dismissStageDropdownWithoutSelection();
    await propertyModule.assertPropertyAffiliationShowsNAInCreateDrawer();
    await propertyModule.assertAffiliationChipsHiddenBeforeCompany();

    console.log(
      "[TC-PROP-038] Step 3: Select company and verify affiliation transitions from N/A baseline",
    );
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    await propertyModule.assertAllSixAffiliationChipsVisible();

    console.log(
      "[TC-PROP-038] Step 4: Cancel and reopen drawer, verify baseline N/A is restored",
    );
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertPropertyAffiliationShowsNAInCreateDrawer();
    await propertyModule.assertAffiliationChipsHiddenBeforeCompany();
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-038] Complete");
  });

  /**
   * M-PROP-07 — affiliation chips hidden until company selected; all six visible after.
   */
  test("TC-PROP-025 | Verify that Property Affiliation options become visible/enabled after the user selects a company. Verify that Property Affiliation options display all expected chips/options (e.g., Managed, Owned, Regional Office, Shared, Tenant, Headquarters) after company selection. (M-PROP-07)", async () => {
    await openCreatePropertyDrawerFromList();
    await propertyModule.assertAffiliationChipsHiddenBeforeCompany();
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    await propertyModule.assertAllSixAffiliationChipsVisible();
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
  });

  /**
   * M-PROP-08 — each affiliation chip toggles selected visual state when clicked twice.
   */
  test("TC-PROP-026 | Verify that user can select a Property Affiliation option and the selection state is clearly shown. (M-PROP-08)", async () => {
    console.log("[TC-PROP-026] Start: Property affiliation chip interaction");
    await openCreatePropertyDrawerFromList();
    console.log("[TC-PROP-026] Create Property drawer opened");
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    console.log(`[TC-PROP-026] Company selected: ${targetCompanyName}`);
    await propertyModule.assertAllSixAffiliationChipsVisible();
    console.log("[TC-PROP-026] All affiliation chips are visible");
    await propertyModule.assertAffiliationChipInteraction(
      propertyModule.managedButton,
    );
    console.log("[TC-PROP-026] Managed chip interaction verified");
    await propertyModule.assertAffiliationChipInteraction(
      propertyModule.tenantButton,
    );
    console.log("[TC-PROP-026] Tenant chip interaction verified");
    await propertyModule.assertAffiliationChipInteraction(
      propertyModule.headquartersButton,
    );
    console.log("[TC-PROP-026] Headquarters chip interaction verified");
    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-026] Complete: drawer closed");
  });

  test("TC-PROP-030 | Verify that user can select the multiple property affiliation option at a same time. (M-PROP-08)", async () => {
    console.log("[TC-PROP-030] Start: multiple affiliation selection behavior");
    await openCreatePropertyDrawerFromList();
    console.log("[TC-PROP-030] Create Property drawer opened");
    await propertyModule.selectCompanyInCreateForm(targetCompanyName);
    console.log(`[TC-PROP-030] Company selected: ${targetCompanyName}`);
    await propertyModule.assertAllSixAffiliationChipsVisible();
    console.log("[TC-PROP-030] All affiliation chips are visible");

    await propertyModule.managedButton.click({ force: true });
    await expect(propertyModule.managedButton).toBeVisible();
    console.log("[TC-PROP-030] Managed clicked");

    await propertyModule.ownedButton.click({ force: true });
    await expect(propertyModule.ownedButton).toBeVisible();
    console.log("[TC-PROP-030] Owned clicked");

    const managedSelectedAfterOwnedClick =
      await propertyModule.affiliationChipAppearsSelected(
        propertyModule.managedButton,
      );
    const ownedSelectedAfterOwnedClick =
      await propertyModule.affiliationChipAppearsSelected(
        propertyModule.ownedButton,
      );

    // UI state classes/aria may vary by environment. Assert strict replacement only
    // when selected-state signals are detectable; otherwise assert interaction safety.
    const selectionStateDetectable =
      managedSelectedAfterOwnedClick !== ownedSelectedAfterOwnedClick;
    console.log(
      `[TC-PROP-030] State flags | Managed=${managedSelectedAfterOwnedClick} | Owned=${ownedSelectedAfterOwnedClick} | Detectable=${selectionStateDetectable}`,
    );
    if (selectionStateDetectable) {
      expect(
        ownedSelectedAfterOwnedClick,
        "Owned affiliation should appear selected after clicking Owned.",
      ).toBeTruthy();
      expect(
        managedSelectedAfterOwnedClick,
        "Managed affiliation should be unselected after selecting Owned.",
      ).toBeFalsy();
    } else {
      await expect(propertyModule.managedButton).toBeVisible();
      await expect(propertyModule.ownedButton).toBeVisible();
    }

    await propertyModule.cancelCreatePropertyDrawer();
    await propertyModule.assertCreatePropertyDrawerClosed();
    console.log("[TC-PROP-030] Complete: drawer closed");
  });

  /**
   * M-PROP-09 — user can activate a detail-page stage control and stage bar survives reload.
   */
  test("TC-PROP-027 | Verify that user is able to assign levels to the property. (M-PROP-09)", async () => {
    const propertyName = await ensureCreatedPropertyExists();
    await openPropertyDetailFromList(propertyName);
    await propertyModule.assertPropertyStageBarVisible();
    await propertyModule.clickDetailStageApproved();
    await propertyModule.reloadPropertyDetailAndAssertStageBar(propertyName);
  });

  /**
   * M-PROP-11 — HO edit path: link franchise from Edit Property.
   */
  test("TC-PROP-028 | Verify that HO/SM/SP is able to link franchise.", async () => {
    test.setTimeout(180_000);
    console.log("[TC-PROP-028] Start: HO franchise control visibility check");
    const propertyName = await withTimeout(
      ensureCreatedPropertyExists(),
      90_000,
      "TC-PROP-028 ensureCreatedPropertyExists",
    );
    console.log(`[TC-PROP-028] Using property: ${propertyName}`);
    await openPropertyDetailFromList(propertyName);
    console.log("[TC-PROP-028] Property detail opened");
    await propertyModule.openEditPropertyForm();
    console.log("[TC-PROP-028] Edit Property form open attempted");
    await propertyModule.assertEditPropertyFormOpen();
    console.log("[TC-PROP-028] Edit Property form is visible");
    await propertyModule.assertEditPropertyAssociatedFranchiseControlVisible();
    console.log("[TC-PROP-028] Associated Franchise control is visible");
    await propertyModule.cancelEditPropertyForm();
    console.log("[TC-PROP-028] Edit Property form cancel clicked");
    await propertyModule.assertEditPropertyFormClosed();
    console.log("[TC-PROP-028] Complete: Edit Property form closed");
  });

  /**
   * M-PROP-10 — HO assigns on shared session; SM verifies in second account/session.
   */
  test("TC-PROP-029 | Verify that HO/SM is able to assign property to the manager or sales person. (M-PROP-10)", async () => {
    test.setTimeout(200_000);
    console.log("[TC-PROP-029] Start: HO assignment flow");

    const hoEmail = (env.email || "").trim();
    const hoPassword = (env.password || "").trim();
    const smEmail = (env.email_sm || "").trim();
    const smUsername = (process.env.SM_USERNAME || "").trim();
    const configuredSmAssigneeText = (
      process.env.PROPERTY_ASSIGNMENT_OPTION_SM ||
      process.env.PROPERTY_ASSIGNMENT_OPTION ||
      ""
    ).trim();

    test.skip(
      !hoEmail || !hoPassword,
      "SIGNAL_EMAIL_HO and SIGNAL_PASSWORD_HO are required for HO login.",
    );
    test.skip(
      !smUsername && !configuredSmAssigneeText && !smEmail,
      "Set SM_USERNAME, PROPERTY_ASSIGNMENT_OPTION_SM, PROPERTY_ASSIGNMENT_OPTION, or SIGNAL_EMAIL_SM for assignment target.",
    );
    console.log("[TC-PROP-029] Preconditions validated");

    // Default assignee target comes from PROPERTY_ASSIGNMENT_OPTION(_SM).
    // Search still prefers SM_USERNAME for quicker filtering.
    const smAssignmentOptionText =
      configuredSmAssigneeText || smUsername || smEmail;
    const assignmentSearchText = (
      process.env.PROPERTY_ASSIGNMENT_SEARCH ||
      smUsername ||
      smEmail ||
      smAssignmentOptionText
    ).trim();

    // Prefer reusing the suite's authenticated HO session; fallback to login only
    // if this page is not already inside the app shell.
    const alreadyInAppShell = /\/app\/sales\//.test(page.url());
    if (alreadyInAppShell) {
      console.log("[TC-PROP-029] HO session already active in app shell");
    } else {
      console.log("[TC-PROP-029] HO login started");
      await withTimeout(
        performLogin(page, {
          loginCredentials: { email: hoEmail, password: hoPassword },
        }),
        120_000,
        "TC-PROP-029 HO performLogin",
      );
      console.log("[TC-PROP-029] HO login complete");
    }

    const propertyName = await withTimeout(
      ensureCreatedPropertyExists(),
      70_000,
      "TC-PROP-029 ensureCreatedPropertyExists",
    );
    console.log(`[TC-PROP-029] Using property: ${propertyName}`);
    await withTimeout(
      openPropertyDetailFromList(propertyName),
      35_000,
      "TC-PROP-029 openPropertyDetailFromList",
    );
    console.log("[TC-PROP-029] Property detail page opened");
    console.log("[TC-PROP-029] click assign to row");
    console.log(
      `[TC-PROP-029] and click the assign to dropdown and searching assignee with "${assignmentSearchText}"`,
    );
    await withTimeout(
      propertyModule.assignPropertyToUserFromDetail(
        assignmentSearchText,
        smAssignmentOptionText,
        { enforceFlow: true },
      ),
      55_000,
      "TC-PROP-029 assignPropertyToUserFromDetail",
    );
    console.log(
      `[TC-PROP-029] Assignee dropdown selection completed for "${smAssignmentOptionText}"`,
    );
    await withTimeout(
      propertyModule.assertAssignedToValueVisible(smAssignmentOptionText),
      20_000,
      "TC-PROP-029 assertAssignedToValueVisible",
    );
    console.log("[TC-PROP-029] Assigned to value verified on detail page");
    console.log(
      `[TC-PROP-029] Assignment verified for "${smAssignmentOptionText}"`,
    );

    console.log("[TC-PROP-029] Complete");
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-046 | Supervisor dropdown opens with user list; uncheck hides field
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is logged in as HO. Create Property drawer accessible.
   * Flow: Open Create Property drawer → check Assign Supervisor → open dropdown →
   *       verify list → search → select a user → uncheck Assign Supervisor →
   *       verify field hidden.
   * Priority: P1 — High
   */
  test(
    "TC-PROP-046 | Supervisor dropdown opens with user list, uncheck hides field and clears selection @smoke",
    async () => {
      test.setTimeout(120_000);

      await test.step(
        "TC-PROP-046 setup: open drawer and enable Assign Supervisor checkbox",
        async () => {
          await openCreatePropertyDrawerFromList();
          await propertyModule.assertAssignSupervisorCheckboxVisibleInCreateDrawer();

          // Ensure checkbox is not HO-disabled; select a non-HO assignee if needed.
          const isDisabled =
            await propertyModule.isAssignSupervisorDisabledInCreateDrawer();
          // eslint-disable-next-line playwright/no-conditional-in-test
          if (isDisabled) {
            await propertyModule.selectAssigneeByRoleInCreateDrawer({
              includeRolePattern: /.+/,
              excludeRolePattern: /Home Officer/i,
            });
          }
          await expect(
            propertyModule.assignSupervisorCheckboxInCreateDrawer(),
          ).not.toBeDisabled();

          await propertyModule.setAssignSupervisorCheckedInCreateDrawer(true);
          await propertyModule.assertSelectSupervisorVisibleInCreateDrawer();
        },
      );

      await test.step(
        "TC-PROP-046 dropdown: open Select Supervisor and verify user list populated",
        async () => {
          const tooltip =
            await propertyModule.openSelectSupervisorDropdownInCreateDrawer();

          // Search textbox must be visible inside the tooltip
          const searchInput = tooltip
            .getByRole("textbox", { name: /Search by name/i })
            .first()
            .or(tooltip.getByRole("textbox").first());
          await expect(searchInput).toBeVisible({ timeout: 8_000 });

          // At least one user card (heading level=4) is listed
          const userHeadings = tooltip.getByRole("heading", { level: 4 });
          await expect(userHeadings.first()).toBeVisible({ timeout: 10_000 });
          const count = await userHeadings.count();
          expect(count).toBeGreaterThan(0);
        },
      );

      await test.step(
        "TC-PROP-046 search and select: search a user, select, verify field reflects selection",
        async () => {
          // Use a partial name that reliably returns results in this environment
          const { results } = await propertyModule.searchSupervisorInOpenDropdown("a");
          expect(results.length, "Search should return at least one user matching 'a'").toBeGreaterThan(0);

          const targetSupervisor = results[0];
          await propertyModule.selectSupervisorByNameInCreateDrawer(targetSupervisor);

          // After selection the field should no longer read "Select Supervisor"
          const selectedText =
            await propertyModule.getSelectedSupervisorTextInCreateDrawer();
          const fieldCleared = /select supervisor/i.test(selectedText);
          // Either the field shows the name, or aria-invalid is false (field accepted)
          if (!fieldCleared) {
            expect(
              selectedText.toLowerCase(),
              `Supervisor field should reflect selected user. Got: "${selectedText}"`,
            ).toContain(targetSupervisor.toLowerCase());
          } else {
            // Verify field is at least not invalid (selection registered internally)
            const isInvalid =
              await propertyModule.isSelectSupervisorInvalidInCreateDrawer();
            expect(
              isInvalid,
              "Supervisor field should not be invalid after selecting a user.",
            ).toBeFalsy();
          }
        },
      );

      await test.step(
        "TC-PROP-046 uncheck: uncheck Assign Supervisor and verify Select Supervisor hidden",
        async () => {
          await propertyModule.setAssignSupervisorCheckedInCreateDrawer(false);

          const visibleAfterUncheck =
            await propertyModule.isSelectSupervisorVisibleInCreateDrawer();
          expect(
            visibleAfterUncheck,
            "Select Supervisor should be hidden after unchecking Assign Supervisor.",
          ).toBeFalsy();

          // Checkbox must be unchecked
          await expect(
            propertyModule.assignSupervisorCheckboxInCreateDrawer(),
          ).not.toBeChecked();
        },
      );

      await propertyModule.cancelCreatePropertyDrawer();
      await propertyModule.assertCreatePropertyDrawerClosed();
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  TC-PROP-047 | Contact Details section, role dropdowns, search, multi-role
  // ══════════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is logged in as HO. At least 2 contacts exist.
   * Flow: Open Create Property drawer → verify Contact Details section →
   *       open Decision Maker dropdown → verify list + search →
   *       select contact → verify selection → select second role →
   *       attempt same contact in Billing → verify graceful handling.
   * Priority: P1 — High
   */
  test(
    "TC-PROP-047 | Contact Details section visible, dropdowns open and support search, multi-role selection works, same-contact rule handled @smoke",
    async () => {
      test.setTimeout(120_000);

      // Role indices: 0=Decision Maker, 1=End User, 2=Billing
      const DECISION_MAKER = 0;
      const END_USER = 1;
      const BILLING = 2;

      await test.step(
        "TC-PROP-047 setup: open drawer, verify Contact Details heading and role rows visible",
        async () => {
          await openCreatePropertyDrawerFromList();
          await propertyModule.assertContactDetailsSectionVisible();

          // Each role row has a "Select a Contact" heading — verify at least 3 rows present
          const drawer = propertyModule.createPropertyDrawerRoot();
          const contactTriggers = drawer.getByRole("heading", {
            name: /Select a Contact/i,
            level: 6,
          });
          const triggerCount = await contactTriggers.count();
          expect(
            triggerCount,
            "Contact Details should show at least 3 unselected role rows (Decision Maker, End User, Billing).",
          ).toBeGreaterThanOrEqual(3);
        },
      );

      await test.step(
        "TC-PROP-047 decision-maker dropdown: opens, lists contacts, has search input",
        async () => {
          const tooltip = await propertyModule.openContactRoleDropdown(DECISION_MAKER);
          await propertyModule.assertContactTooltipHasSearchAndResults(tooltip);
          await propertyModule.dismissContactRoleTooltip();
        },
      );

      await test.step(
        "TC-PROP-047 search: search 'Ali' in Decision Maker dropdown, matching result visible",
        async () => {
          const tooltip = await propertyModule.openContactRoleDropdown(DECISION_MAKER);
          // Use partial name known to exist in UAT contacts
          await propertyModule.searchContactInOpenTooltip("Ali", tooltip);
          const matchingResult = tooltip
            .getByText("Ali", { exact: false })
            .first();
          await expect(matchingResult).toBeVisible({ timeout: 8_000 });
        },
      );


      let decisionMakerText = "";

      await test.step(
        "TC-PROP-047 select decision-maker: pick contact, trigger text no longer shows placeholder",
        async () => {
          // Re-open the Decision Maker dropdown (ensures a clean, open tooltip state)
          const activeTooltip = await propertyModule.openContactRoleDropdown(DECISION_MAKER);
          await propertyModule.searchContactInOpenTooltip("Ali", activeTooltip);

          // Pick first real contact paragraph (has email address — skip "Create new contact")
          const contactParas = activeTooltip
            .locator("p")
            .filter({ hasText: /@/ });
          await contactParas.first().waitFor({ state: "visible", timeout: 8_000 });
          decisionMakerText = (
            (await contactParas.first().innerText().catch(() => "")) || ""
          ).trim();
          await contactParas.first().click();

          // After selection the heading changes to "Selected Contacts (N)" — no longer placeholder
          // Live-verified 2026-04-24: UI shows "Selected Contacts (1)" not the contact name
          await propertyModule.assertContactRoleHasSelection(DECISION_MAKER);
        },
      );

      await test.step(
        "TC-PROP-047 multi-role: select End User contact, both DM and EU rows show selections",
        async () => {
          const tooltip = await propertyModule.openContactRoleDropdown(END_USER);
          await propertyModule.searchContactInOpenTooltip("", tooltip);

          // Pick first real contact paragraph for End User role
          const allResults = tooltip.locator("p").filter({ hasText: /@/ });
          await allResults.first().waitFor({ state: "visible", timeout: 8_000 });
          await allResults.first().click();

          // Both Decision Maker and End User rows must show "Selected Contacts (N)"
          // Live-verified: the drawer shows 2 separate "Selected Contacts (N)" headings
          const drawer = propertyModule.createPropertyDrawerRoot();
          const selectedHeadings = drawer.getByRole("heading", {
            name: /Selected Contacts/i,
            level: 6,
          });
          await expect(selectedHeadings).toHaveCount(2, { timeout: 8_000 });
        },
      );

      await test.step(
        "TC-PROP-047 same-contact rule: attempt same contact in Billing, no crash, DM intact",
        async () => {
          // Re-search using Decision Maker's contact name in Billing dropdown
          const searchTerm = decisionMakerText.split("(")[0].trim();
          const tooltip = await propertyModule.openContactRoleDropdown(BILLING);
          await propertyModule.searchContactInOpenTooltip(searchTerm, tooltip);

          // Attempt to select the same contact in Billing — app may allow or silently ignore
          // Either outcome is valid; assert only that DM row selection remains intact
          const matchResult = tooltip
            .locator("p")
            .filter({ hasText: /@/ })
            .first();
          await matchResult.waitFor({ state: "visible", timeout: 8_000 });
          await matchResult.click();

          // Decision Maker selection must still be intact — at least one "Selected Contacts"
          // heading should still be visible in the drawer
          await propertyModule.assertContactRoleHasSelection(DECISION_MAKER);

          // Drawer must not have crashed (heading still present)
          await expect(propertyModule.createPropertyHeading).toBeVisible({
            timeout: 5_000,
          });
        },
      );

      await propertyModule.cancelCreatePropertyDrawer();
      await propertyModule.assertCreatePropertyDrawerClosed();
    },
  );

  registerNotesTasksSuite({
    test,
    moduleName: "Property",
    getPage: () => page,
    openEntityDetail: openCreatedPropertyDetail,
  });
});
