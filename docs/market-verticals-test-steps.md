# Market Verticals Module Review

Reviewed files:
- `tests/marketVerticals.spec.js`
- `pages/marketVerticals.page.js`

## Market Verticals cases ko kaise execute karein

Requirements:
- `npm install`
- `data/credentials.js` mein valid `baseUrl`, `email`, aur `password`

Commands:
- Run complete market verticals suite: `npx playwright test tests/marketVerticals.spec.js --project=chrome`
- Run a single case: `npx playwright test tests/marketVerticals.spec.js --project=chrome --grep "TC-MV-0XX"`
- Show report: `npm run report`

Latest verified result:
- `npx playwright test tests/marketVerticals.spec.js --project=chrome`
- Result: `30 passed`

## Overall flow

Market Verticals suite `serial` mode mein run hoti hai:
1. `beforeAll` mein auth state create/reuse hoti hai.
2. Shared browser context `storageState` ke saath initialize hota hai.
3. `MarketVerticalsPage` page object list, detail, create, edit, aur delete flows handle karta hai.
4. Suite chunked smoke coverage deti hai:
   - list page
   - detail navigation
   - sidebar/question search
   - question detail panel
   - add question form
   - edit question
   - delete question
   - extra UI validations

## Current coverage

### List page

#### TC-MV-001 | Navigate to Market Verticals from sidebar
Expected:
- User `/app/sales/marketVerticals` par successfully land kare.
- Header title, industry search, aur list table visible hon.

#### TC-MV-002 | Verify all table columns on list page
Expected columns:
- `Industries`
- `No. of Deals`
- `No. of Companies`
- `Synced From`
- `Last Synced On`

#### TC-MV-003 | Verify all 5 industry verticals are listed
Expected rows:
- `Commercial`
- `Distribution`
- `Industrial`
- `Manufacturing`
- `Residential`

#### TC-MV-004 | Search by industry name filters the list
Expected:
- Matching industry visible rahe.
- Non-matching industries hidden ho jayen.

#### TC-MV-005 | Search with no match shows empty table
Expected:
- Unmatched search ke baad known industries visible na rahen.

### Detail page

#### TC-MV-006 | Clicking vertical row opens detail page
Expected:
- URL `/marketVerticals/<id>/questions` pattern follow kare.
- Selected vertical heading aur `Add Question` button visible hon.

#### TC-MV-007 | Left sidebar shows all 5 verticals with company counts
Expected:
- Sidebar mein 5 vertical names visible hon.
- Company count chips visible hon, for example `2595` aur `83`.

#### TC-MV-008 | Switching verticals via sidebar updates the right panel
Expected:
- Sidebar selection ke baad heading aur route selected vertical ke mutabiq update ho.

#### TC-MV-009 | Left sidebar search filters verticals
Expected:
- Search term `Comm` ke baad `Commercial` visible rahe.
- `Distribution` aur `Industrial` hide ho jayen.

#### TC-MV-010 | Clearing sidebar search restores all verticals
Expected:
- Search clear karne ke baad 5/5 verticals dubara visible ho jayen.

### Question search and detail panel

#### TC-MV-011 | Search by question filters results in the right panel
Expected:
- `budget` search ke baad exactly 1 matching question visible ho.

#### TC-MV-012 | Clearing question search restores all questions
Expected:
- Search clear karne ke baad multiple question rows wapas load ho jayen.

#### TC-MV-013 | Clicking a question opens the detail side panel
Expected:
- `Question` side panel open ho.
- `Edit` button aur `Associated Industries` section visible ho.

#### TC-MV-014 | Close button dismisses the detail panel
Expected:
- Panel close icon se side panel dismiss ho jaye.

### Add question form

#### TC-MV-015 | Add Question button navigates to create form
Expected:
- Create form route open ho.
- `Question Statement`, `Instructions`, `Add option`, `Required`, `Save`, `Cancel`, aur `Back` visible hon.

#### TC-MV-016 | Saving empty form shows validation errors
Expected:
- Required field validation messages visible hon.

#### TC-MV-017 | Answer Type dropdown shows all 3 options
Expected options:
- `Multiple Selection`
- `Radio Buttons (Single Selection)`
- `DropDown`

#### TC-MV-018 | Market Verticals dropdown shows all 5 options with search
Expected:
- 5 vertical options aur dropdown search input visible hon.

#### TC-MV-019 | Add option button creates a new option row
Expected:
- `Option Label` input aur points spinbutton visible ho.

#### TC-MV-020 | Successfully create a new question (Multiple Selection)
Expected:
- Create form save ho.
- Questions list par wapas aakar new runtime question visible ho.

#### TC-MV-021 | Cancel button discards form and navigates back
Expected:
- Unsaved question persist na ho.

#### TC-MV-022 | Back button navigates to questions list without saving
Expected:
- Unsaved question persist na ho.

### Edit question

#### TC-MV-023 | Edit via 3-dot menu opens pre-populated edit form
Expected:
- Edit route open ho.
- Statement input aur base controls visible hon.
- Current UI ke mutabiq form shell load ho.

#### TC-MV-024 | Edit via question detail panel opens pre-populated form
Expected:
- Detail panel ke `Edit` se edit route open ho.
- Edit form controls visible hon.

### Delete question

#### TC-MV-025 | Delete via 3-dot menu shows confirmation dialog
Expected:
- `Delete Question` dialog visible ho.

#### TC-MV-026 | Cancel delete dismisses dialog without deleting
Expected:
- Dialog close ho aur original question still visible rahe.

#### TC-MV-027 | Confirm delete removes the question from the list
Expected:
- Runtime-created delete target remove ho jaye.

### Additional UI validations

#### TC-MV-028 | Rows per page dropdown and pagination visible on list page
Expected:
- `Rows per page` combo aur `1–5 of 5` pagination text visible ho.
- Prev/Next buttons disabled hon.

#### TC-MV-029 | Drag handles are visible on all question rows
Expected:
- Har data row mein drag handle button visible ho.

#### TC-MV-030 | Questions table has all expected column headers
Expected columns:
- `Question Statement`
- `Last Edited By`
- `Last Edited On`
- `Answer Type`

## Page object notes

Important helpers in `pages/marketVerticals.page.js`:
- `navigateToListPage()` list route open karke skeleton loader settle hone ka wait karti hai.
- `clickVerticalInList(verticalName)` selected vertical detail route open karti hai.
- `selectVerticalInSidebar(verticalName)` sidebar vertical switch karti hai.
- `searchIndustry()`, `searchSidebarVertical()`, `searchQuestions()` filtering flows handle karte hain.
- `openQuestionDetailPanel()` aur `closeQuestionDetailPanel()` side panel interactions cover karte hain.
- `clickAddQuestion()`, `createQuestion()`, `selectAnswerType()`, `selectMarketVerticals()`, `addOption()` create form drive karte hain.
- `clickEditFromMenu()`, `clickDeleteFromMenu()`, `confirmDelete()`, `cancelDelete()` edit/delete flows cover karte hain.

## Stability notes

Observed stable behavior:
- Full Market Verticals suite 2026-03-27 ko successful run hui.
- Auth state reuse ne repeated login flakiness remove ki.
- Skeleton loader clear hone ke baad assertions chalane se list/detail/search cases stable hue.
- Dropdown assertions ko active popper scope dene se strict-mode conflicts solve hue.

Known fragile areas:
- Question search aur loader timing async hai; immediate assertions future UI changes par flaky ho sakti hain agar waits remove kiye gaye.
- Edit form current app behavior ke mutabiq shell-visible assertions use karta hai, kyun ke live route blank fields ke saath open ho rahi thi.
- Side panel close icon unnamed control hai; DOM structure change hui to locator refresh karna padega.
