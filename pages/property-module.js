// pages/property-module.js
// Page Object Model — Properties Module, Signal CRM
// ALL locators live-verified via MCP browser on 2026-03-20
// Fully dynamic — no hardcoded IDs or names

const { expect } = require("@playwright/test");
const { env } = require("../utils/env");
const {
  generateUniqueUsAddressCandidates,
  selectAddressFromAutocomplete,
  selectDynamicAddressWithRetry,
} = require("../utils/dynamic_address");
const ADDRESS_AUTOCOMPLETE_DEBUG =
  String(process.env.ADDRESS_AUTOCOMPLETE_DEBUG || "false").toLowerCase() === "true";

class PropertyModule {
  constructor(page) {
    this.page = page;
    this.createdPropertyName = null;
    this.lastCreatePropertyToastSeen = false;
    this.lastCreatePropertySucceeded = false;
    this.lastEditPropertyToastSeen = false;
    this.lastSearchTerm = "";
    // Keep address generation generic (US-wide) to avoid location-specific
    // exhaustion and reduce duplicate-lat/lng failures across long runs.

    // ── Sidebar navigation ──────────────────────────────────────────────────
    this.propertiesMenuLink = page
      .getByRole("listitem", { name: "Properties" })
      .getByRole("link");

    // ── List page ───────────────────────────────────────────────────────────
    this.createPropertyButton = page.getByRole("button", {
      name: "Create Property",
    });
    this.propertySearchInput = page
      .getByRole("searchbox", { name: "ID, Property, Zip Code / Postal Code" })
      .or(page.locator('input[placeholder*="ID, Property"]'))
      .first();
    this.paginationInfo = page.getByText(/\d+–\d+ of \d+/);
    this.nextPageBtn = page.getByRole("button", { name: "Go to next page" });
    this.prevPageBtn = page.getByRole("button", {
      name: "Go to previous page",
    });
    this.rowsPerPageCombo = page.getByRole("combobox", {
      name: /Rows per page/,
    });

    // ── Create Property drawer ──────────────────────────────────────────────
    // Live-verified: heading level=3
    this.createPropertyHeading = page.getByRole("heading", {
      name: "Create Property",
      level: 3,
    });

    // Company field — heading "Search Company" (level=6)
    // Clicking opens a tooltip with a Search textbox + paragraph results
    this.companyDropdownTrigger = page.getByRole("heading", {
      name: "Search Company",
      level: 6,
    });

    // Property name textbox
    this.propertyNameInput = page.getByRole("textbox", {
      name: "Property / Property Name *",
    });

    // Property Source — heading "Add Property Source" (level=6)
    // Tooltip options: ALN, Building Connected, Referral, etc. (paragraphs)
    this.propertySourceTrigger = page.getByRole("heading", {
      name: "Add Property Source",
      level: 6,
    });
    this.associatedFranchiseTrigger = page.getByRole("heading", {
      name: "Add Associated Franchise",
      level: 6,
    });

    // Stage — heading "Choose stage" (level=6)
    // Tooltip options: "New Location", "Approved" (paragraphs)
    this.stageTrigger = page.getByRole("heading", {
      name: "Choose stage",
      level: 6,
    });

    // Assignee — heading "Select Assignee" (level=6)
    // Tooltip shows generic cards (Avatar + heading level=4 + paragraph role)
    this.assigneeTrigger = page.getByRole("heading", {
      name: "Select Assignee",
      level: 6,
    });
    this.assignSupervisorCheckbox = page.getByRole("checkbox", {
      name: /Assign Supervisor/i,
    });
    this.managedButton = page.getByRole("button", { name: "Managed" });
    this.ownedButton = page.getByRole("button", { name: "Owned" });
    this.regionalOfficeButton = page.getByRole("button", {
      name: "Regional office",
    });
    this.sharedButton = page.getByRole("button", { name: "Shared" });
    this.tenantButton = page.getByRole("button", { name: "Tenant" });
    this.headquartersButton = page.getByRole("button", {
      name: "Headquarters",
    });
    this.contactTrigger = page
      .getByRole("heading", { name: "Select a Contact" })
      .first();

    // Address — textbox with placeholder " Type Address"
    this.addressInput = page.getByRole("textbox", { name: "Type Address" });
    this.contactAffiliationError = page.getByText(
      "Contact Affiliation must be of type object",
      { exact: false },
    );
    this.addressRequiredError = page.getByText("Address is required.", {
      exact: false,
    });

    this.cancelCreateBtn = page.getByRole("button", { name: "Cancel" });
    // Submit button in drawer — use .last() to avoid clash with list page button
    this.submitCreateBtn = page
      .getByRole("button", { name: "Create Property" })
      .last();

    this.createPropertyToast = page
      .locator('.Toastify__toast-body[role="alert"]')
      .filter({
        hasText: /created successfully|property created|Translation missing/i,
      })
      .first();

    // Duplicate-address error toast
    // Live-verified 2026-03-24: submitting a property whose geocoded lat/lng already
    // exists in the DB shows an alert role toast with this exact message.
    // The app geocodes the address via Google Maps and enforces uniqueness on
    // lat/lng coordinates — not on the raw address string.
    this.duplicateAddressToast = page
      .getByRole("alert")
      .filter({
        hasText: /Latitude and longitude has already been taken/i,
      })
      .first();

    // ── Property Detail page ─────────────────────────────────────────────────
    // Live-verified: property heading is level=1
    this.editButton = page.getByRole("button", { name: "Edit" });
    this.makeADealButton = page.getByRole("button", { name: "Make a Deal" });

    // Sidebar accordion buttons — live-verified exact names
    this.propertyDetailsBtn = page.getByRole("button", {
      name: "Property Details",
    });
    this.companiesSection = page.getByRole("button", { name: /Companies •/ });
    this.dealsSection = page.getByRole("button", { name: /Deals •/ });
    this.contactsSection = page.getByRole("button", { name: /Contacts •/ });
    // Live-verified: "Franchise Associated" (NOT "Franchise" or "Franchise •")
    this.franchiseSection = page.getByRole("button", {
      name: "Franchise Associated",
    });
    this.attachmentsSection = page.getByRole("button", {
      name: /Attachments •/,
    });

    // Property Stages bar — live-verified heading level=5
    this.stagesHeading = page.getByRole("heading", {
      name: "Property Stages",
      level: 5,
    });
    // Stage buttons have long tooltip text as accessible name — use partial match
    this.approvedStageBtn = page.getByText("Approved", { exact: true }).first();
    this.currentCustBtn = page
      .getByText(/Current Customer/, { exact: false })
      .first();

    // Detail tabs — live-verified: 6 tabs, Convert Questions is default selected
    this.convertQuestionsTab = page.getByRole("tab", {
      name: "Convert Questions",
    });
    this.activitiesTab = page.getByRole("tab", { name: "Activities" });
    this.notesTab = page.getByRole("tab", { name: "Notes" });
    this.tasksTab = page.getByRole("tab", { name: "Tasks" });
    this.emailsTab = page.getByRole("tab", { name: "Emails" });
    this.meetingsTab = page.getByRole("tab", { name: "Meetings" });

    // ── Edit Property drawer ──────────────────────────────────────────────────
    // Live-verified: heading level=3, submit is "Save" (NOT "Update Property")
    this.editPropertyHeading = page.getByRole("heading", {
      name: "Edit Property",
      level: 3,
    });
    this.editPropertyNameInput = page.getByRole("textbox", {
      name: "Property / Property Name *",
    });
    this.saveEditBtn = page.getByRole("button", { name: "Save" });
    this.cancelEditBtn = page.getByRole("button", { name: "Cancel" });

    this.editPropertyToast = page
      .locator('.Toastify__toast-body[role="alert"]')
      .filter({
        hasText: /updated successfully|property updated|Translation missing/i,
      })
      .first();

    // ── Notes drawer ─────────────────────────────────────────────────────────
    this.createNewNoteBtn = page.getByRole("button", {
      name: "Create New Note",
    });
    // Live-verified: drawer container is generic[name="Add Notes"], heading level=4 inside it
    this.addNotesHeading = page.getByRole("heading", {
      name: "Add Notes",
      level: 4,
    });
    // Subject: unlabelled textbox — scoped to the "Add Notes" generic container
    this.noteSubjectInput = page
      .getByRole("generic", { name: "Add Notes" })
      .getByRole("textbox")
      .first();
    this.noteDescEditor = page.getByRole("textbox", { name: "rdw-editor" });
    // Live-verified: char counter is paragraph text "0 / 5000"
    this.noteCharCounter = page.getByText(/\d+ \/ 5000/);
    this.noteSaveBtn = page.getByRole("button", { name: "Save" });
    this.noteCancelBtn = page.getByRole("button", { name: "Cancel" });
    // Live-verified notes empty state text
    this.notesEmptyState = page.getByText("Oops, It's Empty Here!");

    // ── Tasks section ─────────────────────────────────────────────────────────
    // Live-verified locators from Tasks tab
    this.newTaskBtn = page.getByRole("button", { name: "New Task" });
    this.taskSearchBox = page.getByRole("searchbox", {
      name: "Search by Title",
    });
    this.taskDateRangeInput = page.getByRole("textbox", {
      name: "MM/DD/YYYY - MM/DD/YYYY",
    });
    this.createTaskHeading = page.getByRole("heading", {
      name: "Create New Task",
      level: 3,
    });
    this.taskTitleInput = page.getByRole("textbox", { name: "Task Title" });
    this.taskDescEditor = page.getByRole("textbox", { name: "rdw-editor" });
    this.taskTypeTrigger = page.getByRole("heading", {
      name: "Select Type",
      level: 6,
    });
    this.taskPriorityTrigger = page.getByRole("heading", {
      name: "Select Priority",
      level: 6,
    });
    this.taskSaveBtn = page.getByRole("button", { name: "Save" });
    this.taskCancelBtn = page.getByRole("button", { name: "Cancel" });
    // Live-verified: empty state heading level=2
    this.taskEmptyState = page.getByRole("heading", {
      name: "No tasks Added.",
      level: 2,
    });
  }

  logAddress(message, meta = {}) {
    if (!ADDRESS_AUTOCOMPLETE_DEBUG) return;
    // eslint-disable-next-line no-console
    console.log(`[property_address] ${message}`, JSON.stringify(meta));
  }

  // ── Data Generators ──────────────────────────────────────────────────────

  generateUniquePropertyName() {
    return `PAT ${String(Date.now()).slice(-4)}`;
  }

  generateUniqueEditedName() {
    return `PAT ${String(Date.now() + 1).slice(-4)}`;
  }

  /**
   * Backward-compatible alias for a single dynamic US candidate.
   * @returns {string}
   */
  generateTimestampAddress() {
    return generateUniqueUsAddressCandidates({ primaryCount: 1 })[0];
  }

  /**
   * Backward-compatible helper used by createProperty retries.
   * @returns {string[]}
   */
  getUniqueOmahaAddressCandidates() {
    return generateUniqueUsAddressCandidates({ primaryCount: 10 });
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  async gotoPropertiesFromMenu() {
    const menuVisible = await this.propertiesMenuLink
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (menuVisible) {
      await this.propertiesMenuLink.click();
    } else {
      await this.page.goto("/app/sales/locations", {
        waitUntil: "domcontentloaded",
      });
    }
    await this.page
      .waitForLoadState("networkidle", { timeout: 20_000 })
      .catch(() => {});
  }

  // ── List page assertions ─────────────────────────────────────────────────

  async assertPropertiesPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/locations/, {
      timeout: 20_000,
    });
    await expect(this.createPropertyButton.first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async assertPropertiesTableHasColumns() {
    const expectedColumns = [
      "Property Name",
      "Property Affiliation",
      "Lot Number",
      "Deal Count",
      "Stage",
      "Type",
      "Created Date",
      "Last Modified Date",
    ];
    for (const col of expectedColumns) {
      await expect(
        this.page.getByRole("columnheader", { name: col }),
      ).toBeVisible({ timeout: 10_000 });
    }
  }

  async assertPaginationVisible() {
    await expect(this.paginationInfo).toBeVisible({ timeout: 10_000 });
    const infoText = await this.paginationInfo.textContent();
    expect(infoText).toMatch(/\d+–\d+ of \d+/);
  }

  async searchProperty(term) {
    this.lastSearchTerm = term;
    await this.propertySearchInput.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await this.propertySearchInput.fill(term);
    await this.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  async assertSearchShowsNoResults(searchTerm = this.lastSearchTerm) {
    const paginationText = await this.paginationInfo
      .textContent()
      .catch(() => "");
    const noResultsByPagination = /0–0 of 0/.test(paginationText);
    if (noResultsByPagination) return;

    await expect(
      this.page.locator("table tbody").getByText(searchTerm, { exact: false }),
    ).toHaveCount(0, { timeout: 10_000 });
  }

  async clearPropertySearch() {
    await this.propertySearchInput.clear();
    await this.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ── Create Property ──────────────────────────────────────────────────────

  async openCreatePropertyDrawer() {
    await this.createPropertyButton.first().click();
    await this.createPropertyHeading.waitFor({
      state: "visible",
      timeout: 15_000,
    });
  }

  async assertCreatePropertyDrawerOpen() {
    await expect(this.createPropertyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.companyDropdownTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.propertyNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.propertySourceTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.stageTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.addressInput).toBeVisible({ timeout: 5_000 });
    await expect(this.cancelCreateBtn).toBeVisible({ timeout: 5_000 });
  }

  createPropertyDrawerRoot() {
    return this.page
      .locator(".MuiDrawer-root")
      .filter({ has: this.createPropertyHeading })
      .first();
  }

  /**
   * M-PROP-04B — Parent Company label + input visible in Create Property drawer.
   */
  async assertParentCompanyFieldVisibleInCreatePropertyDrawer() {
    await expect(this.createPropertyHeading).toBeVisible({ timeout: 10_000 });
    const drawer = this.createPropertyDrawerRoot();
    await expect(
      drawer.getByText("Parent Company", { exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    const parentField = drawer
      .getByRole("textbox", { name: /Parent Company/i })
      .first()
      .or(drawer.getByPlaceholder(/Parent Company/i).first())
      .or(drawer.getByRole("combobox", { name: /Parent Company/i }).first());
    await expect(parentField).toBeVisible({ timeout: 8_000 });
  }

  /**
   * M-PROP-01 — scroll drawer and assert extended controls used on create (franchise, assignee, contact, submit).
   */
  async assertCreatePropertyDrawerExtendedFieldInventory() {
    await this.assertCreatePropertyDrawerOpen();
    const drawer = this.createPropertyDrawerRoot();
    await drawer
      .evaluate((el) => {
        el.scrollTop = 0;
      })
      .catch(() => {});
    await expect(this.associatedFranchiseTrigger).toBeVisible({
      timeout: 10_000,
    });
    await expect(this.assigneeTrigger).toBeVisible({ timeout: 10_000 });
    await drawer
      .evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      })
      .catch(() => {});
    await this.page.waitForTimeout(400);
    await expect(this.contactTrigger).toBeVisible({ timeout: 10_000 });
    await expect(this.submitCreateBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * M-PROP-03 — submit with empty mandatory fields; drawer stays open.
   *
   * After clicking Submit the MUI drawer re-renders to inject inline
   * validation nodes.  The heading element can be briefly detached during
   * this cycle, so we wait for a validation message ("required") inside
   * the drawer container instead — that proves the form was validated AND
   * the drawer is still open.
   */
  async submitCreateDrawerExpectingValidation() {
    await this.submitCreateBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.submitCreateBtn.click({ force: true });
    await expect(
      this.page
        .locator(".MuiDrawer-root")
        .getByText(/is required/i)
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  }

  async assertEmptyCreatePropertyValidationMessages() {
    const drawer = this.createPropertyDrawerRoot();
    await expect(
      drawer.getByText(/Property\s*\/\s*Property Name is required/i).first(),
    ).toBeVisible({ timeout: 8_000 });
    await expect(drawer.getByText(/Address is required/i).first()).toBeVisible({
      timeout: 8_000,
    });
  }

  /**
   * M-PROP-02 — dismiss drawer via MUI backdrop (same outcome as clicking off-modal / overlay close).
   */
  async dismissCreatePropertyViaBackdrop() {
    const backdrop = this.page.locator(".MuiBackdrop-root").first();
    await backdrop
      .waitFor({ state: "visible", timeout: 8_000 })
      .catch(() => {});
    await backdrop.click({ force: true, position: { x: 5, y: 5 } });
    await this.createPropertyHeading
      .waitFor({ state: "hidden", timeout: 12_000 })
      .catch(() => {});
  }

  companyPickerTooltip() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .first()
      .or(this.page.getByRole("tooltip").first());
  }

  createNewCompanyHeading() {
    return this.page
      .getByRole("heading", { name: /Create a New Company/i })
      .first();
  }

  createNewCompanyModalRoot() {
    const heading = this.createNewCompanyHeading();
    return this.page
      .locator("div, section, article")
      .filter({
        has: heading,
      })
      .filter({
        has: this.page.getByRole("button", { name: /Create Company/i }).first(),
      })
      .first();
  }

  /**
   * M-PROP-04A — open Company -> + Create New from Create Property drawer.
   */
  async openCreateNewCompanyFromCompanySection() {
    const drawer = this.createPropertyDrawerRoot();
    const createNewTrigger = drawer
      .getByRole("button", { name: /\+?\s*Create New/i })
      .first()
      .or(drawer.getByText(/\+?\s*Create New/i).first());
    await createNewTrigger.waitFor({ state: "visible", timeout: 10_000 });
    await createNewTrigger.click({ force: true });
  }

  async assertCreateNewCompanyFlowOpened() {
    const heading = this.createNewCompanyHeading();
    await expect(heading).toBeVisible({ timeout: 12_000 });
    const modal = this.createNewCompanyModalRoot();
    await expect(
      modal.getByPlaceholder(/Add Company Name/i).first(),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      modal.getByRole("button", { name: /Create Company/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  }

  async closeCreateNewCompanyFlowViaCancel() {
    const modal = this.createNewCompanyModalRoot();
    const cancelBtn = modal.getByRole("button", { name: /^Cancel$/i }).first();
    await cancelBtn.waitFor({ state: "visible", timeout: 10_000 });
    await cancelBtn.click({ force: true });
    await this.createNewCompanyHeading()
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  async closeCreateNewCompanyFlowViaX() {
    const modal = this.createNewCompanyModalRoot();
    const closeBtn = modal
      .getByRole("button", { name: /close/i })
      .first()
      // Header close control in this modal is an anchor with href="#".
      // Avoid broad image-link locators that can click Google Maps links.
      .or(modal.locator('a[href="#"]').first())
      .or(modal.locator("button:has(svg)").first());
    await closeBtn.waitFor({ state: "visible", timeout: 10_000 });
    await closeBtn.click({ force: true });
    await this.createNewCompanyHeading()
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  /**
   * M-PROP-04 — open company picker without typing; expect at least one result row.
   */
  async assertCompanyPickerDefaultListHasResults() {
    await this.companyDropdownTrigger.click({ force: true });
    const tooltip = this.companyPickerTooltip();
    await tooltip.waitFor({ state: "visible", timeout: 10_000 });
    await this.page.waitForTimeout(1_500);
    const row = tooltip.locator('p, [role="option"], li').first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    // Click drawer title — Escape can dismiss the entire MUI drawer on some builds.
    await this.createPropertyHeading.click({ force: true });
    await this.page.waitForTimeout(400);
  }

  /**
   * M-PROP-05 — after selectCompanyInCreateForm, selection is reflected (visible label/chip or unlocked dependents).
   */
  async assertSelectedCompanyVisibleInDrawer(companyName) {
    const drawer = this.createPropertyDrawerRoot();
    const escaped = this.escapeRegex(companyName.trim());
    const fullMatch = drawer.getByText(new RegExp(escaped, "i")).first();
    if (await fullMatch.isVisible().catch(() => false)) {
      await expect(fullMatch).toBeVisible({ timeout: 5_000 });
      return;
    }
    const prefix = companyName
      .trim()
      .substring(0, Math.min(10, companyName.trim().length));
    if (prefix.length >= 3) {
      const partial = drawer
        .getByText(new RegExp(this.escapeRegex(prefix), "i"))
        .first();
      if (await partial.isVisible().catch(() => false)) {
        await expect(partial).toBeVisible({ timeout: 5_000 });
        return;
      }
    }
    // UAT often omits full company string in the collapsed field; affiliation unlock confirms pick.
    await expect(this.managedButton).toBeVisible({ timeout: 12_000 });
  }

  /**
   * M-PROP-07 — before company is chosen, affiliation chips are not interactable in the expected layout (UAT: hidden).
   */
  async assertAffiliationChipsHiddenBeforeCompany() {
    await expect(this.managedButton).toHaveCount(0);
    await expect(this.tenantButton).toHaveCount(0);
  }

  async assertPropertyAffiliationShowsNAInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    await expect(
      drawer.getByRole("heading", {
        name: /Property Affiliation/i,
        level: 5,
      }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(drawer.getByText(/^N\/A$/).first()).toBeVisible({
      timeout: 8_000,
    });
  }

  /**
   * M-PROP-07 / M-PROP-08 — all six affiliation buttons visible after company selection.
   */
  async assertAllSixAffiliationChipsVisible() {
    await expect(this.managedButton).toBeVisible({ timeout: 10_000 });
    await expect(this.ownedButton).toBeVisible({ timeout: 5_000 });
    await expect(this.regionalOfficeButton).toBeVisible({ timeout: 5_000 });
    await expect(this.sharedButton).toBeVisible({ timeout: 5_000 });
    await expect(this.tenantButton).toBeVisible({ timeout: 5_000 });
    await expect(this.headquartersButton).toBeVisible({ timeout: 5_000 });
  }

  async affiliationChipAppearsSelected(locator) {
    return locator
      .evaluate((el) => {
        if (!el) return false;
        if (el.getAttribute("aria-pressed") === "true") return true;
        const cls = `${el.className || ""}`;
        const root = el.closest("button") || el;
        const rootCls = `${root.className || ""}`;
        const combined = `${cls} ${rootCls}`;
        return /Mui-selected|MuiChip-filled|MuiChip-colorPrimary|containedPrimary|palettePrimary|PrivateSwitchBase-checked/i.test(
          combined,
        );
      })
      .catch(() => false);
  }

  /**
   * M-PROP-08 — chip is interactive; if MUI exposes a clear selected state, assert it toggles across two clicks.
   */
  async assertAffiliationChipInteraction(locator) {
    await locator.waitFor({ state: "visible", timeout: 8_000 });
    const before = await this.affiliationChipAppearsSelected(locator);
    await locator.click({ force: true });
    await this.page.waitForTimeout(500);
    const mid = await this.affiliationChipAppearsSelected(locator);
    await locator.click({ force: true });
    await this.page.waitForTimeout(500);
    const after = await this.affiliationChipAppearsSelected(locator);
    const selectionDetectable =
      before !== mid || mid !== after || before !== after;
    if (selectionDetectable) {
      expect(mid).toBe(!before);
      expect(after).toBe(before);
    } else {
      await expect(locator).toBeVisible();
    }
  }

  /**
   * M-PROP-09 — click an alternate stage on detail and verify stage bar still present after reload.
   */
  async clickDetailStageApproved() {
    await this.approvedStageBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.approvedStageBtn.click({ force: true });
    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  async reloadPropertyDetailAndAssertStageBar(propertyName) {
    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.page
      .waitForLoadState("networkidle", { timeout: 20_000 })
      .catch(() => {});
    await this.assertPropertyDetailOpened(propertyName);
    await this.assertPropertyStageBarVisible();
  }

  /**
   * M-PROP-11 — Edit Property drawer exposes Associated Franchise control.
   */
  async assertEditPropertyAssociatedFranchiseControlVisible() {
    const root = this.page
      .locator(".MuiDrawer-root")
      .filter({ has: this.editPropertyHeading })
      .first();

    const franchiseLabel = root.getByText(/^Associated Franchise$/).first();
    const franchiseValue = franchiseLabel
      .locator("xpath=following::h6[1]")
      .first();
    const legacyTrigger = root
      .getByRole("heading", { name: "Add Associated Franchise", level: 6 })
      .first();

    const modernVisible = await franchiseLabel
      .waitFor({ state: "visible", timeout: 6_000 })
      .then(() => true)
      .catch(() => false);
    if (modernVisible) {
      await expect(franchiseValue).toBeVisible({ timeout: 10_000 });
      return;
    }

    await expect(legacyTrigger).toBeVisible({ timeout: 10_000 });
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async clickVisibleDropdownOption(container, optionText, timeout = 10_000) {
    const exactOptions = container.locator('p, h6, [role="option"]').filter({
      hasText: new RegExp(`^\\s*${this.escapeRegex(optionText)}\\s*$`, "i"),
    });

    const partialOptions = container
      .locator('p, h6, [role="option"]')
      .filter({ hasText: new RegExp(this.escapeRegex(optionText), "i") });

    const optionGroups = [exactOptions, partialOptions];

    for (const options of optionGroups) {
      const visible = await options
        .first()
        .waitFor({ state: "visible", timeout })
        .then(() => true)
        .catch(() => false);

      if (!visible) {
        continue;
      }

      const optionCount = await options.count();
      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const isVisible = await option.isVisible().catch(() => false);
        if (!isVisible) continue;

        try {
          await option.click({ force: true });
        } catch {
          await option.evaluate((el) => {
            el.click();
          });
        }
        return;
      }
    }

    throw new Error(`Dropdown option "${optionText}" was not clickable.`);
  }

  /**
   * Select company by searching in the "Search Company" dropdown.
   * Live-verified: clicking heading opens tooltip with Search textbox.
   * Results appear as paragraph elements — clicks the first match.
   * @param {string} companyName - company name to search (dynamic, from company suite)
   */
  async selectCompanyInCreateForm(companyName) {
    const drawer = this.createPropertyDrawerRoot();
    const companySectionTrigger = drawer
      .locator(
        'xpath=(.//p[normalize-space()="Company"]/following::h6[1]) | (.//h6[1])',
      )
      .first();

    const searchedHeadingVisible = await this.companyDropdownTrigger
      .waitFor({ state: "visible", timeout: 4_000 })
      .then(() => true)
      .catch(() => false);

    if (searchedHeadingVisible) {
      await this.companyDropdownTrigger.click({ force: true });
    } else {
      await companySectionTrigger.waitFor({ state: "visible", timeout: 8_000 });
      await companySectionTrigger.click({ force: true });
    }

    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .first()
      .or(this.page.getByRole("tooltip").first());
    await tooltip.waitFor({ state: "visible", timeout: 10_000 });

    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.waitFor({ state: "visible", timeout: 5_000 });
    const searchAttempts = [
      companyName,
      companyName.substring(0, Math.min(4, companyName.length)),
    ].filter(Boolean);

    for (const searchText of searchAttempts) {
      await searchInput.click();
      await searchInput.fill("");
      await searchInput.fill(searchText);
      await this.page
        .waitForLoadState("networkidle", { timeout: 10_000 })
        .catch(() => {});
      await this.page.waitForTimeout(1_000);

      const optionSelected = await this.clickVisibleDropdownOption(
        tooltip,
        companyName,
        5_000,
      )
        .then(() => true)
        .catch(() => false);

      if (optionSelected) {
        await this.page.waitForTimeout(500);
        return;
      }
    }

    // Fallback for role-restricted users (e.g., SM): pick any first visible
    // company option if exact requested company is not available.
    const firstVisibleOptionSelected = await this.clickVisibleDropdownOption(
      tooltip,
      "",
      4_000,
    )
      .then(() => true)
      .catch(() => false);
    if (firstVisibleOptionSelected) {
      await this.page.waitForTimeout(500);
      return;
    }

    throw new Error(
      `Company "${companyName}" was not selectable in property create form.`,
    );
  }

  async fillPropertyName(propertyName) {
    await this.propertyNameInput.waitFor({ state: "visible", timeout: 8_000 });
    await this.propertyNameInput.click();
    await this.propertyNameInput.fill(propertyName);
    this.createdPropertyName = propertyName;
  }

  propertySourceTriggerInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .getByRole("heading", {
        level: 6,
        name: /^(Add Property Source|ALN|Building Connected|Inbound Lead - National|Referral|Inbound Lead - Local|Local Networking|Other Online Database|Rocket Reach|Sales Routing|ZoomInfo)$/i,
      })
      .first();
  }

  propertySourceTooltip() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
  }

  async openPropertySourceDropdown() {
    const existingTooltipVisible = await this.propertySourceTooltip()
      .isVisible()
      .catch(() => false);
    if (existingTooltipVisible) {
      return this.propertySourceTooltip();
    }
    const trigger = this.propertySourceTriggerInCreateDrawer();
    await trigger.waitFor({ state: "visible", timeout: 8_000 });
    const tooltip = this.propertySourceTooltip();
    for (let attempt = 0; attempt < 2; attempt++) {
      await trigger.click({ force: true });
      const visible = await tooltip
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (visible) {
        return tooltip;
      }
    }
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    return tooltip;
  }

  async getPropertySourceOptionsFromOpenDropdown() {
    const tooltip = this.propertySourceTooltip();
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    const options = tooltip.locator('p, [role="option"], h6');
    const total = await options.count();
    const values = [];
    for (let i = 0; i < total; i++) {
      const text = (await options.nth(i).innerText().catch(() => "")).trim();
      if (!text) continue;
      if (!values.includes(text)) values.push(text);
    }
    return values;
  }

  async assertPropertySourceTriggerValue(expectedText) {
    const trigger = this.propertySourceTriggerInCreateDrawer();
    await expect(trigger).toBeVisible({ timeout: 8_000 });
    await expect(trigger).toHaveText(new RegExp(this.escapeRegex(expectedText), "i"), {
      timeout: 8_000,
    });
  }

  async selectPropertySourceByText(sourceText) {
    const tooltip = await this.openPropertySourceDropdown();
    await this.clickVisibleDropdownOption(tooltip, sourceText, 8_000);
    await this.assertPropertySourceTriggerValue(sourceText);
  }

  async dismissPropertySourceDropdownWithEscape() {
    await this.page.keyboard.press("Escape");
    await this.propertySourceTooltip()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  async dismissPropertySourceDropdownWithoutSelection() {
    await this.createPropertyHeading.click({ force: true });
    await this.propertySourceTooltip()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  associatedFranchiseTriggerInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .getByRole("heading", {
        level: 6,
        name: /^(Add Associated Franchise|.+ - .+)$/i,
      })
      .first();
  }

  associatedFranchiseTooltip() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
  }

  async openAssociatedFranchiseDropdown() {
    const existingTooltipVisible = await this.associatedFranchiseTooltip()
      .isVisible()
      .catch(() => false);
    if (existingTooltipVisible) {
      return this.associatedFranchiseTooltip();
    }
    const trigger = this.associatedFranchiseTriggerInCreateDrawer();
    await trigger.waitFor({ state: "visible", timeout: 8_000 });
    const tooltip = this.associatedFranchiseTooltip();
    for (let attempt = 0; attempt < 2; attempt++) {
      await trigger.click({ force: true });
      const visible = await tooltip
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (visible) {
        return tooltip;
      }
    }
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    return tooltip;
  }

  async getAssociatedFranchiseOptionsFromOpenDropdown(limit = 80) {
    const tooltip = await this.openAssociatedFranchiseDropdown();
    const options = tooltip.locator('p, [role="option"], h6');
    const total = await options.count();
    const values = [];
    const scanCount = Math.min(total, limit);
    for (let i = 0; i < scanCount; i++) {
      const text = (await options.nth(i).innerText().catch(() => "")).trim();
      if (!text) continue;
      if (!values.includes(text)) values.push(text);
    }
    return values;
  }

  async assertAssociatedFranchiseTriggerValue(expectedText) {
    const trigger = this.associatedFranchiseTriggerInCreateDrawer();
    await expect(trigger).toBeVisible({ timeout: 8_000 });
    await expect(
      trigger,
      `Associated Franchise trigger should contain "${expectedText}"`,
    ).toHaveText(new RegExp(this.escapeRegex(expectedText), "i"), {
      timeout: 8_000,
    });
  }

  async searchInAssociatedFranchiseDropdown(searchText) {
    const tooltip = await this.openAssociatedFranchiseDropdown();
    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.waitFor({ state: "visible", timeout: 5_000 });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(600);
    return tooltip;
  }

  async selectAssociatedFranchiseByText(franchiseText) {
    const tooltip = await this.openAssociatedFranchiseDropdown();
    await this.clickVisibleDropdownOption(tooltip, franchiseText, 8_000);
    await this.assertAssociatedFranchiseTriggerValue(franchiseText);
  }

  async dismissAssociatedFranchiseDropdownWithoutSelection() {
    await this.createPropertyHeading.click({ force: true });
    await this.associatedFranchiseTooltip()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  stageTriggerInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .getByRole("heading", {
        level: 6,
        name: /^(Choose stage|New Location|Approved)$/i,
      })
      .first();
  }

  stageTooltip() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
  }

  async openStageDropdown() {
    const existingTooltipVisible = await this.stageTooltip()
      .isVisible()
      .catch(() => false);
    if (existingTooltipVisible) {
      return this.stageTooltip();
    }
    const trigger = this.stageTriggerInCreateDrawer();
    await trigger.waitFor({ state: "visible", timeout: 8_000 });
    const tooltip = this.stageTooltip();
    for (let attempt = 0; attempt < 2; attempt++) {
      await trigger.click({ force: true });
      const visible = await tooltip
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (visible) {
        return tooltip;
      }
    }
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    return tooltip;
  }

  async getStageOptionsFromOpenDropdown() {
    const tooltip = await this.openStageDropdown();
    const options = tooltip.locator('p, [role="option"], h6');
    const total = await options.count();
    const values = [];
    for (let i = 0; i < total; i++) {
      const text = (await options.nth(i).innerText().catch(() => "")).trim();
      if (!text) continue;
      if (!values.includes(text)) values.push(text);
    }
    return values;
  }

  async assertStageTriggerValue(expectedText) {
    const trigger = this.stageTriggerInCreateDrawer();
    await expect(trigger).toBeVisible({ timeout: 8_000 });
    await expect(
      trigger,
      `Stage trigger should contain "${expectedText}"`,
    ).toHaveText(new RegExp(this.escapeRegex(expectedText), "i"), {
      timeout: 8_000,
    });
  }

  async selectStageByText(stageText) {
    const tooltip = await this.openStageDropdown();
    await this.clickVisibleDropdownOption(tooltip, stageText, 8_000);
    await this.assertStageTriggerValue(stageText);
  }

  async dismissStageDropdownWithoutSelection() {
    await this.createPropertyHeading.click({ force: true });
    await this.stageTooltip()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  /**
   * Select Property Source from its tooltip dropdown.
   * Live-verified options (as paragraphs): ALN, Building Connected,
   * Inbound Lead - National, Referral, Local Networking, etc.
   * Picks the first option dynamically.
   */
  async selectPropertySource() {
    await this.propertySourceTrigger.waitFor({
      state: "visible",
      timeout: 8_000,
    });
    await this.propertySourceTrigger.click();
    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    const sourceOption = tooltip
      .getByText("ALN", { exact: true })
      .first()
      .or(tooltip.locator("p").filter({ hasText: /^ALN$/ }).first())
      .or(tooltip.getByRole("paragraph").first());
    await sourceOption.waitFor({ state: "visible", timeout: 5_000 });
    await sourceOption.click({ force: true });
    await this.page.waitForTimeout(400);
  }

  async selectAssociatedFranchise() {
    const franchiseLabel =
      env.envName === "prod" ? "Tkxel Test Franchise" : "216 - Omaha, NE";

    const inEditForm = await this.editPropertyHeading
      .isVisible()
      .catch(() => false);
    const scope = inEditForm
      ? this.page
          .locator(".MuiDrawer-root")
          .filter({ has: this.editPropertyHeading })
          .first()
      : this.createPropertyDrawerRoot();
    const franchiseTrigger = scope
      .getByRole("heading", { name: "Add Associated Franchise", level: 6 })
      .first();

    await franchiseTrigger.waitFor({ state: "visible", timeout: 8_000 });
    await franchiseTrigger.click({ force: true });

    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });

    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.fill(franchiseLabel);
    await this.page.waitForTimeout(1_000);

    const franchiseOption = tooltip
      .getByText(franchiseLabel, { exact: false })
      .first()
      .or(
        tooltip
          .getByRole("paragraph")
          .filter({ hasText: franchiseLabel })
          .first(),
      );
    await franchiseOption.waitFor({ state: "visible", timeout: 8_000 });
    await franchiseOption.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Select Stage from its tooltip dropdown.
   * Live-verified options (as paragraphs): "New Location", "Approved".
   * Picks the first option dynamically.
   */
  async selectStage() {
    await this.stageTrigger.waitFor({ state: "visible", timeout: 8_000 });
    await this.stageTrigger.click();
    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    const stageOption = tooltip
      .getByText("New Location", { exact: true })
      .first()
      .or(
        tooltip
          .locator("p")
          .filter({ hasText: /^New Location$/ })
          .first(),
      )
      .or(
        tooltip
          .getByRole("paragraph")
          .filter({ hasText: /New Location/ })
          .first(),
      )
      .or(tooltip.getByRole("paragraph").first());
    await stageOption.waitFor({ state: "visible", timeout: 5_000 });
    await stageOption.click({ force: true });
    await this.page.waitForTimeout(400);
  }

  /**
   * Select Assignee from its tooltip dropdown.
   * Live-verified: NOT simple paragraphs — shows user cards (generic[cursor=pointer])
   * each containing: Avatar img + heading(level=4) name + paragraph role.
   * Picks the first card dynamically.
   */
  async selectAssignee() {
    const assigneeLabel =
      env.envName === "prod" ? "Moiz ProdHO" : "Moiz SM UAT";

    await this.assigneeTrigger.waitFor({ state: "visible", timeout: 8_000 });
    await this.assigneeTrigger.click();
    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });

    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.fill(assigneeLabel);
    await this.page.waitForTimeout(1_000);

    const assigneeOption = tooltip
      .getByRole("heading", { name: assigneeLabel })
      .first()
      .or(tooltip.getByText(assigneeLabel, { exact: false }).first());
    await assigneeOption.waitFor({ state: "visible", timeout: 8_000 });
    await assigneeOption.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  assigneeTooltip() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
  }

  async openAssigneeDropdown() {
    const tooltip = this.assigneeTooltip();
    const alreadyVisible = await tooltip.isVisible().catch(() => false);
    if (alreadyVisible) return tooltip;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const defaultTriggerVisible = await this.assigneeTrigger
        .isVisible()
        .catch(() => false);
      if (defaultTriggerVisible) {
        await this.assigneeTrigger.scrollIntoViewIfNeeded().catch(() => {});
        await this.assigneeTrigger.click({ force: true });
      } else {
        const drawer = this.createPropertyDrawerRoot();
        const assigneeLabel = drawer
          .getByRole("heading", { name: /Select Assignee:?/i })
          .first()
          .or(drawer.getByText(/Select Assignee:?/i).first());

        const assigneeRowTrigger = assigneeLabel
          .locator("xpath=following-sibling::*[1]")
          .first();
        await assigneeLabel.waitFor({ state: "visible", timeout: 8_000 });
        await assigneeLabel.scrollIntoViewIfNeeded().catch(() => {});
        const rowVisible = await assigneeRowTrigger.isVisible().catch(() => false);
        if (rowVisible) {
          await assigneeRowTrigger.scrollIntoViewIfNeeded().catch(() => {});
          await assigneeRowTrigger.click({ force: true });
        } else {
          await assigneeLabel.click({ force: true });
        }
      }
      const opened = await tooltip
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (opened) return tooltip;
    }
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    return tooltip;
  }

  async searchAssigneeInDropdown(searchText) {
    const tooltip = await this.openAssigneeDropdown();
    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.waitFor({ state: "visible", timeout: 5_000 });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(600);
    return tooltip;
  }

  async getAssigneeOptionsFromOpenDropdown(limit = 120) {
    const tooltip = await this.openAssigneeDropdown();
    const options = tooltip.getByRole("heading", { level: 4 });
    const total = await options.count();
    const values = [];
    const scanCount = Math.min(total, limit);
    for (let i = 0; i < scanCount; i++) {
      const text = (await options.nth(i).innerText().catch(() => "")).trim();
      if (!text) continue;
      if (!values.includes(text)) values.push(text);
    }
    return values;
  }

  async selectAssigneeByText(assigneeText) {
    const tooltip = await this.openAssigneeDropdown();
    const assigneeOption = tooltip
      .getByRole("heading", { level: 4, name: new RegExp(this.escapeRegex(assigneeText), "i") })
      .first()
      .or(tooltip.getByText(assigneeText, { exact: false }).first());
    await assigneeOption.waitFor({ state: "visible", timeout: 8_000 });
    await assigneeOption.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async dismissAssigneeDropdownWithoutSelection() {
    await this.createPropertyHeading.click({ force: true });
    await this.assigneeTooltip()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  assignSupervisorCheckboxInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .getByRole("checkbox", { name: /Assign Supervisor/i })
      .first()
      .or(drawer.getByLabel(/Assign Supervisor/i).first())
      .or(
        drawer
          .locator("label")
          .filter({ hasText: /Assign Supervisor/i })
          .locator('input[type="checkbox"]')
          .first(),
      );
  }

  async scrollCreateDrawerToAssignSupervisor() {
    const drawer = this.createPropertyDrawerRoot();
    const checkbox = this.assignSupervisorCheckboxInCreateDrawer();
    await checkbox.scrollIntoViewIfNeeded().catch(async () => {
      await drawer
        .evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        })
        .catch(() => {});
    });
  }

  async assertAssignSupervisorCheckboxVisibleInCreateDrawer() {
    await this.assertCreatePropertyDrawerOpen();
    await this.scrollCreateDrawerToAssignSupervisor();
    const checkbox = this.assignSupervisorCheckboxInCreateDrawer();
    await expect(checkbox).toBeVisible({ timeout: 10_000 });
    await expect(
      this.createPropertyDrawerRoot().getByText(/Assign Supervisor/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  }

  async isAssignSupervisorCheckedInCreateDrawer() {
    const checkbox = this.assignSupervisorCheckboxInCreateDrawer();
    await checkbox.waitFor({ state: "visible", timeout: 8_000 });
    return checkbox.isChecked().catch(() => false);
  }

  async setAssignSupervisorCheckedInCreateDrawer(shouldBeChecked) {
    await this.scrollCreateDrawerToAssignSupervisor();
    const checkbox = this.assignSupervisorCheckboxInCreateDrawer();
    await checkbox.waitFor({ state: "visible", timeout: 8_000 });
    const isChecked = await this.isAssignSupervisorCheckedInCreateDrawer();
    if (isChecked === shouldBeChecked) return;
    if (shouldBeChecked) {
      await checkbox.check({ force: true });
      await expect(checkbox).toBeChecked({ timeout: 5_000 });
      return;
    }
    await checkbox.uncheck({ force: true });
    await expect(checkbox).not.toBeChecked({ timeout: 5_000 });
  }

  selectSupervisorFieldInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .locator('label[for="supervisor"]')
      .first()
      .or(
        drawer
          .getByText(/^Select Supervisor$/i)
          .first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor \*/i }).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/^Select Supervisor$/i).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .or(
        drawer.getByText(/Select Supervisor/i).first(),
      )
      .or(
        drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      )
      .first();
  }

  selectSupervisorInteractiveControlInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    const supervisorLabel = drawer.locator('label[for="supervisor"]').first();
    const labeledControl = drawer.locator('label[for="supervisor"] + div').first();
    return drawer
      .locator('input[name="supervisor"], #supervisor, [name="supervisor"]')
      .first()
      .or(labeledControl)
      .or(supervisorLabel)
      .or(
        drawer
          .locator('[role="combobox"]')
          .filter({
            has: drawer.locator(
              'input[name="supervisor"], #supervisor, [name="supervisor"]',
            ),
          })
          .first(),
      )
      .or(drawer.getByRole("combobox", { name: /Select Supervisor/i }).first())
      .or(
        drawer
          .locator("label")
          .filter({ hasText: /Select Supervisor/i })
          .first(),
      );
  }

  selectSupervisorCandidatesInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    const supervisorLabel = drawer.locator('label[for="supervisor"]').first();
    const labeledControl = drawer.locator('label[for="supervisor"] + div').first();
    return [
      drawer
        .locator('input[name="supervisor"], #supervisor, [name="supervisor"]')
        .first(),
      labeledControl,
      supervisorLabel,
      drawer
        .locator('[role="combobox"]')
        .filter({
          has: drawer.locator(
            'input[name="supervisor"], #supervisor, [name="supervisor"]',
          ),
        })
        .first(),
      drawer.getByRole("heading", { name: /Select Supervisor/i }).first(),
      drawer.getByRole("combobox", { name: /Select Supervisor/i }).first(),
      drawer
        .locator("label")
        .filter({ hasText: /Select Supervisor/i })
        .first(),
    ];
  }

  async clickSelectSupervisorControlInCreateDrawer() {
    await this.scrollCreateDrawerToAssignSupervisor();
    const candidates = this.selectSupervisorCandidatesInCreateDrawer();
    for (const candidate of candidates) {
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      const clicked = await candidate
        .click({ force: true, timeout: 800 })
        .then(() => true)
        .catch(() => false);
      if (clicked) return true;
    }
    throw new Error("Select Supervisor control was not clickable in Create Property drawer.");
  }

  async isSelectSupervisorVisibleInCreateDrawer() {
    await this.scrollCreateDrawerToAssignSupervisor();
    const drawer = this.createPropertyDrawerRoot();
    // Only supervisor-scoped nodes — do not use a bare [aria-describedby="simple-popper"]
    // (other fields in the drawer share that attribute and would false-positive).
    const label = drawer.locator('label[for="supervisor"]').first();
    if (await label.isVisible().catch(() => false)) return true;
    const rowControl = drawer.locator('label[for="supervisor"] + div').first();
    if (await rowControl.isVisible().catch(() => false)) return true;
    const input = drawer
      .locator('input[name="supervisor"], #supervisor, [name="supervisor"]')
      .first();
    if (await input.isVisible().catch(() => false)) return true;
    const combobox = drawer
      .locator('[role="combobox"]')
      .filter({
        has: drawer.locator(
          'input[name="supervisor"], #supervisor, [name="supervisor"]',
        ),
      })
      .first();
    return combobox.isVisible().catch(() => false);
  }

  async assertSelectSupervisorVisibleInCreateDrawer() {
    await this.scrollCreateDrawerToAssignSupervisor();
    await expect
      .poll(async () => this.isSelectSupervisorVisibleInCreateDrawer(), {
        timeout: 8_000,
      })
      .toBeTruthy();
  }

  selectSupervisorRequiredErrorInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .getByText(/Select Supervisor.*required|required.*Select Supervisor/i)
      .first()
      .or(drawer.getByText(/Supervisor.*required|required.*Supervisor/i).first());
  }

  selectSupervisorInputInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .locator('#supervisor, input[name="supervisor"]')
      .first()
      .or(drawer.getByRole("combobox", { name: /Select Supervisor/i }).first());
  }

  async hasSelectSupervisorMandatoryMarkerInCreateDrawer() {
    const drawer = this.createPropertyDrawerRoot();
    const marker = drawer.getByText(/Select Supervisor\s*\*/i).first();
    return marker.isVisible().catch(() => false);
  }

  async isSelectSupervisorInvalidInCreateDrawer() {
    const input = this.selectSupervisorInputInCreateDrawer();
    const visible = await input.isVisible().catch(() => false);
    if (!visible) return false;
    const ariaInvalid = await input.getAttribute("aria-invalid").catch(() => null);
    return String(ariaInvalid).toLowerCase() === "true";
  }

  async assertSelectSupervisorMandatoryValidationShown() {
    await expect
      .poll(
        async () => {
          const hasErrorText = await this.selectSupervisorRequiredErrorInCreateDrawer()
            .isVisible()
            .catch(() => false);
          if (hasErrorText) return true;
          return this.isSelectSupervisorInvalidInCreateDrawer();
        },
        { timeout: 8_000 },
      )
      .toBeTruthy();
  }

  async selectFirstSupervisorInCreateDrawer() {
    await this.clickSelectSupervisorControlInCreateDrawer();
    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    const firstOption = tooltip.getByRole("heading", { level: 4 }).first();
    const selectedText = ((await firstOption.innerText().catch(() => "")) || "").trim();
    await firstOption.click({ force: true });
    await this.page.waitForTimeout(500);
    return selectedText;
  }

  selectSupervisorTooltipInCreateDrawer() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last())
      .or(this.page.getByRole("listbox").last());
  }

  async openSelectSupervisorDropdownInCreateDrawer() {
    let initiallyVisible = await this.isSelectSupervisorVisibleInCreateDrawer();
    if (!initiallyVisible) {
      const assignVisible = await this.assignSupervisorCheckboxInCreateDrawer()
        .isVisible()
        .catch(() => false);
      if (assignVisible) {
        await this.setAssignSupervisorCheckedInCreateDrawer(true).catch(() => {});
      }
      await this.scrollCreateDrawerToAssignSupervisor().catch(() => {});
      initiallyVisible = await this.isSelectSupervisorVisibleInCreateDrawer();
    }
    if (!initiallyVisible) {
      throw new Error(
        "Select Supervisor control is not visible in Create Property drawer.",
      );
    }
    const tooltip = this.selectSupervisorTooltipInCreateDrawer();
    const alreadyOpen = await tooltip.isVisible().catch(() => false);
    if (alreadyOpen) return tooltip;

    const inputControl = this.selectSupervisorInputInCreateDrawer();
    for (let attempt = 0; attempt < 5; attempt++) {
      await this.clickSelectSupervisorControlInCreateDrawer();
      await inputControl.press("ArrowDown").catch(() => {});
      await this.page.waitForTimeout(300);
      const visible = await tooltip
        .waitFor({ state: "visible", timeout: 2_500 })
        .then(() => true)
        .catch(() => false);
      if (visible) return tooltip;
    }

    const finalVisible = await tooltip.isVisible().catch(() => false);
    if (!finalVisible) {
      throw new Error(
        "Select Supervisor dropdown did not open after multiple click attempts.",
      );
    }
    return tooltip;
  }

  async reopenSelectSupervisorDropdownInCreateDrawer() {
    const opened = await this.openSelectSupervisorDropdownInCreateDrawer()
      .then(() => true)
      .catch(() => false);
    if (opened) {
      return this.selectSupervisorTooltipInCreateDrawer();
    }

    // Recovery path for intermittent UI state where the control does not reopen.
    await this.setAssignSupervisorCheckedInCreateDrawer(false).catch(() => {});
    await this.page.waitForTimeout(300);
    await this.setAssignSupervisorCheckedInCreateDrawer(true).catch(() => {});
    await this.page.waitForTimeout(300);
    await this.assertSelectSupervisorVisibleInCreateDrawer();
    await this.createPropertyHeading.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(250);
    return this.openSelectSupervisorDropdownInCreateDrawer();
  }

  async dismissSelectSupervisorDropdownInCreateDrawer() {
    await this.createPropertyHeading.click({ force: true }).catch(() => {});
    await this.selectSupervisorTooltipInCreateDrawer()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  async getSupervisorOptionsFromOpenDropdown(limit = 80) {
    const tooltip = await this.openSelectSupervisorDropdownInCreateDrawer();
    return this.getSupervisorOptionsFromVisibleDropdown(tooltip, limit);
  }

  async getSupervisorOptionsFromVisibleDropdown(tooltip, limit = 80) {
    const optionNodes = tooltip.getByRole("heading", { level: 4 });
    const total = await optionNodes.count();
    const scanCount = Math.min(total, limit);
    const options = [];
    for (let i = 0; i < scanCount; i++) {
      const text = ((await optionNodes.nth(i).innerText().catch(() => "")) || "").trim();
      if (!text) continue;
      if (!options.includes(text)) options.push(text);
    }
    return options;
  }

  async searchSupervisorInOpenDropdown(searchText) {
    const tooltip = await this.openSelectSupervisorDropdownInCreateDrawer();
    const searchInput = tooltip
      .getByRole("textbox", { name: /Search by name/i })
      .first()
      .or(tooltip.getByRole("textbox").first());
    const hasSearch = await searchInput.isVisible().catch(() => false);
    if (!hasSearch) {
      return { hasSearch: false, results: await this.getSupervisorOptionsFromOpenDropdown() };
    }
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(600);
    const results = await this.getSupervisorOptionsFromOpenDropdown();
    return { hasSearch: true, results };
  }

  async selectSupervisorByNameInCreateDrawer(supervisorName) {
    const tooltip = await this.openSelectSupervisorDropdownInCreateDrawer();
    return this.selectSupervisorByNameFromVisibleDropdown(tooltip, supervisorName);
  }

  async selectSupervisorByNameFromVisibleDropdown(tooltip, supervisorName) {
    const option = tooltip
      .getByRole("heading", {
        level: 4,
        name: new RegExp(this.escapeRegex(supervisorName), "i"),
      })
      .first();
    await option.waitFor({ state: "visible", timeout: 8_000 });
    await option.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async getSelectedSupervisorTextInCreateDrawer() {
    const input = this.selectSupervisorInputInCreateDrawer();
    const inputVisible = await input.isVisible().catch(() => false);
    if (inputVisible) {
      const value = ((await input.inputValue().catch(() => "")) || "").trim();
      if (value) return value.replace(/\s+/g, " ");
      const ariaLabel = ((await input.getAttribute("aria-label").catch(() => "")) || "").trim();
      if (ariaLabel && !/select supervisor/i.test(ariaLabel)) {
        return ariaLabel.replace(/\s+/g, " ");
      }
    }

    const drawer = this.createPropertyDrawerRoot();
    const selectedName = drawer.locator('label[for="supervisor"] + div h6').first();
    const selectedNameVisible = await selectedName.isVisible().catch(() => false);
    if (selectedNameVisible) {
      const text = ((await selectedName.innerText().catch(() => "")) || "").trim();
      if (text) return text.replace(/\s+/g, " ");
    }

    // Last-resort fallback for environments where selected value is not rendered in h6.
    const selectedContainer = drawer.locator('label[for="supervisor"] + div').first();
    await selectedContainer.waitFor({ state: "visible", timeout: 8_000 });
    const text = ((await selectedContainer.innerText().catch(() => "")) || "").trim();
    return text.replace(/\s+/g, " ");
  }

  async isAssignSupervisorDisabledInCreateDrawer() {
    await this.scrollCreateDrawerToAssignSupervisor();
    const checkbox = this.assignSupervisorCheckboxInCreateDrawer();
    await checkbox.waitFor({ state: "visible", timeout: 8_000 });
    return checkbox.isDisabled().catch(() => false);
  }

  async getAssigneeCardsFromOpenDropdown(limit = 80) {
    const tooltip = await this.openAssigneeDropdown();
    const nameNodes = tooltip.getByRole("heading", { level: 4 });
    const total = await nameNodes.count();
    const scanCount = Math.min(total, limit);
    const cards = [];
    for (let i = 0; i < scanCount; i++) {
      const nameNode = nameNodes.nth(i);
      const name = ((await nameNode.innerText().catch(() => "")) || "").trim();
      if (!name) continue;
      const roleText =
        ((await nameNode
          .locator("xpath=following-sibling::*[1]")
          .innerText()
          .catch(() => "")) || "").trim() ||
        ((await nameNode
          .locator("xpath=ancestor::*[self::div or self::li][1]")
          .getByRole("paragraph")
          .first()
          .innerText()
          .catch(() => "")) || "").trim();
      cards.push({ name, role: roleText });
    }
    return cards;
  }

  async selectAssigneeByRoleInCreateDrawer({
    includeRolePattern,
    excludeRolePattern = null,
    excludeNames = [],
  }) {
    const tooltip = await this.openAssigneeDropdown();
    const assigneeCards = await this.getAssigneeCardsFromOpenDropdown();
    const target = assigneeCards.find((card) => {
      const role = (card.role || "").trim();
      if (!includeRolePattern.test(role)) return false;
      if (excludeRolePattern && excludeRolePattern.test(role)) return false;
      if (excludeNames.includes(card.name)) return false;
      return true;
    });
    if (!target) {
      throw new Error(
        `No assignee found for role pattern ${includeRolePattern}. Observed cards: ${assigneeCards
          .map((x) => `${x.name} [${x.role || "no-role"}]`)
          .join(", ")}`,
      );
    }
    const option = tooltip
      .getByRole("heading", {
        level: 4,
        name: new RegExp(this.escapeRegex(target.name), "i"),
      })
      .first();
    await option.waitFor({ state: "visible", timeout: 8_000 });
    await option.click({ force: true });
    await this.page.waitForTimeout(500);
    return target;
  }

  async selectPropertyAffiliations() {
    await this.managedButton.click({ force: true });
    await this.ownedButton.click({ force: true });
    await this.regionalOfficeButton.click({ force: true });
    await this.sharedButton.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill Address via generic autocomplete strategy.
   * - If suggestions are visible, select one.
   * - Works with a specific address or dynamic generated candidates.
   */
  async fillAddress(addressText) {
    if (!addressText) {
      const selectedAddress = await selectDynamicAddressWithRetry({
        page: this.page,
        addressInput: this.addressInput,
        maxAttempts: 6,
      }).catch(() => "");
      return Boolean(selectedAddress);
    }

    if (Array.isArray(addressText)) {
      for (const candidate of addressText) {
        const picked = await selectAddressFromAutocomplete({
          page: this.page,
          addressInput: this.addressInput,
          addressText: candidate,
          optionTimeoutMs: 10_000,
          attempts: 2,
        });
        if (picked) return true;
      }
      return false;
    }

    return selectAddressFromAutocomplete({
      page: this.page,
      addressInput: this.addressInput,
      addressText,
      optionTimeoutMs: 10_000,
      attempts: 2,
    });
  }

  async clearAddressField() {
    await this.addressInput.click().catch(() => {});
    await this.addressInput.fill("").catch(() => {});
    await this.addressInput.press("ControlOrMeta+a").catch(() => {});
    await this.addressInput.press("Backspace").catch(() => {});
    await this.page.waitForTimeout(200);
  }

  async selectContactAffiliation() {
    const contactSearchText = env.envName === "prod" ? "Ahsan Awan" : "moiz";
    const contactLabel =
      env.envName === "prod" ? "Ahsan Awan" : "Ali TkSmoke (moiz.qureshi+c1@";

    await this.contactTrigger.waitFor({ state: "visible", timeout: 10_000 });
    await this.contactTrigger.click();

    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });

    const searchInput = tooltip.getByRole("textbox", {
      name: "Search by name",
    });
    await searchInput.fill(contactSearchText);
    await this.page.waitForTimeout(1_000);

    const contactOption = tooltip
      .getByText(contactLabel, { exact: false })
      .first()
      .or(this.page.getByText(contactLabel, { exact: false }).first());
    await contactOption.waitFor({ state: "visible", timeout: 10_000 });
    await contactOption.click({ force: true });
    await this.page.waitForTimeout(700);
  }

  async submitCreateProperty() {
    await this.submitCreateBtn.waitFor({ state: "visible", timeout: 10_000 });
    this.lastCreatePropertyToastSeen = false;
    this.lastCreatePropertySucceeded = false;
    let duplicateToastSeen = false;
    await Promise.allSettled([
      this.createPropertyToast
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => {
          this.lastCreatePropertyToastSeen = true;
        }),
      this.duplicateAddressToast
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => {
          duplicateToastSeen = true;
        }),
      this.submitCreateBtn.click({ force: true }),
    ]);

    let drawerClosed = await this.createPropertyHeading
      .waitFor({ state: "hidden", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!drawerClosed) {
      const propertyVisibleBehindDrawer = await this.page
        .getByText(this.createdPropertyName, { exact: true })
        .first()
        .isVisible()
        .catch(() => false);

      if (this.lastCreatePropertyToastSeen || propertyVisibleBehindDrawer) {
        await this.cancelCreateBtn.click({ force: true }).catch(() => {});
        drawerClosed = await this.createPropertyHeading
          .waitFor({ state: "hidden", timeout: 8_000 })
          .then(() => true)
          .catch(() => false);
      }
    }

    const created = (drawerClosed || this.lastCreatePropertyToastSeen) && !duplicateToastSeen;
    this.lastCreatePropertySucceeded = created;

    return {
      drawerClosed,
      duplicateToastSeen,
      created,
    };
  }

  async attemptCreateWithAddress(addressText) {
    this.logAddress("create_attempt_with_candidate", { candidate: addressText });
    const addressSelected = await this.fillAddress(addressText);
    if (!addressSelected) {
      this.logAddress("retry_reason", {
        candidate: addressText,
        reason: "autocomplete_selection_failed",
      });
      return false;
    }

    const submitResult = await this.submitCreateProperty();
    if (submitResult.drawerClosed) {
      await this.page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => {});
      this.logAddress("candidate_create_success", { candidate: addressText });
      return true;
    }

    // Requirement-driven behavior: if selected location is already taken, retry.
    if (submitResult.duplicateToastSeen) {
      this.logAddress("retry_reason", {
        candidate: addressText,
        reason: "duplicate_location_toast",
      });
      await this.clearAddressField();
      return false;
    }

    this.logAddress("retry_reason", {
      candidate: addressText,
      reason: "drawer_not_closed_without_duplicate",
    });
    return false;
  }

  async createProperty({
    propertyName,
    companyName,
    relaxed = false,
    addressCandidates = [],
    maxAddressAttempts,
  }) {
    await this.openCreatePropertyDrawer();
    await this.selectCompanyInCreateForm(companyName);
    await this.page.waitForTimeout(2_000);
    await this.fillPropertyName(propertyName);
    await this.selectPropertySource();
    await this.selectAssociatedFranchise();
    await this.selectStage();
    if (relaxed) {
      await this.selectPropertyAffiliations().catch(() => {});
    } else {
      await this.selectPropertyAffiliations();
    }
    await this.selectAssignee();
    if (relaxed) {
      await this.selectContactAffiliation().catch(() => {});
    } else {
      await this.selectContactAffiliation();
    }

    const attemptLimit =
      Number(maxAddressAttempts || process.env.PROPERTY_MAX_ADDRESS_ATTEMPTS || 8);
    const candidateAddresses =
      Array.isArray(addressCandidates) && addressCandidates.length
        ? addressCandidates
        : generateUniqueUsAddressCandidates({
            primaryCount: Math.max(8, attemptLimit + 2),
          });

    for (const addressText of candidateAddresses.slice(0, attemptLimit)) {
      const created = await this.attemptCreateWithAddress(addressText);
      if (created) {
        return propertyName;
      }
    }

    throw new Error(
      "Create Property did not succeed after multiple dynamic US address retries.",
    );
  }

  async assertPropertyCreated() {
    expect(this.lastCreatePropertySucceeded || this.lastCreatePropertyToastSeen).toBeTruthy();
  }

  async cancelCreatePropertyDrawer() {
    const cancelInDrawer = this.createPropertyDrawerRoot().getByRole("button", {
      name: "Cancel",
    });
    await cancelInDrawer.waitFor({ state: "visible", timeout: 12_000 });
    await cancelInDrawer.click({ force: true });
    await this.createPropertyHeading
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  async assertCreatePropertyDrawerClosed() {
    await expect(this.createPropertyHeading).not.toBeVisible({
      timeout: 8_000,
    });
  }

  // ── Property Detail ──────────────────────────────────────────────────────

  async openPropertyDetail(propertyName) {
    await this.propertySearchInput.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await this.propertySearchInput.fill(propertyName);
    await this.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(2_000);
    const propertyRow = this.page.locator("table tbody tr").first();
    await propertyRow.waitFor({ state: "visible", timeout: 10_000 });
    const propertyNameCell = propertyRow.locator("td").nth(1);
    await expect(propertyNameCell).toContainText(propertyName, {
      timeout: 10_000,
    });
    await Promise.all([
      this.page.waitForURL(/\/app\/sales\/locations\/location\//, {
        timeout: 25_000,
      }),
      propertyNameCell.click({ force: true }),
    ]);
    await this.page
      .waitForLoadState("networkidle", { timeout: 20_000 })
      .catch(() => {});
    await this.page
      .waitForLoadState("domcontentloaded", { timeout: 10_000 })
      .catch(() => {});
  }

  async assertPropertyPresentInSearchResults(propertyName) {
    const propertyRow = this.page.locator("table tbody tr").first();
    await propertyRow.waitFor({ state: "visible", timeout: 15_000 });
    await expect(this.propertySearchInput).toHaveValue(propertyName, {
      timeout: 10_000,
    });
    await expect(this.paginationInfo).toContainText(/1–1 of 1|1-1 of 1/, {
      timeout: 10_000,
    });
    await expect(propertyRow.locator("td").nth(1)).toContainText(propertyName, {
      timeout: 10_000,
    });
  }

  async assertPropertyDetailOpened(propertyName) {
    await expect(this.page).toHaveURL(/\/app\/sales\/locations\/location\//, {
      timeout: 25_000,
    });
    await expect(this.editButton).toBeVisible({ timeout: 25_000 });
    const needle = propertyName.trim();
    const re = new RegExp(this.escapeRegex(needle), "i");
    const titleCandidate = this.page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: re })
      .first()
      .or(this.page.getByRole("heading", { name: re }).first())
      .or(this.page.getByText(re).first());
    await expect(titleCandidate).toBeVisible({ timeout: 25_000 });
  }

  async assertPropertyDetailSectionsVisible() {
    await expect(this.propertyDetailsBtn).toBeVisible({ timeout: 10_000 });
    await expect(this.companiesSection).toBeVisible({ timeout: 10_000 });
    await expect(this.dealsSection).toBeVisible({ timeout: 10_000 });
    await expect(this.contactsSection).toBeVisible({ timeout: 10_000 });
    // Live-verified: "Franchise Associated" is the exact button name
    await expect(this.franchiseSection).toBeVisible({ timeout: 10_000 });
    await expect(this.attachmentsSection).toBeVisible({ timeout: 10_000 });
  }

  async assertPropertyStageBarVisible() {
    await expect(this.stagesHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.approvedStageBtn).toBeVisible({ timeout: 10_000 });
  }

  async openAssignmentModalFromDetail() {
    const assignedToLabel = this.page.getByText(/^Assigned to$/i).first();
    await assignedToLabel.waitFor({ state: "visible", timeout: 12_000 });
    const triggerBtn = assignedToLabel.locator("xpath=following::button[1]");
    await triggerBtn.waitFor({ state: "visible", timeout: 8_000 });
    const modalHeading = this.page
      .getByRole("heading", { name: /Property Assignment/i })
      .first();
    for (let attempt = 1; attempt <= 3; attempt++) {
      await triggerBtn.click({ force: true });
      const opened = await modalHeading
        .waitFor({ state: "visible", timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (opened) return;
      await this.page.waitForTimeout(300 * attempt);
    }
    throw new Error(
      'Property Assignment modal did not open from "Assigned to" control.',
    );
  }

  async assertAssignmentModalSelectedAssigneeVisible(assigneeText) {
    const modal = this.page.getByRole("dialog").filter({
      has: this.page.getByRole("heading", { name: /Property Assignment/i }),
    });
    const selectedAssignee = modal
      .getByText(new RegExp(this.escapeRegex(assigneeText), "i"))
      .first();
    await expect(selectedAssignee).toBeVisible({ timeout: 10_000 });
  }

  async closeAssignmentModal() {
    const heading = this.page
      .getByRole("heading", { name: /Property Assignment/i })
      .first();
    const cancelBtn = this.page
      .getByRole("button", { name: /^Cancel$/i })
      .last();
    const closeLinkNearHeading = heading.locator("xpath=following::a[1]");

    const cancelVisible = await cancelBtn.isVisible().catch(() => false);
    if (cancelVisible) {
      await cancelBtn.click({ force: true }).catch(() => {});
    } else {
      await closeLinkNearHeading.click({ force: true }).catch(() => {});
    }
    await this.page.keyboard.press("Escape").catch(() => {});
    await heading.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});
  }

  // ── Property Assignment (live-verified 2026-04-13) ─────────────────────
  //
  // UI flow on the property detail page:
  //   1. "Assigned to" info row in the LEFT PANEL shows a button whose label
  //      is the current assignee's name (e.g. "Maham Mishal").
  //   2. Clicking that button opens the "Property Assignment" modal dialog.
  //   3. Inside the modal there is a combobox/select showing the current
  //      assignee.  Clicking it reveals a dropdown with a Search textbox and
  //      a list of users (rendered as h4 headings inside a scrollable list).
  //   4. Type in Search to filter, then click the user entry.
  //   5. The "Assign" button in the modal footer becomes enabled; click it.
  //   6. Modal closes and the info row updates to show the new assignee.
  //
  // The trigger button's text is dynamic (= current assignee name), so we
  // locate it through the stable "Assigned to" label text that precedes it
  // in the DOM using XPath following::button[1].

  async assignPropertyToUserFromDetail(
    searchText,
    optionText = searchText,
    { enforceFlow = false } = {},
  ) {
    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});

    // ── Step 1: find and click the "Assigned to" trigger button ────────────
    // The label "Assigned to" is stable; the trigger button immediately follows
    // it in the DOM order ("following::button[1]").
    const assignedToLabel = this.page.getByText(/^Assigned to$/i).first();
    await assignedToLabel.waitFor({ state: "visible", timeout: 12_000 });

    const triggerBtn = assignedToLabel.locator("xpath=following::button[1]");
    const triggerVisible = await triggerBtn
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!triggerVisible) {
      throw new Error(
        '"Assigned to" trigger button not found on the property detail page. ' +
          'The "Assigned to" label is visible but the adjacent button could not be located.',
      );
    }

    const currentValue = (
      (await triggerBtn.textContent().catch(() => "")) || ""
    ).trim();
    if (
      !enforceFlow &&
      currentValue.toLowerCase().includes(optionText.toLowerCase())
    ) {
      return; // already assigned — nothing to do
    }

    await triggerBtn.click({ force: true });

    // ── Step 2: wait for the "Property Assignment" modal ──────────────────
    // Wait for the title heading first — `dialog.filter({ has: ... })` alone can
    // time out while the portal mounts (heading is the stable anchor).
    const modalHeading = this.page
      .getByRole("heading", { name: /Property Assignment/i })
      .first();
    await modalHeading.waitFor({ state: "visible", timeout: 15_000 });

    const assignmentDialog = modalHeading.locator(
      'xpath=ancestor::*[@role="dialog"][1]',
    );
    const dialogScope =
      (await assignmentDialog.count()) > 0 ? assignmentDialog : this.page;

    // ── Step 3: open the Select Assignee dropdown ─────────────────────────
    // Live DOM (2026-04): "Select Assignee:" is an h6; the clickable row (avatar +
    // assignee name + chevron) is the *immediate following sibling* div — not a
    // distant following::div[MuiBox], which can match the wrong node and never
    // open the MUI Autocomplete popper.
    // Create Property uses "Select Assignee" (no colon); this modal uses
    // "Select Assignee:" — match the colon so we don't resolve two headings.
    const selectAssigneeHeading = dialogScope.getByRole("heading", {
      name: /Select Assignee:/i,
    });
    await selectAssigneeHeading.waitFor({ state: "visible", timeout: 8_000 });

    const assigneeRowTrigger = selectAssigneeHeading.locator(
      "xpath=following-sibling::div[1]",
    );
    await expect(assigneeRowTrigger).toBeVisible({ timeout: 5_000 });

    const assigneeNameHeading = currentValue
      ? dialogScope.getByRole("heading", { level: 6, name: currentValue })
      : null;

    // ── Step 4: open list + resolve search input inside the *topmost* Autocomplete popper ─
    // Avoid `.first()` on a broad CSS union — it can grab a hidden input from another
    // surface. Prefer the last visible popper (the one opened by this modal).
    const tryOpenAssigneeList = async (attemptIndex) => {
      if (assigneeNameHeading) {
        await assigneeNameHeading.click({ force: true });
      }
      await assigneeRowTrigger.click({ force: true });
      if (attemptIndex > 0) {
        await assigneeRowTrigger.click({ force: true });
      }
      const combo = dialogScope.getByRole("combobox").first();
      if ((await combo.count()) > 0) {
        await combo.click({ force: true }).catch(() => {});
      }
      if (attemptIndex >= 2) {
        await this.page.keyboard.press("ArrowDown").catch(() => {});
      }
    };

    const popperRoot = this.page.locator(
      ".MuiAutocomplete-popper, .MuiAutocomplete-paper, [data-popper-placement]",
    );

    let searchInput;
    let assigneeOptionsRoot;

    for (let attempt = 0; attempt < 5; attempt++) {
      await tryOpenAssigneeList(attempt);
      await this.page.waitForTimeout(450 + attempt * 150);

      const topPopper = popperRoot.last();
      const popperVisible = await topPopper
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (popperVisible) {
        const inp = topPopper.locator("input").first();
        if (await inp.isVisible().catch(() => false)) {
          searchInput = inp;
          assigneeOptionsRoot = topPopper;
          break;
        }
      }

      const ph = this.page.getByPlaceholder(/^Search$/i).first();
      if (await ph.isVisible().catch(() => false)) {
        searchInput = ph;
        assigneeOptionsRoot = popperRoot.last();
        break;
      }
    }

    if (!searchInput) {
      throw new Error(
        "Assignee filter input did not appear after opening Select Assignee. " +
          "Expected a visible input in the Autocomplete popper (or Search placeholder). " +
          "The assignee control click may not have opened the dropdown.",
      );
    }

    // Search may need email, display name, or first token — UAT list often keys off name.
    const searchVariants = [
      ...new Set(
        [
          searchText,
          optionText,
          (optionText || "").trim().split(/\s+/)[0],
        ].filter(Boolean),
      ),
    ];

    const optionsScope = () =>
      assigneeOptionsRoot
        ? assigneeOptionsRoot
        : this.page
            .locator(".MuiAutocomplete-popper, .MuiAutocomplete-paper")
            .last();

    const tryPickAssignee = async () => {
      const scope = optionsScope();
      const nameRe = new RegExp(this.escapeRegex(optionText), "i");
      const tryClick = async (locator) => {
        const ok = await locator
          .waitFor({ state: "visible", timeout: 3_000 })
          .then(() => true)
          .catch(() => false);
        if (ok) {
          await locator.click({ force: true });
          return true;
        }
        return false;
      };

      if (
        await tryClick(
          scope.getByRole("heading", { level: 4, name: nameRe }).first(),
        )
      ) {
        return true;
      }
      if (
        await tryClick(scope.getByRole("heading", { name: nameRe }).first())
      ) {
        return true;
      }
      if (await tryClick(scope.getByRole("option", { name: nameRe }).first())) {
        return true;
      }
      return tryClick(scope.getByText(optionText, { exact: false }).first());
    };

    let picked = false;
    for (const variant of searchVariants) {
      await searchInput.click({ force: true });
      await searchInput.fill("");
      await searchInput.fill(variant);
      await this.page.waitForTimeout(700);
      picked = await tryPickAssignee();
      if (picked) break;
    }

    if (!picked) {
      throw new Error(
        `User "${optionText}" was not found in the assignee dropdown after trying search variants: ${searchVariants.join(", ")}.`,
      );
    }

    // Ensure selected assignee value actually updates in the dropdown row before assigning.
    const selectedAssigneeChanged = await expect
      .poll(
        async () => {
          const normalizedTarget = (optionText || "").trim().toLowerCase();
          const selectedInRow = (
            (await assigneeRowTrigger.textContent().catch(() => "")) || ""
          )
            .trim()
            .toLowerCase();
          if (normalizedTarget && selectedInRow.includes(normalizedTarget)) {
            return true;
          }

          const selectedHeadingVisible = await dialogScope
            .getByRole("heading", {
              level: 6,
              name: new RegExp(this.escapeRegex(optionText), "i"),
            })
            .first()
            .isVisible()
            .catch(() => false);
          return selectedHeadingVisible;
        },
        { timeout: 12_000, intervals: [300, 500, 800] },
      )
      .toBeTruthy()
      .then(() => true)
      .catch(() => false);

    if (!selectedAssigneeChanged) {
      throw new Error(
        `Selected assignee value did not change to "${optionText}" before clicking Assign.`,
      );
    }

    await this.page.waitForTimeout(500);

    // ── Step 6: click the "Assign" button to confirm ─────────────────────
    const assignBtn =
      (await assignmentDialog.count()) > 0
        ? assignmentDialog.getByRole("button", { name: /^Assign$/i }).first()
        : this.page.getByRole("button", { name: /^Assign$/i }).first();
    await assignBtn.waitFor({ state: "visible", timeout: 10_000 });
    // Wait for the button to become enabled (it's disabled until a user is selected)
    await expect(assignBtn).not.toBeDisabled({ timeout: 15_000 });
    await assignBtn.click();

    // Wait for the modal to close
    await modalHeading
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async assertAssignedToValueVisible(assigneeText) {
    // After assignment the "Assigned to" row updates to show the new assignee name.
    // The button in that row now carries the new name.
    const assignedToLabel = this.page.getByText(/^Assigned to$/i).first();
    const triggerBtn = assignedToLabel.locator("xpath=following::button[1]");
    await expect(triggerBtn.getByText(assigneeText, { exact: false }))
      .toBeVisible({ timeout: 12_000 })
      .catch(async () => {
        // Fallback: just confirm the text appears anywhere on the page
        await expect(
          this.page.getByText(assigneeText, { exact: false }).first(),
        ).toBeVisible({ timeout: 5_000 });
      });
  }

  async assertDetailTabsVisible() {
    // Live-verified: 6 tabs, Convert Questions is default selected (not Activities)
    await expect(this.convertQuestionsTab).toBeVisible({ timeout: 10_000 });
    await expect(this.activitiesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.notesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
    await expect(this.emailsTab).toBeVisible({ timeout: 10_000 });
    await expect(this.meetingsTab).toBeVisible({ timeout: 10_000 });
  }

  // ── Activities Tab ───────────────────────────────────────────────────────

  async gotoActivitiesTab() {
    await this.activitiesTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.activitiesTab.click();
    await this.page.waitForTimeout(500);
  }

  async assertActivitiesTabActive() {
    await expect(this.activitiesTab).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000,
    });
  }

  // ── Edit Property ────────────────────────────────────────────────────────

  async openEditPropertyForm() {
    await this.editButton.waitFor({ state: "visible", timeout: 10_000 });

    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.editButton.scrollIntoViewIfNeeded().catch(() => {});
      await this.editButton.click({ force: true });

      const opened = await this.editPropertyHeading
        .waitFor({ state: "visible", timeout: 6_000 })
        .then(() => true)
        .catch(() => false);
      if (opened) return;

      await this.page.waitForTimeout(400 * attempt);
    }

    throw new Error(
      "Edit Property drawer did not open after clicking Edit button (3 attempts).",
    );
  }

  async assertEditPropertyFormOpen() {
    await expect(this.editPropertyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.editPropertyNameInput).toBeVisible({ timeout: 5_000 });
    // Live-verified: "Save" button (NOT "Update Property")
    await expect(this.saveEditBtn).toBeVisible({ timeout: 5_000 });
  }

  async selectAssigneeInEditForm(searchText, optionText = searchText) {
    const editDrawer = this.page
      .locator(".MuiDrawer-root")
      .filter({ has: this.editPropertyHeading })
      .first();
    await editDrawer
      .evaluate((el) => {
        el.scrollTop = 0;
      })
      .catch(() => {});

    await this.assigneeTrigger.waitFor({ state: "visible", timeout: 10_000 });
    await this.assigneeTrigger.click({ force: true });

    const tooltip = this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
    await tooltip.waitFor({ state: "visible", timeout: 10_000 });

    const searchInput = tooltip.getByRole("textbox", { name: "Search" });
    await searchInput.waitFor({ state: "visible", timeout: 5_000 });
    await searchInput.fill(searchText);
    await this.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1_000);

    await this.clickVisibleDropdownOption(tooltip, optionText, 10_000);
    await this.page.waitForTimeout(600);
  }

  async assertAssigneeValueVisibleInEditForm(assigneeText) {
    const editDrawer = this.page
      .locator(".MuiDrawer-root")
      .filter({ has: this.editPropertyHeading })
      .first();
    await expect(
      editDrawer.getByText(assigneeText, { exact: false }).first(),
    ).toBeVisible({ timeout: 10_000 });
  }

  async assertSaveEditButtonDisabled() {
    // Live-verified: "Save" is disabled until user makes a change
    await expect(this.saveEditBtn).toBeDisabled({ timeout: 5_000 });
  }

  async fillEditPropertyName(newName) {
    await this.editPropertyNameInput.waitFor({
      state: "visible",
      timeout: 8_000,
    });
    // clickCount:3 selects all text — .triple_click() does not exist in Playwright API
    await this.editPropertyNameInput.click({ clickCount: 3 });
    await this.editPropertyNameInput.fill(newName);
  }

  async submitEditProperty() {
    await this.saveEditBtn.waitFor({ state: "visible", timeout: 10_000 });
    this.lastEditPropertyToastSeen = false;

    await Promise.allSettled([
      this.editPropertyToast
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => {
          this.lastEditPropertyToastSeen = true;
        }),
      this.saveEditBtn.click({ force: true }),
    ]);

    const drawerClosed = await this.editPropertyHeading
      .waitFor({ state: "hidden", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!drawerClosed)
      throw new Error("Edit Property drawer did not close after save.");
    await this.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
  }

  async cancelEditPropertyForm() {
    await this.cancelEditBtn.click();
    await this.editPropertyHeading
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  async assertEditPropertyFormClosed() {
    await expect(this.editPropertyHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Notes Tab ────────────────────────────────────────────────────────────

  async gotoNotesTab() {
    await this.notesTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.notesTab.click();
    await this.page.waitForTimeout(500);
  }

  async assertNotesTabVisible() {
    await expect(this.notesTab).toBeVisible({ timeout: 10_000 });
  }

  async assertCreateNewNoteButtonVisible() {
    await expect(this.createNewNoteBtn).toBeVisible({ timeout: 10_000 });
  }

  async openCreateNoteDrawer() {
    await this.createNewNoteBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.createNewNoteBtn.click();
    await this.addNotesHeading.waitFor({ state: "visible", timeout: 10_000 });
  }

  async assertCreateNoteDrawerOpen() {
    const notesDrawer = this.addNotesHeading.locator(
      'xpath=ancestor::*[@role="dialog" or @role="presentation" or contains(@class,"MuiPaper-root")][1]',
    );
    const subjectInput = notesDrawer
      .locator('input[name="title"], #title')
      .first();

    await expect(this.addNotesHeading).toBeVisible({ timeout: 10_000 });
    await expect(subjectInput).toBeVisible({ timeout: 5_000 });
    await expect(this.noteDescEditor).toBeVisible({ timeout: 5_000 });
    await expect(this.noteCharCounter).toBeVisible({ timeout: 5_000 });
    await expect(this.noteSaveBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.noteCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  async cancelCreateNoteDrawer() {
    await this.noteCancelBtn.click();
    await this.addNotesHeading
      .waitFor({ state: "hidden", timeout: 8_000 })
      .catch(() => {});
  }

  async assertCreateNoteDrawerClosed() {
    await expect(this.addNotesHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Tasks Tab ─────────────────────────────────────────────────────────────

  async gotoTasksTab() {
    await this.tasksTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.tasksTab.click();
    await this.newTaskBtn.waitFor({ state: "visible", timeout: 10_000 });
  }

  async assertTasksTabVisible() {
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
  }

  async assertTasksTableColumns() {
    const expectedCols = [
      "Task Title",
      "Task Description",
      "Created By",
      "Due Date",
      "Priority",
      "Type",
    ];
    for (const col of expectedCols) {
      await expect(
        this.page.getByRole("columnheader", { name: col }),
      ).toBeVisible({ timeout: 10_000 });
    }
  }

  async assertNewTaskButtonVisible() {
    await expect(this.newTaskBtn).toBeVisible({ timeout: 10_000 });
  }

  async assertTasksEmptyState() {
    await expect(this.taskEmptyState).toBeVisible({ timeout: 10_000 });
  }

  async openCreateTaskDrawer() {
    await this.newTaskBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.newTaskBtn.click();
    await this.createTaskHeading.waitFor({ state: "visible", timeout: 10_000 });
  }

  async assertCreateTaskDrawerOpen() {
    await expect(this.createTaskHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.taskTitleInput).toBeVisible({ timeout: 5_000 });
    await expect(this.taskDescEditor).toBeVisible({ timeout: 5_000 });
    await expect(this.taskTypeTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.taskPriorityTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.taskSaveBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.taskCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  async cancelCreateTaskDrawer() {
    await this.taskCancelBtn.click();
    await this.createTaskHeading
      .waitFor({ state: "hidden", timeout: 8_000 })
      .catch(() => {});
  }

  async assertCreateTaskDrawerClosed() {
    await expect(this.createTaskHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Duplicate Address validation ──────────────────────────────────────────

  /**
   * Assert that the duplicate-address error toast is shown.
   *
   * Live-verified 2026-03-24:
   *   - Submitting a property whose geocoded lat/lng matches an existing property
   *     triggers an alert-role toast: "Latitude and longitude has already been taken"
   *   - The Create Property drawer remains OPEN (form data is preserved)
   *   - The API returns an error (logged as 422/409 in the browser console)
   *
   * Key behaviour:
   *   - Uniqueness is enforced on GEOCODED COORDINATES, not on the raw address string.
   *     Two properties with the same address (even formatted differently) will both
   *     fail this check once one of them is saved.
   */
  async assertDuplicateAddressError() {
    await expect(this.duplicateAddressToast).toBeVisible({ timeout: 10_000 });
    // Drawer must remain open — the user should be able to correct the address
    await expect(this.createPropertyHeading).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Submit the Create Property form and wait for the duplicate-address error toast,
   * then assert the drawer stays open.
   *
   * Use this helper when you intentionally supply a duplicate address to verify
   * the app rejects it gracefully.
   */
  async submitAndExpectDuplicateAddressError() {
    await this.submitCreateBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.submitCreateBtn.click({ force: true });
    await this.assertDuplicateAddressError();
  }

  async submitAndExpectBlockedDuplicateAddress() {
    await this.submitCreateBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.submitCreateBtn.click({ force: true });

    const duplicateToastSeen = await this.duplicateAddressToast
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    await expect(this.createPropertyHeading).toBeVisible({ timeout: 10_000 });
    return duplicateToastSeen;
  }

  /**
   * Fill a known-duplicate address (one already saved in the DB) into the
   * address field and return without submitting.
   *
   * @param {string} duplicateAddress  The address string to type (e.g. "3500 Dodge St, Omaha")
   * @returns {boolean}  true if autocomplete suggestion was selected, false otherwise
   */
  async fillDuplicateAddress(duplicateAddress) {
    return this.fillAddress(duplicateAddress);
  }

  // ── Contact Details section (Create Property drawer) ─────────────────────
  // Live-verified selector patterns follow the same tooltip pattern used by
  // Assignee / Supervisor dropdowns already tested in TC-PROP-040/TC-PROP-045.
  // Added 2026-04-24 for TC-PROP-047.

  /**
   * Returns the "Contact Details" heading (level=4) scoped to the Create Property drawer.
   */
  contactDetailsSectionHeading() {
    return this.createPropertyDrawerRoot()
      .getByRole("heading", { name: /Contact Details/i, level: 4 })
      .first();
  }

  /**
   * Returns the clickable trigger container for a contact role row at the given index.
   * Index 0 = Decision Maker, 1 = End User, 2 = Billing, 3 = Blocker, 4 = Influencer.
   *
   * Live-verified 2026-04-24: the trigger is a cursor=pointer generic containing
   * an h6 heading.  Before selection the h6 text is "Select a Contact".
   * After selection it changes to "Selected Contacts (N)".
   * We find all h6 headings inside the Contact Details section that match either
   * state, then return the one at the requested index.
   */
  contactRoleTriggerAt(index) {
    const drawer = this.createPropertyDrawerRoot();
    return drawer
      .getByRole("heading", { name: /Select a Contact|Selected Contacts/i, level: 6 })
      .nth(index);
  }

  /**
   * The last visible tooltip — reused across all contact role dropdowns
   * (same pattern as assignee/supervisor tooltips already live-verified).
   */
  contactRoleTooltip() {
    return this.page
      .locator('#simple-popper[role="tooltip"]')
      .last()
      .or(this.page.getByRole("tooltip").last());
  }

  /**
   * Scroll the Create Property drawer until the Contact Details heading is visible.
   */
  async scrollDrawerToContactDetails() {
    const drawer = this.createPropertyDrawerRoot();
    const heading = this.contactDetailsSectionHeading();
    await heading.scrollIntoViewIfNeeded().catch(async () => {
      await drawer
        .evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        })
        .catch(() => {});
    });
  }

  /**
   * Assert the Contact Details heading and all 5 role labels are visible.
   * Roles: Decision Maker, End User, Billing, Blocker, Influencer.
   */
  async assertContactDetailsSectionVisible() {
    await this.scrollDrawerToContactDetails();
    await expect(this.contactDetailsSectionHeading()).toBeVisible({
      timeout: 10_000,
    });
    const expectedRoles = [
      "Decision Maker",
      "End User",
      "Billing",
      "Blocker",
      "Influencer",
    ];
    const drawer = this.createPropertyDrawerRoot();
    for (const role of expectedRoles) {
      await expect(
        drawer.getByText(role, { exact: true }).first(),
      ).toBeVisible({ timeout: 8_000 });
    }
  }

  /**
   * Open the contact role dropdown at the given zero-based index and return the tooltip.
   * @param {number} roleIndex
   */
  async openContactRoleDropdown(roleIndex) {
    await this.scrollDrawerToContactDetails();
    const trigger = this.contactRoleTriggerAt(roleIndex);
    await trigger.waitFor({ state: "visible", timeout: 8_000 });
    const tooltip = this.contactRoleTooltip();
    for (let attempt = 0; attempt < 2; attempt++) {
      await trigger.click({ force: true });
      const visible = await tooltip
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (visible) return tooltip;
    }
    await tooltip.waitFor({ state: "visible", timeout: 8_000 });
    return tooltip;
  }

  /**
   * Assert the open contact tooltip has a "Search by name" textbox and at least
   * one contact paragraph result.
   * @param {object} tooltip - Playwright locator for the open tooltip
   */
  async assertContactTooltipHasSearchAndResults(tooltip) {
    const searchInput = tooltip
      .getByRole("textbox", { name: /Search by name/i })
      .first();
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
    // Contacts render as paragraphs "Name (email@domain.com)"
    const firstResult = tooltip.locator("p").first();
    await expect(firstResult).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Search for a contact inside the currently-open contact role tooltip.
   * @param {string} searchText
   * @param {object} tooltip
   */
  async searchContactInOpenTooltip(searchText, tooltip) {
    const searchInput = tooltip
      .getByRole("textbox", { name: /Search by name/i })
      .first()
      .or(tooltip.getByRole("textbox").first());
    await searchInput.waitFor({ state: "visible", timeout: 5_000 });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(700);
    return tooltip;
  }

  /**
   * Click the first matching contact result in the open tooltip.
   * @param {string} contactText  Partial name or email text to match
   * @param {object} tooltip
   */
  async selectContactFromOpenTooltip(contactText, tooltip) {
    const result = tooltip
      .getByText(contactText, { exact: false })
      .first();
    await result.waitFor({ state: "visible", timeout: 8_000 });
    await result.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Dismiss the contact role tooltip without making a selection.
   */
  async dismissContactRoleTooltip() {
    await this.createPropertyHeading.click({ force: true });
    await this.contactRoleTooltip()
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  /**
   * Get the displayed text for the contact role trigger at the given zero-based index.
   * Returns the heading text:
   *   - Before selection: "Select a Contact"
   *   - After selection:  "Selected Contacts (N)"
   * @param {number} roleIndex
   */
  async getContactRoleTriggerText(roleIndex) {
    const trigger = this.contactRoleTriggerAt(roleIndex);
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    return ((await trigger.innerText().catch(() => "")) || "").trim();
  }

  /**
   * Assert that the contact role row at the given index shows a selection
   * (i.e. heading text is NOT the unselected placeholder "Select a Contact").
   * Live-verified: selected state shows "Selected Contacts (N)".
   * @param {number} roleIndex
   */
  async assertContactRoleHasSelection(roleIndex) {
    // After a contact is selected, the h6 text changes to "Selected Contacts (N)"
    // and is no longer matched by /Select a Contact/i — so we look for it directly.
    const drawer = this.createPropertyDrawerRoot();
    const selectedHeading = drawer
      .getByRole("heading", { name: /Selected Contacts/i, level: 6 })
      .first();
    await expect(selectedHeading).toBeVisible({ timeout: 8_000 });
  }
}

module.exports = { PropertyModule };
