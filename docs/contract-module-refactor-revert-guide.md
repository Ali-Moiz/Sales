# Contract Module Refactor Deep-Dive + Revert Guide

This document captures the full refactor/change scope discussed and applied in the contract-module cleanup work, with rollback commands you can run any time if issues appear.

## 1) Full Changed File Inventory (vs `HEAD`)

Source: `git diff --stat HEAD -- .mcp.json docs/contract-module-test-steps.md pages/contract-module.js playwright-e2e-cursor-rules.md tests/e2e/contract-module.spec.js utils/contract-test-helpers.js`

- `.mcp.json` -> `10` lines changed
- `docs/contract-module-test-steps.md` -> `61` lines added
- `pages/contract-module.js` -> `599` lines changed
- `playwright-e2e-cursor-rules.md` -> new file, `884` lines added
- `tests/e2e/contract-module.spec.js` -> `2836` lines changed
- `utils/contract-test-helpers.js` -> new file, `162` lines added

Aggregate:
- `6` files changed
- `2545` insertions
- `2007` deletions

## 2) What Was Refactored (Deep Dive)

## `tests/e2e/contract-module.spec.js`

Primary objective was cleanup of redundant/non-essential steps while keeping:
- test count intact
- serial flow intact
- business behavior intact

Major changes included:
- Added top-level strict mode header (`// @ts-check`) and timeout constants.
- Added helper wiring/imports for extracted utilities from `utils/contract-test-helpers.js`.
- Introduced/expanded isolation helpers:
  - `withIsolatedDeal(...)`
  - `openIsolatedCreateProposalDrawer()`
- Simplified dependency setup and removed duplicate modal open/cancel probing in deal/property dependency checks.
- Reduced repeated drawer-state checks where already guaranteed by flow.
  - Example class: repeated `assertCreateProposalDrawerOpen()` calls immediately after `openCreateProposalDrawer()`.
- Removed repeated defensive tab-clicks in some recovery paths where state detection already handles routing.
- Streamlined focused tests to validate title requirement only (especially around:
  `TC-CONTRACT-024`, `TC-CONTRACT-025`, `TC-CONTRACT-026`).
  - Removed many side branches (`N1`, `N2`, ... style permutations).
  - Removed stale-state reopen checks not required by core title validation.
  - Removed rapid-submit/keyboard-only permutations where outside core requirement.
- Kept/updated contract flow stability in isolated scenarios:
  - `TC-CONTRACT-026` now uses isolated drawer setup and still validates TBD contract creation success path.
- Tax/payment-term related E2E flow (`TC-CONTRACT-E2E-008A`) had stronger validation assertions and resilient locator usage in prior refactor passes (payment plans + tax behavior + save/next blocking checks).
- Logging cleanup:
  - A large set of step/debug logs removed from focused tests.
  - Based on diff review, deleted `console.log(...)` entries in this file: `73`.
- Redundant drawer-open assertions removed from this file:
  - Deleted `assertCreateProposalDrawerOpen()` calls in diff: `22`.

## `pages/contract-module.js`

Page object cleanup + structure normalization:
- Added `// @ts-check`.
- Reorganized constructor sections into clearer groups (Navigation, Deal List, Tabs, Empty State, Drawer, Stepper sections, etc.).
- Locator definitions were normalized/cleaned for consistency.
- Some fallback chains and broad alternates were tightened in specific locators.
- Additional comments/checklist style guidance added in sections.
- Overall goal in this file: make selectors/method layout cleaner and easier to maintain while preserving module behavior.

## `utils/contract-test-helpers.js` (new)

New shared helper file created to move repetitive utility logic out of the spec:
- money/currency parsing helpers
- grand total extraction helpers
- visible service amount collection
- checkbox resolver helpers
- scroll helper integration
- label-based checkbox toggle helper

This reduced inline helper noise in `contract-module.spec.js` and centralized reusable logic.

## `docs/contract-module-test-steps.md`

Manual QA documentation expanded under `TC-CONTRACT-E2E-008` scope:
- Added detailed manual scenarios for:
  - Holiday Multiplier + Holiday Group + "0 Holidays" accessibility
  - Flat plan amount validation (required/numeric/negative/edge cases)
- Includes execution steps, expected outcomes, positive/negative/edge scenarios, and explicit single manual assertion per requirement.

## `.mcp.json`

MCP config update:
- Added `chrome-devtools` MCP entry
- Minor formatting normalization

## `playwright-e2e-cursor-rules.md` (new)

New standards/rules document added:
- comprehensive Playwright authoring standards
- structure, naming, timeouts, selectors, waits, assertions, POM patterns, forbidden patterns, and checklists

## 3) Rollback / Revert Commands

Use from repo root (`c:\tkxel\signal_sales_playwright_automation\Sales`).

## Option A: Revert only contract-module spec changes

```bash
git restore --source=HEAD -- "tests/e2e/contract-module.spec.js"
```

## Option B: Revert only contract-module related POM/helper/doc updates

```bash
git restore --source=HEAD -- "pages/contract-module.js" "docs/contract-module-test-steps.md"
git restore --source=HEAD --staged --worktree "utils/contract-test-helpers.js"
```

Notes:
- `utils/contract-test-helpers.js` is a new file; restore with `--staged --worktree` removes it from index + working tree.

## Option C: Revert all changes from this refactor bundle (full rollback)

```bash
git restore --source=HEAD --worktree --staged ".mcp.json" "docs/contract-module-test-steps.md" "pages/contract-module.js" "playwright-e2e-cursor-rules.md" "tests/e2e/contract-module.spec.js" "utils/contract-test-helpers.js"
```

## Option D: Keep files, but inspect exact patch before reverting

```bash
git diff HEAD -- ".mcp.json" "docs/contract-module-test-steps.md" "pages/contract-module.js" "playwright-e2e-cursor-rules.md" "tests/e2e/contract-module.spec.js" "utils/contract-test-helpers.js"
```

If you want a saved patch file:

```bash
git diff HEAD -- ".mcp.json" "docs/contract-module-test-steps.md" "pages/contract-module.js" "playwright-e2e-cursor-rules.md" "tests/e2e/contract-module.spec.js" "utils/contract-test-helpers.js" > "docs/contract-module-refactor-full.patch"
```

## 4) Safety Checks After Any Revert

Run:

```bash
git status --short
npx playwright test "tests/e2e/contract-module.spec.js" --grep "TC-CONTRACT-02[4-6]"
npx playwright test "tests/e2e/contract-module.spec.js" --grep "TC-CONTRACT-E2E-008A"
```

Expected:
- status reflects exactly the files you intended to keep/revert
- targeted contract tests should run and confirm flow health

## 5) Practical Recommendation

If issue is only in current cleanup behavior, do `Option A` first (spec-only rollback).
If issue is broader (locator/helper behavior), use `Option C` for a full clean return to `HEAD`.
