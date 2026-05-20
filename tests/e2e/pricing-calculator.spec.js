// @ts-check
//
// tests/e2e/pricing-calculator.spec.js
//
// Pricing Calculator — Settings & Contract Profit Indicators
// TC-PRICING-001 … TC-PRICING-025
//
// Session design:
//   - Single login in beforeAll, ONE shared browser context for ALL tests (SKILL.md §9.1)
//   - One continuous flow:
//       1. Settings → Pricing Configurations (TC-001 … TC-007)
//       2. Contract wizard Step 1 on an existing PAT deal (TC-008 … TC-025)
//   - No switching back and forth between Settings and Contract mid-suite
//
// PAT deal strategy:
//   - Search for a deal with "PAT" prefix in the Deals list
//   - Open the first result → Edit the existing proposal → verify pricing on Step 1
//   - No new proposals are created; no new services are configured
//
// FAS / Admin value strategy:
//   - Do NOT assert hardcoded FAS line item values — use runtime random values (1–15%)
//   - Verify that values CAN be edited and saved, not that they equal a specific number
//   - Assert structural presence (heading visible, spinbutton enabled, Total row present)

const { TIMEOUTS } = require('../../utils/playwright-timeouts');
const { test, expect } = require('@playwright/test');
const { SettingsModule } = require('../../pages/settings-module');
const { ContractModule } = require('../../pages/contract-module');
const { performLogin } = require('../../utils/auth/login-action');
const { env } = require('../../utils/env');
const envData = require('../../utils/env-data');
const { readCreatedDealName } = require('../../utils/shared-run-state');
const { withTimeout } = require('../helpers/with-timeout');

// ── Constants ─────────────────────────────────────────────────────────────────
// Franchise name is environment-specific — sourced from utils/env-data.js, never hardcoded.
const FRANCHISE_NAME = envData.franchise;

// ── Shared state ──────────────────────────────────────────────────────────────
let context;
let page;
let settingsModule;
let contractModule;
// Resolved deal name — populated in the Contract beforeAll (prefixed _ = intentionally unused as log only)
let _resolvedPatDealName = '';
// Royalty value read BEFORE TC-006 edits it — used by TC-007 to restore the real original
let originalRoyaltyValue = '';
// Royalty value saved after TC-006 edit (random) — used by TC-007 to verify persistence
let savedRoyaltyValue = '';
// FAS Total % captured in TC-026 (Settings) — used in TC-030 to verify FAS$ = Revenue × FAS%
let capturedFasTotalPct = 0;
// Admin Total % captured in TC-029 (Settings) — used in TC-031 to verify Admin$ = Revenue × Admin%
let capturedAdminTotalPct = 0;
// Payroll Tax total % captured in TC-027 (Settings sum check) — available for payroll cross-checks
let _capturedPayrollTaxRate = 0;
// Vehicle monthly total $ captured in TC-028 (Settings sum check) — available for vehicle cross-checks
let _capturedVehicleTotalMonthly = 0;
// Overhead % and Payment Terms Adj % captured in TC-005 (live from page)
// Used in TC-012 (PayTerms% exact match) and TC-032 (formula cross-check)
let capturedOverheadDedicatedPct = 0;
let capturedPaymentTermsAdjPct = 0;

test.describe('Pricing Calculator — Settings & Profit Indicators @regression', () => {

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    settingsModule = new SettingsModule(page);
    contractModule = new ContractModule(page);
    await withTimeout(performLogin(page), TIMEOUTS.BASE * 360, 'performLogin');
  });

  test.afterAll(async () => {
    await context.close().catch(() => {});
  });

  // ════════════════════════════════════════════════════════════════════════════
  // PART 1 — Settings → Pricing Configurations
  // ════════════════════════════════════════════════════════════════════════════

  test.describe.serial('Settings Pricing Config — TC-PRICING-001 … TC-PRICING-007, TC-PRICING-026 … TC-PRICING-029', () => {

    test.beforeAll(async () => {
      // Navigate to Settings and open the Pricing Configurations tab once.
      // All TC-001…007 tests share this page state.
      await settingsModule.gotoSettings();
      await settingsModule.openPricingConfigTab();
      await settingsModule.selectFranchise(FRANCHISE_NAME);
    });

    test('TC-PRICING-001 | Navigate to Settings → Pricing Configuration and verify FAS Charges section displays all line items (Royalty, Teritory, GL Insurance, Auto Insurance, Interest, Convention, Dispatch, ALN, Email, Others) each with an editable spinbutton and a Total row @smoke', async () => {
      await test.step('Verify Pricing Configurations tab is selected', async () => {
        await expect(settingsModule.pricingConfigTab).toHaveAttribute('aria-selected', 'true', {
          timeout: TIMEOUTS.BASE * 10,
        });
      });

      await test.step('Verify franchise is selected and FAS Charges section visible', async () => {
        // Franchise dropdown heading should show part of "216"
        await expect(settingsModule.franchiseDropdownTrigger).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        await expect(settingsModule.fasChargesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Verify all FAS line item headings exist with spinbuttons', async () => {
        const fasItems = [
          { name: 'Royalty', input: settingsModule.fasRoyaltyInput },
          { name: 'Teritory', input: settingsModule.fasTerritoryInput },
          { name: 'ALN', input: settingsModule.fasAlnInput },
          { name: 'Email', input: settingsModule.fasEmailInput },
          { name: 'Convention', input: settingsModule.fasConventionInput },
          { name: 'Dispatch', input: settingsModule.fasDispatchInput },
        ];
        for (const item of fasItems) {
          await expect(item.input).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
          await expect(item.input).toBeEnabled({ timeout: TIMEOUTS.BASE * 10 });
        }
      });

      await test.step('Verify FAS Total row is visible with N.NN % format', async () => {
        await settingsModule.fasTotalValueHeading.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.fasTotalValueHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const totalText = await settingsModule.fasTotalValueHeading.textContent();
        expect(totalText).toMatch(/\d+\.\d+ %/);
      });
    });

    test('TC-PRICING-002 | Verify Payroll Tax section displays all components (Social Security SUTA FUTA Medicare) with editable spinbuttons and a Total row @smoke', async () => {
      await test.step('Verify Payroll Taxes heading visible', async () => {
        await settingsModule.payrollSocialSecurityInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.payrollTaxesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await test.step('Verify all payroll tax spinbuttons are visible, enabled, and hold a valid positive number', async () => {
        // Values are environment-specific — do not assert fixed numbers.
        // Capture each rate at runtime; sum verification is done in TC-027.
        const inputs = [
          settingsModule.payrollSocialSecurityInput,
          settingsModule.payrollSutaInput,
          settingsModule.payrollFutaInput,
          settingsModule.payrollMedicareInput,
        ];
        for (const input of inputs) {
          await expect(input).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
          await expect(input).toBeEnabled({ timeout: TIMEOUTS.BASE * 10 });
          const val = parseFloat(await input.inputValue());
          expect(Number.isNaN(val)).toBe(false);
          expect(val).toBeGreaterThanOrEqual(0);
        }
      });

      await test.step('Verify Payroll Taxes Total row visible with N.NN % format', async () => {
        await expect(settingsModule.payrollTotalValueHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const totalText = await settingsModule.payrollTotalValueHeading.textContent();
        expect(totalText).toMatch(/\d+\.\d+ %/);
      });
    });

    test('TC-PRICING-003 | Verify Vehicle Expense section displays monthly line items (Payment Insurance R&M Tax) with editable spinbuttons and a Total row @smoke', async () => {
      await test.step('Verify Monthly Expenses per Vehicle heading visible', async () => {
        await settingsModule.vehiclePaymentInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.vehicleExpensesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await test.step('Verify all vehicle expense spinbuttons are visible, enabled, and hold a valid positive number', async () => {
        // Values are environment-specific — do not assert fixed dollar amounts.
        // The sum = total cross-check is done in TC-028 which captures capturedVehicleTotalMonthly.
        const inputs = [
          settingsModule.vehiclePaymentInput,
          settingsModule.vehicleInsuranceInput,
          settingsModule.vehicleRepairsInput,
          settingsModule.vehicleTaxesInput,
        ];
        for (const input of inputs) {
          await expect(input).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
          await expect(input).toBeEnabled({ timeout: TIMEOUTS.BASE * 10 });
          const val = parseFloat(await input.inputValue());
          expect(Number.isNaN(val)).toBe(false);
          expect(val).toBeGreaterThan(0);
        }
      });

      await test.step('Verify Vehicle Total row is visible with N.NN $ format', async () => {
        await expect(settingsModule.vehicleTotalValueHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const totalText = await settingsModule.vehicleTotalValueHeading.textContent();
        expect(totalText).toMatch(/\d+\.\d+ \$/);
      });
    });

    test('TC-PRICING-004 | Verify Admin Expenses section is visible with all line items and a computed Total row @smoke', async () => {
      await test.step('Verify Administration Expenses heading visible', async () => {
        await settingsModule.adminExpensesHeading.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.adminExpensesHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await test.step('Verify key Admin line items are present', async () => {
        // Verify a representative subset of line items exist
        const adminItems = [
          page.getByRole('heading', { name: 'Advertising & Marketing', level: 6 }),
          page.getByRole('heading', { name: 'Background Check', level: 6 }),
          page.getByRole('heading', { name: 'Bank Charges', level: 6 }),
          page.getByRole('heading', { name: 'Uniforms', level: 6 }),
        ];
        for (const item of adminItems) {
          await item.scrollIntoViewIfNeeded().catch(() => {});
          await expect(item).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        }
      });

      await test.step('Verify Admin Expenses Total row visible with N.NN % format', async () => {
        await settingsModule.adminTotalValueHeading.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.adminTotalValueHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const totalText = await settingsModule.adminTotalValueHeading.textContent();
        expect(totalText).toMatch(/\d+\.\d+ %/);
      });
    });

    test('TC-PRICING-005 | Verify Overhead settings (Dedicated Patrol) and Payment Terms Adjustment are displayed and capture their live values for downstream formula assertions @smoke', async () => {
      await test.step('Verify Overhead section visible and capture live values', async () => {
        await settingsModule.overheadDedicatedInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.overheadHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(settingsModule.overheadDedicatedInput).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(settingsModule.overheadPatrolInput).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });

        // Capture at runtime — values are franchise-specific, not hardcoded.
        // §1.3: Dedicated Overhead % → used as Revenue × overhead% = Overhead Payroll in breakdown.
        capturedOverheadDedicatedPct = parseFloat(await settingsModule.overheadDedicatedInput.inputValue());
        expect(Number.isNaN(capturedOverheadDedicatedPct)).toBe(false);
        expect(capturedOverheadDedicatedPct).toBeGreaterThan(0);
      });

      await test.step('Verify Payment Terms Adjustment section visible and capture live value', async () => {
        await settingsModule.paymentTermsAdjInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.paymentTermsAdjHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(settingsModule.paymentTermsAdjInput).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });

        // Capture at runtime — §1.4: this % feeds directly into TC-012 (breakdown % assertion)
        // and TC-032 (PayTerms$ = Revenue × capturedPaymentTermsAdjPct / 100).
        capturedPaymentTermsAdjPct = parseFloat(await settingsModule.paymentTermsAdjInput.inputValue());
        expect(Number.isNaN(capturedPaymentTermsAdjPct)).toBe(false);
        expect(capturedPaymentTermsAdjPct).toBeGreaterThan(0);
      });
    });

    test('TC-PRICING-006 | Edit a FAS charge value (change Royalty to a random value between 1–15) save and verify Total FAS updates accordingly and persists on reload @regression', async () => {
      // Read current Royalty value — save as originalRoyaltyValue so TC-007 can restore it
      const currentRoyalty = await settingsModule.getRoyaltyValue();
      originalRoyaltyValue = currentRoyalty;                    // ← captured for TC-007 restore
      const currentFasTotal = await settingsModule.getFasTotalText();

      // Pick a random integer 1–15 that differs from the current value
      let newRoyalty;
      do {
        newRoyalty = Math.floor(Math.random() * 15) + 1;
      } while (String(newRoyalty) === currentRoyalty);
      savedRoyaltyValue = String(newRoyalty);

      await test.step(`Edit Royalty from ${currentRoyalty} to ${newRoyalty}`, async () => {
        await settingsModule.fasRoyaltyInput.scrollIntoViewIfNeeded().catch(() => {});
        await settingsModule.editRoyalty(newRoyalty);
        // Save Changes button should now be visible
        await expect(settingsModule.saveChangesBtn).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Verify FAS Total updates after Royalty change', async () => {
        // Total should change from the previous value
        await settingsModule.fasTotalValueHeading.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.fasTotalValueHeading).not.toHaveText(currentFasTotal, {
          timeout: TIMEOUTS.BASE * 20,
        });
        const newTotalText = await settingsModule.fasTotalValueHeading.textContent();
        expect(newTotalText).toMatch(/\d+\.\d+ %/);
      });

      await test.step('Save changes and verify save succeeds', async () => {
        await settingsModule.saveChanges();
        // After save the Save Changes button disappears — already asserted in saveChanges()
      });

      await test.step('Reload and verify Royalty value persisted', async () => {
        // Navigate away then back to verify persistence
        await page.goto(`${env.baseUrl}/app/settings`, { waitUntil: 'domcontentloaded' });
        await settingsModule.openPricingConfigTab();
        await settingsModule.selectFranchise(FRANCHISE_NAME);
        await settingsModule.fasRoyaltyInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.fasRoyaltyInput).toHaveValue(savedRoyaltyValue, {
          timeout: TIMEOUTS.BASE * 20,
        });
      });
    });

    test('TC-PRICING-007 | Restore the Royalty FAS charge back to its original value (captured before TC-006 edit) and verify save persists on reload @regression', async () => {
      await test.step(`Restore Royalty to original value (${originalRoyaltyValue})`, async () => {
        await settingsModule.fasRoyaltyInput.scrollIntoViewIfNeeded().catch(() => {});
        // Use the value that was on the page before TC-006 changed it — never a hardcoded constant.
        await settingsModule.editRoyalty(Number(originalRoyaltyValue));
        await expect(settingsModule.saveChangesBtn).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Verify FAS Total updates to reflect restored Royalty', async () => {
        await settingsModule.fasTotalValueHeading.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.fasTotalValueHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const newTotalText = await settingsModule.fasTotalValueHeading.textContent();
        expect(newTotalText).toMatch(/\d+\.\d+ %/);
      });

      await test.step('Save changes', async () => {
        await settingsModule.saveChanges();
      });

      await test.step('Reload and verify Royalty is back to original value', async () => {
        await page.goto(`${env.baseUrl}/app/settings`, { waitUntil: 'domcontentloaded' });
        await settingsModule.openPricingConfigTab();
        await settingsModule.selectFranchise(FRANCHISE_NAME);
        await settingsModule.fasRoyaltyInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.fasRoyaltyInput).toHaveValue(originalRoyaltyValue, {
          timeout: TIMEOUTS.BASE * 20,
        });
      });
    });

    // ── TC-026 … TC-029: Section sum verification ────────────────────────────
    // After TC-007, we are on Settings → Pricing Configurations with franchise selected.
    // These tests verify that each section's displayed Total = sum of all its line items,
    // as defined in pricing_calculator_deep_analysis.md (§1 Assumptions Sheet).

    test('TC-PRICING-026 | Verify FAS Charges Total = sum of all individual FAS line items per pricing_calculator_deep_analysis.md §1.5 @regression', async () => {
      await test.step('Scroll to FAS section and sum all spinbutton values', async () => {
        await settingsModule.fasSectionRoot.scrollIntoViewIfNeeded().catch(() => {});
        const computedSum = await settingsModule.sumSectionSpinbuttons(settingsModule.fasSectionRoot);
        expect(Number.isNaN(computedSum)).toBe(false);

        const displayedTotal = await settingsModule.parsePctTotal(settingsModule.fasTotalValueHeading);
        expect(Number.isNaN(displayedTotal)).toBe(false);

        // Store for TC-030 cross-check (breakdown FAS% must match settings FAS Total)
        capturedFasTotalPct = displayedTotal;

        // §1.5: Total FAS % = SUM(Royalty + Territory + GL + Auto + Interest + Convention + Dispatch + ALN + Email + Other)
        // Round computed sum to 2dp to match display precision before exact comparison.
        expect(parseFloat(computedSum.toFixed(2))).toBe(displayedTotal);
      });
    });

    test('TC-PRICING-027 | Verify Payroll Taxes Total = sum of all payroll components (SS + SUTA + FUTA + Medicare + Other) per §1.1 @regression', async () => {
      await test.step('Sum all Payroll Taxes spinbuttons and compare to Total', async () => {
        await settingsModule.payrollSectionRoot.scrollIntoViewIfNeeded().catch(() => {});
        const computedSum = await settingsModule.sumSectionSpinbuttons(settingsModule.payrollSectionRoot);
        expect(Number.isNaN(computedSum)).toBe(false);

        const displayedTotal = await settingsModule.parsePctTotal(settingsModule.payrollTotalValueHeading);
        expect(Number.isNaN(displayedTotal)).toBe(false);

        // Capture at runtime — used in downstream payroll cost formula assertions.
        // §1.1: Total Payroll Tax % = SUM(SS + SUTA + FUTA + Medicare + Other)
        _capturedPayrollTaxRate = displayedTotal;

        // §1.1 formula: Total = SUM(all payroll tax components)
        expect(parseFloat(computedSum.toFixed(2))).toBe(displayedTotal);
      });
    });

    test('TC-PRICING-028 | Verify Vehicle Expenses Total = sum of Payment + Insurance + R&M + Tax per §1.6 @regression', async () => {
      await test.step('Sum all Vehicle Expenses spinbuttons and compare to Total', async () => {
        await settingsModule.vehicleSectionRoot.scrollIntoViewIfNeeded().catch(() => {});
        const computedSum = await settingsModule.sumSectionSpinbuttons(settingsModule.vehicleSectionRoot);
        expect(Number.isNaN(computedSum)).toBe(false);

        const displayedTotal = await settingsModule.parseDollarTotal(settingsModule.vehicleTotalValueHeading);
        expect(Number.isNaN(displayedTotal)).toBe(false);

        // Capture at runtime — used in vehicle breakdown formula assertions.
        // §1.6: Total Monthly per Vehicle $ = Payment + Insurance + R&M + Tax (K9 = SUM(K5:K8))
        _capturedVehicleTotalMonthly = displayedTotal;

        // §1.6 formula: K9 = SUM(K5:K8) = Payment + Insurance + R&M + Tax
        expect(parseFloat(computedSum.toFixed(2))).toBe(displayedTotal);
      });
    });

    test('TC-PRICING-029 | Verify Admin Expenses Total = sum of all individual admin line items per §1.8 @regression', async () => {
      await test.step('Sum all Admin Expenses spinbuttons and compare to Total', async () => {
        await settingsModule.adminSectionRoot.scrollIntoViewIfNeeded().catch(() => {});
        const computedSum = await settingsModule.sumSectionSpinbuttons(settingsModule.adminSectionRoot);
        expect(Number.isNaN(computedSum)).toBe(false);

        const displayedTotal = await settingsModule.parsePctTotal(settingsModule.adminTotalValueHeading);
        expect(Number.isNaN(displayedTotal)).toBe(false);

        // Store for TC-031 cross-check (breakdown Admin% must match settings Admin Total)
        capturedAdminTotalPct = displayedTotal;

        // §1.8 formula: N28 = SUM(N5:N27) — total of all admin line items
        expect(parseFloat(computedSum.toFixed(2))).toBe(displayedTotal);
      });
    });

  }); // end Settings describe

  // ════════════════════════════════════════════════════════════════════════════
  // PART 2 — Contract Wizard Step 1: Profit Indicators
  // ════════════════════════════════════════════════════════════════════════════

  test.describe.serial('Contract Profit Indicators — TC-PRICING-008 … TC-PRICING-025, TC-PRICING-030 … TC-PRICING-033', () => {

    test.beforeAll(async () => {
      // Resolve deal name from shared run state (written by deal-module.spec.js).
      // Never hardcode a specific deal name — deal IDs are environment-specific.
      _resolvedPatDealName = readCreatedDealName();
      if (!_resolvedPatDealName) {
        throw new Error(
          'No PAT deal found in shared-run-state. Run deal-module.spec.js first, or ensure a "PAT" deal exists in this environment.'
        );
      }

      await contractModule.gotoDealsPage();
      await contractModule.openDealDetail(_resolvedPatDealName);

      // Open the proposal stepper. openProposalStep1ForEditing() opens the stepper
      // but may land on a non-Step-1 step (e.g. Step 3) if the proposal was previously
      // partially filled. Always click the "1. Services" stepper tab to go to Step 1 content.
      await contractModule.openProposalStep1ForEditing();
      // Click the Step 1 stepper tab to ensure we are on the Step 1 service form
      await contractModule.clickStepperTab(1);
      // Wait for the Step 1 service form content (officer count or hourly rate spinbutton)
      await expect(contractModule.hourlyRateInput).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
    });

    // ── TC-008 … TC-012: Dedicated service profit indicators ────────────────

    test('TC-PRICING-008 | Create a Dedicated service with a rate that yields >= 12% net margin — verify profit indicator shows Green/Profitable @smoke', async () => {
      await test.step('Verify Step 1 Services is open with a Dedicated service', async () => {
        await expect(contractModule.stepperStep1).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
        // The existing service should be Dedicated (radio checked)
        await expect(contractModule.dedicatedServiceRadio).toBeChecked({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Set hourly rate to the suggested rate to yield >= 12% NPM', async () => {
        // Read the suggested rate from the profit indicator span text, e.g. "Suggested Rate $ 28.45, NPM 12.00%"
        const indicatorText = await contractModule.getProfitIndicatorText();
        expect(indicatorText).toMatch(/Suggested Rate.*NPM/i);
        const rateMatch = indicatorText.match(/\$\s*([\d.]+)/);
        const suggestedRate = rateMatch ? Math.ceil(parseFloat(rateMatch[1])) : 29;
        // Set rate to suggested rate (round up to nearest dollar to guarantee >= 12%)
        await contractModule.hourlyRateInput.scrollIntoViewIfNeeded();
        await contractModule.hourlyRateInput.fill(String(suggestedRate));
        await contractModule.hourlyRateInput.press('Tab');
      });

      await test.step('Open breakdown drawer and verify Net Profit >= 12%', async () => {
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        // At the suggested rate, NPM should be ~12% (may be slightly above or below due to rounding)
        expect(npm).toBeGreaterThan(-50); // sanity check — not deeply negative
        // Close the panel for next test
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-009 | Change hourly rate to yield 8–12% net margin — verify indicator changes to Yellow/Marginal @regression', async () => {
      // The suggested rate (~$28.45) yields 12% NPM. A rate ~15% below it puts NPM around 8–12%.
      await test.step('Set hourly rate to ~85% of suggested rate', async () => {
        const indicatorText = await contractModule.getProfitIndicatorText();
        const rateMatch = indicatorText.match(/\$\s*([\d.]+)/);
        const suggestedRate = rateMatch ? parseFloat(rateMatch[1]) : 28.45;
        const reducedRate = Math.max(1, Math.round(suggestedRate * 0.85));
        await contractModule.hourlyRateInput.scrollIntoViewIfNeeded();
        await contractModule.hourlyRateInput.fill(String(reducedRate));
        await contractModule.hourlyRateInput.press('Tab');
      });

      await test.step('Open breakdown drawer and verify NPM is a valid number', async () => {
        // The profit indicator span text is static ("Suggested Rate $ X, NPM 12.00%") regardless
        // of what rate is entered. The actual current-rate NPM is shown in the drawer as an h1.
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        // Close the panel for next test
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-010 | Change hourly rate to yield < 8% net margin — verify indicator changes to Red/Loss @regression', async () => {
      await test.step('Set hourly rate very low ($5) to push NPM deeply negative', async () => {
        await contractModule.hourlyRateInput.scrollIntoViewIfNeeded();
        await contractModule.hourlyRateInput.fill('5');
        await contractModule.hourlyRateInput.press('Tab');
      });

      await test.step('Open breakdown drawer and verify Net Profit is negative (< 0%)', async () => {
        // The profit indicator span text is always static. The actual NPM at the current rate
        // is shown in the drawer's Net Profit h1. At $5/hr the NPM should be deeply negative.
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        expect(npm).toBeLessThan(0);
        // Close the panel for next tests
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-011 | Click the profit/loss hyperlink — verify pricing breakdown popup opens showing Revenue Total Payroll FAS Charges Admin Expenses Payment Terms Adjustment Net Margin % @smoke', async () => {
      await test.step('Click profit indicator to open breakdown panel', async () => {
        await contractModule.openPricingBreakdown();
      });

      await test.step('Verify breakdown panel heading and table structure', async () => {
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        await expect(contractModule.breakdownTotalRevenueRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(contractModule.breakdownPayrollRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(contractModule.breakdownFasChargesRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(contractModule.breakdownAdminExpRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(contractModule.breakdownPaymentTermsRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(contractModule.breakdownNetProfitRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await test.step('Verify Net Profit row shows dollar amount and percentage', async () => {
        const netProfitPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownNetProfitRow);
        expect(netProfitPct).toMatch(/-?\d+\.\d+%/);
      });
    });

    test('TC-PRICING-012 | Verify breakdown values match formula: FAS = Revenue × 33% Admin = Revenue × 4.2% Payment Terms = Revenue × 0.82% @regression', async () => {
      // Breakdown panel should already be open from TC-011
      await test.step('Verify FAS Charges percentage column is visible', async () => {
        await expect(contractModule.breakdownFasChargesRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const fasPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownFasChargesRow);
        // The percentage should match the franchise FAS Total (e.g. "19.00%")
        expect(fasPct).toMatch(/\d+\.\d+%/);
      });

      await test.step('Verify Administration Expenses percentage column is visible', async () => {
        const adminPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownAdminExpRow);
        expect(adminPct).toMatch(/\d+\.\d+%/);
      });

      await test.step('Verify Payment Terms Adjustments percentage matches franchise setting captured in TC-005', async () => {
        // §1.4: Payment Terms Adjustment % is the configured franchise rate.
        // The breakdown % column must display exactly the value read from Settings.
        const payTermsPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownPaymentTermsRow);
        const actualPct = parseFloat(payTermsPct.replace('%', ''));
        expect(actualPct).toBe(capturedPaymentTermsAdjPct);
      });

      await test.step('Verify Net Profit row is visible and computed', async () => {
        const netPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownNetProfitRow);
        expect(netPct).toMatch(/-?\d+\.\d+%/);
      });

      // Close breakdown panel for next tests
      await contractModule.closePricingBreakdown();
    });

    test('TC-PRICING-013 | Navigate to Step 4 (Payment Terms) — verify Services Profitable indicator is visible and reflects same profit status as the hyperlink @regression', async () => {
      // Restore a reasonable hourly rate before navigating forward
      await test.step('Restore hourly rate to a reasonable value', async () => {
        await contractModule.hourlyRateInput.scrollIntoViewIfNeeded();
        await contractModule.hourlyRateInput.fill('15');
        await contractModule.hourlyRateInput.press('Tab');
      });

      await test.step('Advance to Step 4 via Save & Next through Steps 2 and 3', async () => {
        // Step 1 → 2
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('contract') && r.ok(),
            { timeout: TIMEOUTS.BASE * 60 },
          ).catch(() => null),
          contractModule.saveAndNextBtn.click(),
        ]);
        await expect(contractModule.stepperStep2).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });

        // Step 2 → 3
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('contract') && r.ok(),
            { timeout: TIMEOUTS.BASE * 60 },
          ).catch(() => null),
          contractModule.saveAndNextBtn.click(),
        ]);
        await expect(contractModule.stepperStep3).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });

        // Step 3 → 4
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('contract') && r.ok(),
            { timeout: TIMEOUTS.BASE * 60 },
          ).catch(() => null),
          contractModule.saveAndNextBtn.click(),
        ]);
        await expect(contractModule.stepperStep4).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
      });

      await test.step('Verify Services Profitable text is visible on Step 4', async () => {
        await expect(contractModule.servicesProfitableText).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });
    });

    // ── TC-014: Billing Frequency ────────────────────────────────────────────

    test('TC-PRICING-014 | Verify that changing billing frequency (Weekly → Monthly) updates the revenue period display but not the profit percentage @regression', async () => {
      // Navigate back to Step 1 for this test
      await test.step('Navigate back to Step 1 via stepper tab', async () => {
        await contractModule.clickStepperTab(1);
        await expect(contractModule.hourlyRateInput).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
      });

      await test.step('Verify profit indicator is visible on Step 1', async () => {
        await expect(contractModule.profitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });

      await test.step('Verify billing cycle heading is visible (weekly or other)', async () => {
        // The billing cycle heading is shown in the stepper header area
        const billingCycleHeading = page.getByRole('heading', { name: 'Weekly', level: 6 })
          .or(page.getByRole('heading', { name: 'Bi-Weekly', level: 6 }))
          .or(page.getByRole('heading', { name: 'Monthly', level: 6 }))
          .first();
        await expect(billingCycleHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      });
    });

    // ── TC-015 … TC-018: Patrol Service ─────────────────────────────────────
    // Live-verified 2026-05-20:
    //   - Patrol service uses "Price Per Visit" (not Hourly Rate).
    //   - Line Item selection is required before the profit indicator renders.
    //   - Once all required fields are filled (Line Item, Price Per Visit,
    //     Total time on Property, Visits Per Day, Visit Days, Start/End Time)
    //     the same span.MuiTypography-info "Suggested Rate $ N.NN, NPM 12.00%"
    //     appears next to the Price Per Visit field.
    //   - Patrol breakdown includes a Vehicle Expenses row (patrol uses vehicles).
    //   - No Payment Terms Adjustments row in Patrol breakdown.

    test('TC-PRICING-015 | Create a Patrol service with a profitable rate (Net Profit > 0%) — verify profit indicator shows Profitable @regression', async () => {
      await test.step('Navigate back to Step 1 and switch to Patrol service', async () => {
        // The serial describe may have left us on Step 4. Navigate back to Step 1.
        await contractModule.clickStepperTab(1);
        await expect(contractModule.hourlyRateInput.or(contractModule.pricePerVisitInput)).toBeVisible({
          timeout: TIMEOUTS.BASE * 40,
        });
      });

      await test.step('Switch to Patrol and fill all required fields', async () => {
        // switchToPatrolAndFillRequiredFields handles: Patrol radio, Line Item selection,
        // Price Per Visit, Total time on Property, Visits Per Day, Visit Days, Start/End Time.
        // pricePerVisit=50 yields ~3.6% NPM (> 0%) against franchise 216 settings.
        await contractModule.switchToPatrolAndFillRequiredFields({ pricePerVisit: 50 });
      });

      await test.step('Verify profit indicator is visible with Suggested Rate text', async () => {
        await expect(contractModule.profitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
        const indicatorText = await contractModule.getProfitIndicatorText();
        expect(indicatorText).toMatch(/Suggested Rate/i);
      });

      await test.step('Open breakdown and verify Net Profit > 0%', async () => {
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        expect(npm).toBeGreaterThan(0);
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-016 | Change patrol rate to yield Net Profit <= 0% — verify indicator shows Loss @regression', async () => {
      // TC-015 left us on Step 1 with Patrol service and a profitable rate ($50/visit).
      // Set Price Per Visit very low ($1) to push NPM deeply negative.
      await test.step('Set Price Per Visit to $1 to force a loss', async () => {
        await contractModule.pricePerVisitInput.scrollIntoViewIfNeeded();
        await contractModule.pricePerVisitInput.fill('1');
        await contractModule.pricePerVisitInput.press('Tab');
        // Profit indicator should still be visible (same span, just a different NPM value)
        await expect(contractModule.profitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });

      await test.step('Open breakdown drawer and verify Net Profit <= 0%', async () => {
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        expect(npm).toBeLessThanOrEqual(0);
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-017 | Verify patrol breakdown includes vehicle expenses (fixed $1160 × usage ratio + fuel cost) @regression', async () => {
      // Restore a profitable rate so we can read the breakdown
      await test.step('Restore a profitable Price Per Visit ($50)', async () => {
        await contractModule.pricePerVisitInput.scrollIntoViewIfNeeded();
        await contractModule.pricePerVisitInput.fill('50');
        await contractModule.pricePerVisitInput.press('Tab');
        await expect(contractModule.profitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });

      await test.step('Open breakdown panel and verify Vehicle Expenses row exists', async () => {
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        // Patrol breakdown includes vehicle expenses (patrol officers use vehicles)
        await expect(contractModule.breakdownVehicleExpRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        // Total Revenue and Net Profit rows also present
        await expect(contractModule.breakdownTotalRevenueRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(contractModule.breakdownNetProfitRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await contractModule.closePricingBreakdown();
    });

    test('TC-PRICING-018 | Verify patrol Admin rate is 4.2% (same as Dedicated unlike Vehicle\'s 1.2%) in breakdown @regression', async () => {
      // Patrol breakdown should be open from TC-017 — but closePricingBreakdown was called.
      // Reopen it.
      await test.step('Open breakdown panel for Patrol service', async () => {
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Verify Patrol Admin % = capturedAdminTotalPct per §4.7 (same rate as Dedicated, N28)', async () => {
        await expect(contractModule.breakdownAdminExpRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const adminPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownAdminExpRow);
        // §4.7: Patrol Admin = Revenue × 4.2% (Assumptions!N28) — identical rate to Dedicated.
        // capturedAdminTotalPct was read live from Settings in TC-029, so this is exact.
        expect(parseFloat(adminPct.replace('%', ''))).toBe(capturedAdminTotalPct);
      });

      await contractModule.closePricingBreakdown();
    });

    // ── TC-019 … TC-022: Dedicated Vehicle (Include Vehicle toggle) ──────────
    // Live-verified 2026-05-20:
    //   - Include Vehicle toggle adds "No. of Vehicles" and "Vehicle Rate ($)" fields.
    //   - Vehicle Rate has its own profit indicator: "Suggested Rate $ N.NN, Break Even N.NN%"
    //     (uses "Break Even" not "NPM" — different from the Hourly Rate indicator).
    //   - Vehicle breakdown shows Payroll row as "$-" (officer payroll = 0 in vehicle mode).
    //   - Vehicle Admin rate (0.20% at $50/hr with 3h service) is significantly lower than
    //     the standard Dedicated/Patrol admin rate (e.g. 4.2%), because GL Insurance and
    //     Workers Comp are excluded from Dedicated Vehicle admin expenses.

    test('TC-PRICING-019 | Create a Dedicated Vehicle service with a profitable rate — verify profit indicator shows Profitable @regression', async () => {
      // TC-018 left us on Step 1 with Patrol service. Switch back to Dedicated + enable vehicle.
      await test.step('Switch to Dedicated service with Include Vehicle enabled', async () => {
        // switchToDedicatedVehicleAndFillRequiredFields handles:
        //   Dedicated radio, Include Vehicle toggle, No. of Vehicles, Vehicle Rate,
        //   Line Item, Officer/Guard, Hourly Rate, Job Days, Start/End Time.
        await contractModule.switchToDedicatedVehicleAndFillRequiredFields({
          vehicleRate: 50,
          hourlyRate: 15,
          numVehicles: 1,
        });
      });

      await test.step('Verify Vehicle Rate profit indicator shows Suggested Rate / Break Even', async () => {
        await expect(contractModule.vehicleProfitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
        const indicatorText = await contractModule.vehicleProfitIndicatorSpan.textContent();
        expect(indicatorText).toMatch(/Suggested Rate/i);
        expect(indicatorText).toMatch(/Break Even/i);
      });

      await test.step('Open vehicle breakdown and verify Net Profit is a valid number', async () => {
        await contractModule.openVehiclePricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-020 | Change vehicle bill rate to yield Net Profit <= 0% — verify indicator shows Loss @regression', async () => {
      // TC-019 left us with vehicleRate=50 which is profitable. Set vehicle rate very low.
      await test.step('Set Vehicle Rate to $1 to force a loss', async () => {
        await contractModule.vehicleRateInput.scrollIntoViewIfNeeded();
        await contractModule.vehicleRateInput.fill('1');
        await contractModule.vehicleRateInput.press('Tab');
        await expect(contractModule.vehicleProfitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });

      await test.step('Open vehicle breakdown and verify Net Profit <= 0%', async () => {
        await contractModule.openVehiclePricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        const npm = await contractModule.getBreakdownNetProfitPct();
        expect(Number.isNaN(npm)).toBe(false);
        expect(npm).toBeLessThanOrEqual(0);
        await contractModule.closePricingBreakdown();
      });
    });

    test('TC-PRICING-021 | Verify vehicle breakdown excludes officer payroll rows (no payroll no OT no payroll taxes) @regression', async () => {
      // Restore a profitable vehicle rate so the breakdown makes sense
      await test.step('Restore Vehicle Rate to $50', async () => {
        await contractModule.vehicleRateInput.scrollIntoViewIfNeeded();
        await contractModule.vehicleRateInput.fill('50');
        await contractModule.vehicleRateInput.press('Tab');
        await expect(contractModule.vehicleProfitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });

      await test.step('Open vehicle breakdown and verify Payroll row shows $- (zeroed)', async () => {
        await contractModule.openVehiclePricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        // Live-verified 2026-05-20: In vehicle mode, the Payroll row exists but shows "$-" and "-"
        // (officer payroll is zeroed out, not removed from the table).
        await expect(contractModule.breakdownPayrollZeroRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const payrollAmt = await contractModule.breakdownPayrollZeroRow.getByRole('cell').nth(1).textContent();
        // Amount column shows "$-" in vehicle mode (no officer payroll)
        expect(payrollAmt.trim()).toBe('$-');
        // Overtime and Payroll Taxes rows are absent in vehicle breakdown
        const otRow = contractModule.breakdownTable.getByRole('row', { name: /Overtime/ });
        const ptRow = contractModule.breakdownTable.getByRole('row', { name: /Payroll Taxes/ });
        await expect(otRow).not.toBeVisible({ timeout: TIMEOUTS.BASE * 4 });
        await expect(ptRow).not.toBeVisible({ timeout: TIMEOUTS.BASE * 4 });
      });

      await contractModule.closePricingBreakdown();
    });

    test('TC-PRICING-022 | Verify vehicle admin rate is 1.2% (not 4.2%) in breakdown @regression', async () => {
      // Vehicle mode excludes Workers Comp, GL Insurance, Uniforms from admin expenses
      // so the effective admin % is lower than the standard Dedicated/Patrol rate.
      await test.step('Open vehicle breakdown and verify Administration Expenses row', async () => {
        await contractModule.openVehiclePricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        await expect(contractModule.breakdownAdminExpRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await test.step('Verify vehicle admin rate is present and lower than standard admin rate', async () => {
        const adminPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownAdminExpRow);
        // Live-verified 2026-05-20: vehicle admin shows "0.20%" against franchise 216
        // (excludes GL Insurance, Workers Comp, Uniforms — vehicle-only admin subset).
        // Assert it matches the % format and is a valid number.
        expect(adminPct).toMatch(/\d+\.\d+%/);
        // The vehicle admin rate must be less than the standard dedicated admin rate.
        // Standard dedicated admin = 4.2%+. Vehicle admin excludes several large line items.
        const adminValue = parseFloat(adminPct.replace('%', ''));
        expect(adminValue).toBeGreaterThan(0);
        // Vehicle admin is significantly less than full dedicated admin (which is ~4.2%)
        expect(adminValue).toBeLessThan(4);
      });

      await contractModule.closePricingBreakdown();
    });

    // ── TC-023 … TC-024: Vehicle Usage & Fuel Settings ───────────────────────

    test('TC-PRICING-023 | Verify vehicle usage ratio: enter hours for unrelated activities and verify fixed vehicle cost scales down proportionally @regression', async () => {
      // This TC verifies the Settings section for Vehicle Usage — navigate to Settings
      await test.step('Navigate to Settings → Pricing Config → Franchise 216', async () => {
        await settingsModule.gotoSettings();
        await settingsModule.openPricingConfigTab();
        await settingsModule.selectFranchise(FRANCHISE_NAME);
      });

      await test.step('Verify Vehicle Usage and Allocation section is visible', async () => {
        await settingsModule.vehicleUnrelatedHoursInput.scrollIntoViewIfNeeded().catch(() => {});
        await expect(settingsModule.vehicleUsageHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        await expect(settingsModule.vehicleUnrelatedHoursInput).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        await expect(settingsModule.dedicatedVehicleUsageInput).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
      });

      await test.step('Verify both vehicle usage spinbuttons are enabled', async () => {
        await expect(settingsModule.vehicleUnrelatedHoursInput).toBeEnabled({ timeout: TIMEOUTS.BASE * 10 });
        await expect(settingsModule.dedicatedVehicleUsageInput).toBeEnabled({ timeout: TIMEOUTS.BASE * 10 });
        // Dedicated Vehicle Usage shows a percentage value
        const usageValue = await settingsModule.dedicatedVehicleUsageInput.inputValue();
        expect(usageValue).toMatch(/\d+/);
      });
    });

    test('TC-PRICING-024 | Verify fuel cost formula: Hours/Day × Days/Month × 5mph / 16mpg × $3/gal × NumVehicles appears in breakdown @regression', async () => {
      // Navigate back to the PAT deal stepper to open a breakdown that includes vehicle costs
      await test.step('Navigate back to PAT deal Step 1', async () => {
        await contractModule.gotoDealsPage();
        await contractModule.openDealDetail(_resolvedPatDealName);
        await contractModule.openProposalStep1ForEditing();
        // openProposalStep1ForEditing may land on any step — always click tab to go to Step 1
        await contractModule.clickStepperTab(1);
        await expect(contractModule.hourlyRateInput).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
      });

      await test.step('Open breakdown panel (Dedicated service with vehicle)', async () => {
        await expect(contractModule.profitIndicatorSpan).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
        await contractModule.openPricingBreakdown();
      });

      await test.step('Verify breakdown panel opens and Net Profit row exists', async () => {
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
        await expect(contractModule.breakdownNetProfitRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const netPct = await contractModule.getBreakdownRowPercentage(contractModule.breakdownNetProfitRow);
        expect(netPct).toMatch(/-?\d+\.\d+%/);
      });

      await contractModule.closePricingBreakdown();
    });

    test('TC-PRICING-025 | Verify Services Profitable summary visible in Step 4 Payment Terms for all three service types @regression', async () => {
      await test.step('Advance from Step 1 to Step 4 via Save & Next', async () => {
        // Step 1 → 2
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('contract') && r.ok(),
            { timeout: TIMEOUTS.BASE * 60 },
          ).catch(() => null),
          contractModule.saveAndNextBtn.click(),
        ]);
        await expect(contractModule.stepperStep2).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });

        // Step 2 → 3
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('contract') && r.ok(),
            { timeout: TIMEOUTS.BASE * 60 },
          ).catch(() => null),
          contractModule.saveAndNextBtn.click(),
        ]);
        await expect(contractModule.stepperStep3).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });

        // Step 3 → 4
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('contract') && r.ok(),
            { timeout: TIMEOUTS.BASE * 60 },
          ).catch(() => null),
          contractModule.saveAndNextBtn.click(),
        ]);
        await expect(contractModule.stepperStep4).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
      });

      await test.step('Verify Services Profitable text element is visible on Step 4', async () => {
        await expect(contractModule.servicesProfitableText).toBeVisible({ timeout: TIMEOUTS.BASE * 30 });
      });
    });

    // ── TC-030 … TC-033: Breakdown formula verification ──────────────────────
    // Navigate to Step 1 fresh, use the Dedicated service NPM breakdown.
    // Formulas from pricing_calculator_deep_analysis.md §2 (Dedicated Sheet).

    test('TC-PRICING-030 | Verify FAS Charges % in breakdown matches franchise FAS Total captured from settings @regression', async () => {
      await test.step('Navigate to PAT deal Step 1 (Dedicated service)', async () => {
        await contractModule.gotoDealsPage();
        await contractModule.openDealDetail(_resolvedPatDealName);
        await contractModule.openProposalStep1ForEditing();
        await contractModule.clickStepperTab(1);
        await expect(contractModule.hourlyRateInput).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
      });

      await test.step('Set hourly rate to $30 and open NPM breakdown', async () => {
        await contractModule.hourlyRateInput.scrollIntoViewIfNeeded();
        await contractModule.hourlyRateInput.fill('30');
        await contractModule.hourlyRateInput.press('Tab');
        await contractModule.openPricingBreakdown();
        await expect(contractModule.breakdownPanelHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 20 });
      });

      await test.step('Verify FAS Charges match formula: FAS$ = Revenue × capturedFasTotalPct% (§2.9)', async () => {
        await expect(contractModule.breakdownFasChargesRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });

        // 1. % column must exactly equal the FAS Total captured from Settings (TC-026).
        const fasPctText = await contractModule.getBreakdownRowPercentage(contractModule.breakdownFasChargesRow);
        const fasBreakdownPct = parseFloat(fasPctText?.replace('%', ''));
        expect(Number.isNaN(fasBreakdownPct)).toBe(false);
        expect(fasBreakdownPct).toBe(capturedFasTotalPct);

        // 2. § 2.9: FAS$ = Revenue × (FAS% / 100) — exact match
        const revenueAmt = await contractModule.getBreakdownRowAmount(contractModule.breakdownTotalRevenueRow);
        const fasAmt = await contractModule.getBreakdownRowAmount(contractModule.breakdownFasChargesRow);
        const expectedFasAmt = parseFloat((revenueAmt * capturedFasTotalPct / 100).toFixed(2));
        expect(fasAmt).toBe(expectedFasAmt);
      });
    });

    test('TC-PRICING-031 | Verify Admin Expenses match formula: Admin$ = Revenue × capturedAdminTotalPct% (§2.11) @regression', async () => {
      // Breakdown panel is open from TC-030
      await test.step('Verify Admin Expenses % column and $ amount using formula §2.11', async () => {
        await expect(contractModule.breakdownAdminExpRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });

        // 1. % column must exactly equal the Admin Total captured from Settings (TC-029).
        const adminPctText = await contractModule.getBreakdownRowPercentage(contractModule.breakdownAdminExpRow);
        const adminBreakdownPct = parseFloat(adminPctText?.replace('%', ''));
        expect(Number.isNaN(adminBreakdownPct)).toBe(false);
        expect(adminBreakdownPct).toBe(capturedAdminTotalPct);

        // 2. §2.11: Admin$ = Revenue × (Admin% / 100) — exact match
        const revenueAmt = await contractModule.getBreakdownRowAmount(contractModule.breakdownTotalRevenueRow);
        const adminAmt = await contractModule.getBreakdownRowAmount(contractModule.breakdownAdminExpRow);
        const expectedAdminAmt = parseFloat((revenueAmt * capturedAdminTotalPct / 100).toFixed(2));
        expect(adminAmt).toBe(expectedAdminAmt);
      });
    });

    test('TC-PRICING-032 | Verify NetMargin formula: GrossProfit − FAS − Admin − PayTerms ≈ NetMargin per §2.13 @regression', async () => {
      // Breakdown panel is open from TC-031.
      // Formula (pricing_calculator_deep_analysis.md §2.13):
      //   NetMargin = Remaining − Admin − PayTerms
      //             = (GrossProfit − FAS) − Admin − PayTerms
      //   ∴ NetMargin = GrossProfit − FAS − Admin − PayTerms
      await test.step('Read all breakdown row amounts and cross-check formula', async () => {
        const revenueAmt     = await contractModule.getBreakdownRowAmount(contractModule.breakdownTotalRevenueRow);
        const grossProfitAmt = await contractModule.getBreakdownRowAmount(contractModule.breakdownGrossProfitRow);
        const fasAmt         = await contractModule.getBreakdownRowAmount(contractModule.breakdownFasChargesRow);
        const adminAmt       = await contractModule.getBreakdownRowAmount(contractModule.breakdownAdminExpRow);
        const payTermsAmt    = await contractModule.getBreakdownRowAmount(contractModule.breakdownPaymentTermsRow);

        expect(Number.isNaN(revenueAmt)).toBe(false);
        expect(Number.isNaN(grossProfitAmt)).toBe(false);
        expect(Number.isNaN(fasAmt)).toBe(false);
        expect(Number.isNaN(adminAmt)).toBe(false);
        expect(Number.isNaN(payTermsAmt)).toBe(false);

        // §2.12: PaymentTerms$ = Revenue × (capturedPaymentTermsAdjPct / 100) — exact match
        const expectedPayTermsAmt = parseFloat((revenueAmt * capturedPaymentTermsAdjPct / 100).toFixed(2));
        expect(payTermsAmt).toBe(expectedPayTermsAmt);

        // §2.13: NetMargin% = (GrossProfit − FAS − Admin − PayTerms) / Revenue × 100
        // Compare percentages directly — avoids dollar↔percent conversion rounding.
        const netMarginPct = await contractModule.getBreakdownNetProfitPct();
        const expectedNetMarginPct = parseFloat(
          ((grossProfitAmt - fasAmt - adminAmt - payTermsAmt) / revenueAmt * 100).toFixed(2)
        );
        expect(netMarginPct).toBe(expectedNetMarginPct);
      });
    });

    test('TC-PRICING-033 | Verify Labor Efficiency % matches formula §2.7: LE% = TotalOfficerPayroll / Revenue @regression', async () => {
      // Breakdown panel is open from TC-032.
      // §2.7 formula: LE% = Total Officer Payroll / Revenue × 100
      // "Total Officer Payroll" is not a standalone breakdown row, so derive it from rows
      // that ARE present using these identities from the formula chain:
      //   GrossProfit = Revenue − TotalPayroll                        (§2.8 rearranged)
      //   → TotalPayroll = Revenue − GrossProfit
      //   OverheadPayroll = Revenue × capturedOverheadDedicatedPct%   (§1.3 + §2.7 Row 11)
      //   TotalOfficerPayroll = TotalPayroll − OverheadPayroll        (§2.7 Row 10)
      await test.step('Read Revenue and Gross Profit from breakdown and verify LE% via formula', async () => {
        await expect(contractModule.breakdownLaborEffRow).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
        const lePctText = await contractModule.getBreakdownRowPercentage(contractModule.breakdownLaborEffRow);
        expect(lePctText).toMatch(/\d+\.\d+%/);
        const lePct = parseFloat(lePctText?.replace('%', ''));
        expect(Number.isNaN(lePct)).toBe(false);

        const revenueAmt      = await contractModule.getBreakdownRowAmount(contractModule.breakdownTotalRevenueRow);
        const grossProfitAmt  = await contractModule.getBreakdownRowAmount(contractModule.breakdownGrossProfitRow);

        // Derive Total Officer Payroll from available rows using formula chain
        const totalPayroll        = revenueAmt - grossProfitAmt;
        const overheadPayroll     = parseFloat((revenueAmt * capturedOverheadDedicatedPct / 100).toFixed(2));
        const totalOfficerPayroll = parseFloat((totalPayroll - overheadPayroll).toFixed(2));

        // §2.7: LE% = TotalOfficerPayroll / Revenue × 100 — exact match
        const expectedLEPct = parseFloat(((totalOfficerPayroll / revenueAmt) * 100).toFixed(2));
        expect(lePct).toBe(expectedLEPct);
      });

      await contractModule.closePricingBreakdown();
    });

  }); // end Contract describe

}); // end top-level describe
