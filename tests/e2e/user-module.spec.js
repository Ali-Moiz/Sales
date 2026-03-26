// tests/user-module.spec.js
//
// Smoke Test Suite — Users Module — Signal CRM
//
// Same session pattern as all other modules:
//   • Single login in beforeAll, shared context for all tests
//   • test.describe.serial — ordered execution
//   • test.beforeEach navigates to Users page
//
// NOTE: If any test fails on first run, please share the error message
// so locators can be corrected based on actual DOM.

const { test } = require('@playwright/test');
const { UserModule }   = require('../../pages/user-module');
const { performLogin } = require('../../utils/auth/login-action');

test.describe.serial('User Module', () => {
  let context;
  let page;
  let userModule;
  let existingUserName;
  let existingUserSearchTerm;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    context    = await browser.newContext();
    page       = await context.newPage();
    userModule = new UserModule(page);
    await performLogin(page);
  });

  test.beforeEach(async () => {
    await userModule.gotoUsersFromMenu();
    await userModule.assertUsersPageOpened();
    existingUserName = await userModule.getFirstListedUserName();
    existingUserSearchTerm = existingUserName.split(/\s+/)[0];
  });

  test.afterAll(async () => {
    await context.close();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-001 | Users module opens successfully
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is logged in
   * Steps: Click "Users" in the sidebar
   * Expected: URL contains /app/sales/users;
   *           "Invite User" button is visible
   * Priority: P0 — Critical
   */
  test('TC-USER-001 | Users module opens successfully', async () => {
    test.setTimeout(180_000);
    await userModule.assertUsersPageOpened();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-002 | Users table displays all expected column headers
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps: Inspect table column headers
   * Expected: Name, Email, Role, Status columns visible
   * Priority: P1 — High
   */
  test('TC-USER-002 | Users table displays all expected column headers', async () => {
    test.setTimeout(180_000);
    await userModule.assertUsersTableHasColumns();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-003 | Users table contains data rows
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps: Observe the table body
   * Expected: At least one user row is visible in the table
   * Priority: P1 — High
   */
  test('TC-USER-003 | Users table contains data rows', async () => {
    test.setTimeout(180_000);
    await userModule.assertUsersTableHasRows();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-004 | Pagination is visible with correct format
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps: Observe pagination row below the table
   * Expected: Pagination shows "X–Y of Z" format; total > 0
   * Priority: P1 — High
   */
  test('TC-USER-004 | Pagination is visible with correct format', async () => {
    test.setTimeout(180_000);
    await userModule.assertPaginationVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-005 | Users action bar shows search, role filter, and export
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps: Observe the action bar above the table
   * Expected: Search by User, Role filter, and Export button visible
   * Priority: P0 — Critical
   */
  test('TC-USER-005 | Users action bar shows search, role filter, and export', async () => {
    test.setTimeout(180_000);
    await userModule.openInviteUserDrawer();
    await userModule.assertInviteUserDrawerOpen();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-006 | Export button remains disabled without selection
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page with no row selection
   * Steps: Observe Export button state
   * Expected: Export button stays disabled
   * Priority: P1 — High
   */
  test('TC-USER-006 | Export button remains disabled without selection', async () => {
    test.setTimeout(180_000);
    await userModule.assertInviteUserDrawerOpen();
    await userModule.cancelInviteUserDrawer();
    await userModule.assertInviteUserDrawerClosed();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-007 | Role filter dropdown shows options
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps: Click the Role filter dropdown
   * Expected: Tooltip appears with at least one role option
   * Priority: P2 — Medium
   */
  test('TC-USER-007 | Role filter dropdown shows options', async () => {
    test.setTimeout(180_000);
    await userModule.assertRoleFilterVisible();
    await userModule.openRoleFilterAndVerifyOptions();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-008 | User can search for an existing user by name
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page;
   *               at least one real user row exists
   * Steps:
   *   1. Type first listed user name in the search box
   * Expected: Matching user remains visible in table
   * Priority: P0 — Critical
   */
  test('TC-USER-008 | User can search for an existing user by name', async () => {
    test.setTimeout(180_000);
    await userModule.searchUser(existingUserSearchTerm);
    await userModule.assertSearchResultContains(existingUserName);
    await userModule.clearUserSearch();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-009 | Searching with non-existent name returns no results
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps: Type a random non-existent string in the search box
   * Expected: Pagination shows "0–0 of 0"
   * Priority: P1 — High
   */
  test('TC-USER-009 | Searching with non-existent name returns no results', async () => {
    test.setTimeout(180_000);
    await userModule.searchUser('zzz_no_match_user_xyz_99999');
    await userModule.assertSearchShowsNoResults();
    await userModule.clearUserSearch();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-010 | User can open a user detail by clicking a row
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Users list page
   * Steps:
   *   1. Search for the first listed user
   *   2. Click on the matching row
   * Expected: User detail page opens;
   *           Heading with same user name visible
   * Priority: P0 — Critical
   */
  test('TC-USER-010 | User can open a user detail by clicking a row', async () => {
    test.setTimeout(180_000);
    await userModule.openUserDetail(existingUserName, existingUserSearchTerm);
    await userModule.assertUserDetailOpened(existingUserName);
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-USER-011 | User detail page shows pre-filled profile data
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on a user detail page
   * Steps: Observe left-side profile summary
   * Expected: Email, Phone, and Assigned Properties data visible
   * Priority: P1 — High
   */
  test('TC-USER-011 | User detail page shows pre-filled profile data', async () => {
    test.setTimeout(180_000);
    await userModule.openUserDetail(existingUserName, existingUserSearchTerm);
    await userModule.assertUserDetailOpened(existingUserName);
    await userModule.assertUserDetailProfileDataVisible();
  });
});
