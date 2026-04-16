# Contract Module Test Cases

This document explains the Contract Module test cases in simple NLP-style language.
It is based on:

- [contract-module.spec.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/e2e/contract-module.spec.js)
- [contract-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/contract-module.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All contract test cases run in the same browser session.
- The suite is serial.
- Before each smoke test, the script opens the Deals page.
- If no reusable target deal exists, the suite creates one fresh deal and uses that same deal for contract tests.
- The same deal is reused for the full proposal, close-deal, and publish flow.
- The spec currently contains `40` test cases in total:
- `22` smoke cases: `TC-CONTRACT-001` to `TC-CONTRACT-022`
- `18` E2E cases: `TC-CONTRACT-E2E-001` to `TC-CONTRACT-E2E-018`

## Dynamic Test Data

- Contract target deal is resolved dynamically.
- Standalone fallback company: `Regression Phase 2`
- Standalone fallback property: `Regression Location Phase 2`
- Time zone used in E2E contract creation: Eastern
- Stepper and publish data comes from `utils/contract-test-data.js`

## Smoke Test Cases

### TC-CONTRACT-001 | Contract & Terms tab is visible on deal detail page
Execution steps:
- Open the Deals list.
- Search and open the target deal.
- Verify the deal detail page opens.
- Check that the `Contract & Terms` tab is visible.

Expected result:
- The `Contract & Terms` tab is visible on the deal detail page.

### TC-CONTRACT-002 | Contract & Terms tab is selected by default
Execution steps:
- Open the target deal detail page.
- Check the selected state of the `Contract & Terms` tab.

Expected result:
- `Contract & Terms` is selected by default.

### TC-CONTRACT-003 | All four overview tabs are visible on deal detail page
Execution steps:
- Open the target deal detail page.
- Verify `Contract & Terms`, `Activities`, `Notes`, and `Tasks`.

Expected result:
- All four overview tabs are visible.

### TC-CONTRACT-004 | Contract & Terms empty state renders correct UI elements
Execution steps:
- Open the target deal detail page.
- Stay on the `Contract & Terms` tab.
- Verify the empty-state heading, helper text, and `Create Proposal` button.

Expected result:
- The empty state is visible with correct UI elements.

### TC-CONTRACT-005 | Clicking Create Proposal opens the drawer with correct heading
Execution steps:
- Open the target deal detail page.
- Click `Create Proposal`.
- Verify the drawer heading.
- Close the drawer.

Expected result:
- The `Create Proposal` drawer opens correctly.

### TC-CONTRACT-006 | Create Proposal drawer contains all expected fields
Execution steps:
- Open the target deal detail page.
- Open the `Create Proposal` drawer.
- Verify service type radios, proposal name, time zone, checkbox label, and action buttons.
- Close the drawer.

Expected result:
- All expected drawer fields are visible.

### TC-CONTRACT-007 | Date fields are visible by default in Create Proposal drawer
Execution steps:
- Open the `Create Proposal` drawer.
- Check Start Date.
- Check End Date option.
- Check Renewal Date option.

Expected result:
- Date fields are visible by default.

### TC-CONTRACT-008 | Dedicated Patrol is the default selected service type
Execution steps:
- Open the `Create Proposal` drawer.
- Check the default service-type radio selection.

Expected result:
- `Dedicated / Patrol` is selected by default.

### TC-CONTRACT-009 | Service type can be switched to Dispatch Only
Execution steps:
- Open the `Create Proposal` drawer.
- Click the `Dispatch Only` radio.
- Verify the radio states.

Expected result:
- `Dispatch Only` becomes selected and `Dedicated / Patrol` becomes unselected.

### TC-CONTRACT-010 | Proposal Name is pre-filled with the deal name on drawer open
Execution steps:
- Open the `Create Proposal` drawer.
- Read the Proposal Name field value.

Expected result:
- Proposal Name is pre-filled with the deal name.

### TC-CONTRACT-011 | Proposal Name field accepts updated text input
Execution steps:
- Open the `Create Proposal` drawer.
- Clear the Proposal Name field.
- Type a new proposal name.
- Verify the new value.

Expected result:
- The Proposal Name field accepts updated input.

### TC-CONTRACT-012 | Time Zone trigger is visible and displays a UTC label
Execution steps:
- Open the `Create Proposal` drawer.
- Check the time zone trigger.

Expected result:
- A visible UTC-based time zone label is shown.

### TC-CONTRACT-013 | Contract Dates to be decided checkbox is unchecked by default
Execution steps:
- Open the `Create Proposal` drawer.
- Check the `Contract Dates to be decided` checkbox state.

Expected result:
- The checkbox is unchecked by default.

### TC-CONTRACT-014 | Checking Contract Dates to be decided hides all date fields
Execution steps:
- Open the `Create Proposal` drawer.
- Verify date fields are visible initially.
- Check `Contract Dates to be decided`.
- Verify the checkbox is checked.
- Verify Start Date and date radio fields disappear.

Expected result:
- Checking the checkbox hides all date fields.

### TC-CONTRACT-015 | Unchecking Contract Dates to be decided restores date fields
Execution steps:
- Open the `Create Proposal` drawer.
- Check the checkbox once to hide the fields.
- Uncheck the checkbox.
- Verify the date fields return.

Expected result:
- Unchecking restores the date fields.

### TC-CONTRACT-016 | Renewal Date is the default selection in the date type radio
Execution steps:
- Open the `Create Proposal` drawer.
- Check the date type radio state.

Expected result:
- `Renewal Date` is selected by default.

### TC-CONTRACT-017 | Selecting End Date radio switches the date type selection
Execution steps:
- Open the `Create Proposal` drawer.
- Click `End Date`.
- Verify `End Date` is checked and `Renewal Date` is unchecked.

Expected result:
- The date type changes to `End Date`.

### TC-CONTRACT-018 | Notify for Renewal Before Days defaults to 10
Execution steps:
- Open the `Create Proposal` drawer.
- Read the notify-days spinbutton value.

Expected result:
- The default value is `10`.

### TC-CONTRACT-019 | Notify for Renewal field is visible in default drawer state
Execution steps:
- Open the `Create Proposal` drawer.
- Check the notify-days field.

Expected result:
- The notify-days field is visible and enabled.

### TC-CONTRACT-020 | Cancel button closes the Create Proposal drawer
Execution steps:
- Open the `Create Proposal` drawer.
- Click `Cancel`.
- Verify the drawer closes.

Expected result:
- The drawer closes successfully.

### TC-CONTRACT-021 | Cancelling Create Proposal preserves the empty state UI
Execution steps:
- Open the `Create Proposal` drawer.
- Cancel it.
- Verify the empty state is still visible.

Expected result:
- The empty state remains unchanged after cancel.

### TC-CONTRACT-022 | Create Proposal drawer can be reopened after cancel
Execution steps:
- Open the `Create Proposal` drawer.
- Cancel it.
- Open it again.
- Verify the heading is visible.

Expected result:
- The drawer can be reopened successfully.

## E2E Full Create and Publish Test Cases

### TC-CONTRACT-E2E-001 | Navigate to E2E deal and verify empty state
Execution steps:
- Open the Deals page.
- Search and open the target E2E deal.
- Verify the deal detail page opens.
- Detect the current contract state.

Expected result:
- The contract area resolves to a valid state such as `empty`, `proposal`, or `stepper`.

### TC-CONTRACT-E2E-002 | Fill Create Proposal drawer and submit — stepper opens
Execution steps:
- Ensure the contract stepper flow is ready.
- Open the Create Proposal drawer if needed.
- Select the configured time zone.
- Fill Start Date.
- Fill Renewal Date.
- Submit the proposal.
- Verify the stepper opens.

Expected result:
- The contract stepper opens and all six step tabs become visible.

### TC-CONTRACT-E2E-003 | Step 1 Services is visible with all required fields
Execution steps:
- Stay on Step 1 Services.
- Verify the step heading.
- Verify Service Name field.
- Verify `Save & Next`.
- Verify service type controls.

Expected result:
- Step 1 fields are visible and ready.

### TC-CONTRACT-E2E-004 | Fill Step 1 Services and advance to Step 2
Execution steps:
- Fill Service Name.
- Fill Officer/Guard count.
- Fill Hourly Rate.
- Select the work day.
- Set Start Time.
- Set End Time.
- Click `Save & Next`.

Expected result:
- Step 1 completes and Step 2 opens.

### TC-CONTRACT-E2E-005 | Step 2 Devices shows Checkpoints and Devices heading
Execution steps:
- Stay on Step 2 Devices.
- Verify the `Checkpoints & Devices` heading.
- Verify device options like `NFC Tags`, `Beacons`, and `QR Tags`.
- Verify the total heading is visible.

Expected result:
- Step 2 device section renders correctly.

### TC-CONTRACT-E2E-006 | Add NFC Tag quantity and advance to Step 3
Execution steps:
- Increase `NFC Tags` quantity by one.
- Verify the total updates.
- Click `Save & Next`, or move to the next step if it is already available.

Expected result:
- Step 3 opens successfully.

### TC-CONTRACT-E2E-007 | Step 3 On Demand is visible and advances to Step 4
Execution steps:
- Verify the `Additional Services Pricing` heading.
- Click `Save & Next`.
- If needed, click Step 4 manually.

Expected result:
- Step 4 Payment Terms becomes visible.

### TC-CONTRACT-E2E-008 | Step 4 Payment Terms shows all three sections
Execution steps:
- Stay on Step 4 Payment Terms.
- Verify `Select Billing Occurrence`.
- Verify `Define Payment Terms`.
- Verify `Billing Information`.
- Verify Annual Rate Increase field.

Expected result:
- All Step 4 sections are visible.

### TC-CONTRACT-E2E-009 | Fill Step 4 Payment Terms and advance to Step 5
Execution steps:
- Fill Annual Rate Increase.
- Select Billing Type.
- Select Contract Type.
- Select Billing Frequency.
- Select Payment Terms.
- Select Payment Method.
- Select Cycle Reference Date.
- Fill billing contact details.
- Click `Save & Next`.

Expected result:
- Step 5 Description becomes visible.

### TC-CONTRACT-E2E-010 | Step 5 Description is pre-filled and advances to Step 6
Execution steps:
- Verify the `Description of Services` heading.
- Verify the description editor already has content.
- Click `Save & Next`.

Expected result:
- Step 6 Signees becomes visible.

### TC-CONTRACT-E2E-011 | Step 6 Signees shows default signee and Finish button
Execution steps:
- Stay on Step 6 Signees.
- Verify the signee section heading.
- Verify default `Signee 1`.
- Verify `Finish` button.
- Verify `Preview` button.

Expected result:
- Default signee and final actions are visible.

### TC-CONTRACT-E2E-012 | Clicking Finish returns to Deal Detail with proposal card
Execution steps:
- On Step 6, click `Finish`.
- Wait for navigation back to the deal detail page.
- Verify the proposal card appears.

Expected result:
- The stepper closes and the proposal card is shown on the deal detail page.

### TC-CONTRACT-E2E-013 | Proposal card is visible with Publish Contract button
Execution steps:
- Stay on the deal detail page after finishing the stepper.
- Verify `Publish Contract` button.
- Verify `Signature`, `Edit`, `Clone`, and `Preview PDF` action buttons.

Expected result:
- The proposal card is visible with all expected actions.

### TC-CONTRACT-E2E-014 | Clicking Publish Contract opens Close Deal modal
Execution steps:
- Click `Publish Contract` while the deal is still open.
- Verify the `Close Deal` modal opens.
- Verify `Closed Won` and `Closed Lost` options.
- Verify `Closed Lost` is selected by default.

Expected result:
- The close-deal modal opens correctly.

### TC-CONTRACT-E2E-015 | Select Closed Won and Hubspot Stage enables Save button
Execution steps:
- In the Close Deal modal, select `Closed Won`.
- Select the configured Hubspot stage.
- Check the Save button state.

Expected result:
- Save becomes enabled after the required selections.

### TC-CONTRACT-E2E-016 | Saving Close Deal closes the deal successfully
Execution steps:
- Click Save in the Close Deal modal.
- Verify the deal closed success message.
- Verify the deal stage updates to `Closed Won`.
- Verify `Publish Contract` still remains visible.

Expected result:
- The deal is closed successfully, but the contract is not yet published.

### TC-CONTRACT-E2E-017 | Clicking Publish Contract after deal close opens confirm modal
Execution steps:
- Click `Publish Contract` again after the deal is closed.
- Verify the publish confirmation modal.
- Verify the warning text and action buttons.

Expected result:
- The publish confirmation modal opens successfully.

### TC-CONTRACT-E2E-018 | Confirming Publish Contract marks the contract as Published
Execution steps:
- In the publish confirmation modal, click `Publish Contract`.
- Wait for the modal to close.
- Verify the proposal card status changes.

Expected result:
- The contract is published.
- `Published without sign` badge appears.
- `Publish Contract` button disappears.
- `Terminate` action appears in place of `Delete`.

## Page Object Summary

The page object in [contract-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/contract-module.js) handles:

- Deals page navigation for contract entry
- Deal detail opening and Contract & Terms tab validation
- Empty-state assertions for contract/proposal creation
- Create Proposal drawer opening, field assertions, and cancel flow
- Service type, proposal name, time zone, and contract date controls
- Contract stepper navigation across all 6 steps
- Step 1 Services data entry
- Step 2 Devices quantity updates
- Step 3 On Demand navigation
- Step 4 Payment Terms data entry
- Step 5 Description validation
- Step 6 Signees validation and Finish action
- Proposal card validation on deal detail
- Close Deal modal handling
- Publish Contract confirmation flow and published-state validation

## Recommended Execution Commands

Full Contract suite:

```bash
npx playwright test tests/e2e/contract-module.spec.js --project=chrome
```

Headed mode:

```bash
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js --project=chrome
```

Single smoke case example:

```bash
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js --project=chrome --grep "TC-CONTRACT-010"
```

Single E2E case example:

```bash
HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js --project=chrome --grep "TC-CONTRACT-E2E-012"
```
