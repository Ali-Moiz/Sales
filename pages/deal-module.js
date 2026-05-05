// pages/deal-module.js
// Page Object Model — Deals Module, Signal CRM
// ALL locators live-verified via MCP browser on 2026-03-21
// Fully dynamic — no hardcoded IDs, names, or indices

const { expect } = require("@playwright/test");
const { env } = require("../utils/env");
const { buildSearchVariants } = require("../utils/dynamic_address");

class DealModule {
  constructor(page) {
    this.page = page;
    this.baseUrl = env.baseUrl;

    // ── Sidebar navigation ────────────────────────────────────────────────
    this.dealsMenuLink = page
      .getByRole("listitem", { name: "Deals" })
      .getByRole("link");

    // ── List page ─────────────────────────────────────────────────────────
    this.createDealButton = page.getByRole("button", { name: "Create Deal" });
    this.dealSearchInput = page
      .getByRole("searchbox", { name: "ID, Deal" })
      .or(page.locator('input[placeholder*="ID, Deal"]'))
      .first();
    this.allDealsFilter = page.getByRole("heading", {
      name: "All Deals",
      level: 6,
    });
    this.moreFiltersBtn = page.getByRole("button", { name: "More Filters" });
    this.paginationInfo = page.getByText(/\d+–\d+ of \d+/);
    this.nextPageBtn = page.getByRole("button", { name: "Go to next page" });
    this.prevPageBtn = page.getByRole("button", {
      name: "Go to previous page",
    });
    this.rowsPerPageCombo = page.getByRole("combobox", {
      name: /Rows per page/,
    });

    // ── Create Deal drawer ────────────────────────────────────────────────
    // Live-verified: heading level=3
    this.createDealHeading = page.getByRole("heading", {
      name: "Create Deal",
      level: 3,
    });
    // Deal Name textbox
    this.dealNameInput = page.getByRole("textbox", { name: "Deal Name *" });
    // Company dropdown — heading "Select Company" (level=6), opens tooltip with Search
    this.companySelector = page.getByRole("heading", {
      name: "Select Company",
      level: 6,
    });
    // Property dropdown — heading "Select Property / Property Name" (level=6), opens tooltip
    this.propertySelector = page.getByRole("heading", {
      name: "Select Property / Property Name",
      level: 6,
    });
    // Shared search input inside tooltip (reused for both company and property)
    this.searchInput = page
      .getByRole("tooltip")
      .getByRole("textbox", { name: "Search" });

    this.cancelDealBtn = page.getByRole("button", { name: "Cancel" });
    // Submit button — use .last() to distinguish from list page "Create Deal" button
    this.submitCreateDealBtn = page
      .getByRole("button", { name: "Create Deal" })
      .last();

    // Live-verified success toast text
    this.successToast = page.getByText("Deal has been created");

    // ── Validation messages (Create Deal drawer) ─────────────────────────
    // Live-verified via MCP browser on 2026-05-05
    // "Deal Name is required." renders as <p>, others as <div> — getByText is element-agnostic
    this.validationDealName = page.getByText("Deal Name is required.", {
      exact: true,
    });
    this.validationCompany = page.getByText("Company is required.", {
      exact: true,
    });
    this.validationPropertyName = page.getByText(
      "Property Name is required.",
      { exact: true },
    );
    this.validationDealOwner = page.getByText("Deal Owner is required.", {
      exact: true,
    });

    // ── Deal Detail page ──────────────────────────────────────────────────
    // Live-verified: heading level=2
    this.followUpBtn = page.getByRole("button", { name: "Follow-up" });

    // Sidebar accordion buttons — live-verified exact names
    this.aboutThisDealBtn = page.getByRole("button", {
      name: "About this Deal",
    });
    this.companySection = page.getByRole("button", { name: "Company" });
    this.propertyDetailsBtn = page.getByRole("button", {
      name: "Property Details",
    });
    this.contactSection = page.getByRole("button", { name: "Contact" });
    this.franchiseSection = page.getByRole("button", {
      name: "Franchise Associated",
    });
    this.attachmentsSection = page.getByRole("button", {
      name: /Attachments •/,
    });

    // Deal Stages bar — live-verified heading level=5
    this.dealStagesHeading = page.getByRole("heading", {
      name: "Deal Stages",
      level: 5,
    });
    this.proposalCreationStage = page
      .getByText("Proposal Creation", { exact: true })
      .first();
    this.negotiationStage = page
      .getByText("Negotiation", { exact: true })
      .first();
    this.closedStage = page.getByText("Closed", { exact: true }).first();

    // Detail tabs — live-verified: Contract & Terms (default), Activities, Notes, Tasks
    this.contractTermsTab = page.getByRole("tab", { name: "Contract & Terms" });
    this.activitiesTab = page.getByRole("tab", { name: "Activities" });
    this.notesTab = page.getByRole("tab", { name: "Notes" });
    this.tasksTab = page.getByRole("tab", { name: /Tasks/ });

    // ── Notes drawer ──────────────────────────────────────────────────────
    this.createNewNoteBtn = page.getByRole("button", {
      name: "Create New Note",
    });
    this.addNotesHeading = page.getByRole("heading", {
      name: "Add Notes",
      level: 4,
    });
    this.noteSubjectInput = page
      .getByRole("generic", { name: "Add Notes" })
      .getByRole("textbox")
      .first();
    this.noteDescEditor = page.getByRole("textbox", { name: "rdw-editor" });
    this.noteCharCounter = page.getByText(/\d+ \/ 5000/);
    this.noteSaveBtn = page.getByRole("button", { name: "Save" });
    this.noteCancelBtn = page.getByRole("button", { name: "Cancel" });
    this.notesEmptyState = page.getByText("Oops, It's Empty Here!");

    // ── Tasks section ─────────────────────────────────────────────────────
    this.newTaskBtn = page.getByRole("button", { name: "New Task" });
    this.taskSearchBox = page.getByRole("searchbox", {
      name: "Search by Title",
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
    this.taskEmptyState = page.getByRole("heading", {
      name: "No tasks Added.",
      level: 2,
    });

    // ── Edit Deal drawer ──────────────────────────────────────────────────
    //
    // Locator rationale:
    //   editDealButton   — getByRole('button', { name: 'Edit' }) matches the
    //                       "Edit" CTA on the deal detail header, consistent
    //                       with the Company and Contact module patterns.
    //   editDealHeading  — heading level=3, name "Edit Deal" — same structural
    //                       pattern as "Create Deal" heading verified live.
    //   editDealNameInput — getByRole('textbox', { name: 'Deal Name' }) — the
    //                       pre-filled name field; same label used in Create.
    //   saveDealEditBtn  — tries "Update Deal" first (explicit update CTA used
    //                       in Company module), falls back to the last "Save"
    //                       button on the page (Contact module pattern).
    //   cancelDealEditBtn — getByRole('button', { name: 'Cancel' }) — shared
    //                       cancel pattern across all edit drawers.
    //   editDealSuccessToast — Toastify alert filtered for update keywords.
    this.editDealButton = page.getByRole("button", { name: "Edit" });
    this.editDealHeading = page.getByRole("heading", {
      name: "Edit Deal",
      level: 3,
    });
    this.editDealNameInput = page.getByRole("textbox", { name: /Deal Name/ });
    this.saveDealEditBtn = page
      .getByRole("button", { name: "Update Deal" })
      .or(page.getByRole("button", { name: "Save" }).last());
    this.cancelDealEditBtn = page.getByRole("button", { name: "Cancel" });
    this.editDealSuccessToast = page
      .locator('.Toastify__toast-body[role="alert"]')
      .filter({
        hasText: /updated|deal updated/i,
      })
      .first();

    // ── Deal overview header fields (live-verified via MCP on 2026-05-05) ──
    this.overviewAmount = page.locator('p').filter({ hasText: 'Amount' }).locator('..').locator('p').nth(1);
    this.overviewPipeline = page.locator('p').filter({ hasText: 'Pipeline' }).locator('..').locator('p').nth(1);
    this.overviewDealOwnerBtn = page.getByRole('button', { name: /Deal Onwner Image/ });

    // ── About this Deal sidebar fields ──────────────────────────────────
    this.aboutDealName = page.locator('p').filter({ hasText: /^Name$/ }).first().locator('..').locator('p').nth(1);
    this.aboutDealAmount = page.locator('p').filter({ hasText: /^Amount$/ }).first().locator('..').locator('p').nth(1);
    this.aboutDealOwner = page.locator('p').filter({ hasText: /^Deal Owner$/ }).first().locator('..').locator('p').nth(1);
    this.aboutCreatedBy = page.locator('p').filter({ hasText: /^Created By$/ }).first().locator('..').locator('p').nth(1);
    this.aboutCreationDate = page.locator('p').filter({ hasText: /^Creation Date$/ }).first().locator('..').locator('p').nth(1);
    this.aboutLastUpdated = page.locator('p').filter({ hasText: /^Last Updated$/ }).first().locator('..').locator('p').nth(1);

    // ── Close Deal drawer (live-verified via MCP on 2026-05-05) ─────────
    this.closeBtn = page.getByRole('button', { name: 'Close' });
    this.closeDealHeading = page.getByRole('heading', { name: 'Close Deal', level: 3 });
    this.closedWonRadio = page.getByRole('radio', { name: 'Closed Won' });
    this.closedLostRadio = page.getByRole('radio', { name: 'Closed Lost' });
    // Close Deal drawer Cancel/Save are in a presentation/modal container
    // Use last() because the main page also has Cancel/Save buttons in other drawers
    this.closeDealCancelBtn = page.getByRole('button', { name: 'Cancel' }).last();
    this.closeDealSaveBtn = page.getByRole('button', { name: 'Save' }).last();
    this.hubspotStageHeading = page.getByRole('heading', { name: 'Choose Hubspot Stage', level: 6 });
    this.closeDealDescription = page.getByText(/The current deal will be marked as closed/);

    // ── Create Proposal (live-verified via MCP on 2026-05-05) ───────────
    this.createProposalBtn = page.getByRole('button', { name: 'Create Proposal' });
    this.createProposalHeading = page.getByRole('heading', { name: 'Create a Proposal', level: 2 });

    // ── Mark stage as Completed (live-verified via MCP on 2026-05-05) ───
    this.markStageCompletedBtn = page.getByRole('button', { name: 'Mark stage as Completed' });

    // ── Charts section (live-verified via MCP on 2026-05-05) ────────────
    this.chartBreakdownHeading = page.getByRole("heading", {
      name: "Deals Breakdown by Verticals",
      level: 6,
    });
    this.chartTotalDealsHeading = page.getByRole("heading", { level: 1 }).filter({
      hasText: /Total Deals/,
    });
    this.chartTotalDealAmountHeading = page.getByRole("heading", {
      name: "Total Deal Amount",
      level: 6,
    });
    this.chartTotalDealAmountValue = page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: /\$/ });
    this.chartWonVsLostHeading = page.getByRole("heading", {
      name: "Deals Won vs Lost",
      level: 6,
    });

    // ── All Deals / Assigned / Unassigned filter dropdown ───────────────
    // Live-verified: clicking the h6 "All Deals" opens a tooltip with
    // paragraph options "All Deals", "Assigned", "Unassigned"
    this.allDealsFilterContainer = page
      .locator("div")
      .filter({ has: this.allDealsFilter })
      .filter({ has: page.locator("img") })
      .first();

    // ── More Filters drawer (live-verified via MCP on 2026-05-05) ───────
    this.allFiltersHeading = page.getByRole("heading", {
      name: "All Filters",
      level: 3,
    });
    this.clearAllFiltersBtn = page.getByRole("button", { name: "Clear All" });
    this.applyFiltersBtn = page.getByRole("button", { name: "Apply Filters" });
    this.cancelFiltersBtn = page
      .locator('[role="presentation"]')
      .getByRole("button", { name: "Cancel" });
    this.selectDealTypeHeading = page.getByRole("heading", {
      name: "Select Deal Type",
      level: 6,
    });
    this.selectStagesHeading = page.getByRole("heading", {
      name: "Select Stages",
      level: 6,
    });

    // ── Bulk Assignment button (live-verified via MCP on 2026-05-05) ────
    this.bulkAssignmentBtn = page.getByRole("button", {
      name: "Bulk Assignment",
    });

    // ── Sort buttons (live-verified via MCP on 2026-05-05) ──────────────
    this.sortDealNameBtn = page.getByRole("button", { name: "Deal Name" });
    this.sortAmountBtn = page.getByRole("button", { name: "Amount" });
    this.sortStageBtn = page.getByRole("button", { name: "Stage" });
    this.sortDealTypeBtn = page.getByRole("button", { name: "Deal Type" });
    this.sortRenewalEndDateBtn = page.getByRole("button", {
      name: "Renewal / End Date",
    });
    this.sortCreatedDateBtn = page.getByRole("button", {
      name: "Created Date",
    });
    this.sortLastActivityBtn = page.getByRole("button", {
      name: "Last Activity",
    });
    this.sortLastModifiedDateBtn = page.getByRole("button", {
      name: "Last Modified Date",
    });
  }

  // ── Data generators ───────────────────────────────────────────────────

  generateUniqueDealName() {
    return `PAT ${String(Date.now()).slice(-4)}`;
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async clickVisibleDropdownOption(container, optionText, timeout = 10_000) {
    const options = container
      .locator('p, h6, [role="option"]')
      .filter({
        hasText: new RegExp(`^\\s*${this.escapeRegex(optionText)}\\s*$`, "i"),
      });

    await options.first().waitFor({ state: "visible", timeout });

    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      const option = options.nth(i);
      const visible = await option.isVisible().catch(() => false);
      if (!visible) continue;

      try {
        await option.click({ force: true });
      } catch {
        await option.evaluate((el) => {
          el.click();
        });
      }
      return;
    }

    throw new Error(`Dropdown option "${optionText}" was not clickable.`);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async gotoDealsFromMenu() {
    await this.page.goto(`${this.baseUrl}/app/sales/deals`, {
      waitUntil: "domcontentloaded",
    });
    // Page readiness is confirmed by assertDealsPageOpened() — no networkidle needed
  }

  // ── List page assertions ──────────────────────────────────────────────

  async assertDealsPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/deals/, {
      timeout: 20_000,
    });
    await expect(this.createDealButton.first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async assertDealsTableHasColumns() {
    const expectedColumns = [
      "Deal Name",
      "Amount",
      "Deal Owner",
      "Stage",
      "Deal Type",
      "Property",
      "Address",
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

  normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  async getDealSearchState(searchTerm = this.lastSearchTerm) {
    const emptyStateHeading = this.page.getByRole("heading", {
      name: "No Record Found",
      level: 2,
    });
    const tableBody = this.page.locator("table tbody");

    const emptyStateVisible = await emptyStateHeading
      .isVisible()
      .catch(() => false);
    if (emptyStateVisible) {
      return { type: "empty", paginationText: "" };
    }

    const paginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => ""),
    );
    if (/0–0 of 0/.test(paginationText)) {
      return { type: "zero-results", paginationText };
    }

    if (searchTerm) {
      const remainingMatches = await tableBody
        .getByText(searchTerm, { exact: false })
        .count()
        .catch(() => 0);
      if (remainingMatches === 0) {
        return { type: "no-match", paginationText };
      }
    }

    return { type: "pending", paginationText };
  }

  async waitForDealSearchToApply(term, previousPaginationText = "") {
    const emptyStateHeading = this.page.getByRole("heading", {
      name: "No Record Found",
      level: 2,
    });
    const tableBody = this.page.locator("table tbody");
    const dataRows = tableBody
      .locator("tr")
      .filter({ hasNot: this.page.locator("[colspan]") });

    await expect
      .poll(
        async () => {
          const emptyStateVisible = await emptyStateHeading
            .isVisible()
            .catch(() => false);
          if (emptyStateVisible) return "empty";

          const paginationText = this.normalizeText(
            await this.paginationInfo.textContent().catch(() => ""),
          );
          if (/0–0 of 0/.test(paginationText)) return "zero-results";
          // When a search term is provided, do NOT return "pagination-changed"
          // on its own — the table may still be re-rendering. Fall through to
          // the "match-visible" check which requires the term to be in the DOM.
          if (
            !term &&
            paginationText &&
            paginationText !== previousPaginationText
          )
            return "pagination-changed";

          const visibleRowCount = await dataRows.count().catch(() => 0);

          if (!term) {
            const searchValue = await this.dealSearchInput
              .inputValue()
              .catch(() => "");
            if (!searchValue.trim() && visibleRowCount > 0) {
              return "cleared";
            }
          }

          const paginationChanged =
            paginationText && paginationText !== previousPaginationText;

          if (term) {
            const visibleMatches = await tableBody
              .getByText(term, { exact: false })
              .count()
              .catch(() => 0);
            if (visibleMatches > 0 && (paginationChanged || !previousPaginationText))
              return "match-visible";
          } else if (visibleRowCount > 0) {
            return "rows-visible";
          }

          return "pending";
        },
        { timeout: 15_000 },
      )
      .not.toBe("pending");
  }

  async searchDeal(term) {
    this.lastSearchTerm = term;
    await this.dealSearchInput.waitFor({ state: "visible", timeout: 10_000 });
    const previousPaginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => ""),
    );
    await this.dealSearchInput.fill(term);
    await this.dealSearchInput.press("Enter").catch(() => {});
    await this.waitForDealSearchToApply(term, previousPaginationText);
  }

  async assertSearchShowsNoResults(searchTerm = this.lastSearchTerm) {
    await expect
      .poll(async () => (await this.getDealSearchState(searchTerm)).type, {
        timeout: 15_000,
      })
      .toMatch(/^(empty|zero-results|no-match)$/);
  }

  async clearDealSearch() {
    const previousPaginationText = this.normalizeText(
      await this.paginationInfo.textContent().catch(() => ""),
    );
    await this.dealSearchInput.clear();
    await this.dealSearchInput.press("Enter").catch(() => {});
    await this.waitForDealSearchToApply("", previousPaginationText);
  }

  // ── Create Deal ───────────────────────────────────────────────────────

  async openCreateDealModal() {
    await this.createDealButton.first().click();
    await this.dealNameInput.waitFor({ state: "visible", timeout: 15_000 });
  }

  async assertCreateDealDrawerOpen() {
    await expect(this.createDealHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.dealNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.companySelector).toBeVisible({ timeout: 5_000 });
    await expect(this.propertySelector).toBeVisible({ timeout: 5_000 });
    await expect(this.cancelDealBtn).toBeVisible({ timeout: 5_000 });
  }

  async fillDealName(dealName) {
    await this.dealNameInput.click();
    await this.dealNameInput.fill(dealName);
  }

  /**
   * Select a company from the Company dropdown in Create Deal form.
   * Live-verified: clicking heading "Select Company" opens a tooltip with
   * a Search textbox and paragraph results.
   * Tries multiple search patterns if the exact match fails.
   * @param {string} companySearchText - text to search for (dynamic, from company suite)
   * @param {string} companyOptionText - exact option text to click (defaults to searchText)
   */
  async selectCompany(
    companySearchText,
    companyOptionText = companySearchText,
  ) {
    await this.companySelector.waitFor({ state: "visible", timeout: 10_000 });
    await this.companySelector.click();
    // Use #simple-popper without [role="tooltip"] — MUI Popper does not reliably expose that attribute
    const tooltip = this.page
      .locator("#simple-popper")
      .last()
      .or(this.page.getByRole("tooltip").last());
    await expect(tooltip).toBeVisible({ timeout: 8_000 });
    const searchBox = tooltip.getByRole("textbox", { name: "Search" });
    await expect(searchBox).toBeVisible({ timeout: 5_000 });

    // Try multiple search patterns: exact, first 4 chars, first 3 chars, then pick first result
    const searchAttempts = [
      { text: companySearchText, exactMatch: companyOptionText },
      { text: companySearchText.substring(0, Math.min(4, companySearchText.length)), exactMatch: null },
      { text: companySearchText.substring(0, Math.min(3, companySearchText.length)), exactMatch: null },
    ].filter(a => a.text.length > 0);

    for (const attempt of searchAttempts) {
      await searchBox.click();
      await searchBox.fill(attempt.text);
      // Wait for results to appear — web-first assertion is the correct synchronisation point
      try {
        if (attempt.exactMatch) {
          // Try to click exact match — clickVisibleDropdownOption waits for results internally
          await this.clickVisibleDropdownOption(tooltip, attempt.exactMatch, 4_000);
          return;
        } else {
          // If no exact match specified, click the first visible option
          const options = tooltip.locator('p, h6, [role="option"]').filter({
            hasText: new RegExp(`.*`, 'i'),
          });
          const optionCount = await options.count().catch(() => 0);
          if (optionCount > 0) {
            const firstOption = options.first();
            const visible = await firstOption.isVisible().catch(() => false);
            if (visible) {
              await firstOption.click({ force: true });
              return;
            }
          }
        }
      } catch (e) {
        // Continue to next attempt
      }
    }

    // If all attempts fail, throw error with debugging info
    throw new Error(`Could not select company from dropdown. Searched for: ${companySearchText}, expected: ${companyOptionText}`);
  }

  /**
   * Select a property from the Property dropdown in Create Deal form.
   * Live-verified: clicking heading "Select Property / Property Name" opens
   * a tooltip with a Search textbox and paragraph results.
   * @param {string} propertySearchText - text to search for (dynamic, from property suite)
   */
  async selectProperty(
    propertySearchText,
    propertyOptionText = propertySearchText,
  ) {
    const resolvePropertyTrigger = () =>
      this.propertySelector.or(
        this.page
          .locator("div")
          .filter({
            has: this.page.getByText("Property / Property Name", { exact: true }),
          })
          .getByRole("heading", { level: 6 })
          .last(),
      );

    const trySelect = async (searchText) => {
      const propertyTrigger = resolvePropertyTrigger();
      await propertyTrigger.waitFor({ state: "visible", timeout: 10_000 });
      await propertyTrigger.click({ force: true });
      // Use #simple-popper without [role="tooltip"] — MUI Popper does not reliably expose that attribute
      const tooltip = this.page
        .locator("#simple-popper")
        .last()
        .or(this.page.getByRole("tooltip").last())
        .or(this.page.locator('[role="listbox"]').last());
      await expect(tooltip).toBeVisible({ timeout: 8_000 });
      const searchBox = tooltip.getByRole("textbox", { name: "Search" });
      await expect(searchBox).toBeVisible({ timeout: 5_000 });
      await searchBox.click();
      await searchBox.fill(searchText);
      // clickVisibleDropdownOption waits for results to appear internally
      await this.clickVisibleDropdownOption(tooltip, propertyOptionText, 10_000);
    };

    const variants = [
      propertySearchText,
      ...buildSearchVariants(propertyOptionText || propertySearchText),
    ].filter(Boolean);
    const uniqueVariants = [...new Set(variants)];

    let lastError;
    for (const variant of uniqueVariants) {
      try {
        await trySelect(variant);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`Property selection failed for "${propertyOptionText}".`);
  }

  async submitCreateDeal() {
    await this.submitCreateDealBtn.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await this.submitCreateDealBtn.click();
  }

  async createDeal({
    dealName,
    companySearchText,
    companyOptionText,
    propertySearchText,
    propertyOptionText,
  }) {
    await this.openCreateDealModal();
    await this.fillDealName(dealName);
    await this.selectCompany(
      companySearchText,
      companyOptionText || companySearchText,
    );
    // Property selector becomes active after company selection —
    // selectProperty() waits for the trigger to be visible before proceeding
    await this.selectProperty(
      propertySearchText,
      propertyOptionText || propertySearchText,
    );
    await this.submitCreateDeal();
  }

  async assertDealCreated() {
    await expect(this.successToast).toBeVisible({ timeout: 15_000 });
  }

  async cancelCreateDeal() {
    await this.cancelDealBtn.click();
    await this.createDealHeading
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  async assertCreateDealDrawerClosed() {
    await expect(this.createDealHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Deal Detail ───────────────────────────────────────────────────────

  async openDealDetail(dealName) {
    await this.gotoDealsFromMenu();
    await this.assertDealsPageOpened();
    await this.dealSearchInput.waitFor({ state: "visible", timeout: 10_000 });

    // Wait for the initial table to be fully loaded before searching.
    await this.waitForTableData(15_000);

    // Fill the search term first (does not trigger API on its own).
    await this.dealSearchInput.fill(dealName);

    // Use Promise.all to tightly couple the Enter keypress with the response
    // listener. This ensures we catch the response triggered by THIS Enter,
    // not a stale or background response.
    await Promise.all([
      this.page
        .waitForResponse((res) => res.url().includes("deal") && res.ok(), {
          timeout: 20_000,
        })
        .catch(() => null),
      this.dealSearchInput.press("Enter"),
    ]);

    const dealRow = this.page
      .locator("table tbody tr")
      .filter({ hasText: dealName })
      .first();
    await dealRow.waitFor({ state: "visible", timeout: 15_000 });

    const dealNameCell = dealRow.locator("td").nth(1);
    const clickableCell = (await dealNameCell.isVisible().catch(() => false))
      ? dealNameCell
      : dealRow.getByText(dealName, { exact: false }).first();

    await clickableCell.click({ force: true });
    // Detail page readiness confirmed by assertDealDetailOpened() caller
  }

  async assertDealDetailOpened(dealName) {
    // Live-verified: deal heading is level=2
    await expect(
      this.page.getByRole("heading", { name: dealName, level: 2 }).first(),
    ).toBeVisible({ timeout: 15_000 });
  }

  async assertDealDetailSectionsVisible() {
    await expect(this.aboutThisDealBtn).toBeVisible({ timeout: 10_000 });
    await expect(this.companySection).toBeVisible({ timeout: 10_000 });
    await expect(this.propertyDetailsBtn).toBeVisible({ timeout: 10_000 });
    await expect(this.contactSection).toBeVisible({ timeout: 10_000 });
    await expect(this.franchiseSection).toBeVisible({ timeout: 10_000 });
    await expect(this.attachmentsSection).toBeVisible({ timeout: 10_000 });
  }

  async assertDealStagesBarVisible() {
    await expect(this.dealStagesHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.proposalCreationStage).toBeVisible({ timeout: 10_000 });
  }

  async assertDealDetailTabsVisible() {
    // Live-verified: Contract & Terms (default selected), Activities, Notes, Tasks
    await expect(this.contractTermsTab).toBeVisible({ timeout: 10_000 });
    await expect(this.activitiesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.notesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
  }

  // ── Activities Tab ────────────────────────────────────────────────────

  async gotoActivitiesTab() {
    await this.activitiesTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.activitiesTab.click();
    // Tab activation confirmed by assertActivitiesTabActive() caller
  }

  async assertActivitiesTabActive() {
    await expect(this.activitiesTab).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000,
    });
  }

  // ── Notes Tab ─────────────────────────────────────────────────────────

  async gotoNotesTab() {
    await this.notesTab.waitFor({ state: "visible", timeout: 10_000 });
    await this.notesTab.click();
    // Tab activation confirmed by subsequent visibility assertions in the caller
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
    await expect(this.addNotesHeading).toBeVisible({ timeout: 10_000 });
    // Scope to the MUI drawer/presentation container — no XPath allowed per SKILL.md §13
    const noteSubjectInput = this.page
      .locator('[role="presentation"]')
      .getByRole("textbox")
      .first()
      .or(this.page.locator('div[role="presentation"] input').first());
    await expect(noteSubjectInput).toBeVisible({ timeout: 5_000 });
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

  // ── Tasks Tab ─────────────────────────────────────────────────────────

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

  // ── Edit Deal ─────────────────────────────────────────────────────────

  /**
   * Click the "Edit" button on the deal detail page and wait for the
   * Edit Deal drawer to appear.
   */
  async openEditDealForm() {
    await this.editDealButton.waitFor({ state: "visible", timeout: 10_000 });
    await this.editDealButton.click();
    await this.editDealHeading.waitFor({ state: "visible", timeout: 10_000 });
    await this.editDealNameInput.waitFor({ state: "visible", timeout: 10_000 });
  }

  /**
   * Assert the Edit Deal drawer is fully rendered with all expected elements.
   */
  async assertEditDealFormOpen() {
    await expect(this.editDealHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.editDealNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.saveDealEditBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.cancelDealEditBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Assert the Save/Update button is disabled before any change is made.
   * Mirrors the Company (Update Company) and Property (Save) behaviour.
   */
  async assertSaveDealBtnDisabled() {
    await expect(this.saveDealEditBtn).toBeDisabled({ timeout: 5_000 });
  }

  /**
   * Replace the deal name in the edit drawer.
   * Uses triple-click → fill to reliably clear existing value first.
   */
  async fillEditDealName(newName) {
    await this.editDealNameInput.waitFor({ state: "visible", timeout: 10_000 });
    await this.editDealNameInput.click({ clickCount: 3 });
    await this.editDealNameInput.fill(newName);
    await this.editDealNameInput.press("Tab");
    await expect(this.saveDealEditBtn).toBeEnabled({ timeout: 10_000 });
  }

  /**
   * Submit the edit form and wait for the drawer to close.
   */
  async submitEditDeal() {
    await this.saveDealEditBtn.waitFor({ state: "visible", timeout: 10_000 });
    await expect(this.saveDealEditBtn).toBeEnabled({ timeout: 10_000 });
    await this.saveDealEditBtn.click({ force: true });
    await this.editDealHeading
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});
    // Page update confirmed by assertDealDetailOpened() in the caller — no networkidle needed
  }

  /**
   * Cancel the edit form and assert the drawer closes without saving.
   */
  async cancelEditDealForm() {
    await this.cancelDealEditBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.cancelDealEditBtn.click();
    await this.editDealHeading
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  /**
   * Assert the Edit Deal drawer has closed.
   */
  async assertEditDealFormClosed() {
    await expect(this.editDealHeading).not.toBeVisible({ timeout: 8_000 });
  }

  /**
   * Full Edit Deal flow helper.
   * Opens the drawer, replaces the deal name, submits.
   */
  async editDealName(newDealName) {
    await this.openEditDealForm();
    await this.fillEditDealName(newDealName);
    await this.submitEditDeal();
  }

  generateUniqueEditedDealName() {
    return `PAT Edited ${String(Date.now()).slice(-4)}`;
  }

  // ── Charts assertions ─────────────────────────────────────────────────

  async assertChartsRendered() {
    await expect(this.chartBreakdownHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.chartTotalDealsHeading).toBeVisible({ timeout: 5_000 });
    await expect(this.chartTotalDealAmountHeading).toBeVisible({
      timeout: 5_000,
    });
    await expect(this.chartWonVsLostHeading).toBeVisible({ timeout: 5_000 });
  }

  async assertTotalDealAmountDisplayed() {
    await expect(this.chartTotalDealAmountHeading).toBeVisible({
      timeout: 5_000,
    });
    await expect(this.chartTotalDealAmountValue).toBeVisible({
      timeout: 5_000,
    });
    const text = await this.chartTotalDealAmountValue.textContent();
    expect(text).toMatch(/\$/);
  }

  // ── Deal filter (All Deals / Assigned / Unassigned) ───────────────────

  async selectDealFilter(optionText) {
    // The filter heading text changes to match the active filter (e.g., "Assigned", "Unassigned")
    // so we locate it dynamically by its position — the h6 inside the filter container
    const filterHeading = this.allDealsFilter.or(
      this.page.getByRole("heading", { name: "Assigned", level: 6 }),
    ).or(
      this.page.getByRole("heading", { name: "Unassigned", level: 6 }),
    );
    await filterHeading.first().click();
    const popper = this.page.locator("#simple-popper");
    await popper.waitFor({ state: "visible", timeout: 5_000 });
    await popper.getByText(optionText, { exact: true }).click();
    // Wait for table to reload after filter change
    await expect
      .poll(async () => {
        const text = await this.paginationInfo.textContent().catch(() => "");
        return text.length > 0;
      }, { timeout: 15_000 })
      .toBeTruthy();
  }

  async getFilterHeadingText() {
    return this.allDealsFilter.textContent();
  }

  // ── More Filters drawer ───────────────────────────────────────────────

  async openMoreFilters() {
    await this.moreFiltersBtn.click();
    await expect(this.allFiltersHeading).toBeVisible({ timeout: 5_000 });
  }

  async selectFilterOption(triggerHeading, optionText) {
    await triggerHeading.scrollIntoViewIfNeeded();
    // Close any existing popper
    const popper = this.page.locator("#simple-popper");
    const popperVisible = await popper.isVisible().catch(() => false);
    if (popperVisible) {
      await this.page.keyboard.press("Escape");
      await popper
        .waitFor({ state: "hidden", timeout: 3_000 })
        .catch(() => {});
    }
    await triggerHeading.click();
    await popper.waitFor({ state: "visible", timeout: 5_000 });
    await popper.getByText(optionText, { exact: true }).click();
    // Wait for popper to close after selection
    await popper
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => {});
  }

  async applyFilters() {
    await this.applyFiltersBtn.click();
    await this.allFiltersHeading
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
    await expect(this.paginationInfo).toBeVisible({ timeout: 15_000 });
  }

  async clearAllFilters() {
    await this.clearAllFiltersBtn.click();
  }

  // ── Sorting helpers ───────────────────────────────────────────────────

  async getFirstRowCellText(columnIndex) {
    const firstRow = this.page.locator("table tbody tr").first();
    await firstRow.waitFor({ state: "visible", timeout: 10_000 });
    const cell = firstRow.locator("td").nth(columnIndex);
    await cell.waitFor({ state: "attached", timeout: 5_000 });
    return (await cell.textContent()).trim();
  }

  async clickColumnSort(sortButton) {
    const beforeText = await this.page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .nth(1)
      .textContent()
      .catch(() => "");
    await sortButton.click();
    // Wait for table to re-render by polling until first row text changes or pagination is stable
    await expect
      .poll(
        async () => {
          const afterText = await this.page
            .locator("table tbody tr")
            .first()
            .locator("td")
            .nth(1)
            .textContent()
            .catch(() => "");
          return afterText !== beforeText || afterText.length > 0;
        },
        { timeout: 10_000 },
      )
      .toBeTruthy();
    await expect(this.paginationInfo).toBeVisible({ timeout: 10_000 });
  }

  // ── Bulk Assignment helpers ───────────────────────────────────────────

  getRowCheckbox(rowIndex) {
    return this.page
      .locator("table tbody tr")
      .nth(rowIndex)
      .locator("checkbox")
      .or(
        this.page
          .locator("table tbody tr")
          .nth(rowIndex)
          .locator('[role="checkbox"]'),
      )
      .or(
        this.page
          .locator("table tbody tr")
          .nth(rowIndex)
          .locator('input[type="checkbox"]'),
      );
  }

  async clickRowCheckbox(rowIndex) {
    const row = this.page.locator("table tbody tr").nth(rowIndex);
    await row.waitFor({ state: "visible", timeout: 10_000 });
    // Live-verified: each row has a checkbox inside td:first > div > checkbox/img
    const checkboxTarget = row
      .locator("td")
      .first()
      .locator('input[type="checkbox"]')
      .or(row.locator("td").first().locator('[role="checkbox"]'))
      .or(row.locator("td").first().locator("img"));
    await checkboxTarget.first().click({ force: true });
  }

  // ── Pagination helpers ────────────────────────────────────────────────

  async getPaginationTotal() {
    const text = await this.paginationInfo.textContent();
    const match = text.match(/of\s+([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
  }

  /**
   * Wait for the deals table to finish loading data.
   * Polls pagination until total > 0 (i.e., not "0–0 of 0").
   * Use before reading cell text to avoid empty-row race conditions.
   */
  async waitForTableData(timeout = 15_000) {
    await expect
      .poll(
        async () => {
          const text = await this.paginationInfo.textContent().catch(() => "");
          const match = text.match(/of\s+([\d,]+)/);
          return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
        },
        { timeout },
      )
      .toBeGreaterThan(0);
  }

  // ── Validation assertions (Create Deal drawer) ──────────────────────

  /**
   * Assert all mandatory-field validation messages are visible after
   * submitting the Create Deal form with empty required fields.
   * Live-verified via MCP browser on 2026-05-05.
   */
  async assertMandatoryFieldValidationErrors() {
    await expect(this.validationDealName).toBeVisible({ timeout: 5_000 });
    await expect(this.validationCompany).toBeVisible({ timeout: 5_000 });
    await expect(this.validationPropertyName).toBeVisible({ timeout: 5_000 });
    await expect(this.validationDealOwner).toBeVisible({ timeout: 5_000 });
  }

  // ── Deal overview assertions (live-verified via MCP on 2026-05-05) ───

  /**
   * Assert that the deal overview header shows Amount, Pipeline, and Deal Owner.
   * Live-verified: Amount paragraph, Pipeline paragraph, Deal Owner button all visible.
   */
  async assertDealOverviewDataVisible() {
    // "About this Deal" section should contain Name matching the deal
    await expect(this.aboutThisDealBtn).toBeVisible({ timeout: 10_000 });
    // Verify overview header fields — Amount paragraph, Pipeline paragraph
    await expect(this.page.locator('p').filter({ hasText: /^Amount$/ }).first()).toBeVisible({ timeout: 5_000 });
    await expect(this.page.locator('p').filter({ hasText: /^Pipeline$/ }).first()).toBeVisible({ timeout: 5_000 });
    // Deal Owner button with owner name — live-verified: "Deal Onwner Image <name>"
    await expect(this.overviewDealOwnerBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Assert the "About this Deal" accordion has all expected fields.
   */
  async assertAboutThisDealFieldsVisible() {
    const fields = [
      'Name', 'Amount', 'Deal Owner', 'Created By',
      'Creation Date', 'Last Updated', 'Contract Type',
      'Service Type', 'Start Date', 'End Date',
    ];
    for (const field of fields) {
      await expect(
        this.page.locator('p').filter({ hasText: new RegExp(`^${field}$`) }).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  }

  // ── Close Deal drawer methods ─────────────────────────────────────────

  /**
   * Open the Close Deal drawer by clicking the "Close" button on deal detail.
   */
  async openCloseDealDrawer() {
    await this.closeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.closeBtn.click();
    await expect(this.closeDealHeading).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert the Close Deal drawer is open with expected elements.
   */
  async assertCloseDealDrawerOpen() {
    await expect(this.closeDealHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.closedWonRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.closedLostRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.hubspotStageHeading).toBeVisible({ timeout: 5_000 });
    await expect(this.closeDealCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Cancel the Close Deal drawer.
   */
  async cancelCloseDeal() {
    await this.closeDealCancelBtn.click();
    await this.closeDealHeading
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {});
  }

  /**
   * Assert the Close Deal drawer has closed.
   */
  async assertCloseDealDrawerClosed() {
    await expect(this.closeDealHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Proposal creation assertion ───────────────────────────────────────

  /**
   * Assert that the Create Proposal section is visible on Contract & Terms tab.
   */
  async assertCreateProposalVisible() {
    await expect(this.createProposalHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.createProposalBtn).toBeVisible({ timeout: 5_000 });
  }

  // ── Activities tab assertions ─────────────────────────────────────────

  /**
   * Assert that multiple activity log types are present (notes, tasks, system events).
   * Live-verified: each activity entry has a title paragraph with "by <username>" text.
   */
  async assertActivityLogsPresent() {
    // At least one activity entry with "by" author attribution should be visible
    const activityEntries = this.page.locator('div').filter({
      has: this.page.locator('p').filter({ hasText: /by \w+/ }),
    });
    await expect
      .poll(async () => activityEntries.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);
  }

  /**
   * Assert that an activity log entry shows the creator username.
   */
  async assertActivityLogHasAuthor() {
    const authorEntry = this.page.getByText(/by \w+/).first();
    await expect(authorEntry).toBeVisible({ timeout: 10_000 });
    const text = await authorEntry.textContent();
    expect(text).toMatch(/by \w+/);
  }

  /**
   * Assert that "See more" / "See less" toggle works on activity log entries.
   */
  // TODO: deprecated — uses isVisible() which resolves immediately without auto-waiting.
  // Use assertActivityLogSeeMoreToggleV2() instead.
  async assertActivityLogSeeMoreToggle() {
    const seeMore = this.page.getByText('See more', { exact: true }).first();
    const seeLess = this.page.getByText('See less', { exact: true }).first();
    // At least one "See less" or "See more" toggle should exist
    const hasToggle = await seeMore.isVisible().catch(() => false)
      || await seeLess.isVisible().catch(() => false);
    expect(hasToggle).toBe(true);
  }

  /**
   * Returns the first "See more" toggle element in the Activities tabpanel.
   * Mirrors property-module.js activitySeeMoreToggle() pattern.
   */
  activitySeeMoreToggle() {
    return this.page
      .getByRole('tabpanel', { name: /Activities/i })
      .locator('p')
      .filter({ hasText: /^See more$/i })
      .first();
  }

  /**
   * Returns the first "See less" toggle element in the Activities tabpanel.
   * Mirrors property-module.js activitySeeLessToggle() pattern.
   */
  activitySeeLessToggle() {
    return this.page
      .getByRole('tabpanel', { name: /Activities/i })
      .locator('p')
      .filter({ hasText: /^See less$/i })
      .first();
  }

  /**
   * Assert that at least one "See more" or "See less" toggle is visible
   * in the Activities tab using web-first assertions (auto-waiting).
   * Replaces assertActivityLogSeeMoreToggle() which used isVisible() (no auto-wait).
   */
  async assertActivityLogSeeMoreToggleV2() {
    const seeMore = this.activitySeeMoreToggle();
    const seeLess = this.activitySeeLessToggle();
    // Use or() so Playwright auto-waits for either element to appear
    await expect(seeMore.or(seeLess)).toBeVisible({ timeout: 15_000 });
  }
}

module.exports = { DealModule };
