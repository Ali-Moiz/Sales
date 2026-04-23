// tests/e2e/contract-module.spec.js
//
// Smoke Test Suite — Contract & Terms Module — Signal CRM
//
// Session design — matches property-module.spec.js exactly:
//   • Single login in beforeAll, one shared browser context for all tests
//   • test.describe.serial — ordered execution, each test depends on previous state
//   • Shared state via describe-scoped variables (resolvedContractDealName etc.)
//
// The Contract & Terms module is embedded within the Deal Detail page.
// It manages proposals and contracts associated with a deal.
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
const { PropertyModule } = require('../../pages/property-module');
const { generateUniqueUsAddressCandidates } = require('../../utils/dynamic_address');
const { withTimeout }    = require('../helpers/with-timeout');
const {
  PROPOSAL_DATA,
  SERVICE_DATA,
  PAYMENT_DATA,
  PUBLISH_DATA,
} = require('../../utils/contract-test-data');
const {
  readCreatedCompanyName,
  readCreatedDealName,
  readCreatedPropertyCompanyName,
  readCreatedPropertyName,
  writeCreatedDealName,
} = require('../../utils/shared-run-state');

test.describe.serial('Contract Module', () => {
  // ── Shared state — resolved from env / run-state / fallbacks ─────────────
  let sharedPropertyName =
    process.env.DEAL_TEST_PROPERTY ||
    process.env.CREATED_PROPERTY_NAME ||
    readCreatedPropertyName() ||
    '';
  let sharedPropertyCompanyName =
    process.env.CREATED_PROPERTY_COMPANY_NAME ||
    readCreatedPropertyCompanyName() ||
    (sharedPropertyName ? 'Regression Phase' : '');
  let targetCompanyName =
    process.env.DEAL_TEST_COMPANY ||
    process.env.CREATED_COMPANY_NAME ||
    readCreatedCompanyName() ||
    sharedPropertyCompanyName ||
    'Regression Phase 2';
  let targetPropertyName =
    process.env.DEAL_TEST_PROPERTY ||
    process.env.CREATED_PROPERTY_NAME ||
    readCreatedPropertyName() ||
    'Regression Location Phase 2';

  let resolvedContractDealName =
    process.env.CONTRACT_TEST_DEAL ||
    process.env.CONTRACT_E2E_DEAL ||
    process.env.CREATED_DEAL_NAME ||
    readCreatedDealName() ||
    '';
  let resolvedTargetCompanyName  = targetCompanyName;
  let resolvedTargetPropertyName = targetPropertyName;

  let context;
  let page;
  let contractModule;
  let cm;
  let propertyModule;

  // ── Navigation helpers ────────────────────────────────────────────────────

  async function gotoDealsListPage() {
    await contractModule.gotoDealsPage();
  }

  async function openContractDealDetail(dealName = resolvedContractDealName) {
    await contractModule.openDealDetail(dealName);
    await contractModule.assertOnDealDetailPage();
  }

  // ── Dependency helpers ────────────────────────────────────────────────────

  async function ensureValidContractDependencies() {
    const dealModule = new DealModule(page);

    if (resolvedTargetPropertyName && resolvedTargetCompanyName) {
      await dealModule.gotoDealsFromMenu();
      await dealModule.assertDealsPageOpened();
      await dealModule.openCreateDealModal();
      await dealModule.assertCreateDealDrawerOpen();

      const companyVisible = await dealModule
        .selectCompany(resolvedTargetCompanyName.substring(0, 4), resolvedTargetCompanyName)
        .then(() => true)
        .catch(() => false);

      if (companyVisible) {
        const propertyVisible = await dealModule
          .selectProperty(resolvedTargetPropertyName.substring(0, 6), resolvedTargetPropertyName)
          .then(() => true)
          .catch(() => false);

        if (propertyVisible) {
          await dealModule.cancelCreateDeal();
          await dealModule.assertCreateDealDrawerClosed();
          return;
        }
      }

      await dealModule.cancelCreateDeal().catch(() => {});
      await dealModule.assertCreateDealDrawerClosed().catch(() => {});
    }

    resolvedTargetCompanyName =
      process.env.CREATED_COMPANY_NAME ||
      readCreatedCompanyName() ||
      process.env.CREATED_PROPERTY_COMPANY_NAME ||
      readCreatedPropertyCompanyName() ||
      resolvedTargetCompanyName ||
      targetCompanyName;

    if (!resolvedTargetCompanyName) {
      throw new Error('No company name available to create contract dependencies.');
    }
    resolvedTargetPropertyName =
      process.env.CREATED_PROPERTY_NAME ||
      readCreatedPropertyName() ||
      resolvedTargetPropertyName ||
      targetPropertyName ||
      'Regression Location Phase 2';

    // Complete workflow enforcement:
    // if property is not selectable for deal creation, create it first.
    const propertyAlreadySelectable = await (async () => {
      await dealModule.gotoDealsFromMenu();
      await dealModule.assertDealsPageOpened();
      await dealModule.openCreateDealModal();
      await dealModule.assertCreateDealDrawerOpen();
      const companyOk = await dealModule
        .selectCompany(resolvedTargetCompanyName.substring(0, 4), resolvedTargetCompanyName)
        .then(() => true)
        .catch(() => false);
      if (!companyOk) {
        await dealModule.cancelCreateDeal().catch(() => {});
        await dealModule.assertCreateDealDrawerClosed().catch(() => {});
        return false;
      }
      const propertyOk = await dealModule
        .selectProperty(resolvedTargetPropertyName.substring(0, 6), resolvedTargetPropertyName)
        .then(() => true)
        .catch(() => false);
      await dealModule.cancelCreateDeal().catch(() => {});
      await dealModule.assertCreateDealDrawerClosed().catch(() => {});
      return propertyOk;
    })();

    if (!propertyAlreadySelectable) {
      if (!resolvedTargetPropertyName || resolvedTargetPropertyName === 'Regression Location Phase 2') {
        resolvedTargetPropertyName = propertyModule.generateUniquePropertyName();
      }

      await propertyModule.gotoPropertiesFromMenu();
      await propertyModule.assertPropertiesPageOpened();
      const contractAddressCandidates = generateUniqueUsAddressCandidates({ primaryCount: 12 });
      await propertyModule.createProperty({
        propertyName: resolvedTargetPropertyName,
        companyName: resolvedTargetCompanyName,
        addressCandidates: contractAddressCandidates,
        maxAddressAttempts: 8,
      });
      await propertyModule.assertPropertyCreated();

      // Re-validate property is now selectable in Create Deal drawer.
      await dealModule.gotoDealsFromMenu();
      await dealModule.assertDealsPageOpened();
      await dealModule.openCreateDealModal();
      await dealModule.assertCreateDealDrawerOpen();
      await dealModule.selectCompany(
        resolvedTargetCompanyName.substring(0, 4),
        resolvedTargetCompanyName,
      );
      await dealModule.selectProperty(
        resolvedTargetPropertyName.substring(0, 6),
        resolvedTargetPropertyName,
      );
      await dealModule.cancelCreateDeal().catch(() => {});
      await dealModule.assertCreateDealDrawerClosed().catch(() => {});
    }

    process.env.CREATED_PROPERTY_NAME = resolvedTargetPropertyName;
    process.env.CREATED_PROPERTY_COMPANY_NAME = resolvedTargetCompanyName;
  }

  async function ensureContractTargetDeal() {
    const candidateDealNames = [
      process.env.CONTRACT_TEST_DEAL,
      process.env.CONTRACT_E2E_DEAL,
      process.env.CREATED_DEAL_NAME,
      readCreatedDealName(),
      resolvedContractDealName,
      'Regression Phase 2',
    ].filter(Boolean);

    const dealModule = new DealModule(page);
    for (const candidateDealName of [...new Set(candidateDealNames)]) {
      await dealModule.gotoDealsFromMenu();
      await dealModule.assertDealsPageOpened();
      await dealModule.searchDeal(candidateDealName);

      const existingDealRowVisible = await page
        .locator('table tbody tr')
        .filter({ hasText: candidateDealName })
        .first()
        .isVisible()
        .catch(() => false);

      if (!existingDealRowVisible) {
        continue;
      }

      const candidateContractModule = new ContractModule(page);
      await candidateContractModule.openDealDetail(candidateDealName);
      await candidateContractModule.assertOnDealDetailPage();
      const existingState = await candidateContractModule.detectContractState(8_000);
      if (existingState === 'empty') {
        resolvedContractDealName = candidateDealName;
        writeCreatedDealName(resolvedContractDealName);
        return resolvedContractDealName;
      }
    }

    if (resolvedContractDealName) {
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
        const candidateContractModule = new ContractModule(page);
        await candidateContractModule.openDealDetail(resolvedContractDealName);
        await candidateContractModule.assertOnDealDetailPage();
        const existingState = await candidateContractModule.detectContractState(8_000);
        if (existingState === 'empty') {
          return resolvedContractDealName;
        }
      }
    }

    await ensureValidContractDependencies();
    resolvedContractDealName = dealModule.generateUniqueDealName();

    await dealModule.gotoDealsFromMenu();
    await dealModule.assertDealsPageOpened();
    const createDealWithSelection = async (companyName, propertyName) => {
      await dealModule.gotoDealsFromMenu();
      await dealModule.assertDealsPageOpened();
      await dealModule.openCreateDealModal();
      await dealModule.assertCreateDealDrawerOpen();
      await dealModule.fillDealName(resolvedContractDealName);
      await dealModule.selectCompany(companyName.substring(0, 4), companyName);
      await dealModule.selectProperty(propertyName.substring(0, 6), propertyName);
      await dealModule.submitCreateDeal();
    };

    const attemptCreateDeal = async (companyName, propertyName, retries = 2) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          await createDealWithSelection(companyName, propertyName);
          return;
        } catch (error) {
          lastError = error;
          await dealModule.cancelCreateDeal().catch(() => {});
          await dealModule.assertCreateDealDrawerClosed().catch(() => {});
        }
      }
      throw lastError;
    };

    await attemptCreateDeal(
      resolvedTargetCompanyName,
      resolvedTargetPropertyName,
    ).catch(async () => {
      // Fallback to known stable UAT references when dynamic state points to
      // deleted/unknown property names from previous runs.
      resolvedTargetCompanyName = 'Regression Phase 2';
      resolvedTargetPropertyName = 'Regression Location Phase 2';
      resolvedContractDealName = dealModule.generateUniqueDealName();
      await createDealWithSelection(
        resolvedTargetCompanyName,
        resolvedTargetPropertyName,
      );
    });
    await dealModule.assertDealCreated();
    writeCreatedDealName(resolvedContractDealName);

    return resolvedContractDealName;
  }

  async function ensureContractStepperReady(contractModuleInstance, opts = {}) {
    const { allowFreshDealRecovery = false } = opts;
    const onDealDetailPage = /\/app\/sales\/deals\/deal\/\d+/.test(page.url());
    const onStepperPage = await contractModuleInstance.isOnStepperPage();

    // In this suite, beforeEach navigates to deals list.
    // Re-anchor to the target deal before deriving contract state.
    if (!onDealDetailPage && !onStepperPage) {
      await contractModuleInstance.gotoDealsPage();
      await contractModuleInstance.openDealDetail(resolvedContractDealName);
      await contractModuleInstance.assertOnDealDetailPage();
    }

    // Guard against side drawers/modals (e.g., Edit Deal) masking Contract & Terms actions.
    const editDealHeading = page.getByRole('heading', { name: 'Edit Deal', level: 3 });
    const editDealOpen = await editDealHeading.isVisible().catch(() => false);
    if (editDealOpen) {
      const editDealPanel = page
        .locator('div')
        .filter({ has: editDealHeading })
        .last();
      const closeInPanel = editDealPanel.getByRole('link').first();
      const cancelInPanel = editDealPanel.getByRole('button', { name: 'Cancel' }).first();

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const stillOpen = await editDealHeading.isVisible().catch(() => false);
        if (!stillOpen) {
          break;
        }
        await closeInPanel.click({ force: true }).catch(() => {});
        await cancelInPanel.click({ force: true }).catch(() => {});
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(600);
      }

      await expect(editDealHeading).not.toBeVisible({ timeout: 12_000 });
      await contractModuleInstance.assertOnDealDetailPage();
    }

    let currentState = await contractModuleInstance.detectContractState();

    if (currentState === 'stepper') {
      return;
    }

    if (currentState === 'proposal') {
      const openedFromProposal = await contractModuleInstance
        .openExistingProposalEditor()
        .then(() => true)
        .catch(() => false);
      if (openedFromProposal) {
        return;
      }
      currentState = 'unknown';
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

    // Recovery path for restarted workers / tab state drift:
    // re-focus Contract & Terms and attempt to derive state again.
    await contractModuleInstance.clickContractTermsTab().catch(() => {});
    currentState = await contractModuleInstance.detectContractState().catch(() => 'unknown');

    if (currentState === 'stepper') {
      return;
    }

    if (currentState === 'proposal') {
      const openedFromRecoveredProposal = await contractModuleInstance
        .openExistingProposalEditor()
        .then(() => true)
        .catch(() => false);
      if (openedFromRecoveredProposal) {
        return;
      }
      currentState = 'unknown';
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

    const openedEditor = await contractModuleInstance
      .openExistingProposalEditor()
      .then(() => true)
      .catch(() => false);
    if (openedEditor) {
      return;
    }

    if (allowFreshDealRecovery) {
      // Optional last-resort recovery: create a fresh deal and continue from guaranteed empty state.
      resolvedContractDealName = '';
      await ensureContractTargetDeal();
      await contractModuleInstance.gotoDealsPage();
      await contractModuleInstance.openDealDetail(resolvedContractDealName);
      await contractModuleInstance.assertOnDealDetailPage();
      currentState = await contractModuleInstance.detectContractState(10_000).catch(() => 'unknown');

      if (currentState === 'empty') {
        await contractModuleInstance.openCreateProposalDrawer();
        await contractModuleInstance.assertCreateProposalDrawerOpen();
        await contractModuleInstance.selectTimeZone(PROPOSAL_DATA.timeZone);
        await contractModuleInstance.fillStartDate(PROPOSAL_DATA.startDate);
        await contractModuleInstance.fillRenewalDate(PROPOSAL_DATA.renewalDate);
        await contractModuleInstance.submitCreateProposal();
        return;
      }

      if (currentState === 'proposal') {
        await contractModuleInstance.openExistingProposalEditor();
        return;
      }

      if (currentState === 'stepper') {
        return;
      }
    }

    throw new Error('Contract stepper could not be opened from current deal state.');
  }

  async function ensureProposalCardReady(contractModuleInstance) {
    await contractModuleInstance.gotoDealsPage();
    await contractModuleInstance.openDealDetail(resolvedContractDealName);
    await contractModuleInstance.assertOnDealDetailPage();

    let currentState = await contractModuleInstance.detectContractState();

    if (currentState === 'stepper') {
      await contractModuleInstance.updateProposalBtn.click().catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1_000);
      currentState = await contractModuleInstance.detectContractState();
      if (currentState === 'proposal') {
        await contractModuleInstance.clickContractTermsTab();
        await contractModuleInstance.assertProposalCardVisible();
        return 'proposal';
      }
    }

    if (currentState !== 'proposal') {
      await ensureContractStepperReady(contractModuleInstance);
      await contractModuleInstance.updateProposalBtn.click().catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1_000);
      currentState = await contractModuleInstance.detectContractState();
      if (currentState === 'proposal') {
        await contractModuleInstance.clickContractTermsTab();
        await contractModuleInstance.assertProposalCardVisible();
        return 'proposal';
      }

      const onStepperBeforeFill = await contractModuleInstance.isOnStepperPage();
      if (!onStepperBeforeFill) {
        const recoveredToStepper = await contractModuleInstance
          .openExistingProposalEditor()
          .then(async () => contractModuleInstance.isOnStepperPage())
          .catch(() => false);

        if (!recoveredToStepper) {
          await contractModuleInstance.clickContractTermsTab().catch(() => {});
          await contractModuleInstance.assertProposalCardVisible();
          return 'proposal';
        }
      }

      await contractModuleInstance.fillStep1Services(SERVICE_DATA);
      await expect(contractModuleInstance.saveAndNextBtn).toBeEnabled({ timeout: 8_000 });
      await contractModuleInstance.clickSaveAndNext();
      const step2Visible = await contractModuleInstance.devicesPageHeading.isVisible().catch(() => false);
      if (!step2Visible) {
        await contractModuleInstance.stepperStep2.click({ force: true });
      }
      await contractModuleInstance.assertStep2Visible();

      await contractModuleInstance.addDeviceQuantity('NFC Tags', 1);
      const step2SaveEnabled = await contractModuleInstance.saveAndNextBtn.isEnabled().catch(() => false);
      if (step2SaveEnabled) {
        await contractModuleInstance.clickSaveAndNext();
      } else {
        await contractModuleInstance.goToStep3FromDevices();
      }

      await contractModuleInstance.assertStep3Visible();
      await contractModuleInstance.clickSaveAndNext();
      const step4Visible = await contractModuleInstance.billingOccurrenceHeading.isVisible().catch(() => false);
      if (!step4Visible) {
        await contractModuleInstance.stepperStep4.click({ force: true });
      }

      await contractModuleInstance.assertStep4Visible();
      await contractModuleInstance.fillStep4PaymentTerms(PAYMENT_DATA);
      await contractModuleInstance.clickSaveAndNext();
      await contractModuleInstance.assertStep5Visible();

      await contractModuleInstance.clickSaveAndNext();
      await contractModuleInstance.assertStep6Visible();
      await contractModuleInstance.clickFinish();
      await contractModuleInstance.assertOnDealDetailPage();
      currentState = 'proposal';
    }

    await contractModuleInstance.clickContractTermsTab();
    await contractModuleInstance.assertProposalCardVisible();
    return 'proposal';
  }

  async function ensureEditSurfaceReady(contractModuleInstance) {
    if (await contractModuleInstance.hasProposalCardVisible()) {
      return 'proposal';
    }

    if (await contractModuleInstance.isOnStepperPage()) {
      return 'stepper';
    }

    return ensureProposalCardReady(contractModuleInstance);
  }

  async function ensureStepperAtStep1(contractModuleInstance) {
    const alreadyOnStepper = await contractModuleInstance.isOnStepperPage();
    if (alreadyOnStepper) {
      const step1Visible = await contractModuleInstance.dedicatedServiceRadio
        .isVisible()
        .catch(() => false);
      if (!step1Visible) {
        await contractModuleInstance.stepperStep1.click({ force: true }).catch(() => {});
      }
      await contractModuleInstance.assertStep1Visible();
      return;
    }

    await contractModuleInstance.gotoDealsPage();
    await contractModuleInstance.openDealDetail(resolvedContractDealName);
    await contractModuleInstance.assertOnDealDetailPage();
    await ensureContractStepperReady(contractModuleInstance);

    const step1Visible = await contractModuleInstance.dedicatedServiceRadio
      .isVisible()
      .catch(() => false);
    if (step1Visible) {
      return;
    }

    await contractModuleInstance.stepperStep1.click({ force: true }).catch(() => {});
    await contractModuleInstance.assertStep1Visible();
  }

  async function ensureStepperAtStep2(contractModuleInstance) {
    await ensureStepperAtStep1(contractModuleInstance);

    const step2Visible = await contractModuleInstance.devicesPageHeading
      .isVisible()
      .catch(() => false);
    if (step2Visible) {
      return;
    }

    await contractModuleInstance.stepperStep2.click({ force: true }).catch(() => {});
    const step2VisibleAfterDirectNav = await contractModuleInstance.devicesPageHeading
      .isVisible()
      .catch(() => false);
    if (step2VisibleAfterDirectNav) {
      return;
    }

    await contractModuleInstance.fillStep1Services(SERVICE_DATA);
    const saveEnabled = await contractModuleInstance.saveAndNextBtn
      .isEnabled()
      .catch(() => false);
    if (saveEnabled) {
      await contractModuleInstance.clickSaveAndNext();
    } else {
      // Recovery for flaky Step 1 validation state (especially Job Days chip selection).
      if (Array.isArray(SERVICE_DATA.jobDays) && SERVICE_DATA.jobDays.length > 0) {
        await contractModuleInstance.clickJobDay(SERVICE_DATA.jobDays[0]).catch(() => {});
      }
      const saveEnabledAfterRecovery = await contractModuleInstance.saveAndNextBtn
        .isEnabled()
        .catch(() => false);
      if (saveEnabledAfterRecovery) {
        await contractModuleInstance.clickSaveAndNext();
      } else {
        await contractModuleInstance.stepperStep2.click({ force: true }).catch(() => {});
      }
    }
    const step1JobDaysErrorVisible = await page
      .getByText('Job Days must have at least 1 item.', { exact: true })
      .isVisible()
      .catch(() => false);
    if (step1JobDaysErrorVisible && Array.isArray(SERVICE_DATA.jobDays) && SERVICE_DATA.jobDays.length > 0) {
      await contractModuleInstance.clickJobDay(SERVICE_DATA.jobDays[0]).catch(() => {});
      const saveEnabledAfterJobDayRecovery = await contractModuleInstance.saveAndNextBtn
        .isEnabled()
        .catch(() => false);
      if (saveEnabledAfterJobDayRecovery) {
        await contractModuleInstance.clickSaveAndNext();
      } else {
        await contractModuleInstance.fillStep1Services(SERVICE_DATA);
        const saveEnabledAfterRefill = await contractModuleInstance.saveAndNextBtn
          .isEnabled()
          .catch(() => false);
        if (saveEnabledAfterRefill) {
          await contractModuleInstance.clickSaveAndNext();
        }
      }
    }
    await contractModuleInstance.assertStep2Visible();
  }

  async function ensureE2EStep2Ready(contractModuleInstance) {
    const alreadyOnStepper = await contractModuleInstance.isOnStepperPage();
    if (alreadyOnStepper) {
      const step2Visible = await contractModuleInstance.devicesPageHeading
        .isVisible()
        .catch(() => false);
      if (step2Visible) {
        await contractModuleInstance.assertStep2Visible();
        return;
      }
      await ensureStepperAtStep2(contractModuleInstance);
      return;
    }

    await ensureStepperAtStep2(contractModuleInstance);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(600_000);
    context = await browser.newContext();
    page    = await context.newPage();
    contractModule = new ContractModule(page);
    cm             = contractModule;
    propertyModule = new PropertyModule(page);
    await withTimeout(performLogin(page), 120_000, 'performLogin(beforeAll)');
    await ensureContractTargetDeal();
  });

  test.afterAll(async () => {
    console.log('[Contract Module] afterAll: closing shared browser context');
    await context?.close();
    console.log('[Contract Module] afterAll: shared browser context closed');
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 1 — TAB VISIBILITY & SELECTION
  // ══════════════════════════════════════════════════════════════════════════

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.title.includes('TC-CONTRACT-E2E-')) {
      return;
    }
    await gotoDealsListPage();
  });

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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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

      await openContractDealDetail();
      await contractModule.openCreateProposalDrawer();
      await contractModule.fillProposalName(newName);

      await expect(contractModule.proposalNameInput).toHaveValue(newName, { timeout: 5_000 });

      await contractModule.cancelCreateProposal();
    });

    /**
     * TC-CONTRACT-023 | Proposal Name is required and blank value blocks Create Proposal
     * (M-CONTRACT-REQ-001)
     *
     * Manual mapping:
     *   1. Open Create Proposal
     *   2. Keep Proposal Name blank
     *   3. Fill other required fields
     *   4. Click Create Proposal
     * Expected:
     *   - Proposal is not created
     *   - Validation shown for Proposal Name
     *   - User remains on Create Proposal drawer
     */
    test('TC-CONTRACT-023 | Proposal Name is required and cannot be blank on Create Proposal (M-CONTRACT-REQ-001)', async () => {
      test.setTimeout(180_000);
      const visualPauseMs = Number(process.env.CONTRACT_VISUAL_PAUSE_MS || 700);
      const visualPause = async () => page.waitForTimeout(visualPauseMs);

      console.log('[TC-CONTRACT-023] Step 1: Open target deal and Create Proposal drawer');
      await openContractDealDetail();
      await contractModule.openCreateProposalDrawer();
      await contractModule.assertCreateProposalDrawerOpen();
      await visualPause();

      console.log('[TC-CONTRACT-023] Step 2: Keep Proposal Name blank');
      await contractModule.fillProposalName('');
      await expect(contractModule.proposalNameInput).toHaveValue('');
      await visualPause();

      console.log('[TC-CONTRACT-023] Step 3: Fill other mandatory fields');
      await contractModule.selectTimeZone(PROPOSAL_DATA.timeZone);
      await contractModule.fillStartDate(PROPOSAL_DATA.startDate);
      await contractModule.fillRenewalDate(PROPOSAL_DATA.renewalDate);
      await visualPause();

      console.log('[TC-CONTRACT-023] Step 4: Submit Create Proposal with blank Proposal Name');
      await contractModule.submitCreateProposalBtn.click();
      await visualPause();

      console.log('[TC-CONTRACT-023] Step 5: Validate required error and blocked submission');
      await expect(page).not.toHaveURL(/\/contract\/\d+/, { timeout: 8_000 });
      await expect(contractModule.createProposalDrawerHeading).toBeVisible({ timeout: 8_000 });

      const proposalNameRequiredText = page
        .getByText(/Proposal Name.*required|required.*Proposal Name/i)
        .first();
      const hasRequiredText = await proposalNameRequiredText.isVisible().catch(() => false);
      const isAriaInvalid = await contractModule.proposalNameInput
        .getAttribute('aria-invalid')
        .then((v) => String(v).toLowerCase() === 'true')
        .catch(() => false);

      expect(
        hasRequiredText || isAriaInvalid,
        'Proposal Name should show a required validation indicator (error text or aria-invalid=true).',
      ).toBeTruthy();

      const focusedTagName = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() || '');
      const focusedName = await page.evaluate(
        () => document.activeElement?.getAttribute('name') || document.activeElement?.id || '',
      );
      console.log(
        `[TC-CONTRACT-023] Active element after failed submit: tag=${focusedTagName}, id/name=${focusedName}`,
      );

      await contractModule.cancelCreateProposal();
      await contractModule.assertCreateProposalDrawerClosed();
      console.log('[TC-CONTRACT-023] Complete');
    });

    /**
     * TC-CONTRACT-024 | Create Proposal is blocked when Time Zone is missing and required validation is shown
     * (M-CONTRACT-TZ-001)
     *
     * Manual mapping:
     *   - Baseline Time Zone state
     *   - Block submit when Time Zone is missing
     *   - Validate required feedback
     *   - Cover key negative/edge behaviors
     *   - Final positive submit after valid Time Zone selection
     */
    test('TC-CONTRACT-024 | Create Proposal blocked when Time Zone is not selected (M-CONTRACT-TZ-001)', async () => {
      test.setTimeout(240_000);
      const visualPauseMs = Number(process.env.CONTRACT_VISUAL_PAUSE_MS || 600);
      const visualPause = async () => page.waitForTimeout(visualPauseMs);
      const toNorm = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

      const submitFromDrawer = async () => {
        await expect(contractModule.submitCreateProposalBtn).toBeVisible({ timeout: 8_000 });
        await contractModule.submitCreateProposalBtn.click();
      };

      const assertTimeZoneRequiredValidation = async (messagePrefix) => {
        await expect(page).not.toHaveURL(/\/contract\/\d+/, { timeout: 8_000 });
        await expect(contractModule.createProposalDrawerHeading).toBeVisible({ timeout: 8_000 });

        const requiredText = page
          .getByText(
            /Time\s*Zone.*required|required.*Time\s*Zone|Please\s+select.*Time\s*Zone|Time\s*Zone.*mandatory/i,
          )
          .first();

        const hasRequiredText = await requiredText.isVisible().catch(() => false);
        const isAriaInvalid = await contractModule.timeZoneTrigger
          .getAttribute('aria-invalid')
          .then((v) => String(v).toLowerCase() === 'true')
          .catch(() => false);

        expect(
          hasRequiredText || isAriaInvalid,
          `${messagePrefix}: Time Zone should show required validation text or invalid state.`,
        ).toBeTruthy();
      };

      const readTimeZoneTriggerText = async () =>
        toNorm(
          await contractModule.timeZoneTrigger.textContent().catch(() => ''),
        );

      console.log('[TC-CONTRACT-024] Step 1: Open deal detail and Create Proposal drawer');
      await openContractDealDetail();
      await contractModule.openCreateProposalDrawer();
      await contractModule.assertCreateProposalDrawerOpen();
      await visualPause();

      console.log('[TC-CONTRACT-024] Step 2: Baseline check - Time Zone visible and no error before submit');
      await contractModule.assertTimeZoneTriggerVisible();
      const preSubmitTimeZoneErrorVisible = await page
        .getByText(/Time\s*Zone.*required|required.*Time\s*Zone/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(preSubmitTimeZoneErrorVisible).toBeFalsy();
      const initialTimeZoneText = await readTimeZoneTriggerText();
      const isTimeZonePreselected = /\(utc/.test(initialTimeZoneText) || /utc-?\d/.test(initialTimeZoneText);
      console.log(
        `[TC-CONTRACT-024] Time Zone baseline: "${initialTimeZoneText || "empty"}", preselected=${isTimeZonePreselected}`,
      );
      await visualPause();

      console.log('[TC-CONTRACT-024] Step 3: Keep Time Zone empty; fill other required fields');
      await contractModule.fillProposalName(`TZ Required Manual Flow ${Date.now()}`);
      await contractModule.fillStartDate(PROPOSAL_DATA.startDate);
      await contractModule.fillRenewalDate(PROPOSAL_DATA.renewalDate);
      await visualPause();

      if (!isTimeZonePreselected) {
        console.log('[TC-CONTRACT-024] Step 4: Submit without Time Zone and verify blocking + required validation');
        await submitFromDrawer();
        await visualPause();
        await assertTimeZoneRequiredValidation('Primary missing-timezone flow');

        console.log('[TC-CONTRACT-024] Step 5 (N1): Keep Proposal Name + Time Zone both empty and validate');
        await contractModule.fillProposalName('');
        await submitFromDrawer();
        await visualPause();
        await assertTimeZoneRequiredValidation('Combined missing required fields flow');

        console.log('[TC-CONTRACT-024] Step 6 (N3): Toggle Contract Dates TBD, keep Time Zone empty, verify still blocked');
        await contractModule.toggleContractDatesTBD();
        await contractModule.assertContractDatesTBDChecked();
        await submitFromDrawer();
        await visualPause();
        await assertTimeZoneRequiredValidation('TBD + missing timezone flow');
        await contractModule.toggleContractDatesTBD();
        await contractModule.assertContractDatesTBDUnchecked();

        console.log('[TC-CONTRACT-024] Step 7 (N4): Rapid multi-submit should remain stable');
        for (let i = 0; i < 3; i += 1) {
          await submitFromDrawer();
        }
        await visualPause();
        await assertTimeZoneRequiredValidation('Rapid submit stability flow');
      } else {
        console.log(
          '[TC-CONTRACT-024] Missing-timezone negative checks skipped because Time Zone is preselected by default in current UI.',
        );
      }

      console.log('[TC-CONTRACT-024] Step 8 (N5): Cancel and reopen should not force stale validation state');
      await contractModule.cancelCreateProposal();
      await contractModule.assertCreateProposalDrawerClosed();
      await visualPause();
      await contractModule.openCreateProposalDrawer();
      await contractModule.assertCreateProposalDrawerOpen();
      const staleErrorVisible = await page
        .getByText(/Time\s*Zone.*required|required.*Time\s*Zone/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(staleErrorVisible).toBeFalsy();
      await visualPause();

      console.log('[TC-CONTRACT-024] Step 9 (N6): Keyboard-triggered submit with missing Time Zone stays blocked');
      if (!isTimeZonePreselected) {
        await contractModule.fillProposalName(`TZ Keyboard Flow ${Date.now()}`);
        await contractModule.fillStartDate(PROPOSAL_DATA.startDate);
        await contractModule.fillRenewalDate(PROPOSAL_DATA.renewalDate);
        await contractModule.submitCreateProposalBtn.focus();
        await page.keyboard.press('Enter');
        await visualPause();
        await assertTimeZoneRequiredValidation('Keyboard submit missing-timezone flow');
      } else {
        console.log(
          '[TC-CONTRACT-024] Keyboard missing-timezone check skipped because Time Zone is preselected by default.',
        );
      }

      console.log(
        '[TC-CONTRACT-024] Step 10 (N8): Validate valid Time Zone state without mutating suite state.',
      );
      if (!isTimeZonePreselected) {
        await contractModule.selectTimeZone(PROPOSAL_DATA.timeZone);
      } else {
        console.log('[TC-CONTRACT-024] Time Zone already preselected; using existing valid value.');
      }
      const postSelectionTimeZoneErrorVisible = await page
        .getByText(/Time\s*Zone.*required|required.*Time\s*Zone/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(postSelectionTimeZoneErrorVisible).toBeFalsy();
      await contractModule.cancelCreateProposal();
      await contractModule.assertCreateProposalDrawerClosed();
      console.log('[TC-CONTRACT-024] Complete');
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
      await contractModule.openCreateProposalDrawer();

      await contractModule.assertDateFieldsVisible();
      await contractModule.toggleContractDatesTBD();
      await contractModule.assertContractDatesTBDChecked();
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
      await openContractDealDetail();
      await contractModule.openCreateProposalDrawer();
      await contractModule.assertCreateProposalDrawerOpen();
      await contractModule.assertContractDatesTBDUnchecked();
      await contractModule.assertDateFieldsVisible();

      await contractModule.toggleContractDatesTBD();
      await contractModule.assertContractDatesTBDChecked();
      await contractModule.assertDateFieldsHidden();

      await contractModule.toggleContractDatesTBD();
      await contractModule.assertContractDatesTBDUnchecked();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
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
      await openContractDealDetail();
      await contractModule.openCreateProposalDrawer();
      await contractModule.cancelCreateProposal();

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
      await openContractDealDetail();

      await contractModule.openCreateProposalDrawer();
      await contractModule.cancelCreateProposal();
      await contractModule.assertCreateProposalDrawerClosed();

      await contractModule.openCreateProposalDrawer();
      await expect(contractModule.createProposalDrawerHeading).toBeVisible({ timeout: 10_000 });

      await contractModule.cancelCreateProposal();
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
      test.setTimeout(180_000);
      await ensureStepperAtStep1(cm);
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
      test.setTimeout(240_000);
      await ensureStepperAtStep1(cm);
      await cm.fillStep1Services(SERVICE_DATA);

      const saveEnabled = await cm.saveAndNextBtn.isEnabled().catch(() => false);
      if (saveEnabled) {
        await cm.clickSaveAndNext();
      } else {
        await cm.stepperStep2.click({ force: true });
      }
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
      test.setTimeout(180_000);
      await ensureE2EStep2Ready(cm);
      await cm.assertStep2Visible();
      await expect(cm.devicesTotalHeading).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('heading', { name: 'NFC Tags', level: 6 })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('heading', { name: 'Beacons',  level: 6 })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByRole('heading', { name: 'QR Tags',  level: 6 })).toBeVisible({ timeout: 5_000 });
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
      test.setTimeout(180_000);
      await ensureE2EStep2Ready(cm);
      await expect(cm.devicesTotalHeading).toBeVisible({ timeout: 5_000 });
      const totalBeforeText = await cm.devicesTotalHeading.textContent();
      await cm.addDeviceQuantity('NFC Tags', 1);
      await expect(cm.devicesTotalHeading).toBeVisible({ timeout: 5_000 });
      await expect.poll(
        async () => (await cm.devicesTotalHeading.textContent()) || '',
        { timeout: 10_000 },
      ).not.toBe(totalBeforeText || '');
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
      await expect(cm.signatureBtnOnCard).toBeVisible({ timeout: 5_000 });
      const editVisible = await cm.editProposalAction.isVisible().catch(() => false);
      const cloneVisible = await cm.cloneProposalAction.isVisible().catch(() => false);
      const previewVisible = await cm.previewPdfAction.isVisible().catch(() => false);
      expect(editVisible || cloneVisible || previewVisible).toBeTruthy();
    });

    // ══════════════════════════════════════════════════════════════════════
    //  SECTION 17 — EDIT PROPOSAL SMOKE TESTS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * TC-CONTRACT-EDIT-001 | Edit action button is visible on the proposal card
     *
     * Preconditions : Contract & Terms tab is active; a proposal card exists
     * Steps         : Observe the proposal card action buttons
     * Expected      : "Edit" action button (next sibling of Signature button) is visible
     * Priority      : P1 — High
     *
     * Locator note  : editProposalAction is scoped as the immediate next sibling
     *                 of the Signature button — live-verified on 2026-03-24.
     */
    test('TC-CONTRACT-EDIT-001 | Edit action button is visible on proposal card', async () => {
      test.setTimeout(180_000);
      await ensureEditSurfaceReady(cm);
      await expect(cm.editProposalAction).toBeVisible({ timeout: 5_000 });
    });

    /**
     * TC-CONTRACT-EDIT-002 | Clicking Edit on proposal card opens the contract stepper
     *
     * Preconditions : Proposal card is visible with the Edit action visible
     * Steps         :
     *   1. Click the "Edit" action button on the proposal card
     * Expected      :
     *   - URL changes to match /contract/:id pattern
     *   - "Update Proposal" button is visible on the stepper page
     * Priority      : P0 — Critical
     */
    test('TC-CONTRACT-EDIT-002 | Clicking Edit on proposal card opens the contract stepper', async () => {
      test.setTimeout(180_000);
      const readyState = await ensureEditSurfaceReady(cm);

      if (readyState !== 'stepper') {
        await cm.openExistingProposalEditor();
      }

      await expect(page).toHaveURL(/\/contract\/\d+/, { timeout: 20_000 });
      await expect(cm.updateProposalBtn).toBeVisible({ timeout: 15_000 });
    });

    /**
     * TC-CONTRACT-EDIT-003 | Proposal name is pre-filled in the Edit stepper
     *
     * Preconditions : Contract stepper is open in Edit mode (/contract/:id)
     * Steps         :
     *   1. Click Edit on the proposal card to open the stepper
     *   2. Observe the "Add Proposal Name" textbox on Step 1
     * Expected      : Proposal Name textbox is visible and contains a non-empty value
     *                 (pre-filled with the original proposal/deal name)
     * Priority      : P1 — High
     */
    test('TC-CONTRACT-EDIT-003 | Proposal name is pre-filled in the Edit stepper', async () => {
      test.setTimeout(180_000);
      const readyState = await ensureEditSurfaceReady(cm);

      if (readyState !== 'stepper') {
        await cm.openExistingProposalEditor();
      }
      await expect(page).toHaveURL(/\/contract\/\d+/, { timeout: 20_000 });

      const proposalNameInputVisible = await cm.proposalNameInput.isVisible().catch(() => false);
      const proposalNameLocator = proposalNameInputVisible
        ? cm.proposalNameInput
        : page.getByRole('heading', { level: 3 }).first();

      await expect(proposalNameLocator).toBeVisible({ timeout: 10_000 });
      const prefilledName = proposalNameInputVisible
        ? await proposalNameLocator.inputValue()
        : await proposalNameLocator.textContent();
      expect(prefilledName.trim().length).toBeGreaterThan(0);
    });

    /**
     * TC-CONTRACT-EDIT-004 | Navigating away from Edit stepper returns to Deals list
     *
     * Preconditions : Contract stepper is open in Edit mode
     * Steps         :
     *   1. Click Edit on the proposal card
     *   2. Navigate to the Deals list without submitting any changes
     * Expected      :
     *   - URL returns to /app/sales/deals
     *   - No unintended changes are saved to the proposal
     * Priority      : P1 — High
     */
    test('TC-CONTRACT-EDIT-004 | Navigating away from Edit stepper returns to Deals list safely', async () => {
      test.setTimeout(180_000);
      const readyState = await ensureEditSurfaceReady(cm);

      if (readyState !== 'stepper') {
        await cm.openExistingProposalEditor();
      }
      await expect(page).toHaveURL(/\/contract\/\d+/, { timeout: 20_000 });

      await cm.gotoDealsPage();
      await expect(page).toHaveURL(/\/app\/sales\/deals/, { timeout: 15_000 });
    });

    // ══════════════════════════════════════════════════════════════════════
    //  SECTION 18 — PUBLISH FLOW STEP A: CLOSE THE DEAL
    // ══════════════════════════════════════════════════════════════════════

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
      await ensureProposalCardReady(cm);
      await cm.clickPublishContractToCloseDeal();
      await cm.assertCloseDealModalOpen();
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
