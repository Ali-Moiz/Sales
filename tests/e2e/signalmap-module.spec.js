
// tests/signal-map-module.spec.js
//
// Smoke Test Suite — Signal Map Module — Signal CRM
// URL: /app/sales/leads-map
//
// Same session pattern as all other modules:
//   • Single login in beforeAll, shared context for all tests
//   • test.describe — ordered execution
//   • test.beforeEach navigates to Signal Map page

const { test } = require('@playwright/test');
const { SignalMapModule } = require('../../pages/signalmap-module');
const { performLogin }    = require('../../utils/auth/login-action');

test.describe('Signal Map Module', () => {
  let context;
  let page;
  let signalMap;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    context   = await browser.newContext();
    page      = await context.newPage();
    signalMap = new SignalMapModule(page);
    await performLogin(page);
  });

  test.beforeEach(async () => {
    await signalMap.gotoSignalMapFromMenu();
    await signalMap.assertSignalMapPageOpened();
  });

  test.afterAll(async () => {
    await context.close();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-001 | Signal Map module opens successfully
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is logged in
   * Steps: Click "Signal Map" in the sidebar
   * Expected: URL contains /app/sales/leads-map
   * Priority: P0 — Critical
   */
  test('TC-SMAP-001 | Signal Map module opens successfully', async () => {
    test.setTimeout(180_000);
    await signalMap.assertSignalMapPageOpened();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-002 | Map canvas renders on the page
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Observe the main content area
   * Expected: A map canvas element (Google Maps .gm-style or Leaflet
   *           .leaflet-container) is visible in the DOM
   * Priority: P0 — Critical
   */
  test('TC-SMAP-002 | Map canvas renders on the page', async () => {
    test.setTimeout(180_000);
    await signalMap.assertMapCanvasVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-003 | Search input is visible on the map page
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Observe the filter/control bar
   * Expected: A searchbox or text input for searching properties is visible
   * Priority: P1 — High
   */
  test('TC-SMAP-003 | Search input is visible on the map page', async () => {
    test.setTimeout(180_000);
    await signalMap.assertSearchInputVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-004 | SP Status filter dropdown is visible
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Observe the filter bar
   * Expected: SP Status filter heading visible
   * Priority: P1 — High
   */
  test('TC-SMAP-004 | SP Status filter dropdown is visible', async () => {
    test.setTimeout(180_000);
    await signalMap.assertPropertyTypeFilterVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-005 | Create Property via Map button is visible
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Observe the filter bar
   * Expected: Create Property via Map button visible
   * Priority: P1 — High
   */
  test('TC-SMAP-005 | Create Property via Map button is visible', async () => {
    test.setTimeout(180_000);
    await signalMap.assertStageFilterVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-006 | Status legend is visible
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Observe the filter bar
   * Expected: Franchise, New, Old, Existing, Lost legend labels visible
   * Priority: P1 — High
   */
  test('TC-SMAP-006 | Status legend is visible', async () => {
    test.setTimeout(180_000);
    await signalMap.assertDateRangePickerVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-007 | SP Status filter opens and shows options
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Click the SP Status filter dropdown
   * Expected: Tooltip appears with at least one paragraph option
   * Priority: P1 — High
   */
  test('TC-SMAP-007 | SP Status filter opens and shows options', async () => {
    test.setTimeout(180_000);
    await signalMap.assertPropertyTypeFilterHasOptions();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-008 | Status legend shows all expected categories
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps: Observe the status legend section
   * Expected: Franchise, New, Old, Existing, Lost all visible
   * Priority: P1 — High
   */
  test('TC-SMAP-008 | Status legend shows all expected categories', async () => {
    test.setTimeout(180_000);
    await signalMap.assertStageFilterHasOptions();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-009 | Map zoom controls (Zoom In / Zoom Out) are visible
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page; map canvas is loaded
   * Steps: Observe the map for zoom controls
   * Expected: At least a Zoom In button is visible within the map
   * Priority: P1 — High
   */
  test('TC-SMAP-009 | Map zoom controls are visible', async () => {
    test.setTimeout(180_000);
    await signalMap.assertMapCanvasVisible();
    await signalMap.assertZoomControlsVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC-SMAP-010 | User can type in the search box without errors
  // ══════════════════════════════════════════════════════════════════════
  /**
   * Preconditions: User is on the Signal Map page
   * Steps:
   *   1. Click the search input
   *   2. Type a search term (e.g. "Omaha")
   *   3. Clear the input
   * Expected: Input accepts text; no JS errors; map remains visible
   * Priority: P1 — High
   */
  test('TC-SMAP-010 | User can type in the search box without errors', async () => {
    test.setTimeout(180_000);
    await signalMap.assertSearchInputVisible();
    await signalMap.searchOnMap('Omaha');
    // Map should still be present after search
    await signalMap.assertMapCanvasVisible();
    await signalMap.clearSearch();
  });
});
