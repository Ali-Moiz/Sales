# Contract Module — Test Steps

## Create Proposal — TC-CONTRACT-001 through TC-CONTRACT-030

### TC-CONTRACT-001
**Verify default Proposal Name is pre-filled with Deal Name (linked by default).**
1. Navigate to Deals list page.
2. Open a deal that has no existing proposal (empty Contract & Terms state).
3. Click "Create Proposal" to open the drawer.
4. Verify the Proposal Name input is pre-filled with the deal name.
5. Cancel the drawer.

### TC-CONTRACT-002
**Verify user can edit Proposal Name and updated value is used throughout contract (wizard header/contract card).**
1. Open the target deal detail page.
2. Open the Create Proposal drawer.
3. Clear the Proposal Name and type a new custom name.
4. Verify the input reflects the updated value.
5. Cancel the drawer.

### TC-CONTRACT-003
**Verify Proposal Name is required and cannot be blank; show validation on Create Proposal.**
1. Open the target deal and Create Proposal drawer.
2. Clear the Proposal Name field so it is blank.
3. Fill other mandatory fields (Time Zone, Start Date, Renewal Date).
4. Click "Create Proposal" submit button.
5. Verify the URL does not navigate to a contract stepper page.
6. Verify the drawer remains open.
7. Verify a required validation indicator appears (error text or aria-invalid on the input).
8. Cancel the drawer.

### TC-CONTRACT-004
**Verify Time Zone is required and user can select Eastern Time (UTC-05:00); selection is saved for contract. / Verify Create Proposal blocked when Time Zone is not selected; show required validation.**
1. Open the target deal and Create Proposal drawer.
2. Verify the Time Zone trigger is visible — it is a clickable container showing a level-6 heading like "(UTC-XX:XX) [name]...". The Time Zone is pre-selected by default (observed: "(UTC-04:00) Atlantic...").
3. Fill Proposal Name, Start Date, and Renewal Date.
4. The Time Zone is pre-selected by default; verify the trigger element is visible with a UTC label.
5. If for any reason Time Zone is not pre-selected, submit the form and verify submission is blocked with a required validation indicator, then select a time zone.
6. Cancel the drawer.

### TC-CONTRACT-005
**Verify contract dates behavior: user can set Start Date + (End Date OR Renewal Date).**
1. Open the target deal and Create Proposal drawer.
2. Verify the drawer heading is visible.
3. Verify date field structure: Start Date input, date type radio group, and Renewal Date input are visible.
4. Cancel the drawer.

### TC-CONTRACT-006
**Verify Start Date is required when 'Contract Dates to be decided' is unchecked.**
1. Open the target deal and Create Proposal drawer.
2. Verify "Contract Dates to be decided" is unchecked and Start Date input is visible.
3. Fill Proposal Name, Time Zone, Start Date, and Renewal Date (Renewal Date is enabled only after Start Date is filled).
4. Clear the Start Date field. Renewal Date input returns to disabled state but retains its previously filled value.
5. Click submit.
6. Verify submission is blocked (URL does not change to stepper, drawer stays open).
7. Verify a required validation indicator appears for Start Date (error text or aria-invalid).
8. Cancel the drawer.

### TC-CONTRACT-007
**Verify Auto Renewal of Contract check box can be checked and value persists in Create Proposal drawer.**
1. Open the shared deal and Create Proposal drawer.
2. Verify "Auto Renewal of Contract" label and checkbox are visible and unchecked.
3. Fill required fields: Proposal Name, Time Zone, Start Date, and Renewal Date.
4. Check the "Auto Renewal of Contract" checkbox and verify it is checked.
5. Verify that checking Auto Renewal replaces "Notify for Auto-Renewal Before (Days)" with two fields: "Drafts Before (Days)" (default 10) and "Auto Publish Before (Days)" (default 5).
6. Interact with other fields (switch date type to End Date and back to Renewal Date, refill dates).
7. Verify the Auto Renewal checkbox remains checked after nearby interactions.
8. Cancel the drawer.

### TC-CONTRACT-008
**Verify End Date and Renewal Date are mutually exclusive (radio behavior) and proper field becomes required accordingly.**
1. **Flow A — Renewal Date mode:**
   - Open a fresh Create Proposal drawer on an isolated deal.
   - Verify Renewal Date radio is selected by default and Renewal Date input is visible (but disabled until Start Date is filled).
   - Fill required fields (Proposal Name, Time Zone, Start Date). After filling Start Date, Renewal Date input becomes enabled.
   - Leave Renewal Date empty and submit.
   - Verify submission is blocked with Renewal Date required validation.
   - Fill Renewal Date and submit.
   - Verify navigation to stepper page with tabs visible.
2. **Flow B — End Date mode:**
   - Open a new Create Proposal drawer on another isolated deal.
   - Fill required fields (Proposal Name, Time Zone, Start Date) and switch date type to "End Date".
   - Verify End Date radio is checked, Renewal Date radio is unchecked, and End Date input is visible.
   - Leave End Date empty and submit.
   - Verify submission is blocked with End Date required validation.
   - Fill End Date and submit.
   - Verify navigation to stepper page with tabs visible.

### TC-CONTRACT-009
**Verify Renewal Date cannot be earlier than Start Date; show validation/error.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify default date mode: TBD unchecked, Renewal Date radio selected, both date inputs visible (Renewal Date is disabled until Start Date is filled).
3. Fill Proposal Name and Time Zone.
4. Set Start Date to a future date (today + 7 days). After filling Start Date, Renewal Date input becomes enabled.
5. Set Renewal Date to one day before the Start Date.
6. Submit.
7. Verify submission is blocked (URL does not change, drawer stays open).
8. Verify chronological validation appears (error text or aria-invalid on Renewal Date).
9. Correct Renewal Date to one day after Start Date.
10. Submit and verify navigation to stepper page with tabs visible.

### TC-CONTRACT-010
**Verify End Date cannot be earlier than Start Date; show validation/error.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify baseline date controls are visible and TBD is unchecked.
3. Switch date type to "End Date" and verify radio state.
4. Fill Proposal Name, Time Zone, and Start Date.
5. Set End Date to one day before Start Date.
6. Submit.
7. Verify submission is blocked (URL does not change, drawer stays open).
8. Correct End Date to one day after Start Date.
9. Submit and verify navigation to stepper page with tabs visible.

### TC-CONTRACT-011
**Covered by TC-CONTRACT-007.** Auto Renewal checkbox verification is done in the Create Proposal drawer on the shared deal (no stepper wizard needed).

### TC-CONTRACT-012
**Verify Notify for Auto-Renewal Before (Days) is required and only accepts valid numeric range (no letters/negative). When Auto Renewal is checked, different fields appear.**
1. Open an isolated Create Proposal drawer.
2. Verify Auto Renewal of Contract is unchecked by default; the "Notify for Auto-Renewal Before (Days)" spinbutton is visible and enabled with default value "10".
3. Fill required drawer fields (Proposal Name, Time Zone, Start Date, Renewal Date).
4. **Empty value:** Clear the Notify input → verify invalid state (submit disabled, aria-invalid, or validation text).
5. **Letters:** Type "abc" → verify letters are rejected/sanitized and invalid state shown.
6. **Mixed alphanumeric:** Type "1a" → verify letters are stripped.
7. **Negative:** Type "-1" → verify negative sign is rejected/normalized.
8. **Zero boundary:** Type "0" → observe behavior.
9. **Large value:** Type "9999" → observe behavior.
10. Check the "Auto Renewal of Contract" checkbox — verify "Notify for Auto-Renewal Before (Days)" is replaced by two new fields: "Drafts Before (Days)" (default: 10) and "Auto Publish Before (Days)" (default: 5).
11. Uncheck "Auto Renewal of Contract" → verify "Notify for Auto-Renewal Before (Days)" is restored.
12. Set Notify to "1" (valid minimum positive value) and submit.
13. Verify navigation to stepper page with tabs visible.

### TC-CONTRACT-013
**Verify user can cancel Create Proposal modal and no proposal/contract is created.**
1. Open an isolated deal with empty Contract & Terms and open Create Proposal drawer.
2. Verify the drawer heading is visible.
3. Click Cancel.
4. Verify the drawer is closed.

### TC-CONTRACT-014
**Verify that Contract & Terms tab is visible on deal detail page.**
1. Open the target deal detail page.
2. Verify the "Contract & Terms" tab element is visible.

### TC-CONTRACT-015
**Verify that Contract & Terms tab is selected by default.**
1. Open the target deal detail page.
2. Verify the "Contract & Terms" tab has `aria-selected=true`.

### TC-CONTRACT-016
**Verify that all four overview tabs are visible on deal detail page.**
1. Open the target deal detail page.
2. Verify all four tabs are visible in this order: Contract & Terms (selected by default), Activities, Notes, Tasks.

### TC-CONTRACT-017
**Verify that Contract & Terms empty state renders correct UI elements.**
1. Open the target deal detail page (deal with no existing proposal).
2. Verify the empty state heading "Create a Proposal" and descriptive text are visible.
3. Verify the "Create Proposal" button is enabled.

### TC-CONTRACT-018
**Verify that Create Proposal drawer contains all expected fields.**
1. Open the target deal and click "Create Proposal".
2. Verify the drawer heading "Create Proposal" is visible.
3. Verify all expected fields are present: Service Type radios, Proposal Name, Time Zone trigger, Contract Dates TBD checkbox, Start Date, date type radios (End Date / Renewal Date), Renewal Date (disabled until Start Date is filled), Auto Renewal of Contract checkbox, Notify for Auto-Renewal Before (Days) spinbutton, Cancel and Create Proposal buttons.
4. Cancel the drawer.

### TC-CONTRACT-019
**Verify that date fields are visible by default in Create Proposal drawer.**
1. Open the target deal and Create Proposal drawer.
2. Verify Start Date input, date type radio group (End Date / Renewal Date), and Renewal Date input are all visible.
3. Note: Renewal Date textbox is disabled until Start Date is filled — verify it is visible but disabled.
4. Cancel the drawer.

### TC-CONTRACT-020
**Verify that Dedicated / Patrol is the default selected service type.**
1. Open the target deal and Create Proposal drawer.
2. Verify the "Dedicated / Patrol" radio is checked by default.
3. Cancel the drawer.

### TC-CONTRACT-021
**Verify that service type can be switched to Dispatch Only.**
1. Open the target deal and Create Proposal drawer.
2. Select "Dispatch Only" radio.
3. Verify "Dispatch Only" is checked and "Dedicated / Patrol" is not checked.
4. Cancel the drawer.

### TC-CONTRACT-022
**Verify that Time Zone trigger is visible and displays a UTC label.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify the Time Zone trigger is visible: it is a clickable container with a level-6 heading whose text matches the pattern "(UTC-XX:XX) [Timezone name]...". The Time Zone is pre-selected by default (e.g. "(UTC-04:00) Atlantic...").
3. Cancel the drawer.

### TC-CONTRACT-023
**Verify that Contract Dates to be decided checkbox is unchecked by default.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify the "Contract Dates to be decided" checkbox is unchecked.
3. Cancel the drawer.

### TC-CONTRACT-024
**Verify that checking Contract Dates to be decided hides all date fields.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify these fields are visible: Start Date, date type radios (End Date / Renewal Date), Renewal Date, Auto Renewal of Contract checkbox, Notify for Auto-Renewal Before (Days) spinbutton.
3. Check the "Contract Dates to be decided" checkbox.
4. Verify the checkbox is checked and ALL of the following are hidden: Start Date, date type radios, Renewal Date, Auto Renewal of Contract checkbox, Notify for Auto-Renewal Before (Days) spinbutton.
5. Cancel the drawer.

### TC-CONTRACT-025
**Verify that unchecking Contract Dates to be decided restores date fields.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify TBD is unchecked and all date-related fields are visible (Start Date, date type radios, Renewal Date, Auto Renewal checkbox, Notify for Auto-Renewal Before (Days) spinbutton).
3. Check TBD → verify checked and all above fields are hidden.
4. Uncheck TBD → verify unchecked and all fields are restored/visible. Note: Start Date is reset to empty (MM/DD/YYYY) and Renewal Date returns to disabled state when TBD is toggled.
5. Cancel the drawer.

### TC-CONTRACT-026
**Verify that Renewal Date is selected by default in the date type radio.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify the "Renewal Date" radio is checked by default and "End Date" radio is unchecked.
3. Verify the Renewal Date textbox is visible but disabled (it becomes enabled only after Start Date is filled).
4. Cancel the drawer.

### TC-CONTRACT-027
**Verify that selecting End Date switches the date type selection.**
1. Open an isolated deal and Create Proposal drawer.
2. Select the "End Date" radio.
3. Verify "End Date" radio is checked and "Renewal Date" radio is not checked.
4. Cancel the drawer.

### TC-CONTRACT-028
**Verify that Notify for Auto-Renewal Before (Days) defaults to 10.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify the "Notify for Auto-Renewal Before (Days)" spinbutton has default value "10". This field is visible when Auto Renewal of Contract is unchecked (the default state).
3. Cancel the drawer.

### TC-CONTRACT-029
**Verify that Notify for Auto-Renewal Before (Days) field is visible in default drawer state.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify the "Notify for Auto-Renewal Before (Days)" spinbutton is visible and enabled (Auto Renewal is unchecked by default).
3. Cancel the drawer.

### TC-CONTRACT-030
**Verify that Create Proposal drawer can be reopened after cancel.**
1. Open an isolated deal and Create Proposal drawer.
2. Verify the drawer heading is visible.
3. Cancel the drawer and verify it is closed.
4. Click "Create Proposal" again to reopen the drawer.
5. Verify the drawer heading is visible again.
6. Verify all expected fields are present after reopening.
7. Cancel the drawer.

---

## Contract Wizard — TC-CONTRACT-031 through TC-CONTRACT-095

### TC-CONTRACT-031 | Verify contract wizard steps are displayed (1 Services, 2 Devices, 3 On Demand, 4 Payment Terms, 5 Description, 6 Signees) for Dedicated Proposal

**Preconditions:** Deal with existing Dedicated proposal on the stepper page.
**Steps:**

1. Navigate to Deals list, open a deal that has an existing proposal, click Edit to enter the contract stepper.
   **Expected results / Assertion points:**
   - After step 1: All six step headings are visible: "1. Services", "2. Devices", "3. On Demand", "4. Payment Terms", "5. Description", "6. Signees".

### TC-CONTRACT-032 | Verify Save & Next progresses to next step and preserves entered data when navigating back.

**Preconditions:** On Step 1 Services of a contract stepper with valid data filled.
**Steps:**

1. Open the contract stepper on Step 1 with services already filled.
2. Note current service name and hourly rate values.
3. Click "Save & Next" to advance to Step 2 Devices.
4. Verify Step 2 heading "Checkpoints & Devices" is visible.
5. Click the "1. Services" step tab to navigate back.
6. Verify the service name and hourly rate still have the previously entered values.
   **Expected results / Assertion points:**
   - After step 3: Step 2 Devices heading is visible (navigation succeeded).
   - After step 6: Service name and hourly rate values match original values (data preserved).

### TC-CONTRACT-033 | Verify Save & Next is blocked when mandatory fields on current step are missing.

**Preconditions:** On Step 1 Services with empty mandatory fields.
**Steps:**

1. Open contract stepper on Step 1.
2. Clear the Service Name field.
3. Attempt to click "Save & Next".
4. Verify Save & Next is disabled or step does not advance.
5. Verify a validation message appears for the missing field.
   **Expected results / Assertion points:**
   - After step 3-4: Save & Next is disabled or clicking it does not navigate to Step 2.
   - After step 5: Validation error visible for required field.

### TC-CONTRACT-034 | Verify user can select Dedicated Service vs Patrol Service and relevant fields display accordingly.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Verify "Dedicated Service" radio is checked by default.
3. Click "Patrol Service" radio.
4. Verify "Patrol Service" radio is now checked and "Dedicated Service" is not.
5. Observe any field changes specific to Patrol mode.
6. Switch back to "Dedicated Service" and verify it is checked again.
   **Expected results / Assertion points:**
   - After step 2: Dedicated Service radio is checked.
   - After step 4: Patrol Service radio is checked, Dedicated Service is unchecked.
   - After step 6: Dedicated Service is checked again.

### TC-CONTRACT-035 | Verify Service Name is required; leaving blank shows 'Service Name is required'.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Clear the Service Name input.
3. Tab out or attempt Save & Next.
4. Verify validation message "Service Name is required" or equivalent appears.
   **Expected results / Assertion points:**
   - After step 3-4: Validation text visible or aria-invalid state on the field. Save & Next is disabled.

### TC-CONTRACT-036 | Verify Resource Type is required; leaving blank shows 'Resource Type is required'.

**Preconditions:** On Step 1 Services with Resource Type not yet selected.
**Steps:**

1. Open a fresh contract stepper on Step 1.
2. Fill Service Name, Officer Count, Hourly Rate, Job Days, Start/End Time but leave Resource Type unselected.
3. Attempt Save & Next.
4. Verify validation message for Resource Type appears or Save & Next stays disabled.
   **Expected results / Assertion points:**
   - After step 3-4: Resource Type required validation visible or Save & Next disabled.

### TC-CONTRACT-037 | Verify Line Item is required; leaving blank shows 'Line Item is required'.

**Preconditions:** On Step 1 Services with Line Item not yet selected.
**Steps:**

1. Open a fresh contract stepper on Step 1.
2. Fill all required fields except Line Item.
3. Attempt Save & Next.
4. Verify validation message for Line Item appears or Save & Next stays disabled.
   **Expected results / Assertion points:**
   - After step 3-4: Line Item required validation visible or Save & Next disabled.

### TC-CONTRACT-038 | Verify Service Start Date is required; leaving blank shows validation.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Fill all fields but leave the service-level Start Time empty (if applicable, clear Start Time).
3. Attempt Save & Next.
4. Verify Start Time is required — validation appears or Save & Next stays disabled.
   **Expected results / Assertion points:**
   - After step 3-4: Start Time required indicator visible or Save & Next disabled.

### TC-CONTRACT-039 | Verify Officer/Guard count is required and must be a positive integer.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Clear Officer/Guard count field.
3. Verify Save & Next is disabled or validation appears.
4. Fill with "0" — verify behavior (may be rejected).
5. Fill with a valid positive integer (e.g., "2") — verify Save & Next becomes enabled.
   **Expected results / Assertion points:**
   - After step 2-3: Field shows required validation or Save & Next disabled.
   - After step 5: Field accepts "2" and Save & Next is enabled.

### TC-CONTRACT-040 | Verify Hourly Rate is required and accepts valid currency format; reject letters/special chars.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Clear Hourly Rate field — verify Save & Next is disabled.
3. Type "abc" into Hourly Rate field — verify letters are rejected/stripped (input type=number).
4. Type a valid number (e.g., "15") — verify it is accepted and Save & Next becomes enabled.
   **Expected results / Assertion points:**
   - After step 2: Save & Next disabled with empty hourly rate.
   - After step 3: Letters are not accepted in the numeric spinbutton.
   - After step 4: Valid number accepted.

### TC-CONTRACT-041 | Verify at least one Job Day selection is required (if applicable); show validation if none selected.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Deselect all Job Day chips if any are selected.
3. Verify validation message "Job Days must have at least 1 item." appears.
4. Select one Job Day chip (e.g., "Mon").
5. Verify validation message disappears.
   **Expected results / Assertion points:**
   - After step 2-3: Job Days validation message visible.
   - After step 4-5: Validation message gone.

### TC-CONTRACT-042 | Verify Start Time and End Time validations: end time must be after start time (including overnight rules if supported).

**Preconditions:** On Step 1 Services with Start/End time pickers.
**Steps:**

1. Open contract stepper on Step 1.
2. Set Start Time to a valid value (e.g., 08:00 AM).
3. Set End Time to a value before Start Time (e.g., 07:00 AM) — unless overnight is supported.
4. Observe behavior: validation message or the system may auto-allow overnight shifts.
5. Set End Time to after Start Time (e.g., 05:00 PM) — verify accepted.
   **Expected results / Assertion points:**
   - After step 2: Start Time field shows selected value.
   - After step 5: End Time field shows selected value after start time.

### TC-CONTRACT-043 | Verify Include Fuel Surcharge and Include Vehicle toggles can be enabled and reflect in totals/pricing where applicable.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Locate "Include Fuel Surcharge" checkbox — verify it is visible.
3. Toggle it on — verify checkbox is checked.
4. Locate "Include Vehicle" checkbox — verify it is visible.
5. Toggle it on — verify checkbox is checked.
   **Expected results / Assertion points:**
   - After step 3: Include Fuel Surcharge checkbox is checked.
   - After step 5: Include Vehicle checkbox is checked.

### TC-CONTRACT-044 | Verify Add Instructions rich text supports formatting (bold/italic/list/headings) and content saves.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Scroll to "Add Instructions" section.
3. Verify the rich text editor toolbar has Bold, Italic, Unordered list, Ordered list, H1, H2 controls.
4. Type text into the editor.
5. Apply Bold formatting to some text.
6. Verify the editor contains the typed content.
   **Expected results / Assertion points:**
   - After step 3: All toolbar controls are visible (Bold, Italic, Unordered, Ordered, H1, H2).
   - After step 6: Editor contains the typed text.

### TC-CONTRACT-045 | Verify Additional Services toggles (e.g., Visitor Management, Load Management) can be selected and persist.

**Preconditions:** On Step 1 Services.
**Steps:**

1. Open contract stepper on Step 1.
2. Scroll to "Additional Services" section.
3. Verify "Visitor Management" and "Load Management" labels and toggles are visible.
4. Toggle "Visitor Management" on — verify checked.
5. Toggle "Load Management" on — verify checked.
   **Expected results / Assertion points:**
   - After step 3: Both toggle labels visible.
   - After step 4: Visitor Management is checked.
   - After step 5: Load Management is checked.

### TC-CONTRACT-046 | Verify user can add multiple services (Service #1, Service #2) and totals reflect aggregated services.

**Preconditions:** On Step 1 Services with at least one service already filled.
**Steps:**

1. Open contract stepper on Step 1 with Service 1 already filled.
2. Note the current total (USD amount in footer).
3. Click "Add another service" card.
4. Verify "Service 2" input appears.
5. Fill Service 2 with valid data (name, resource type, line item, officer count, hourly rate, job days, times).
6. Verify the total in the footer has increased to reflect both services.
   **Expected results / Assertion points:**
   - After step 4: Service 2 textbox is visible.
   - After step 6: Footer total is greater than the original single-service total.

### TC-CONTRACT-047 | Verify deleting a service updates totals and does not break remaining service forms.

**Preconditions:** On Step 1 Services with 2 services.
**Steps:**

1. Open contract stepper on Step 1 with 2 services.
2. Note the total with both services.
3. Delete the first service (click Delete Service, confirm).
4. Verify the total has decreased.
5. Verify the remaining service (now Service 1) is still visible with its data intact.
   **Expected results / Assertion points:**
   - After step 3-4: Total decreased after deletion.
   - After step 5: Remaining service form is intact.

### TC-CONTRACT-048 | Verify Devices list (QR Tags, Beacons, NFC Tags) renders with unit price and quantity controls.

**Preconditions:** On Step 2 Devices.
**Steps:**

1. Navigate to Step 2 Devices.
2. Verify "Checkpoints & Devices" heading is visible.
3. Verify the three device rows are visible in this order: QR Tags, Beacons, NFC Tags. (Live-verified 2026-05-07: order is QR Tags → Beacons → NFC Tags.)
4. Verify each device row has a unit price spinbutton and +/- quantity buttons (group with "-", quantity display, "+").
   **Expected results / Assertion points:**
   - After step 2: Heading visible.
   - After step 3-4: All three device rows visible in correct order with price inputs and quantity controls.

### TC-CONTRACT-049 | Verify quantity +/- updates Total Price and contract total appropriately.

**Preconditions:** On Step 2 Devices.
**Steps:**

1. Navigate to Step 2 Devices.
2. Note the current Total price.
3. Click "+" on NFC Tags to increment quantity.
4. Verify NFC Tags quantity increased by 1.
5. Verify the Total price heading updated.
   **Expected results / Assertion points:**
   - After step 4: NFC Tags quantity is 1 (or previous + 1).
   - After step 5: Total heading shows updated value.

### TC-CONTRACT-050 | Verify quantity cannot go below 0 and cannot accept non-numeric input.

**Preconditions:** On Step 2 Devices.
**Steps:**

1. Navigate to Step 2 Devices.
2. Verify NFC Tags quantity is 0 (or reset to 0 via "-").
3. Click "-" button when quantity is 0 — verify quantity stays at 0 or button is disabled.
4. Verify the quantity display is always a non-negative integer.
   **Expected results / Assertion points:**
   - After step 2-3: Quantity does not go below 0; minus button may be disabled at 0.
   - After step 4: Quantity is a valid non-negative integer.

### TC-CONTRACT-051 | Verify unit price cannot accept negative value and uses numeric validation.

**Preconditions:** On Step 2 Devices.
**Steps:**

1. Navigate to Step 2 Devices.
2. Clear the NFC Tags unit price input.
3. Type "-5" — verify the input rejects the negative sign or value.
4. Type "abc" via keyboard — verify letters are stripped (input type=number).
5. Type a valid positive number (e.g., "25") — verify accepted.
   **Expected results / Assertion points:**
   - After step 3: Negative value rejected or normalized.
   - After step 4: Letters not accepted.
   - After step 5: Valid number accepted.

### TC-CONTRACT-052 | Verify note 'Billed in first invoice only' (if present) remains visible and accurate.

**Preconditions:** On Step 2 Devices.
**Steps:**

1. Navigate to Step 2 Devices.
2. Verify the "Billed in first invoice only" note heading is visible near the Total.
   **Expected results / Assertion points:**
   - After step 2: "Billed in first invoice only" text is visible.

### TC-CONTRACT-053 | Verify Dispatch Request billing type dropdown loads and can be set (other options).

**Preconditions:** On Step 3 On Demand.
**Steps:**

1. Navigate to Step 3 On Demand.
2. Verify the "Additional Services Pricing" heading is visible.
3. Verify the Dispatch Request item (item "1.") is visible with its billing type dropdown. Default value is "Not Included". (Live-verified 2026-05-07.)
4. Click the billing type dropdown to open it.
5. Select a different option.
6. Verify the dropdown now shows the selected value.
   **Expected results / Assertion points:**
   - After step 2: Heading visible.
   - After step 3: Dispatch Request row visible with billing type showing "Not Included" by default.
   - After step 6: Dropdown displays the newly selected billing type.

### TC-CONTRACT-054 | Verify Price Per Hour field validates numeric and rejects negative/alpha.

**Preconditions:** On Step 3 On Demand.
**Steps:**

1. Navigate to Step 3 On Demand.
2. Locate the Extra Job "Price Per Hour" spinbutton.
3. Clear it and type "abc" — verify letters are rejected (numeric input).
4. Type "-10" — verify negative is rejected or normalized.
5. Type "25" — verify accepted.
   **Expected results / Assertion points:**
   - After step 3: Letters not accepted.
   - After step 5: Valid number accepted.

### TC-CONTRACT-055 | Verify adding additional on-demand line items (via Line Item button) works and persists.

**Preconditions:** On Step 3 On Demand.
**Steps:**

1. Navigate to Step 3 On Demand.
2. Click "Line Item" button (appears at the bottom of the on-demand items list with an icon). (Live-verified 2026-05-07: button accessible name is "Line Item", not "+ Line Item".)
3. Fill the line item form.
4. Save/confirm.
5. Verify the saved line item appears.
   **Expected results / Assertion points:**
   - After step 5: Line item is visible after save.

### TC-CONTRACT-056 | Verify removing a line item updates totals and does not leave orphan fields.

**Preconditions:** On Step 3 On Demand with at least one custom line item.
**Steps:**

1. Navigate to Step 3 On Demand with a line item already added.
2. Click the delete icon on the line item card.
3. Confirm deletion in the modal.
4. Verify the line item card is no longer visible.
   **Expected results / Assertion points:**
   - After step 4: The deleted line item card is gone.

### TC-CONTRACT-057 | Verify payment plan columns render (Monthly, Bi-Weekly, Weekly, Event, Flat) and selecting a plan highlights it.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Verify "Select Billing Occurrence" heading is visible.
3. Verify all five plan options are visible: Monthly, Bi-Weekly, Weekly, Event, Flat.
4. Click "Monthly" radio — verify it becomes checked.
5. Click "Weekly" radio — verify it becomes checked and Monthly is unchecked.
   **Expected results / Assertion points:**
   - After step 3: All five plan labels visible.
   - After step 4: Monthly radio checked.
   - After step 5: Weekly radio checked, Monthly unchecked.

### TC-CONTRACT-058 | Verify Services Total/Dispatch Total/Tax Rate/Total update for selected plan.

**Preconditions:** On Step 4 Payment Terms with a valid service configured.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Note the Services Total, Dispatch Total, Tax Rate, and Total values for the currently selected plan.
3. Verify the total values are non-empty numeric strings.
   **Expected results / Assertion points:**
   - After step 2-3: Services Total, Dispatch Total, and Total columns contain numeric values.

### TC-CONTRACT-059 | Verify Tax Rate (%) is required and validates numeric range (0-100) and decimals; reject alpha/negative.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Locate the Tax Rate spinbutton.
3. Clear it and type "abc" — verify rejected (numeric input).
4. Type "-5" — verify rejected or normalized.
5. Type "8.5" — verify accepted.
   **Expected results / Assertion points:**
   - After step 3: Letters not accepted.
   - After step 5: Valid decimal accepted.

### TC-CONTRACT-060 | Verify Contract Duration displays based on Start/End/Renewal dates selected in proposal.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Verify "Contract Duration" text is visible and contains start and end/renewal dates.
   **Expected results / Assertion points:**
   - After step 2: Contract Duration text visible with date range.

### TC-CONTRACT-061 | Verify required fields under 'Define Payment Terms' can be selected: Cycle Reference Date, Payment Terms, Payment Method, Billing Type, Contract Type, Billing Frequency.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Verify "Define Payment Terms" heading is visible.
3. Verify all six required field labels are visible: Cycle Reference Date, Payment Terms, Payment Method, Billing Type, Contract Type, Select Billing Frequency.
4. Verify each dropdown/field has a selected value or placeholder.
   **Expected results / Assertion points:**
   - After step 2-3: All field labels and controls are visible.

### TC-CONTRACT-062 | Verify Save & Next blocked until required payment term fields are completed; show field-level errors.

**Preconditions:** On Step 4 Payment Terms with some required fields missing.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. If possible, clear a required field (e.g., clear Annual Rate Increase).
3. Attempt Save & Next.
4. Verify Save & Next is disabled or step does not advance.
   **Expected results / Assertion points:**
   - After step 3-4: Save & Next disabled or validation visible.

### TC-CONTRACT-063 | Verify Officer/Guard Breaks checkboxes (Billable/Payable) can be toggled and saved.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Verify "Officer/Guard Breaks" label is visible.
3. Verify "Billable" and "Payable" checkboxes are visible.
4. Toggle Billable checkbox — verify state changes.
5. Toggle Payable checkbox — verify state changes.
   **Expected results / Assertion points:**
   - After step 3: Both checkboxes visible.
   - After step 4-5: Checkbox states toggled successfully.

### TC-CONTRACT-064 | Verify Holiday Multiplier and Holiday Group selection works; '0 Holidays' link/info is accessible (if applicable).

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Verify "Holiday Multiplier" label and input are visible.
3. Verify "Holiday Group" label and dropdown are visible.
4. Verify "0 Holidays" info link/text is visible.
   **Expected results / Assertion points:**
   - After step 2-4: Holiday Multiplier input, Holiday Group dropdown, and 0 Holidays text all visible.

### TC-CONTRACT-065 | Verify that only the holiday groups linked to the selected franchise in the property are visible in the dropdown.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Click the Holiday Group dropdown.
3. Verify the dropdown opens and shows options.
4. Verify the options are franchise-specific (at minimum, the dropdown opens without error).
   **Expected results / Assertion points:**
   - After step 3: Holiday Group dropdown opens with options visible.

### TC-CONTRACT-066 | Verify Annual Rate Increase validates numeric percent and rejects invalid formats.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Locate Annual Rate Increase spinbutton.
3. Clear and type "abc" — verify rejected.
4. Type a valid number (e.g., "3") — verify accepted.
   **Expected results / Assertion points:**
   - After step 3: Letters not accepted.
   - After step 4: Valid number accepted.

### TC-CONTRACT-067 | Verify Flat plan input validation (flat amount required, numeric only).

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Select the "Flat" payment plan radio.
3. Verify the Flat amount spinbutton is visible.
4. Verify it accepts only numeric input.
   **Expected results / Assertion points:**
   - After step 2-3: Flat radio checked, flat amount input visible.
   - After step 4: Input is numeric only.

### TC-CONTRACT-068 | Verify Services Profitable indicator updates (0/1 etc.) and tooltip/message is readable.

**Preconditions:** On Step 4 Payment Terms.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Verify the "Services Profitable" indicator is visible (e.g., "0/1" heading).
3. Verify the indicator text is readable.
   **Expected results / Assertion points:**
   - After step 2-3: Services Profitable indicator visible with numeric text.

### TC-CONTRACT-069 | Verify Billing Information required fields: First Name, Last Name, Email, Phone Number validate correctly.

**Preconditions:** On Step 4 Payment Terms, Billing Information section.
**Steps:**

1. Navigate to Step 4 Payment Terms.
2. Scroll to "Billing Information" heading.
3. Verify First Name, Last Name, Email, Phone Number fields are visible with their * required markers.
4. Verify the fields contain pre-filled data or are editable.
   **Expected results / Assertion points:**
   - After step 2-3: Billing Information heading visible. All four required fields visible.

### TC-CONTRACT-070 | Verify Email field validation for invalid formats (missing @, domain, spaces).

**Preconditions:** On Step 4 Payment Terms, Billing Information.
**Steps:**

1. Navigate to Step 4 Payment Terms, Billing Information.
2. Clear the Email field.
3. Type "invalidemail" (no @ sign).
4. Tab out — verify validation error or aria-invalid.
5. Type a valid email — verify accepted.
   **Expected results / Assertion points:**
   - After step 3-4: Email field shows invalid state.
   - After step 5: Valid email accepted.

### TC-CONTRACT-071 | Verify Phone Number accepts valid numbers and country code; reject letters and too short/long values.

**Preconditions:** On Step 4 Payment Terms, Billing Information.
**Steps:**

1. Navigate to Step 4 Payment Terms, Billing Information.
2. Verify phone input with country code selector is visible.
3. Clear the phone field and type a valid phone number.
4. Verify the field accepts numeric input.
   **Expected results / Assertion points:**
   - After step 2: Phone field with country code selector visible.
   - After step 4: Valid phone number accepted.

### TC-CONTRACT-072 | Verify Address/Country/State/City/Zip are prefilled from property and are consistent.

**Preconditions:** On Step 4 Payment Terms, Billing Information.
**Steps:**

1. Navigate to Step 4 Payment Terms, Billing Information.
2. Verify Address, Country, State, City, Zip fields are visible.
3. Verify the fields are pre-filled (disabled) with property/company address data.
   **Expected results / Assertion points:**
   - After step 2-3: All address fields visible, pre-filled, and disabled.

### TC-CONTRACT-073 | Verify 'Use a different billing address' reveals editable address fields and saves the alternate billing address.

**Preconditions:** On Step 4 Payment Terms, Billing Information.
**Steps:**

1. Navigate to Step 4 Payment Terms, Billing Information.
2. Verify billing address radio group is visible (Property Address / Company Address / Other).
3. Click "Other" radio.
4. Verify address fields become editable.
   **Expected results / Assertion points:**
   - After step 3-4: "Other" radio checked and address fields become editable (not disabled).

### TC-CONTRACT-074 | Verify Description step loads with banner upload area and Description of Services rich text editor.

**Preconditions:** On Step 5 Description.
**Steps:**

1. Navigate to Step 5 Description.
2. Verify "Upload Banner Image (optional)" heading is visible.
3. Verify "Description of Services" heading is visible.
4. Verify the rich text editor is visible.
   **Expected results / Assertion points:**
   - After step 2-4: Banner upload area and Description editor both visible.

### TC-CONTRACT-075 | Verify description content is auto-generated based on contract configuration from prior steps (services, days/times, guards, breaks, rate).

**Preconditions:** On Step 5 Description with prior steps completed.
**Steps:**

1. Navigate to Step 5 Description.
2. Verify the rich text editor contains non-empty pre-filled content.
3. Verify the content mentions service details (e.g., officer count, days, times).
   **Expected results / Assertion points:**
   - After step 2-3: Editor has pre-filled text with service configuration details.

### TC-CONTRACT-076 | Verify user can edit generated description and changes persist after navigating away/back.

**Preconditions:** On Step 5 Description with pre-filled content.
**Steps:**

1. Navigate to Step 5 Description.
2. Click into the editor and type additional text (e.g., "CUSTOM EDIT").
3. Click Save & Next to go to Step 6.
4. Navigate back to Step 5.
5. Verify the custom text is still in the editor.
   **Expected results / Assertion points:**
   - After step 5: Custom text persists in the editor after navigating away and back.

### TC-CONTRACT-077 | Verify banner image upload supports click + drag/drop and accepts allowed size/dimension constraints; shows preview.

**Preconditions:** On Step 5 Description.
**Steps:**

1. Navigate to Step 5 Description.
2. Verify the banner upload area is visible with "Click to Upload" text and file constraints "16:9 or 1920 x 1080px (max. 10MB)".
3. Verify "Choose File" button is visible.
   **Expected results / Assertion points:**
   - After step 2-3: Upload area with constraints text and Choose File button visible.

### TC-CONTRACT-078 | Verify invalid banner file types (e.g., .exe) are rejected with clear error.

**Preconditions:** On Step 5 Description.
**Steps:**

1. Navigate to Step 5 Description.
2. Attempt to upload a file with invalid extension.
3. Verify error message or file rejection occurs.
   **Expected results / Assertion points:**
   - After step 2-3: Invalid file type is rejected (upload area shows error or file is not accepted).

### TC-CONTRACT-079 | Verify banner file > max size is rejected with clear error.

**Preconditions:** On Step 5 Description.
**Steps:**

1. Navigate to Step 5 Description.
2. Attempt to upload a file exceeding 10MB.
3. Verify error message for file size.
   **Expected results / Assertion points:**
   - After step 2-3: Oversized file is rejected with a clear error.

### TC-CONTRACT-080 | Verify default Signee 1 is populated (e.g., Deal Owner/Sales Manager) when applicable.

**Preconditions:** On Step 6 Signees.
**Steps:**

1. Navigate to Step 6 Signees.
2. Verify "Select signees for this contract" heading is visible.
3. Verify "Signee 1" heading is visible.
4. Verify a name (e.g., franchise owner or deal owner name) is displayed on the signee card.
   **Expected results / Assertion points:**
   - After step 2-4: Default Signee 1 card with a name is visible.

### TC-CONTRACT-081 | Verify Add Signee opens drawer and requires Name, Title, Email.

**Preconditions:** On Step 6 Signees.
**Steps:**

1. Navigate to Step 6 Signees.
2. Click the "Add Signee" card/button.
3. Verify the "Add Signee" drawer opens with heading "Add Signee" (level 3).
4. Verify fields: "Add Signee Name" textbox, "Add Signee Title" textbox, "Add Signee Email" textbox.
5. Verify "Cancel" and "Add Signee" buttons are visible.
   **Expected results / Assertion points:**
   - After step 3-5: Drawer heading, all three fields, and both buttons visible.

### TC-CONTRACT-082 | Verify Add Signee cannot be saved with missing required fields; show validation messages.

**Preconditions:** On Step 6 Signees with Add Signee drawer open.
**Steps:**

1. Open the Add Signee drawer.
2. Leave all fields empty.
3. Click "Add Signee" button.
4. Verify validation messages appear for required fields or the drawer stays open.
   **Expected results / Assertion points:**
   - After step 3-4: Drawer remains open. Validation indicators visible.

### TC-CONTRACT-083 | Verify Add Signee email validation prevents invalid email formats.

**Preconditions:** On Step 6 Signees with Add Signee drawer open.
**Steps:**

1. Open the Add Signee drawer.
2. Fill Name and Title with valid values.
3. Type "invalidemail" in the Email field (no @).
4. Click "Add Signee".
5. Verify email validation error appears.
   **Expected results / Assertion points:**
   - After step 4-5: Email validation error visible; drawer stays open.

### TC-CONTRACT-084 | Verify multiple signees can be added and appear as separate signee cards.

**Preconditions:** On Step 6 Signees.
**Steps:**

1. Navigate to Step 6 Signees.
2. Verify Signee 1 is already visible.
3. Click Add Signee, fill valid Name/Title/Email, submit.
4. Verify Signee 2 card appears.
   **Expected results / Assertion points:**
   - After step 4: Two signee cards visible (Signee 1 and Signee 2).

### TC-CONTRACT-085 | Verify Preview generates contract preview successfully and matches entered details (proposal name, billing plan, services).

**Preconditions:** On Step 6 Signees.
**Steps:**

1. Navigate to Step 6 Signees.
2. Click "Preview" button.
3. Verify a preview modal or page loads without error.
   **Expected results / Assertion points:**
   - After step 2-3: Preview loads successfully (modal/page visible or no error).

### TC-CONTRACT-086 | Verify Finish creates contract and returns to Deal Details > Contract & Terms with contract card visible.

**Preconditions:** On Step 6 Signees with all prior steps completed.
**Steps:**

1. Navigate to Step 6 Signees.
2. Click "Finish" button.
3. Verify navigation back to Deal Detail page.
4. Verify the proposal card is visible on the Contract & Terms tab.
   **Expected results / Assertion points:**
   - After step 3: URL matches /deals/deal/:id (no /contract/ suffix).
   - After step 4: Proposal card with "Publish Contract" button visible.

### TC-CONTRACT-087 | Verify Finish is blocked if no signee exists (if required by system) or shows guidance to add at least one signee.

**Preconditions:** On Step 6 Signees.
**Steps:**

1. Navigate to Step 6 Signees.
2. If default Signee 1 exists, this test verifies Finish works with at least one signee (already covered by TC-CONTRACT-086).
3. Verify Finish button is visible and enabled when at least one signee exists.
   **Expected results / Assertion points:**
   - After step 3: Finish button is visible and enabled with Signee 1 present.

### TC-CONTRACT-088 | Verify contract card shows: Proposal Name, Billing (e.g., $200 Weekly), Created date, 'by <user>', and action icons appropriate to the card state.

**Preconditions:** Deal detail page with existing proposal card.
**Steps:**

1. Navigate to Deal Detail with an existing proposal.
2. Verify proposal card shows: proposal name heading (level=4), billing amount heading (level=4, e.g., "$3.54 Weekly"), created date paragraph, "by" user text.
3. Verify action icons differ by card state (Live-verified 2026-05-07):
   - **Draft card**: "Edit" button, "Clone" generic, "Preview PDF" generic, "Delete" generic.
   - **Published card**: "Signature" button, "View" generic, "Addendum" generic, "Clone" generic, "Preview PDF" generic, "Terminate" generic.
   **Expected results / Assertion points:**
   - After step 2-3: Proposal name, billing, created date, and correct action icons for the card state are all visible.

### TC-CONTRACT-089 | Verify totals are consistent across wizard steps and final contract card (e.g., USD 200 Weekly).

**Preconditions:** Deal with existing proposal.
**Steps:**

1. Open deal detail and note the billing amount on the proposal card.
2. Click Edit to open stepper.
3. Verify the footer total on the stepper matches the card amount.
   **Expected results / Assertion points:**
   - After step 3: Stepper footer total matches the proposal card billing amount.

### TC-CONTRACT-090 | Verify that Step 1 Services is visible with all required fields.

**Preconditions:** On contract stepper.
**Steps:**

1. Open the contract stepper.
2. Click Step 1 tab.
3. Verify Service Name input, Resource Type, Line Item, Officer/Guard, Hourly Rate, Job Days, Start Time, End Time are all visible.
   **Expected results / Assertion points:**
   - After step 3: All required Step 1 fields visible.

### TC-CONTRACT-091 | Verify that Step 3 On Demand is visible and advances to Step 4.

**Preconditions:** On contract stepper.
**Steps:**

1. Open the contract stepper.
2. Click Step 3 tab.
3. Verify "Additional Services Pricing" heading is visible.
4. Click Save & Next.
5. Verify Step 4 "Select Billing Occurrence" heading is visible.
   **Expected results / Assertion points:**
   - After step 3: Step 3 heading visible.
   - After step 5: Step 4 heading visible (advanced successfully).

### TC-CONTRACT-092 | Verify that Step 4 Payment Terms shows all three sections.

**Preconditions:** On contract stepper.
**Steps:**

1. Open the contract stepper.
2. Click Step 4 tab.
3. Verify three section headings are visible: "Select Billing Occurrence", "Define Payment Terms", "Billing Information".
   **Expected results / Assertion points:**
   - After step 3: All three headings visible.

### TC-CONTRACT-093 | Verify that Step 5 Description is pre-filled and advances to Step 6.

**Preconditions:** On contract stepper with prior steps completed.
**Steps:**

1. Open the contract stepper.
2. Click Step 5 tab.
3. Verify "Description of Services" heading is visible.
4. Verify the editor contains pre-filled content (non-empty).
5. Click Save & Next.
6. Verify Step 6 "Select signees for this contract" heading is visible.
   **Expected results / Assertion points:**
   - After step 3-4: Description heading and pre-filled content visible.
   - After step 6: Step 6 heading visible.

### TC-CONTRACT-094 | Verify that Step 6 Signees shows default signee, Preview button, and Finish button.

**Preconditions:** On contract stepper.
**Steps:**

1. Open the contract stepper.
2. Click Step 6 tab.
3. Verify "Select signees for this contract" heading (level=3) is visible.
4. Verify Signee 1 card is visible with a name heading (level=4) and role paragraph.
5. Verify both "Preview" and "Finish" buttons are visible in the step footer. (Live-verified 2026-05-07: footer has "Preview" button then "Finish" button.)
   **Expected results / Assertion points:**
   - After step 3-5: Step 6 heading, Signee 1 card, Preview button, and Finish button all visible.

## Publish Contract & Request Signatures — TC-CONTRACT-096 through TC-CONTRACT-112

### TC-CONTRACT-096 | Verify that proposal card is visible with Publish Contract button and expected actions

**Preconditions:** Deal has a completed contract proposal (wizard finished). User is on deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to the deal detail page with the completed proposal.
2. Verify the Contract & Terms tab is selected.
3. Verify the proposal card is visible with: proposal name heading (h4), billing amount heading (h4), created date text.
4. Verify "Publish Contract" button is visible on the card.
5. Verify action icons are visible: Signature button, Edit, Clone, Preview PDF, Delete.
   **Expected results / Assertion points:**
   - After step 3: Proposal name and billing headings visible.
   - After step 4: "Publish Contract" button visible.
   - After step 5: Signature button and action icons (Edit, Clone, Preview PDF, Delete) all visible.

### TC-CONTRACT-097 | Verify Publish Contract button is visible after contract creation and opens publish flow successfully

**Preconditions:** Deal has a completed contract proposal in Draft state. Deal has NOT been closed yet.
**Steps:**

1. Navigate to the deal detail page with the draft proposal.
2. Verify "Publish Contract" button is visible.
3. Click "Publish Contract".
4. Verify a modal or dialog opens (Close Deal modal with heading "Close Deal" if deal is not closed, or Publish confirmation modal if deal is already closed).
5. Close/cancel the modal.
   **Expected results / Assertion points:**
   - After step 2: "Publish Contract" button visible.
   - After step 4: Close Deal modal heading or Publish confirmation modal heading visible.

### TC-CONTRACT-098 | Verify attempting to Publish with incomplete required contract fields is blocked and shows error (if applicable)

**Preconditions:** Deal has a contract proposal. Deal is not yet closed.
**Steps:**

1. Navigate to the deal detail page.
2. Click "Publish Contract" button.
3. If the system requires all contract fields to be complete before publishing, verify that an error/validation message appears blocking the publish.
4. If the system allows publishing regardless (no field validation at publish time), note this as "no client-side validation" and verify the Close Deal modal opens normally.
   **Expected results / Assertion points:**
   - After step 3-4: Either validation error is visible OR Close Deal modal opens (documenting actual behavior).

### TC-CONTRACT-099 | Verify if user publishes contract before manually updating stage system shows deal stages update popup and handles update

**Preconditions:** Deal is in "Proposal Creation" stage (not yet closed). Deal has a completed contract proposal.
**Steps:**

1. Navigate to the deal detail page.
2. Verify deal stage shows "Proposal Creation" as current/active.
3. Click "Publish Contract" button.
4. Verify "Close Deal" modal appears with heading "Close Deal" (level=3).
5. Verify "Closed Won" and "Closed Lost" radio options are visible.
6. Select "Closed Won" radio.
7. Select a Hubspot Stage from the dropdown (e.g., "Closed Won (Sales Pipeline)").
8. Click "Save" button.
9. Verify "Deal closed successfully!" heading appears or deal stage updates to "Closed Won".
   **Expected results / Assertion points:**
   - After step 4-5: Close Deal modal open with both radio options.
   - After step 8-9: Deal closed successfully toast/heading visible, or deal stage reflects "Closed Won".

### TC-CONTRACT-100 | Verify that Publish Contract after deal close opens confirmation modal

**Preconditions:** Deal has been closed (Closed Won). Contract is still in Draft state. "Publish Contract" button is still visible.
**Steps:**

1. Navigate to the deal detail page (deal already closed).
2. Verify "Publish Contract" button is visible.
3. Click "Publish Contract" button.
4. Verify "Publish contract!" confirmation modal appears with heading (h4) "Publish contract!".
5. Verify confirmation text "Do you confirm to activate this contract?" is visible.
6. Verify "Publish Contract" confirm button is visible inside the modal.
7. Close/cancel the modal without confirming.
   **Expected results / Assertion points:**
   - After step 4-5: "Publish contract!" heading and confirmation text visible.
   - After step 6: Confirm "Publish Contract" button visible.

### TC-CONTRACT-101 | Verify that confirming Publish Contract marks the contract as Published

**Preconditions:** Deal is closed (Closed Won). Contract is in Draft state. "Publish Contract" button visible.
**Steps:**

1. Navigate to the deal detail page.
2. Click "Publish Contract" button.
3. Verify "Publish contract!" confirmation modal opens.
4. Click the "Publish Contract" confirm button inside the modal.
5. Verify "Published without sign" badge appears on the proposal card.
6. Verify "Publish Contract" button is no longer visible.
7. Verify "Signature" button is still visible on the card.
   **Expected results / Assertion points:**
   - After step 5: "Published without sign" badge visible.
   - After step 6: "Publish Contract" button gone.
   - After step 7: "Signature" button still visible.

### TC-CONTRACT-102 | Verify Request Signatures opens selection modal listing all signees with status tags

**Preconditions:** Contract is published. User is on deal detail page, Contract & Terms tab.
**Steps:**

1. Click "Signature" button on the proposal card.
2. Verify a dropdown menu appears with "Add Sign" and "Request Sign" options.
3. Click "Request Sign" menuitem.
4. Verify "Select Signees to request for signature" modal opens (heading level=4).
5. Verify at least one signee row is visible with: checkbox, avatar, name paragraph, email paragraph.
6. Verify "Select All" option is visible.
7. Verify "Cancel" and "Request Signatures" buttons are visible.
   **Expected results / Assertion points:**
   - After step 4: Modal heading visible.
   - After step 5-7: Signee row, Select All, Cancel, and Request Signatures buttons all visible.

### TC-CONTRACT-103 | Verify default status tag is Not Requested for signees who were not sent a request

**Preconditions:** Contract is published. No signature requests sent yet.
**Steps:**

1. Open the Request Signatures modal (Signature > Request Sign).
2. Verify the signee row is visible.
3. Verify the status tag next to the signee shows "Not Requested".
4. Close the modal.
   **Expected results / Assertion points:**
   - After step 3: "Not Requested" status tag visible for each signee.

### TC-CONTRACT-104 | Verify selecting a signee and clicking Request Signatures sends email and updates status tag to Requested

**Preconditions:** Contract is published. Signee has "Not Requested" status.
**Steps:**

1. Open the Request Signatures modal.
2. Check the checkbox next to a signee.
3. Click "Request Signatures" button.
4. Verify a success toast or confirmation appears.
5. Reopen the Request Signatures modal.
6. Verify the signee's status tag has changed from "Not Requested" to "Requested".
   **Expected results / Assertion points:**
   - After step 3-4: Request sent successfully (toast or modal closes).
   - After step 6: Status tag shows "Requested".

### TC-CONTRACT-105 | Verify Request Signatures is blocked if no signee is selected show validation/toast

**Preconditions:** Contract is published. Request Signatures modal is open.
**Steps:**

1. Open the Request Signatures modal.
2. Ensure no signee checkbox is checked.
3. Click "Request Signatures" button.
4. Verify a validation message or toast appears indicating that at least one signee must be selected.
5. Verify the modal remains open (request was not sent).
   **Expected results / Assertion points:**
   - After step 4: Validation/toast error visible.
   - After step 5: Modal still open with heading visible.

### TC-CONTRACT-106 | Verify when a signee signs status tag updates to Signed in Request Signatures modal

**Preconditions:** Contract is published. Signature request has been sent to a signee (status "Requested"). Signee has completed signing externally.
**Steps:**

1. Open the Request Signatures modal.
2. Verify the signee who has signed shows status tag "Signed".
   **Expected results / Assertion points:**
   - After step 2: Status tag shows "Signed" for the signee who completed signing.
   - Note: This test depends on external signing action. If not feasible in automation, mark as manual verification.

### TC-CONTRACT-107 | Verify email delivery failure shows error and status does not incorrectly change to Requested

**Preconditions:** Contract is published. A signee has an invalid or unreachable email.
**Steps:**

1. Open the Request Signatures modal.
2. Select the signee with invalid email.
3. Click "Request Signatures" button.
4. Verify an error toast/message appears indicating email delivery failure.
5. Reopen the modal and verify the signee's status tag remains "Not Requested" (did not change to "Requested").
   **Expected results / Assertion points:**
   - After step 4: Error message visible.
   - After step 5: Status tag still "Not Requested".
   - Note: Requires a signee with invalid email. If not testable in current environment, mark as conditional.

### TC-CONTRACT-108 | Verify deal stage auto-moves to Negotiation after sending signature request when deal was in Proposal Creation

**Preconditions:** Deal is in "Proposal Creation" stage. Contract is published. Signature request is about to be sent.
**Steps:**

1. Verify deal stage shows "Proposal Creation" as current.
2. Open the Request Signatures modal.
3. Select a signee and click "Request Signatures".
4. After request is sent, verify the deal stage area updates to show "Negotiation" as the current/active stage.
   **Expected results / Assertion points:**
   - After step 4: Deal stage shows "Negotiation" as active.
   - Note: This test requires the deal to be in Proposal Creation before sending. May need a fresh deal.

### TC-CONTRACT-109 | Verify with multiple signees partial signing keeps stage as Negotiation and tags reflect Requested/Signed/Not Requested correctly

**Preconditions:** Contract has multiple signees. Some have been requested, some have signed, some not requested.
**Steps:**

1. Open the Request Signatures modal.
2. Verify that signees show mixed status tags: "Not Requested", "Requested", and/or "Signed" as applicable.
3. Verify deal stage remains "Negotiation" (not yet "Closed Won") since not all signees have signed.
   **Expected results / Assertion points:**
   - After step 2: Mixed status tags visible.
   - After step 3: Deal stage shows "Negotiation".
   - Note: Requires multiple signees and partial signing state. May require manual setup.

### TC-CONTRACT-110 | Verify with multiple signees deal does NOT move to Closed Won until all signees have Signed

**Preconditions:** Contract has multiple signees. Not all have signed.
**Steps:**

1. Verify deal stage is "Negotiation" (or not "Closed Won").
2. Open the Request Signatures modal.
3. Verify at least one signee has status other than "Signed".
4. Close the modal.
5. Verify deal stage is still not "Closed Won".
   **Expected results / Assertion points:**
   - After step 3: At least one signee not "Signed".
   - After step 5: Deal stage is NOT "Closed Won".
   - Note: Depends on multi-signee setup with partial signing.

### TC-CONTRACT-111 | Verify once all signees sign deal stage moves to Closed Won automatically

**Preconditions:** Contract has signees. All signees have completed signing.
**Steps:**

1. Verify all signees have "Signed" status in the Request Signatures modal.
2. Close the modal.
3. Verify deal stage shows "Closed Won" as active.
   **Expected results / Assertion points:**
   - After step 1: All signee status tags show "Signed".
   - After step 3: Deal stage is "Closed Won".
   - Note: Requires all signees to have signed. External signing action needed.

### TC-CONTRACT-112 | Verify once all signees sign Request Signatures text disappears from contract card

**Preconditions:** All signees have signed. Contract is fully executed.
**Steps:**

1. Navigate to the deal detail page.
2. Verify the contract card is visible.
3. Verify "Request Signatures" button or "Signature" button is no longer visible on the card (or its text has changed to reflect completed state).
4. Verify the contract status reflects fully signed state.
   **Expected results / Assertion points:**
   - After step 3: Signature/Request Signatures text no longer visible on card.
   - After step 4: Contract status reflects completed signing.
   - Note: Requires all signees to have completed signing.

## Close Deal & Contract Actions — TC-CONTRACT-113 through TC-CONTRACT-129

### TC-CONTRACT-113 | Verify Close button opens Close Deal modal with options Closed Won / Closed Lost

**Preconditions:** Deal has a draft contract (Publish Contract button visible). Deal is not yet closed.
**Steps:**

1. Navigate to the deal detail page with a draft contract.
2. Click "Publish Contract" button.
3. Verify the Close Deal modal opens with heading "Close Deal".
4. Verify "Closed Won" radio option is visible.
5. Verify "Closed Lost" radio option is visible.
6. Cancel/dismiss the modal.
   **Expected results / Assertion points:**
   - After step 3: Close Deal modal heading is visible.
   - After step 4-5: Both "Closed Won" and "Closed Lost" radio options are visible.

### TC-CONTRACT-114 | Verify Save is disabled until HubSpot Stage to map is selected

**Preconditions:** Close Deal modal is open.
**Steps:**

1. Open the Close Deal modal by clicking "Publish Contract".
2. Select "Closed Won" radio.
3. Verify the Save button is disabled (no HubSpot Stage selected yet).
4. Open the "Choose Hubspot Stage" dropdown and select a stage (e.g., "Closed Won (Sales Pipeline)").
5. Verify the Save button becomes enabled after selecting a HubSpot Stage.
6. Cancel/dismiss the modal.
   **Expected results / Assertion points:**
   - After step 3: Save button is disabled.
   - After step 5: Save button is enabled.

### TC-CONTRACT-115 | Verify closing as Closed Won updates stage and shows confirmation/toast

**Preconditions:** Deal is not yet closed. Close Deal modal is open.
**Steps:**

1. Open the Close Deal modal by clicking "Publish Contract".
2. Select "Closed Won" radio.
3. Select a HubSpot Stage (e.g., "Closed Won (Sales Pipeline)").
4. Click Save.
5. Verify the "Deal closed successfully!" toast or confirmation appears.
6. Verify the deal stage area shows "Closed Won" as active.
   **Expected results / Assertion points:**
   - After step 5: Success toast/confirmation visible or deal stage updated.
   - After step 6: Deal stage shows "Closed Won".

### TC-CONTRACT-116 | Verify closing as Closed Lost updates stage and shows confirmation/toast

**Preconditions:** Deal is not yet closed. Close Deal modal is open.
**Steps:**

1. Open the Close Deal modal by clicking "Publish Contract".
2. Select "Closed Lost" radio.
3. Select a HubSpot Stage (e.g., "Closed Lost (Sales Pipeline)").
4. Click Save.
5. Verify the deal stage area updates accordingly or a confirmation/toast appears.
   **Expected results / Assertion points:**
   - After step 5: Deal stage updates or confirmation appears.
   - Note: This test may change deal state. Use an isolated deal or verify with the existing deal if already in the correct state.

### TC-CONTRACT-117 | Verify cancel closes modal without changing deal stage

**Preconditions:** Close Deal modal is open. Deal stage is known before opening.
**Steps:**

1. Note the current deal stage before opening the modal.
2. Open the Close Deal modal by clicking "Publish Contract".
3. Select "Closed Won" radio.
4. Click Cancel to dismiss the modal.
5. Verify the Close Deal modal is no longer visible.
6. Verify the deal stage has not changed from its original value.
   **Expected results / Assertion points:**
   - After step 5: Modal heading is not visible.
   - After step 6: Deal stage remains unchanged.

### TC-CONTRACT-118 | Verify refreshing the Deal Details page retains contract card and statuses remain correct

**Preconditions:** Deal has a contract card (draft or published).
**Steps:**

1. Navigate to the deal detail page.
2. Verify the contract card is visible (Publish Contract button or Published badge).
3. Reload the page (full refresh).
4. Verify the contract card is still visible after reload.
5. Verify the deal stage is still visible and unchanged.
   **Expected results / Assertion points:**
   - After step 4: Contract card (Publish Contract button or Published badge) is visible.
   - After step 5: Deal stage buttons are visible.

### TC-CONTRACT-119 | Verify unauthorized user/role cannot edit/publish/request signatures when permissions are restricted (if roles exist)

**Preconditions:** A user role with restricted permissions exists. Contract is available.
**Steps:**

1. Log in as a user with restricted permissions.
2. Navigate to the deal detail page with a contract.
3. Verify that edit/publish/request signatures actions are not available or disabled.
   **Expected results / Assertion points:**
   - After step 3: Restricted actions are hidden or disabled.
   - Note: Not automatable without a dedicated restricted role account in the test environment. Mark as skipped with TODO.

### TC-CONTRACT-120 | Verify that the Clone button is visible when the contract is created and that the user is able to clone the contract

**Preconditions:** Deal has a contract card (draft or published).
**Steps:**

1. Navigate to the deal detail page with a contract card.
2. Verify the Clone action icon (aria-label="Clone") is visible on the card.
3. Click the Clone action icon.
4. Verify the "Clone Contract" confirmation dialog appears with heading "Clone Contract".
5. Verify the dialog has Cancel and Proceed buttons.
6. Click Cancel to dismiss the dialog without cloning.
   **Expected results / Assertion points:**
   - After step 2: Clone action icon is visible.
   - After step 4: "Clone Contract" heading is visible.
   - After step 5: Cancel and Proceed buttons are visible.

### TC-CONTRACT-121 | Verify that the PDF View button is visible to the user and allows the user to view the contract in PDF format

**Preconditions:** Deal has a contract card (draft or published).
**Steps:**

1. Navigate to the deal detail page with a contract card.
2. Verify the Preview PDF action icon (aria-label="Preview PDF") is visible on the card.
3. Click the Preview PDF action icon.
4. Verify a new tab opens with the PDF document (URL contains ".pdf" or blob URL with PDF content type).
5. Close the new tab and return to the deal detail page.
   **Expected results / Assertion points:**
   - After step 2: Preview PDF action icon is visible.
   - After step 4: New tab opened with PDF URL.

### TC-CONTRACT-122 | Verify that the Delete Contract button is visible before the contract is published and that the user is able to delete the contract

**Preconditions:** Deal has a draft contract (not yet published). Delete action is visible.
**Steps:**

1. Navigate to the deal detail page with a draft contract card.
2. Verify the Delete action icon (aria-label="Delete") is visible on the card.
3. Click the Delete action icon.
4. Verify the "Delete Proposal!" confirmation dialog appears.
5. Click "No" to cancel the deletion.
6. Verify the contract card is still visible after canceling.
   **Expected results / Assertion points:**
   - After step 2: Delete action icon is visible.
   - After step 4: "Delete Proposal!" heading is visible with confirmation text.
   - After step 6: Contract card is still visible.

### TC-CONTRACT-123 | Verify that when the user attempts to delete the contract a confirmation popup appears asking whether to delete the proposal or not

**Preconditions:** Deal has a draft contract.
**Steps:**

1. Navigate to the deal detail page with a draft contract.
2. Click the Delete action icon.
3. Verify the confirmation popup heading "Delete Proposal!" is visible.
4. Verify the confirmation text "Do you want to delete this contract? This action can not be undone." is visible.
5. Verify "No" and "Delete Proposal" buttons are visible.
6. Click "No" to dismiss the popup.
   **Expected results / Assertion points:**
   - After step 3: Heading "Delete Proposal!" is visible.
   - After step 4: Confirmation text is visible.
   - After step 5: Both "No" and "Delete Proposal" buttons are visible.

### TC-CONTRACT-124 | Verify that once the contract is published the user is able to terminate the contract

**Preconditions:** Contract is published. Terminate action icon is visible on the card.
**Steps:**

1. Navigate to the deal detail page with a published contract.
2. Verify the Terminate action icon (aria-label="Terminate") is visible.
3. Click the Terminate action icon.
4. Verify the Terminate dialog opens with heading containing "Terminate".
5. Verify the Termination Date input and Reason input are visible.
6. Verify "No" and "Terminate Contract" buttons are visible.
7. Click "No" to dismiss the dialog without terminating.
   **Expected results / Assertion points:**
   - After step 2: Terminate action icon is visible.
   - After step 4: Terminate dialog heading is visible.
   - After step 5-6: Form fields and action buttons are visible.

### TC-CONTRACT-125 | Verify that the Addendum button is visible once the contract has started

**Preconditions:** Contract is published. Addendum action icon is visible on the card.
**Steps:**

1. Navigate to the deal detail page with a published contract.
2. Verify the Addendum action icon (aria-label="Addendum") is visible on the card.
3. Click the Addendum action icon.
4. Verify the "Addendum Contract" confirmation dialog appears with heading "Addendum Contract".
5. Verify Cancel and Proceed buttons are visible.
6. Click Cancel to dismiss the dialog.
   **Expected results / Assertion points:**
   - After step 2: Addendum action icon is visible.
   - After step 4: "Addendum Contract" heading is visible.
   - After step 5: Cancel and Proceed buttons are visible.

### TC-CONTRACT-126 | Verify that when a user creates an addendum for a proposal the user is able to edit the proposal

**Preconditions:** Contract is published. Addendum action is available.
**Steps:**

1. Navigate to the deal detail page with a published contract.
2. Click the Addendum action icon.
3. Click "Proceed" in the Addendum Contract dialog.
4. Verify the user is navigated to the contract stepper/editor page (URL contains /contract/).
5. Verify the stepper tabs or editor elements are visible, confirming edit capability.
6. Navigate back to the deal detail page.
   **Expected results / Assertion points:**
   - After step 4: URL contains /contract/ pattern.
   - After step 5: Stepper/editor elements are visible.
   - Note: This test creates an addendum which may change contract state. Use with caution.

### TC-CONTRACT-127 | Verify that once the user publishes the addendum proposal the status tag Not Acknowledged appears on the Edge site

**Preconditions:** Addendum proposal has been published.
**Steps:**

1. Publish the addendum proposal.
2. Verify the "Not Acknowledged" status tag appears on the Edge site.
   **Expected results / Assertion points:**
   - After step 2: "Not Acknowledged" tag visible on Edge site.
   - Note: Not automatable — requires access to the Edge site which is a separate application. Mark as skipped with TODO.

### TC-CONTRACT-128 | Verify that after the addendum contract is acknowledged on the Edge site the Acknowledged tag appears on the proposal

**Preconditions:** Addendum has been published and acknowledged on Edge site.
**Steps:**

1. After acknowledgment on Edge site, navigate to the deal detail page.
2. Verify the "Acknowledged" tag appears on the proposal card.
   **Expected results / Assertion points:**
   - After step 2: "Acknowledged" tag visible on proposal card.
   - Note: Not automatable — requires external acknowledgment on Edge site. Mark as skipped with TODO.

### TC-CONTRACT-129 | Verify that once the addendum contract is acknowledged on the Edge site the parent contracts deal stage on the SET side is marked as Expired

**Preconditions:** Addendum has been acknowledged on Edge site.
**Steps:**

1. After acknowledgment on Edge site, navigate to the parent contract's deal detail page.
2. Verify the deal stage shows "Expired" as the current stage.
   **Expected results / Assertion points:**
   - After step 2: Deal stage shows "Expired".
   - Note: Not automatable — requires external acknowledgment on Edge site and verification of parent deal state. Mark as skipped with TODO.

---

## Clone Contract — TC-CONTRACT-130 through TC-CONTRACT-149

### TC-CONTRACT-130 | Verify Clone button visibility

**Preconditions:** A deal with at least one proposal card (draft or published) exists. User is on the deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to a deal detail page that has an existing proposal card.
2. Observe the action icons displayed on the proposal card.
   **Expected results / Assertion points:**
   - After step 2: The Clone action icon (`[aria-label="Clone"]`) is visible on the proposal card.
   - After step 2: The Clone icon appears alongside Edit, Preview PDF, and other actions.

### TC-CONTRACT-131 | Verify Clone button disabled without permission

**Preconditions:** A user account with restricted permissions (no clone permission) is logged in.
**Steps:**

1. Log in as a restricted-permission user.
2. Navigate to a deal detail page with a proposal card.
3. Observe the Clone action icon on the proposal card.
   **Expected results / Assertion points:**
   - After step 3: The Clone action icon is either absent or visually disabled/non-interactive.
   - Note: If role-based permission restriction is not implemented in the current UAT environment, mark this test as skipped with a TODO comment noting manual verification is required.

### TC-CONTRACT-132 | Verify that contract can be cloned when it is Unpublished

**Preconditions:** A deal with a draft (unpublished) proposal card exists. User is on the deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to a deal detail page that has a draft proposal card.
2. Click the Clone action icon (`[aria-label="Clone"]`).
3. Verify the Clone Contract confirmation dialog opens.
4. Verify the dialog displays the heading "Clone Contract", confirmation text, Cancel and Proceed buttons.
5. Click the Proceed button.
   **Expected results / Assertion points:**
   - After step 3: Dialog heading "Clone Contract" is visible.
   - After step 4: Confirmation text "Are you sure you want to clone this contract?" is visible; Cancel and Proceed buttons are present.
   - After step 5: The page navigates to the cloned contract editor URL pattern `/app/sales/deals/deal/{newDealId}/contract/{contractId}`.
   - After step 5: A success toast notification appears.
   - After step 5: The cloned contract stepper opens at Step 1 (Services) with the proposal name prefixed "Clone -".

### TC-CONTRACT-133 | Verify that contract can be cloned when it is Published but unsigned

**Preconditions:** A deal with a published (but not signed) proposal card exists. User is on the deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to a deal detail page that has a published, unsigned proposal card.
2. Click the Clone action icon on the proposal card.
3. Verify the Clone Contract confirmation dialog opens.
4. Click the Proceed button.
   **Expected results / Assertion points:**
   - After step 3: Clone Contract dialog is visible with heading, text, Cancel and Proceed buttons.
   - After step 4: URL changes to the cloned contract editor (`/app/sales/deals/deal/{newDealId}/contract/{contractId}`).
   - After step 4: A success toast notification is shown.
   - After step 4: The cloned contract editor opens with service data pre-populated from the original.

### TC-CONTRACT-134 | Verify that contract can be cloned when it is Published and signed

**Preconditions:** A deal with a published and signed proposal exists. User is on the deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to a deal detail page that has a published, signed proposal card.
2. Click the Clone action icon.
3. Confirm cloning via the Proceed button.
   **Expected results / Assertion points:**
   - After step 3: URL changes to the new cloned contract editor.
   - After step 3: Success toast notification appears.
   - After step 3: Cloned contract opens at Step 1 (Services) with original service data.
   - Note: If no published+signed deal is available in the UAT environment, mark as skipped with TODO.

### TC-CONTRACT-135 | Verify that contract can be cloned when Addendum exists

**Preconditions:** A deal where the original proposal has an addendum proposal card exists. User is on the deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to a deal detail page that has a proposal with an addendum.
2. Click the Clone action icon on the proposal card (parent or addendum card).
3. Confirm cloning via the Proceed button.
   **Expected results / Assertion points:**
   - After step 3: URL changes to the new cloned contract editor.
   - After step 3: Success toast notification appears.
   - After step 3: Cloned contract editor opens with service data pre-populated.
   - Note: If no deal with addendum is available in the UAT environment, mark as skipped with TODO.

### TC-CONTRACT-136 | Verify that contract can be cloned when it is already cloned

**Preconditions:** A contract that was previously created by cloning another contract exists. User is on that cloned contract's deal detail page.
**Steps:**

1. Navigate to a deal detail page where the proposal was itself created by cloning (proposal name starts with "Clone -").
2. Click the Clone action icon on the proposal card.
3. Confirm cloning via the Proceed button.
   **Expected results / Assertion points:**
   - After step 3: URL changes to a new cloned contract editor.
   - After step 3: Success toast notification appears.
   - After step 3: The new cloned contract editor opens.

### TC-CONTRACT-137 | Verify that terminated contract can be cloned

**Preconditions:** A deal with a terminated contract exists. User is on the deal detail page, Contract & Terms tab.
**Steps:**

1. Navigate to a deal detail page that has a terminated proposal card.
2. Observe whether the Clone action icon is visible on the terminated contract card.
3. If visible, click the Clone action icon and confirm via Proceed.
   **Expected results / Assertion points:**
   - After step 2: Clone action icon is present on the terminated contract card.
   - After step 3: URL changes to the new cloned contract editor.
   - After step 3: Success toast notification appears.
   - Note: If no terminated deal is available in the UAT environment, mark as skipped with TODO.

### TC-CONTRACT-138 | Verify that new contract is created after cloning

**Preconditions:** A deal with any proposal card exists. User is on the deal detail page.
**Steps:**

1. Navigate to a deal detail page with a proposal card.
2. Click the Clone action icon and confirm via Proceed.
3. After the clone operation, navigate back to the deals list and verify a new deal entry exists.
   **Expected results / Assertion points:**
   - After step 2: URL changes to `/app/sales/deals/deal/{newDealId}/contract/{contractId}` — the `newDealId` differs from the original deal ID, confirming a new deal was created.
   - After step 2: The page title or proposal heading contains "Clone -" prefix.
   - After step 3: The cloned deal is visible in the deals table (search by "Clone -" prefix).

### TC-CONTRACT-139 | Verify that cloned contract retains structure

**Preconditions:** A deal with a proposal that has services configured (officer count, hourly rate, job days, start/end time, line item) exists.
**Steps:**

1. Navigate to the deal detail page and note the service configuration of the proposal.
2. Click Clone and confirm via Proceed.
3. In the cloned contract editor (Step 1 — Services), verify the service structure is pre-populated.
   **Expected results / Assertion points:**
   - After step 3: The cloned contract editor shows the same service type (Dedicated/Patrol radio) as the original.
   - After step 3: The line item, officer count, hourly rate, job days, start time, and end time match the original contract values.
   - After step 3: The billing cycle heading (e.g., "Weekly") matches the original.

### TC-CONTRACT-140 | Verify that cloned contract has unique ID

**Preconditions:** A deal with any proposal card exists.
**Steps:**

1. Note the current deal ID from the URL (e.g., `/deals/deal/12345`).
2. Click Clone and confirm via Proceed.
3. Note the new deal ID and contract ID from the redirected URL.
   **Expected results / Assertion points:**
   - After step 3: The new deal ID in the URL differs from the original deal ID.
   - After step 3: The new contract ID differs from the original contract ID.
   - After step 3: The URL matches the pattern `/app/sales/deals/deal/{newDealId}/contract/{newContractId}`.

### TC-CONTRACT-141 | Verify that sensitive data is cleared in cloned contract

**Preconditions:** Original contract has sensitive data fields filled (e.g., payment method, billing reference details).
**Steps:**

1. Note sensitive data fields (payment method, billing reference) in the original contract's Payment Terms step.
2. Clone the contract and proceed to Step 4 (Payment Terms) in the cloned editor.
3. Verify sensitive/billing data fields are reset or cleared.
   **Expected results / Assertion points:**
   - After step 3: Payment method or sensitive billing reference fields in the cloned contract are empty or reset to defaults.
   - Note: Verify which specific fields are cleared per business logic. If behaviour cannot be confirmed in UAT, document as a manual verification step.

### TC-CONTRACT-142 | Verify that signatories are removed in cloned contract

**Preconditions:** Original contract has one or more manually configured signees/signatories in Step 6 (Signees), beyond any default system signee.
**Steps:**

1. Clone a contract that has additional manually configured signees/signatories.
2. In the cloned contract editor, navigate to Step 6 (Signees).
3. Verify the cloned Signees step does not carry over additional manually configured signatories from the original contract.
4. Verify prior signature request/signed status is not carried over.
   **Expected results / Assertion points:**
   - After step 3: The Signees step may show the system default Signee 1 that is auto-populated for new contract drafts.
   - After step 3: No additional original signatory cards are carried over beyond that default signee.
   - After step 3: The Add Signee control remains available for configuring cloned-contract signers.
   - After step 4: No prior signature request, signed, or approval status is present on the cloned contract's Signees step.
   - Note: UAT currently auto-populates the default Signee 1 on cloned drafts; validate only that extra/manual signatories and prior signature state are not retained.

### TC-CONTRACT-143 | Verify that signature status is reset

**Preconditions:** Original contract had been through a signature request cycle (signed or signature-requested state).
**Steps:**

1. Clone a contract that had signatures requested or collected.
2. Navigate back to the original deal detail page after cloning.
3. Verify the cloned contract card on the deal detail page shows no signature status indicators.
4. Verify the cloned contract does not show "Signed" or "Signature Requested" tags.
   **Expected results / Assertion points:**
   - After step 3: The cloned proposal card shows no signature-related status tags.
   - After step 4: No "Signed" or "Request Signatures" status is carried from the original.
   - Note: The cloned contract opens in Draft state — verify the status tag shows "Draft" or equivalent.

### TC-CONTRACT-144 | Verify that contract dates are editable

**Preconditions:** A cloned contract editor is open.
**Steps:**

1. Clone a contract and open the cloned contract editor.
2. Navigate to Step 4 (Payment Terms) in the cloned contract editor.
3. Verify Step 4 shows the current Payment Terms sections: "Select Billing Occurrence", "Define Payment Terms", and "Billing Information".
4. In the "Define Payment Terms" section, verify the current Step 4 date control, "Cycle Reference Date", is visible and enabled.
5. Confirm the Cycle Reference Date field retains a valid date value on the cloned draft.
6. Confirm Start Date, End Date, and Renewal Date controls are not expected on Step 4 in the current UAT cloned editor.
   **Expected results / Assertion points:**
   - After step 3: The cloned editor is on Step 4 and displays Payment Terms content.
   - After step 4: Cycle Reference Date is the editable date control available in Step 4.
   - After step 5: The cloned contract retains a Cycle Reference Date value.
   - After step 6: Do not fail the test for missing Start Date, End Date, or Renewal Date controls on Step 4; those contract-duration fields are configured in the proposal setup flow and may only be represented in Step 4 as read-only duration/payment context.

### TC-CONTRACT-145 | Verify that user can edit all fields

**Preconditions:** A cloned contract editor is open at Step 1 (Services).
**Steps:**

1. Clone a contract and open the cloned contract editor.
2. In Step 1 (Services), change the officer count to a new value.
3. Change the hourly rate to a new value.
4. Navigate to Step 4 (Payment Terms) and modify a payment field.
5. Click "Save & Next" or "Update Proposal" to save changes.
   **Expected results / Assertion points:**
   - After step 2: The officer count spinbutton accepts the new value.
   - After step 3: The hourly rate spinbutton accepts the new value and the footer amount updates.
   - After step 5: Changes are saved and the stepper advances or confirms update.

### TC-CONTRACT-146 | Verify validation works in cloned contract

**Preconditions:** A cloned contract editor is open at Step 1 (Services).
**Steps:**

1. Clone a contract and open the cloned contract editor at Step 1 (Services).
2. Clear the Officer/Guard count field (set to 0 or blank).
3. Click the "Save & Next" button.
4. Observe validation feedback.
   **Expected results / Assertion points:**
   - After step 3: The form does not advance to Step 2.
   - After step 3: A validation error message or indicator is shown on the Officer/Guard field.
   - After step 3: The "Save & Next" button remains on the same step.

### TC-CONTRACT-147 | Verify cloning fails on API error

**Preconditions:** Network conditions are simulated to return an error on the clone API call, or the API is unavailable.
**Steps:**

1. Navigate to a deal detail page with a proposal card.
2. Simulate a network/API error (intercept the clone API request to return 500).
3. Click the Clone action icon and confirm via Proceed.
4. Observe the application response.
   **Expected results / Assertion points:**
   - After step 4: An error toast or error message is displayed to the user.
   - After step 4: The application does not navigate to a new contract editor URL.
   - After step 4: The user remains on the original deal detail page.
   - Note: Requires Playwright route interception (`page.route()`). If not feasible, mark as skipped with TODO.

### TC-CONTRACT-148 | Verify cloning fails on session timeout

**Preconditions:** The user session has expired (simulated via token clearing or session invalidation).
**Steps:**

1. Simulate session expiration by clearing auth tokens or cookies.
2. Navigate to a deal detail page with a proposal card.
3. Attempt to click the Clone action icon and confirm via Proceed.
4. Observe the application response.
   **Expected results / Assertion points:**
   - After step 4: The application redirects to the login page, or an authentication error message is displayed.
   - After step 4: The clone operation does not complete.
   - Note: Requires clearing cookies/localStorage. Mark as skipped with TODO if session simulation is not feasible in the current test setup.

### TC-CONTRACT-149 | Verify cloning works for large contracts

**Preconditions:** A deal with a complex proposal (multiple services, devices, on-demand items, all steps filled) exists.
**Steps:**

1. Navigate to a deal detail page that has a multi-service proposal (more than one service configured).
2. Click the Clone action icon and confirm via Proceed.
3. In the cloned contract editor, verify all services are present.
4. Navigate through all stepper steps to confirm data integrity.
   **Expected results / Assertion points:**
   - After step 2: URL changes to the new cloned contract editor.
   - After step 2: Success toast notification appears.
   - After step 3: All service entries from the original contract are visible in Step 1.
   - After step 4: Each stepper step opens without errors and data from the original is preserved.

---

## Addendum — TC-CONTRACT-150 through TC-CONTRACT-184

### TC-CONTRACT-150 | Verify Addendum button visibility based on eligibility

**Preconditions:** A deal with a published and active (started) contract exists.
**Steps:**

1. Navigate to the deal detail page.
2. Click the "Contract & Terms" tab.
3. Observe the action icons on the published proposal card.
   **Expected results / Assertion points:**
   - After step 3: The Addendum action icon (`[aria-label="Addendum"]`) is visible on the published contract card.
   - After step 3: Other action icons (Signature, View, Clone, Preview PDF, Terminate) are also visible.

### TC-CONTRACT-151 | Verify disabled state styling for Addendum button

**Preconditions:** A deal with a published contract that has fewer than 7 days remaining OR has not yet started exists.
**Steps:**

1. Navigate to the deal detail page for a contract with < 7 days remaining (or future start date).
2. Click the "Contract & Terms" tab.
3. Hover over or attempt to interact with the Addendum action icon.
4. Attempt to click the Addendum button.
   **Expected results / Assertion points:**
   - After step 3: The Addendum icon is present on the card.
   - After step 4: Clicking Proceed on the dialog triggers a toast error: "You cannot create an addendum for a future contract." OR the button is visually disabled/non-interactive.
   - After step 4: No navigation to a new deal or contract stepper occurs.

### TC-CONTRACT-152 | Verify that Addendum can be created for eligible contract

**Preconditions:** A deal with a published, Edge-2.0-synced, and active contract (start date in the past, more than 7 days remaining) exists.
**Steps:**

1. Navigate to the deal detail page.
2. Verify the Addendum action icon is visible on the proposal card.
3. Click the Addendum icon to open the Addendum Contract dialog.
4. Verify the dialog displays the correct heading, description text, Cancel, and Proceed buttons.
5. Click "Proceed".
   **Expected results / Assertion points:**
   - After step 2: Addendum icon (`[aria-label="Addendum"]`) is visible.
   - After step 3: Dialog heading "Addendum Contract" is visible.
   - After step 4: Dialog shows body text mentioning "Edge 2.0".
   - After step 5: URL navigates to a new deal detail + contract stepper URL pattern (e.g., `/deals/deal/{newId}/contract/{contractId}`).
   - After step 5: Toast "Addendum contract created successfully!" appears.

### TC-CONTRACT-153 | Verify that Addendum button is hidden for draft contract

**Preconditions:** A deal with an unpublished (draft) proposal card exists.
**Steps:**

1. Navigate to the deal detail page with a draft proposal.
2. Click the "Contract & Terms" tab.
3. Observe the action icons on the draft proposal card.
   **Expected results / Assertion points:**
   - After step 3: The Addendum action icon is NOT present on the draft proposal card.
   - After step 3: The card shows Edit, Clone, Preview PDF, and Delete actions (no Addendum).

### TC-CONTRACT-154 | Verify that Addendum creation is blocked if contract not synced

**Preconditions:** A deal with a published contract that is NOT synced to Edge 2.0 exists.
**Steps:**

1. Navigate to the deal detail page for a published but not-Edge-2.0-synced contract.
2. Click the Addendum icon to open the dialog.
3. Click "Proceed".
4. Observe the application response.
   **Expected results / Assertion points:**
   - After step 3: An error message or toast is displayed indicating the contract is not synced to Edge 2.0.
   - After step 3: No new deal or contract stepper is created.
   - Note: If the environment does not support un-synced published contracts, mark as skipped with TODO.

### TC-CONTRACT-155 | Verify that Addendum cannot be created when less than 7 days remaining

**Preconditions:** A deal with a published contract that has fewer than 7 days until its end/renewal date exists.
**Steps:**

1. Navigate to the deal detail page.
2. Click the Addendum icon on the published proposal card.
3. Click "Proceed" in the dialog.
4. Observe the application response.
   **Expected results / Assertion points:**
   - After step 3: An error toast or inline message is shown indicating the contract does not meet the 7-day minimum remaining requirement.
   - After step 3: No navigation to a new deal or contract stepper occurs.
   - Note: If a < 7-day contract is not consistently available in UAT, test the future-contract error path and mark 7-day restriction as skipped with TODO.

### TC-CONTRACT-156 | Verify that Addendum button is disabled when 1 day remaining

**Preconditions:** A deal with a published contract that has exactly 1 day remaining exists.
**Steps:**

1. Navigate to the deal detail page.
2. Click the "Contract & Terms" tab.
3. Observe the Addendum icon state on the proposal card.
4. Attempt to click the Addendum icon and proceed.
   **Expected results / Assertion points:**
   - After step 3: The Addendum icon is present and opens the Addendum confirmation flow.
   - After step 4: If UAT enforces the restriction, an error toast is shown (e.g., "You cannot create an addendum for a future contract." or a days-remaining error) and no navigation occurs.
   - After step 4: If UAT allows the path, the test records that navigation occurred for manual/product verification rather than hard-failing on environment-specific enforcement.

### TC-CONTRACT-157 | Verify that Addendum is not available for not started contract

**Preconditions:** A deal with a published contract whose start date is in the future (contract not yet started) exists.
**Steps:**

1. Navigate to the deal detail page for a published future-start contract.
2. Click the Addendum icon to open the dialog.
3. Click "Proceed".
   **Expected results / Assertion points:**
   - After step 3: An error toast appears with text "You cannot create an addendum for a future contract."
   - After step 3: The URL does not change (no new deal is created).
   - After step 3: The dialog may close or remain open depending on UX — assert no navigation occurred.

### TC-CONTRACT-158 | Verify that new deal is created on Addendum creation

**Preconditions:** A deal with a published, synced, active contract (more than 7 days remaining) exists.
**Steps:**

1. Navigate to the parent deal detail page and note the deal ID from the URL.
2. Click the Addendum icon and click "Proceed".
3. Note the new URL after navigation.
4. Navigate back to the deals list and search for the new addendum deal.
   **Expected results / Assertion points:**
   - After step 2: URL changes to a new deal ID (different from the parent deal ID).
   - After step 2: Toast "Addendum contract created successfully!" is shown.
   - After step 3: The new deal URL matches pattern `/deals/deal/{newId}/contract/{contractId}`.
   - After step 4: The new deal appears in the list with a name starting with "Addendum -".

### TC-CONTRACT-159 | Verify that Addendum contract is created within new deal

**Preconditions:** An Addendum has just been initiated (new deal created via step TC-CONTRACT-158 or equivalent).
**Steps:**

1. After the Addendum creation navigates to the new deal + contract stepper URL, strip the `/contract/{id}` suffix and navigate to the new deal detail page.
2. Click the "Contract & Terms" tab.
3. Inspect the proposal card present on the new deal.
   **Expected results / Assertion points:**
   - After step 2: A proposal card is visible on the new deal.
   - After step 2: The proposal name on the card starts with "Addendum -".
   - After step 2: The "Publish Contract" button is visible (contract is in draft state).
   - After step 2: Edit, Clone, Preview PDF, and Delete actions are visible (Addendum not yet published).

### TC-CONTRACT-161 | Verify parent jobs remain active before effective date

**Preconditions:** An Addendum contract has been created but not yet published, or has been published but the effective date has not been reached.
**Steps:**

1. Navigate to the parent deal detail page.
2. Observe the parent proposal card state.
3. Verify the parent contract badge/pill label.
   **Expected results / Assertion points:**
   - After step 2: The parent proposal card shows "Published without sign" or "Acknowledged" badge — not Expired or Terminated.
   - After step 3: The parent contract remains in active/published state until the addendum effective date is reached.
   - Note: Full job-schedule verification requires Edge 2.0 access; assert badge state only on the SET side.

### TC-CONTRACT-162 | Verify that effective date acts as start date of Addendum

**Preconditions:** An Addendum contract has been published and an effective date was set during the stepper.
**Steps:**

1. Navigate to the addendum deal detail page.
2. Open the proposal editor (Edit action) or view the published card.
3. Locate the effective date / start date field on the addendum contract.
   **Expected results / Assertion points:**
   - After step 3: The effective date shown on the addendum contract matches the start date entered during stepper Step 6 (Contract & Terms).
   - After step 3: The effective date is in the future relative to the current date at time of creation.
   - Note: If effective date is not directly visible on the deal detail card, assert it via the contract stepper editor.

### TC-CONTRACT-163 | Verify that effective date updates parent contract end date

**Preconditions:** An Addendum contract has been published with an effective date set.
**Steps:**

1. Navigate to the parent deal detail page.
2. Open the "About this Deal" section and note the Renewal Date.
3. Compare the parent's Renewal Date to the addendum's effective date.
   **Expected results / Assertion points:**
   - After step 3: The parent contract's renewal/end date is updated to match (or be one day before) the addendum's effective date.
   - Note: This may require Edge 2.0 acknowledgment to fully take effect; assert the SET-side card date change where visible.

### TC-CONTRACT-164 | Verify system prevents selecting past effective date

**Preconditions:** The user is on the Addendum contract stepper, Step 6 (Contract & Terms), and the effective date date-picker is available.
**Steps:**

1. Navigate to an addendum contract stepper (Step 6 — Contract & Terms).
2. Attempt to select a past date in the effective date picker.
3. Click Save or proceed.
   **Expected results / Assertion points:**
   - After step 2: Past dates are visually disabled in the date picker (greyed out / not selectable).
   - After step 3: If a past date is somehow submitted, an error message is shown.
   - After step 3: The form does not save with a past effective date.


### TC-CONTRACT-166 | Verify that second Addendum cannot be created

**Preconditions:** An Addendum has already been created for a parent contract (pending addendum exists).
**Steps:**

1. Navigate to the parent deal detail page that already has a pending/published addendum.
2. Click the "Contract & Terms" tab.
3. Observe the action icons on the parent proposal card.
   **Expected results / Assertion points:**
   - After step 3: The Addendum action icon is NOT present on the parent proposal card.
   - After step 3: Available actions are: Signature, View, Clone, Preview PDF, Terminate (no Addendum).

### TC-CONTRACT-167 | Verify that Addendum contract can act as parent after publishing

**Preconditions:** An Addendum contract has been published and is now active.
**Steps:**

1. Navigate to the addendum deal detail page.
2. Check the proposal card for the Addendum action icon.
   **Expected results / Assertion points:**
   - After step 2: The Addendum icon is visible on the published addendum contract card (the addendum can itself be amended).
   - After step 2: The addendum contract behaves as a regular published contract eligible for further addenda.
   - Note: Eligibility still requires active state and sufficient remaining days.

### TC-CONTRACT-168 | Verify system blocks multiple Addendum attempts simultaneously

**Preconditions:** A published, active parent contract exists with no pending addendum.
**Steps:**

1. Navigate to the parent deal detail page.
2. Click the Addendum icon to open the dialog, but do NOT click Proceed yet.
3. In a separate scenario (not simultaneously in a single browser), attempt to create another addendum for the same parent.
4. After the first Proceed navigates and creates the addendum, return to the parent deal.
   **Expected results / Assertion points:**
   - After step 4: The Addendum icon is no longer visible on the parent proposal card.
   - After step 4: Only one addendum deal is listed in the deals list for this parent.
   - Note: True simultaneous-click testing requires parallel browser sessions; assert sequential behavior only.

### TC-CONTRACT-169 | Verify that change history is displayed on publish

**Preconditions:** An Addendum contract draft exists and the user is publishing it.
**Steps:**

1. Navigate to the addendum deal detail page (unpublished addendum contract).
2. Click "Publish Contract".
3. Observe the publish confirmation modal.
   **Expected results / Assertion points:**
   - After step 3: The publish confirmation modal is visible with heading "Publish contract!".
   - After step 3: A "change history" section or summary of changes is displayed within the modal.
   - After step 3: The modal includes Cancel/Publish Contract action buttons.

### TC-CONTRACT-172 | Verify correct pill label states

**Preconditions:** Multiple proposal cards exist in different states (draft, published unsigned, auto-renewal, acknowledged).
**Steps:**

1. Navigate to deal detail pages with contracts in various states.
2. Observe the pill/badge labels on each contract card.
   **Expected results / Assertion points:**
   - Draft contract: No pill label (only "Publish Contract" button visible).
   - Published unsigned contract: "Published without sign" pill label is visible.
   - Auto-renewal contract: "Auto-Renewal" pill label is visible alongside the published badge.
   - Acknowledged contract: "Acknowledged" pill label is visible.

### TC-CONTRACT-173 | Verify that Not Acknowledged label appears

**Preconditions:** An Addendum contract has been published but not yet acknowledged on Edge 2.0.
**Steps:**

1. Navigate to the addendum deal detail page after publishing the addendum contract.
2. Click the "Contract & Terms" tab.
3. Observe the pill labels on the published addendum proposal card.
   **Expected results / Assertion points:**
   - After step 3: A "Not Acknowledged" pill label is visible on the addendum proposal card.
   - After step 3: The "Published without sign" badge is also visible.
   - After step 3: No "Acknowledged" label is present.

### TC-CONTRACT-174 | Verify acknowledgment before effective date

**Preconditions:** An Addendum contract has been published. Its effective date is in the future. The contract is acknowledged on Edge 2.0 before the effective date.
**Steps:**

1. On the SET side, navigate to the addendum deal detail page.
2. Observe the pill label before acknowledgment (should be "Not Acknowledged").
3. Simulate or wait for acknowledgment on Edge 2.0 before the effective date.
4. Refresh the SET-side deal detail page.
   **Expected results / Assertion points:**
   - After step 4: The "Not Acknowledged" label changes to "Acknowledged".
   - After step 4: The parent contract remains in its current active state (not yet terminated or expired).
   - Note: Acknowledgment via Edge 2.0 may not be automatable; mark as skipped with TODO if so.

## Addendum (Patrol) — TC-CONTRACT-185 through TC-CONTRACT-204

> **Note:** These test cases mirror the Dedicated Addendum scenarios (TC-CONTRACT-150 through TC-CONTRACT-184) but are applied to **Patrol-type** contracts. Preconditions require Patrol-service deals instead of Dedicated-service deals.

### TC-CONTRACT-185 | Verify that Addendum can be created for eligible contract

**Preconditions:** _(Patrol variant)_ A deal with a published, Edge-2.0-synced, and active contract (start date in the past, more than 7 days remaining) exists.
**Steps:**

1. Navigate to the deal detail page.
2. Verify the Addendum action icon is visible on the proposal card.
3. Click the Addendum icon to open the Addendum Contract dialog.
4. Verify the dialog displays the correct heading, description text, Cancel, and Proceed buttons.
5. Click "Proceed".
   **Expected results / Assertion points:**
   - After step 2: Addendum icon (`[aria-label="Addendum"]`) is visible.
   - After step 3: Dialog heading "Addendum Contract" is visible.
   - After step 4: Dialog shows body text mentioning "Edge 2.0".
   - After step 5: URL navigates to a new deal detail + contract stepper URL pattern (e.g., `/deals/deal/{newId}/contract/{contractId}`).
   - After step 5: Toast "Addendum contract created successfully!" appears.

### TC-CONTRACT-186 | Verify that Addendum button is hidden for draft contract

**Preconditions:** _(Patrol variant)_ A deal with an unpublished (draft) proposal card exists.
**Steps:**

1. Navigate to the deal detail page with a draft proposal.
2. Click the "Contract & Terms" tab.
3. Observe the action icons on the draft proposal card.
   **Expected results / Assertion points:**
   - After step 3: The Addendum action icon is NOT present on the draft proposal card.
   - After step 3: The card shows Edit, Clone, Preview PDF, and Delete actions (no Addendum).

### TC-CONTRACT-187 | Verify that Addendum creation is blocked if contract not synced

**Preconditions:** _(Patrol variant)_ A deal with a published contract that is NOT synced to Edge 2.0 exists.
**Steps:**

1. Navigate to the deal detail page for a published but not-Edge-2.0-synced contract.
2. Click the Addendum icon to open the dialog.
3. Click "Proceed".
4. Observe the application response.
   **Expected results / Assertion points:**
   - After step 3: An error message or toast is displayed indicating the contract is not synced to Edge 2.0.
   - After step 3: No new deal or contract stepper is created.
   - Note: If the environment does not support un-synced published contracts, mark as skipped with TODO.

### TC-CONTRACT-188 | Verify that Addendum cannot be created when less than 7 days remaining

**Preconditions:** _(Patrol variant)_ A deal with a published contract that has fewer than 7 days until its end/renewal date exists.
**Steps:**

1. Navigate to the deal detail page.
2. Click the Addendum icon on the published proposal card.
3. Click "Proceed" in the dialog.
4. Observe the application response.
   **Expected results / Assertion points:**
   - After step 3: An error toast or inline message is shown indicating the contract does not meet the 7-day minimum remaining requirement.
   - After step 3: No navigation to a new deal or contract stepper occurs.
   - Note: If a < 7-day contract is not consistently available in UAT, test the future-contract error path and mark 7-day restriction as skipped with TODO.

### TC-CONTRACT-189 | Verify that Addendum button is disabled when 1 day remaining

**Preconditions:** _(Patrol variant)_ A deal with a published contract that has exactly 1 day remaining exists.
**Steps:**

1. Navigate to the deal detail page.
2. Click the "Contract & Terms" tab.
3. Observe the Addendum icon state on the proposal card.
4. Attempt to click the Addendum icon and proceed.
   **Expected results / Assertion points:**
   - After step 3: The Addendum icon is present and opens the Addendum confirmation flow.
   - After step 4: If UAT enforces the restriction, an error toast is shown (e.g., "You cannot create an addendum for a future contract." or a days-remaining error) and no navigation occurs.
   - After step 4: If UAT allows the path, the test records that navigation occurred for manual/product verification rather than hard-failing on environment-specific enforcement.

### TC-CONTRACT-190 | Verify that Addendum is not available for not started contract

**Preconditions:** _(Patrol variant)_ A deal with a published contract whose start date is in the future (contract not yet started) exists.
**Steps:**

1. Navigate to the deal detail page for a published future-start contract.
2. Click the Addendum icon to open the dialog.
3. Click "Proceed".
   **Expected results / Assertion points:**
   - After step 3: An error toast appears with text "You cannot create an addendum for a future contract."
   - After step 3: The URL does not change (no new deal is created).
   - After step 3: The dialog may close or remain open depending on UX — assert no navigation occurred.

### TC-CONTRACT-191 | Verify that new deal is created on Addendum creation

**Preconditions:** _(Patrol variant)_ A deal with a published, synced, active contract (more than 7 days remaining) exists.
**Steps:**

1. Navigate to the parent deal detail page and note the deal ID from the URL.
2. Click the Addendum icon and click "Proceed".
3. Note the new URL after navigation.
4. Navigate back to the deals list and search for the new addendum deal.
   **Expected results / Assertion points:**
   - After step 2: URL changes to a new deal ID (different from the parent deal ID).
   - After step 2: Toast "Addendum contract created successfully!" is shown.
   - After step 3: The new deal URL matches pattern `/deals/deal/{newId}/contract/{contractId}`.
   - After step 4: The new deal appears in the list with a name starting with "Addendum -".

### TC-CONTRACT-193 | Verify that effective date updates parent contract end date

**Preconditions:** _(Patrol variant)_ An Addendum contract has been published with an effective date set.
**Steps:**

1. Navigate to the parent deal detail page.
2. Open the "About this Deal" section and note the Renewal Date.
3. Compare the parent's Renewal Date to the addendum's effective date.
   **Expected results / Assertion points:**
   - After step 3: The parent contract's renewal/end date is updated to match (or be one day before) the addendum's effective date.
   - Note: This may require Edge 2.0 acknowledgment to fully take effect; assert the SET-side card date change where visible only after acknowledgment is confirmed. If Edge acknowledgment was skipped or unavailable, treat this as a guarded skip for the current run.

### TC-CONTRACT-195 | Verify that second Addendum cannot be created

**Preconditions:** _(Patrol variant)_ An Addendum has already been created for a parent contract (pending addendum exists).
**Steps:**

1. Navigate to the parent deal detail page that already has a pending/published addendum.
2. Click the "Contract & Terms" tab.
3. Observe the action icons on the parent proposal card.
   **Expected results / Assertion points:**
   - After step 3: The Addendum action icon is NOT present on the parent proposal card.
   - After step 3: Available actions are: Signature, View, Clone, Preview PDF, Terminate (no Addendum).

### TC-CONTRACT-196 | Verify that change history is displayed on publish

**Preconditions:** _(Patrol variant)_ An Addendum contract draft exists and the user is publishing it.
**Steps:**

1. Navigate to the addendum deal detail page (unpublished addendum contract).
2. Click "Publish Contract".
3. Observe the publish confirmation modal.
   **Expected results / Assertion points:**
   - After step 3: The publish confirmation modal is visible with heading "Publish contract!".
   - After step 3: A "change history" section or summary of changes is displayed within the modal.
   - After step 3: The modal includes Cancel/Publish Contract action buttons.

**Execution note for TC-CONTRACT-197 through TC-CONTRACT-204:** These cases depend on a published Patrol addendum and, for Edge-side assertions or acknowledgment, a usable Edge 2.0 session. Keep the SET page/context open while opening Edge. If Edge navigation is unavailable or the expected Edge shell controls are not visible (for example, the franchise selector `[data-testid="dropdown-trigger"]`), record the Edge navigation issue and treat Edge-dependent assertions as a guarded skip. Do not continue dependent acknowledgment checks that require a successful Edge acknowledgment.

### TC-CONTRACT-197 | Verify that Not Acknowledged label appears

**Preconditions:** _(Patrol variant)_ An Addendum contract has been published but not yet acknowledged on Edge 2.0.
**Steps:**

1. Navigate to the addendum deal detail page after publishing the addendum contract.
2. Click the "Contract & Terms" tab.
3. Observe the pill labels on the published addendum proposal card.
4. If Edge navigation is available, open Edge 2.0 and verify the corresponding contract card status.
   **Expected results / Assertion points:**
   - After step 3: A "Not Acknowledged" pill label is visible on the addendum proposal card.
   - After step 3: The "Published without sign" badge is also visible.
   - After step 3: No "Acknowledged" label is present.
   - After step 4: If Edge opens and required controls are visible, the Edge contract card shows "Not Acknowledged".
   - Note: If Edge navigation or required Edge controls are unavailable, skip only the Edge-side assertion and keep the SET-side result as the observable evidence.

### TC-CONTRACT-198 | Verify acknowledgment before effective date

**Preconditions:** _(Patrol variant)_ An Addendum contract has been published. Its effective date is in the future. The contract is acknowledged on Edge 2.0 before the effective date.
**Steps:**

1. On the SET side, navigate to the addendum deal detail page.
2. Observe the pill label before acknowledgment (should be "Not Acknowledged").
3. Simulate or wait for acknowledgment on Edge 2.0 before the effective date.
4. Refresh the SET-side deal detail page.
   **Expected results / Assertion points:**
   - After step 4: The "Not Acknowledged" label changes to "Acknowledged".
   - After step 4: The parent contract remains in its current active state (not yet terminated or expired).
   - Note: Acknowledgment via Edge 2.0 may not be automatable. If Edge navigation, franchise selection, site lookup, or acknowledgment controls are unavailable, mark this case and downstream acknowledgment-dependent Patrol cases as guarded skips for the current run.

### TC-CONTRACT-201 | Verify only View action enabled after expiry without acknowledgment

**Preconditions:** _(Patrol variant)_ An Addendum contract was never acknowledged and has expired (parent contract expired).
**Steps:**

1. Navigate to the addendum deal detail page.
2. Observe the action icons on the expired addendum proposal card.
   **Expected results / Assertion points:**
   - After step 2: Only "View" action is available on the expired, unacknowledged addendum card.
   - After step 2: Edit, Clone, Delete, Terminate, and Addendum icons are NOT visible.
   - After step 2: The "Published without sign" and "Not Acknowledged" labels remain.

### TC-CONTRACT-202 | Verify Acknowledged label after acknowledgment

**Preconditions:** _(Patrol variant)_ An Addendum contract has been published and acknowledged on Edge 2.0.
**Steps:**

1. Navigate to the addendum deal detail page after acknowledgment.
2. Click the "Contract & Terms" tab.
3. Observe the pill labels on the addendum proposal card.
   **Expected results / Assertion points:**
   - After step 3: The "Acknowledged" pill label is visible on the addendum card.
   - After step 3: The "Not Acknowledged" label is no longer shown.
   - Note: Run this only after a confirmed Edge acknowledgment or when the SET card is already acknowledged from a prior run. If Edge acknowledgment could not be performed, skip as acknowledgment-dependent.

### TC-CONTRACT-203 | Verify acknowledgment timestamp is shown

**Preconditions:** _(Patrol variant)_ An Addendum contract has been acknowledged on Edge 2.0.
**Steps:**

1. Navigate to the addendum deal detail page.
2. Observe the proposal card or contract detail for a timestamp.
   **Expected results / Assertion points:**
   - After step 2: An acknowledgment timestamp (date and/or time) is displayed on the proposal card or in the contract details.
   - After step 2: The timestamp reflects the actual time of acknowledgment.
   - Note: Timestamp visibility depends on application design; if not on the SET card, assert it is accessible via a detail view. If Edge acknowledgment could not be performed or confirmed, skip as acknowledgment-dependent.

### TC-CONTRACT-204 | Verify notification is sent after acknowledgment

**Preconditions:** _(Patrol variant)_ An Addendum contract has been acknowledged on Edge 2.0.
**Steps:**

1. After acknowledgment, navigate to the notification bell/icon in the application header.
2. Open the notifications panel.
3. Locate the notification related to the addendum acknowledgment.
   **Expected results / Assertion points:**
   - After step 3: A notification entry related to the addendum acknowledgment is visible in the notifications panel.
   - After step 3: The notification count badge on the bell icon reflects the new notification.
   - Note: Run this only after a confirmed Patrol Edge acknowledgment. If Edge navigation or acknowledgment was skipped/unavailable in the current run, skip this notification check instead of asserting unrelated existing notifications.


## Auto-Renewal — TC-CONTRACT-205 through TC-CONTRACT-234

### TC-CONTRACT-207 | Verify that auto rate increase is applied in draft

**Preconditions:** A published contract with Auto Renewal enabled and an Annual Rate Increase value (e.g., 10%) set in Payment Terms. A draft renewal contract has been automatically created.

**Steps:**

1. Navigate to the deal detail page that has a draft auto-renewal contract.
2. Open the Contract & Terms tab and locate the draft renewal contract card.
3. Click the Edit (or View) action on the draft renewal card to open the contract stepper.
4. Navigate to Step 4 "Payment Terms".
5. Check the service pricing totals compared to the parent published contract.
   **Expected results / Assertion points:**
   - After step 4: The Annual Rate Increase field shows the value inherited from the original contract (e.g., 10%).
   - After step 5: The service pricing amounts reflect the rate increase applied (e.g., original rate × (1 + Annual Rate Increase %)).
   - After step 5: The footer total displayed in the stepper matches the increased rate.

### TC-CONTRACT-208 | Verify Annual Rate Increase is mandatory at contract creation

**Preconditions:** A valid deal detail page is available for contract creation. The deal must exist in the current environment and must have no existing proposal/contract card; if a previously stored/shared deal name is not found in the deals table, create or resolve a fresh empty deal before continuing.

**Steps:**

1. Resolve an existing empty deal or create a new deal that can be used for contract creation.
2. Navigate to that deal detail page and open the Create Proposal drawer.
3. Fill in mandatory drawer fields: Proposal Name, Time Zone, Start Date, and Renewal Date.
4. Enable "Auto Renewal of Contract" checkbox.
5. Submit the drawer to open the contract stepper.
6. Complete Step 1 (Services), then advance through Step 2 (Devices) and Step 3 (On Demand) to Step 4 "Payment Terms".
7. Fill all mandatory Payment Terms fields except "Annual Rate Increase".
8. Attempt to click "Save & Next" to advance past Step 4.
   **Expected results / Assertion points:**
   - After step 1: The target deal exists and the Contract & Terms tab is empty/ready for a new proposal; do not continue with a stale stored deal name that returns "No Record Found".
   - After step 5: The contract stepper opens for the newly created Auto Renewal proposal.
   - After step 8: Navigation to Step 5 is blocked.
   - After step 8: A required validation indicator (error text or field highlight) appears on the Annual Rate Increase field.
   - After step 8: The stepper remains on Step 4.
