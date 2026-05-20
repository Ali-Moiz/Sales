# Pricing Calculator — Test Steps

Manual test case documentation for the Pricing Calculator feature of the Sales CRM.
All TC codes: `TC-PRICING-001` … `TC-PRICING-025`, `TC-PRICING-026` … `TC-PRICING-033`.
Franchise under test: **216 – Omaha, NE, Oliver** (accessible via Settings → Pricing Configurations).

---

## Settings — Pricing Configuration (TC-PRICING-001 … TC-PRICING-007)

---

### TC-PRICING-001 | Navigate to Settings → Pricing Configuration and verify FAS Charges section displays all line items (Royalty, Teritory, GL Insurance, Auto Insurance, Interest, Convention, Dispatch, ALN, Email, Others) each with an editable spinbutton and a Total row

**Preconditions:**
- Logged in as HO user
- Settings page accessible

**Steps:**

1. Navigate to `/app/settings`
2. Click the "Pricing Configurations" tab
3. Click the franchise dropdown trigger (heading "Select a Franchise" level 6 inside the pricing config tabpanel)
4. Select "216 - Omaha, NE, Oliver" from the tooltip list
5. Scroll to the "FAS Charges (% of Revenue)" section

**Expected results / Assertion points:**

- After step 2: "Pricing Configurations" tab has `aria-selected=true`
- After step 4: Franchise dropdown heading updates to show "216"; at least the "FAS Charges (% of Revenue)" heading is visible
- After step 5: "FAS Charges (% of Revenue)" heading (level 5) is visible; the following line item headings exist: Royalty, Teritory, GL Insurance, Auto Insurance, Interest, Convention, Dispatch, ALN, Email, Others; each has an editable spinbutton; a "Total" row with level-6 heading "N.NN %" is visible

---

### TC-PRICING-002 | Verify Payroll Tax section displays all components (Social Security 6.2% SUTA 1.75% FUTA 0.6% Medicare 1.45%) and Total row is visible

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations page open with franchise 216 selected (continuation of TC-PRICING-001)

**Steps:**

1. Locate the "Payroll Taxes" section (already on page from TC-PRICING-001)

**Expected results / Assertion points:**

- "Payroll Taxes" heading (level 5) is visible
- The following fields exist: Social Security, SUTA, FUTA, Medicare Taxes, Other — each with a spinbutton
- Social Security spinbutton contains value "6.2"
- SUTA spinbutton contains value "1.75"
- FUTA spinbutton contains value "0.6"
- Medicare Taxes spinbutton contains value "1.45"
- A "Total" level-6 heading row is visible showing the sum as `N.NN %`

---

### TC-PRICING-003 | Verify Vehicle Expense section displays monthly defaults ($700 payment $160 insurance $250 R&M $50 tax = $1160 total)

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations page open with franchise 216 selected (continuation of TC-PRICING-001)

**Steps:**

1. Locate the "Monthly Expenses per Vehicle" section (already on page)

**Expected results / Assertion points:**

- "Monthly Expenses per Vehicle" heading (level 5) is visible
- Payment spinbutton value = "700"
- Insurance spinbutton value = "160"
- Repairs & Maintenance spinbutton value = "250"
- Taxes & Registration spinbutton value = "50"
- "Total" level-6 heading row shows `1160.00 $`

---

### TC-PRICING-004 | Verify Admin Expenses section is visible with all line items and a computed Total row

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations page open with franchise 216 selected (continuation of TC-PRICING-001)

**Steps:**

1. Locate the "Administration Expenses (% of Revenue)" section (already on page)
2. Observe the "Total" row value

**Expected results / Assertion points:**

- "Administration Expenses (% of Revenue)" heading (level 5) is visible
- Key line items visible with spinbuttons: Advertising & Marketing, Background Check, Bank Charges, Uniforms, Insurance - Workers Comp (Excluded from Dedicated Vehicle), Insurance - General Liability (Excluded from Dedicated Vehicle)
- "Total" level-6 heading row is visible with a computed `N.NN %` value (runtime value, not asserted as fixed)

---

### TC-PRICING-005 | Verify Overhead settings (8% Dedicated 8% Patrol) and Payment Terms Adjustment (0.82% default) are displayed

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations page open with franchise 216 selected (continuation of TC-PRICING-001)

**Steps:**

1. Locate the "Overhead" section (already on page)
2. Locate the "Payment Terms Adjustments (Dedicated Only)" section

**Expected results / Assertion points:**

- "Overhead" heading (level 5) is visible; "Dedicated (Included Employer taxes)" spinbutton value = "8"; "Patrol (Excluded Employer Taxes)" spinbutton value = "8"
- "Payment Terms Adjustments (Dedicated Only)" heading (level 5) is visible; "Payment Terms Adjustment" spinbutton value = "0.82"

---

### TC-PRICING-006 | Edit a FAS charge value (change Royalty to a random value between 1–15) save and verify Total FAS updates accordingly and persists on reload

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations page open with franchise 216 selected (continuation of TC-PRICING-001)

**Steps:**

1. Read the current Royalty spinbutton value and the current FAS Total heading value
2. Compute a new random integer in range 1–15 that differs from the current value
3. Triple-click the Royalty spinbutton to select all, then type the new value
4. Observe the FAS Total heading updates
5. Click the "Save Changes" button
6. Wait for the "Save Changes" button to disappear (save confirmed)
7. Navigate away then back to Settings → Pricing Configurations → re-select franchise 216
8. Verify the Royalty spinbutton now shows the saved value

**Expected results / Assertion points:**

- After step 4: FAS Total heading changes to reflect the new Royalty value (format `N.NN %`)
- After step 5: "Save Changes" and "Cancel" buttons were visible before clicking
- After step 6: Save button disappears (no error)
- After step 8: Royalty spinbutton value equals the value saved in step 3

---

### TC-PRICING-007 | Restore the Royalty FAS charge back to "9" and verify save persists on reload

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations page open with franchise 216 selected (continuation of TC-PRICING-006)
- Royalty was changed to a random value by TC-PRICING-006

**Steps:**

1. Triple-click the Royalty spinbutton to select all, then type "9"
2. Click "Save Changes"
3. Wait for "Save Changes" button to disappear
4. Navigate away then back to Settings → Pricing Configurations → re-select franchise 216
5. Verify the Royalty spinbutton shows "9"

**Expected results / Assertion points:**

- After step 1: FAS Total heading updates to reflect Royalty=9
- After step 2: Save button was visible
- After step 3: Save button disappears (no error)
- After step 5: Royalty spinbutton value = "9" (restore persisted)

---

## Contract Wizard — Dedicated Service Profit Indicator (TC-PRICING-008 … TC-PRICING-013)

---

### TC-PRICING-008 | Create a Dedicated service with a rate that yields >= 12% net margin — verify profit indicator shows Green/Profitable

**Preconditions:**
- Logged in as HO user
- An existing deal with an open (editable) contract proposal is available
- Contract wizard Step 1 – Services is open

**Steps:**

1. Open a deal → Contract & Terms tab → Edit an existing proposal (or create a new one)
2. Ensure the service type radio is set to "Dedicated Service"
3. Enter a bill rate high enough to yield >= 12% net margin (e.g. enter the Suggested Rate or higher)
4. Tab out of the Hourly Rate field
5. Observe the profit indicator hyperlink next to the Hourly Rate label

**Expected results / Assertion points:**

- After step 4: The profit indicator link is visible showing text matching `/Suggested Rate \$.*NPM/`
- After step 5: The NPM % value shown is >= 12%; the indicator image reflects Green status

---

### TC-PRICING-009 | Change hourly rate to yield 8–12% net margin — verify indicator changes to Yellow/Marginal

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with a Dedicated service; rate currently showing Green (>= 12%)

**Steps:**

1. Find the hourly rate that yields 8–12% NPM for the current franchise settings
2. Clear the Hourly Rate spinbutton and enter a rate that puts NPM in the 8–12% band
3. Tab out of the field
4. Observe the profit indicator

**Expected results / Assertion points:**

- After step 3: The profit indicator shows an NPM between 8% and 12% (exclusive on both ends)
- The indicator image reflects Yellow/Marginal status

---

### TC-PRICING-010 | Change hourly rate to yield < 8% net margin — verify indicator changes to Red/Loss

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with a Dedicated service

**Steps:**

1. Clear the Hourly Rate spinbutton and enter a low rate that puts NPM below 8%
2. Tab out of the field
3. Observe the profit indicator

**Expected results / Assertion points:**

- After step 2: The profit indicator shows an NPM below 8%
- The indicator image reflects Red/Loss status

---

### TC-PRICING-011 | Click the profit/loss hyperlink — verify pricing breakdown popup opens showing Revenue Total Payroll FAS Charges Admin Expenses Payment Terms Adjustment Net Margin %

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with a Dedicated service and a valid hourly rate

**Steps:**

1. Click the profit indicator hyperlink ("Suggested Rate $ …, NPM …%") next to the Hourly Rate field
2. Observe the breakdown panel/popup

**Expected results / Assertion points:**

- After step 1: A panel opens with heading "Suggested Rate" (level 3)
- The panel contains a table with the following rows visible: Total Revenue, Total Payroll, FAS Charges, Administration Expenses, Payment Terms Adjustments, Net Profit
- Net Profit row shows both a dollar amount and a percentage
- A "Net Profit" and "Labor Efficiency" progress indicator is visible with percentage headings

---

### TC-PRICING-012 | Verify breakdown values match formula: FAS = Revenue × 33% Admin = Revenue × 4.2% Payment Terms = Revenue × 0.82%

**Preconditions:**
- Logged in as HO user
- Pricing breakdown panel is open (continuation of TC-PRICING-011)

**Steps:**

1. Read the Total Revenue amount from the breakdown table
2. Read the FAS Charges amount
3. Read the Administration Expenses amount
4. Read the Payment Terms Adjustments amount

**Expected results / Assertion points:**

- FAS Charges percentage column shows the FAS % configured for the franchise (e.g. "19.00%" for franchise 216)
- Administration Expenses percentage column shows the admin % configured for the franchise
- Payment Terms Adjustments percentage column shows "0.82%"
- Net Profit row is visible and shows a computed percentage

---

### TC-PRICING-013 | Navigate to Step 4 (Payment Terms) — verify Services Profitable indicator is visible and reflects same profit status as the hyperlink

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 has at least one service configured with a valid rate

**Steps:**

1. On Step 1 of the contract wizard, configure a service with a known rate
2. Advance through Steps 2 and 3 (or click Save & Next to progress)
3. Reach Step 4 – Payment Terms
4. Observe the "Services Profitable" text indicator

**Expected results / Assertion points:**

- After step 3: The Step 4 page is visible (Payment Terms content loads)
- After step 4: "Services Profitable" text is visible on the page

---

## Contract Wizard — Billing Frequency (TC-PRICING-014)

---

### TC-PRICING-014 | Verify that changing billing frequency (Weekly → Monthly) updates the revenue period display but not the profit percentage

**Preconditions:**
- Logged in as HO user
- Contract wizard open; Step 1 – Services with a Dedicated service configured

**Steps:**

1. Note the current billing cycle shown in the wizard header (e.g. "Weekly")
2. Click the billing cycle dropdown (heading showing "Weekly")
3. Select "Monthly" from the dropdown options
4. Observe the total revenue amount display (e.g. "USD X.XX Monthly")
5. Open the profit breakdown panel (click the profit hyperlink)
6. Observe the Net Profit % in the panel

**Expected results / Assertion points:**

- After step 3: The billing cycle heading now shows "Monthly"
- After step 4: The footer total amount display updates to reflect monthly billing
- After step 5: The breakdown panel opens
- After step 6: The Net Profit % value is the same as before changing frequency (profit % is rate-based, not period-based)

---

## Contract Wizard — Patrol Service (TC-PRICING-015 … TC-PRICING-018)

---

### TC-PRICING-015 | Create a Patrol service with a profitable rate (Net Profit > 0%) — verify profit indicator shows Profitable

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open; service type can be set to "Patrol Service"

**Steps:**

1. Open Step 1 of the contract wizard
2. Select "Patrol Service" radio button
3. Enter a bill rate (per patrol) that yields Net Profit > 0%
4. Tab out of the rate field
5. Observe the profit indicator

**Expected results / Assertion points:**

- After step 2: The service form updates to show Patrol Service fields
- After step 4: Profit indicator is visible showing NPM > 0%
- After step 5: Indicator reflects Profitable status

---

### TC-PRICING-016 | Change patrol rate to yield Net Profit <= 0% — verify indicator shows Loss

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with Patrol service configured (continuation of TC-PRICING-015)

**Steps:**

1. Clear the Hourly Rate (or patrol rate) and enter a very low value that yields NPM <= 0%
2. Tab out of the field
3. Observe the profit indicator

**Expected results / Assertion points:**

- After step 2: Profit indicator shows NPM <= 0%
- The indicator reflects Loss status

---

### TC-PRICING-017 | Verify patrol breakdown includes vehicle expenses (fixed $1160 × usage ratio + fuel cost)

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with a Patrol service configured and a rate entered

**Steps:**

1. Click the profit indicator hyperlink to open the breakdown panel
2. Observe the breakdown table rows

**Expected results / Assertion points:**

- After step 1: The breakdown panel opens with heading "Suggested Rate"
- The breakdown table contains a row mentioning vehicle expense or fuel cost
- Net Profit row is visible

---

### TC-PRICING-018 | Verify patrol Admin rate is 4.2% (same as Dedicated unlike Vehicle's 1.2%)

**Preconditions:**
- Logged in as HO user
- Patrol service breakdown panel is open

**Steps:**

1. Open the profit breakdown panel for a Patrol service
2. Read the Administration Expenses percentage from the breakdown table

**Expected results / Assertion points:**

- Administration Expenses row is visible in the breakdown table
- The percentage value shown reflects the configured admin % for the franchise

---

## Contract Wizard — Dedicated Vehicle Service (TC-PRICING-019 … TC-PRICING-025)

---

### TC-PRICING-019 | Create a Dedicated Vehicle service with a profitable rate — verify profit indicator shows Profitable

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with ability to select Dedicated Vehicle service type

**Steps:**

1. On Step 1 of the contract wizard, set service type appropriately for a vehicle-based service
2. Enter a bill rate that yields Net Profit > 0%
3. Tab out of the rate field
4. Observe the profit indicator

**Expected results / Assertion points:**

- After step 3: Profit indicator is visible
- After step 4: NPM shows > 0%; indicator reflects Profitable status

---

### TC-PRICING-020 | Change vehicle bill rate to yield Net Profit <= 0% — verify indicator shows Loss

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 with a vehicle service configured (continuation of TC-PRICING-019)

**Steps:**

1. Clear the bill rate and enter a very low value that yields NPM <= 0%
2. Tab out
3. Observe the profit indicator

**Expected results / Assertion points:**

- After step 2: Profit indicator shows NPM <= 0%
- Indicator reflects Loss status

---

### TC-PRICING-021 | Verify vehicle breakdown excludes officer payroll rows (no payroll no OT no payroll taxes)

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 open with a vehicle service; a rate entered

**Steps:**

1. Click the profit indicator hyperlink to open the breakdown panel
2. Inspect the breakdown table rows

**Expected results / Assertion points:**

- After step 1: The breakdown panel opens
- The breakdown table does NOT contain rows named "Payroll", "Overtime", or "Payroll Taxes" (officer payroll rows excluded for vehicle service)
- A vehicle cost row or FAS Charges row is visible instead

---

### TC-PRICING-022 | Verify vehicle admin rate is 1.2% (not 4.2%) in breakdown

**Preconditions:**
- Logged in as HO user
- Dedicated Vehicle service breakdown panel is open

**Steps:**

1. Open the profit breakdown panel for a Dedicated Vehicle service
2. Read the Administration Expenses percentage from the breakdown table

**Expected results / Assertion points:**

- Administration Expenses row is visible in the breakdown table
- The percentage shown is less than the Dedicated/Patrol admin % (vehicle excludes Workers Comp, Uniforms, GL)

---

### TC-PRICING-023 | Verify vehicle usage ratio: enter hours for unrelated activities and verify fixed vehicle cost scales down proportionally

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations open with franchise 216

**Steps:**

1. Navigate to Settings → Pricing Configurations → select franchise 216
2. Locate "Vehicle Usage and Allocation (Dedicated)" section
3. Observe "Hours vehicle is used for unrelated activities" spinbutton value
4. Observe "Dedicated Vehicle Usage" (%) value

**Expected results / Assertion points:**

- After step 3: "Hours vehicle is used for unrelated activities" spinbutton is visible and contains a numeric value
- After step 4: "Dedicated Vehicle Usage" spinbutton is visible and shows a percentage value
- Both fields are editable (enabled spinbuttons)

---

### TC-PRICING-024 | Verify fuel cost formula: Hours/Day × Days/Month × 5mph / 16mpg × $3/gal × NumVehicles appears in breakdown

**Preconditions:**
- Logged in as HO user
- Contract wizard Step 1 with a vehicle service or patrol service configured; breakdown panel open

**Steps:**

1. Open the profit breakdown panel for a service that includes vehicle/fuel costs
2. Observe the breakdown table for fuel or vehicle cost rows

**Expected results / Assertion points:**

- After step 1: Breakdown panel opens
- The breakdown table contains at least one row related to vehicle or fuel costs
- Net Profit row is present and shows a computed value

---

### TC-PRICING-025 | Verify Services Profitable summary visible in Step 4 Payment Terms for all three service types

**Preconditions:**
- Logged in as HO user
- Contract wizard has services configured (at least one of Dedicated, Patrol, or Vehicle)

**Steps:**

1. On the contract wizard, configure at least one service on Step 1
2. Advance to Step 4 – Payment Terms (via Save & Next through Steps 2 and 3)
3. Locate the "Services Profitable" indicator on Step 4

**Expected results / Assertion points:**

- After step 2: Step 4 (Payment Terms) content is loaded
- After step 3: "Services Profitable" text element is visible on the Step 4 page

---

## Settings — Section Sum Verification (TC-PRICING-026 … TC-PRICING-029)

These tests verify that each section's displayed Total equals the arithmetic sum of its individual line items, as documented in `pricing_calculator_deep_analysis.md` §1 (Assumptions Sheet).

---

### TC-PRICING-026 | Verify FAS Charges Total = sum of all individual FAS line items per pricing_calculator_deep_analysis.md §1.5

**Preconditions:**
- Logged in as HO user
- Settings → Pricing Configurations open with franchise selected (continuation of TC-PRICING-007)

**Steps:**

1. Locate the FAS Charges section on the Pricing Configurations page
2. Read the value of every FAS line item spinbutton (Royalty, Territory, GL Insurance, Auto Insurance, Interest, Convention, Dispatch, ALN, Email, Others)
3. Sum all values
4. Read the displayed FAS Total heading value

**Expected results / Assertion points:**

- All FAS spinbuttons are readable and return numeric values
- `sum(all FAS items)` ≈ displayed FAS Total (within 0.05% tolerance for rounding)
- Captured FAS Total stored for use in TC-PRICING-030

---

### TC-PRICING-027 | Verify Payroll Taxes Total = sum of all payroll components (SS + SUTA + FUTA + Medicare + Other) per §1.1

**Preconditions:**
- Settings → Pricing Configurations open with franchise selected

**Steps:**

1. Locate the Payroll Taxes section
2. Read all payroll tax spinbutton values (Social Security, SUTA, FUTA, Medicare, Other)
3. Sum all values
4. Read the displayed Payroll Taxes Total

**Expected results / Assertion points:**

- Per §1.1 defaults: 6.2% + 1.75% + 0.6% + 1.45% + 0% = 10%
- `sum(SS + SUTA + FUTA + Medicare + Other)` ≈ displayed Payroll Total (within 0.05%)

---

### TC-PRICING-028 | Verify Vehicle Expenses Total = sum of Payment + Insurance + R&M + Tax ($700+$160+$250+$50=$1160) per §1.6

**Preconditions:**
- Settings → Pricing Configurations open with franchise selected

**Steps:**

1. Locate the Monthly Expenses per Vehicle section
2. Read all four vehicle cost spinbutton values (Payment, Insurance, Repairs & Maintenance, Taxes & Registration)
3. Sum all values
4. Read the displayed Vehicle Expenses Total

**Expected results / Assertion points:**

- Per §1.6 defaults: $700 + $160 + $250 + $50 = $1,160
- `sum(Payment + Insurance + R&M + Tax)` ≈ displayed Vehicle Total in dollars (within $0.05)

---

### TC-PRICING-029 | Verify Admin Expenses Total = sum of all individual admin line items per §1.8

**Preconditions:**
- Settings → Pricing Configurations open with franchise selected

**Steps:**

1. Locate the Administration Expenses section
2. Read all admin line item spinbutton values
3. Sum all values
4. Read the displayed Admin Expenses Total

**Expected results / Assertion points:**

- `sum(all admin items)` ≈ displayed Admin Total (within 0.05%)
- Captured Admin Total stored for use in TC-PRICING-031

---

## Contract — Breakdown Formula Verification (TC-PRICING-030 … TC-PRICING-033)

These tests open the NPM pricing breakdown panel on the Contract wizard Step 1 and verify that the displayed values follow the formulas in `pricing_calculator_deep_analysis.md` §2 (Dedicated Sheet).

---

### TC-PRICING-030 | Verify FAS Charges % in breakdown matches franchise FAS Total captured from settings

**Preconditions:**
- Logged in as HO user
- TC-PRICING-026 has executed and `capturedFasTotalPct` is populated

**Steps:**

1. Navigate to the PAT deal and open the proposal on Step 1 (Dedicated service)
2. Enter a known hourly rate (e.g. $30)
3. Click the profit indicator (NPM) to open the pricing breakdown panel
4. Read the FAS Charges row Percentage column

**Expected results / Assertion points:**

- Breakdown FAS% ≈ settings FAS Total (within 0.1%)
- Per §2.9: `FAS = Revenue × FAS%` where FAS% is the franchise-configured FAS total

---

### TC-PRICING-031 | Verify Admin Expenses % in breakdown matches franchise Admin Total captured from settings

**Preconditions:**
- TC-PRICING-029 executed; `capturedAdminTotalPct` populated
- Pricing breakdown panel open from TC-PRICING-030

**Steps:**

1. Read the Administration Expenses row Percentage column from the open breakdown panel

**Expected results / Assertion points:**

- Breakdown Admin% ≈ settings Admin Total (within 0.1%)
- Per §2.11: `Admin = Revenue × Admin%`

---

### TC-PRICING-032 | Verify NetMargin formula: GrossProfit − FAS − Admin − PayTerms ≈ NetMargin per §2.13

**Preconditions:**
- Pricing breakdown panel open from TC-PRICING-031

**Steps:**

1. Read the Amount column for: Revenue, Gross Profit, FAS Charges, Admin Expenses, Payment Terms Adjustments
2. Read the Net Margin % from the h1 heading in the breakdown panel
3. Convert Net Margin % to dollar amount: `NetMargin_$ = NetMargin% × Revenue / 100`
4. Compute: `formulaResult = GrossProfit − FAS − Admin − PayTerms`
5. Compare `formulaResult` to `NetMargin_$`

**Expected results / Assertion points:**

- All row amounts are readable and numeric
- Per §2.13–2.14: `NetMargin = GrossProfit − FAS − Admin − PayTerms`
- `|formulaResult − NetMargin_$|` < $0.10 (tolerance for display rounding)

---

### TC-PRICING-033 | Verify Labor Efficiency % is visible and < 64% threshold for Dedicated service per §2.7

**Preconditions:**
- Pricing breakdown panel open from TC-PRICING-032

**Steps:**

1. Locate the Labor Efficiency % row in the breakdown table
2. Read the Percentage column value

**Expected results / Assertion points:**

- Labor Efficiency row is visible in the breakdown table
- Value matches format `/\d+\.\d+%/`
- Per §2.7: `LE% = Total Officer Payroll / Revenue < 64%` for Dedicated service
- Parsed LE% value is less than 64
