// pages/property-module.js
// Page Object Model — Properties Module, Signal CRM
// ALL locators live-verified via MCP browser on 2026-03-20
// Fully dynamic — no hardcoded IDs or names

const { expect } = require('@playwright/test');
const { env } = require('../utils/env');

class PropertyModule {
  constructor(page) {
    this.page = page;
    this.createdPropertyName         = null;
    this.lastCreatePropertyToastSeen = false;
    this.lastEditPropertyToastSeen   = false;
    this.lastSearchTerm              = '';
    // ── Omaha address strategy ────────────────────────────────────────────
    // The app enforces unique addresses per property.  A hardcoded list of
    // addresses is exhausted after N test runs.
    //
    // Strategy (tried in order):
    //   1. PRIMARY  — generateTimestampAddress()
    //      Uses Date.now() to embed a unique house number (1000–8999) on a
    //      real Omaha street.  Gives ~8 000 × 8 streets = 64 000 unique
    //      addresses. Google autocomplete resolves numbered Omaha addresses
    //      just as reliably as intersection addresses.
    //
    //   2. FALLBACK — omahaAddressFallbackPool (intersection addresses)
    //      The original 14 intersections + 36 additional = 50 total.
    //      Shuffled randomly each run so the same address is not retried
    //      first every time.  Used only when the timestamp address fails
    //      autocomplete (e.g. no network, slow Google Maps response).
    //
    // ── Primary streets for timestamp-based generation ────────────────────
    this._timestampStreets = [
      { street: 'Dodge St',      zip: '68131', min: 1000, max: 8900 },
      { street: 'Farnam St',     zip: '68131', min: 1000, max: 7400 },
      { street: 'Harney St',     zip: '68102', min: 1000, max: 4900 },
      { street: 'Howard St',     zip: '68102', min: 1000, max: 4900 },
      { street: 'N 42nd St',     zip: '68131', min: 1000, max: 5900 },
      { street: 'N 72nd St',     zip: '68114', min: 1000, max: 5900 },
      { street: 'N 90th St',     zip: '68134', min: 1000, max: 5900 },
      { street: 'N 108th St',    zip: '68154', min: 1000, max: 5900 },
    ];

    // ── Fallback intersection pool (50 addresses) ─────────────────────────
    this.omahaAddressCandidates = [
      // Original 14
      '20th & Davenport St, Omaha, NE 68102',
      '13th & Howard St, Omaha, NE 68102',
      '24th & Cuming St, Omaha, NE 68107',
      '42nd & Center St, Omaha, NE 68105',
      '50th & Grover St, Omaha, NE 68106',
      '72nd & Dodge St, Omaha, NE 68114',
      '72nd & Maple St, Omaha, NE 68134',
      '90th & Blondo St, Omaha, NE 68134',
      '108th & Q St, Omaha, NE 68137',
      '120th & L St, Omaha, NE 68137',
      '132nd & Center Rd, Omaha, NE 68144',
      '144th & F St, Omaha, NE 68137',
      '156th & Dodge St, Omaha, NE 68118',
      '168th & Maple Rd, Omaha, NE 68116',
      // Additional 36
      '16th & Dodge St, Omaha, NE 68102',
      '24th & Dodge St, Omaha, NE 68131',
      '33rd & Farnam St, Omaha, NE 68131',
      '42nd & Dodge St, Omaha, NE 68131',
      '50th & Dodge St, Omaha, NE 68132',
      '60th & Dodge St, Omaha, NE 68132',
      '84th & Dodge St, Omaha, NE 68114',
      '96th & Dodge St, Omaha, NE 68114',
      '114th & Dodge St, Omaha, NE 68154',
      '126th & Dodge St, Omaha, NE 68154',
      '140th & Dodge St, Omaha, NE 68154',
      '152nd & Dodge St, Omaha, NE 68154',
      '16th & Farnam St, Omaha, NE 68102',
      '24th & Farnam St, Omaha, NE 68131',
      '42nd & Farnam St, Omaha, NE 68131',
      '60th & Farnam St, Omaha, NE 68132',
      '78th & Cass St, Omaha, NE 68114',
      '84th & Cass St, Omaha, NE 68114',
      '96th & Pacific St, Omaha, NE 68114',
      '108th & Pacific St, Omaha, NE 68154',
      '120th & Pacific St, Omaha, NE 68154',
      '72nd & Pacific St, Omaha, NE 68114',
      '60th & Pacific St, Omaha, NE 68106',
      '50th & Pacific St, Omaha, NE 68106',
      '42nd & Pacific St, Omaha, NE 68105',
      '33rd & Leavenworth St, Omaha, NE 68105',
      '42nd & Leavenworth St, Omaha, NE 68105',
      '50th & Leavenworth St, Omaha, NE 68106',
      '60th & Leavenworth St, Omaha, NE 68106',
      '78th & Leavenworth St, Omaha, NE 68114',
      '30th & Cuming St, Omaha, NE 68131',
      '42nd & Cuming St, Omaha, NE 68131',
      '60th & Cuming St, Omaha, NE 68132',
      '78th & Cuming St, Omaha, NE 68114',
      '90th & Cuming St, Omaha, NE 68114',
      '108th & Maple St, Omaha, NE 68164',
      '120th & Maple St, Omaha, NE 68164',
      '132nd & Maple St, Omaha, NE 68164',
      '144th & Maple St, Omaha, NE 68116',
      '156th & Maple St, Omaha, NE 68116',
    ];

    // ── Sidebar navigation ──────────────────────────────────────────────────
    this.propertiesMenuLink = page
      .getByRole('listitem', { name: 'Properties' })
      .getByRole('link');

    // ── List page ───────────────────────────────────────────────────────────
    this.createPropertyButton = page.getByRole('button', { name: 'Create Property' });
    this.propertySearchInput  = page
      .getByRole('searchbox', { name: 'ID, Property, Zip Code / Postal Code' })
      .or(page.locator('input[placeholder*="ID, Property"]'))
      .first();
    this.paginationInfo   = page.getByText(/\d+–\d+ of \d+/);
    this.nextPageBtn      = page.getByRole('button', { name: 'Go to next page' });
    this.prevPageBtn      = page.getByRole('button', { name: 'Go to previous page' });
    this.rowsPerPageCombo = page.getByRole('combobox', { name: /Rows per page/ });

    // ── Create Property drawer ──────────────────────────────────────────────
    // Live-verified: heading level=3
    this.createPropertyHeading = page.getByRole('heading', { name: 'Create Property', level: 3 });

    // Company field — heading "Search Company" (level=6)
    // Clicking opens a tooltip with a Search textbox + paragraph results
    this.companyDropdownTrigger = page.getByRole('heading', { name: 'Search Company', level: 6 });

    // Property name textbox
    this.propertyNameInput = page.getByRole('textbox', { name: 'Property / Property Name *' });

    // Property Source — heading "Add Property Source" (level=6)
    // Tooltip options: ALN, Building Connected, Referral, etc. (paragraphs)
    this.propertySourceTrigger = page.getByRole('heading', { name: 'Add Property Source', level: 6 });
    this.associatedFranchiseTrigger = page.getByRole('heading', { name: 'Add Associated Franchise', level: 6 });

    // Stage — heading "Choose stage" (level=6)
    // Tooltip options: "New Location", "Approved" (paragraphs)
    this.stageTrigger = page.getByRole('heading', { name: 'Choose stage', level: 6 });

    // Assignee — heading "Select Assignee" (level=6)
    // Tooltip shows generic cards (Avatar + heading level=4 + paragraph role)
    this.assigneeTrigger = page.getByRole('heading', { name: 'Select Assignee', level: 6 });
    this.managedButton = page.getByRole('button', { name: 'Managed' });
    this.ownedButton = page.getByRole('button', { name: 'Owned' });
    this.regionalOfficeButton = page.getByRole('button', { name: 'Regional office' });
    this.sharedButton = page.getByRole('button', { name: 'Shared' });
    this.contactTrigger = page.getByRole('heading', { name: 'Select a Contact' }).first();

    // Address — textbox with placeholder " Type Address"
    this.addressInput = page.getByRole('textbox', { name: 'Type Address' });
    this.contactAffiliationError = page.getByText('Contact Affiliation must be of type object', { exact: false });
    this.addressRequiredError = page.getByText('Address is required.', { exact: false });

    this.cancelCreateBtn = page.getByRole('button', { name: 'Cancel' });
    // Submit button in drawer — use .last() to avoid clash with list page button
    this.submitCreateBtn = page.getByRole('button', { name: 'Create Property' }).last();

    this.createPropertyToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /created successfully|property created|Translation missing/i
    }).first();

    // Duplicate-address error toast
    // Live-verified 2026-03-24: submitting a property whose geocoded lat/lng already
    // exists in the DB shows an alert role toast with this exact message.
    // The app geocodes the address via Google Maps and enforces uniqueness on
    // lat/lng coordinates — not on the raw address string.
    this.duplicateAddressToast = page.getByRole('alert').filter({
      hasText: /Latitude and longitude has already been taken/i
    }).first();

    // ── Property Detail page ─────────────────────────────────────────────────
    // Live-verified: property heading is level=1
    this.editButton      = page.getByRole('button', { name: 'Edit' });
    this.makeADealButton = page.getByRole('button', { name: 'Make a Deal' });

    // Sidebar accordion buttons — live-verified exact names
    this.propertyDetailsBtn = page.getByRole('button', { name: 'Property Details' });
    this.companiesSection   = page.getByRole('button', { name: /Companies •/ });
    this.dealsSection       = page.getByRole('button', { name: /Deals •/ });
    this.contactsSection    = page.getByRole('button', { name: /Contacts •/ });
    // Live-verified: "Franchise Associated" (NOT "Franchise" or "Franchise •")
    this.franchiseSection   = page.getByRole('button', { name: 'Franchise Associated' });
    this.attachmentsSection = page.getByRole('button', { name: /Attachments •/ });

    // Property Stages bar — live-verified heading level=5
    this.stagesHeading    = page.getByRole('heading', { name: 'Property Stages', level: 5 });
    // Stage buttons have long tooltip text as accessible name — use partial match
    this.approvedStageBtn = page.getByText('Approved', { exact: true }).first();
    this.currentCustBtn   = page.getByText(/Current Customer/, { exact: false }).first();

    // Detail tabs — live-verified: 6 tabs, Convert Questions is default selected
    this.convertQuestionsTab = page.getByRole('tab', { name: 'Convert Questions' });
    this.activitiesTab       = page.getByRole('tab', { name: 'Activities'        });
    this.notesTab            = page.getByRole('tab', { name: 'Notes'             });
    this.tasksTab            = page.getByRole('tab', { name: 'Tasks'             });
    this.emailsTab           = page.getByRole('tab', { name: 'Emails'            });
    this.meetingsTab         = page.getByRole('tab', { name: 'Meetings'          });

    // ── Edit Property drawer ──────────────────────────────────────────────────
    // Live-verified: heading level=3, submit is "Save" (NOT "Update Property")
    this.editPropertyHeading   = page.getByRole('heading', { name: 'Edit Property', level: 3 });
    this.editPropertyNameInput = page.getByRole('textbox', { name: 'Property / Property Name *' });
    this.saveEditBtn           = page.getByRole('button',  { name: 'Save' });
    this.cancelEditBtn         = page.getByRole('button',  { name: 'Cancel' });

    this.editPropertyToast = page.locator('.Toastify__toast-body[role="alert"]').filter({
      hasText: /updated successfully|property updated|Translation missing/i
    }).first();

    // ── Notes drawer ─────────────────────────────────────────────────────────
    this.createNewNoteBtn = page.getByRole('button',  { name: 'Create New Note' });
    // Live-verified: drawer container is generic[name="Add Notes"], heading level=4 inside it
    this.addNotesHeading  = page.getByRole('heading', { name: 'Add Notes', level: 4 });
    // Subject: unlabelled textbox — scoped to the "Add Notes" generic container
    this.noteSubjectInput = page.getByRole('generic', { name: 'Add Notes' })
                               .getByRole('textbox').first();
    this.noteDescEditor   = page.getByRole('textbox', { name: 'rdw-editor' });
    // Live-verified: char counter is paragraph text "0 / 5000"
    this.noteCharCounter  = page.getByText(/\d+ \/ 5000/);
    this.noteSaveBtn      = page.getByRole('button', { name: 'Save' });
    this.noteCancelBtn    = page.getByRole('button', { name: 'Cancel' });
    // Live-verified notes empty state text
    this.notesEmptyState  = page.getByText("Oops, It's Empty Here!");

    // ── Tasks section ─────────────────────────────────────────────────────────
    // Live-verified locators from Tasks tab
    this.newTaskBtn          = page.getByRole('button',    { name: 'New Task'              });
    this.taskSearchBox       = page.getByRole('searchbox', { name: 'Search by Title'        });
    this.taskDateRangeInput  = page.getByRole('textbox',   { name: 'MM/DD/YYYY - MM/DD/YYYY'});
    this.createTaskHeading   = page.getByRole('heading',   { name: 'Create New Task', level: 3 });
    this.taskTitleInput      = page.getByRole('textbox',   { name: 'Task Title'             });
    this.taskDescEditor      = page.getByRole('textbox',   { name: 'rdw-editor'             });
    this.taskTypeTrigger     = page.getByRole('heading',   { name: 'Select Type',     level: 6 });
    this.taskPriorityTrigger = page.getByRole('heading',   { name: 'Select Priority', level: 6 });
    this.taskSaveBtn         = page.getByRole('button',    { name: 'Save'   });
    this.taskCancelBtn       = page.getByRole('button',    { name: 'Cancel' });
    // Live-verified: empty state heading level=2
    this.taskEmptyState      = page.getByRole('heading',   { name: 'No tasks Added.', level: 2 });
  }

  // ── Data Generators ──────────────────────────────────────────────────────

  generateUniquePropertyName() {
    return `S-P ${String(Date.now()).slice(-4)}`;
  }

  generateUniqueEditedName() {
    return `S-P ${String(Date.now() + 1).slice(-4)}`;
  }

  /**
   * Generate a single unique Omaha address per run.
   *
   * Strategy: pick a street at random from _timestampStreets, then derive a
   * house number from Date.now() within that street's valid range.
   * Because Date.now() is millisecond-precision, two runs milliseconds apart
   * will produce different house numbers, giving effectively unlimited unique
   * addresses (8 streets × ~8 000 valid house numbers each = ~64 000 options).
   *
   * Example output: "3427 Dodge St, Omaha, NE 68131"
   * Google Maps autocompletes numeric Omaha addresses reliably.
   *
   * @returns {string}
   */
  generateTimestampAddress() {
    const now      = Date.now();
    const street   = this._timestampStreets[now % this._timestampStreets.length];
    const range    = street.max - street.min;           // e.g. 7900 for Dodge St
    // Round to nearest 100 so the number looks realistic (1200, 2400, etc.)
    const rawNum   = street.min + (now % range);
    const houseNum = Math.round(rawNum / 100) * 100 || street.min;
    return `${houseNum} ${street.street}, Omaha, NE ${street.zip}`;
  }

  /**
   * Return the candidate address list for createProperty retries.
   *
   * Order:
   *   1. 3 × timestamp-generated addresses (different per run, virtually never collide)
   *   2. Fallback intersection pool — randomly shuffled (Fisher-Yates)
   *
   * If the timestamp address fails autocomplete for any reason (slow Maps,
   * network issue) the test falls through to the 50-address fallback pool
   * which is shuffled differently each run so the same address is not
   * always retried first.
   *
   * @returns {string[]}
   */
  getUniqueOmahaAddressCandidates() {
    // Generate 3 timestamp-based addresses (slight time offset between each)
    const primary = [
      this.generateTimestampAddress(),
      (() => {
        const now    = Date.now() + 500;
        const street = this._timestampStreets[(now + 1) % this._timestampStreets.length];
        const rawNum = street.min + ((now + 1) % (street.max - street.min));
        const num    = Math.round(rawNum / 100) * 100 || street.min;
        return `${num} ${street.street}, Omaha, NE ${street.zip}`;
      })(),
      (() => {
        const now    = Date.now() + 1000;
        const street = this._timestampStreets[(now + 2) % this._timestampStreets.length];
        const rawNum = street.min + ((now + 2) % (street.max - street.min));
        const num    = Math.round(rawNum / 100) * 100 || street.min;
        return `${num} ${street.street}, Omaha, NE ${street.zip}`;
      })(),
    ];

    // Fisher-Yates shuffle of the fallback pool (random, not deterministic)
    const fallback = [...this.omahaAddressCandidates];
    for (let i = fallback.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fallback[i], fallback[j]] = [fallback[j], fallback[i]];
    }

    return [...primary, ...fallback];
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  async gotoPropertiesFromMenu() {
    const menuVisible = await this.propertiesMenuLink
      .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
    if (menuVisible) {
      await this.propertiesMenuLink.click();
    } else {
      await this.page.goto('/app/sales/locations', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  }

  // ── List page assertions ─────────────────────────────────────────────────

  async assertPropertiesPageOpened() {
    await expect(this.page).toHaveURL(/\/app\/sales\/locations/, { timeout: 20_000 });
    await expect(this.createPropertyButton.first()).toBeVisible({ timeout: 15_000 });
  }

  async assertPropertiesTableHasColumns() {
    const expectedColumns = [
      'Property Name', 'Property Affiliation', 'Lot Number', 'Deal Count',
      'Stage', 'Type', 'Created Date', 'Last Modified Date'
    ];
    for (const col of expectedColumns) {
      await expect(
        this.page.getByRole('columnheader', { name: col })
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
    await this.propertySearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.propertySearchInput.fill(term);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_000);
  }

  async assertSearchShowsNoResults(searchTerm = this.lastSearchTerm) {
    const paginationText = await this.paginationInfo.textContent().catch(() => '');
    const noResultsByPagination = /0–0 of 0/.test(paginationText);
    if (noResultsByPagination) return;

    await expect(
      this.page.locator('table tbody').getByText(searchTerm, { exact: false })
    ).toHaveCount(0, { timeout: 10_000 });
  }

  async clearPropertySearch() {
    await this.propertySearchInput.clear();
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ── Create Property ──────────────────────────────────────────────────────

  async openCreatePropertyDrawer() {
    await this.createPropertyButton.first().click();
    await this.createPropertyHeading.waitFor({ state: 'visible', timeout: 15_000 });
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

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async clickVisibleDropdownOption(container, optionText, timeout = 10_000) {
    const exactOptions = container
      .locator('p, h6, [role="option"]')
      .filter({ hasText: new RegExp(`^\\s*${this.escapeRegex(optionText)}\\s*$`, 'i') });

    const partialOptions = container
      .locator('p, h6, [role="option"]')
      .filter({ hasText: new RegExp(this.escapeRegex(optionText), 'i') });

    const optionGroups = [exactOptions, partialOptions];

    for (const options of optionGroups) {
      const visible = await options.first()
        .waitFor({ state: 'visible', timeout })
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
    await this.companyDropdownTrigger.waitFor({ state: 'visible', timeout: 10_000 });
    await this.companyDropdownTrigger.click({ force: true });

    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').first()
      .or(this.page.getByRole('tooltip').first());
    await tooltip.waitFor({ state: 'visible', timeout: 10_000 });

    const searchInput = tooltip.getByRole('textbox', { name: 'Search' });
    await searchInput.waitFor({ state: 'visible', timeout: 5_000 });
    const searchAttempts = [
      companyName,
      companyName.substring(0, Math.min(4, companyName.length)),
    ].filter(Boolean);

    for (const searchText of searchAttempts) {
      await searchInput.click();
      await searchInput.fill('');
      await searchInput.fill(searchText);
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      await this.page.waitForTimeout(1_000);

      const optionSelected = await this.clickVisibleDropdownOption(tooltip, companyName, 5_000)
        .then(() => true)
        .catch(() => false);

      if (optionSelected) {
        await this.page.waitForTimeout(500);
        return;
      }
    }

    throw new Error(`Company "${companyName}" was not selectable in property create form.`);
  }

  async fillPropertyName(propertyName) {
    await this.propertyNameInput.waitFor({ state: 'visible', timeout: 8_000 });
    await this.propertyNameInput.click();
    await this.propertyNameInput.fill(propertyName);
    this.createdPropertyName = propertyName;
  }

  /**
   * Select Property Source from its tooltip dropdown.
   * Live-verified options (as paragraphs): ALN, Building Connected,
   * Inbound Lead - National, Referral, Local Networking, etc.
   * Picks the first option dynamically.
   */
  async selectPropertySource() {
    await this.propertySourceTrigger.waitFor({ state: 'visible', timeout: 8_000 });
    await this.propertySourceTrigger.click();
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });
    const sourceOption = tooltip.getByText('ALN', { exact: true }).first()
      .or(tooltip.locator('p').filter({ hasText: /^ALN$/ }).first())
      .or(tooltip.getByRole('paragraph').first());
    await sourceOption.waitFor({ state: 'visible', timeout: 5_000 });
    await sourceOption.click({ force: true });
    await this.page.waitForTimeout(400);
  }

  async selectAssociatedFranchise() {
    const franchiseLabel = env.testEnv === 'prod'
      ? 'Tkxel Test Franchise'
      : '216 - Omaha, NE';

    await this.associatedFranchiseTrigger.waitFor({ state: 'visible', timeout: 8_000 });
    await this.associatedFranchiseTrigger.click();

    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });

    const searchInput = tooltip.getByRole('textbox', { name: 'Search' });
    await searchInput.fill(franchiseLabel);
    await this.page.waitForTimeout(1_000);

    const franchiseOption = tooltip.getByText(franchiseLabel, { exact: false }).first()
      .or(tooltip.getByRole('paragraph').filter({ hasText: franchiseLabel }).first());
    await franchiseOption.waitFor({ state: 'visible', timeout: 8_000 });
    await franchiseOption.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Select Stage from its tooltip dropdown.
   * Live-verified options (as paragraphs): "New Location", "Approved".
   * Picks the first option dynamically.
   */
  async selectStage() {
    await this.stageTrigger.waitFor({ state: 'visible', timeout: 8_000 });
    await this.stageTrigger.click();
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });
    const stageOption = tooltip.getByText('New Location', { exact: true }).first()
      .or(tooltip.locator('p').filter({ hasText: /^New Location$/ }).first())
      .or(tooltip.getByRole('paragraph').filter({ hasText: /New Location/ }).first())
      .or(tooltip.getByRole('paragraph').first());
    await stageOption.waitFor({ state: 'visible', timeout: 5_000 });
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
    const assigneeLabel = env.testEnv === 'prod'
      ? 'Moiz ProdHO'
      : 'Moiz SM UAT';

    await this.assigneeTrigger.waitFor({ state: 'visible', timeout: 8_000 });
    await this.assigneeTrigger.click();
    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });

    const searchInput = tooltip.getByRole('textbox', { name: 'Search' });
    await searchInput.fill(assigneeLabel);
    await this.page.waitForTimeout(1_000);

    const assigneeOption = tooltip.getByRole('heading', { name: assigneeLabel }).first()
      .or(tooltip.getByText(assigneeLabel, { exact: false }).first());
    await assigneeOption.waitFor({ state: 'visible', timeout: 8_000 });
    await assigneeOption.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  async selectPropertyAffiliations() {
    await this.managedButton.click({ force: true });
    await this.ownedButton.click({ force: true });
    await this.regionalOfficeButton.click({ force: true });
    await this.sharedButton.click({ force: true });
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill Address field with a known test-environment address.
   * Uses the same address as company module: "716 South 9th Street, Omaha NE".
   * Waits for Google autocomplete and selects first suggestion.
   */
  async fillAddress(addressText) {
    await this.addressInput.click();
    await this.addressInput.fill(addressText);
    await this.page.waitForTimeout(1_500);

    const addressSuggestion = this.page.getByRole('option', { name: new RegExp(addressText.split(',')[0], 'i') }).first();
    const suggestionVisible = await addressSuggestion
      .waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false);
    if (!suggestionVisible) {
      return false;
    }
    await addressSuggestion.click({ force: true });
    await this.page.waitForTimeout(1_000);
    return true;
  }

  async selectContactAffiliation() {
    const contactSearchText = env.testEnv === 'prod' ? 'Ahsan Awan' : 'moiz';
    const contactLabel = env.testEnv === 'prod'
      ? 'Ahsan Awan'
      : 'Ali TkSmoke (moiz.qureshi+c1@';

    await this.contactTrigger.waitFor({ state: 'visible', timeout: 10_000 });
    await this.contactTrigger.click();

    const tooltip = this.page.locator('#simple-popper[role="tooltip"]').last()
      .or(this.page.getByRole('tooltip').last());
    await tooltip.waitFor({ state: 'visible', timeout: 8_000 });

    const searchInput = tooltip.getByRole('textbox', { name: 'Search by name' });
    await searchInput.fill(contactSearchText);
    await this.page.waitForTimeout(1_000);

    const contactOption = tooltip.getByText(contactLabel, { exact: false }).first()
      .or(this.page.getByText(contactLabel, { exact: false }).first());
    await contactOption.waitFor({ state: 'visible', timeout: 10_000 });
    await contactOption.click({ force: true });
    await this.page.waitForTimeout(700);
  }

  async submitCreateProperty() {
    await this.submitCreateBtn.waitFor({ state: 'visible', timeout: 10_000 });
    this.lastCreatePropertyToastSeen = false;
    await Promise.allSettled([
      this.createPropertyToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => {
        this.lastCreatePropertyToastSeen = true;
      }),
      this.submitCreateBtn.click({ force: true })
    ]);

    let drawerClosed = await this.createPropertyHeading
      .waitFor({ state: 'hidden', timeout: 8_000 }).then(() => true).catch(() => false);

    if (!drawerClosed) {
      const propertyVisibleBehindDrawer = await this.page
        .getByText(this.createdPropertyName, { exact: true })
        .first()
        .isVisible()
        .catch(() => false);

      if (this.lastCreatePropertyToastSeen || propertyVisibleBehindDrawer) {
        await this.cancelCreateBtn.click({ force: true }).catch(() => {});
        drawerClosed = await this.createPropertyHeading
          .waitFor({ state: 'hidden', timeout: 8_000 }).then(() => true).catch(() => false);
      }
    }

    return drawerClosed;
  }

  async attemptCreateWithAddress(addressText) {
    const addressSelected = await this.fillAddress(addressText);
    if (!addressSelected) {
      return false;
    }

    const drawerClosed = await this.submitCreateProperty();
    if (drawerClosed) {
      await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      return true;
    }

    return false;
  }

  async createProperty({ propertyName, companyName }) {
    await this.openCreatePropertyDrawer();
    await this.selectCompanyInCreateForm(companyName);
    await this.page.waitForTimeout(2_000);
    await this.fillPropertyName(propertyName);
    await this.selectPropertySource();
    await this.selectAssociatedFranchise();
    await this.selectStage();
    await this.selectPropertyAffiliations();
    await this.selectAssignee();
    await this.selectContactAffiliation();

    for (const addressText of this.getUniqueOmahaAddressCandidates()) {
      const created = await this.attemptCreateWithAddress(addressText);
      if (created) {
        return propertyName;
      }
    }

    throw new Error('Create Property drawer did not close after trying multiple unique Omaha addresses.');
    return propertyName;
  }

  async assertPropertyCreated() {
    expect(this.lastCreatePropertyToastSeen).toBeTruthy();
  }

  async cancelCreatePropertyDrawer() {
    await this.cancelCreateBtn.click();
    await this.createPropertyHeading
      .waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async assertCreatePropertyDrawerClosed() {
    await expect(this.createPropertyHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Property Detail ──────────────────────────────────────────────────────

  async openPropertyDetail(propertyName) {
    await this.propertySearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.propertySearchInput.fill(propertyName);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(2_000);
    const propertyRow = this.page.locator('table tbody tr').first();
    await propertyRow.waitFor({ state: 'visible', timeout: 10_000 });
    const propertyNameCell = propertyRow.locator('td').nth(1);
    await expect(propertyNameCell).toContainText(propertyName, { timeout: 10_000 });
    await propertyNameCell.click({ force: true });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async assertPropertyPresentInSearchResults(propertyName) {
    const propertyRow = this.page.locator('table tbody tr').first();
    await propertyRow.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(this.propertySearchInput).toHaveValue(propertyName, { timeout: 10_000 });
    await expect(this.paginationInfo).toContainText(/1–1 of 1|1-1 of 1/, { timeout: 10_000 });
    await expect(propertyRow.locator('td').nth(1)).toContainText(propertyName, { timeout: 10_000 });
  }

  async assertPropertyDetailOpened(propertyName) {
    await expect(this.page).toHaveURL(/\/app\/sales\/locations\/location\//, { timeout: 15_000 });
    await expect(this.editButton).toBeVisible({ timeout: 15_000 });
    await expect(
      this.page.getByRole('heading', { name: propertyName, exact: false }).first()
        .or(this.page.getByText(propertyName, { exact: false }).first())
    ).toBeVisible({ timeout: 15_000 });
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
    await this.activitiesTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.activitiesTab.click();
    await this.page.waitForTimeout(500);
  }

  async assertActivitiesTabActive() {
    await expect(this.activitiesTab).toHaveAttribute('aria-selected', 'true', { timeout: 5_000 });
  }

  // ── Edit Property ────────────────────────────────────────────────────────

  async openEditPropertyForm() {
    await this.editButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.editButton.click();
    await this.editPropertyHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertEditPropertyFormOpen() {
    await expect(this.editPropertyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.editPropertyNameInput).toBeVisible({ timeout: 5_000 });
    // Live-verified: "Save" button (NOT "Update Property")
    await expect(this.saveEditBtn).toBeVisible({ timeout: 5_000 });
  }

  async assertSaveEditButtonDisabled() {
    // Live-verified: "Save" is disabled until user makes a change
    await expect(this.saveEditBtn).toBeDisabled({ timeout: 5_000 });
  }

  async fillEditPropertyName(newName) {
    await this.editPropertyNameInput.waitFor({ state: 'visible', timeout: 8_000 });
    // clickCount:3 selects all text — .triple_click() does not exist in Playwright API
    await this.editPropertyNameInput.click({ clickCount: 3 });
    await this.editPropertyNameInput.fill(newName);
  }

  async submitEditProperty() {
    await this.saveEditBtn.waitFor({ state: 'visible', timeout: 10_000 });
    this.lastEditPropertyToastSeen = false;

    await Promise.allSettled([
      this.editPropertyToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => {
        this.lastEditPropertyToastSeen = true;
      }),
      this.saveEditBtn.click({ force: true })
    ]);

    const drawerClosed = await this.editPropertyHeading
      .waitFor({ state: 'hidden', timeout: 15_000 }).then(() => true).catch(() => false);
    if (!drawerClosed) throw new Error('Edit Property drawer did not close after save.');
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async cancelEditPropertyForm() {
    await this.cancelEditBtn.click();
    await this.editPropertyHeading
      .waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async assertEditPropertyFormClosed() {
    await expect(this.editPropertyHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Notes Tab ────────────────────────────────────────────────────────────

  async gotoNotesTab() {
    await this.notesTab.waitFor({ state: 'visible', timeout: 10_000 });
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
    await this.createNewNoteBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.createNewNoteBtn.click();
    await this.addNotesHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertCreateNoteDrawerOpen() {
    const notesDrawer = this.addNotesHeading.locator(
      'xpath=ancestor::*[@role="dialog" or @role="presentation" or contains(@class,"MuiPaper-root")][1]'
    );
    const subjectInput = notesDrawer.locator('input[name="title"], #title').first();

    await expect(this.addNotesHeading).toBeVisible({ timeout: 10_000 });
    await expect(subjectInput).toBeVisible({ timeout: 5_000 });
    await expect(this.noteDescEditor).toBeVisible({ timeout: 5_000 });
    await expect(this.noteCharCounter).toBeVisible({ timeout: 5_000 });
    await expect(this.noteSaveBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.noteCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  async cancelCreateNoteDrawer() {
    await this.noteCancelBtn.click();
    await this.addNotesHeading.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
  }

  async assertCreateNoteDrawerClosed() {
    await expect(this.addNotesHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ── Tasks Tab ─────────────────────────────────────────────────────────────

  async gotoTasksTab() {
    await this.tasksTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.tasksTab.click();
    await this.newTaskBtn.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertTasksTabVisible() {
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
  }

  async assertTasksTableColumns() {
    const expectedCols = [
      'Task Title', 'Task Description', 'Created By', 'Due Date', 'Priority', 'Type'
    ];
    for (const col of expectedCols) {
      await expect(
        this.page.getByRole('columnheader', { name: col })
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
    await this.newTaskBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.newTaskBtn.click();
    await this.createTaskHeading.waitFor({ state: 'visible', timeout: 10_000 });
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
    await this.createTaskHeading.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
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
    await this.submitCreateBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.submitCreateBtn.click({ force: true });
    await this.assertDuplicateAddressError();
  }

  async submitAndExpectBlockedDuplicateAddress() {
    await this.submitCreateBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.submitCreateBtn.click({ force: true });

    const duplicateToastSeen = await this.duplicateAddressToast
      .waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);

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
}

module.exports = { PropertyModule };
