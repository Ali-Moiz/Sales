# Signal CRM — Edit Functionality: Smoke Test Cases (All Modules)

**Application:** Signal CRM
**Base URL:** `https://proud-desert-02abf6a10.1.azurestaticapps.net/`
**Credentials:** `moiz.qureshi+ho@camp1.tkxel.com` / `Admin@123`
**Modules Covered:** Company · Property · Deal · Contract · Contact
**Test Type:** Smoke Testing — Edit Coverage
**Automation:** Playwright JavaScript + Page Object Model (POM)

---

## Summary Table

| Module | Test Cases | Spec File | Page Object |
|--------|-----------|-----------|-------------|
| Company | TC-COMP-004, TC-COMP-015, TC-COMP-016 | `tests/e2e/company-module.spec.js` | `pages/company-module.js` |
| Property | TC-PROP-012, TC-PROP-013, TC-PROP-019 | `tests/e2e/property-module.spec.js` | `pages/property-module.js` |
| Deal | TC-DEAL-018, TC-DEAL-019, TC-DEAL-020 | `tests/e2e/deal-module.spec.js` | `pages/deal-module.js` |
| Contract | TC-CONTRACT-EDIT-001 to 004 | `tests/e2e/contract-module.spec.js` | `pages/contract-module.js` |
| Contact | TC-CN-012, TC-CN-013, TC-CN-014, TC-CN-015 | `tests/e2e/contact-module.spec.js` | `pages/contact-module.js` |

---

## Module 1 — Company

### TC-COMP-004 | User can edit an existing company and verify updated values

| Field | Details |
|-------|---------|
| **Priority** | P0 — Critical |
| **Preconditions** | User is logged in; company `A-C 6548` exists in the system |
| **Steps** | 1. Navigate to Companies module<br>2. Search for and open `A-C 6548`<br>3. Click the `Edit` button on the detail header<br>4. Fill Sub Market Vertical, NAICS Codes, Employee Count, Revenue, No Of Properties, Year Founded with random valid values<br>5. Click `Update Company` |
| **Test Data** | Dynamically generated (random 4-digit Sub Market Vertical, NAICS, Employee, Revenue, Properties; year 1950–2025) |
| **Expected Result** | Edit drawer closes; `About this Company` section reflects all updated values |
| **Automation** | `companyModule.updateCompanyDetails(updatedCompanyDetails)` + `assertAboutCompanyDetails()` |

---

### TC-COMP-015 | Edit Company form opens pre-filled; Update button disabled without changes

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | User is on company detail page for `A-C 6548` |
| **Steps** | 1. Click the `Edit` button on the detail header<br>2. Observe the form fields and the Update Company button<br>3. Click Cancel without making any changes |
| **Test Data** | N/A |
| **Expected Result** | `Edit Company` drawer (heading level=4) opens with all fields visible (Sub Market Vertical, NAICS Codes, Revenue, Year Founded); `Update Company` button is **disabled** until a change is made; Cancel closes the drawer |
| **Automation** | `openEditCompanyForm()` → `assertEditCompanyFormOpen()` → `assertUpdateButtonDisabled()` → `cancelEditCompanyForm()` → `assertEditCompanyFormClosed()` |

---

### TC-COMP-016 | Cancel on Edit Company discards changes *(additional coverage)*

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | User is on company detail page |
| **Steps** | 1. Click Edit<br>2. Change Sub Market Vertical to a temporary value<br>3. Click Cancel |
| **Test Data** | `subMarketVertical: 'SHOULD_NOT_SAVE'` |
| **Expected Result** | Edit drawer closes; `About this Company` section does **not** show the temporary value |
| **Automation** | Manual: open form → fill → cancel → assert original value still visible |

---

## Module 2 — Property

### TC-PROP-012 | Edit Property form opens pre-filled; Save disabled without changes

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | User is on property detail page for the property created in TC-PROP-007 |
| **Steps** | 1. Click the `Edit` button on the property detail header<br>2. Observe the form and Save button state<br>3. Click Cancel without making any changes |
| **Test Data** | N/A |
| **Expected Result** | `Edit Property` drawer (heading level=3) opens; Property Name field is pre-filled with current name; `Save` button is **disabled** until a change is made; Cancel closes the drawer |
| **Automation** | `openEditPropertyForm()` → `assertEditPropertyFormOpen()` → `assertSaveEditButtonDisabled()` → `cancelEditPropertyForm()` → `assertEditPropertyFormClosed()` |

---

### TC-PROP-013 | User can edit property name and verify on detail page

| Field | Details |
|-------|---------|
| **Priority** | P0 — Critical |
| **Preconditions** | User is on property detail page for the created property |
| **Steps** | 1. Click Edit<br>2. Clear the Property Name field and fill with a unique edited name<br>3. Click Save |
| **Test Data** | `updatedPropertyName = propertyModule.generateUniqueEditedName()` |
| **Expected Result** | Edit drawer closes; property detail page heading (level=1) shows the new name |
| **Automation** | `openEditPropertyForm()` → `fillEditPropertyName(updatedPropertyName)` → `submitEditProperty()` → `assertPropertyDetailOpened(updatedPropertyName)` |

---

### TC-PROP-019 | Cancel Edit Property closes drawer without saving *(additional coverage)*

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | User is on property detail page |
| **Steps** | 1. Click Edit<br>2. Change the property name to a temporary value<br>3. Click Cancel |
| **Test Data** | `'CANCELLED EDIT — SHOULD NOT SAVE'` |
| **Expected Result** | Edit drawer closes; property heading still shows the original name |
| **Automation** | `openEditPropertyForm()` → `fillEditPropertyName()` → `cancelEditPropertyForm()` → assert original name visible |

---

## Module 3 — Deal

### TC-DEAL-018 | Edit Deal form opens pre-filled; Save disabled without changes

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | User is logged in; deal created in TC-DEAL-002 exists; user is on deal detail page |
| **Steps** | 1. Navigate to Deals list<br>2. Search for and open the created deal<br>3. Click the `Edit` button on the deal detail header<br>4. Observe the Deal Name field and Save/Update button |
| **Test Data** | `createdDealName` (from TC-DEAL-002) |
| **Expected Result** | `Edit Deal` drawer (heading level=3) opens; `Deal Name` field is pre-filled with current deal name; Save/Update button is **disabled** until a change is made; Cancel button is visible |
| **Automation** | `openEditDealForm()` → `assertEditDealFormOpen()` → `assertSaveDealBtnDisabled()` → assert pre-filled value → `cancelEditDealForm()` → `assertEditDealFormClosed()` |

---

### TC-DEAL-019 | Cancel Edit Deal closes drawer without saving changes

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | User is on deal detail page |
| **Steps** | 1. Click Edit<br>2. Clear Deal Name and type a temporary unsaveable name<br>3. Click Cancel |
| **Test Data** | `'SHOULD NOT SAVE 9999'` |
| **Expected Result** | Edit drawer closes; deal detail page heading still shows the **original** deal name (not the temporary one) |
| **Automation** | `openEditDealForm()` → fill temporary name → `cancelEditDealForm()` → assert original heading visible; assert temp name not visible |

---

### TC-DEAL-020 | User can edit deal name and verify updated name on detail page

| Field | Details |
|-------|---------|
| **Priority** | P0 — Critical |
| **Preconditions** | Deal from TC-DEAL-002 exists; user is on deal detail page |
| **Steps** | 1. Click Edit on deal detail header<br>2. Clear Deal Name and fill with a unique edited name<br>3. Click Save/Update |
| **Test Data** | `editedDealName = dealModule.generateUniqueEditedDealName()` → `'A-D Edited XXXX'` |
| **Expected Result** | Edit drawer closes; deal detail heading reflects the new edited name |
| **Automation** | `editDealName(editedDealName)` → `assertEditDealFormClosed()` → assert heading shows new name |

---

## Module 4 — Contract

> **Note:** In Signal CRM the Contract module lives inside the Deal Detail page under the `Contract & Terms` tab. "Editing a contract" means clicking the **Edit** action button on the proposal card, which re-opens the six-step contract stepper.

### TC-CONTRACT-EDIT-001 | Edit action button is visible on the proposal card

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | A proposal has been created and the stepper completed; user is on the deal detail page with Contract & Terms tab active |
| **Steps** | 1. Open the target deal detail<br>2. Click `Contract & Terms` tab<br>3. Observe the proposal card action buttons |
| **Test Data** | `resolvedContractDealName` (auto-resolved deal from contract test setup) |
| **Expected Result** | `Signature`, **Edit**, `Clone`, `Preview PDF` action buttons are all visible on the proposal card |
| **Automation** | `expect(cm.signatureBtnOnCard).toBeVisible()` → `expect(cm.editProposalAction).toBeVisible()` |

---

### TC-CONTRACT-EDIT-002 | Clicking Edit on proposal card opens the contract stepper

| Field | Details |
|-------|---------|
| **Priority** | P0 — Critical |
| **Preconditions** | Proposal card is visible with the Edit action button |
| **Steps** | 1. Click the Edit action button on the proposal card |
| **Test Data** | N/A |
| **Expected Result** | URL changes to `/contract/:id` pattern; `Update Proposal` button is visible on the stepper page (Step 1) |
| **Automation** | `cm.openExistingProposalEditor()` → `expect(page).toHaveURL(/\/contract\/\d+/)` → `expect(cm.updateProposalBtn).toBeVisible()` |

---

### TC-CONTRACT-EDIT-003 | Proposal name is pre-filled in the Edit stepper

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | Contract stepper is open in Edit mode (URL: `/contract/:id`) |
| **Steps** | 1. Click Edit on the proposal card to open the stepper<br>2. Observe the `Add Proposal Name` textbox on Step 1 |
| **Test Data** | N/A |
| **Expected Result** | `Add Proposal Name` textbox is visible and contains a **non-empty** pre-filled value matching the original proposal/deal name |
| **Automation** | `expect(cm.proposalNameInput).toBeVisible()` → `cm.proposalNameInput.inputValue()` → `expect(prefilledName.trim().length).toBeGreaterThan(0)` |

---

### TC-CONTRACT-EDIT-004 | Navigating away from Edit stepper returns to Deals list safely

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | Contract stepper is open in Edit mode |
| **Steps** | 1. Click Edit on the proposal card<br>2. Do NOT submit any changes<br>3. Navigate to the Deals list via the sidebar link |
| **Test Data** | N/A |
| **Expected Result** | URL returns to `/app/sales/deals`; no unintended changes are applied to the proposal |
| **Automation** | `cm.openExistingProposalEditor()` → `cm.gotoDealsPage()` → `expect(page).toHaveURL(/\/app\/sales\/deals/)` |

---

## Module 5 — Contact

### TC-CN-012 | Edit Contact drawer opens with correct state

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | Contact created in TC-CN-005 exists; user is on contact detail page |
| **Steps** | 1. Search for the created contact in the list<br>2. Click the contact name to open detail page<br>3. Click the `Edit` button |
| **Test Data** | `createdContactFullName` (from TC-CN-005) |
| **Expected Result** | `Edit Contact` drawer (heading level=3) opens; Email field is **disabled** (email cannot be changed after creation); First Name and Last Name fields are **enabled** |
| **Automation** | `openEditDrawer()` → `expect(editDrawerHeading).toBeVisible()` → `expect(emailField).toBeDisabled()` → `expect(firstNameField).toBeEnabled()` |

---

### TC-CN-013 | Save Contact button disabled with no changes

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | Edit Contact drawer is open; no changes have been made |
| **Steps** | 1. Open contact detail<br>2. Click Edit<br>3. Do NOT change any field<br>4. Observe the Save Contact button |
| **Test Data** | N/A |
| **Expected Result** | `Save Contact` button is **disabled** until at least one field is modified |
| **Automation** | `openEditDrawer()` → `assertSaveContactDisabled()` |

---

### TC-CN-014 | Edit Contact updates Job Title successfully

| Field | Details |
|-------|---------|
| **Priority** | P0 — Critical |
| **Preconditions** | User is on contact detail page; Edit Contact drawer is open |
| **Steps** | 1. Open Edit Contact drawer<br>2. Fill Job Title with `'Updated QA Title'`<br>3. Fill Phone: `'1234567890'`, Cell Phone: `'1234567891'`<br>4. Click Save Contact |
| **Test Data** | `{ jobTitle: 'Updated QA Title', phone: '1234567890', cellPhone: '1234567891' }` |
| **Expected Result** | Save Contact button becomes enabled; Edit drawer closes after submission |
| **Automation** | `fillEditForm({ jobTitle, phone, cellPhone })` → `expect(saveContactBtn).toBeEnabled()` → `submitEditForm()` → `expect(editDrawerHeading).not.toBeVisible()` |

---

### TC-CN-015 | Cancel Edit Contact closes drawer without saving

| Field | Details |
|-------|---------|
| **Priority** | P1 — High |
| **Preconditions** | Edit Contact drawer is open |
| **Steps** | 1. Click Edit on contact detail<br>2. Clear First Name and type `'SHOULD_NOT_SAVE'`<br>3. Click Cancel |
| **Test Data** | `firstName: 'SHOULD_NOT_SAVE'` |
| **Expected Result** | Edit drawer closes; contact detail page still shows the **original** full name (not the unsaved value) |
| **Automation** | `openEditDrawer()` → `firstNameField.fill('SHOULD_NOT_SAVE')` → `cancelEditForm()` → `expect(editDrawerHeading).not.toBeVisible()` → assert original heading visible |

---

## Run Commands

```bash
# Run all edit tests across all 5 modules
npx playwright test --grep "TC-COMP-004|TC-COMP-015|TC-PROP-012|TC-PROP-013|TC-DEAL-018|TC-DEAL-019|TC-DEAL-020|TC-CONTRACT-EDIT|TC-CN-012|TC-CN-013|TC-CN-014|TC-CN-015" --project=chrome

# Run edit tests for a single module
npx playwright test tests/e2e/deal-module.spec.js --project=chrome --grep "TC-DEAL-018|TC-DEAL-019|TC-DEAL-020"
npx playwright test tests/e2e/contract-module.spec.js --project=chrome --grep "TC-CONTRACT-EDIT"
npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-004|TC-COMP-015"
npx playwright test tests/e2e/property-module.spec.js --project=chrome --grep "TC-PROP-012|TC-PROP-013"
npx playwright test tests/e2e/contact-module.spec.js --project=chrome --grep "TC-CN-012|TC-CN-013|TC-CN-014|TC-CN-015"

# Full suites (includes all create + edit + other smoke tests)
npm run test:company
npm run test:deal
npm run test:contract

# View HTML report
npm run report
```

---

## Locator Strategy Reference

| Locator Type | Example | Used For |
|---|---|---|
| `getByRole('button', { name: 'Edit' })` | `editDealButton`, `editBtn` (Contact) | Edit CTA on detail pages |
| `getByRole('heading', { name: 'Edit X', level: 3 })` | `editDealHeading`, `editDrawerHeading` | Confirm edit drawer is open |
| `getByRole('textbox', { name: /Deal Name/ })` | `editDealNameInput` | Pre-filled name field in edit form |
| `getByRole('button', { name: 'Update Deal' })` | `saveDealEditBtn` | Submit button (deal) |
| `getByRole('button', { name: 'Update Company' })` | `updateCompanyButton` | Submit button (company) |
| `getByRole('button', { name: 'Save Contact' })` | `saveContactBtn` | Submit button (contact) |
| `getByRole('button', { name: 'Save' }).last()` | Edit fallback for property | Save button (property/deal fallback) |
| `getByRole('button', { name: 'Cancel' })` | `cancelDealEditBtn`, `cancelBtn` | Close edit drawer without saving |
| `.locator('xpath=following-sibling::*[1]')` | `editProposalAction` | Edit action on contract proposal card |

---

*Last updated: 2026-03-27 | Automation by: Playwright JS + POM | Framework: SignalSalesAutomation*
