# Contract Module — Step 2 (Devices) & Step 3 (On Demand): Complete Reference

## Overview

This document covers everything explored, implemented, and verified for **Step 2: Devices** and **Step 3: On Demand** inside the Contract & Terms stepper of Signal CRM.

The Contract stepper is reached via:
**Deals List → Click Deal Row → Contract & Terms tab → Create Proposal → Submit Drawer → Stepper Opens**

The full stepper path URL pattern:
```
/app/sales/deals/deal/:dealId/contract/:contractId
```

The stepper has six ordered steps:
1. Services
2. **Devices** ← covered here
3. **On Demand** ← covered here
4. Payment Terms
5. Description
6. Signees

---

## Where These Steps Live in the Codebase

| Area | File |
|------|------|
| Page Object Model | `pages/contract-module.js` |
| E2E Spec (tests) | `tests/e2e/contract-module.spec.js` |
| Test Data | `utils/contract-test-data.js` + `data/test-data.json` |
| Shared State | `utils/shared-run-state.js` |

---

## Step 2 — Devices (Checkpoints & Devices)

### What Is Step 2?

Step 2 is the **Checkpoints & Devices** configuration screen inside the contract stepper. It lets the user select the quantity of hardware tracking devices that will be deployed for the security contract. There are three device types available:

- **NFC Tags**
- **Beacons**
- **QR Tags**

Each device has a quantity selector with `+` and `−` buttons. A running **Total** is shown at the top and updates in real time as quantities are adjusted.

### How Step 2 Is Reached

Step 2 becomes active after clicking **Save & Next** on Step 1 (Services), once all Step 1 required fields have been filled:
- Service Name
- Resource Type (custom dropdown)
- Line Item (custom dropdown)
- Officer/Guard count
- Hourly Rate
- At least one Job Day selected
- Start Time set
- End Time set

### Locators (Page Object)

Defined in `ContractModule` constructor in `pages/contract-module.js`:

```js
// Step 2 heading — live-verified: heading level=3
this.devicesPageHeading = page.getByRole('heading', {
  name: 'Checkpoints & Devices',
  level: 3
});

// Total cost heading — live-verified: heading level=5, starts with "Total:"
this.devicesTotalHeading = page.getByRole('heading', {
  name: /^Total:/,
  level: 5
});
```

Individual device headings (used in test assertions and quantity interaction):
```js
// Each device row has an h6 heading with the device name
page.getByRole('heading', { name: 'NFC Tags', level: 6 })
page.getByRole('heading', { name: 'Beacons',  level: 6 })
page.getByRole('heading', { name: 'QR Tags',  level: 6 })
```

The `+` button for each device is located via XPath relative to its heading:
```js
page.getByRole('heading', { name: deviceName, level: 6 })
    .locator('xpath=following::button[normalize-space()="+"][1]')
```

### Page Object Methods for Step 2

**`assertStep2Visible()`**
Waits for the `Checkpoints & Devices` heading to be visible. This is the primary assertion that Step 2 is active.
```js
async assertStep2Visible() {
  await expect(this.devicesPageHeading).toBeVisible({ timeout: 10_000 });
}
```

**`addDeviceQuantity(deviceName, count)`**
Increments the quantity for a named device by clicking its `+` button `count` times (default: 1). Works for `'NFC Tags'`, `'Beacons'`, and `'QR Tags'`.
```js
async addDeviceQuantity(deviceName, count = 1) {
  const plusBtn = this.page
    .getByRole('heading', { name: deviceName, level: 6 })
    .locator('xpath=following::button[normalize-space()="+"][1]');
  for (let i = 0; i < count; i++) {
    await plusBtn.click({ force: true });
    await this.page.waitForTimeout(250);
  }
}
```

**`goToStep3FromDevices()`**
A fallback navigation method used when `Save & Next` is not enabled on Step 2 (e.g., because no device was added and the stepper allows skipping). It tries clicking `Save & Next` first, then falls back to directly clicking the Step 3 tab heading.
```js
async goToStep3FromDevices() {
  await this.stepperStep3.waitFor({ state: 'visible', timeout: 8_000 });

  const saveEnabled = await this.saveAndNextBtn.isEnabled().catch(() => false);
  if (saveEnabled) {
    await this.saveAndNextBtn.click();
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    return;
  }

  // Fallback: click the Step 3 wrapper or heading directly
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
```

### Verified UI Behaviour

- All three device rows (NFC Tags, Beacons, QR Tags) are visible on Step 2 by default.
- Default quantity for each device is `0`.
- Total heading shows `Total: 0.00` on initial load.
- When NFC Tags quantity is incremented by 1, the total updates to `$30.00` (each NFC Tag = $30).
- The `+` and `−` buttons use `force: true` click because they may be partially overlapped by other elements.
- A 250ms wait is added after each `+` click to allow React to reconcile the state.
- `Save & Next` may or may not be enabled after adjusting quantities — the test handles both cases gracefully.

### Known Implementation Notes

- The `+` button locator uses XPath `following::button[normalize-space()="+"][1]` anchored on the device heading. This is the most reliable approach since the buttons have no unique accessible names of their own.
- The Total heading uses a regex `/^Total:/` because the displayed amount changes dynamically.
- Device selection is optional — the stepper can advance to Step 3 without adding any devices.

---

## Step 2 Test Cases

### TC-CONTRACT-E2E-005 | Step 2 Devices shows Checkpoints and Devices heading

**Section:** 13 — Step 2: Devices
**Priority:** P1 — High

**Preconditions:**
- Step 1 (Services) has been completed and `Save & Next` was clicked
- Step 2 is now active

**Steps:**
1. Assert `Checkpoints & Devices` heading (level=3) is visible
2. Assert `Total:` heading (level=5) is visible
3. Assert `NFC Tags` heading (level=6) is visible
4. Assert `Beacons` heading (level=6) is visible
5. Assert `QR Tags` heading (level=6) is visible

**Expected Result:**
All device rows and the total display are rendered correctly on Step 2.

**Spec Code:**
```js
test('TC-CONTRACT-E2E-005 | Step 2 Devices shows Checkpoints and Devices heading', async () => {
  test.setTimeout(60_000);
  await cm.assertStep2Visible();
  await expect(cm.devicesTotalHeading).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('heading', { name: 'NFC Tags', level: 6 })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('heading', { name: 'Beacons',  level: 6 })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('heading', { name: 'QR Tags',  level: 6 })).toBeVisible({ timeout: 5_000 });
});
```

---

### TC-CONTRACT-E2E-006 | Add NFC Tag quantity and advance to Step 3

**Section:** 13 — Step 2: Devices
**Priority:** P1 — High

**Preconditions:**
- Step 2 Devices is active
- All device quantities are currently 0

**Steps:**
1. Click `+` for `NFC Tags` once (quantity becomes 1)
2. Assert `Total: $30.00` heading is visible
3. If `Save & Next` is enabled, click it
4. If `Save & Next` is not enabled, use `goToStep3FromDevices()` fallback
5. Assert `Additional Services Pricing` heading (Step 3) is visible

**Expected Result:**
- NFC Tags quantity increments to 1
- Total updates to `$30.00`
- Step 3 (On Demand) opens successfully

**Spec Code:**
```js
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
```

---

## Step 3 — On Demand (Additional Services Pricing)

### What Is Step 3?

Step 3 is the **On Demand / Additional Services Pricing** screen. It allows the user to configure pricing for additional on-demand security services that are not part of the regular recurring schedule. This step is primarily informational and structural — in the current implementation, no mandatory data entry is required to advance past Step 3.

### How Step 3 Is Reached

Step 3 becomes active after completing Step 2 (Devices), either by:
- Clicking `Save & Next` when it is enabled after adjusting device quantities, or
- Using the `goToStep3FromDevices()` fallback which directly clicks the Step 3 stepper tab

### Locators (Page Object)

Defined in the `ContractModule` constructor in `pages/contract-module.js`:

```js
// Step 3 heading — live-verified: heading level=3
this.onDemandPageHeading = page.getByRole('heading', {
  name: 'Additional Services Pricing',
  level: 3
});
```

The Step 3 stepper tab (in the top step bar) is shared with all steps:
```js
this.stepperStep3 = page.getByRole('heading', { name: '3. On Demand', level: 6 });
```

### Page Object Methods for Step 3

**`assertStep3Visible()`**
Waits for the `Additional Services Pricing` heading to be visible. This is the primary assertion that Step 3 is active.
```js
async assertStep3Visible() {
  await expect(this.onDemandPageHeading).toBeVisible({ timeout: 10_000 });
}
```

**`clickSaveAndNext()`** (shared across all steps)
Used to advance from Step 3 to Step 4. Handles both `Save & Next` and `Update Proposal` button variants:
```js
async clickSaveAndNext() {
  const saveAndNextVisible = await this.saveAndNextBtn.isVisible().catch(() => false);
  const primaryActionButton = saveAndNextVisible
    ? this.saveAndNextBtn
    : this.updateProposalBtn;

  await primaryActionButton.waitFor({ state: 'visible', timeout: 10_000 });
  await expect(primaryActionButton).toBeEnabled({ timeout: 8_000 });
  await primaryActionButton.click();
  await this.page.waitForTimeout(800);
  await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
}
```

### Verified UI Behaviour

- The heading `Additional Services Pricing` (level=3) is visible when Step 3 is active.
- Step 3 does **not** require any mandatory user input to advance — `Save & Next` is enabled immediately on arrival.
- After clicking `Save & Next` on Step 3, the page moves to Step 4 (Payment Terms) showing the `Select Billing Occurrence` heading.
- If `Save & Next` does not navigate automatically, the test falls back to directly clicking the `4. Payment Terms` stepper tab heading (`cm.stepperStep4.click({ force: true })`).

### Known Implementation Notes

- Step 3 is a transitional step — no data is filled here in the E2E suite.
- The step is kept in the stepper flow because the app architecture reserves this position for on-demand service pricing configurations.
- Advancing from Step 3 uses the same `clickSaveAndNext()` helper as all other steps.
- The fallback for Step 4 visibility check (`cm.billingOccurrenceHeading.isVisible()`) is used to detect if navigation was successful before manually clicking Step 4.

---

## Step 3 Test Cases

### TC-CONTRACT-E2E-007 | Step 3 On Demand is visible and advances to Step 4

**Section:** 14 — Step 3: On Demand
**Priority:** P1 — High

**Preconditions:**
- Step 2 (Devices) has been completed
- Step 3 (On Demand) is now active

**Steps:**
1. Assert `Additional Services Pricing` heading (level=3) is visible
2. Click `Save & Next`
3. If Step 4 does not appear automatically, click `4. Payment Terms` stepper tab directly
4. Assert `Select Billing Occurrence` heading (Step 4) is visible

**Expected Result:**
- Step 3 `Additional Services Pricing` heading is displayed correctly
- Step 4 (Payment Terms) opens after advancing

**Spec Code:**
```js
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
```

---

## Stepper Navigation Context (Steps 2 & 3 in the Full Flow)

The following shows where Steps 2 and 3 sit in the complete stepper navigation chain:

```
Step 1: Services
  ↓  Fill: Service Name, Resource Type, Line Item,
  ↓        Officer Count, Hourly Rate, Job Days,
  ↓        Start Time, End Time
  ↓  Click: Save & Next
  ↓
Step 2: Devices  ← TC-CONTRACT-E2E-005, TC-CONTRACT-E2E-006
  ↓  Optionally adjust device quantities (NFC Tags, Beacons, QR Tags)
  ↓  Total updates live ($30 per NFC Tag verified)
  ↓  Click: Save & Next (or goToStep3FromDevices fallback)
  ↓
Step 3: On Demand  ← TC-CONTRACT-E2E-007
  ↓  No mandatory input required
  ↓  Click: Save & Next (or click Step 4 tab directly as fallback)
  ↓
Step 4: Payment Terms
  ↓  Fill: Annual Rate Increase, Billing Type, Contract Type,
  ↓        Billing Frequency, Payment Terms, Payment Method,
  ↓        Cycle Reference Date, Billing Contact (First/Last Name, Email, Phone)
  ↓
Step 5: Description
  ↓  Pre-filled content verified (character counter shows > 0 / 3550)
  ↓
Step 6: Signees
  ↓  Default signee (logged-in user) pre-added
  ↓  Click: Finish
  ↓
Deal Detail Page → Proposal Card → Publish Contract
```

---

## Shared Stepper Locators Used by Steps 2 & 3

These locators are defined in the constructor and shared across all stepper steps:

```js
// Stepper top bar — step headings (level=6)
this.stepperStep2 = page.getByRole('heading', { name: '2. Devices',   level: 6 });
this.stepperStep3 = page.getByRole('heading', { name: '3. On Demand', level: 6 });

// Bottom action buttons (shared across all steps)
this.saveAndNextBtn    = page.getByRole('button', { name: 'Save & Next' });
this.updateProposalBtn = page.getByRole('button', { name: 'Update Proposal' });
this.finishBtn         = page.getByRole('button', { name: 'Finish' });
this.previewBtn        = page.getByRole('button', { name: 'Preview' });
```

**`assertStepperTabsVisible()`** — asserts all 6 step tabs are visible (called after proposal submission):
```js
async assertStepperTabsVisible() {
  await expect(this.stepperStep1).toBeVisible({ timeout: 10_000 });
  await expect(this.stepperStep2).toBeVisible({ timeout: 5_000 });
  await expect(this.stepperStep3).toBeVisible({ timeout: 5_000 });
  await expect(this.stepperStep4).toBeVisible({ timeout: 5_000 });
  await expect(this.stepperStep5).toBeVisible({ timeout: 5_000 });
  await expect(this.stepperStep6).toBeVisible({ timeout: 5_000 });
}
```

---

## Test Execution

### Run Only Step 2 & Step 3 Tests

```bash
# Run TC-CONTRACT-E2E-005 (Step 2 structure)
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js \
  --project=chrome --grep "TC-CONTRACT-E2E-005"

# Run TC-CONTRACT-E2E-006 (Step 2 NFC quantity + advance to Step 3)
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js \
  --project=chrome --grep "TC-CONTRACT-E2E-006"

# Run TC-CONTRACT-E2E-007 (Step 3 visible + advance to Step 4)
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js \
  --project=chrome --grep "TC-CONTRACT-E2E-007"
```

### Run Full E2E Suite (All Steps Including 2 & 3)

```bash
# Headless
npx playwright test tests/e2e/contract-module.spec.js --project=chrome

# Headed
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js --project=chrome
```

### Run from Step 2 Through Step 3 Only (Sequential Slice)

Since the suite uses `test.describe.serial`, tests E2E-005, E2E-006, and E2E-007 depend on the state set up by E2E-004 (Step 1 completion). Run from E2E-004 through E2E-007 to isolate Steps 1–3:

```bash
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js \
  --project=chrome --grep "TC-CONTRACT-E2E-00[4-7]"
```

---

## Important Notes & Gotchas

**1. Serial dependency chain**
Steps 2 and 3 tests (`E2E-005`, `E2E-006`, `E2E-007`) depend entirely on Step 1 (`E2E-004`) having completed successfully. The suite uses `test.describe.serial`, so if E2E-004 fails, all subsequent tests are skipped.

**2. The NFC Tag price is $30**
When 1 NFC Tag is added, the Total heading changes to `Total: $30.00`. This is the only price that has been live-verified in the test. The test asserts this exact figure with the regex `/Total:\s*\$30\.00/`.

**3. Step 3 requires no data entry**
Unlike Steps 1 and 4, Step 3 (On Demand) does not have any required form fields. `Save & Next` is enabled immediately without any interaction. This is by design — the step exists in the stepper for optional on-demand pricing configurations.

**4. Dual-path navigation for Step 3**
If `Save & Next` fails to navigate to Step 4, the test falls back to clicking the `4. Payment Terms` stepper tab directly. This resilience is intentional because the stepper's navigation state can vary depending on whether the proposal was freshly created or resumed from a previous run.

**5. Force clicking the `+` button**
The device quantity `+` buttons are clicked with `{ force: true }` because they can be partially obscured by other UI elements. The 250ms wait after each click ensures React reconciles the quantity state before the next interaction.

**6. Rerun safety**
If the E2E deal already has a proposal from a previous run (state is `'proposal'` or `'stepper'` instead of `'empty'`), the `ensureContractStepperReady()` helper function handles resuming from the correct state without re-creating anything.
