// tests/e2e/contract-module.spec.js
//
// Smoke Test Suite — Contract & Terms Module — Signal CRM
//
// The Contract & Terms module is embedded within the Deal Detail page.
// It manages proposals and contracts associated with a deal.
//
// Session design — matches the established project pattern exactly:
//   • Single login in beforeAll, shared context for ALL tests
//   • test.describe.serial  — ordered, sequential execution
//   • test.beforeEach       — navigates to Deals page before each test
//   • Shared state via module-level variables
//
// Dynamic deal resolution:
//   CONTRACT_TEST_DEAL  — explicitly specify the deal to use
//   CREATED_DEAL_NAME   — populated by the deal suite in a full pipeline run
//   Fallback             — 'Regression Phase 2' (a known stable deal in the UAT env)
//
// ⚠️  IMPORTANT: Tests TC-CONTRACT-004 onward rely on the target deal having
//   NO existing proposal (Contract & Terms empty state must be visible).
//   In a full pipeline run, the deal created by deal-module.spec.js is used.
//   For standalone runs, ensure the fallback deal has no existing proposal.
//
// Live-verified module behaviour (2026-03-24):
//   • Contract & Terms tab — default selected tab on deal detail
//   • Empty state          — "Create a Proposal" heading + button
//   • Create Proposal drawer (level=3 heading):
//       - Service Type radiogroup: Dedicated/Patrol (default) | Dispatch Only
//       - Proposal Name textbox   — pre-filled with deal name
//       - Time Zone heading trigger — shows "(UTC…)" format
//       - "Contract Dates to be decided" checkbox — hides date fields when checked
//       - Start Date textbox (required, hidden when TBD checked)
//       - End Date / Renewal Date radio (Renewal Date = default)
//       - Renewal Date textbox (conditionally visible)
//       - Auto Renewal of Contract checkbox
//       - Notify for Renewal Before (Days) spinbutton (default: 10)
//       - Cancel + Create Proposal buttons

const { test, expect } = require('@playwright/test');
const { ContractModule } = require('../../pages/contract-module');
const { performLogin }   = require('../../utils/auth/login-action');
const { DealModule }     = require('../../pages/deal-module');
const {
  PROPOSAL_DATA,
  SERVICE_DATA,
  PAYMENT_DATA,
  PUBLISH_DATA,
} = require('../../utils/contract-test-data');
const {
  writeCreatedDealName,
} = require('../../utils/shared-run-state');

const targetCompanyName =
  process.env.DEAL_TEST_COMPANY ||
  process.env.CREATED_COMPANY_NAME ||
  'Regression Phase 2';
const targetPropertyName =
  process.env.DEAL_TEST_PROPERTY ||
  process.env.CREATED_PROPERTY_NAME ||
  'Regression Location Phase 2';
const targetCompanySearchText =
  process.env.DEAL_TEST_COMPANY_SEARCH ||
  (targetCompanyName.startsWith('A-C') ? 'A-C' : 'Regression');
const targetPropertySearchText =
  process.env.DEAL_TEST_PROPERTY_SEARCH ||
  'Regression Location Phase 2';

const explicitContractDealName =
  process.env.CONTRACT_TEST_DEAL ||
  process.env.CONTRACT_E2E_DEAL ||
  process.env.CREATED_DEAL_NAME ||
  '';

let resolvedContractDealName =
  process.env.CONTRACT_TEST_DEAL ||
  process.env.CONTRACT_E2E_DEAL ||
  '';

let context;
let page;
let contractModule;
let cm;

async function ensureContractTargetDeal(page) {
  if (resolvedContractDealName) {
    const dealModule = new DealModule(page);
    await dealModule.gotoDealsFromMenu();
    await dealModule.assertDealsPageOpened();
    await dealModule.searchDeal(resolvedContractDealName);

    const existingDealRowVisible = await page
      .locator('table tbody tr')
      .filter({ hasText: resolvedContractDealName })
      .first()
      .isVisible()
      .catch(() => false);

    if (existingDealRowVisible) {
      return resolvedContractDealName;
    }
  }

  const dealModule = new DealModule(page);
  resolvedContractDealName = dealModule.generateUniqueDealName();

  await dealModule.gotoDealsFromMenu();
  await dealModule.assertDealsPageOpened();
  await dealModule.createDeal({
    dealName: resolvedContractDealName,
    companySearchText: targetCompanySearchText,
    companyOptionText: targetCompanyName,
    propertySearchText: targetPropertySearchText,
    propertyOptionText: targetPropertyName,
  });
  await dealModule.assertDealCreated();
  writeCreatedDealName(resolvedContractDealName);

  return resolvedContractDealName;
}

async function ensureContractStepperReady(contractModuleInstance) {
  const currentState = await contractModuleInstance.detectContractState();

  if (currentState === 'stepper') {
    return;
  }

  if (currentState === 'proposal') {
    await contractModuleInstance.openExistingProposalEditor();
    return;
  }

  if (currentState === 'empty') {
    await contractModuleInstance.openCreateProposalDrawer();
    await contractModuleInstance.assertCreateProposalDrawerOpen();
    await contractModuleInstance.selectTimeZone(PROPOSAL_DATA.timeZone);
    await contractModuleInstance.fillStartDate(PROPOSAL_DATA.startDate);
    await contractModuleInstance.fillRenewalDate(PROPOSAL_DATA.renewalDate);
    await contractModuleInstance.submitCreateProposal();
    return;
  }

  throw new Error('Contract stepper could not be opened from current deal state.');
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(300_000);
  context = await browser.newContext();
  page = await context.newPage();
  contractModule = new ContractModule(page);
  cm = contractModule;
  await performLogin(page);
  await ensureContractTargetDeal(page);
});

test.afterAll(async () => {
  await context.close();
});

test.describe.serial('Contract & Terms Module', () => {
  test.beforeEach(async () => {
    await contractModule.gotoDealsPage();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 1 — TAB VISIBILITY & SELECTION
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-001 | Contract & Terms tab is visible on the deal detail page
   *
   * Preconditions : User is logged in; target deal exists in the system
   * Steps         :
   *   1. Navigate to Deals list
   *   2. Search for and open the target deal
   * Expected      : "Contract & Terms" tab is visible in the Overview tablist
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-001 | Contract & Terms tab is visible on deal detail page', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.assertOnDealDetailPage();
    await contractModule.assertContractTermsTabVisible();
  });

  /**
   * TC-CONTRACT-002 | Contract & Terms tab is selected by default
   *
   * Preconditions : User has opened a deal detail page
   * Expected      : "Contract & Terms" tab carries aria-selected="true" without
   *                 any manual tab click
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-002 | Contract & Terms tab is selected by default', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.assertContractTermsTabSelected();
  });

  /**
   * TC-CONTRACT-003 | All four Overview tabs are visible on the deal detail page
   *
   * Preconditions : User is on deal detail page
   * Expected      : Contract & Terms, Activities, Notes, Tasks tabs all visible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-003 | All four overview tabs are visible on deal detail page', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.assertAllTabsVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 2 — CONTRACT & TERMS EMPTY STATE
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-004 | Contract & Terms empty state renders correct UI elements
   *
   * Preconditions : Target deal has no existing proposal
   * Expected      :
   *   - Heading "Create a Proposal" (level=2) is visible
   *   - Paragraph "Create a proposal and add services" is visible
   *   - "Create Proposal" button is visible and enabled
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-004 | Contract & Terms empty state renders correct UI elements', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.assertContractTermsTabSelected();
    await contractModule.assertEmptyStateVisible();
    await expect(contractModule.createProposalBtn).toBeEnabled({ timeout: 5_000 });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 3 — CREATE PROPOSAL DRAWER: OPEN & STRUCTURE
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-005 | Clicking "Create Proposal" opens the drawer with correct heading
   *
   * Preconditions : Contract & Terms tab is active; no proposal exists
   * Steps         : Click the "Create Proposal" button in the empty state panel
   * Expected      : Drawer opens; heading "Create Proposal" (level=3) is visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-005 | Clicking Create Proposal opens the drawer with correct heading', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await expect(contractModule.createProposalDrawerHeading).toBeVisible({ timeout: 10_000 });
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-006 | Create Proposal drawer contains all expected fields
   *
   * Preconditions : Create Proposal drawer is open
   * Expected      :
   *   - Service Type radiogroup (Dedicated/Patrol + Dispatch Only) visible
   *   - Proposal Name textbox visible
   *   - Time Zone trigger heading visible
   *   - "Contract Dates to be decided" label visible
   *   - Cancel and Create Proposal (submit) buttons visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-006 | Create Proposal drawer contains all expected fields', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertCreateProposalDrawerOpen();
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-007 | Date fields are visible by default in Create Proposal drawer
   *
   * Preconditions : Create Proposal drawer is open; TBD checkbox is unchecked
   * Expected      : Start Date, End Date, Renewal Date fields are visible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-007 | Date fields are visible by default in Create Proposal drawer', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertDateFieldsVisible();
    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 4 — SERVICE TYPE RADIO GROUP
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-008 | "Dedicated / Patrol" is the default selected service type
   *
   * Preconditions : Create Proposal drawer is open
   * Expected      : "Dedicated / Patrol" radio is checked; "Dispatch Only" is unchecked
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-008 | Dedicated Patrol is the default selected service type', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertDedicatedPatrolDefault();
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-009 | Service type can be switched to "Dispatch Only"
   *
   * Preconditions : Create Proposal drawer is open
   * Steps         : Click "Dispatch Only" radio button
   * Expected      :
   *   - "Dispatch Only" radio becomes checked
   *   - "Dedicated / Patrol" radio becomes unchecked
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-009 | Service type can be switched to Dispatch Only', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();

    await contractModule.selectServiceType('dispatch');

    await expect(contractModule.dispatchOnlyRadio).toBeChecked({ timeout: 5_000 });
    await expect(contractModule.dedicatedPatrolRadio).not.toBeChecked({ timeout: 5_000 });

    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 5 — PROPOSAL NAME
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-010 | Proposal Name is pre-filled with the deal name on drawer open
   *
   * Preconditions : Create Proposal drawer is open
   * Expected      : Proposal Name textbox value equals the deal name
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-010 | Proposal Name is pre-filled with the deal name on drawer open', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertProposalNamePrefilledWithDealName(resolvedContractDealName);
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-011 | Proposal Name field accepts updated text input
   *
   * Preconditions : Create Proposal drawer is open
   * Steps         :
   *   1. Clear the Proposal Name field
   *   2. Type a new proposal name
   * Expected      : Field reflects the updated value
   * Priority      : P2 — Medium
   */
  test('TC-CONTRACT-011 | Proposal Name field accepts updated text input', async () => {
    test.setTimeout(180_000);
    const newName = `Smoke Test Proposal ${Date.now()}`;

    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.fillProposalName(newName);

    await expect(contractModule.proposalNameInput).toHaveValue(newName, { timeout: 5_000 });

    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 6 — TIME ZONE
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-012 | Time Zone trigger is visible and displays a UTC label
   *
   * Preconditions : Create Proposal drawer is open
   * Expected      : Time Zone heading (level=6) with "(UTC…)" pattern is visible
   * Priority      : P2 — Medium
   */
  test('TC-CONTRACT-012 | Time Zone trigger is visible and displays a UTC label', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertTimeZoneTriggerVisible();
    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 7 — CONTRACT DATES TO BE DECIDED CHECKBOX
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-013 | "Contract Dates to be decided" checkbox is unchecked by default
   *
   * Preconditions : Create Proposal drawer is open
   * Expected      : The checkbox is NOT checked on initial render
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-013 | Contract Dates to be decided checkbox is unchecked by default', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertContractDatesTBDUnchecked();
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-014 | Checking "Contract Dates to be decided" hides all date fields
   *
   * Preconditions : Create Proposal drawer is open; date fields are visible
   * Steps         : Click the "Contract Dates to be decided" checkbox
   * Expected      :
   *   - Checkbox becomes checked
   *   - Start Date field is no longer visible
   *   - End Date / Renewal Date radio buttons are no longer visible
   * Priority      : P0 — Critical (core conditional logic)
   */
  test('TC-CONTRACT-014 | Checking Contract Dates to be decided hides all date fields', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();

    // Verify date fields are visible initially
    await contractModule.assertDateFieldsVisible();

    // Check the TBD checkbox
    await contractModule.toggleContractDatesTBD();
    await contractModule.assertContractDatesTBDChecked();

    // Date fields must now be hidden
    await contractModule.assertDateFieldsHidden();

    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-015 | Unchecking "Contract Dates to be decided" restores date fields
   *
   * Preconditions : Create Proposal drawer is open; TBD checkbox has been checked
   * Steps         :
   *   1. Check "Contract Dates to be decided" (date fields hide)
   *   2. Uncheck "Contract Dates to be decided"
   * Expected      : Date fields reappear after unchecking
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-015 | Unchecking Contract Dates to be decided restores date fields', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();

    // Check → hide
    await contractModule.toggleContractDatesTBD();
    await contractModule.assertDateFieldsHidden();

    // Uncheck → restore
    await contractModule.toggleContractDatesTBD();
    await contractModule.assertDateFieldsVisible();

    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 8 — END DATE / RENEWAL DATE RADIO GROUP
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-016 | "Renewal Date" is the default selection in the date type radio
   *
   * Preconditions : Create Proposal drawer is open; TBD checkbox is unchecked
   * Expected      :
   *   - "Renewal Date" radio is checked
   *   - "End Date" radio is unchecked
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-016 | Renewal Date is the default selection in the date type radio', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertRenewalDateDefault();
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-017 | Selecting "End Date" radio switches the date type selection
   *
   * Preconditions : Create Proposal drawer is open; "Renewal Date" is default selected
   * Steps         : Click the "End Date" radio button
   * Expected      :
   *   - "End Date" radio becomes checked
   *   - "Renewal Date" radio becomes unchecked
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-017 | Selecting End Date radio switches the date type selection', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();

    await contractModule.selectDateType('end');

    await expect(contractModule.endDateRadio).toBeChecked({ timeout: 5_000 });
    await expect(contractModule.renewalDateRadio).not.toBeChecked({ timeout: 5_000 });

    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 9 — NOTIFY FOR RENEWAL
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-018 | "Notify for Renewal Before (Days)" spinbutton defaults to 10
   *
   * Preconditions : Create Proposal drawer is open; TBD checkbox is unchecked
   * Expected      : Spinbutton value equals "10"
   * Priority      : P2 — Medium
   */
  test('TC-CONTRACT-018 | Notify for Renewal Before Days defaults to 10', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertNotifyRenewalDefaultValue();
    await contractModule.cancelCreateProposal();
  });

  /**
   * TC-CONTRACT-019 | Notify for Renewal field is visible in default drawer state
   *
   * Preconditions : Create Proposal drawer is open; TBD checkbox is unchecked
   * Expected      : Spinbutton is visible and enabled
   * Priority      : P2 — Medium
   */
  test('TC-CONTRACT-019 | Notify for Renewal field is visible in default drawer state', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.assertNotifyRenewalVisible();
    await expect(contractModule.notifyRenewalInput).toBeEnabled({ timeout: 5_000 });
    await contractModule.cancelCreateProposal();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 10 — CANCEL / CLOSE BEHAVIOUR
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-020 | Cancel button closes the Create Proposal drawer
   *
   * Preconditions : Create Proposal drawer is open
   * Steps         : Click the "Cancel" button
   * Expected      :
   *   - Drawer closes
   *   - "Create Proposal" heading (level=3) is no longer visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-020 | Cancel button closes the Create Proposal drawer', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await expect(contractModule.createProposalDrawerHeading).toBeVisible({ timeout: 5_000 });

    await contractModule.cancelCreateProposal();

    await contractModule.assertCreateProposalDrawerClosed();
  });

  /**
   * TC-CONTRACT-021 | Cancelling Create Proposal preserves the empty state UI
   *
   * Preconditions : Create Proposal drawer has been opened and then cancelled
   * Expected      :
   *   - Empty state heading "Create a Proposal" is still visible
   *   - "Create Proposal" button is still accessible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-021 | Cancelling Create Proposal preserves the empty state UI', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);
    await contractModule.openCreateProposalDrawer();
    await contractModule.cancelCreateProposal();

    // Empty state must be intact — no proposal was created
    await contractModule.assertEmptyStateVisible();
  });

  /**
   * TC-CONTRACT-022 | Create Proposal drawer can be reopened after cancel
   *
   * Preconditions : Create Proposal drawer was cancelled
   * Steps         :
   *   1. Cancel the drawer
   *   2. Click "Create Proposal" button again
   * Expected      : Drawer reopens successfully with the heading visible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-022 | Create Proposal drawer can be reopened after cancel', async () => {
    test.setTimeout(180_000);
    await contractModule.openDealDetail(resolvedContractDealName);

    // First open + cancel
    await contractModule.openCreateProposalDrawer();
    await contractModule.cancelCreateProposal();
    await contractModule.assertCreateProposalDrawerClosed();

    // Reopen
    await contractModule.openCreateProposalDrawer();
    await expect(contractModule.createProposalDrawerHeading).toBeVisible({ timeout: 10_000 });

    await contractModule.cancelCreateProposal();
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  E2E FULL FLOW — Create Proposal → 6 Stepper Steps → Close Deal → Publish
// ══════════════════════════════════════════════════════════════════════════
//
//  ⚠️  PREREQUISITE: The deal specified by CONTRACT_E2E_DEAL must have
//      NO existing proposal (empty state) before running this suite.
//      After running, the deal will be CLOSED WON with a PUBLISHED contract.
//      Re-running requires a fresh deal or manual cleanup of the existing one.
//
//  Two-step publish flow (live-verified 2026-03-24):
//    STEP A — "Publish Contract" (deal not closed) → Close Deal modal appears
//             → Select Closed Won + Hubspot Stage → Save → deal closes
//    STEP B — "Publish Contract" again (deal now closed) → "Publish contract!"
//             confirmation modal → Confirm → contract published
//             "Published without sign" badge appears; button disappears.
//
//  Test data:
//    All values are resolved from utils/contract-test-data.js.
//    Override via environment variables or data/test-data.json — no spec edits needed.
//    See utils/contract-test-data.js for the full list of accepted env vars.
//
// ══════════════════════════════════════════════════════════════════════════

test.describe.serial('Contract Module — E2E Full Create & Publish', () => {

  // All test data is resolved dynamically from utils/contract-test-data.js.
  // To override any value, set the corresponding environment variable or edit
  // data/test-data.json — no changes to this spec file are needed.
  // See utils/contract-test-data.js for the full list of accepted env vars.

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 11 — CREATE PROPOSAL DRAWER SUBMISSION
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-001 | Navigate to E2E deal and verify empty state
   *
   * Preconditions : Deal specified by CONTRACT_E2E_DEAL has no existing proposal
   * Steps         :
   *   1. Navigate to Deals list
   *   2. Open the E2E deal
   *   3. Assert Contract & Terms tab is active and empty state is visible
   * Expected      : Empty state heading and "Create Proposal" button are visible
   * Priority      : P0 — Critical (prerequisite for entire E2E suite)
   */
  test('TC-CONTRACT-E2E-001 | Navigate to E2E deal and verify empty state', async () => {
    test.setTimeout(180_000);
    await cm.gotoDealsPage();
    await cm.openDealDetail(resolvedContractDealName);
    await cm.assertOnDealDetailPage();
    const currentState = await cm.detectContractState();
    expect(['empty', 'proposal', 'stepper']).toContain(currentState);
  });

  /**
   * TC-CONTRACT-E2E-002 | Fill Create Proposal drawer and submit → stepper opens
   *
   * Preconditions : Empty state is visible on target deal
   * Steps         :
   *   1. Click "Create Proposal" button
   *   2. Fill Start Date (dynamically set to today + 1 day) and verify Renewal Date radio visible
   *   3. Submit the drawer
   * Expected      :
   *   - URL changes to /app/sales/deals/deal/:id/contract/:contractId
   *   - All 6 stepper step tabs are visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-002 | Fill Create Proposal drawer and submit — stepper opens', async () => {
    test.setTimeout(180_000);
    await ensureContractStepperReady(cm);
    await cm.assertOnStepperPage();
    await cm.assertStepperTabsVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 12 — STEP 1: SERVICES
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-003 | Step 1 Services is visible with required fields
   *
   * Preconditions : Stepper is open on Step 1
   * Expected      :
   *   - "1. Services" step tab heading is visible
   *   - Service Name textbox is visible
   *   - "Save & Next" button is visible (disabled until required fields filled)
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-003 | Step 1 Services is visible with all required fields', async () => {
    test.setTimeout(60_000);
    await cm.assertStep1Visible();
    await expect(cm.saveAndNextBtn).toBeVisible({ timeout: 5_000 });
    await expect(cm.dedicatedServiceRadio).toBeVisible({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-004 | Fill all required fields on Step 1 and advance to Step 2
   *
   * Preconditions : Step 1 Services is visible
   * Steps         :
   *   1. Fill Service Name: "Automation Service 1"
   *   2. Fill Officer/Guard count: 1
   *   3. Fill Hourly Rate: 15
   *   4. Click job day "Mon"
   *   5. Set Start Time: 08:00 AM
   *   6. Set End Time: 05:00 PM
   *   7. Click "Save & Next"
   * Expected      :
   *   - "Save & Next" becomes enabled after all required fields are filled
   *   - "Checkpoints & Devices" heading (Step 2) becomes visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-004 | Fill Step 1 Services and advance to Step 2', async () => {
    test.setTimeout(120_000);
    await cm.fillStep1Services(SERVICE_DATA);

    await expect(cm.saveAndNextBtn).toBeEnabled({ timeout: 8_000 });
    await cm.clickSaveAndNext();
    await cm.assertStep2Visible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 13 — STEP 2: DEVICES
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-005 | Step 2 Devices is visible with device options
   *
   * Preconditions : Step 2 Devices is active
   * Expected      :
   *   - "Checkpoints & Devices" heading (level=3) is visible
   *   - NFC Tags, Beacons, QR Tags device rows are visible
   *   - Total heading shows "Total: 0.00"
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-E2E-005 | Step 2 Devices shows Checkpoints and Devices heading', async () => {
    test.setTimeout(60_000);
    await cm.assertStep2Visible();
    await expect(cm.devicesTotalHeading).toBeVisible({ timeout: 5_000 });
    // Verify device names are present
    await expect(page.getByRole('heading', { name: 'NFC Tags',  level: 6 })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Beacons',   level: 6 })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'QR Tags',   level: 6 })).toBeVisible({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-006 | Add NFC Tag quantity and advance to Step 3
   *
   * Preconditions : Step 2 Devices is active; all device quantities are 0
   * Steps         :
   *   1. Click "+" for NFC Tags once (quantity becomes 1)
   *   2. Click "Save & Next"
   * Expected      :
   *   - NFC Tags total updates (30.00)
   *   - "Additional Services Pricing" heading (Step 3) becomes visible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-E2E-006 | Add NFC Tag quantity and advance to Step 3', async () => {
    test.setTimeout(60_000);
    await cm.addDeviceQuantity('NFC Tags', 1);
    await expect(page.getByRole('heading', { name: /Total:\s*\$30\.00/, level: 5 })).toBeVisible({ timeout: 5_000 });
    const saveEnabled = await cm.saveAndNextBtn.isEnabled().catch(() => false);
    if (saveEnabled) {
      await cm.clickSaveAndNext();
    } else {
      await cm.goToStep3FromDevices();
    }
    await cm.assertStep3Visible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 14 — STEP 3: ON DEMAND
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-007 | Step 3 On Demand is visible and advances to Step 4
   *
   * Preconditions : Step 3 On Demand is active
   * Steps         :
   *   1. Assert "Additional Services Pricing" heading is visible
   *   2. Click "Save & Next"
   * Expected      :
   *   - "Select Billing Occurrence" heading (Step 4) becomes visible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-E2E-007 | Step 3 On Demand is visible and advances to Step 4', async () => {
    test.setTimeout(60_000);
    await cm.assertStep3Visible();
    await cm.clickSaveAndNext();
    const step4Visible = await cm.billingOccurrenceHeading.isVisible().catch(() => false);
    if (!step4Visible) {
      await cm.stepperStep4.click({ force: true });
    }
    await cm.assertStep4Visible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 15 — STEP 4: PAYMENT TERMS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-008 | Step 4 Payment Terms shows all three sections
   *
   * Preconditions : Step 4 Payment Terms is active
   * Expected      :
   *   - "Select Billing Occurrence" section heading visible
   *   - "Define Payment Terms" section heading visible
   *   - "Billing Information" section heading visible
   *   - Annual Rate Increase spinbutton visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-008 | Step 4 Payment Terms shows all three sections', async () => {
    test.setTimeout(60_000);
    await cm.assertStep4Visible();
    await expect(cm.definePaymentTermsHeading).toBeVisible({ timeout: 5_000 });
    await expect(cm.billingInfoHeading).toBeVisible({ timeout: 5_000 });
    await expect(cm.annualRateIncreaseInput).toBeVisible({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-009 | Fill all required fields on Step 4 and advance to Step 5
   *
   * Preconditions : Step 4 Payment Terms is active with all sections visible
   * Steps         :
   *   1. Fill Annual Rate Increase: 3
   *   2. Select Billing Type: Pre Bill
   *   3. Select Contract Type: Ongoing
   *   4. Select Billing Frequency: Weekly
   *   5. Select Payment Terms: Net 30
   *   6. Select Payment Method: Bank Transfer
   *   7. Select Cycle Reference Date: 25th of current month
   *   8. Fill billing contact: First Name, Last Name, Email, Phone
   *   9. Click "Save & Next"
   * Expected      :
   *   - "Description of Services" heading (Step 5) becomes visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-009 | Fill Step 4 Payment Terms and advance to Step 5', async () => {
    test.setTimeout(120_000);
    await cm.fillStep4PaymentTerms(PAYMENT_DATA);
    await cm.clickSaveAndNext();
    await cm.assertStep5Visible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 16 — STEP 5: DESCRIPTION
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-010 | Step 5 Description has pre-filled content and advances
   *
   * Preconditions : Step 5 Description is active
   * Steps         :
   *   1. Assert "Description of Services" heading is visible
   *   2. Assert description editor contains pre-filled content
   *   3. Click "Save & Next"
   * Expected      :
   *   - "Select signees for this contract" heading (Step 6) becomes visible
   * Priority      : P1 — High
   */
  test('TC-CONTRACT-E2E-010 | Step 5 Description is pre-filled and advances to Step 6', async () => {
    test.setTimeout(60_000);
    await cm.assertStep5Visible();
    // Description editor should be pre-filled (character count > 0)
    await expect(page.getByText(/\d+ \/ 3550/)).toBeVisible({ timeout: 5_000 });
    await cm.clickSaveAndNext();
    await cm.assertStep6Visible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 17 — STEP 6: SIGNEES
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-011 | Step 6 Signees has a default signee and shows Finish button
   *
   * Preconditions : Step 6 Signees is active
   * Expected      :
   *   - "Select signees for this contract" heading is visible
   *   - "Signee 1" card (logged-in user) is visible
   *   - "Finish" button is visible and enabled
   *   - "Preview" button is visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-011 | Step 6 Signees shows default signee and Finish button', async () => {
    test.setTimeout(60_000);
    await cm.assertStep6Visible();
    await cm.assertDefaultSigneeVisible();
    await expect(cm.finishBtn).toBeVisible({ timeout: 5_000 });
    await expect(cm.finishBtn).toBeEnabled({ timeout: 5_000 });
    await expect(cm.previewBtn).toBeVisible({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-012 | Clicking Finish completes stepper and returns to Deal Detail
   *
   * Preconditions : Step 6 Signees is active; "Finish" button is enabled
   * Steps         : Click the "Finish" button
   * Expected      :
   *   - URL returns to /app/sales/deals/deal/:id (without /contract/ segment)
   *   - "Publish Contract" button is visible on the Contract & Terms tabpanel
   *   - "Signature" button is visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-012 | Clicking Finish returns to Deal Detail with proposal card', async () => {
    test.setTimeout(60_000);
    await cm.clickFinish();
    await cm.assertOnDealDetailPage();
    await cm.assertProposalCardVisible();
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 18 — PUBLISH FLOW STEP A: CLOSE DEAL
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-013 | Proposal card shows Publish Contract button
   *
   * Preconditions : Back on Deal Detail; proposal card is visible
   * Expected      :
   *   - "Publish Contract" button is visible and enabled
   *   - "Signature", "Edit", "Clone", "Preview PDF" action buttons are visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-013 | Proposal card is visible with Publish Contract button', async () => {
    test.setTimeout(60_000);
    await cm.assertProposalCardVisible();
    await expect(cm.publishContractBtn).toBeEnabled({ timeout: 5_000 });
    // Action buttons visible
    await expect(cm.signatureBtnOnCard).toBeVisible({ timeout: 5_000 });
    await expect(cm.editProposalAction).toBeVisible({ timeout: 5_000 });
    await expect(cm.cloneProposalAction).toBeVisible({ timeout: 5_000 });
    await expect(cm.previewPdfAction).toBeVisible({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-014 | Clicking Publish Contract (deal open) opens Close Deal modal
   *
   * Preconditions : Deal is NOT yet closed; "Publish Contract" button is enabled
   * Steps         : Click "Publish Contract" button
   * Expected      :
   *   - "Close Deal" modal appears (heading level=3)
   *   - "Closed Won" and "Closed Lost" radio buttons are visible
   *   - "Closed Lost" is selected by default
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-014 | Clicking Publish Contract opens Close Deal modal', async () => {
    test.setTimeout(60_000);
    await cm.clickPublishContractToCloseDeal();
    await cm.assertCloseDealModalOpen();
    // Default is Closed Lost
    await expect(cm.closedLostRadio).toBeChecked({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-015 | Select Closed Won + Hubspot Stage enables Save button
   *
   * Preconditions : Close Deal modal is open
   * Steps         :
   *   1. Click "Closed Won" radio
   *   2. Select "Closed Won (Sales Pipeline)" from Hubspot Stage dropdown
   * Expected      :
   *   - "Closed Won" radio becomes checked
   *   - Save button becomes enabled
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-015 | Select Closed Won and Hubspot Stage enables Save button', async () => {
    test.setTimeout(60_000);
    await cm.selectCloseStatus(PUBLISH_DATA.closeStatus);
    await expect(cm.closedWonRadio).toBeChecked({ timeout: 5_000 });

    await cm.selectHubspotStage(PUBLISH_DATA.hubspotStage);
    await expect(cm.publishSaveBtn).toBeEnabled({ timeout: 5_000 });
  });

  /**
   * TC-CONTRACT-E2E-016 | Save in Close Deal modal closes the deal
   *
   * Preconditions : "Closed Won" selected + Hubspot Stage selected; Save enabled
   * Steps         : Click Save
   * Expected      :
   *   - "Deal closed successfully!" heading is visible
   *   - Deal Stages shows "Closed Won" as the active stage
   *   - "Publish Contract" button is still visible (contract not yet published)
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-016 | Saving Close Deal closes the deal successfully', async () => {
    test.setTimeout(60_000);
    await cm.saveCloseDeal();
    await cm.assertDealClosedSuccessfully();
    await cm.assertDealStageClosedWon();
    // Publish Contract button must still be visible — actual publish hasn't happened yet
    await expect(cm.publishContractBtn).toBeVisible({ timeout: 10_000 });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  SECTION 19 — PUBLISH FLOW STEP B: ACTUAL CONTRACT PUBLISH
  // ══════════════════════════════════════════════════════════════════════

  /**
   * TC-CONTRACT-E2E-017 | Clicking Publish Contract (deal closed) opens confirm modal
   *
   * Preconditions : Deal is now Closed Won; "Publish Contract" button still visible
   * Steps         : Click "Publish Contract" button
   * Expected      :
   *   - "Publish contract!" confirmation modal appears (heading level=4)
   *   - Warning text about irreversibility is visible
   *   - Cancel and "Publish Contract" confirm buttons are visible
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-017 | Clicking Publish Contract after deal close opens confirm modal', async () => {
    test.setTimeout(60_000);
    await cm.clickPublishContractToConfirm();
    await cm.assertPublishConfirmModalOpen();
  });

  /**
   * TC-CONTRACT-E2E-018 | Confirming publish marks the contract as Published
   *
   * Preconditions : "Publish contract!" confirmation modal is open
   * Steps         : Click the "Publish Contract" confirm button inside the modal
   * Expected      :
   *   - Modal closes
   *   - "Published without sign" status badge appears on the proposal card
   *   - "Publish Contract" button disappears from the card
   *   - "Terminate" action replaces "Delete" on the proposal card
   * Priority      : P0 — Critical
   */
  test('TC-CONTRACT-E2E-018 | Confirming Publish Contract marks the contract as Published', async () => {
    test.setTimeout(60_000);
    await cm.confirmPublishContract();
    await cm.assertContractPublishedSuccessfully();
  });
});
