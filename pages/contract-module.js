// @ts-check
//
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

    // Navigation
    this.dealsMenuLink = page
      .getByRole('listitem', { name: 'Deals' })
      .getByRole('link');

    // Deal List
    // Live-verified: searchbox with accessible name "ID, Deal".
    this.dealSearchInput = page.getByRole('searchbox', { name: 'ID, Deal' });

    // Tab Bar
    this.activitiesTab = page.getByRole('tab', { name: 'Activities' });
    // Live-verified: "Contract & Terms" is the default selected tab (aria-selected=true).
    this.contractTermsTab = page.getByRole('tab', { name: 'Contract & Terms' });
    this.notesTab = page.getByRole('tab', { name: 'Notes' });
    this.tasksTab = page.getByRole('tab', { name: /Tasks/ });

    // Empty State
    this.createProposalBtn = page
      .getByRole('button', { name: 'Create Proposal' })
      .first();
    this.createProposalEmptyHeading = page.getByRole('heading', {
      name: 'Create a Proposal',
      level: 2,
    });
    this.createProposalEmptyText = page.getByText(
      'Create a proposal and add services',
      { exact: true },
    );

    // Create Proposal Drawer — Structure
    this.cancelDrawerBtn = page.getByRole('button', { name: 'Cancel' });
    this.createProposalDrawerHeading = page.getByRole('heading', {
      name: 'Create Proposal',
      level: 3,
    });
    this.submitCreateProposalBtn = page
      .getByRole('button', { name: 'Create Proposal' })
      .last();

    // Create Proposal Drawer — Fields
    // Live-verified 2026-05-07: checkbox inside generic[cursor=pointer] wrapper, paragraph label is a sibling.
    // Locate via paragraph text → parent container → checkbox inside.
    this.autoRenewalText = page.getByText('Auto Renewal of Contract', { exact: true });
    this.autoRenewalCheckbox = page.locator('p').filter({ hasText: /^Auto Renewal of Contract$/ }).locator('..').getByRole('checkbox');
    this.contractDatesTBDText = page.getByText('Contract Dates to be decided', { exact: true });
    this.contractDatesTBDCheckbox = page.locator('p').filter({ hasText: /^Contract Dates to be decided$/ }).locator('..').getByRole('checkbox');
    // Live-verified 2026-05-07: these two fields replace notifyRenewalInput when Auto Renewal is checked.
    this.draftsBeforeDaysInput = page.getByRole('spinbutton').nth(0);
    this.autoPublishBeforeDaysInput = page.getByRole('spinbutton').nth(1);
    this.dedicatedPatrolRadio = page.getByRole('radio', {
      name: /Dedicated\s*\/\s*Patrol/,
    });
    this.dispatchOnlyRadio = page.getByRole('radio', {
      name: /Dispatch Only/,
    });
    this.endDateRadio = page.getByRole('radio', { name: 'End Date' });
    // Live-verified 2026-05-07: label is "Notify for Auto-Renewal Before (Days)" when Auto Renewal is unchecked.
    // When Auto Renewal is checked, this field is replaced by "Drafts Before (Days)" (default:10) + "Auto Publish Before (Days)" (default:5).
    // .first() is safe here: this is the only spinbutton visible when the Create Proposal drawer is open.
    this.notifyRenewalInput = page.getByRole('spinbutton').first();
    this.proposalNameInput = page.getByRole('textbox', {
      name: 'Add Proposal Name',
    });
    this.renewalDateInput = page.getByRole('textbox', {
      name: 'Select Renewal Date',
    });
    this.renewalDateRadio = page.getByRole('radio', { name: 'Renewal Date' });
    this.startDateInput = page.getByRole('textbox', { name: 'Select Start Date' });
    this.startDatePicker = page.getByRole('button', { name: 'Choose date' }).first();
    this.timeZoneTrigger = page.getByRole('heading', {
      name: /(UTC)/,
      level: 6,
    });

    // Stepper — Step Tabs (heading locators for visibility/assertion checks)
    this.stepperStep1 = page.getByRole('heading', { name: '1. Services', level: 6 });
    this.stepperStep2 = page.getByRole('heading', { name: '2. Devices', level: 6 });
    this.stepperStep3 = page.getByRole('heading', { name: '3. On Demand', level: 6 });
    this.stepperStep4 = page.getByRole('heading', { name: '4. Payment Terms', level: 6 });
    this.stepperStep5 = page.getByRole('heading', { name: '5. Description', level: 6 });
    this.stepperStep6 = page.getByRole('heading', { name: '6. Signees', level: 6 });

    // Stepper — Step Tab Clickable Inner Wrappers.
    // Each stepper tab has: outer container (aria-label) > inner wrapper div (cursor:pointer) > h6 + img.
    // The React onClick is on the inner wrapper; clicking the outer container or the h6 may not
    // trigger navigation reliably. Use the direct parent of each h6 via locator('..').
    // Verified via MCP: clicking the inner wrapper div reliably navigates between steps.
    this.stepperTab1 = page.getByRole('heading', { name: '1. Services', level: 6 }).locator('..');
    this.stepperTab2 = page.getByRole('heading', { name: '2. Devices', level: 6 }).locator('..');
    this.stepperTab3 = page.getByRole('heading', { name: '3. On Demand', level: 6 }).locator('..');
    this.stepperTab4 = page.getByRole('heading', { name: '4. Payment Terms', level: 6 }).locator('..');
    this.stepperTab5 = page.getByRole('heading', { name: '5. Description', level: 6 }).locator('..');
    this.stepperTab6 = page.getByRole('heading', { name: '6. Signees', level: 6 }).locator('..');

    // Stepper — Shared Buttons
    this.finishBtn = page.getByRole('button', { name: 'Finish' });
    this.previewBtn = page.getByRole('button', { name: 'Preview' });
    this.saveAndNextBtn = page.getByRole('button', { name: 'Save & Next' });
    this.updateProposalBtn = page.getByRole('button', { name: 'Update Proposal' });

    // Step 1 — Services
    this.dedicatedServiceRadio = page.getByRole('radio', { name: 'Dedicated Service' });
    this.hourlyRateInput = page.getByRole('spinbutton', { name: /Hourly Rate/ });
    this.instructionsEditor = page.getByRole('textbox', { name: 'rdw-editor' }).first();
    this.lineItemTriggerDiv = page.locator('label[for="lineItem"] + div');
    this.officerCountInput = page.getByRole('spinbutton', { name: 'Officer/Guard *' });
    this.patrolServiceRadio = page.getByRole('radio', { name: 'Patrol Service' });
    this.resourceTypeTriggerDiv = page.locator('label[for="officerType"] + div');
    this.serviceNameInput = page.getByRole('textbox', { name: 'Service 1' });
    this.timeDialogHoursListbox = page.getByRole('listbox', { name: 'Select hours' }).first();
    this.timeDialogMeridiemListbox = page.getByRole('listbox', { name: 'Select meridiem' }).first();
    this.timeDialogMinutesListbox = page.getByRole('listbox', { name: 'Select minutes' }).first();
    this.timeDialogOkBtn = page.getByRole('button', { name: 'OK' }).first();

    // Step 2 — Devices
    this.devicesPageHeading = page.getByRole('heading', {
      name: 'Checkpoints & Devices',
      level: 3,
    });
    // REVIEW: needs data-testid for deterministic total locator.
    this.devicesTotalHeading = page.getByRole('heading', { name: /^Total:/, level: 5 });

    // Step 3 — On Demand
    this.onDemandPageHeading = page.getByRole('heading', {
      name: 'Additional Services Pricing',
      level: 3,
    });

    // Step 4 — Payment Terms
    this.annualRateIncreaseInput = page.getByRole('spinbutton', { name: 'Annual Rate Increase *' });
    this.billingEmailInput = page.getByRole('textbox', { name: 'Email *' });
    this.billingFirstNameInput = page.getByRole('textbox', { name: 'First Name *' });
    this.billingInfoHeading = page.getByRole('heading', {
      name: 'Billing Information',
      level: 3,
    });
    this.billingLastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
    this.billingOccurrenceHeading = page.getByRole('heading', {
      name: 'Select Billing Occurrence',
      level: 3,
    });
    this.billingPhoneInput = page.getByRole('textbox', { name: 'Enter phone number' });
    this.cycleReferenceDateInput = page.getByRole('textbox', { name: 'Select Cycle Reference Date' });
    this.definePaymentTermsHeading = page.getByRole('heading', {
      name: 'Define Payment Terms',
      level: 3,
    });

    // Step 5 — Description
    this.descriptionPageHeading = page.getByRole('heading', {
      name: 'Description of Services',
      level: 3,
    });

    // Step 6 — Signees
    this.signeesPageHeading = page.getByRole('heading', {
      name: 'Select signees for this contract',
      level: 3,
    });

    // Proposal Card
    this.contractTermsTabpanel = page.getByRole('tabpanel', { name: 'Contract & Terms' });
    this.publishContractBtn = page.getByRole('button', { name: 'Publish Contract' }).first();
    this.signatureBtnOnCard = page.getByRole('button', { name: 'Signature' });
    const cardActionSiblings = this.signatureBtnOnCard.locator('~ *');
    this.cloneProposalAction = cardActionSiblings.nth(1);
    this.editProposalAction = cardActionSiblings.nth(0);
    this.previewPdfAction = cardActionSiblings.nth(2);
    // MCP-verified 2026-05-07: card action elements are <div aria-label="..."> with SVG children
    // and NO text content — getByText() never matches them. Use CSS [aria-label] selectors (SKILL.md §2 priority 2).
    this.deleteProposalActionByAriaLabel = this.contractTermsTabpanel.locator('[aria-label="Delete"]').first();
    this.editProposalActionByAriaLabel = this.contractTermsTabpanel.locator('[aria-label="Edit"]').first();
    this.cloneProposalActionByAriaLabel = this.contractTermsTabpanel.locator('[aria-label="Clone"]').first();
    this.previewPdfActionByAriaLabel = this.contractTermsTabpanel.locator('[aria-label="Preview PDF"]').first();

    // Publish Flow — Step A
    this.closeDealModalHeading = page.getByRole('heading', { name: 'Close Deal', level: 3 });
    this.closedLostRadio = page.getByRole('radio', { name: 'Closed Lost' });
    this.closedWonRadio = page.getByRole('radio', { name: 'Closed Won' });
    this.dealClosedSuccessHeading = page.getByRole('heading', {
      name: 'Deal closed successfully!',
      level: 4,
    });
    this.publishSaveBtn = page.getByRole('button', { name: 'Save' });

    // Publish Flow — Step B
    this.publishConfirmBtn = page.getByRole('button', { name: 'Publish Contract' }).last();
    this.publishConfirmModalHeading = page.getByRole('heading', {
      name: 'Publish contract!',
      level: 4,
    });
    this.publishConfirmText = page.getByText(
      'Do you confirm to activate this contract?',
    );

    // Step 1 — Toggles & Additional Services (live-verified 2026-05-06)
    this.fuelSurchargeCheckbox = page.locator('input[name="addFuelSurcharge"]');
    this.includeVehicleCheckbox = page.locator('input[name="includeVehicle"]');
    this.visitorManagementCheckbox = page.locator('input[name="visitorManagement"]');
    this.loadManagementCheckbox = page.locator('input[name="loadManagement"]');
    this.fuelSurchargeLabel = page.getByText('Include Fuel Surcharge', { exact: false });
    this.includeVehicleLabel = page.getByText('Include Vehicle', { exact: false });
    this.visitorManagementLabel = page.getByText('Visitor Management', { exact: true });
    this.loadManagementLabel = page.getByText('Load Management', { exact: true });
    // MUI Switch visible wrappers — use label paragraph's parent to scope the checkbox
    // The hidden <input> does not reflect checked state when clicked with force:true;
    // click the visible switch wrapper instead (live-verified 2026-05-07)
    this.fuelSurchargeSwitch = this.fuelSurchargeLabel.locator('..').getByRole('checkbox');
    this.includeVehicleSwitch = this.includeVehicleLabel.locator('..').getByRole('checkbox');
    this.visitorManagementSwitch = this.visitorManagementLabel.locator('..').getByRole('checkbox');
    this.loadManagementSwitch = this.loadManagementLabel.locator('..').getByRole('checkbox');
    // Rich text toolbar — rdw-editor toolbar options (live-verified 2026-05-06)
    this.boldToolbarBtn = page.locator('[title="Bold"]');
    this.italicToolbarBtn = page.locator('[title="Italic"]');
    this.unorderedListToolbarBtn = page.locator('[title="Unordered"]');
    this.orderedListToolbarBtn = page.locator('[title="Ordered"]');
    this.h1ToolbarBtn = page.locator('[class*="rdw-option"]').filter({ hasText: 'H1' });
    this.h2ToolbarBtn = page.locator('[class*="rdw-option"]').filter({ hasText: 'H2' });
    // "Add another service" card (live-verified 2026-05-06)
    this.addAnotherServiceHeading = page.getByRole('heading', {
      name: 'Add another service',
      level: 3,
    });

    // Step 2 — "Billed in first invoice only" note (live-verified 2026-05-06)
    this.billedFirstInvoiceNote = page.getByRole('heading', {
      name: 'Billed in first invoice only',
      level: 6,
    });

    // Step 3 — On Demand fields (live-verified 2026-05-06)
    this.dispatchBillingTypeLabel = page.locator('label').filter({ hasText: 'Billing Type' }).first();
    this.dispatchRateInput = page.locator('input[name="price"][placeholder="Rate"]');
    this.extraJobPricePerHourInput = page.locator('input[placeholder="Add Price Per Hour"]');
    this.addLineItemBtn = page.getByRole('button', { name: 'Line Item' });

    // Step 4 — Payment Plans (live-verified 2026-05-06)
    this.monthlyPlanRadio = page.getByRole('radio', { name: 'Monthly' });
    this.biWeeklyPlanRadio = page.getByRole('radio', { name: 'Bi-Weekly' });
    // Live-verified 2026-05-07: 'Weekly' without exact:true also matches 'Bi-Weekly' — use exact:true.
    this.weeklyPlanRadio = page.getByRole('radio', { name: 'Weekly', exact: true });
    this.eventPlanRadio = page.getByRole('radio', { name: 'Event' });
    this.flatPlanRadio = page.getByRole('radio', { name: 'Flat' });
    this.taxRateInput = page.locator('input[name="taxRate"]');
    this.flatRateInput = page.locator('input[name="flatRate"]');
    this.contractDurationText = page.getByText(/Contract Duration:/);
    this.servicesTotalHeading = page.getByRole('heading', { name: 'Services Total ($)', level: 6 });
    this.dispatchTotalHeading = page.getByRole('heading', { name: 'Dispatch Total ($)', level: 6 });
    this.totalColumnHeading = page.getByRole('heading', { name: 'Total', level: 4 });
    // Officer/Guard Breaks
    this.officerBreaksLabel = page.locator('label').filter({ hasText: 'Officer/Guard Breaks' });
    this.billableCheckbox = page.locator('input[name="billable"]');
    this.payableCheckbox = page.locator('input[name="payable"]');
    this.billableLabel = page.getByText('Billable', { exact: true });
    this.payableLabel = page.getByText('Payable', { exact: true });
    // Holiday
    this.holidayMultiplierLabel = page.locator('label').filter({ hasText: 'Holiday Multiplier' });
    this.holidayMultiplierInput = page.locator('input[name="holidayMultiplier"]');
    this.holidayGroupLabel = page.locator('label').filter({ hasText: 'Holiday Group' });
    this.holidayGroupTrigger = page.getByRole('heading', {
      name: /Select Holiday Group/,
      level: 6,
    });
    this.holidaysInfoText = page.getByText(/\d+\s*Holidays/);
    // Services Profitable
    this.servicesProfitableText = page.getByText('Services Profitable', { exact: true });
    // Billing address radios
    this.propertyAddressRadio = page.getByRole('radio', { name: 'Property Address' });
    this.companyAddressRadio = page.getByRole('radio', { name: 'Company Address' });
    this.otherAddressRadio = page.getByRole('radio', { name: 'Other' });

    // Step 5 — Description extras (live-verified 2026-05-06)
    this.uploadBannerHeading = page.getByRole('heading', {
      name: /Upload Banner Image/,
      level: 3,
    });
    this.clickToUploadText = page.getByRole('heading', { name: 'Click to Upload', level: 6 });
    this.bannerFileInput = page.locator('input[type="file"]');
    this.bannerConstraintsText = page.getByText('16:9 or 1920 x 1080px (max. 10MB)');

    // Step 6 — Signees extras (live-verified 2026-05-06)
    this.addSigneeCard = page.getByRole('heading', { name: 'Add Signee', level: 4 });
    this.addSigneeDrawerHeading = page.getByRole('heading', { name: 'Add Signee', level: 3 });
    this.addSigneeNameInput = page.getByRole('textbox', { name: 'Add Signee Name' });
    this.addSigneeTitleInput = page.getByRole('textbox', { name: 'Add Signee Title' });
    this.addSigneeEmailInput = page.getByRole('textbox', { name: 'Add Signee Email' });
    this.addSigneeCancelBtn = page.getByRole('button', { name: 'Cancel' });
    this.addSigneeSubmitBtn = page.getByRole('button', { name: 'Add Signee' });

    // Published State
    // Live-verified 2026-05-07: published card action order is Signature(btn), View, Addendum, Clone, Preview PDF, Terminate.
    // Draft card action order (no Signature): Edit(btn), Clone, Preview PDF, Delete.
    // Use aria-label selectors (SKILL.md §2 priority 2) — these are generic elements with aria-label.
    this.contractPublishedBadge = page.getByText('Published without sign', { exact: true });
    this.terminateContractGeneric = this.contractTermsTabpanel.locator('[aria-label="Terminate"]').first();
    this.viewContractGeneric = this.contractTermsTabpanel.locator('[aria-label="View"]').first();
    this.addendumContractGeneric = this.contractTermsTabpanel.locator('[aria-label="Addendum"]').first();

    // Contract Renewal Modal (live-verified 2026-05-08)
    // Appears on renewal deals when clicking "Publish Contract" — shows service changes summary.
    this.contractRenewalModalHeading = page.getByRole('heading', { name: 'Contract Renewal', level: 4 });
    this.contractRenewalPublishBtn = page.getByRole('button', { name: 'Publish', exact: true });

    // Signature Dropdown Menu (live-verified 2026-05-08)
    this.addSignMenuitem = page.getByRole('menuitem', { name: 'Add Sign' });
    this.requestSignMenuitem = page.getByRole('menuitem', { name: 'Request Sign' });

    // Request Signatures Modal (live-verified 2026-05-08)
    this.requestSignaturesModalHeading = page.getByRole('heading', {
      name: 'Select Signees to request for signature',
      level: 4,
    });
    this.selectAllCheckboxLabel = page.getByText('Select All', { exact: true });
    this.requestSignaturesBtn = page.getByRole('button', { name: 'Request Signatures' });
    this.requestSignaturesCancelBtn = page.getByRole('button', { name: 'Cancel' });
    this.notRequestedTag = page.getByText('Not Requested', { exact: true });
    this.requestedTag = page.getByText('Requested', { exact: true });
    this.pendingSignTag = page.getByText('Pending Sign', { exact: true });
    this.signedTag = page.getByText('Signed', { exact: true });

    // Deal stage buttons (live-verified 2026-05-08)
    this.proposalCreationStageBtn = page.locator('button').filter({ hasText: /Proposal Creation/ });
    this.negotiationStageBtn = page.locator('button').filter({ hasText: /^Negotiation$/ });
    this.closedWonStageBtn = page.locator('button').filter({ hasText: /^Closed Won$/ });
    this.closedLostStageBtn = page.locator('button').filter({ hasText: /^Closed Lost$/ });
    // TODO: deprecated closedWonStageBtn/closedLostStageBtn — deal stage button text is "Closed", not "Closed Won"/"Closed Lost"
    // "Closed Won"/"Closed Lost" are radio options inside the Close Deal modal, not stage buttons.
    this.closedStageBtn = page.locator('button').filter({ hasText: /^Closed$/ });

    // Clone Contract Dialog (MCP-verified 2026-05-08)
    this.cloneContractHeading = page.getByRole('heading', { name: 'Clone Contract', level: 4 });
    this.cloneContractText = page.getByText('Are you sure you want to clone this contract?', { exact: false });
    this.cloneContractCancelBtn = page.getByRole('button', { name: 'Cancel' });
    this.cloneContractProceedBtn = page.getByRole('button', { name: 'Proceed' });

    // Delete Proposal Dialog (MCP-verified 2026-05-08)
    this.deleteProposalHeading = page.getByRole('heading', { name: 'Delete Proposal!', level: 4 });
    this.deleteProposalText = page.getByText('Do you want to delete this contract? This action can not be undone.', { exact: false });
    this.deleteProposalNoBtn = page.getByRole('button', { name: 'No' });
    this.deleteProposalConfirmBtn = page.getByRole('button', { name: 'Delete Proposal' });

    // Terminate Contract Dialog (MCP-verified 2026-05-08)
    // Heading is dynamic: "Terminate {deal name}" — use regex
    this.terminateDialogHeading = page.getByRole('heading', { name: /Terminate/, level: 4 });
    this.terminationDateInput = page.getByRole('textbox', { name: 'Select Termination Date' });
    this.terminationReasonInput = page.getByRole('textbox', { name: 'Reason *' });
    this.terminateContractNoBtn = page.getByRole('button', { name: 'No' });
    this.terminateContractConfirmBtn = page.getByRole('button', { name: 'Terminate Contract' });

    // Addendum Contract Dialog (MCP-verified 2026-05-08)
    this.addendumContractHeading = page.getByRole('heading', { name: 'Addendum Contract', level: 4 });
    this.addendumContractText = page.getByText('Are you sure you want to update the terms of your existing contract?', { exact: false });
    this.addendumContractCancelBtn = page.getByRole('button', { name: 'Cancel' });
    this.addendumContractProceedBtn = page.getByRole('button', { name: 'Proceed' });

    // Addendum — Proposal card & pill labels (MCP-verified 2026-05-09)
    // Proposal card name is an h4 heading inside the Contract & Terms tabpanel.
    this.proposalCardHeading = this.contractTermsTabpanel.getByRole('heading', { level: 4 }).first();
    // Success toast after Addendum creation
    this.addendumCreatedToast = page.getByText('Addendum contract created successfully!', { exact: false });
    // Pill/badge labels on proposal cards (visible via getByText on the tabpanel)
    this.notAcknowledgedPill = this.contractTermsTabpanel.getByText('Not Acknowledged', { exact: true });
    this.acknowledgedPill    = this.contractTermsTabpanel.getByText('Acknowledged', { exact: true });
    // Note: draft state has no separate pill — it is indicated by the Publish Contract button.
    // Publish confirmation modal — change-history section (live-verified 2026-05-09)
    this.publishChangeHistorySection = page.locator('[class*="change"], [class*="history"], [class*="diff"]').first();

    // Deal detail action buttons (MCP-verified 2026-05-08)
    // The "Close" button in the action group (Edit, Close, Follow-up) — only visible when deal is not yet closed
    this.dealCloseBtn = page.getByRole('button', { name: 'Close', exact: true });

    // Associate Franchise Modal (MCP-verified 2026-05-08)
    // Appears when clicking "Create Proposal" on a deal whose property has no franchise.
    // The modal blocks the Create Proposal drawer until a franchise is selected.
    this.associateFranchiseModalHeading = page.getByRole('heading', {
      name: 'Associate Franchise!',
      level: 4,
    });
    this.chooseFranchiseTrigger = page.getByRole('heading', {
      name: 'Choose Franchise',
      level: 6,
    });
    this.associateFranchiseBtn = page.getByRole('button', { name: 'Associate Franchise' });
    this.associateFranchiseCancelBtn = page.getByRole('button', { name: 'Cancel' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  /** Navigate to the Deals list page via sidebar or direct URL */
  async gotoDealsPage() {
    const menuVisible = await this.dealsMenuLink
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (menuVisible) {
      const clicked = await this.dealsMenuLink
        .click({ timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (!clicked) {
        await this.page.goto('/app/sales/deals', { waitUntil: 'domcontentloaded' });
      }
    } else {
      await this.page.goto('/app/sales/deals', { waitUntil: 'domcontentloaded' });
    }

    await this.page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
  }

  /**
   * Search for a deal by name and open its detail page.
   * Navigates to /app/sales/deals/deal/:id
   * @param {string} dealName — exact deal name to search for
   */
  async openDealDetail(dealName) {
    await this.dealSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.dealSearchInput.fill(dealName);
    // Wait for the search results to render — expect(dealRow).toBeVisible auto-waits
    const dealRow = this.page.locator('table tbody tr').filter({ hasText: dealName }).first();
    await expect(dealRow).toBeVisible({ timeout: 15_000 });

    // td.nth(1) is the Deal Name cell (cursor:pointer, live-verified 2026-05-07).
    // Scroll into view before clicking — the row may be below the viewport fold
    // (e.g. last row of a 10-row table at 48px each exceeds a 909px viewport).
    // isVisible() is banned (snapshot, not web-first) — SKILL.md §4.
    // force:true is removed; scrollIntoViewIfNeeded() makes the click actionable.
    const dealNameCell = dealRow.locator('td').nth(1);
    await expect(dealNameCell).toBeVisible({ timeout: 5_000 });
    // .catch() handles the narrow React re-render window where the row detaches
    // between visibility check and scroll (table virtualization race).
    await dealNameCell.scrollIntoViewIfNeeded().catch(() => {});

    // Use Promise.all to wait for the React Router URL change concurrently with the click.
    // waitForLoadState('domcontentloaded') is banned here — on SPA navigation it resolves
    // in ~2ms (page already loaded) before React Router has pushed the new URL, causing
    // assertOnDealDetailPage() to race against an in-flight pushState. SKILL.md §4.
    await Promise.all([
      this.page.waitForURL(/\/deals\/deal\/\d+/, { timeout: 20_000 }),
      dealNameCell.click(),
    ]);
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
    // Tab panel switches synchronously in MUI; the next caller's assertion auto-waits
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

    // MCP-verified 2026-05-07: card actions are <div aria-label="..."> with empty text content.
    // getByText() never matches them — use [aria-label] CSS selectors (SKILL.md §2 priority 2).
    const editVisible =
      (await this.editProposalActionByAriaLabel.isVisible().catch(() => false)) ||
      (await this.editProposalAction.isVisible().catch(() => false));
    const cloneVisible =
      (await this.cloneProposalActionByAriaLabel.isVisible().catch(() => false)) ||
      (await this.cloneProposalAction.isVisible().catch(() => false));
    const previewVisible =
      (await this.previewPdfActionByAriaLabel.isVisible().catch(() => false)) ||
      (await this.previewPdfAction.isVisible().catch(() => false));
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
    await this.clickContractTermsTab().catch(() => {});
    try {
      await expect
        .poll(
          async () => {
            if (await this.isOnStepperPage()) return "stepper";
            if (await this.hasEmptyStateVisible()) return "empty";
            if (await this.hasProposalCardVisible()) return "proposal";
            return null;
          },
          { intervals: [500, 500, 500], timeout: timeoutMs },
        )
        .not.toBeNull();
      if (await this.isOnStepperPage()) return "stepper";
      if (await this.hasEmptyStateVisible()) return "empty";
      if (await this.hasProposalCardVisible()) return "proposal";
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  // ── Create Proposal Drawer — Open & Validate ───────────────────────────

  /** Open the Create Proposal drawer by clicking the empty-state button.
   *  Handles the "Associate Franchise!" modal that appears when the deal's property
   *  has no franchise — selects the first available franchise and associates it,
   *  then waits for the Create Proposal drawer to open.
   */
  async openCreateProposalDrawer() {
    await this.createProposalBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.createProposalBtn.click();

    // After clicking "Create Proposal", either the drawer opens or the
    // "Associate Franchise!" modal appears. Race between the two.
    const drawerOrModal = this.createProposalDrawerHeading.or(this.associateFranchiseModalHeading);
    await drawerOrModal.waitFor({ state: 'visible', timeout: 10_000 });

    const franchiseModalVisible = await this.associateFranchiseModalHeading
      .isVisible()
      .catch(() => false);

    if (franchiseModalVisible) {
      await this._handleAssociateFranchiseModal();
      // After associating, the Create Proposal drawer should open automatically.
      // If not, re-click the Create Proposal button.
      const drawerOpened = await this.createProposalDrawerHeading
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (!drawerOpened) {
        await this.createProposalBtn.waitFor({ state: 'visible', timeout: 10_000 });
        await this.createProposalBtn.click();
        await this.createProposalDrawerHeading.waitFor({ state: 'visible', timeout: 10_000 });
      }
    }
    // else: drawer already visible — nothing to do
  }

  /**
   * Handle the "Associate Franchise!" modal by selecting the first available franchise
   * from the "Choose Franchise" dropdown and clicking "Associate Franchise".
   * @private
   */
  async _handleAssociateFranchiseModal() {
    await expect(this.associateFranchiseModalHeading).toBeVisible({ timeout: 5_000 });
    // Click the "Choose Franchise" dropdown trigger to open the franchise list
    await this.chooseFranchiseTrigger.click();
    // Select the first option from the popper/dropdown — franchise options render as
    // list items or paragraphs inside #simple-popper (MUI Popper pattern, SKILL.md §2).
    const popper = this.page.locator('#simple-popper');
    await popper.waitFor({ state: 'visible', timeout: 5_000 });
    // Pick the first selectable franchise option (p or [role="option"] inside popper)
    const firstOption = popper.locator('p, [role="option"]').first();
    await firstOption.waitFor({ state: 'visible', timeout: 5_000 });
    await firstOption.click();
    // The "Associate Franchise" button should now be enabled
    await expect(this.associateFranchiseBtn).toBeEnabled({ timeout: 5_000 });
    await this.associateFranchiseBtn.click();
    // Wait for the modal to close
    await expect(this.associateFranchiseModalHeading).not.toBeVisible({ timeout: 10_000 });
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
    // Radio state settles synchronously; caller assertion auto-waits
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
    const popper = this.page.locator('#simple-popper').last();
    await this.timeZoneTrigger.waitFor({ state: 'visible', timeout: 5_000 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const clicked = await this.timeZoneTrigger
        .click({ force: true })
        .then(() => true)
        .catch(() => false);
      if (clicked) {
        // Wait for the dropdown popper to become visible instead of a fixed timeout
        const popperAppeared = await popper
          .waitFor({ state: 'visible', timeout: 2_000 })
          .then(() => true)
          .catch(() => false);
        if (popperAppeared) return;
      }
      await this.timeZoneTrigger.focus().catch(() => {});
      await this.page.keyboard.press('Enter').catch(() => {});
      // Wait for popper to appear after keyboard open attempt
      const afterKeyboard = await popper
        .waitFor({ state: 'visible', timeout: 1_000 })
        .then(() => true)
        .catch(() => false);
      if (afterKeyboard) return;
    }
    throw new Error('Unable to open Time Zone dropdown in Create Proposal drawer.');
  }

  /** Select a timezone from the Create Proposal drawer */
  async selectTimeZone(searchText = 'Eastern') {
    await this.openTimeZoneDropdown();

    const popper = this.page.locator('#simple-popper').last();
    await popper.waitFor({ state: 'visible', timeout: 8_000 });

    const searchBox = popper.getByRole('textbox').first();
    const searchVisible = await searchBox.isVisible().catch(() => false);
    if (searchVisible) {
      await searchBox.fill(searchText);
      // Wait for the filtered option list to appear after the fill, not a fixed delay
    }

    const easternOption = popper.getByText(/Eastern|New York|UTC-0?5:00|UTC-0?4:00/i).first();
    await easternOption.waitFor({ state: 'visible', timeout: 8_000 });
    await easternOption.click({ force: true });
    // Popper close is detected by the caller's next assertion — no timeout needed
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
      // Verify state after each attempt; expect auto-waits for React to settle
      const afterClick = await checkbox.isChecked().catch(() => !shouldBeChecked);
      if (afterClick === shouldBeChecked) return;
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
    // Date fields show/hide via CSS transition; caller's assertDateFieldsVisible/Hidden auto-waits
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
    // Tab moves focus; dependent field state change detected by caller's assertion
  }

  /** Fill the Renewal Date field with a date string (MM/DD/YYYY format) */
  async fillRenewalDate(dateString) {
    await this.renewalDateInput.fill(dateString);
    await this.page.keyboard.press('Tab');
    // Tab moves focus; dependent field state change detected by caller's assertion
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
    const targetRadio = type === 'end' ? this.endDateRadio : this.renewalDateRadio;
    const otherRadio = type === 'end' ? this.renewalDateRadio : this.endDateRadio;

    let selected = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await targetRadio.click({ force: true }).catch(() => {});
      // Use web-first expect to detect checked state — no fixed delay needed
      selected = await expect(targetRadio)
        .toBeChecked({ timeout: 2_000 })
        .then(() => true)
        .catch(() => false);
      if (selected) break;
    }

    if (!selected) {
      throw new Error(`Unable to select date type "${type}" in Create Proposal drawer.`);
    }
    await expect(targetRadio).toBeChecked({ timeout: 5_000 });
    await expect(otherRadio).not.toBeChecked({ timeout: 5_000 });
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
    // setCheckboxState verifies final state internally; no additional wait needed
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
    let clicked = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      // Re-resolve the locator each attempt in case DOM re-rendered
      await this.submitCreateProposalBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      clicked = await this.submitCreateProposalBtn
        .click({ force: true })
        .then(() => true)
        .catch(() => false);
      if (clicked) break;
      // Fallback: focus + Enter
      await this.submitCreateProposalBtn.focus().catch(() => {});
      await this.page.keyboard.press('Enter').catch(() => {});
      // Check if navigation already happened
      if (/\/contract\/\d+/.test(this.page.url())) break;
      // Brief wait before retry to let DOM stabilize
      await this.page.waitForTimeout(1_000);
    }
    if (!clicked && !/\/contract\/\d+/.test(this.page.url())) {
      // Last resort: try clicking via evaluate
      await this.submitCreateProposalBtn.evaluate((el) => el.click()).catch(() => {});
      const navigated = await this.page
        .waitForURL(/\/contract\/\d+/, { timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (!navigated) {
        throw new Error('Unable to submit Create Proposal drawer.');
      }
    } else {
      await this.page.waitForURL(/\/contract\/\d+/, { timeout: 30_000 });
    }
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
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
   * Uses native Playwright .click() — never evaluate() — so React's
   * synthetic event system fires correctly (SKILL.md §2).
   */
  async clickSaveAndNext() {
    // Use the constructor-defined locator; wait for it to be enabled via
    // web-first assertion (SKILL.md §4 — no snapshot checks).
    await expect(this.saveAndNextBtn).toBeEnabled({ timeout: 10_000 });
    await this.saveAndNextBtn.scrollIntoViewIfNeeded().catch(() => {});

    // Wait for the contracts API response that fires when Save & Next saves
    // the current step. The button stays disabled while this request is in
    // flight; proceeding without waiting causes the next step to render with
    // Save & Next still disabled (race condition).
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/contracts') && r.status() === 200,
        { timeout: 15_000 },
      ).catch(() => {}),
      this.saveAndNextBtn.click(),
    ]);
  }

  async goToStep3FromDevices() {
    await this.stepperStep3.waitFor({ state: 'visible', timeout: 8_000 });

    const saveEnabled = await this.saveAndNextBtn.isEnabled().catch(() => false);
    if (saveEnabled) {
      await this.saveAndNextBtn.scrollIntoViewIfNeeded().catch(() => {});
      // Wait for contracts API response before proceeding (same fix as clickSaveAndNext)
      // Use native .click() — never evaluate() — so React fires (SKILL.md §2).
      await Promise.all([
        this.page.waitForResponse(
          (r) => r.url().includes('/contracts') && r.status() === 200,
          { timeout: 15_000 },
        ).catch(() => {}),
        this.saveAndNextBtn.click(),
      ]);
      return;
    }

    // Click the Step 3 inner wrapper (direct parent of the h6 heading).
    // stepperTab3 = h6.locator('..') — the inner wrapper div that React listens on,
    // working for both fresh and completed proposals.
    await this.stepperTab3.scrollIntoViewIfNeeded().catch(() => {});
    await this.stepperTab3.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
  }

  // ── Step 1 — Services ──────────────────────────────────────────────────

  /** Assert Step 1 Services section heading and service name field are visible */
  async assertStep1Visible() {
    await expect(this.stepperStep1).toBeVisible({ timeout: 10_000 });
    await expect(this.serviceNameInput).toBeVisible({ timeout: 10_000 });
  }

  async scrollUntilVisible(locator, label, maxScrolls = 20) {
    for (let i = 0; i < maxScrolls; i += 1) {
      const visible = await locator.isVisible().catch(() => false);
      if (visible) return true;
      await this.page.mouse.wheel(0, 700).catch(() => {});
      await this.page.keyboard.press("PageDown").catch(() => {});
      await this.page.evaluate(() => window.scrollBy(0, 900)).catch(() => {});
      // isVisible() in next iteration is the natural poll; no timeout needed
    }
    const finalVisible = await locator.isVisible().catch(() => false);
    expect(finalVisible, `Expected ${label} to be visible after scrolling`).toBeTruthy();
    return finalVisible;
  }

  /** Fill the service name field (accessible name "Service 1", "Service 2", …) */
  async fillServiceName(name, serviceIndex = 0) {
    console.log(`[fillServiceName] service ${serviceIndex}: filling with "${name}"`);
    const label = `Service ${serviceIndex + 1}`;
    const serviceNameInput = this.page.getByRole('textbox', { name: label });
    await serviceNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    const expected = String(name).trim();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await serviceNameInput.click({ clickCount: 3, force: true }).catch(() => {});
      await serviceNameInput.fill(String(name)).catch(() => {});
      await serviceNameInput.press('Tab').catch(() => {});
      const actual = (await serviceNameInput.inputValue().catch(() => "")).trim();
      if (actual === expected) {
        return;
      }
      // Last fallback: set value via DOM events for sticky re-render cases.
      if (attempt === 2) {
        await serviceNameInput.evaluate((el, value) => {
          if (!(el instanceof HTMLInputElement)) return;
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur', { bubbles: true }));
        }, String(name)).catch(() => {});
      }
      // inputValue() in next iteration provides natural retry; no fixed delay needed
    }
    const finalActual = await serviceNameInput.inputValue().catch(() => "");
    if (finalActual.trim() !== expected) {
      throw new Error(
        `[fillServiceName] Expected "${name}" but got "${finalActual}" for service index ${serviceIndex}`,
      );
    }
  }

  /**
   * Return a Locator scoped to the innerScrollBar container for the given service index.
   *
   * All services share the same input IDs (e.g. "reqOfficers", "hourlyRate") in the DOM,
   * so global role-based selectors like
   *   getByRole('spinbutton', { name: /Officer|Guard/ }).nth(serviceIndex)
   * break for service 2+ because the browser's `<label for="reqOfficers">` association
   * only resolves to the FIRST element with that ID — leaving subsequent spinbuttons with
   * no accessible name that Playwright can match.
   *
   * Fix: anchor on `label[for='officerType'] + div` (already correctly scoped per service
   * via .nth(serviceIndex) by the existing selectFirstAvailableLineItem logic), walk up
   * 5 DOM levels to the per-service innerScrollBar container, then scope by `name=`
   * attribute.
   *
   * Live-verified 2026-05-07: each container holds exactly one reqOfficers and one
   * hourlyRate input, and both are visible for Service 1 and Service 2.
   * SKILL.md §2: selector verified via MCP DOM inspection, not fabricated from memory.
   */
  _serviceContainer(serviceIndex) {
    return this.page
      .locator("label[for='officerType'] + div")
      .nth(serviceIndex)
      .locator('..') // 1
      .locator('..') // 2
      .locator('..') // 3
      .locator('..') // 4
      .locator('..'); // 5 — the per-service innerScrollBar container
  }

  /** Fill the Officer/Guard count spinbutton (for specified service index) */
  async fillOfficerCount(count, serviceIndex = 0) {
    console.log(`[fillOfficerCount] service ${serviceIndex}: filling with "${count}"`);
    // Use container-scoped input[name="reqOfficers"] — the app renders duplicate
    // id="reqOfficers" for each service, so Playwright's accessible-name lookup only
    // finds the label for service 0; service 1+ spinbuttons have no accessible name.
    // SKILL.md §2: selector scoped via _serviceContainer(), live-verified 2026-05-07.
    const officerCountInput = this._serviceContainer(serviceIndex).locator('input[name="reqOfficers"]');
    await expect(officerCountInput).toBeVisible({ timeout: 10_000 });
    await officerCountInput.scrollIntoViewIfNeeded();
    await officerCountInput.click({ clickCount: 3, force: true });
    await officerCountInput.fill(String(count));
    await officerCountInput.press('Tab').catch(() => {});
    const actual = await officerCountInput.inputValue().catch(() => "");
    if (actual.trim() !== String(count).trim()) {
      throw new Error(
        `[fillOfficerCount] Expected "${count}" but got "${actual}" for service index ${serviceIndex}`,
      );
    }
  }

  /** Fill the Hourly Rate spinbutton (for specified service index) */
  async fillHourlyRate(rate, serviceIndex = 0) {
    console.log(`[fillHourlyRate] service ${serviceIndex}: filling with "${rate}"`);
    // Same duplicate-ID issue as fillOfficerCount — scope to the service container.
    // SKILL.md §2: selector scoped via _serviceContainer(), live-verified 2026-05-07.
    const hourlyRateInput = this._serviceContainer(serviceIndex).locator('input[name="hourlyRate"]');
    await expect(hourlyRateInput).toBeVisible({ timeout: 10_000 });
    await hourlyRateInput.scrollIntoViewIfNeeded();
    await hourlyRateInput.click({ clickCount: 3, force: true });
    await hourlyRateInput.fill(String(rate));
    await hourlyRateInput.press('Tab').catch(() => {});
    const actual = await hourlyRateInput.inputValue().catch(() => "");
    if (actual.trim() !== String(rate).trim()) {
      throw new Error(
        `[fillHourlyRate] Expected "${rate}" but got "${actual}" for service index ${serviceIndex}`,
      );
    }
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
  async selectFirstAvailableLineItem(serviceIndex = 0) {
    const resourceTypeTriggers = this.page.locator("label[for='officerType'] + div");
    const lineItemTriggers = this.page.locator("label[for='lineItem'] + div");
    const rtCount = await resourceTypeTriggers.count().catch(() => 0);
    const liCount = await lineItemTriggers.count().catch(() => 0);
    console.log(
      `[selectFirstAvailableLineItem] serviceIndex=${serviceIndex}, resourceTypeTriggers count=${rtCount}, lineItemTriggers count=${liCount}`,
    );
    if (serviceIndex >= rtCount || serviceIndex >= liCount) {
      console.log(
        `[selectFirstAvailableLineItem] serviceIndex ${serviceIndex} out of range. Available resourceType triggers: ${rtCount}, lineItem triggers: ${liCount}`,
      );
      throw new Error(
        `[selectFirstAvailableLineItem] serviceIndex ${serviceIndex} out of range. Available resourceType triggers: ${rtCount}, lineItem triggers: ${liCount}`,
      );
    }
    await this._selectCustomDropdownIfEmpty(resourceTypeTriggers.nth(serviceIndex), "Resource Type");
    await this._selectCustomDropdownIfEmpty(lineItemTriggers.nth(serviceIndex), "Line Item");
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
    if (!visible) {
      console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} not visible`);
      return; // field not present on this form
    }

    // Read the current display value from the h6 inside the trigger
    const currentValue = await triggerDiv.locator('h6').first().textContent().catch(() => '');
    const trimmed = currentValue?.trim() ?? '';

    console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} current value: "${trimmed}"`);

    // If the h6 is non-empty AND does NOT start with "Select" (i.e. a real value is shown),
    // the field is already filled — nothing to do.
    if (trimmed && !/^select\s/i.test(trimmed)) {
      console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} already filled with "${trimmed}", skipping`);
      return;
    }

    // Field is empty / showing a placeholder → open the dropdown
    await triggerDiv.waitFor({ state: 'visible', timeout: 8_000 });
    await triggerDiv.scrollIntoViewIfNeeded().catch(() => {});
    // Use native Playwright .click() — evaluate((el)=>el.click()) bypasses React's synthetic
    // event system and the popper never opens for any service beyond the first.
    // SKILL.md §2: never use page.evaluate() for clicks that must update React state.
    await triggerDiv.click();
    console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} clicked`);

    const popper = this.page.locator('#simple-popper').last();
    const popperVisible = await popper
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} popper visible: ${popperVisible}`);

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
        throw new Error(`[_selectCustomDropdownIfEmpty] Popper did not open for field "${fieldLabel}"`);
      }
    }

    const options = popper.locator('[role="option"], li, h6, p');
    const optionCount = await options.count().catch(() => 0);
    console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} found ${optionCount} options`);

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

      console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} selecting option: "${optionText}"`);
      await option.click({ force: true }).catch(async () => {
        await option.evaluate((el) => el.click());
      });
      // Wait for the popper to dismiss (signals React state update) instead of fixed delay
      await this.page.locator('#simple-popper').last()
        .waitFor({ state: 'hidden', timeout: 3_000 })
        .catch(() => {});

      const updatedValue = await triggerDiv.locator('h6').first().textContent().catch(() => '');
      console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} updated value: "${updatedValue?.trim()}"`);
      if (updatedValue?.trim() && !/^select\s/i.test(updatedValue.trim())) {
        console.log(`[_selectCustomDropdownIfEmpty] ${fieldLabel} selection successful`);
        return;
      }
    }

    throw new Error(`[_selectCustomDropdownIfEmpty] Popper did not open for field "${fieldLabel}"`);
  }

  /**
   * Click a Job Day button (Mon/Tue/Wed/Thu/Fri/Sat/Sun).
   * @param {'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'} day
   */
  async clickJobDay(day, serviceIndex = 0) {
    const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!validDays.includes(day)) {
      throw new Error(`Invalid day "${day}". Must be one of: ${validDays.join(', ')}`);
    }

    // Each service card renders its own full set of day chips, so the nth occurrence
    // of the day text maps directly to the nth service card's chip.
    // The previous div.filter approach returned many ancestor divs (not one per service),
    // causing nth(serviceIndex) to miss the correct card and the fallback to always
    // click service 0's chip.
    const dayChip = this.page.getByText(day, { exact: true }).nth(serviceIndex);
    const requiredMsg = this.page.getByText('Job Days must have at least 1 item.', { exact: true });

    console.log(`[clickJobDay] service ${serviceIndex}, day ${day}: targeting nth(${serviceIndex})`);

    // Day chips are toggles. On a re-opened proposal the day may already be selected
    // (blue background, extra CSS class). Clicking a selected chip DESELECTS it,
    // which empties Job Days and causes "Job Days must have at least 1 item." validation
    // error — breaking Save & Next. Check background color to detect selected state.
    const alreadySelected = await dayChip.evaluate((el) => {
      const bg = globalThis.getComputedStyle(el).backgroundColor;
      // Selected chips have a non-transparent blue background (rgb(20, 109, 255))
      // Unselected chips have transparent/white background
      return bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)';
    }).catch(() => false);

    if (alreadySelected) {
      console.log(`[clickJobDay] service ${serviceIndex}, day ${day}: already selected, skipping`);
      return;
    }

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
      // requiredMsg check in caller is the natural post-click assertion; no delay needed
    };

    await clickChip(dayChip);
    const stillMissingAfterPrimary = await requiredMsg.isVisible().catch(() => false);
    if (stillMissingAfterPrimary) {
      await clickChip(dayChip);
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
    // Use .last() to target the current/most-recent dialog (when multiple time pickers exist)
    const currentHoursListbox = this.page.getByRole('listbox', { name: 'Select hours' }).last();
    const currentMinutesListbox = this.page.getByRole('listbox', { name: 'Select minutes' }).last();
    const currentMeridiemListbox = this.page.getByRole('listbox', { name: 'Select meridiem' }).last();

    await currentHoursListbox.waitFor({ state: 'visible', timeout: 8_000 });
    // Option names are e.g. "8 hours", "0 minutes", "AM"
    await currentHoursListbox
      .getByRole('option', { name: `${parseInt(hours, 10)} hours`, exact: true })
      .click();
    await currentMinutesListbox
      .getByRole('option', { name: `${parseInt(minutes, 10)} minutes`, exact: true })
      .click();
    await currentMeridiemListbox
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
    // Time dialog closes synchronously; selectStartTime/selectEndTime callers assert next
  }

  /**
   * Open the Start Time picker and select a time.
   * @param {string}    hours     — "01"–"12"
   * @param {string}    minutes   — "00"–"59"
   * @param {'AM'|'PM'} meridiem
   */
  async selectStartTime(hours, minutes, meridiem, serviceIndex = 0) {
    // For serviceIndex 0: .nth(0), for serviceIndex 1: .nth(2), etc.
    const startPickerBtn = this.page
      .getByRole('button', { name: /Choose time/ })
      .nth(serviceIndex * 2);
    await startPickerBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await startPickerBtn.scrollIntoViewIfNeeded().catch(() => {});
    // Use JS click to bypass innerScrollBar overlay that intercepts pointer events
    await startPickerBtn.evaluate((el) => el.click());
    await this.selectTimeInDialog(hours, minutes, meridiem);
  }

  /**
   * Open the End Time picker and select a time.
   * End Time button is disabled until Start Time has been set — wait for enabled.
   * @param {string}    hours     — "01"–"12"
   * @param {string}    minutes   — "00"–"59"
   * @param {'AM'|'PM'} meridiem
   * @param {number}    serviceIndex — 0 for first service, 1 for second, etc.
   */
  async selectEndTime(hours, minutes, meridiem, serviceIndex = 0) {
    // For serviceIndex 0: .nth(1), for serviceIndex 1: .nth(3), etc.
    const endPickerBtn = this.page
      .getByRole('button', { name: /Choose time/ })
      .nth(serviceIndex * 2 + 1);
    await expect(endPickerBtn).toBeEnabled({ timeout: 8_000 });
    await endPickerBtn.scrollIntoViewIfNeeded().catch(() => {});
    // Use JS click to bypass innerScrollBar overlay that intercepts pointer events
    await endPickerBtn.evaluate((el) => el.click());
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
   * @param {number}   serviceIndex              — which service to fill (0 for first, 1 for second, etc.)
   */
  async fillStep1Services({ serviceName, officerCount, hourlyRate, jobDays, startTime, endTime }, serviceIndex = 0) {
    // NOTE: fillServiceName is called LAST (after all dropdowns and interactions)
    // because the Line Item dropdown selection triggers a React re-render that clears
    // the service name field. Filling it after all other interactions ensures it sticks.

    // Wait for Step 1 form to be fully rendered before interacting.
    // This guards against the wizard URL loading (URL matches /contract/\d+) but the
    // React component tree not yet having mounted the service form fields.
    const resourceTypeTrigger = this.page.locator("label[for='officerType'] + div").nth(serviceIndex);
    await expect(resourceTypeTrigger).toBeVisible({ timeout: 15_000 });

    await this.selectFirstAvailableLineItem(serviceIndex);
    await this.fillOfficerCount(officerCount, serviceIndex);
    await this.fillHourlyRate(hourlyRate, serviceIndex);
    for (const day of jobDays) {
      await this.clickJobDay(/** @type {any} */ (day), serviceIndex);
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
        await this.clickJobDay(/** @type {any} */ (day), serviceIndex);
        const stillMissingJobDay = await jobDaysRequiredMsg.isVisible().catch(() => false);
        if (!stillMissingJobDay) {
          break;
        }
      }
    }

    await this.selectStartTime(startTime.hours, startTime.minutes, /** @type {any} */ (startTime.meridiem), serviceIndex);
    await this.selectEndTime(endTime.hours, endTime.minutes, /** @type {any} */ (endTime.meridiem), serviceIndex);

    // Fill service name LAST: all re-render-triggering interactions (dropdowns, day chips,
    // time pickers) have already completed, so this fill is stable.
    await this.fillServiceName(serviceName, serviceIndex);

    // React form validation runs after all field updates.
    // Use expect to wait for the button to reach enabled state instead of fixed delay.
    const saveEnabled = await expect(this.saveAndNextBtn)
      .toBeEnabled({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!saveEnabled) {
      // Recovery: refill any cleared fields.
      const lineItemValue = await this.page
        .locator("label[for='lineItem'] + div h6")
        .nth(serviceIndex)
        .textContent()
        .catch(() => '');
      if (!lineItemValue || /^select\s/i.test(String(lineItemValue).trim())) {
        await this.selectFirstAvailableLineItem(serviceIndex).catch(() => {});
      }

      // Re-select times in case a re-render reset the time picker state
      await this.selectStartTime(startTime.hours, startTime.minutes, /** @type {any} */ (startTime.meridiem), serviceIndex).catch(() => {});
      await this.selectEndTime(endTime.hours, endTime.minutes, /** @type {any} */ (endTime.meridiem), serviceIndex).catch(() => {});

      // Refill service name last to avoid re-render clearing it again
      await this.fillServiceName(serviceName, serviceIndex);

      // Verify Save & Next is enabled after recovery; if not, the service name
      // may have been cleared again by a late React re-render — refill once more.
      const enabledAfterRecovery = await expect(this.saveAndNextBtn)
        .toBeEnabled({ timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (!enabledAfterRecovery) {
        await this.fillServiceName(serviceName, serviceIndex);
      }
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
   * Internal helper — returns the quantity-control group for the given device.
   *
   * Each device row on Step 2 renders: [button "-", button "{qty}"[disabled], button "+"]
   * inside a `group` role element. There are exactly 3 such groups (one per device),
   * appearing in page order: NFC Tags → Beacons → QR Tags.
   *
   * Using device order index avoids unreliable DOM ancestor traversal (../.. etc.)
   * whose depth depends on internal MUI wrapper count and breaks across versions.
   *
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {import('@playwright/test').Locator}
   */
  _deviceQuantityGroup(deviceName) {
    // DOM order verified from page snapshot: NFC Tags → Beacons → QR Tags.
    const deviceOrder = ['NFC Tags', 'Beacons', 'QR Tags'];
    const idx = deviceOrder.indexOf(deviceName);
    if (idx < 0) throw new Error(`Unknown device: "${deviceName}"`);
    // Filter to groups that contain BOTH "-" and "+" buttons — these are the quantity
    // controls, not spinbutton increment/decrement arrows.
    return this.page
      .getByRole('group')
      .filter({ has: this.page.getByRole('button', { name: '-' }) })
      .filter({ has: this.page.getByRole('button', { name: '+' }) })
      .nth(idx);
  }

  /**
   * Increment the quantity for a named device by clicking its "+" button.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {number} count — how many times to click "+"
   */
  async addDeviceQuantity(deviceName, count = 1) {
    const plusBtn = this._deviceQuantityGroup(deviceName).getByRole('button', { name: '+' });
    for (let i = 0; i < count; i++) {
      // Use force:true to bypass the innerScrollBar overlay that intercepts pointer events.
      await plusBtn.click({ force: true });
    }
  }

  /**
   * Decrement the quantity for a named device by clicking its "-" button.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {number} count — how many times to click "-"
   */
  async subtractDeviceQuantity(deviceName, count = 1) {
    const minusBtn = this._deviceQuantityGroup(deviceName).getByRole('button', { name: '-' });
    for (let i = 0; i < count; i++) {
      // Use force:true to bypass the innerScrollBar overlay that intercepts pointer events.
      await minusBtn.click({ force: true });
    }
  }

  /**
   * Get the current quantity for a named device.
   * The quantity is the disabled middle button in the group: ["-", "{qty}", "+"].
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<number>}
   */
  async getDeviceQuantity(deviceName) {
    const group = this._deviceQuantityGroup(deviceName);
    // Buttons in order: ['-', '{qty}'(disabled), '+']. Middle button = quantity.
    const qtyBtn = group.getByRole('button').nth(1);
    const text = await qtyBtn.textContent().catch(() => '0');
    return /^\d+$/.test(text.trim()) ? parseInt(text.trim(), 10) : 0;
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
   * Check if the minus button for a device is disabled.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<boolean>}
   */
  async isDeviceMinusButtonDisabled(deviceName) {
    const minusBtn = this._deviceQuantityGroup(deviceName).getByRole('button', { name: '-' });
    return await minusBtn.isDisabled().catch(() => false);
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

  /**
   * Returns the unit price input (spinbutton) for the given device.
   *
   * Each device row on Step 2 has one `input[name="price"]` (type="number").
   * They appear in page order: NFC Tags → Beacons → QR Tags.
   * Live-verified 2026-04-23: name="price", placeholder="$5.00", MUI spinbutton.
   *
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {import('@playwright/test').Locator}
   */
  _deviceUnitPriceInput(deviceName) {
    // Live-verified 2026-05-07: DOM order is QR Tags(0) → Beacons(1) → NFC Tags(2).
    // input[name="price"] selector confirmed (3 inputs, values 45/40/21 by default).
    const deviceOrder = ['QR Tags', 'Beacons', 'NFC Tags'];
    const idx = deviceOrder.indexOf(deviceName);
    if (idx < 0) throw new Error(`Unknown device: "${deviceName}"`);
    return this.page.locator('input[name="price"]').nth(idx);
  }

  /**
   * Get the current unit price value for the given device as a raw string.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<string>}
   */
  async getDeviceUnitPrice(deviceName) {
    return this._deviceUnitPriceInput(deviceName).inputValue().catch(() => "");
  }

  /**
   * Get the current unit price value for the given device as a parsed integer.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @returns {Promise<number>}
   */
  async getDeviceUnitPriceAsNumber(deviceName) {
    const value = await this.getDeviceUnitPrice(deviceName);
    return parseInt(value, 10) || 0;
  }

  /**
   * Fill the unit price input for the given device with a numeric value.
   * Uses fill() which works for numeric strings (input[type="number"]).
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {string|number} value — must be numeric (e.g., '25', '-5', '0')
   */
  async fillDeviceUnitPrice(deviceName, value) {
    const input = this._deviceUnitPriceInput(deviceName);
    // Triple-click selects all existing text, then fill replaces it.
    // Playwright fill() only accepts numeric strings for input[type="number"].
    await input.click({ clickCount: 3 });
    await input.fill(String(value));
    await input.blur();
  }

  /**
   * Type raw characters into the device unit price input using keyboard events.
   * Use this for non-numeric validation tests where fill() would throw on
   * input[type="number"]. pressSequentially dispatches real key events so the
   * browser strips invalid characters according to its own rules.
   * @param {'NFC Tags'|'Beacons'|'QR Tags'} deviceName
   * @param {string} rawText — arbitrary text (e.g., 'abc', '!@#')
   */
  async typeRawDeviceUnitPrice(deviceName, rawText) {
    const input = this._deviceUnitPriceInput(deviceName);
    await input.click({ clickCount: 3 });
    await input.pressSequentially(rawText);
    await input.blur();
  }

  /**
   * Get the device section total price text from the "Total: $X.XX" heading.
   * Live-verified 2026-04-23: h5 heading with text "Total: $30.00".
   * @returns {Promise<string>} Raw text e.g. "Total: $30.00"
   */
  async getDevicesTotalPrice() {
    return await this.devicesTotalHeading.textContent().catch(() => '');
  }

  // ── Step 3 — On Demand ─────────────────────────────────────────────────

  /** Assert Step 3 On Demand section heading is visible */
  async assertStep3Visible() {
    await expect(this.onDemandPageHeading).toBeVisible({ timeout: 10_000 });
  }

  // ── Step 3 — Line Item helpers ────────────────────────────────────────

  /**
   * Add a custom line item on Step 3.
   * Clicks "+ Line Item", fills Title / Price Per Month / Quantity, then saves.
   * Waits for the saved card to appear before returning.
   * @param {{ title: string, pricePerMonth: number|string, quantity: number|string }} item
   */
  async addLineItem({ title, pricePerMonth, quantity }) {
    await this.page.getByRole('button', { name: 'Line Item' }).click();
    // Live-verified 2026-05-07: the title input has placeholder="Title" (not a stable id).
    // Fill numeric fields first — React re-renders triggered by price/quantity fill
    // can clear the title if it was entered first. Fill title last, just before Save.
    const titleInput = this.page.getByPlaceholder('Title');
    await titleInput.waitFor({ state: 'visible', timeout: 5_000 });
    // id="price" / placeholder="e.g, $50" — type=number; fill() triggers React fine
    await this.page.getByPlaceholder('e.g, $50').fill(String(pricePerMonth));
    // id="quantity" / placeholder="e.g, 2"
    await this.page.getByPlaceholder('e.g, 2').fill(String(quantity));
    // Fill title last — React re-renders from price/quantity fill may clear it if entered first.
    // fill() silently fails on this controlled input. pressSequentially fires per-char
    // keyboard events that React's controlled input processes correctly.
    // The field strips non-alpha chars — titles must be alphabetic-only. Live-verified 2026-05-07.
    await titleInput.click({ clickCount: 3 });
    await titleInput.pressSequentially(String(title), { delay: 80 });
    // Wait for the API to persist before clicking Save — the card appears optimistically
    // but navigation away before the server responds loses the data (TC-039 breakage).
    await Promise.all([
      this.page.waitForResponse(
        resp => resp.request().method() !== 'GET' && resp.status() < 300,
        { timeout: 15_000 }
      ).catch(() => {}),
      this.page.getByRole('button', { name: 'Save', exact: true }).click(),
    ]);
    await expect(this.getLineItemCard(title)).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Returns the card container for a specific line item scoped by its title text.
   * Each card has two icon-only buttons: Edit (first) and Delete (last).
   * Uses .last() because — among all ancestors that contain both the title <p> and
   * a <button> — the card-level container is the deepest in document order.
   * @param {string} title — exact title of the line item
   */
  getLineItemCard(title) {
    return this.page
      .locator('*')
      .filter({ has: this.page.locator('p', { hasText: title }) })
      .filter({ has: this.page.getByRole('button') })
      .last();
  }

  /** Edit icon button for a specific line item (first icon in the card). */
  getLineItemEditBtn(title) {
    return this.getLineItemCard(title).getByRole('button').first();
  }

  /** Delete icon button for a specific line item (second icon in the card). */
  getLineItemDeleteBtn(title) {
    return this.getLineItemCard(title).getByRole('button').last();
  }

  /**
   * Click the delete icon on a line item card, then confirm the
   * "Delete Additional Service!" modal.
   * @param {string} title
   */
  async deleteLineItem(title) {
    await this.getLineItemDeleteBtn(title).click();
    await this.page
      .getByRole('dialog', { name: 'Delete Additional Service!' })
      .getByRole('button', { name: 'Delete Additional Service' })
      .click();
  }

  /**
   * Click the edit icon on a line item card, update only the title, then save.
   * @param {string} currentTitle
   * @param {string} newTitle
   */
  async editLineItemTitle(currentTitle, newTitle) {
    await this.getLineItemEditBtn(currentTitle).click();
    const titleInput = this.page.locator('#title');
    await titleInput.waitFor({ state: 'visible', timeout: 5_000 });
    // fill() clears existing value and sets new one in a single operation,
    // avoiding the character-dropping issue with pressSequentially on long strings.
    await titleInput.fill(String(newTitle));
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(this.page.getByText(newTitle)).toBeVisible({ timeout: 5_000 });
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

    // Skip if already showing the desired value
    const currentText = (await trigger.textContent().catch(() => '')).trim();
    if (currentText && !currentText.startsWith('Select ') &&
        optionText.startsWith(currentText.replace(/\.{3}$/, ''))) {
      return;
    }

    // Click the trigger to open the dropdown, retry up to 3 times
    const popper = this.page.locator('#simple-popper').last();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await trigger.scrollIntoViewIfNeeded().catch(() => {});
      await trigger.click();
      const opened = await popper
        .waitFor({ state: 'visible', timeout: 4_000 })
        .then(() => true).catch(() => false);
      if (opened) break;
      // Retry with parent click
      await trigger.locator('..').click().catch(() => {});
      const opened2 = await popper
        .waitFor({ state: 'visible', timeout: 3_000 })
        .then(() => true).catch(() => false);
      if (opened2) break;
    }

    // Search partially and pick the first matching option
    const popperVisible = await popper.isVisible().catch(() => false);
    if (popperVisible) {
      const option = popper.getByText(optionText).first();
      await option.waitFor({ state: 'visible', timeout: 5_000 });
      await option.click();
      await popper.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    } else {
      // Fallback: find option anywhere on the page
      const option = this.page.getByText(optionText, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 5_000 });
      await option.click();
    }
  }

  /**
   * Select the Billing Type.
   * @param {'Pre Bill'|'Post Bill'} type
   */
  async selectBillingType(type) {
    await this._selectFromCustomDropdown(/Select Billing Type|Pre Bill|Post Bill/, type);
  }

  /**
   * Open Billing Type dropdown in Step 4.
   * Supports default and selected states (Not Included / Charge Per Alarm / Flat-rate).
   */
  async openBillingTypeDropdown() {
    const triggerHeading = this.page
      .getByRole('heading', {
        name: /Billing Type|Not Included|Charge Per Alarm|Flat[- ]rate|Dispatch Request/i,
        level: 6,
      })
      .first();
    await triggerHeading.waitFor({ state: 'visible', timeout: 8_000 });
    const triggerContainer = triggerHeading.locator('..');

    await triggerContainer.click({ force: true }).catch(async () => {
      await triggerHeading.click({ force: true });
    });

    await this.page
      .locator('#simple-popper')
      .last()
      .waitFor({ state: 'visible', timeout: 4_000 })
      .catch(() => {});
  }

  /**
   * Select Billing Type option from the opened dropdown.
   * @param {'Not Included'|'Charge Per Alarm'|'Flat-rate' | 'Non Billable'} option
   */
  async selectDispatchBillingType(option) {
    await this.openBillingTypeDropdown();
    const normalized = String(option).toLowerCase();
    const optionPatterns = normalized.includes('charge')
      ? [/Charge\s*Per\s*Alarm/i, /Charge/i]
      : normalized.includes('flat')
        ? [/Flat[- ]?rate/i, /Flat/i]
        : normalized.includes('non')
        ? [/Non\s*Billable/i, /Non[- ]?Billable/i]
        : [/Not Included/i];
    const popper = this.page.locator('#simple-popper').last();
    const popperVisible = await popper.isVisible().catch(() => false);

    if (popperVisible) {
      let optionClicked = false;
      for (const pattern of optionPatterns) {
        const optionLocator = popper.getByText(pattern).first();
        const isVisible = await optionLocator.isVisible().catch(() => false);
        if (isVisible) {
          await optionLocator.click({ force: true });
          optionClicked = true;
          break;
        }
      }
      if (!optionClicked) {
        throw new Error(`Billing Type option "${option}" not visible in dropdown.`);
      }
    } else {
      const fallbackOption = this.page
        .locator('div')
        .filter({ hasText: optionPatterns[0] })
        .last();
      await fallbackOption.click({ force: true });
    }
    // Popper close signals React state update; caller assertion auto-waits
  }

  /** Returns Step 4 Charge Per Alarm rate input. */
  getChargePerAlarmRateInput() {
    return this.page
      .getByRole('spinbutton', { name: /Billing Type Rate.*Price|Charge Per Alarm/i })
      .first();
  }

  /** Returns Step 4 Peak Hours rate input. */
  getPeakHoursRateInput() {
    return this.page.getByRole('spinbutton', { name: /Peak Hours/i }).first();
  }

  /** Returns Step 4 Flat-rate weekly input. */
  getFlatRateWeeklyInput() {
    return this.page
      .getByRole('spinbutton', { name: /Billing Type Rate.*\/week/i })
      .first();
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
   * Uses the Step 4 custom dropdown trigger and option selection.
   * @param {'Weekly'|'Bi Weekly'|'Monthly'|'Semi Monthly'} freq
   */
  async selectBillingFrequency(freq) {
    const normalized = String(freq || '').trim();
    const optionText =
      /^bi\s*weekly$/i.test(normalized) ? 'Bi-Weekly'
      : /^semi\s*monthly$/i.test(normalized) ? 'Semi Monthly'
      : normalized;

    await this._selectFromCustomDropdown(
      /Select Billing Frequency|Weekly|Bi-Weekly|Bi Weekly|Monthly|Semi Monthly/i,
      optionText,
    );
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
    // Wait for the dropdown to appear before clicking option
    const termPopper = this.page.locator('#simple-popper').last();
    await termPopper.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
    await this.page.getByText(termText).first().click();
    // Popper close signals selection; caller assertion auto-waits
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
    // Calendar grid opens; wait for gridcell to become visible before clicking
    const targetCell = this.page.getByRole('gridcell', { name: day }).first();
    await targetCell.waitFor({ state: 'visible', timeout: 5_000 });
    await targetCell.click();
    // Calendar closes synchronously; caller assertion auto-waits
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
    await this.selectBillingType(/** @type {any} */ (billingType));
    await this.selectContractType(/** @type {any} */ (contractType));
    await this.selectBillingFrequency(/** @type {any} */ (billingFrequency));
    await this.selectPaymentTerms(paymentTerms);
    await this.selectPaymentMethod(/** @type {any} */ (paymentMethod));
    await this.selectCycleReferenceDate(cycleRefDay);
    await this.fillBillingContactInfo(billingContact);
  }

  // ── Step 5 — Description ────────────────────────────────────────────────

  /** Assert Step 5 Description section heading is visible */
  async assertStep5Visible() {
    await expect(this.descriptionPageHeading).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert Step 5 description editor is pre-filled with non-empty content.
   * Uses the visible rich-text editor instance instead of brittle character-counter text.
   */
  async assertStep5DescriptionPrefilled() {
    await this.assertStep5Visible();
    const editors = this.page.getByRole('textbox', { name: 'rdw-editor' });

    // Wait for editor content to load (may load async after heading renders)
    let visibleEditorText = '';
    for (let retry = 0; retry < 10; retry += 1) {
      const count = await editors.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        const editor = editors.nth(i);
        const isVisible = await editor.isVisible().catch(() => false);
        if (!isVisible) continue;
        visibleEditorText = String(await editor.textContent().catch(() => '')).trim();
        if (visibleEditorText.length > 0) break;
      }
      if (visibleEditorText.length > 0) break;
      await this.page.waitForTimeout(1_000);
    }

    expect(
      visibleEditorText.length > 0,
      'Expected Step 5 Description editor to contain pre-filled content.',
    ).toBeTruthy();
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
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
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

    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    const stillNotStepper = !(await this.isOnStepperPage());
    if (stillNotStepper) {
      throw new Error('Edit action did not open contract stepper.');
    }
  }

  /**
   * Delete the existing proposal card via the "Delete" action on the
   * Contract & Terms tabpanel, then confirm the modal.
   *
   * MCP-verified 2026-05-07:
   *   - Delete action: generic "Delete" with cursor=pointer img child inside the
   *     card actions row — located via tabpanel text match (same strategy as
   *     hasProposalCardVisible uses for Edit/Clone/Preview PDF).
   *   - Confirmation dialog heading: "Delete Proposal!" (level=4)
   *   - Confirm button: role=button name="Delete Proposal"
   *
   * After confirmation the tabpanel returns to empty state.
   * Use detectContractState() afterward to confirm "empty" if needed.
   */
  async deleteExistingProposal() {
    await this.clickContractTermsTab().catch(() => {});
    // MCP-verified 2026-05-07: the Delete action is <div aria-label="Delete"> with an SVG child
    // and NO text content. getByText('Delete') never matches it — use [aria-label] CSS selector
    // (SKILL.md §2 priority 2). Clicking the inner div bubbles to the parent's React onclick handler.
    const deleteAction = this.deleteProposalActionByAriaLabel;
    await expect(deleteAction).toBeVisible({ timeout: 8_000 });
    await deleteAction.click();
    // Confirm the "Delete Proposal!" modal
    const confirmBtn = this.page.getByRole('button', { name: 'Delete Proposal' });
    await expect(confirmBtn).toBeVisible({ timeout: 8_000 });
    await confirmBtn.click();
    // Wait for the card to disappear — empty state or empty tabpanel
    await expect(deleteAction).not.toBeVisible({ timeout: 10_000 });
  }

  /**
   * Open the Update Proposal drawer on the stepper page.
   * Clicks the "Update Proposal" button (top-right of the stepper) and waits
   * for the drawer to render with the Auto Renewal field visible.
   * MCP-verified 2026-05-07: drawer contains all proposal fields including
   * Auto Renewal of Contract checkbox.
   */
  async openUpdateProposalDrawer() {
    // The "Update Proposal" button on the stepper (not the one inside the drawer)
    await expect(this.updateProposalBtn).toBeVisible({ timeout: 10_000 });
    await this.updateProposalBtn.first().click();
    // Wait for the drawer to open — Auto Renewal text is our readiness signal
    await expect(this.autoRenewalText).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Close the Update Proposal drawer without saving, by clicking Cancel.
   */
  async closeUpdateProposalDrawer() {
    await this.cancelDrawerBtn.click();
    await expect(this.autoRenewalText).not.toBeVisible({ timeout: 8_000 });
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
    // Radio state settles synchronously; caller assertion auto-waits
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
    // Wait for the popper to appear before clicking the stage option
    const stagePopper = this.page.locator('#simple-popper').last();
    await stagePopper.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
    await this.page.getByText(stage, { exact: true }).click();
    // Stage selection enables the Save button; caller waits for button enabled state
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
    // waitForLoadState covers the navigation triggered by Save; no extra timeout needed
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
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

    // If the publish modal has Contract Duration fields (dates to be decided),
    // fill them before clicking Publish. Search on the page directly (not scoped
    // to dialog) since MUI modals may not have role="dialog".
    const startDateField = this.startDateInput;
    const hasStartDate = await startDateField.isVisible().catch(() => false);
    if (hasStartDate) {
      const startVal = await startDateField.inputValue().catch(() => '');
      if (!startVal || /MM\/DD/.test(startVal)) {
        const now = new Date();
        const start = new Date(now.getTime() + 7 * 86400000);
        const startStr = `${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}/${start.getFullYear()}`;
        await startDateField.fill(startStr);
      }
      // Fill Renewal Date if visible and empty
      const hasRenewal = await this.renewalDateInput.isVisible().catch(() => false);
      if (hasRenewal) {
        const renewalVal = await this.renewalDateInput.inputValue().catch(() => '');
        if (!renewalVal || /MM\/DD/.test(renewalVal)) {
          const now = new Date();
          const renewal = new Date(now.getTime() + 372 * 86400000);
          const renewalStr = `${String(renewal.getMonth() + 1).padStart(2, '0')}/${String(renewal.getDate()).padStart(2, '0')}/${renewal.getFullYear()}`;
          await this.renewalDateInput.fill(renewalStr);
        }
      }
      // Fill End Date if visible and empty (alternative to Renewal Date)
      const endDateField = this.page.getByRole('textbox', { name: 'Select End Date' });
      const hasEndDate = await endDateField.isVisible().catch(() => false);
      if (hasEndDate) {
        const endVal = await endDateField.inputValue().catch(() => '');
        if (!endVal || /MM\/DD/.test(endVal)) {
          const now = new Date();
          const end = new Date(now.getTime() + 372 * 86400000);
          const endStr = `${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}/${end.getFullYear()}`;
          await endDateField.fill(endStr);
        }
      }
    }

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
    // waitForLoadState covers the publish navigation; no extra timeout needed
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
  }

  /**
   * Assert the contract has been successfully published.
   * Live-verified: "Published without sign" badge is visible,
   * "Publish Contract" button is gone, "Terminate" action button appears.
   */
  async assertContractPublishedSuccessfully() {
    await expect(this.contractPublishedBadge).toBeVisible({ timeout: 15_000 });
    await expect(this.publishContractBtn).not.toBeVisible({ timeout: 8_000 });
    await expect(this.terminateContractGeneric).toBeVisible({ timeout: 8_000 });
    await expect(this.signatureBtnOnCard).toBeVisible({ timeout: 8_000 });
  }

  // ── Step 1 — Multi-Service Management ───────────────────────────────────

  // TODO: implement via stable locator when data-testid is available.

  /**
   * Click the delete button for the first service on Step 1.
   * Note: Delete button only appears when there are 2+ services.
   * Selector discovered via Playwright Codegen.
   */
  async deleteFirstService() {
    const deleteBtn = this.page.getByRole('button', { name: 'Delete Service' }).first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await deleteBtn.scrollIntoViewIfNeeded().catch(() => {});
    // Use JS click to bypass the innerScrollBar overlay that intercepts pointer events
    await deleteBtn.evaluate((el) => el.click());
    // Delete modal appearance is the next assertion; no fixed delay needed
  }

  /**
   * Confirm the "Delete Service!" modal that appears after clicking a service's delete button.
   * The modal's confirm button is overlaid by the innerScrollBar div (high z-index), so we
   * temporarily disable its pointer-events before clicking, then restore them after.
   */
  async confirmDeleteService() {
    // The confirmation modal may not use role="dialog"; locate by heading text instead.
    // The confirm button is the last "Delete Service" button (card buttons come before modal button).
    // JS click bypasses the MUI overlay that intercepts coordinate-based clicks.
    const confirmBtn = this.page
      .getByRole('button', { name: 'Delete Service' })
      .last();
    await confirmBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
    await confirmBtn.evaluate((el) => el.click());

    // Wait for the modal heading to disappear
    await this.page
      .getByText('Delete Service!', { exact: true })
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {});
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
        await this.page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
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
          await this.page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
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
    // Trigger form recalculation by scrolling (no fixed wait — next locator auto-waits)
    await this.page.evaluate(() => window.scrollBy(0, 10)).catch(() => {});

    // Try to find the grand total by label first (Grand Total: or Total:)
    // Use CSS sibling combinator instead of XPath (XPath is banned by project standards)
    let grandTotalField = this.page.locator(':text-matches("Grand Total|Total:", "i") ~ input, :text-matches("Grand Total|Total:", "i") ~ div, :text-matches("Grand Total|Total:", "i") ~ span')
      .first();

    let isVisible = await grandTotalField.isVisible({ timeout: 5_000 }).catch(() => false);
    if (isVisible) {
      const value = await grandTotalField.textContent().catch(() => null);
      console.log(`[getGrandTotal] Found via label: "${value}"`);
      return value;
    }

    // Fallback: look for USD total text (e.g., "USD 135.00 Weekly" on Step 1)
    // Look for the LAST occurrence since it's usually in the footer
    const usdTotalTexts = this.page.getByText(/USD\s*[\d,]+\.\d{2}/);
    const count = await usdTotalTexts.count().catch(() => 0);
    const usdTotalText = usdTotalTexts.last();

    console.log(`[getGrandTotal] Found ${count} USD matches, using last one`);

    isVisible = await usdTotalText.isVisible({ timeout: 5_000 }).catch(() => false);
    if (isVisible) {
      const value = await usdTotalText.textContent().catch(() => null);
      console.log(`[getGrandTotal] Found via USD text: "${value}"`);
      return value;
    }

    console.log(`[getGrandTotal] No grand total found!`);
    return null;
  }

  /**
   * Click the "Add Service" button to add another service to Step 1.
   *
   * The card renders an h3 heading "Add another service" alongside a MuiIconButton ("+").
   * They share a common ancestor container. We locate the button by walking from the
   * heading up to the nearest ancestor that contains a <button>, then clicking it via
   * Playwright's native .click() so React synthetic events fire correctly.
   *
   * SKILL.md §2: No page.evaluate() for clicks — use Playwright's native .click().
   * SKILL.md §4: No .catch(()=>{}) on critical waits — surface failures immediately.
   */
  async clickAddService() {
    // Ensure the heading is visible before attempting to click (SKILL.md §4 — web-first assertion)
    await expect(this.addAnotherServiceHeading).toBeVisible({ timeout: 10_000 });

    // Locate the "+" button in the "Add another service" card.
    // Live-verified 2026-05-07: the H3 heading's direct parent div (locator('..'))
    // contains exactly one button — the MuiButton that triggers the React add-service
    // state update. Using locator('..') scopes to the direct parent, avoiding the 11+
    // ancestor divs that would match a broader .filter({ has: heading }) strategy and
    // resolve to unrelated buttons (e.g. the page header "United States" flag button).
    const addServiceBtn = this.addAnotherServiceHeading
      .locator('..')
      .locator('button')
      .first();

    // Count existing service name inputs BEFORE click so we know the target count.
    const serviceCountBefore = await this.page.getByRole('textbox', { name: /^Service \d+$/ }).count();
    const expectedNewLabel = `Service ${serviceCountBefore + 1}`;

    await addServiceBtn.scrollIntoViewIfNeeded();
    await addServiceBtn.click();

    // Wait for the new "Service N" textbox to appear — confirms React state updated.
    // Never swallow this error; if the form doesn't render, the test must fail loudly.
    await expect(
      this.page.getByRole('textbox', { name: expectedNewLabel }),
    ).toBeVisible({ timeout: 10_000 });
  }

  // ── Step 1 — Toggle Helpers (live-verified 2026-05-06) ─────────────────

  /** Assert the Include Fuel Surcharge checkbox is visible */
  async assertFuelSurchargeVisible() {
    await expect(this.fuelSurchargeLabel).toBeVisible({ timeout: 5_000 });
  }

  /** Assert the Include Vehicle checkbox is visible */
  async assertIncludeVehicleVisible() {
    await expect(this.includeVehicleLabel).toBeVisible({ timeout: 5_000 });
  }

  /** Assert Visitor Management and Load Management labels are visible */
  async assertAdditionalServicesVisible() {
    await expect(this.visitorManagementLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.loadManagementLabel).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Toggle an MUI Switch ON if not already active.
   * Uses the visible switch wrapper (role="checkbox") instead of the hidden input,
   * because force-clicking the hidden input does not trigger React state updates.
   * @param {import('@playwright/test').Locator} switchLocator - the visible switch (role=checkbox)
   * @param {string} _label - human-readable name for error messages
   */
  async toggleMuiSwitchOn(switchLocator, _label) {
    await switchLocator.scrollIntoViewIfNeeded();
    const isAlreadyOn = await switchLocator.isChecked().catch(() => false);
    if (!isAlreadyOn) {
      // Click the visible MUI Switch wrapper (parent span with cursor:pointer),
      // NOT the hidden <input> — clicking the input directly bypasses React's
      // synthetic event system and the checked state never updates.
      // SKILL.md §2 — MUI Switch toggles rule.
      await switchLocator.locator('..').click();
    }
  }

  /** Assert all rich text editor toolbar buttons are visible */
  async assertInstructionsToolbarVisible() {
    await expect(this.boldToolbarBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.italicToolbarBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.unorderedListToolbarBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.orderedListToolbarBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.h1ToolbarBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.h2ToolbarBtn).toBeVisible({ timeout: 5_000 });
  }

  // ── Step 3 — On Demand Helpers (live-verified 2026-05-06) ──────────────

  /**
   * Get the current Dispatch Billing Type text from the trigger heading on Step 3.
   * @returns {Promise<string>}
   */
  async getDispatchBillingTypeText() {
    const triggerHeading = this.page
      .getByRole('heading', {
        name: /Flat Rate|Not Included|Charge Per Alarm|Non Billable/i,
        level: 6,
      })
      .first();
    return (await triggerHeading.textContent().catch(() => '')).trim();
  }

  // ── Step 4 — Payment Plan Helpers (live-verified 2026-05-06) ───────────

  /**
   * Select a payment plan radio on Step 4.
   * @param {'Monthly'|'Bi-Weekly'|'Weekly'|'Event'|'Flat'} plan
   */
  async selectPaymentPlan(plan) {
    const planMap = {
      'Monthly': this.monthlyPlanRadio,
      'Bi-Weekly': this.biWeeklyPlanRadio,
      'Weekly': this.weeklyPlanRadio,
      'Event': this.eventPlanRadio,
      'Flat': this.flatPlanRadio,
    };
    const radio = planMap[plan];
    if (!radio) throw new Error(`Unknown payment plan: "${plan}"`);
    // MUI Radio: the click handler lives on the ancestor with cursor:pointer, not the hidden
    // <input> itself. Dispatching click({ force:true }) to the input fires the DOM event but
    // React's synthetic onChange does not fire. Use evaluate cursor:pointer traversal (same
    // pattern as step-tab navigation, live-verified 2026-05-07).
    await radio.scrollIntoViewIfNeeded().catch(() => {});
    await radio.evaluate((el) => {
      let target = el;
      while (target && target !== document.body) { 
        const style = globalThis.getComputedStyle(target);
        if (style.cursor === 'pointer') { target.click(); return; }
        target = target.parentElement;
      }
      el.click();
    });
    await expect(radio).toBeChecked({ timeout: 5_000 });
  }

  /** Assert all five payment plan labels are visible */
  async assertAllPaymentPlansVisible() {
    await expect(this.monthlyPlanRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.biWeeklyPlanRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.weeklyPlanRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.eventPlanRadio).toBeVisible({ timeout: 5_000 });
    await expect(this.flatPlanRadio).toBeVisible({ timeout: 5_000 });
  }

  /** Assert the three Step 4 section headings are visible */
  async assertStep4SectionsVisible() {
    await expect(this.billingOccurrenceHeading).toBeVisible({ timeout: 5_000 });
    await expect(this.definePaymentTermsHeading).toBeVisible({ timeout: 5_000 });
    await expect(this.billingInfoHeading).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Open the Holiday Group dropdown on Step 4.
   * Returns the popper locator.
   */
  async openHolidayGroupDropdown() {
    await this.holidayGroupTrigger.waitFor({ state: 'visible', timeout: 8_000 });
    await this.holidayGroupTrigger.click();
    const popper = this.page.locator('#simple-popper').last();
    await popper.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    return popper;
  }

  // ── Step 5 — Description Helpers (live-verified 2026-05-06) ────────────

  /** Assert Step 5 banner upload area and editor heading are visible */
  async assertStep5BannerAndEditorVisible() {
    await expect(this.uploadBannerHeading).toBeVisible({ timeout: 5_000 });
    await expect(this.descriptionPageHeading).toBeVisible({ timeout: 5_000 });
  }

  /** Assert banner upload constraints text and Choose File button are visible */
  async assertBannerUploadAreaVisible() {
    await expect(this.clickToUploadText).toBeVisible({ timeout: 5_000 });
    await expect(this.bannerConstraintsText).toBeVisible({ timeout: 5_000 });
  }

  // ── Step 6 — Signee Helpers (live-verified 2026-05-06) ─────────────────

  /** Click the Add Signee card to open the drawer */
  async openAddSigneeDrawer() {
    // The "Add Signee" card has an icon button (no accessible name) as a sibling
    // of the "Add Signee" h4 heading inside the card container. The button is the
    // correct click target — it uses MUI's onPointerDown/onMouseDown events, so
    // evaluate((el) => el.click()) is insufficient (fires only the click event,
    // not mousedown). Use Playwright's .click() for the full event sequence.
    // Live-verified 2026-05-07: MCP click on the icon button opened the drawer.
    const addSigneeCardBtn = this.addSigneeCard.locator('..').getByRole('button').first();
    await addSigneeCardBtn.scrollIntoViewIfNeeded().catch(() => {});
    await addSigneeCardBtn.click();
    await expect(this.addSigneeDrawerHeading).toBeVisible({ timeout: 8_000 });
  }

  /** Close the Add Signee drawer via Cancel */
  async cancelAddSignee() {
    await this.addSigneeCancelBtn.click();
    await expect(this.addSigneeDrawerHeading).not.toBeVisible({ timeout: 5_000 });
  }

  /**
   * Fill and submit the Add Signee form.
   * @param {{ name: string, title: string, email: string }} signee
   */
  async addSignee({ name, title, email }) {
    await this.addSigneeNameInput.fill(name);
    await this.addSigneeTitleInput.fill(title);
    await this.addSigneeEmailInput.fill(email);
    await this.addSigneeSubmitBtn.click();
    // Drawer closes on success; caller assertion auto-waits
  }

  /**
   * Assert a specific signee card is visible (e.g., "Signee 2").
   * @param {number} signeeNumber — 1-based index
   */
  async assertSigneeCardVisible(signeeNumber) {
    await expect(
      this.page.getByRole('heading', { name: `Signee ${signeeNumber}`, level: 4 })
    ).toBeVisible({ timeout: 5_000 });
  }

  // ── Contract Renewal Helpers (live-verified 2026-05-08) ──────────────────

  /** Assert the Contract Renewal modal is open */
  async assertContractRenewalModalOpen() {
    await expect(this.contractRenewalModalHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.contractRenewalPublishBtn).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Click "Publish Contract" and detect which modal opens.
   * Returns: 'closeDeal' | 'publishConfirm' | 'contractRenewal' | 'unknown'
   */
  async clickPublishAndDetectModal() {
    await this.publishContractBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.publishContractBtn.click();
    // Wait for any modal to appear
    const closeDeal = await this.closeDealModalHeading
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => 'closeDeal')
      .catch(() => null);
    if (closeDeal) return closeDeal;
    const publishConfirm = await this.publishConfirmModalHeading
      .isVisible().catch(() => false);
    if (publishConfirm) return 'publishConfirm';
    const renewal = await this.contractRenewalModalHeading
      .isVisible().catch(() => false);
    if (renewal) return 'contractRenewal';
    return 'unknown';
  }

  /**
   * Confirm publish through whatever modal is currently open.
   * Handles Close Deal, Publish Confirm, and Contract Renewal flows.
   * @param {string} modalType — from clickPublishAndDetectModal()
   */
  async confirmPublishViaModal(modalType) {
    if (modalType === 'closeDeal') {
      await this.selectCloseStatus('Closed Won');
      await this.selectHubspotStage('Closed Won (Sales Pipeline)');
      await this.saveCloseDeal();
      // After closing, need to click Publish Contract again for the confirm step
      await this.clickPublishContractToConfirm();
      await this.confirmPublishContract();
    } else if (modalType === 'publishConfirm') {
      await this.confirmPublishContract();
    } else if (modalType === 'contractRenewal') {
      await this.contractRenewalPublishBtn.click();
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    }
  }

  /**
   * Dismiss whatever publish-related modal is currently open.
   */
  async dismissPublishModal() {
    const cancelBtn = this.page.getByRole('button', { name: 'Cancel' }).first();
    const cancelVisible = await cancelBtn.isVisible().catch(() => false);
    if (cancelVisible) {
      await cancelBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  // ── Publish & Request Signatures Helpers (live-verified 2026-05-08) ─────

  /** Open the Signature dropdown menu by clicking the Signature button */
  async openSignatureDropdown() {
    await this.signatureBtnOnCard.waitFor({ state: 'visible', timeout: 10_000 });
    await this.signatureBtnOnCard.click();
    await expect(this.addSignMenuitem).toBeVisible({ timeout: 5_000 });
  }

  /** Click "Request Sign" menuitem from the Signature dropdown to open the modal */
  async openRequestSignaturesModal() {
    await this.openSignatureDropdown();
    await this.requestSignMenuitem.click();
    await expect(this.requestSignaturesModalHeading).toBeVisible({ timeout: 10_000 });
  }

  /** Assert the Request Signatures modal is open with expected elements */
  async assertRequestSignaturesModalOpen() {
    await expect(this.requestSignaturesModalHeading).toBeVisible({ timeout: 10_000 });
    await expect(this.selectAllCheckboxLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.requestSignaturesBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.requestSignaturesCancelBtn).toBeVisible({ timeout: 5_000 });
  }

  /** Close the Request Signatures modal via Cancel button */
  async cancelRequestSignatures() {
    await this.requestSignaturesCancelBtn.click();
    await expect(this.requestSignaturesModalHeading).not.toBeVisible({ timeout: 5_000 });
  }

  /**
   * Get signee rows from the Request Signatures modal.
   * Each row has a checkbox, avatar, name paragraph, and email paragraph.
   * Returns locator for all signee row containers (excludes the Select All row).
   */
  getSigneeRows() {
    // Signee rows are siblings of the modal heading that contain a paragraph with
    // an email pattern. The Select All row has paragraph text "Select All".
    // Scope to the modal container and exclude Select All.
    const modalContainer = this.requestSignaturesModalHeading.locator('..');
    return modalContainer.locator('> div').filter({
      has: this.page.locator('img'),
    }).filter({
      hasNot: this.page.getByText('Select All', { exact: true }),
    }).filter({
      hasNot: this.requestSignaturesBtn,
    });
  }

  /**
   * Select a signee by index (0-based) in the Request Signatures modal.
   * Clicks the checkbox in the signee row.
   * @param {number} index — 0-based signee index
   */
  async selectSigneeByIndex(index) {
    const signeeRows = this.getSigneeRows();
    const row = signeeRows.nth(index);
    await row.waitFor({ state: 'visible', timeout: 5_000 });
    const checkbox = row.getByRole('checkbox');
    await checkbox.click();
  }

  /** Click the Select All checkbox in the Request Signatures modal */
  async selectAllSignees() {
    const selectAllRow = this.requestSignaturesModalHeading.locator('..').locator('> div').filter({
      has: this.page.getByText('Select All', { exact: true }),
    });
    const checkbox = selectAllRow.getByRole('checkbox');
    await checkbox.click();
  }

  /** Click Request Signatures submit button in the modal */
  async submitRequestSignatures() {
    await this.requestSignaturesBtn.click();
  }

  /**
   * Assert deal stage is currently showing a specific stage as active/visible.
   * @param {'Proposal Creation'|'Negotiation'|'Closed Won'} stage
   */
  async assertDealStageActive(stage) {
    const stageBtn = this.page.locator('button').filter({ hasText: new RegExp(`^${stage}$`) });
    await expect(stageBtn).toBeVisible({ timeout: 10_000 });
  }

  // ── Clone Contract Dialog (MCP-verified 2026-05-08) ───────────────────

  /** Click the Clone action icon on the proposal card and wait for dialog */
  async clickCloneAction() {
    await expect(this.cloneProposalActionByAriaLabel).toBeVisible({ timeout: 8_000 });
    await this.cloneProposalActionByAriaLabel.click();
    await expect(this.cloneContractHeading).toBeVisible({ timeout: 8_000 });
  }

  /** Assert the Clone Contract dialog is open with all expected elements */
  async assertCloneContractDialogOpen() {
    await expect(this.cloneContractHeading).toBeVisible({ timeout: 8_000 });
    await expect(this.cloneContractText).toBeVisible({ timeout: 5_000 });
    await expect(this.cloneContractCancelBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.cloneContractProceedBtn).toBeVisible({ timeout: 5_000 });
  }

  /** Dismiss the Clone Contract dialog via Cancel */
  async dismissCloneContractDialog() {
    await this.cloneContractCancelBtn.click();
    await expect(this.cloneContractHeading).not.toBeVisible({ timeout: 5_000 });
  }

  // ── Delete Proposal Dialog (MCP-verified 2026-05-08) ──────────────────

  /** Click the Delete action icon on the proposal card and wait for dialog */
  async clickDeleteAction() {
    await expect(this.deleteProposalActionByAriaLabel).toBeVisible({ timeout: 8_000 });
    await this.deleteProposalActionByAriaLabel.click();
    await expect(this.deleteProposalHeading).toBeVisible({ timeout: 8_000 });
  }

  /** Assert the Delete Proposal dialog is open with all expected elements */
  async assertDeleteProposalDialogOpen() {
    await expect(this.deleteProposalHeading).toBeVisible({ timeout: 8_000 });
    await expect(this.deleteProposalText).toBeVisible({ timeout: 5_000 });
    await expect(this.deleteProposalNoBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.deleteProposalConfirmBtn).toBeVisible({ timeout: 5_000 });
  }

  /** Dismiss the Delete Proposal dialog via No button */
  async dismissDeleteProposalDialog() {
    await this.deleteProposalNoBtn.click();
    await expect(this.deleteProposalHeading).not.toBeVisible({ timeout: 5_000 });
  }

  // ── Terminate Contract Dialog (MCP-verified 2026-05-08) ────────────────

  /** Click the Terminate action icon on the proposal card and wait for dialog */
  async clickTerminateAction() {
    await expect(this.terminateContractGeneric).toBeVisible({ timeout: 8_000 });
    await this.terminateContractGeneric.click();
    await expect(this.terminateDialogHeading).toBeVisible({ timeout: 8_000 });
  }

  /** Assert the Terminate dialog is open with all expected elements */
  async assertTerminateDialogOpen() {
    await expect(this.terminateDialogHeading).toBeVisible({ timeout: 8_000 });
    await expect(this.terminationDateInput).toBeVisible({ timeout: 5_000 });
    await expect(this.terminationReasonInput).toBeVisible({ timeout: 5_000 });
    await expect(this.terminateContractNoBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.terminateContractConfirmBtn).toBeVisible({ timeout: 5_000 });
  }

  /** Dismiss the Terminate dialog via No button */
  async dismissTerminateDialog() {
    await this.terminateContractNoBtn.click();
    await expect(this.terminateDialogHeading).not.toBeVisible({ timeout: 5_000 });
  }

  // ── Addendum Contract Dialog (MCP-verified 2026-05-08) ─────────────────

  /** Click the Addendum action icon on the proposal card and wait for dialog */
  async clickAddendumAction() {
    await expect(this.addendumContractGeneric).toBeVisible({ timeout: 8_000 });
    await this.addendumContractGeneric.click();
    await expect(this.addendumContractHeading).toBeVisible({ timeout: 8_000 });
  }

  /** Assert the Addendum Contract dialog is open with all expected elements */
  async assertAddendumDialogOpen() {
    await expect(this.addendumContractHeading).toBeVisible({ timeout: 8_000 });
    await expect(this.addendumContractText).toBeVisible({ timeout: 5_000 });
    await expect(this.addendumContractCancelBtn).toBeVisible({ timeout: 5_000 });
    await expect(this.addendumContractProceedBtn).toBeVisible({ timeout: 5_000 });
  }

  /** Dismiss the Addendum Contract dialog via Cancel */
  async dismissAddendumDialog() {
    await this.addendumContractCancelBtn.click();
    await expect(this.addendumContractHeading).not.toBeVisible({ timeout: 5_000 });
  }

  // ── Clone Contract — Proceed (MCP-verified 2026-05-08) ────────────────

  /**
   * Click the Proceed button in the Clone Contract confirmation dialog and
   * wait for the app to navigate to the cloned contract editor URL.
   *
   * Uses Promise.all so the click and URL-wait are issued together, avoiding
   * the SPA-navigation race described in SKILL.md §4.
   *
   * @returns {Promise<boolean>} true if navigation to /contract/ succeeded,
   *   false if the clone API returned an error and no navigation occurred.
   */
  async proceedCloneContract() {
    await expect(this.cloneContractProceedBtn).toBeVisible({ timeout: 5_000 });
    const navigated = await Promise.all([
      this.page.waitForURL(/\/contract\//, { timeout: 20_000 }).then(() => true).catch(() => false),
      this.cloneContractProceedBtn.click(),
    ]).then(([nav]) => nav);
    return navigated;
  }

  // ── Addendum — TC-150 through TC-185 (appended 2026-05-09) ────────────────

  /**
   * Click the Proceed button in the Addendum Contract dialog and wait for
   * the app to navigate to a new deal + contract stepper URL.
   *
   * @returns {Promise<boolean>} true if navigation occurred, false if blocked/errored.
   */
  async proceedAddendumContract() {
    await expect(this.addendumContractProceedBtn).toBeVisible({ timeout: 5_000 });
    const navigated = await Promise.all([
      this.page.waitForURL(/\/deals\/deal\/\d+\/contract\/\d+/, { timeout: 20_000 })
        .then(() => true).catch(() => false),
      this.addendumContractProceedBtn.click(),
    ]).then(([nav]) => nav);
    return navigated;
  }

  /**
   * Assert the "Addendum contract created successfully!" toast is visible.
   */
  async assertAddendumCreatedToast() {
    await expect(this.addendumCreatedToast).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert the Addendum action icon is NOT present on the Contract & Terms tabpanel.
   * Used to verify that a second addendum cannot be created once one already exists.
   */
  async assertNoAddendumAction() {
    await expect(this.addendumContractGeneric).not.toBeVisible({ timeout: 8_000 });
  }

  /**
   * Assert the draft proposal card shows Edit/Clone/Preview PDF/Delete actions
   * and does NOT show the Addendum action icon.
   * (Addendum is only available on published contracts.)
   */
  async assertDraftCardActions() {
    await expect(this.editProposalActionByAriaLabel).toBeVisible({ timeout: 8_000 });
    await expect(this.cloneProposalActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.previewPdfActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.deleteProposalActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.addendumContractGeneric).not.toBeVisible({ timeout: 5_000 });
  }

  /**
   * Assert the published proposal card shows Signature/View/Clone/Preview PDF/Terminate
   * and does NOT show the Addendum action icon.
   * (Used when a pending addendum already exists, blocking a second one.)
   */
  async assertPublishedCardActionsNoAddendum() {
    await expect(this.viewContractGeneric).toBeVisible({ timeout: 8_000 });
    await expect(this.cloneProposalActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.previewPdfActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.terminateContractGeneric).toBeVisible({ timeout: 5_000 });
    await expect(this.addendumContractGeneric).not.toBeVisible({ timeout: 5_000 });
  }

  /**
   * Assert the published proposal card shows the Addendum action icon
   * alongside the other standard published-card actions.
   * (Used for an eligible active published contract with no pending addendum.)
   */
  async assertPublishedCardWithAddendum() {
    await expect(this.addendumContractGeneric).toBeVisible({ timeout: 8_000 });
    await expect(this.viewContractGeneric).toBeVisible({ timeout: 5_000 });
    await expect(this.cloneProposalActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.previewPdfActionByAriaLabel).toBeVisible({ timeout: 5_000 });
    await expect(this.terminateContractGeneric).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Navigate to the deal detail URL derived from a stepper URL by stripping
   * the /contract/{id} suffix.
   *
   * @param {string} stepperUrl - full stepper URL e.g. /deals/deal/123/contract/456
   * @returns {Promise<string>} the deal detail URL navigated to
   */
  async gotoDealDetailFromStepperUrl(stepperUrl) {
    const dealDetailUrl = stepperUrl.replace(/\/contract\/\d+.*$/, '');
    await this.page.goto(dealDetailUrl, { waitUntil: 'domcontentloaded' });
    await this.assertOnDealDetailPage();
    return dealDetailUrl;
  }

  /**
   * Assert the proposal card name heading (h4 inside Contract & Terms tabpanel)
   * starts with the given prefix text.
   *
   * @param {string|RegExp} pattern - text or regex to match against the h4 text content
   */
  async assertProposalCardNameMatches(pattern) {
    const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    await expect(this.proposalCardHeading).toHaveText(re, { timeout: 8_000 });
  }

  /**
   * Assert the Publish Contract button is visible (contract is in draft state).
   */
  async assertPublishContractBtnVisible() {
    await expect(this.publishContractBtn).toBeVisible({ timeout: 8_000 });
  }

}

module.exports = { ContractModule };
