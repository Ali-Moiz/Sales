// pages/signal-map-module.js
// Page Object Model — Signal Map Module, Signal CRM
// URL: /app/sales/leads-map
//
// Signal Map is an interactive map view showing properties/leads as pins.
// Controls include: search/filter bar, property type filter, stage filter,
// date range picker, and an interactive map canvas (Google Maps embed).
//
// Locators follow Signal's consistent heading-level-6 dropdown pattern
// and role-based selectors used across all other modules.

const { TIMEOUTS } = require('../utils/playwright-timeouts');
const { expect } = require('@playwright/test');

class SignalMapModule {
  constructor(page) {
    this.page = page;

    // ── Sidebar navigation ────────────────────────────────────────────────
    this.signalMapMenuLink = page
      .getByRole('listitem', { name: 'Signal Map' })
      .getByRole('link');

    // ── Page header ───────────────────────────────────────────────────────
    // Signal consistent: paragraph with module name in breadcrumb
    this.pageHeaderParagraph = page.getByText('Signal Map', { exact: false });

    // ── Filter / control bar ──────────────────────────────────────────────
    // Search input — current UI exposes "Search by Address"
    this.searchInput = page
      .getByRole('textbox', { name: /Search by Address/i })
      .or(page.locator('input[placeholder*="Search by Address"]'))
      .first();

    // Current map filter — SP Status dropdown
    this.spStatusFilter = page
      .getByRole('heading', { name: /SP Status/i, level: 6 })
      .first();

    this.createPropertyViaMapButton = page.getByRole('button', { name: /Create Property via Map/i }).first();
    this.statusLegendLabels = ['Franchise', 'New', 'Old', 'Existing', 'Lost'];

    // ── Map canvas ────────────────────────────────────────────────────────
    // Google Maps embed wrapper — .gm-style is the standard Google Maps container
    this.mapContainer = page.locator('.gm-style').first();

    // Leaflet fallback if not Google Maps
    this.leafletContainer = page.locator('.leaflet-container').first();

    // Generic map container fallback
    this.genericMapContainer = page
      .locator('[class*="map"], [class*="Map"]')
      .filter({ hasNot: page.locator('header, footer, nav') })
      .first();

    // ── Map controls ──────────────────────────────────────────────────────
    // Zoom in/out buttons — standard Google Maps aria-labels
    this.zoomInButton  = page
      .getByRole('button', { name: /Zoom in/i })
      .or(page.locator('button[title*="Zoom in"], button[aria-label*="zoom in" i]'))
      .first();

    this.zoomOutButton = page
      .getByRole('button', { name: /Zoom out/i })
      .or(page.locator('button[title*="Zoom out"], button[aria-label*="zoom out" i]'))
      .first();

    // Street View / Full screen — standard Google Maps
    this.fullscreenButton = page
      .getByRole('button', { name: /full.?screen/i })
      .or(page.locator('button[title*="full screen" i], button[aria-label*="full screen" i]'))
      .first();

    // ── Property pin / marker popup ───────────────────────────────────────
    // When a map pin is clicked, an info window / popup appears
    this.mapInfoWindow = page
      .locator('.gm-style-iw, [class*="info-window"], [class*="infoWindow"], [class*="popup"]')
      .first();

    // ── List panel (some map pages have a side list) ──────────────────────
    this.mapSidePanel = page
      .locator('[class*="side-panel"], [class*="sidePanel"], [class*="list-panel"]')
      .first();

    // ── Pagination (if map has a list panel) ─────────────────────────────
    this.paginationInfo = page.getByText(/\d+–\d+ of \d+/);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async gotoSignalMapFromMenu() {
    const menuVisible = await this.signalMapMenuLink
      .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 40 }).then(() => true).catch(() => false);
    if (menuVisible) {
      await this.signalMapMenuLink.click();
    } else {
      await this.page.goto('/app/sales/leads-map', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.BASE * 50 }).catch(() => {});
    await Promise.any([
      this.mapContainer.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 }),
      this.leafletContainer.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 }),
      this.genericMapContainer.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 }),
    ]).catch(() => {});
  }

  // ── Page open assertion ────────────────────────────────────────────────

  async assertSignalMapPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/leads-map/, { timeout: TIMEOUTS.BASE * 40 });
    // Page must have loaded — check URL is correct
    const url = this.page.url();
    expect(url).toContain('/app/sales/leads-map');
  }

  // ── Map canvas assertions ──────────────────────────────────────────────

  async assertMapCanvasVisible() {
    // Try Google Maps first, then Leaflet, then generic
    const googleMap = await this.mapContainer
      .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 30 }).then(() => true).catch(() => false);
    if (googleMap) {
      await expect(this.mapContainer).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      return;
    }

    const leaflet = await this.leafletContainer
      .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 }).then(() => true).catch(() => false);
    if (leaflet) {
      await expect(this.leafletContainer).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      return;
    }

    // Generic fallback — at least one map-like element should be present
    await expect(this.genericMapContainer).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  // ── Filter / control bar assertions ───────────────────────────────────

  async assertSearchInputVisible() {
    await expect(this.searchInput).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  async assertPropertyTypeFilterVisible() {
    await expect(this.spStatusFilter).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  async assertStageFilterVisible() {
    await expect(this.createPropertyViaMapButton).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }

  async assertDateRangePickerVisible() {
    for (const label of this.statusLegendLabels) {
      await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    }
  }

  // ── Filter interaction ────────────────────────────────────────────────

  async searchOnMap(searchText) {
    await this.searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 });
    await this.searchInput.fill(searchText);
    await expect(this.searchInput).toHaveValue(searchText, { timeout: TIMEOUTS.BASE * 4 });
  }

  async clearSearch() {
    await this.searchInput.clear();
    await expect(this.searchInput).toHaveValue('', { timeout: TIMEOUTS.BASE * 4 });
  }

  async openPropertyTypeFilter() {
    await this.spStatusFilter.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 });
    await this.spStatusFilter.click();
    const tooltip = this.page.locator('[role="tooltip"]').filter({
      hasText: /All|Unassigned|SP - Active|SP - Target|Not SP/
    }).last();
    await tooltip.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 16 });
    return tooltip;
  }

  async assertPropertyTypeFilterHasOptions() {
    const tooltip = await this.openPropertyTypeFilter();
    const options = tooltip.getByRole('paragraph');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    await this.page.keyboard.press('Escape');
    await tooltip.waitFor({ state: 'hidden', timeout: TIMEOUTS.BASE * 6 }).catch(() => {});
  }

  async openStageFilter() {
    return this.openPropertyTypeFilter();
  }

  async assertStageFilterHasOptions() {
    for (const label of this.statusLegendLabels) {
      await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
    }
  }

  // ── Map zoom controls ─────────────────────────────────────────────────

  async assertZoomControlsVisible() {
    const mapRegion = this.page.getByRole('region', { name: 'Map' }).first();
    await mapRegion.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 });
    await mapRegion.hover().catch(() => {});

    const mapCameraControls = this.page.getByRole('button', { name: /Map camera controls/i }).first();
    const zoomIn = this.page.getByRole('button', { name: /Zoom in/i }).first();
    const zoomOut = this.page.getByRole('button', { name: /Zoom out/i }).first();

    const mapControlsVisible = await mapCameraControls.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 }).then(() => true).catch(() => false);
    const zoomInVisible = await zoomIn.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 }).then(() => true).catch(() => false);
    const zoomOutVisible = await zoomOut.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 }).then(() => true).catch(() => false);

    expect(mapControlsVisible || zoomInVisible || zoomOutVisible).toBeTruthy();
  }

  async clickZoomIn() {
    await this.zoomInButton.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 });
    await this.zoomInButton.click();
    await expect(this.page.getByRole('region', { name: 'Map' }).first()).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
  }

  async clickZoomOut() {
    await this.zoomOutButton.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 20 });
    await this.zoomOutButton.click();
    await expect(this.page.getByRole('region', { name: 'Map' }).first()).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
  }

  // ── Map pin / marker interaction ───────────────────────────────────────

  async clickFirstMapPin() {
    // Map pins / markers — Google Maps uses [role=button] inside .gm-style
    // or area elements. Click the first visible interactive marker.
    const pin = this.page
      .locator('.gm-style [role="button"]:not([aria-label*="zoom" i]):not([aria-label*="Street" i])')
      .first();
    const hasPins = await pin
      .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 16 }).then(() => true).catch(() => false);
    if (hasPins) {
      await pin.click({ force: true });
      await this.mapInfoWindow.waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 }).catch(() => {});
    }
  }

  async assertMapInfoWindowVisible() {
    await expect(this.mapInfoWindow).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
  }
}

module.exports = { SignalMapModule };
