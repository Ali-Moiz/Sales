# Verify Test Coverage

You verify that every test case description in a **requirements list** is implemented in a **spec file**, and that each implementation is **traceable by exact text match**.

## Inputs (REQUIRED)

This command takes two inputs. Both must be provided. If either is missing, stop and ask the user for it.

1. **`spec_file`** — path to the Playwright spec file to verify against (e.g. `e2e/property-module.spec.js`, `tests/e2e/deals.spec.ts`).
2. **`requirements_file`** — path to the requirements/test-case list, OR the raw list pasted inline (e.g. `docs/property-module-test-cases.md`).

Accepted invocation patterns:

```
/verify-test-coverage spec=e2e/property-module.spec.js requirements=docs/property-module-test-cases.md
/verify-test-coverage e2e/property-module.spec.js docs/property-module-test-cases.md
/verify-test-coverage e2e/property-module.spec.js
<then paste the requirements list as the next message>
```

If the user provides only one path, ask which one it is and request the other before proceeding. Do not guess.

## Pre-flight Checks

Before doing any work, confirm:

- The `spec_file` path exists and is readable. If not, stop and report the error.
- The `requirements_file` path exists and is readable, OR the requirements have been pasted inline. If neither, stop and ask.
- Print a one-line confirmation of what you're about to verify:
  `Verifying coverage of <requirements_file> against <spec_file>...`

## Traceability Rule (THE CORE REQUIREMENT)

For each test case description in the requirements list, the spec file MUST contain the **exact description text** in one of these locations:

1. `test(...)` title — e.g. `test("Verify that user is able to create new property", async ({ page }) => { ... })`
2. `test.step(...)` description — e.g. `await test.step("Verify that user is able to create new property", async () => { ... })`
3. A **comment at the point of implementation** — e.g. `// Verify that user is able to create new property`

The match must be **literal and copy-pasteable**. A user should be able to copy any description from the requirements list, paste it into a find-in-file search on the spec file, and land directly on the implementation.

Paraphrasing does NOT count. "Tests property creation" does not satisfy "Verify that user is able to create new property". The exact string must appear.

## Workflow

### 1. Parse the Requirements List

Sources the requirements may come in:

- **A markdown file** with numbered or bulleted items, optionally grouped under `##` section headings.
- **A plain text file**, one description per line.
- **A wall of text** pasted inline where descriptions are concatenated without separators (e.g. `...create new property.Verify that user is able to view...`). Split on the pattern `Verify that` to recover individual descriptions.

For each description:

- Strip leading numbering (`1.`, `2.`, `- `, `* `) but preserve the description body exactly.
- Recognize section headers like `Property Activities`, `Property Notes`, `## Create Property Modal` — these are NOT test cases, they're grouping labels. Preserve them as context for the section-by-section report; don't search for them.
- Trim whitespace.
- Preserve original capitalization, punctuation, and typos (e.g. "checkbos", "Propsal", "Assginee"). The spec may or may not have fixed these — report both ways.
- Number each description sequentially for the report (independent of any numbering in the source).

### 2. Search the Spec File

For each description, run an exact-string search against the spec file:

```bash
rg -nF "Verify that user is able to create new property" <spec_file>
```

Use `-F` (fixed string, no regex) to avoid issues with special characters like `'`, `(`, `+`, `/`. Use `-n` to capture line numbers.

For each description, record:

- **Found** — line number(s) and the location type (test title / test.step / comment).
- **Not found** — flag for the missing-coverage report.
- **Found with typo difference** — if the exact string fails but a near-match exists (e.g. spec says "checkbox" where input says "checkbos"), flag separately as a traceability break.

To classify location type, inspect the matched line:

- Inside `test(` or `test.skip(` / `test.only(` → test title
- Inside `test.step(` or `await test.step(` → test.step
- Starts with `//` or inside `/* */` → comment

### 3. Detect Split Implementations

Some descriptions may be implemented across multiple `test.step` calls inside a parent `test`. That's fine **only if** the full description string appears verbatim somewhere — either as the parent `test` title, an enclosing comment, or one of the steps. If the implementation is spread across steps with paraphrased step names and the original description appears nowhere, treat it as **not traceable** even if the behavior is covered.

### 4. Generate the Report

Output in this structure:

```
## Coverage Summary

Spec file:          <spec_file>
Requirements:       <requirements_file or "inline">
Total descriptions: N
Traceable (exact match found): X
Missing (no match): Y
Traceability broken (paraphrased / typo mismatch): Z

## Section-by-Section Results

### <Section name from requirements file, or "Ungrouped">
[ ✓ ] L1234 (test title)    Verify that user is able to create new property
[ ✓ ] L1456 (comment)       Verify that user is able to view details of property
[ ✗ ] MISSING                Verify that user is able to edit property
[ ~ ] L1789 (test.step)     Verify that the 'Assign Supervisor' checkbos is disabled when user select the HO user as a Assginee
                              ↳ Spec has: "Verify that the Assign Supervisor checkbox is disabled when HO user is selected as Assignee"
                              ↳ Traceability broken — exact string not searchable.

### Property Activities
[ ✓ ] L4111 (comment)       Verify that email log title uses sender username
...
```

Legend:

- `✓` exact match found, traceable
- `✗` no match, not implemented (or implemented without traceable text)
- `~` near-match found, traceability broken — copy-paste search will fail

### 5. Action Items

End with two lists the user can act on directly:

**Tests to add** (descriptions with no match anywhere):

```
- Verify that ... (suggest section based on input grouping)
- Verify that ...
```

**Traceability fixes** (description exists in spirit but exact text differs):

```
- L1789: change step name from "..." to "Verify that the 'Assign Supervisor' checkbos is disabled when user select the HO user as a Assginee"
  OR add comment with the exact original text above the implementation
```

For each missing test, suggest the **minimal** placement: which `describe` block it belongs in based on the requirements section grouping, and whether it should be a new `test` or a `test.step` inside an existing one.

## Constraints

- Do NOT propose implementations for the missing tests — that's a separate task. Just report what's missing.
- Do NOT modify the spec file in this command. This is read-only verification.
- If the spec file or requirements file doesn't exist or is unreadable, stop and report the error.
- If the spec is very large, use `rg` scoped to that file directly — don't load the whole file into context unless you need to inspect surrounding structure for the section-grouping suggestions or to determine location type.
- Preserve the **exact** input text including typos when reporting. The traceability requirement is a literal string match, so "Assginee" in the input must be searched as "Assginee", not corrected to "Assignee".

## Output Format

Begin the response with the Coverage Summary, then the Section-by-Section Results, then Action Items. Do not include preamble or explanation outside this structure.
