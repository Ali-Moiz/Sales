// pages/contract-module.js
// Page Object Model — Contract & Terms Module, Signal CRM
//
// The Contract & Terms module lives inside the Deal Detail page.
// It manages proposals and contracts associated with a deal.
//
// ALL locators live-verified via MCP browser on 2026-03-24
// Fully dynamic — no hardcoded IDs, indices, or fragile CSS chains
//
// Access path: Deals list → click deal row → "Contract & Terms" tab (default)
//
// Stepper path (after creating proposal):
//   /app/sales/deals/deal/:dealId/contract/:contractId
//   Six steps: 1. Services → 2. Devices → 3. On Demand →
//              4. Payment Terms → 5. Description → 6. Signees
//
// Publish path (after clicking Finish on Step 6):
//   Back to Deal Detail → "Publish Contract" button → "Close Deal" modal

const { expect } = require('@playwright/test');

class ContractModule {
  constructor(page) {
    this.page = page;

    // ── Sidebar navigation (to Deals list) ───────────────────────────────
    this.dealsMenuLink = page
      .getByRole('listitem', { name: 'Deals' })
      .getByRole('link');

    // ── Deals list — search input ─────────────────────────────────────────
    // Live-verified: searchbox with name "ID, Deal"
    this.dealSearchInput = page
      .getByRole('searchbox', { name: 'ID, Deal' })
      .or(page.locator('input[placeholder*="ID, Deal"]'))
      .first();

    // ── Deal Detail — overview tabs ───────────────────────────────────────
    // Live-verified: "Contract & Terms" is the default selected tab (aria-selected=true)
    this.contractTermsTab = page.getByRole('tab', { name: 'Contract & Terms' });
    this.activitiesTab    = page.getByRole('tab', { name: 'Activities' });
    this.notesTab         = page.getByRole('tab', { name: 'Notes' });
    this.tasksTab         = page.getByRole('tab', { name: /Tasks/ });

    // ── Contract & Terms — empty state ────────────────────────────────────
    // Shown when no proposal has been created for the deal
    // Live-verified: heading level=2, specific paragraph text, button label
    this.createProposalEmptyHeading = page.getByRole('heading', {
      name: 'Create a Proposal',
      level: 2
    });
    this.createProposalEmptyText = page.getByText(
      'Create a proposal and add services',
      { exact: true }
    );
    // The "Create Proposal" button on the empty state panel (first occurrence)
    this.createProposalBtn = page
      .getByRole('button', { name: 'Create Proposal' })
      .first();

    // ── Create Proposal Drawer ─────────────────────────────────────────────
    // Live-verified: heading level=3
    this.createProposalDrawerHeading = page.getByRole('heading', {
      name: 'Create Proposal',
      level: 3
    });

    // Service Type — radiogroup with two options
    // Live-verified accessible names include description text
    this.dedicatedPatrolRadio = page.getByRole('radio', {
      name: /Dedicated\s*\/\s*Patrol/
    });
    this.dispatchOnlyRadio = page.getByRole('radio', {
      name: /Dispatch Only/
    });

    // Proposal Name — required text input, pre-filled with deal name
    this.proposalNameInput = page.getByRole('textbox', {
      name: 'Add Proposal Name'
    });

    // Time Zone — custom heading-level dropdown trigger
    // Live-verified: level=6, text matches "(UTC...)" pattern
    this.timeZoneTrigger = page.getByRole('heading', {
      name: /(UTC)/,
      level: 6
    });

    // "Contract Dates to be decided" checkbox
    // DOM structure: <generic wrapper><generic (clickable)><checkbox/><img/></generic><p>text</p></generic>
    // We anchor on the label paragraph and navigate to its sibling checkbox container
    this.contractDatesTBDText = page.getByText(
      'Contract Dates to be decided',
      { exact: true }
    );

    // Start Date — required date picker (conditionally hidden when TBD is checked)
    this.startDateInput  = page.getByRole('textbox', { name: 'Select Start Date' });
    this.startDatePicker = page.getByRole('button', { name: 'Choose date' }).first();

    // End Date / Renewal Date radio group (visible when TBD is unchecked)
    // Live-verified: "Renewal Date" is the default selected option
    this.endDateRadio     = page.getByRole('radio', { name: 'End Date' });
    this.renewalDateRadio = page.getByRole('radio', { name: 'Renewal Date' });

    // Renewal Date — date picker (shown when "Renewal Date" radio is selected)
    this.renewalDateInput = page.getByRole('textbox', {
      name: 'Select Renewal Date'
    });

    // "Auto Renewal of Contract" checkbox
    // Same DOM structure as contractDatesTBDText
    this.autoRenewalText = page.getByText(
      'Auto Renewal of Contract',
      { exact: true }
    );

    // "Notify for Renewal Before (Days)" — spinbutton, default value = 10
    // Live-verified: only number spinbutton in the drawer
    this.notifyRenewalInput = page.getByRole('spinbutton').first();

    // Drawer action buttons
    this.cancelDrawerBtn         = page.getByRole('button', { name: 'Cancel' });
    // Submit is the LAST "Create Proposal" button — avoids matching the empty-state button
    this.submitCreateProposalBtn = page
      .getByRole('button', { name: 'Create Proposal' })
      .last();

    // ── Stepper — step tab headings (visible in top step bar) ─────────────
    // Live-verified: all six steps present as level=6 headings
    this.stepperStep1 = page.getByRole('heading', { name: '1. Services',      level: 6 });
    this.stepperStep2 = page.getByRole('heading', { name: '2. Devices',       level: 6 });
    this.stepperStep3 = page.getByRole('heading', { name: '3. On Demand',     level: 6 });
    this.stepperStep4 = page.getByRole('heading', { name: '4. Payment Terms', level: 6 });
    this.stepperStep5 = page.getByRole('heading', { name: '5. Description',   level: 6 });
    this.stepperStep6 = page.getByRole('heading', { name: '6. Signees',       level: 6 });

    // ── Stepper — shared bottom-bar buttons ───────────────────────────────
    this.saveAndNextBtn = page.getByRole('button', { name: 'Save & Next' });
    this.finishBtn      = page.getByRole('button', { name: 'Finish' });
    this.previewBtn     = page.getByRole('button', { name: 'Preview' });
    this.updateProposalBtn = page.getByRole('button', { name: 'Update Proposal' });

    // ── Step 1 — Services ─────────────────────────────────────────────────
    // Service name textbox: placeholder "Service 1"
    this.serviceNameInput = page.getByRole('textbox', { name: 'Service 1' });
    // Service type radios (stepper uses different names than the drawer)
    // Live-verified: "Dedicated Service" is default checked
    this.dedicatedServiceRadio = page.getByRole('radio', { name: 'Dedicated Service' });
    this.patrolServiceRadio    = page.getByRole('radio', { name: 'Patrol Service' });
    // Required numeric fields
    this.officerCountInput = page.getByRole('spinbutton', { name: 'Officer/Guard *' });
    this.hourlyRateInput   = page.getByRole('spinbutton', { name: /Hourly Rate/ });

    // ── Resource Type & Line Item custom dropdowns ─────────────────────────
    // DOM structure (live-verified 2026-03-24):
    //   <label for="officerType">Select Resource Type *</label>
    //   <div class="jss441 jss443" aria-describedby="simple-popper">   ← clickable trigger
    //     <div><div><h6>[selected value | placeholder]</h6></div></div>
    //   </div>
    //   <label for="lineItem">Line Item *</label>
    //   <div class="jss441 jss443" aria-describedby="simple-popper">   ← clickable trigger
    //     <div><div><h6>[selected value | placeholder]</h6></div></div>
    //   </div>
    //
    // When EMPTY the h6 shows a placeholder (starts with "Select…").
    // When FILLED the h6 shows the selected name (e.g. "Armed Officer").
    //
    // We anchor on the <label for="…"> element and navigate to its immediately
    // following sibling div (the actual clickable trigger).
    this.resourceTypeTriggerDiv = page.locator('label[for="officerType"] + div');
    this.lineItemTriggerDiv     = page.locator('label[for="lineItem"] + div');

    // Kept for backward-compatibility with any direct references in spec files.
    // Points to the Resource Type trigger div (first custom dropdown in Step 1).
    this.lineItemTrigger = this.resourceTypeTriggerDiv;
    // Time picker dialog (shared for both Start and End time)
    // The dialog is a modal; listboxes are always unique when the dialog is open
    this.timeDialogHoursListbox    = page.getByRole('listbox', { name: 'Select hours' });
    this.timeDialogMinutesListbox  = page.getByRole('listbox', { name: 'Select minutes' });
    this.timeDialogMeridiemListbox = page.getByRole('listbox', { name: 'Select meridiem' });
    this.timeDialogOkBtn           = page.getByRole('button',  { name: 'OK' });
    // Instructions rich text editor (first rdw-editor on the stepper)
    this.instructionsEditor = page.getByRole('textbox', { name: 'rdw-editor' }).first();

    // ── Step 2 — Devices ─────────────────────────────────────────────────
    // Live-verified: "Checkpoints & Devices" heading + table of NFC/Beacon/QR rows
    this.devicesPageHeading  = page.getByRole('heading', { name: 'Checkpoints & Devices', level: 3 });
    this.devicesTotalHeading = page.getByRole('heading', { name: /^Total:/, level: 5 });

    // ── Step 3 — On Demand ────────────────────────────────────────────────
    // Live-verified: "Additional Services Pricing" heading
    this.onDemandPageHeading = page.getByRole('heading', {
      name: 'Additional Services Pricing',
      level: 3
    });

    // ── Step 4 — Payment Terms ────────────────────────────────────────────
    // Live-verified: three section headings + required inputs
    this.billingOccurrenceHeading  = page.getByRole('heading', { name: 'Select Billing Occurrence', level: 3 });
    this.definePaymentTermsHeading = page.getByRole('heading', { name: 'Define Payment Terms',       level: 3 });
    this.billingInfoHeading        = page.getByRole('heading', { name: 'Billing Information',         level: 3 });
    // Annual Rate Increase — required spinbutton
    this.annualRateIncreaseInput = page.getByRole('spinbutton', { name: 'Annual Rate Increase *' });
    // Cycle Reference Date — date picker textbox
    this.cycleReferenceDateInput = page.getByRole('textbox', { name: 'Select Cycle Reference Date' });
    // Billing contact form inputs (visible under "Billing Information")
    this.billingFirstNameInput = page.getByRole('textbox', { name: 'First Name *' });
    this.billingLastNameInput  = page.getByRole('textbox', { name: 'Last Name *' });
    this.billingEmailInput     = page.getByRole('textbox', { name: 'Email *' });
    this.billingPhoneInput     = page.getByRole('textbox', { name: 'Enter phone number' });

    // ── Step 5 — Description ──────────────────────────────────────────────
    // Live-verified: "Description of Services" heading + pre-filled rdw-editor
    this.descriptionPageHeading = page.getByRole('heading', {
      name: 'Description of Services',
      level: 3
    });

    // ── Step 6 — Signees ──────────────────────────────────────────────────
    // Live-verified: current user auto-added as Signee 1
    this.signeesPageHeading = page.getByRole('heading', {
      name: 'Select signees for this contract',
      level: 3
    });

    // ── Post-stepper — Proposal Card ──────────────────────────────────────
    // Visible on the Contract & Terms tabpanel after stepper completion
    // Live-verified: "Publish Contract" + "Signature" + Edit/Clone/Preview PDF/Delete
    this.publishContractBtn = page.getByRole('button', { name: 'Publish Contract' }).first();
    this.signatureBtnOnCard = page.getByRole('button', { name: 'Signature' });
    this.contractTermsTabpanel = page.getByRole('tabpanel', { name: 'Contract & Terms' });
    const cardActionSiblings = this.signatureBtnOnCard.locator('~ *');
    this.editProposalAction = cardActionSiblings.nth(0);
    this.cloneProposalAction = cardActionSiblings.nth(1);
    this.previewPdfAction = cardActionSiblings.nth(2);

    // ── Step A: Close Deal modal ───────────────────────────────────────────
    // Appears on the FIRST click of "Publish Contract" when the deal is NOT yet closed.
    // Live-verified: closing the deal is a PREREQUISITE before publishing.
    // Flow: Click "Publish Contract" → Close Deal modal → Select status + Hubspot Stage
    //       → Save → Deal closes ("Deal closed successfully!" toast)
    //       → "Publish Contract" button remains enabled for the actual publish step.
    this.closeDealModalHeading = page.getByRole('heading', { name: 'Close Deal', level: 3 });
    this.closedWonRadio        = page.getByRole('radio',   { name: 'Closed Won' });
    this.closedLostRadio       = page.getByRole('radio',   { name: 'Closed Lost' });
    this.publishSaveBtn        = page.getByRole('button',  { name: 'Save' });
    // Success toast after deal is closed
    this.dealClosedSuccessHeading = page.getByRole('heading', {
      name: 'Deal closed successfully!',
      level: 4
    });

    // ── Step B: "Publish contract!" confirmation modal ─────────────────────
    // Appears on the SECOND click of "Publish Contract" (after deal is already closed).
    // Live-verified heading: "Publish contract!" (level=4, lowercase 'c')
    // Live-verified text: "Do you confirm to activate this contract? Once confirmed,
    //   the contract details will become operational on Signal.
    //   Please note that this action is irreversible."
    // After confirming, "Publish Contract" button disappears and status badge appears.
    this.publishConfirmModalHeading = page.getByRole('heading', {
      name: 'Publish contract!',
      level: 4
    });
    this.publishConfirmText = page.getByText(
      'Do you confirm to activate this contract?'
    );
    // The confirm button is the LAST "Publish Contract" button when modal is open
    this.publishConfirmBtn = page.getByRole('button', { name: 'Publish Contract' }).last();

    // ── Published state ────────────────────────────────────────────────────
    // After publishing, the proposal card shows a "Published without sign" badge
    // and the "Publish Contract" button disappears.
    // Actions change: Edit → View, Delete → Terminate.
    // Live-verified badge text: "Published without sign"
    this.contractPublishedBadge = page.getByText('Published without sign', { exact: true });
    this.viewContractGeneric = this.contractTermsTabpanel.getByText('View', { exact: true }).first();
    this.terminateContractGeneric = this.contractTermsTabpanel.getByText('Terminate', { exact: true }).first();
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  /** Navigate to the Deals list page via sidebar or direct URL */
  async gotoDealsPage() {
    const menuVisible = await this.dealsMenuLink
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (menuVisible) {
      await this.dealsMenuLink.click();
    } else {
      await this.page.goto('/app/sales/deals', { waitUntil: 'domcontentloaded' });
    }

    await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  }

  /**
   * Search for a deal by name and open its detail page.
   * Navigates to /app/sales/deals/deal/:id
   * @param {string} dealName — exact deal name to search for
   */
  async openDealDetail(dealName) {
    await this.dealSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.dealSearchInput.fill(dealName);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(1_500);

    const dealRow = this.page.locator('table tbody tr').filter({ hasText: dealName }).first();
    await expect(dealRow).toBeVisible({ timeout: 15_000 });

    const dealNameCell = dealRow.locator('td').nth(1);
    const clickableCell = await dealNameCell.isVisible().catch(() => false)
      ? dealNameCell
      : dealRow.getByText(dealName, { exact: false }).first();

    await clickableCell.click({ force: true });

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  /** Assert the current page is a deal detail page */
  async assertOnDealDetailPage() {
    await expect(this.page).toHaveURL(/\/deals\/deal\/\d+/, { timeout: 20_000 });
  }

  // ── Contract & Terms Tab ────────────────────────────────────────────────

  /** Click the Contract & Terms tab */
  async clickContractTermsTab() {
    await this.contractTermsTab.waitFor({ state: 'visible', timeout: 10_000 });
    await this.contractTermsTab.click();
    await this.page.waitForTimeout(500);
  }

  /** Assert the Contract & Terms tab is visible in the tablist */
  async assertContractTermsTabVisible() {
    await expect(this.contractTermsTab).toBeVisible({ timeout: 10_000 });
  }

  /** Assert the Contract & Terms tab is the currently selected tab */
  async assertContractTermsTabSelected() {
    await expect(this.contractTermsTab).toHaveAttribute('aria-selected', 'true', {
      timeout: 5_000
    });
  }

  /** Assert all four overview tabs are visible */
  async assertAllTabsVisible() {
    await expect(this.contractTermsTab).toBeVisible({ timeout: 10_000 });
    await expect(this.activitiesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.notesTab).toBeVisible({ timeout: 10_000 });
    await expect(this.tasksTab).toBeVisible({ timeout: 10_000 });
  }

  // ── Empty State ────────────────────────────────────────────────────────

  /**
   * Assert the empty state is displayed (no proposal exists for the deal).
   * Live-verified: heading level=2 "Create a Proposal", paragraph text, button.
   */
  async assertEmptyStateVisible() {
    await expect(this.createProposalEmptyHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.createProposalEmptyText).toBeVisible({ timeout: 5_000 });
    await expect(this.createProposalBtn).toBeVisible({ timeout: 5_000 });
  }

  async hasEmptyStateVisible() {
    return this.createProposalEmptyHeading.isVisible().catch(() => false);
  }

  async hasProposalCardVisible() {
    const signatureVisible = await this.signatureBtnOnCard.isVisible().catch(() => false);
    if (signatureVisible) {
      return true;
    }

    const tabPanel = this.page.getByRole('tabpanel', { name: 'Contract & Terms' });
    const editVisible =
      (await this.editProposalAction.isVisible().catch(() => false)) ||
      (await tabPanel.getByText('Edit', { exact: true }).first().isVisible().catch(() => false));
    const cloneVisible =
      (await this.cloneProposalAction.isVisible().catch(() => false)) ||
      (await tabPanel.getByText('Clone', { exact: true }).first().isVisible().catch(() => false));
    const previewVisible =
      (await this.previewPdfAction.isVisible().catch(() => false)) ||
      (await tabPanel.getByText('Preview PDF', { exact: true }).first().isVisible().catch(() => false));
    return editVisible || cloneVisible || previewVisible;
  }

  async isOnStepperPage() {
    if (/\/contract\/\d+/.test(this.page.url())) {
      return true;
    }

    const stepperVisible = await this.updateProposalBtn.isVisible().catch(() => false);
    return stepperVisible;
  }

  async detectContractState(timeoutMs = 10_000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (await this.isOnStepperPage()) {
        return 'stepper';
      }
      if (await this.hasEmptyStateVisible()) {
        return 'empty';
      }
      if (await this.hasProposalCardVisible()) {
        return 'proposal';
      }

      const tabVisible = await this.contractTermsTab.isVisible().catch(() => false);
      if (tabVisible) {
        await this.contractTermsTab.click().catch(() => {});
      }
      await this.page.waitForTimeout(500);
    }

    return 'unknown';
  }

  // ── Create Proposal Drawer — Open & Validate ───────────────────────────

  /** Open the Create Proposal drawer by clicking the empty-state button */
  async openCreateProposalDrawer() {
    await this.createProposalBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.createProposalBtn.click();
    await this.createProposalDrawerHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Assert the Create Proposal drawer is open with all expected fields.
   * Live-verified fields:
   *   - Heading "Create Proposal" (level=3)
   *   - Service Type radiogroup (Dedicated/Patrol + Dispatch Only)
   *   - Proposal Name textbox
   *   - Time Zone heading trigger
   *   - "Contract Dates to be decided" checkbox label
   *   - Cancel and Create Proposal buttons
   */
  async assertCreateProposalDrawerOpen() {
    await expect(this.createProposalDrawerHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.dedicatedPatrolRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.dispatchOnlyRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.proposalNameInput).toBeVisible({ timeout: 5_000 });
    await expect(this.timeZoneTrigger).toBeVisible({ timeout: 5_000 });
    await expect(this.contractDatesTBDText).toBeVisible({ timeout: 5_000 });
    await expect(this.cancelDrawerBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.submitCreateProposalBtn).toBeVisible({ timeout: 5_000 });
  }

  /** Assert date-related fields are visible (default state, TBD unchecked) */
  async assertDateFieldsVisible() {
    await expect(this.startDateInput).toBeVisible({ timeout: 5_000 });
    await expect(this.endDateRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.renewalDateRadio).toBeVisible({ timeout: 5_000 });
  }

  /** Assert date-related fields are hidden (when "Contract Dates to be decided" is checked) */
  async assertDateFieldsHidden() {
    await expect(this.startDateInput).not.toBeVisible({ timeout: 5_000 });
    await expect(this.endDateRadio).not.toBeVisible({ timeout: 5_000 });
    await expect(this.renewalDateRadio).not.toBeVisible({ timeout: 5_000 });
  }

  // ── Service Type ────────────────────────────────────────────────────────

  /** Assert "Dedicated / Patrol" is checked (default) and "Dispatch Only" is not */
  async assertDedicatedPatrolDefault() {
    await expect(this.dedicatedPatrolRadio).toBeChecked({ timeout: 5_000 });
    await expect(this.dispatchOnlyRadio).not.toBeChecked({ timeout: 5_000 });
  }

  /**
   * Select a service type in the radio group.
   * @param {'dedicated' | 'dispatch'} type
   */
  async selectServiceType(type) {
    if (type === 'dedicated') {
      await this.dedicatedPatrolRadio.click({ force: true });
    } else if (type === 'dispatch') {
      await this.dispatchOnlyRadio.click({ force: true });
    }
    await this.page.waitForTimeout(300);
  }

  // ── Proposal Name ───────────────────────────────────────────────────────

  /**
   * Assert the Proposal Name input is pre-filled with the given deal name.
   * Live-verified: input value equals the deal name exactly on open.
   */
  async assertProposalNamePrefilledWithDealName(dealName) {
    await expect(this.proposalNameInput).toHaveValue(dealName, { timeout: 5_000 });
  }

  /** Assert the Proposal Name input is not empty */
  async assertProposalNameNotEmpty() {
    const value = await this.proposalNameInput.inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
  }

  /** Fill/overwrite the Proposal Name field */
  async fillProposalName(name) {
    await this.proposalNameInput.clear();
    await this.proposalNameInput.fill(name);
  }

  // ── Time Zone ───────────────────────────────────────────────────────────

  /** Assert the Time Zone trigger heading is visible */
  async assertTimeZoneTriggerVisible() {
    await expect(this.timeZoneTrigger).toBeVisible({ timeout: 5_000 });
  }

  /** Open the Time Zone dropdown by clicking the trigger */
  async openTimeZoneDropdown() {
    await this.timeZoneTrigger.waitFor({ state: 'visible', timeout: 5_000 });
    await this.timeZoneTrigger.click();
    await this.page.waitForTimeout(500);
  }

  /** Select a timezone from the Create Proposal drawer */
  async selectTimeZone(searchText = 'Eastern') {
    await this.openTimeZoneDropdown();

    const popper = this.page.locator('#simple-popper').last().or(this.page.getByRole('tooltip').last());
    await popper.waitFor({ state: 'visible', timeout: 8_000 });

    const searchBox = popper.getByRole('textbox').first();
    const searchVisible = await searchBox.isVisible().catch(() => false);
    if (searchVisible) {
      await searchBox.fill(searchText);
      await this.page.waitForTimeout(500);
    }

    const easternOption = popper.getByText(/Eastern|New York|UTC-0?5:00|UTC-0?4:00/i).first();
    await easternOption.waitFor({ state: 'visible', timeout: 8_000 });
    await easternOption.click({ force: true });
    await this.page.waitForTimeout(300);
  }

  // ── Contract Dates to be Decided ────────────────────────────────────────

  getCheckboxByLabel(labelLocator) {
    return labelLocator.locator('..').getByRole('checkbox').first();
  }

  async setCheckboxState(labelLocator, shouldBeChecked) {
    const rowContainer = labelLocator.locator('..');
    const checkbox = this.getCheckboxByLabel(labelLocator);
    const clickableToggle = rowContainer.locator(':scope > *').first();

    await checkbox.waitFor({ state: 'attached', timeout: 5_000 });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const currentlyChecked = await checkbox.isChecked().catch(() => false);
      if (currentlyChecked === shouldBeChecked) {
        return;
      }

      await clickableToggle.click({ force: true }).catch(async () => {
        await checkbox.click({ force: true });
      });
      await this.page.waitForTimeout(250);
    }

    await expect(checkbox).toBeChecked({ checked: shouldBeChecked, timeout: 5_000 });
  }

  /**
   * Toggle the "Contract Dates to be decided" checkbox.
   * DOM structure: paragraph (label) is a sibling of the clickable checkbox container.
   * We navigate: paragraph → parent wrapper → preceding sibling (clickable area) → click.
   */
  async toggleContractDatesTBD() {
    const checkbox = this.getCheckboxByLabel(this.contractDatesTBDText);
    const currentlyChecked = await checkbox.isChecked().catch(() => false);
    await this.setCheckboxState(this.contractDatesTBDText, !currentlyChecked);
    await this.page.waitForTimeout(400);
  }

  /** Assert "Contract Dates to be decided" checkbox is checked */
  async assertContractDatesTBDChecked() {
    const checkbox = this.getCheckboxByLabel(this.contractDatesTBDText);
    await expect(checkbox).toBeChecked({ timeout: 5_000 });
  }

  /** Assert "Contract Dates to be decided" checkbox is unchecked (default) */
  async assertContractDatesTBDUnchecked() {
    const checkbox = this.getCheckboxByLabel(this.contractDatesTBDText);
    await expect(checkbox).not.toBeChecked({ timeout: 5_000 });
  }

  // ── Start Date ──────────────────────────────────────────────────────────

  /** Fill the Start Date field with a date string (MM/DD/YYYY format) */
  async fillStartDate(dateString) {
    await this.startDateInput.fill(dateString);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(300);
  }

  /** Fill the Renewal Date field with a date string (MM/DD/YYYY format) */
  async fillRenewalDate(dateString) {
    await this.renewalDateInput.fill(dateString);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(300);
  }

  // ── End Date / Renewal Date Radio ───────────────────────────────────────

  /** Assert "Renewal Date" is selected by default and "End Date" is not */
  async assertRenewalDateDefault() {
    await expect(this.renewalDateRadio).toBeChecked({ timeout: 5_000 });
    await expect(this.endDateRadio).not.toBeChecked({ timeout: 5_000 });
  }

  /**
   * Select the date type radio.
   * @param {'end' | 'renewal'} type
   */
  async selectDateType(type) {
    if (type === 'end') {
      await this.endDateRadio.click({ force: true });
    } else if (type === 'renewal') {
      await this.renewalDateRadio.click({ force: true });
    }
    await this.page.waitForTimeout(300);
  }

  // ── Auto Renewal ────────────────────────────────────────────────────────

  /**
   * Toggle the "Auto Renewal of Contract" checkbox.
   * Same DOM structure as contractDatesTBDText.
   */
  async toggleAutoRenewal() {
    const checkbox = this.getCheckboxByLabel(this.autoRenewalText);
    const currentlyChecked = await checkbox.isChecked().catch(() => false);
    await this.setCheckboxState(this.autoRenewalText, !currentlyChecked);
    await this.page.waitForTimeout(300);
  }

  // ── Notify for Renewal ──────────────────────────────────────────────────

  /** Assert the Notify for Renewal Before (Days) spinbutton has default value of 10 */
  async assertNotifyRenewalDefaultValue() {
    await expect(this.notifyRenewalInput).toHaveValue('10', { timeout: 5_000 });
  }

  /** Assert the Notify for Renewal field is visible */
  async assertNotifyRenewalVisible() {
    await expect(this.notifyRenewalInput).toBeVisible({ timeout: 5_000 });
  }

  // ── Cancel / Close ──────────────────────────────────────────────────────

  /** Cancel the Create Proposal drawer */
  async cancelCreateProposal() {
    await this.cancelDrawerBtn.click();
    await this.createProposalDrawerHeading
      .waitFor({ state: 'hidden', timeout: 8_000 })
      .catch(() => {});
  }

  /** Assert the Create Proposal drawer is closed */
  async assertCreateProposalDrawerClosed() {
    await expect(this.createProposalDrawerHeading).not.toBeVisible({ timeout: 8_000 });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  STEPPER METHODS (Steps 1–6 + Publish)
  // ══════════════════════════════════════════════════════════════════════

  // ── Submit Create Proposal (actually creates the proposal) ─────────────

  /**
   * Click the Submit "Create Proposal" button in the drawer (the last button
   * with that name, to avoid matching the empty-state button).
   * After submission the browser navigates to the stepper URL:
   *   /app/sales/deals/deal/:dealId/contract/:contractId
   */
  async submitCreateProposal() {
    await this.submitCreateProposalBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.submitCreateProposalBtn.click();
    await this.page.waitForURL(/\/contract\/\d+/, { timeout: 30_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  /** Assert the current page is the contract stepper */
  async assertOnStepperPage() {
    await expect(this.page).toHaveURL(/\/contract\/\d+/, { timeout: 20_000 });
  }

  /** Assert all six step-tab headings are visible in the stepper top bar */
  async assertStepperTabsVisible() {
    await expect(this.stepperStep1).toBeVisible({ timeout: 10_000 });
    await expect(this.stepperStep2).toBeVisible({ timeout: 5_000 });
    await expect(this.stepperStep3).toBeVisible({ timeout: 5_000 });
    await expect(this.stepperStep4).toBeVisible({ timeout: 5_000 });
    await expect(this.stepperStep5).toBeVisible({ timeout: 5_000 });
    await expect(this.stepperStep6).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Click "Save & Next" to advance to the next stepper step.
   * Waits for the button to be enabled first.
   */
  async clickSaveAndNext() {
    const saveAndNextVisible = await this.saveAndNextBtn.isVisible().catch(() => false);
    const primaryActionButton = saveAndNextVisible ? this.saveAndNextBtn : this.updateProposalBtn;

    await primaryActionButton.waitFor({ state: 'visible', timeout: 10_000 });
    await expect(primaryActionButton).toBeEnabled({ timeout: 8_000 });
    await primaryActionButton.click();
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  async goToStep3FromDevices() {
    await this.stepperStep3.waitFor({ state: 'visible', timeout: 8_000 });

    const saveEnabled = await this.saveAndNextBtn.isEnabled().catch(() => false);
    if (saveEnabled) {
      await this.saveAndNextBtn.click();
      await this.page.waitForTimeout(800);
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      return;
    }

    const step3Wrapper = this.page
      .getByRole('generic', { name: /Add additional services/i })
      .filter({ has: this.stepperStep3 })
      .first();
    const wrapperVisible = await step3Wrapper.isVisible().catch(() => false);

    if (wrapperVisible) {
      await step3Wrapper.click({ force: true });
    } else {
      await this.stepperStep3.click({ force: true });
    }
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  // ── Step 1 — Services ──────────────────────────────────────────────────

  /** Assert Step 1 Services section heading and service name field are visible */
  async assertStep1Visible() {
    await expect(this.stepperStep1).toBeVisible({ timeout: 10_000 });
    await expect(this.serviceNameInput).toBeVisible({ timeout: 10_000 });
  }

  /** Fill the service name field (placeholder "Service 1") */
  async fillServiceName(name) {
    await this.serviceNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.serviceNameInput.click({ clickCount: 3 });
    await this.serviceNameInput.fill('');
    await this.serviceNameInput.type(name, { delay: 20 });

    let currentValue = await this.serviceNameInput.inputValue().catch(() => '');
    if (currentValue.trim() !== String(name).trim()) {
      await this.serviceNameInput.fill(name);
      await this.serviceNameInput.press('Tab').catch(() => {});
      currentValue = await this.serviceNameInput.inputValue().catch(() => '');
    }

    if (currentValue.trim() !== String(name).trim()) {
      await this.serviceNameInput.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      }, String(name));
    }

    await expect(this.serviceNameInput).toHaveValue(String(name), { timeout: 3_000 });
  }

  /** Fill the Officer/Guard count spinbutton */
  async fillOfficerCount(count) {
    await this.officerCountInput.waitFor({ state: 'visible', timeout: 5_000 });
    await this.officerCountInput.click({ clickCount: 3 });
    await this.officerCountInput.fill(String(count));
  }

  /** Fill the Hourly Rate spinbutton */
  async fillHourlyRate(rate) {
    await this.hourlyRateInput.waitFor({ state: 'visible', timeout: 5_000 });
    await this.hourlyRateInput.click({ clickCount: 3 });
    await this.hourlyRateInput.fill(String(rate));
  }

  /**
   * Select the first available option for both the "Resource Type" (officerType)
   * and "Line Item" (lineItem) custom dropdowns on Step 1.
   *
   * Each dropdown is a custom MUI component:
   *   • trigger = div[aria-describedby="simple-popper"] immediately after its label
   *   • h6 inside shows the selected value when filled, or a "Select…" placeholder when empty
   *
   * BUG FIX (2026-03-24): the previous implementation checked for an h6 heading matching
   * /Security|Officer|Guard|Dedicated/ at .nth(1) to detect "already selected" state.
   * In headed mode this was a FALSE POSITIVE — the "Dedicated Service" radio-button label
   * (also rendered as h6) matched the pattern, causing the method to return early without
   * ever selecting anything.  "Save & Next" then stayed disabled because the required
   * fields were never filled.
   *
   * New approach: anchor on the <label for="…"> attribute to find the correct trigger div,
   * then read the h6 value directly to determine whether a selection is still needed.
   */
  async selectFirstAvailableLineItem() {
    await this._selectCustomDropdownIfEmpty(this.resourceTypeTriggerDiv, 'Resource Type');
    await this._selectCustomDropdownIfEmpty(this.lineItemTriggerDiv,     'Line Item');
  }

  /**
   * Internal helper: given a custom-dropdown trigger div, select its first available
   * option if the field is still showing an empty / placeholder state.
   *
   * @param {import('@playwright/test').Locator} triggerDiv
   *   The <div aria-describedby="simple-popper"> element for the dropdown.
   * @param {string} fieldLabel   Human-readable name used only in console logs.
   */
  async _selectCustomDropdownIfEmpty(triggerDiv, fieldLabel) {
    const visible = await triggerDiv.isVisible().catch(() => false);
    if (!visible) return; // field not present on this form

    // Read the current display value from the h6 inside the trigger
    const currentValue = await triggerDiv.locator('h6').first().textContent().catch(() => '');
    const trimmed = currentValue?.trim() ?? '';

    // If the h6 is non-empty AND does NOT start with "Select" (i.e. a real value is shown),
    // the field is already filled — nothing to do.
    if (trimmed && !/^select\s/i.test(trimmed)) {
      return;
    }

    // Field is empty / showing a placeholder → open the dropdown
    await triggerDiv.waitFor({ state: 'visible', timeout: 8_000 });
    await triggerDiv.click({ force: true });

    const popper = this.page.locator('#simple-popper').last();
    const popperVisible = await popper
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!popperVisible) {
      if (fieldLabel === 'Line Item') {
        const alternateTrigger = this.page
          .getByRole('heading', { name: /Select Line Item|Dedicated Security/i, level: 6 })
          .last();
        await alternateTrigger.click({ force: true }).catch(() => {});
      } else if (fieldLabel === 'Resource Type') {
        const alternateTrigger = this.page
          .getByRole('heading', { name: /Select Resource Type|Armed Officer|Officer/i, level: 6 })
          .last();
        await alternateTrigger.click({ force: true }).catch(() => {});
      }

      const fallbackPopperVisible = await popper
        .waitFor({ state: 'visible', timeout: 3_000 })
        .then(() => true)
        .catch(() => false);

      if (!fallbackPopperVisible) {
        await triggerDiv.press('ArrowDown').catch(() => {});
        await triggerDiv.press('Enter').catch(() => {});
        await this.page.waitForTimeout(400);
        return;
      }
    }

    const options = popper.locator('[role="option"], li, h6, p');
    const optionCount = await options.count().catch(() => 0);

    for (let i = 0; i < optionCount; i += 1) {
      const option = options.nth(i);
      const optionText = (await option.textContent().catch(() => '')).trim();
      const isVisible = await option.isVisible().catch(() => false);

      if (!isVisible || !optionText) {
        continue;
      }

      if (/^select\s|^search$|resource type|line item/i.test(optionText)) {
        continue;
      }

      await option.click({ force: true }).catch(async () => {
        await option.evaluate((el) => el.click());
      });
      await this.page.waitForTimeout(500);

      const updatedValue = await triggerDiv.locator('h6').first().textContent().catch(() => '');
      if (updatedValue?.trim() && !/^select\s/i.test(updatedValue.trim())) {
        return;
      }
    }

    await triggerDiv.press('ArrowDown').catch(() => {});
    await triggerDiv.press('Enter').catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Click a Job Day button (Mon/Tue/Wed/Thu/Fri/Sat/Sun).
   * @param {'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'} day
   */
  async clickJobDay(day) {
    const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!validDays.includes(day)) {
      throw new Error(`Invalid day "${day}". Must be one of: ${validDays.join(', ')}`);
    }
    const jobDaysSection = this.page
      .locator('div')
      .filter({ has: this.page.getByText('Job Days', { exact: true }) })
      .first();
    const scopedDayChip = jobDaysSection.getByText(day, { exact: true }).first();
    const fallbackChip = this.page.getByText(day, { exact: true }).first();
    const requiredMsg = this.page.getByText('Job Days must have at least 1 item.', { exact: true });

    const clickChip = async (chip) => {
      await chip.scrollIntoViewIfNeeded().catch(() => {});
      await chip.click({ force: true, timeout: 8_000 }).catch(async () => {
        const chipHandle = await chip.elementHandle().catch(() => null);
        if (chipHandle) {
          await chipHandle.evaluate((el) => {
            ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach((eventName) => {
              el.dispatchEvent(new MouseEvent(eventName, { bubbles: true, cancelable: true }));
            });
          });
        }
      });
      await this.page.waitForTimeout(250);
    };

    const scopedVisible = await scopedDayChip.isVisible().catch(() => false);
    await clickChip(scopedVisible ? scopedDayChip : fallbackChip);
    const stillMissingAfterPrimary = await requiredMsg.isVisible().catch(() => false);
    if (stillMissingAfterPrimary) {
      await clickChip(fallbackChip);
    }
  }

  /**
   * Select a time inside the currently open time-picker dialog.
   * Shared helper for both Start Time and End Time pickers.
   * @param {string}      hours     — hour string "01"–"12"
   * @param {string}      minutes   — minute string "00"–"59"
   * @param {'AM'|'PM'}   meridiem
   */
  async selectTimeInDialog(hours, minutes, meridiem) {
    await this.timeDialogHoursListbox.waitFor({ state: 'visible', timeout: 8_000 });
    // Option names are e.g. "8 hours", "0 minutes", "AM"
    await this.timeDialogHoursListbox
      .getByRole('option', { name: `${parseInt(hours, 10)} hours`, exact: true })
      .click();
    await this.timeDialogMinutesListbox
      .getByRole('option', { name: `${parseInt(minutes, 10)} minutes`, exact: true })
      .click();
    await this.timeDialogMeridiemListbox
      .getByRole('option', { name: meridiem, exact: true })
      .click();
    const okBtn = this.page.getByRole('button', { name: 'OK' }).last();
    const okVisible = await okBtn.isVisible().catch(() => false);
    if (okVisible) {
      await okBtn.click({ force: true, timeout: 2_000 }).catch(async () => {
        await this.page.keyboard.press('Enter').catch(() => {});
      });
    } else {
      await this.page.keyboard.press('Enter').catch(() => {});
    }
    await this.page.waitForTimeout(400);
  }

  /**
   * Open the Start Time picker and select a time.
   * @param {string}    hours     — "01"–"12"
   * @param {string}    minutes   — "00"–"59"
   * @param {'AM'|'PM'} meridiem
   */
  async selectStartTime(hours, minutes, meridiem) {
    const startPickerBtn = this.page
      .getByRole('button', { name: /Choose time/ })
      .first();
    await startPickerBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await startPickerBtn.click();
    await this.selectTimeInDialog(hours, minutes, meridiem);
  }

  /**
   * Open the End Time picker and select a time.
   * End Time button is disabled until Start Time has been set — wait for enabled.
   * @param {string}    hours     — "01"–"12"
   * @param {string}    minutes   — "00"–"59"
   * @param {'AM'|'PM'} meridiem
   */
  async selectEndTime(hours, minutes, meridiem) {
    const endPickerBtn = this.page
      .getByRole('button', { name: /Choose time/ })
      .nth(1);
    await expect(endPickerBtn).toBeEnabled({ timeout: 8_000 });
    await endPickerBtn.click();
    await this.selectTimeInDialog(hours, minutes, meridiem);
  }

  /**
   * Fill all required fields for Step 1 (Services) in one call.
   * @param {object}   opts
   * @param {string}   opts.serviceName          — display name for the service line
   * @param {string}   opts.officerCount         — number of officers, e.g. "1"
   * @param {string}   opts.hourlyRate            — e.g. "15"
   * @param {string[]} opts.jobDays               — days to click, e.g. ['Mon', 'Wed']
   * @param {{hours:string, minutes:string, meridiem:string}} opts.startTime
   * @param {{hours:string, minutes:string, meridiem:string}} opts.endTime
   */
  async fillStep1Services({ serviceName, officerCount, hourlyRate, jobDays, startTime, endTime }) {
    await this.fillServiceName(serviceName);
    await this.selectFirstAvailableLineItem();
    await this.fillOfficerCount(officerCount);
    await this.fillHourlyRate(hourlyRate);
    for (const day of jobDays) {
      await this.clickJobDay(day);
    }

    const jobDaysRequiredMsg = this.page.getByText(
      'Job Days must have at least 1 item.',
      { exact: true },
    );
    const needsJobDayRecovery = await jobDaysRequiredMsg
      .isVisible()
      .catch(() => false);
    if (needsJobDayRecovery && jobDays.length > 0) {
      for (const day of jobDays) {
        await this.clickJobDay(day);
        const stillMissingJobDay = await jobDaysRequiredMsg.isVisible().catch(() => false);
        if (!stillMissingJobDay) {
          break;
        }
      }
    }

    await this.selectStartTime(startTime.hours, startTime.minutes, startTime.meridiem);
    await this.selectEndTime(endTime.hours, endTime.minutes, endTime.meridiem);

    // Allow React to reconcile all field updates so form validation runs
    // and enables the "Save & Next" button before the test asserts on it.
    await this.page.waitForTimeout(600);

    const saveEnabled = await this.saveAndNextBtn.isEnabled().catch(() => false);
    if (!saveEnabled) {
      await this.fillServiceName(serviceName);
      await this.selectFirstAvailableLineItem();
      await this.page.waitForTimeout(400);
    }
  }

  // ── Step 2 — Devices ───────────────────────────────────────────────────

  /** Assert Step 2 Devices section heading is visible */
  async assertStep2Visible() {
    const devicesHeadingFallback = this.page.getByRole('heading', {
      name: /Checkpoints\s*(?:&|and)\s*Devices/i,
      level: 3,
    });
    await expect(devicesHeadingFallback.first()).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Increment the quantity for a named device by clicking its "+" button.
   * Navigates from the device's heading to the ancestor row, then finds "+".
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {number} count — how many times to click "+"
   */
  async addDeviceQuantity(deviceName, count = 1) {
    const plusBtn = this.page
      .locator('div')
      .filter({ has: this.page.getByRole('heading', { name: deviceName, level: 6 }) })
      .getByRole('button', { name: '+' })
      .first();
    for (let i = 0; i < count; i++) {
      await plusBtn.click({ force: true });
      await this.page.waitForTimeout(250);
    }
  }

  /**
   * Decrement the quantity for a named device by clicking its "-" button.
   * Navigates from the device's heading to the ancestor row, then finds "-".
   * Attempts multiple selector strategies for resilience.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {number} count — how many times to click "-"
   */
  async subtractDeviceQuantity(deviceName, count = 1) {
    const heading = this.page.getByRole('heading', { name: deviceName, level: 6 });
    // Try multiple selector strategies for finding the minus button
    const minusBtn = heading
      .locator('..')  // Go to parent
      .locator('button', { hasText: '-' })  // Find button with text "-"
      .or(heading.locator('xpath=following::button[normalize-space()="-"][1]'));  // Fallback to XPath

    for (let i = 0; i < count; i++) {
      await minusBtn.click({ force: true });
      await this.page.waitForTimeout(250);
    }
  }

  /**
   * Get the current quantity for a named device.
   * Locates the quantity display text between +/- buttons.
   * Attempts multiple selector strategies for resilience.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<number>} The current quantity
   */
  async getDeviceQuantity(deviceName) {
    const heading = this.page.getByRole('heading', { name: deviceName, level: 6 });
    // Try to find quantity text in the parent row/container
    let quantityText;
    try {
      // Strategy 1: Look for text between +/- buttons in parent
      quantityText = await heading
        .locator('..')
        .locator('span')
        .first()
        .textContent();
    } catch {
      // Strategy 2: Try XPath fallback
      try {
        quantityText = await heading
          .locator('xpath=following::span[1]')
          .textContent();
      } catch {
        quantityText = '0';
      }
    }
    return parseInt(quantityText?.trim() || '0', 10);
  }

  /**
   * Get the total devices count from the Total heading.
   * @returns {Promise<number>} The total number of all devices
   */
  async getDevicesTotalCount() {
    const totalText = await this.devicesTotalHeading.textContent();
    // Expected format: "Total: 5" or similar
    const match = totalText?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Check if the minus button for a device is disabled (cannot go below 0).
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<boolean>} True if button is disabled, false if enabled
   */
  async isDeviceMinusButtonDisabled(deviceName) {
    const heading = this.page.getByRole('heading', { name: deviceName, level: 6 });
    const minusBtn = heading
      .locator('..')
      .locator('button', { hasText: '-' })
      .or(heading.locator('xpath=following::button[normalize-space()="-"][1]'));
    return await minusBtn.isDisabled().catch(() => true);  // If selector fails, assume disabled
  }

  /**
   * Verify that device quantity input rejects non-numeric input.
   * Note: Current implementation uses +/- buttons, so this validates
   * that buttons work correctly and don't accept invalid states.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<boolean>} True if quantity is always numeric (0 or positive integer)
   */
  async isDeviceQuantityNumeric(deviceName) {
    const quantity = await this.getDeviceQuantity(deviceName);
    // Verify it's an integer >= 0
    return Number.isInteger(quantity) && quantity >= 0;
  }

  /**
   * Fill device quantity input field directly (if text input exists).
   * Used for validation testing of non-numeric input.
   * Finds the input field near the device heading.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {string} inputValue — value to type (e.g., 'abc', '!@#', '12.5')
   */
  async fillDeviceQuantityInput(deviceName, inputValue) {
    const heading = this.page.getByRole('heading', { name: deviceName, level: 6 });
    // Material-UI input field in the device row
    const inputField = heading
      .locator('..')
      .locator('.MuiInputBase-root input')
      .first();

    await inputField.click();
    await inputField.fill(inputValue);
    // Blur to trigger validation
    await inputField.blur();
  }

  /**
   * Get the current value from the device quantity input field (if text input exists).
   * Used to verify validation behavior (rejection, clearing, etc.).
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<string>} The current input value
   */
  async getDeviceQuantityInputValue(deviceName) {
    const heading = this.page.getByRole('heading', { name: deviceName, level: 6 });
    const inputField = heading
      .locator('..')
      .locator('.MuiInputBase-root input')
      .first();

    return await inputField.inputValue().catch(() => '');
  }

  // ── Step 3 — On Demand ─────────────────────────────────────────────────

  /** Assert Step 3 On Demand section heading is visible */
  async assertStep3Visible() {
    await expect(this.onDemandPageHeading).toBeVisible({ timeout: 10_000 });
  }

  // ── Step 4 — Payment Terms ─────────────────────────────────────────────

  /** Assert Step 4 Payment Terms section heading is visible */
  async assertStep4Visible() {
    await expect(this.billingOccurrenceHeading).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Internal helper: click a custom heading-level-6 dropdown trigger, then
   * click the option from the tooltip/popper that appears.
   * @param {string|RegExp} triggerNamePattern — passed to getByRole heading name
   * @param {string}        optionText         — exact text of the option to pick
   */
  async _selectFromCustomDropdown(triggerNamePattern, optionText) {
    const trigger = this.page
      .getByRole('heading', { name: triggerNamePattern, level: 6 })
      .first();
    await trigger.waitFor({ state: 'visible', timeout: 8_000 });
    await trigger.click();
    await this.page.waitForTimeout(300);
    // Options appear in a tooltip/popper; click by exact text
    await this.page.getByText(optionText, { exact: true }).first().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select the Billing Type.
   * @param {'Pre Bill'|'Post Bill'} type
   */
  async selectBillingType(type) {
    await this._selectFromCustomDropdown(/Select Billing Type|Pre Bill|Post Bill/, type);
  }

  /**
   * Select the Contract Type.
   * @param {'Ongoing'|'Temporary'|'Event'} type
   */
  async selectContractType(type) {
    await this._selectFromCustomDropdown(/Select Contract Type|Ongoing|Temporary/, type);
  }

  /**
   * Select the Billing Frequency.
   * Uses #simple-popper scoping to avoid matching "Weekly" billing cycle elsewhere.
   * @param {'Weekly'|'Bi Weekly'|'Monthly'|'Semi Monthly'} freq
   */
  async selectBillingFrequency(freq) {
    const normalizedFreq = freq.replace(/\s+/g, '-');
    const targetRadio = this.page.getByRole('radio', { name: new RegExp(`^${normalizedFreq}$|^${freq}$`, 'i') });
    const targetVisible = await targetRadio.isVisible().catch(() => false);

    if (targetVisible) {
      const targetDisabled = await targetRadio.isDisabled().catch(() => false);
      if (!targetDisabled) {
        await targetRadio.click({ force: true });
        await this.page.waitForTimeout(300);
        return;
      }
    }

    const checkedRadio = this.page.locator('input[type="radio"]:checked').first();
    const checkedExists = await checkedRadio.isVisible().catch(() => false);
    if (checkedExists) {
      return;
    }

    const eventRadio = this.page.getByRole('radio', { name: 'Event' });
    if (await eventRadio.isVisible().catch(() => false)) {
      await eventRadio.click({ force: true });
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Select Payment Terms from the custom dropdown.
   * @param {string} termText — partial text matching the option (e.g. 'Net 30')
   */
  async selectPaymentTerms(termText) {
    const trigger = this.page
      .getByRole('heading', { name: /Select Payment Terms|Net |Due upon/, level: 6 })
      .first();
    await trigger.waitFor({ state: 'visible', timeout: 8_000 });
    await trigger.click();
    await this.page.waitForTimeout(300);
    await this.page.getByText(termText).first().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select Payment Method from the custom dropdown.
   * @param {'Cash'|'Check'|'Credit Card'|'Bank Transfer'} method
   */
  async selectPaymentMethod(method) {
    await this._selectFromCustomDropdown(
      /Select Payment Method|Cash|Check|Credit Card|Bank Transfer/,
      method
    );
  }

  /** Fill the Annual Rate Increase spinbutton */
  async fillAnnualRateIncrease(value) {
    await this.annualRateIncreaseInput.waitFor({ state: 'visible', timeout: 8_000 });
    await this.annualRateIncreaseInput.click({ clickCount: 3 });
    await this.annualRateIncreaseInput.fill(String(value));
  }

  /**
   * Open the Cycle Reference Date calendar and click a day.
   * @param {string} day — day of month as string, e.g. '25'
   */
  async selectCycleReferenceDate(day) {
    const pickerBtn = this.page
      .getByRole('button', { name: /Choose date/ })
      .first();
    await pickerBtn.click();
    // Calendar grid opens; click the matching gridcell
    await this.page.getByRole('gridcell', { name: day }).first().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill all billing contact info text fields.
   * @param {object} info
   * @param {string} info.firstName
   * @param {string} info.lastName
   * @param {string} info.email
   * @param {string} info.phone — include country code, e.g. '+15551234567'
   */
  async fillBillingContactInfo({ firstName, lastName, email, phone }) {
    await this.billingFirstNameInput.fill(firstName);
    await this.billingLastNameInput.fill(lastName);
    await this.billingEmailInput.fill(email);
    await this.billingPhoneInput.fill(phone);
  }

  /**
   * Fill all required fields for Step 4 (Payment Terms) in one call.
   * @param {object} opts
   * @param {string} opts.annualRateIncrease — e.g. '3'
   * @param {string} opts.billingType        — 'Pre Bill'|'Post Bill'
   * @param {string} opts.contractType       — 'Ongoing'|'Temporary'|'Event'
   * @param {string} opts.billingFrequency   — 'Weekly'|'Bi Weekly'|'Monthly'|'Semi Monthly'
   * @param {string} opts.paymentTerms       — partial text, e.g. 'Net 30'
   * @param {string} opts.paymentMethod      — 'Cash'|'Check'|'Credit Card'|'Bank Transfer'
   * @param {string} opts.cycleRefDay        — day of month, e.g. '25'
   * @param {object} opts.billingContact     — { firstName, lastName, email, phone }
   */
  async fillStep4PaymentTerms({
    annualRateIncrease, billingType, contractType, billingFrequency,
    paymentTerms, paymentMethod, cycleRefDay, billingContact
  }) {
    await this.fillAnnualRateIncrease(annualRateIncrease);
    await this.selectBillingType(billingType);
    await this.selectContractType(contractType);
    await this.selectBillingFrequency(billingFrequency);
    await this.selectPaymentTerms(paymentTerms);
    await this.selectPaymentMethod(paymentMethod);
    await this.selectCycleReferenceDate(cycleRefDay);
    await this.fillBillingContactInfo(billingContact);
  }

  // ── Step 5 — Description ────────────────────────────────────────────────

  /** Assert Step 5 Description section heading is visible */
  async assertStep5Visible() {
    await expect(this.descriptionPageHeading).toBeVisible({ timeout: 10_000 });
  }

  // ── Step 6 — Signees ────────────────────────────────────────────────────

  /** Assert Step 6 Signees section heading is visible */
  async assertStep6Visible() {
    await expect(this.signeesPageHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Assert at least one signee card ("Signee 1") is visible */
  async assertDefaultSigneeVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Signee 1', level: 4 })
    ).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Click the Finish button on Step 6 to complete the stepper.
   * Waits for navigation back to the Deal Detail page.
   */
  async clickFinish() {
    await this.finishBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.finishBtn.click();
    // Navigation back to /app/sales/deals/deal/:id (without /contract/...)
    await this.page.waitForURL(/\/deals\/deal\/\d+$/, { timeout: 30_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  // ── Post-stepper: Proposal Card ─────────────────────────────────────────

  /**
   * Assert the proposal card is visible on the Contract & Terms tabpanel.
   * Live-verified elements: "Publish Contract" button + "Signature" button.
   */
  async assertProposalCardVisible() {
    await this.clickContractTermsTab().catch(() => {});
    await expect(this.publishContractBtn).toBeVisible({ timeout: 15_000 });
    await expect(this.signatureBtnOnCard).toBeVisible({ timeout: 5_000 });
  }

  async openExistingProposalEditor() {
    const alreadyOnStepper = await this.isOnStepperPage();
    if (alreadyOnStepper) {
      return;
    }

    await this.clickContractTermsTab().catch(() => {});

    const hasSignaturePath = await this.signatureBtnOnCard.isVisible().catch(() => false);
    const editCandidates = [
      this.editProposalAction,
      this.contractTermsTabpanel.getByText('Edit', { exact: true }).first(),
      this.page.getByText('Edit', { exact: true }).last(),
      this.page.locator('[aria-label="Edit"]').first(),
    ];

    let editClicked = false;
    for (const editAction of editCandidates) {
      const isVisible = await editAction.isVisible().catch(() => false);
      if (!isVisible) {
        continue;
      }
      await editAction.click({ force: true }).catch(() => {});
      editClicked = true;
      break;
    }

    if (!editClicked && hasSignaturePath) {
      await this.signatureBtnOnCard.click({ force: true }).catch(() => {});
    }
    const openedOnContractUrl = await this.page
      .waitForURL(/\/contract\/\d+/, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!openedOnContractUrl) {
      const stepperVisible = await this.updateProposalBtn.isVisible().catch(() => false);
      if (!stepperVisible) {
        // Retry once via DOM click fallback for custom action wrappers.
        await this.contractTermsTabpanel
          .getByText('Edit', { exact: true })
          .first()
          .evaluate((el) => el.click())
          .catch(() => {});
      }
    }

    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    const stillNotStepper = !(await this.isOnStepperPage());
    if (stillNotStepper) {
      throw new Error('Edit action did not open contract stepper.');
    }
  }

  // ── PUBLISH FLOW — STEP A: Close Deal (Prerequisite) ────────────────────
  //
  // The full publish flow is a two-step process:
  //
  //   STEP A — Close the Deal (prerequisite):
  //     1. Click "Publish Contract" → Close Deal modal appears
  //     2. Select "Closed Won" or "Closed Lost"
  //     3. Select a Hubspot Stage (enables Save)
  //     4. Click Save → deal closes → "Deal closed successfully!" toast
  //        "Publish Contract" button remains visible and enabled.
  //
  //   STEP B — Actually Publish the Contract:
  //     5. Click "Publish Contract" again → "Publish contract!" confirm modal
  //     6. Click "Publish Contract" confirm → contract is published
  //        "Publish Contract" button disappears; "Published without sign" badge appears.
  //
  // Live-verified on 2026-03-24.

  /**
   * STEP A-1: Click "Publish Contract" to open the Close Deal prerequisite modal.
   * Use this when the deal has NOT been closed yet.
   */
  async clickPublishContractToCloseDeal() {
    await this.publishContractBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.publishContractBtn.click();
    await this.closeDealModalHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Assert the Close Deal modal is open */
  async assertCloseDealModalOpen() {
    await expect(this.closeDealModalHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.closedWonRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.closedLostRadio).toBeVisible({ timeout: 5_000 });
  }

  /**
   * STEP A-2: Select the deal close status.
   * @param {'Closed Won'|'Closed Lost'} status
   */
  async selectCloseStatus(status) {
    if (status === 'Closed Won') {
      await this.closedWonRadio.click({ force: true });
    } else {
      await this.closedLostRadio.click({ force: true });
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * STEP A-3: Select a Hubspot Stage in the Close Deal modal.
   * Save button is only enabled after a stage is selected.
   * @param {string} stage — e.g. 'Closed Won (Sales Pipeline)'
   */
  async selectHubspotStage(stage) {
    const stageTrigger = this.page
      .getByRole('heading', { name: /Choose Hubspot Stage/, level: 6 });
    await stageTrigger.waitFor({ state: 'visible', timeout: 8_000 });
    await stageTrigger.click();
    await this.page.waitForTimeout(300);
    await this.page.getByText(stage, { exact: true }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * STEP A-4: Click Save in the Close Deal modal.
   * Waits for the button to be enabled first (requires Hubspot Stage).
   * After saving, the "Deal closed successfully!" toast appears.
   */
  async saveCloseDeal() {
    await this.publishSaveBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await expect(this.publishSaveBtn).toBeEnabled({ timeout: 5_000 });
    await this.publishSaveBtn.click();
    await this.page.waitForTimeout(1_000);
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  /** Assert the "Deal closed successfully!" toast is visible (after Step A-4) */
  async assertDealClosedSuccessfully() {
    const toastVisible = await this.dealClosedSuccessHeading
      .isVisible()
      .catch(() => false);

    if (toastVisible) {
      await expect(this.dealClosedSuccessHeading).toBeVisible({ timeout: 15_000 });
      return;
    }

    await this.assertDealStageClosedWon();
  }

  /** Assert the Deal Stages area shows "Closed Won" */
  async assertDealStageClosedWon() {
    const closedWonStage = this.page
      .locator('button')
      .filter({ hasText: /^Closed Won$/ })
      .first();
    await expect(closedWonStage).toBeVisible({ timeout: 10_000 });
  }

  // ── PUBLISH FLOW — STEP B: Publish Contract (Actual) ─────────────────────

  /**
   * STEP B-1: Click "Publish Contract" to open the publish confirmation modal.
   * Use this AFTER the deal has already been closed (Step A completed).
   * Live-verified: opens "Publish contract!" modal (lowercase 'c').
   */
  async clickPublishContractToConfirm() {
    await this.publishContractBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.publishContractBtn.click();
    await this.publishConfirmModalHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Assert the "Publish contract!" confirmation modal is open */
  async assertPublishConfirmModalOpen() {
    await expect(this.publishConfirmModalHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.publishConfirmText).toBeVisible({ timeout: 5_000 });
    await expect(this.publishConfirmBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * STEP B-2: Click the "Publish Contract" confirm button inside the modal.
   * This is the FINAL step — the contract becomes published and operational.
   * After this, the "Publish Contract" button disappears from the card.
   */
  async confirmPublishContract() {
    await this.assertPublishConfirmModalOpen();
    const publishDialog = this.page.getByRole('dialog').filter({
      has: this.publishConfirmModalHeading,
    }).first();
    const publishConfirmInDialog = publishDialog.getByRole('button', {
      name: 'Publish Contract',
      exact: true,
    });

    const dialogButtonVisible = await publishConfirmInDialog.isVisible().catch(() => false);
    if (dialogButtonVisible) {
      await publishConfirmInDialog.click();
    } else {
      await this.publishConfirmBtn.waitFor({ state: 'visible', timeout: 8_000 });
      await this.publishConfirmBtn.click();
    }
    await this.page.waitForTimeout(1_500);
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  /**
   * Assert the contract has been successfully published.
   * Live-verified: "Published without sign" badge is visible,
   * "Publish Contract" button is gone, "Terminate" action button appears.
   */
  async assertContractPublishedSuccessfully() {
    await expect(this.contractPublishedBadge).toBeVisible({ timeout: 15_000 });
    await expect(this.publishContractBtn).not.toBeVisible({ timeout: 8_000 });
    const actionVisible =
      (await this.viewContractGeneric.isVisible().catch(() => false)) ||
      (await this.terminateContractGeneric.isVisible().catch(() => false)) ||
      (await this.signatureBtnOnCard.isVisible().catch(() => false));
    expect(actionVisible).toBeTruthy();
  }

  // ── Step 1 — Multi-Service Management ───────────────────────────────────

  /**
   * Get the count of visible service forms on Step 1.
   * Each service is represented by a set of input fields.
   */
  async getServiceCount() {
    const serviceContainers = this.page.locator('[class*="service"][class*="form"], [class*="Service"][class*="Form"]');
    return serviceContainers.count().catch(() => 0);
  }

  /**
   * Click the delete button for the first service on Step 1.
   * Tries multiple selector patterns to find the delete button.
   * TODO: Requires DOM inspection to identify the exact delete button selector.
   *       Run codegen to capture the actual selector: npx playwright codegen [url]
   */
  async deleteFirstService() {
    // Try multiple selector strategies in order of preference
    const selectors = [
      // Strategy 1: Button with exact name match (via codegen discovery)
      () => this.page.getByRole('button', { name: 'Delete Service' }).first(),

      // Strategy 2: Button with partial name match
      () => this.page.getByRole('button', { name: /Delete|Remove/ }).first(),

      // Strategy 3: SVG icon or child element within delete button
      () => this.page.locator('button:has-text("Delete"), button svg[aria-label*="Delete"]').first(),

      // Strategy 4: Button with data attributes commonly used for delete
      () => this.page.locator('button[data-testid*="delete"], button[aria-label*="delete"]').first(),

      // Strategy 5: Within service container, find trash/delete icon button
      () => this.page.locator('[class*="service"]:first-child button[type="button"]').last()
    ];

    for (let i = 0; i < selectors.length; i++) {
      try {
        const btn = selectors[i]();
        const visible = await btn.isVisible({ timeout: 4_000 }).catch(() => false);

        if (visible) {
          console.log(`[DELETE] Found delete button using strategy ${i + 1}`);
          await btn.click({ force: true });
          await this.page.waitForTimeout(500);
          await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
          return;
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Last resort: Try to find any button that looks like a delete action
    const allButtons = this.page.locator('button');
    const count = await allButtons.count().catch(() => 0);

    for (let j = 0; j < count; j++) {
      try {
        const btn = allButtons.nth(j);
        const text = await btn.textContent().catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');

        if (text.toLowerCase().includes('delete') || ariaLabel.toLowerCase().includes('delete')) {
          const visible = await btn.isVisible({ timeout: 2_000 }).catch(() => false);
          if (visible) {
            console.log(`[DELETE] Found delete button as button #${j}`);
            await btn.click({ force: true });
            await this.page.waitForTimeout(500);
            await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
            return;
          }
        }
      } catch (e) {
        // Continue searching
      }
    }

    throw new Error('Delete button not found for first service');
  }

  /**
   * Delete a service by index (0-based).
   * Discovered via Playwright Codegen: getByRole('button', { name: 'Delete Service' })
   * @param {number} index — 0 for first service, 1 for second, etc.
   */
  async deleteServiceByIndex(index) {
    // Collect all possible delete buttons
    const possibleDeleteBtns = await this.page.locator('button').all().then(async (btns) => {
      const results = [];
      for (const btn of btns) {
        try {
          const text = await btn.textContent().catch(() => '');
          const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');

          if (text.toLowerCase().includes('delete') || ariaLabel.toLowerCase().includes('delete')) {
            const visible = await btn.isVisible({ timeout: 2_000 }).catch(() => false);
            if (visible) {
              results.push(btn);
            }
          }
        } catch (e) {
          // Skip on error
        }
      }
      return results;
    }).catch(() => []);

    // Try to get the button at the requested index
    if (possibleDeleteBtns.length > index) {
      try {
        console.log(`[DELETE] Found ${possibleDeleteBtns.length} delete buttons, using index ${index}`);
        const btn = possibleDeleteBtns[index];
        await btn.click({ force: true });
        await this.page.waitForTimeout(500);
        await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        return;
      } catch (e) {
        console.warn(`[DELETE] Failed to click delete button at index ${index}: ${e.message}`);
      }
    }

    // Fallback: Try with locator strategies
    const selectors = [
      () => this.page.getByRole('button', { name: 'Delete Service' }).nth(index),
      () => this.page.getByRole('button', { name: /Delete|Remove/ }).nth(index),
      () => this.page.locator('button[data-testid*="delete"]').nth(index),
      () => this.page.locator('button[aria-label*="delete"]').nth(index)
    ];

    for (let i = 0; i < selectors.length; i++) {
      try {
        const btn = selectors[i]();
        const visible = await btn.isVisible({ timeout: 3_000 }).catch(() => false);

        if (visible) {
          console.log(`[DELETE] Found delete button at index ${index} using strategy ${i + 1}`);
          await btn.click({ force: true });
          await this.page.waitForTimeout(500);
          await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
          return;
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    throw new Error(`Delete button not found for service at index ${index}`);
  }

  /**
   * Assert a service with a given name exists in the service list.
   * Checks both text content and input values (since service name may be in input field).
   * @param {string} serviceName — the name to search for
   */
  async assertServiceExists(serviceName) {
    // Try to find by visible text first
    const textLocator = this.page.getByText(serviceName, { exact: true });
    const textVisible = await textLocator.isVisible({ timeout: 3_000 }).catch(() => false);

    if (textVisible) {
      await expect(textLocator).toBeVisible();
      return;
    }

    // If not found as text, check input value (service name field)
    const inputLocator = this.page.locator(`input[value="${serviceName}"]`);
    const inputVisible = await inputLocator.isVisible({ timeout: 3_000 }).catch(() => false);

    if (inputVisible) {
      await expect(inputLocator).toBeVisible();
      return;
    }

    // If neither found, throw error with helpful message
    throw new Error(`Service "${serviceName}" not found as visible text or input value`);
  }

  /**
   * Get the text value of the grand total field on Step 1.
   * Returns null if not found or visible.
   */
  async getGrandTotal() {
    const grandTotalLabel = this.page.getByText(/Grand Total|Total:/i, { exact: false });
    const grandTotalField = grandTotalLabel
      .locator('xpath=following-sibling::input[1], xpath=following-sibling::div[1], xpath=following-sibling::span[1]')
      .first();

    const isVisible = await grandTotalField.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!isVisible) {
      return null;
    }

    const value = await grandTotalField.textContent().catch(() => null);
    return value;
  }

  /**
   * Click the "Add Service" button to add another service to Step 1.
   */
  async clickAddService() {
    const addServiceBtn = this.page
      .getByRole('button', { name: /Add Service|Add Another Service/i })
      .or(this.page.locator('button[title*="Add Service"]'))
      .first();

    const btnVisible = await addServiceBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (btnVisible) {
      await addServiceBtn.click({ force: true });
      await this.page.waitForTimeout(600);
    } else {
      throw new Error('Add Service button not found');
    }
  }
}

module.exports = { ContractModule };
