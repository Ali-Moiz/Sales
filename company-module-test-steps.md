# Company Module Review

Reviewed files:
- `tests/e2e/company-module.spec.js`
- `pages/company-module.js`

## Company cases ko kaise execute karein

Requirements:
- `npm install`
- `data/credentials.js` mein valid `baseUrl`, `email`, aur `password`

Commands:
- Run complete company suite: `npm run test:company`
- Run company suite in headed mode: `npm run test:company:headed`
- Run a single case: `npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-00X"`
- Show report: `npm run report`

Latest verified result:
- `npm run test:company`
- Result: `15 passed`

## Overall flow

Company suite `serial` mode mein single session ke saath run hoti hai:
1. `beforeAll` browser context aur page create karta hai.
2. `performLogin(page)` sirf ek dafa execute hota hai.
3. `CompanyModule` page object initialize hota hai.
4. `targetCompanyName = "A-C 6548"` ko detail and edit scenarios mein reuse kiya jata hai.
5. Existing 4 legacy cases ke baad 11 smoke cases same logged-in flow mein run hote hain.

## Current coverage

### Legacy cases

#### TC-COMP-001 | Companies module opens successfully
Steps:
1. Companies module open hoti hai.
2. URL aur `Create Company` button verify hota hai.

Expected:
- User Companies list page par successfully land kare.

#### TC-COMP-002 | User can search and open an existing company successfully
Steps:
1. Companies page open hoti hai.
2. `Search by Company` mein `A-C 6548` search hota hai.
3. Matching company row open ki jati hai.

Expected:
- Target company detail page open ho.

#### TC-COMP-003 | Activities tab shows company creation activity for the searched company
Steps:
1. Opened company detail par `Activities` tab kholi jati hai.
2. Company creation activity text verify hota hai.

Expected:
- Activity stream mein HubSpot creation activity visible ho.

#### TC-COMP-004 | User can edit the searched company and verify updated values in About this Company
Steps:
1. `Edit` drawer open hota hai.
2. Runtime-generated values `Sub Market Vertical`, `NAICS Codes`, `No. of Employees`, `Revenue`, `No Of Properties`, aur `Year Founded` mein overwrite ki jati hain.
3. `Update Company` submit hota hai.
4. `About this Company` section mein updated values verify hoti hain.

Expected:
- Company update save ho aur displayed values newly entered values se match karein.

### Smoke cases

#### TC-COMP-005 | Companies table displays all expected column headers
Expected columns:
- `Company Name`
- `Parent Company`
- `Company Owner`
- `Market Vertical`
- `Sub Market Vertical`
- `Revenue`
- `Created Date`
- `Last Modified Date`

#### TC-COMP-006 | Create Company modal opens with all required fields visible
Expected:
- `Create a New Company` heading visible ho.
- `Add Company Name`, `Select Industry`, aur `Type Address` fields visible hon.
- `Cancel` button visible ho.

#### TC-COMP-007 | Create Company submit button is disabled without required fields
Expected:
- Empty modal state mein `Create Company` submit button disabled ho.

#### TC-COMP-008 | Cancel on Create Company modal closes it without creating a record
Expected:
- User temporary text type kare aur `Cancel` press kare to modal close ho jaye.

#### TC-COMP-009 | Searching with a non-existent company name returns no results
Expected:
- Random unmatched search ke baad result set empty state / no visible match show kare.

#### TC-COMP-010 | Market Vertical filter dropdown shows all correct options
Expected options:
- `Commercial`
- `Distribution`
- `Industrial`
- `Manufacturing`
- `Residential`

#### TC-COMP-011 | Company detail page shows all sidebar sections
Expected sections:
- `About this Company`
- `Properties`
- `Deals`
- `Contacts`
- `Attachments`

#### TC-COMP-012 | Notes tab is visible and Create New Note drawer opens with correct fields
Expected:
- `Notes` tab visible ho.
- `Create New Note` button visible ho.
- Drawer mein `Add Notes`, subject input, `rdw-editor`, char counter, `Save`, aur `Cancel` visible hon.

#### TC-COMP-013 | Tasks tab shows correct columns, New Task button, and empty state
Expected:
- Tasks table columns visible hon: `Task Title`, `Task Description`, `Created By`, `Due Date`, `Priority`, `Type`
- `New Task` button visible ho.
- Empty state `No tasks Added.` visible ho.

#### TC-COMP-014 | Create New Task drawer opens with all required fields
Expected:
- `Create New Task` drawer open ho.
- `Task Title`, `rdw-editor`, `Select Type`, `Select Priority`, `Save`, aur `Cancel` visible hon.

#### TC-COMP-015 | Edit Company form opens with pre-filled data and Update button is disabled without changes
Expected:
- `Edit Company` drawer open ho.
- Existing values pre-filled hon.
- Kisi change ke baghair `Update Company` disabled ho.

## Page object notes

Important helpers in `pages/company-module.js`:
- `gotoCompaniesFromMenu()` Companies page open karti hai.
- `openCompanyDetail(companyName)` search karke target company detail open karti hai.
- `updateCompanyDetails(companyData)` edit drawer open, overwrite, aur submit flow run karti hai.
- `assertAboutCompanyDetails(companyData)` saved values ko About section mein verify karti hai.
- `openCreateCompanyModal()`, `assertCreateCompanyModalOpen()`, `assertCreateCompanySubmitDisabled()`, `cancelCreateCompanyModal()` create modal smoke coverage handle karte hain.
- `gotoNotesTab()` / `openCreateNoteDrawer()` notes flow verify karte hain.
- `gotoTasksTab()` / `openCreateTaskDrawer()` tasks flow verify karte hain.

## Stability notes

Observed stable behavior:
- Full company suite 2026-03-26 ko successful run hui.
- Edit Company numeric fields ko overwrite karne ke liye direct clear + type + blur strategy reliable rahi.
- Update submit ke baad UI return-state par poll karna strict modal-hidden check se zyada stable raha.

Known fragile areas:
- `Select Industry` dropdown custom component hai; DOM changes par locator updates ki zarurat par sakti hai.
- Address field Google suggestion based hai; suggestion text ya provider behavior change ho to locator refresh karna padega.
