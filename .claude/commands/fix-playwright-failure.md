# Fix Playwright Test Failure

You will receive a Playwright test failure log as input. Execute the following workflow strictly in order.

## 0. Load Project Standards (MANDATORY FIRST STEP)

Before analyzing anything, read:
- `skills/playwright-test-standards/SKILL.md` — project-specific Playwright rules
- `CLAUDE.md` (repo root, if it exists) — project-wide conventions

Every fix you propose MUST conform to these standards. If a fix would violate them, find a different fix. If the standards don't cover the situation, note it explicitly so a new rule can be added in step 4.

## 1. Root Cause Analysis

Analyze the error log and identify the **true root cause**, not the symptom. Consider:

- **Locator timeout** → the element never appeared. Check the page snapshot in the log to see what *did* render. If the snapshot shows a different page than expected, the failure is in the **navigation/setup step before** the failing line — not the failing line itself.
- **Strict mode violations** → multiple matches; locator needs to be scoped or made more specific.
- **Stale state** → previous test polluted state; check `beforeEach` / fixtures / test isolation.
- **Race conditions** → missing `await expect(...).toBeVisible()` before interaction.
- **Wrong selector strategy** → CSS/XPath used where role-based locator would be stable.

State the root cause in 1–2 sentences before writing any code.

## 2. Implement the Fix

Constraints (in priority order):

1. **Must comply with `skills/playwright-test-standards/SKILL.md`.** Re-read the relevant section before writing code. Cite the rule you're following in a code comment if non-obvious.
2. Follow Playwright best practices: role-based locators, web-first assertions (`await expect(...)`), auto-waiting over manual sleeps.
3. Never add `page.waitForTimeout(N)` as a fix — it masks the real issue and almost certainly violates the standards file.
4. If the failure is a missing precondition (e.g. test never navigated to the right page), fix the **setup**, not the assertion.
5. Keep changes minimal and targeted — don't refactor unrelated code.

If the standards file and a "best practice" you'd otherwise apply conflict, **the standards file wins**. Flag the conflict in your output so the user can decide whether to update the standards.

## 3. Check for Repetition Across the Codebase

Search for the same anti-pattern elsewhere:

- Grep for the same locator string, same helper method, same setup pattern.
- Use `rg` across `tests/`, `pages/`, `e2e/`, and any Page Object files.
- Cross-reference each match against `skills/playwright-test-standards/SKILL.md` — flag any that violate the standards even if they haven't failed yet.

Report findings as:

Found N other occurrences:
path/to/file.js:LINE — [same issue / standards violation / safe]

Fix all instances, or list them with line numbers if the user should review before bulk-editing.

## 4. Update Documentation

Append the lesson to the appropriate file:

- **`skills/playwright-test-standards/SKILL.md`** — if this is a Playwright-specific pattern or anti-pattern. **Default destination for anything Playwright-related.**
- **`CLAUDE.md`** (repo root) — only if the lesson is project-wide and not Playwright-specific (e.g. navigation prerequisites that affect all test types).

Before adding, **search the standards file** to confirm the rule isn't already there. If it is, the real failure was not following an existing rule — note that instead of duplicating it.

New entries must include:
1. **The symptom** (one line — what the failure looked like).
2. **The root cause** (one line).
3. **The rule** (do this, not that — with a tiny code example if useful).

Keep entries terse. One bullet per lesson. Group under the existing section that fits, or create a new `## <Topic>` heading if none fits.

## 5. Output Format

Respond in this exact structure:

### Standards Consulted
<which sections of skills/playwright-test-standards/SKILL.md applied, or "no relevant rule — proposing new one in step 4">

### Root Cause
<1–2 sentences>

### Fix
<code diff or snippet, with file path>

### Standards Compliance
<which rule(s) the fix follows, or any conflicts flagged>

### Other Occurrences
<list, or "None found">

### Documentation Updated
<file path + the bullet that was added, OR "Existing rule X already covers this — no update needed">
