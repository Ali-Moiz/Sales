# Company Module Review

Reviewed files:
- `tests/e2e/company-module.spec.js`
- `pages/company-module.js`

## Company cases ko kaise execute karein

Requirements:
- `npm install`
- `data/credentials.js` mein valid `baseUrl`, `email`, aur `password`

Commands:
- Run company suite: `npm run test:company`
- Run company suite in headed mode: `npm run test:company:headed`
- Run only page-open case: `npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-001"`
- Run only search-company case: `npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-002"`
- Run only activities case: `npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-003"`
- Run only edit-company case: `npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-004"`
- Show report: `npm run report`

## Overall flow

Company suite shared login helper aur single session use karti hai:
1. `beforeAll` mein browser context aur page banti hai.
2. `performLogin(page)` sirf ek baar run hota hai.
3. `CompanyModule` initialize hota hai.
4. `TC-COMP-001` Companies module open karti hai.
5. `TC-COMP-002` fixed company `A-C 6548` ko search karke detail page open karti hai.
6. `TC-COMP-003` aur `TC-COMP-004` isi same company context par execute hoti hain; new company create nahi hoti.

## Page object review

`pages/company-module.js` ye locators aur helper methods provide karta hai:
- `companiesMenuLink`: left-side `Companies` menu link
- `createCompanyButton`: create company buttons
- `createCompanyHeading`: modal heading
- `companyNameInput`: `Add Company Name` textbox
- `industryOption`: `Manufacturing` option
- `addressInput`: `Type Address` field
- `addressOption`: selected address suggestion
- `companySearchInput`: companies list search field
- `activitiesTab`: company detail activities tab
- `successToast`: `Company Created Successfully` toast

Main methods:
- `gotoCompaniesFromMenu()`: Companies page open karti hai
- `assertCompaniesPageOpened()`: URL aur Create Company button verify karti hai
- `openCreateCompanyModal()`: modal kholti hai
- `fillCompanyName(companyName)`: company name fill karti hai
- `selectIndustry()`: market vertical select karti hai
- `fillAddress(address)`: address type aur suggestion select karti hai
- `submitCreateCompany()`: modal ka create button click karti hai
- `createCompany(...)`: full create-company flow run karti hai
- `assertCompanyCreated()`: success condition verify karti hai
- `openCompanyDetail(companyName)`: created company detail open karti hai
- `assertCompanyDetailOpened(companyName)`: selected company detail page verify karti hai
- `gotoActivitiesTab()`: Activities tab open karti hai
- `assertCompanyCreationActivity(companyName)`: company creation activity verify karti hai
- `generateRandomCompanyEditData()`: edit fields ke liye random numeric values banati hai
- `updateCompanyDetails(companyData)`: company edit form fill aur submit karti hai
- `openAboutCompanySection()`: about-company panel open karti hai
- `assertAboutCompanyDetails(companyData)`: updated values verify karti hai

## Test cases

### TC-COMP-001 | Companies module opens successfully
Steps:
1. `performLogin(page)` se login hota hai.
2. `companyModule.gotoCompaniesFromMenu()` call hota hai.
3. Companies URL verify hoti hai.
4. `Create Company` button visible assert hota hai.

Expected:
- User successfully Companies module par land kare.
- Companies page ke core controls visible hon.

### TC-COMP-002 | User can search and open an existing company successfully
Steps:
1. Companies page open hoti hai.
2. `Search by Company` field mein `A-C 6548` fill hota hai.
3. Matching company row click karke detail page open hoti hai.
4. Company heading `A-C 6548` visible assert hoti hai.

Expected:
- Existing company successfully search ho aur detail page open ho.
- Baki company cases isi company ke against execute ho saken.

### TC-COMP-003 | Activities tab shows company creation activity for the searched company
Steps:
1. `TC-COMP-002` se opened company detail context reuse hota hai.
2. `Activities` tab open hoti hai.
3. Activity stream mein `Company created by HubSpot ... A-C 6548 company` pattern match assert hota hai.

Expected:
- Searched company ke against creation activity visible ho.
- Agar koi activity visible na ho to test fail ho.

### TC-COMP-004 | User can edit the searched company and verify updated values in About this Company
Steps:
1. `TC-COMP-002` se opened company detail context reuse hota hai.
3. Random numeric values generate hoti hain for:
   - `Sub Market Vertical`
   - `NAICS Codes`
   - `No. of Employees`
   - `Revenue`
   - `No Of Properties`
   - `Year Founded`
4. `Edit` button click hota hai.
5. Saari fields random values ke saath update hoti hain.
6. `Update Company` button click hota hai.
7. `About this Company` section open hoti hai.
8. About section mein har updated field same runtime value ke against verify hoti hai.

Expected:
- New company create kiye baghair wahi searched company update ho.
- About section mein sari updated values exact runtime values se match karen.
- Agar koi bhi value mismatch kare ya visible na ho to test fail ho.

## Stored runtime data

`tests/e2e/company-module.spec.js` mein:
- fixed target company `A-C 6548` use hoti hai
- whole module isi searched company ke against execute hota hai
- edit case ke liye random updated values runtime object mein store hoti hain aur verification unhi values ke against hoti hai

## Review notes

Observed behavior:
- Whole company module suite single login session mein chalti hai.
- Page-open aur search-company cases same session mein stable chalti hain.
- Edit-company case random numeric values use karti hai aur revenue assertion `$` formatting handle karti hai.

Risks / fragile points:
- Industry dropdown ka DOM brittle hai; current implementation fallback click/injection use karti hai.
- Success state ab strict toast visibility par depend karti hai.
- Address suggestion exact visible text par depend karti hai. Agar suggestion wording change hui to locator update karna padega.
