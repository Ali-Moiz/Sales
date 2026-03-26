# Company Module Test Case Steps

Source mapping is based only on:
- `tests/e2e/company-module.spec.js`
- `pages/company-module.js`

## Common execution flow

### `beforeAll`
1. Test timeout `300000` set hota hai.
2. Browser context create hota hai.
3. New page open hota hai.
4. `companyModule = new CompanyModule(page)` initialize hota hai.
5. `companyModule.login()` call hota hai.
6. `login()` sirf `ContactModule.login()` ko delegate karta hai.
7. `page.waitForLoadState('networkidle')` hota hai.
8. Agar URL `/app/settings/profile` ho:
   - `Last Name` textbox locate hota hai.
   - Agar visible aur empty ho to `User` fill hota hai.
   - `Save` button visible ho to click hota hai.
   - `2s` wait hota hai.
9. `companyModule.goToCompaniesFromMenu()` call hota hai:
   - Companies menu selectors wait hote hain.
   - Candidate locators try hote hain:
     - `a[href="/app/sales/companies"]`
     - `li[aria-label="Companies"]`
     - role link `Companies`
     - exact text `Companies`
   - Har candidate ke saath `waitForURL(/\/app\/sales\/companies/)` + forced click parallel attempt hota hai.
   - Success par `networkidle` wait hota hai.
   - Fail par error throw hota hai.
10. `Create Company` button visible hone ka wait hota hai.
11. Agar button visible na ho:
   - `companyModule.login()` dobara call hota hai.
   - `networkidle` wait hota hai.
   - `goToCompaniesFromMenu()` dubara call hota hai.
   - `Create Company` button dobara wait hota hai.
12. Agar phir bhi button na mile to error throw hota hai.
13. `resolveCompanyContextFromList(page, companyModule)` call hota hai:
   - Companies page open hoti hai.
   - First row first-cell selector wait hota hai.
   - First row visible assert hota hai.
   - Current URL store hoti hai.
   - `tryOpenDetail()` run hota hai:
     - Browser context me table ke first-column cells nikale jaate hain.
     - Preferred index `2` try hota hai.
     - React `__reactProps` click handler milay to direct invoke hota hai.
     - Warna DOM click hota hai.
     - Fallback me row cell click force se hota hai.
     - `3s` wait hota hai.
   - Agar URL change na ho to `tryOpenDetail()` dubara run hota hai.
   - URL se `/company/:id` regex ke through `companyId` extract hota hai.
14. Agar `companyId` resolve na ho ya detail page open na ho to error throw hota hai.
15. `companyName` pehle blank rehta hai, phir detail page headings (`h1-h6`) se find hota hai.
16. Generic headings (`edit`, `create`, `about this company`, `contacts`, `deals`, `properties`, `activities`, `notes`, `tasks`, `attachments`, `market`, `vertical`, `revenue`, `partnership`, `domain`) ignore ki jaati hain.
17. Agar company name na mile to error throw hota hai.

### `beforeEach`
1. `companyModule.goToDashboardFromMenu()` call hota hai:
   - Dashboard menu selectors wait hote hain.
   - Candidate locators try hote hain:
     - `a[href="/app/sales/dashboard"]`
     - `li[aria-label="Dashboard"]`
     - role link `Dashboard`
     - exact text `Dashboard`
   - Har visible candidate ke saath `waitForURL(/\/app\/sales\/dashboard/)` + forced click run hota hai.
   - Agar success na ho to browser evaluate se dashboard anchor click hota hai.
   - Agar phir bhi success na ho to error throw hota hai.
   - `networkidle` wait hota hai.

### `afterAll`
1. Browser context close hota hai.

## Test case wise steps

### `TC-COM-001: Companies list page loads successfully`
1. `goToCompaniesFromMenu()` run hota hai.
2. URL `/app/sales/companies` pattern ke against assert hoti hai.

### `TC-COM-002: Stats section shows total companies count`
1. `goToCompaniesFromMenu()` run hota hai.
2. `h1, h6, canvas` me se kisi selector ka wait hota hai.
3. First `h1/h6` locator liya jata hai.
4. Uski visibility assert hoti hai.

### `TC-COM-003: Companies by Contracts chart is visible`
1. `goToCompaniesFromMenu()` run hota hai.
2. First chart locator (`canvas` ya chart class) pick hota hai.
3. Visibility assert hoti hai.

### `TC-COM-004: Companies by Market Verticals chart is visible`
1. `goToCompaniesFromMenu()` run hota hai.
2. Charts locator collection banti hai.
3. First chart visible assert hota hai.

### `TC-COM-005: Table has correct column headers`
1. `goToCompaniesFromMenu()` run hota hai.
2. `table thead` locate hota hai.
3. Header visible assert hota hai.
4. Sare `th` texts read hote hain.
5. Joined lowercase header text me `/company|name/` match assert hota hai.

### `TC-COM-006: Table shows rows and pagination indicator`
1. `goToCompaniesFromMenu()` run hota hai.
2. First table row visible assert hoti hai.
3. Pagination locator aur pagination text locator read hote hain.
4. In me se koi visible ho to `hasPagination` true hota hai.
5. Truthy expect hota hai.

### `TC-COM-007: Search by Company Name field is present and accepts input`
1. `goToCompaniesFromMenu()` run hota hai.
2. Search textbox role ya `#outlined-search` locate hota hai.
3. Visibility assert hoti hai.
4. `Test` fill hota hai.
5. Input value read hoti hai.
6. `Test` ke equal assert hota hai.
7. Field clear hoti hai.

### `TC-COM-008: Search by Company Name filters table results`
1. `goToCompaniesFromMenu()` run hota hai.
2. `waitForFunction` se ensure hota hai ke table cells aayein aur kisi me meaningful text ho.
3. `500ms` wait hota hai.
4. Header texts read hote hain.
5. Company/name column index find hota hai, warna `0`.
6. First row ke cells read hote hain.
7. Search term name column ya koi non-empty cell se pick hota hai.
8. Agar search term blank ho to test skip hota hai.
9. Search field locate hota hai.
10. Search term fill hota hai.
11. `Enter` press hota hai.
12. `networkidle` wait hota hai.
13. `2.5s` extra wait hota hai.
14. Row count read hota hai.
15. `rowCount > 0` assert hota hai.
16. Search field clear hoti hai.

### `TC-COM-009: Market Vertical filter dropdown is present`
1. `goToCompaniesFromMenu()` run hota hai.
2. `Create Company` button ka wait hota hai taake filters render ho jayein.
3. Market Vertical button aur text locator read hote hain.
4. In me se koi visible ho to truthy expect hota hai.

### `TC-COM-010: More Filters button opens filter panel`
1. `goToCompaniesFromMenu()` run hota hai.
2. `More Filter` button visible assert hota hai.
3. Button click hota hai.
4. `1s` wait hota hai.
5. Filter content text (`state|city|apply|clear`) check hota hai.
6. Ya fallback me `More Filter` button visible rehna accept hota hai.
7. `Escape` press hota hai.

### `TC-COM-011: More Filters panel contains States and Cities filters`
1. `goToCompaniesFromMenu()` run hota hai.
2. `More Filter` button visible assert hota hai.
3. Button click hota hai.
4. `1s` wait hota hai.
5. `state` aur `city` text locators check hote hain.
6. In me se koi ya fallback button visibility truthy expect hoti hai.
7. `Escape` press hota hai.

### `TC-COM-012: More Filters panel has Apply and Clear All buttons`
1. `goToCompaniesFromMenu()` run hota hai.
2. `More Filter` button visible assert hota hai.
3. Button click hota hai.
4. `1s` wait hota hai.
5. `Apply` aur `Clear` buttons locate hote hain.
6. In me se koi ya fallback button visibility truthy expect hoti hai.
7. `Escape` press hota hai.

### `TC-COM-013: Cancel in More Filters panel closes it`
1. `goToCompaniesFromMenu()` run hota hai.
2. `More Filter` button visible assert hota hai.
3. Button click hota hai.
4. `500ms` wait hota hai.
5. Agar `Cancel` button visible ho to click hota hai.
6. Warna `Escape` press hota hai.
7. `500ms` wait hota hai.
8. `More Filter` button dubara visible assert hota hai.

### `TC-COM-014: Export button is visible on companies list page`
1. `goToCompaniesFromMenu()` run hota hai.
2. `Export` button locate hota hai.
3. Visibility truthy expect hoti hai.

### `TC-COM-015: Change Review History button is visible on companies list page`
1. `goToCompaniesFromMenu()` run hota hai.
2. `Review History` ya `Change History` button locate hota hai.
3. Visibility truthy expect hoti hai.

### `TC-COM-016: Create Company button opens modal`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` call hota hai:
   - `Create Company` button click hota hai.
   - `Create a New Company` heading wait hoti hai.
3. `Escape` press hota hai.

### `TC-COM-017: Create Company modal contains required fields`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. `#companyName` locate hota hai.
4. Name field visible assert hota hai.
5. `Escape` press hota hai.

### `TC-COM-018: Create Company modal contains optional fields`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. Domain field locator read hota hai.
4. Uski visibility check hoti hai.
5. `hasOptional || true` truthy expect hota hai, yani modal open hona enough hai.
6. `Escape` press hota hai.

### `TC-COM-019: Create Company - Cancel button closes modal`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. `Cancel` button locate hota hai.
4. Visible ho to click hota hai, warna `Escape`.
5. `Create a New Company` heading invisible assert hoti hai.

### `TC-COM-020: Create Company - Escape key closes modal`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. `Escape` press hota hai.
4. Modal heading invisible assert hoti hai.

### `TC-COM-021: Create Company button is disabled when Company Name is empty`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. Modal ka last `Create Company` button locate hota hai.
4. Disabled assert hota hai.
5. `Escape` press hota hai.

### `TC-COM-022: Create Company - Company Name field accepts alphanumeric input`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. `#companyName` me `TestCo 123` fill hota hai.
4. Same value assert hoti hai.
5. `Escape` press hota hai.

### `TC-COM-023: Create Company - Address field is present and accepts input`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. Address field (`#googleAddress` ya textbox) locate hota hai.
4. Visible assert hota hai.
5. `Omaha` fill hota hai.
6. Input value read hoti hai.
7. `/omaha/i` match assert hota hai.
8. `Escape` press hota hai.

### `TC-COM-024: Successfully creates company with all required fields`
1. `goToCompaniesFromMenu()` run hota hai.
2. Dynamic company name aur street number generate hota hai.
3. `companyModule.createCompany()` call hota hai:
   - `openCreateCompanyModal()` run hota hai.
   - `#companyName` fill hota hai.
   - Domain provided nahi, is liye skip hota hai.
   - `selectFirstMarketVertical()` run hota hai:
     - `Select Industry` trigger locate hota hai.
     - Visible na ho to error.
     - Trigger click try hota hai.
     - Fail par browser evaluate se React handler ya DOM click hota hai.
     - Open na ho to error.
     - First market vertical option wait hoti hai.
     - Option text read hota hai.
     - Empty ho to error.
     - First option click hoti hai.
     - `500ms` wait hota hai.
   - `fillAddressField(address)` run hota hai:
     - Address field locate hota hai.
     - Click hota hai.
     - `300ms` wait hota hai.
     - Field clear hoti hai.
     - Address slow type hota hai.
     - First suggestion locate hoti hai.
     - Suggestion visible ho to click hoti hai aur `800ms` wait hota hai.
     - Warna `ArrowDown` + `Enter` hota hai.
     - `800ms` wait hota hai.
     - Suggestions count browser evaluate se check hota hai.
     - Zero ho to error.
   - Submit `Create Company` button locate hota hai.
   - Visible wait hota hai.
   - Enabled check hota hai, warna error.
   - Submit click hota hai.
   - Modal heading hidden wait hoti hai, warna error.
   - `networkidle` wait hota hai.
4. Agar create flow error de to test skip hota hai.
5. Naya company name page par visible assert hota hai.

### `TC-COM-025: Company Domain field accepts valid URL format`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. Domain field locate hota hai.
4. Agar visible ho:
   - `https://example.com` fill hota hai.
   - Input value read hoti hai.
   - `example.com` contain assert hota hai.
5. `Escape` press hota hai.

### `TC-COM-026: Company detail page loads with correct URL pattern`
1. Agar `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` call hota hai:
   - `goToCompaniesFromMenu()` run hota hai.
   - First row first cell wait hota hai.
   - First cell visible check hota hai, warna error.
   - `tryOpen()` run hota hai:
     - Browser evaluate me first-column cells nikale jaate hain.
     - Preferred row index `2` target hota hai.
     - React click handler available ho to invoke hota hai.
     - Warna DOM click hota hai.
     - Catch me fallback locator click hota hai.
     - `3s` wait hota hai.
   - Agar URL me `/company/` na aaye to `tryOpen()` dubara hota hai.
   - `networkidle` wait hota hai.
   - Phir bhi `/company/` na aaye to error.
3. URL `/company/` regex se assert hoti hai.

### `TC-COM-027: Company detail header shows company name`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `companyName` text locate hota hai.
4. Visibility assert hoti hai.

### `TC-COM-028: Company detail header shows Edit button`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Edit` button locate hota hai.
4. Visibility assert hoti hai.

### `TC-COM-029: Company detail header shows Market Vertical`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Market Vertical` text locate hota hai.
4. Visibility assert hoti hai.

### `TC-COM-030: Company detail header shows Created Date`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `created|date` text locate hota hai.
4. Visibility assert hoti hai.

### `TC-COM-031` to `TC-COM-043`
Har test me pehle:
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.

Phir individual assertion:
- `TC-COM-031`: `About this Company` text visible.
- `TC-COM-032`: `Name` label visible.
- `TC-COM-033`: `Address` label visible.
- `TC-COM-034`: `Revenue` label visible.
- `TC-COM-035`: `Strategic Partnership` ya `Partnership Status` visible.
- `TC-COM-036`: `Domain` ya `Website` label visible.
- `TC-COM-037`: `Properties` section visible.
- `TC-COM-038`: `Deals` section visible.
- `TC-COM-039`: `Contacts` section visible.
- `TC-COM-040`: `Attachments` section visible.
- `TC-COM-041`: `Activities` tab visible.
- `TC-COM-042`: `Notes` tab visible.
- `TC-COM-043`: `Tasks` tab visible.

### `TC-COM-044: Activities tab is clickable and content area is visible`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Activities tab locate hota hai.
4. Forced click hota hai.
5. `1s` wait hota hai.
6. Activity content area locator locate hota hai.
7. Visibility assert hoti hai.

### `TC-COM-045: Edit button opens Edit Company modal`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Edit` button click hota hai.
4. `Edit Company` ya `Update Company` heading visible assert hoti hai.
5. `Escape` press hota hai.

### `TC-COM-046: Edit modal shows Company Name pre-filled`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Edit` button click hota hai.
4. Edit heading wait hoti hai.
5. First `#companyName` field ki value read hoti hai.
6. `val.length > 0` assert hota hai.
7. `Escape` press hota hai.

### `TC-COM-047` to `TC-COM-050`
Har test me:
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Edit` button click hota hai.
4. Edit heading wait hoti hai.
5. Specific field locator check hota hai.
6. Visible na ho to test skip hota hai.
7. Visible ho to truthy assert hota hai.
8. `Escape` press hota hai.

Field mapping:
- `TC-COM-047`: Sub Market Vertical
- `TC-COM-048`: NAICS Codes
- `TC-COM-049`: Year Founded
- `TC-COM-050`: No Of Properties / Number Of Locations

### `TC-COM-051: Edit - Cancel button closes modal without saving`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Edit` button click hota hai.
4. Edit heading wait hoti hai.
5. `Cancel` button visible ho to click hota hai.
6. Warna `Escape` press hota hai.
7. Edit heading invisible assert hoti hai.

### `TC-COM-052: Edit - Update Company button saves changes to Sub Market Vertical`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `Edit` button click hota hai.
4. Edit heading wait hoti hai.
5. First `#companyName` field value read hoti hai.
6. Agar original name ho to uske end me ` Updated` fill hota hai.
7. `500ms` wait hota hai.
8. `Update Company` ya `Save` button locate hota hai.
9. Agar visible na ho to `Escape` aur test skip.
10. Visible ho to enabled state check hoti hai.
11. Disabled ho to `Escape` aur test skip.
12. Enabled ho to click hota hai.
13. Edit heading hidden wait hoti hai.
14. Modal close na ho to `Escape` aur test skip.
15. Close successful ho to truthy assert hota hai.

### `TC-COM-053: Tasks tab shows New Task button`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Tasks tab click hota hai.
4. `1s` wait hota hai.
5. `New Task` button visible assert hota hai.

### `TC-COM-054: Tasks tab has Search by Title field`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Tasks tab click hota hai.
4. `1s` wait hota hai.
5. Search field locate hota hai.
6. Visible na ho to skip.
7. Visible ho to truthy assert hota hai.

### `TC-COM-055: Tasks tab has Type and Priority filter dropdowns`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Tasks tab click hota hai.
4. `1s` wait hota hai.
5. `Type` aur `Priority` texts locate hote hain.
6. Dono missing hon to skip.
7. In me se koi visible ho to truthy assert hota hai.

### `TC-COM-056: New Task button opens task creation form`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Tasks tab click hota hai.
4. `1s` wait hota hai.
5. `New Task` click hota hai.
6. `800ms` wait hota hai.
7. Task form/dialog/modal locator visible assert hota hai.
8. `Escape` press hota hai.

### `TC-COM-057: Task form has required fields (title, type, priority, status)`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Tasks tab click hota hai.
4. `1s` wait hota hai.
5. `New Task` click hota hai.
6. `800ms` wait hota hai.
7. Title field locator visible check hota hai.
8. Visible na ho to skip.
9. Visible ho to truthy assert hota hai.
10. `Escape` press hota hai.

### `TC-COM-058: Creating a task successfully adds it to the Tasks list`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Tasks tab click hota hai.
4. `1s` wait hota hai.
5. `New Task` click hota hai.
6. `800ms` wait hota hai.
7. First contenteditable title input locate hota hai.
8. Dynamic task title generate hota hai.
9. Title fill hota hai.
10. Save/Create button click hota hai.
11. `2s` wait hota hai.
12. Naya task text locate hota hai.
13. Visible na ho to skip.
14. Visible ho to truthy assert hota hai.

### `TC-COM-059: Notes tab shows Add Note button`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Notes tab click hota hai.
4. `1s` wait hota hai.
5. `Add Note` button visible assert hota hai.

### `TC-COM-060: Notes tab has Search by Subject field`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Notes tab click hota hai.
4. `1s` wait hota hai.
5. Search field locate hota hai.
6. Visible na ho to skip.
7. Visible ho to truthy assert hota hai.

### `TC-COM-061: Add Note button opens note creation form`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Notes tab click hota hai.
4. `1s` wait hota hai.
5. `Add Note` click hota hai.
6. `800ms` wait hota hai.
7. Note form/dialog/editor locator visible assert hota hai.
8. `Escape` press hota hai.

### `TC-COM-062: Creating a note successfully adds it to the Notes list`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Notes tab click hota hai.
4. `1s` wait hota hai.
5. `Add Note` click hota hai.
6. `800ms` wait hota hai.
7. Note editor locate hota hai.
8. Dynamic note text generate hota hai.
9. Note text fill hota hai.
10. Save/Submit button click hota hai.
11. `2s` wait hota hai.
12. Nayi note text locate hoti hai.
13. Visible na ho to skip.
14. Visible ho to truthy assert hota hai.

### `TC-COM-063: Searching with non-existent company name shows empty state`
1. `goToCompaniesFromMenu()` run hota hai.
2. Search field locate hota hai.
3. Unique invalid text fill hota hai.
4. `Enter` press hota hai.
5. `networkidle` wait hota hai.
6. `2.5s` wait hota hai.
7. No-results text aur rows locator check hote hain.
8. `no result visible` ya `rowCount === 0` assert hota hai.
9. Search field clear hoti hai.

### `TC-COM-064: Create Company modal validates required fields before enabling submit`
1. `goToCompaniesFromMenu()` run hota hai.
2. `openCreateCompanyModal()` run hota hai.
3. Last `Create Company` button locate hota hai.
4. Disabled assert hota hai.
5. `Escape` press hota hai.

### `TC-COM-065: Company detail page shows 404 or redirect for invalid company ID`
1. `goToCompaniesFromMenu()` run hota hai.
2. Search field locate hota hai.
3. Invalid company name fill hota hai.
4. `networkidle` wait hota hai.
5. `2s` wait hota hai.
6. No-results text aur rows count check hote hain.
7. Error state ya zero rows truthy assert hota hai.

### `TC-COM-066: Search field clears when cleared manually`
1. `goToCompaniesFromMenu()` run hota hai.
2. Search field locate hota hai.
3. `Automation` fill hota hai.
4. `1s` wait hota hai.
5. Field clear hoti hai.
6. Input value empty assert hoti hai.

### `TC-COM-067: Companies list page handles pagination correctly`
1. `goToCompaniesFromMenu()` run hota hai.
2. Last `Next` button locate hota hai.
3. Enabled state check hoti hai.
4. Enabled ho to click hota hai.
5. `1.5s` wait hota hai.
6. First row visible assert hoti hai.
7. Disabled ho to test skip hota hai.

### `TC-COM-068: Company detail back navigation returns to companies list`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. `networkidle` wait hota hai.
4. `page.goBack()` hota hai.
5. `1.5s` wait hota hai.
6. URL companies list par hai ya `Create Company` button visible hai, yeh check hota hai.
7. Agar nahi to skip.
8. Truthy assert hota hai.

### `TC-COM-069: Activities tab shows "Company created" activity after creation`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Activities tab click hota hai.
4. `2s` wait hota hai.
5. Creation activity text locate hota hai.
6. Visible check hota hai.
7. Visible na ho to skip.
8. Visible ho to truthy assert hota hai.

### `TC-COM-070: Activities tab groups entries by month/date header`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Activities tab click hota hai.
4. `2s` wait hota hai.
5. Month name header locate hota hai.
6. Visible check hota hai.
7. Visible na ho to skip.
8. Visible ho to truthy assert hota hai.

### `TC-COM-071: Activity entry shows timestamp`
1. `companyId` missing ho to skip.
2. `openCompanyDetailFromList(companyName)` run hota hai.
3. Activities tab click hota hai.
4. `2s` wait hota hai.
5. Date/time regex text locate hota hai.
6. Visible check hota hai.
7. Visible na ho to skip.
8. Visible ho to truthy assert hota hai.

### `TC-COM-072: "See more" link in activity entry expands truncated content`
1. `openCompanyDetailFromList(companyName)` run hota hai.
2. Activities tab click hota hai.
3. `2s` wait hota hai.
4. `See more` locator check hota hai.
5. Agar visible ho:
   - Click hota hai.
   - `See less` visible assert hota hai.
6. Warna Activities tab visible assert hota hai.

### `TC-COM-073: Creating a task generates an activity entry in the Activities tab`
1. `openCompanyDetailFromList(companyName)` run hota hai.
2. Tasks tab click hota hai.
3. `1s` wait hota hai.
4. `New Task` button locate hota hai.
5. Agar visible na ho to Tasks tab visible assert karke return hota hai.
6. Button click hota hai.
7. `800ms` wait hota hai.
8. Title field locate hota hai.
9. `Activity task from TC-COM-073` fill hota hai.
10. Last Save/Create button click hota hai.
11. `2s` wait hota hai.
12. Activities tab click hota hai.
13. `2s` wait hota hai.
14. Task activity text locate hota hai.
15. `task activity visible` ya `activities tab visible` truthy assert hota hai.

### `TC-COM-074: Task activity entry shows Type, Priority, Status, and Date & Time fields`
1. `openCompanyDetailFromList(companyName)` run hota hai.
2. Activities tab click hota hai.
3. `2s` wait hota hai.
4. `Type`, `Priority`, `Status`, `Date/Time` texts locate hote hain.
5. Har ek ki visibility check hoti hai.
6. In me se koi ya fallback activities tab visible hona truthy assert hota hai.

### `TC-COM-075: Creating a note generates an activity entry in the Activities tab`
1. `openCompanyDetailFromList(companyName)` run hota hai.
2. Notes tab click hota hai.
3. `1s` wait hota hai.
4. `Add Note` button locate hota hai.
5. Visible na ho to Notes tab visible assert karke return hota hai.
6. Button click hota hai.
7. `800ms` wait hota hai.
8. Note editor locate hota hai.
9. `Activity note from TC-COM-075` fill hota hai.
10. Last Save/Submit button click hota hai.
11. `2s` wait hota hai.
12. Activities tab click hota hai.
13. `2s` wait hota hai.
14. Note activity text locate hota hai.
15. `note activity visible` ya `activities tab visible` truthy assert hota hai.

### `TC-COM-076: Note activity entry shows note content and "See more" for long content`
1. `openCompanyDetailFromList(companyName)` run hota hai.
2. Activities tab click hota hai.
3. `2s` wait hota hai.
4. `See more` locator check hota hai.
5. Agar visible ho:
   - Click hota hai.
   - `See less` visible assert hota hai.
   - `See less` click hota hai.
   - `See more` visible assert hota hai.
6. Warna Activities tab visible assert hota hai.

## Important notes
- Kaafi tests me `test.skip()` runtime par ho sakta hai agar UI state, data availability, ya element availability expected na ho.
- `safeFill()` aur `resolveCompanyIdFromList()` helpers is spec file me defined hain, lekin kisi test case me call nahi hote.
- `companyModule.login()` ka actual login flow `ContactModule.login()` me hai; is file set me uska internal breakdown available nahi hai.
