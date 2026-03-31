# Notes & Tasks Suite Review

Reviewed files:
- `tests/notesTask.spec.js`
- `pages/notesTask.page.js`

## Notes & Tasks cases ko kaise execute karein

Requirements:
- `npm install`
- `data/credentials.js` mein valid `baseUrl`, `email`, aur `password`

Commands:
- Run complete notes/tasks suite: `npx playwright test tests/notesTask.spec.js --project=chrome`
- Run a single case: `npx playwright test tests/notesTask.spec.js --project=chrome --grep "NT-Contact-N004"`
- Run only one module block: `npx playwright test tests/notesTask.spec.js --project=chrome --grep "\\[Company\\]"`
- Show report: `npm run report`

Latest verified result:
- `npx playwright test tests/notesTask.spec.js --project=chrome --max-failures=1`
- Result: `133 passed, 3 skipped`

## Overall flow

Notes & Tasks suite `serial` mode mein one-time authenticated session ke saath run hoti hai:
1. `playwright/.auth/user.json` auth state create/reuse hoti hai.
2. Shared browser context same authenticated session ke saath initialize hota hai.
3. Suite 4 module detail pages par same Notes/Tasks smoke coverage chalati hai:
   - `Contact`
   - `Company`
   - `Property`
   - `Deal`
4. Har test se pehle target module detail URL open hoti hai, lekin login dobara nahi hota.
5. `NotesTaskPage` notes CRUD, tasks CRUD, search, complete toggle, aur cross-tab flows handle karti hai.

## Current coverage

Har module ke liye same 34 cases run hote hain:
- Notes: `N001` se `N013`
- Tasks: `T001` se `T019`
- Cross-tab: `X001` se `X002`

Total suite size:
- `4 modules x 34 cases = 136 tests`
- Latest run mein `3` empty-state cases skipped thay, kyun ke live data already present tha.

### Notes coverage

#### N001 | Notes tab visible and clickable
Expected:
- `Notes` tab selected state mein aa jaye.
- `Create New Note` button visible ho.

#### N002 | Notes empty-state validation
Expected:
- Agar module mein notes na hon to empty-state heading aur subtext visible hon.
- Agar live notes already hon to case skip hota hai.

#### N003 | Add Notes drawer fields
Expected:
- `Add Notes` drawer open ho.
- Subject input, `rdw-editor`, `Save`, aur `Cancel` visible hon.

#### N004 | Create note success
Expected:
- Runtime subject ke saath note create ho.
- Drawer close ho aur note list mein visible ho.

#### N005 | Subject required validation
Expected:
- Subject blank ho to save block ho.
- Drawer open rahe aur subject empty hi rahe.

#### N006 | Cancel note creation
Expected:
- `Cancel` se drawer close ho.
- Unsaved note persist na ho.

#### N007 | Character counter updates
Expected:
- Description type karne par notes character counter update ho.

#### N008 | Edit note drawer pre-populated
Expected:
- Existing note ka edit drawer open ho.
- Subject pre-filled ho.

#### N009 | Edit note save
Expected:
- Updated subject save ho aur list mein visible ho.

#### N010 | Edit note cancel
Expected:
- Cancel ke baad original note unchanged rahe.

#### N011 | Delete note dialog
Expected:
- `Delete Note!` confirmation dialog visible ho.

#### N012 | Delete note cancel
Expected:
- Cancel ke baad note still visible rahe.

#### N013 | Delete note confirm
Expected:
- Confirm ke baad note remove ho jaye.

### Tasks coverage

#### T001 | Tasks tab visible and clickable
Expected:
- `Tasks` tab selected ho.
- `New Task` button visible ho.

#### T002 | Tasks table columns
Expected columns:
- `Task Title`
- `Task Description`
- `Created By`
- `Due Date`
- `Priority`
- `Type`

#### T003 | Tasks empty-state validation
Expected:
- Agar module-context tasks na hon to empty-state visible ho.
- Agar live tasks already hon to case skip hota hai.

#### T004 | Create New Task drawer fields
Expected:
- Module-context drawer open ho.
- Radio group absent ho.
- `Task Title`, `rdw-editor`, `Select Type`, `Select Priority`, `Save`, aur `Cancel` visible hon.

#### T005 | Type dropdown options
Expected options:
- `To-do`
- `Email`
- `Call`
- `LinkedIn`

#### T006 | Priority dropdown options
Expected options:
- `High`
- `Medium`
- `Low`

#### T007 | Create task success
Expected:
- Runtime task save ho.
- Search/filter ke through task table mein visible ho.

#### T008 | Cancel task creation
Expected:
- `Cancel` se drawer close ho.
- Unsaved task persist na ho.

#### T009 | Title required validation
Expected:
- Empty title par save block ho.
- Drawer open rahe.

#### T010 | Search task by title
Expected:
- Created runtime task search ke baad visible ho.

#### T011 | Search no-match state
Expected:
- Random unmatched title par empty state visible ho.

#### T012 | Edit task drawer pre-populated
Expected:
- Existing task ke edit flow se drawer open ho.
- Title pre-filled ho.

#### T013 | Edit task save
Expected:
- Updated task title save ho aur search ke baad visible ho.

#### T014 | Edit task cancel
Expected:
- Cancel ke baad original task unchanged rahe.

#### T015 | Mark task complete
Expected:
- Checkbox unchecked se checked state mein aaye.

#### T016 | Unmark completed task
Expected:
- Checkbox dobara unchecked ho jaye.

#### T017 | Delete task dialog
Expected:
- `Delete Task` confirmation dialog visible ho.

#### T018 | Delete task cancel
Expected:
- Dialog close ho.
- Task list non-empty state maintain kare.

#### T019 | Delete task confirm
Expected:
- Runtime-created task delete ho.
- Title search ke baad no matching row return ho.

### Cross-tab coverage

#### X001 | Notes aur Tasks tabs ke darmiyan switching
Expected:
- Notes -> Tasks -> Notes switching sahi selected states ke saath kaam kare.

#### X002 | Same session mein note aur task dono persist karte hain
Expected:
- Note create ho.
- Task create ho.
- Tabs switch karne ke baad dono same authenticated session mein persist karein.

## Page object notes

Important helpers in `pages/notesTask.page.js`:
- `clickNotesTab()` aur `clickTasksTab()` shared module tabs handle karte hain.
- `createNote()`, `saveNote()`, `saveEditedNote()`, `clickDeleteNote()` notes CRUD flow drive karte hain.
- `createTask()`, `saveTask()`, `searchTask()`, `openTaskDetail()`, `toggleTaskComplete()` tasks flow handle karte hain.
- `clickEditTaskFromMenu()` aur `clickDeleteTaskFromMenu()` row-action based edit/delete interactions run karte hain.
- `waitForMutationFeedback()` toast absent hone ki surat mein drawer/dialog close state ke against save/delete settle karti hai.

## Stability notes

Observed stable behavior:
- Full Notes & Tasks suite 2026-03-27 ko successfully verify hui.
- Auth state reuse ne repeated login flakiness remove ki.
- Shared session approach ne user-requested one-time login behavior maintain kiya.
- Task visibility/delete checks ko search-based verification dene se title truncation aur pagination issues solve hue.
- Toast ke bajaye drawer/dialog close checks use karne se notes/tasks save flows stable hue.

Known fragile areas:
- Live data modules mein empty-state cases naturally skip ho sakte hain.
- Task table title UI truncate karti hai, is liye exact visible text assertions future UI changes par dobara adjust karni par sakti hain.
- Tasks search debounce async hai; waits remove kiye gaye to create/edit/delete validations flaky ho sakti hain.
