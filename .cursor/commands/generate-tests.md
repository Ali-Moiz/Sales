# Generate Playwright Tests from Documentation

Convert manual test case documentation into automated Playwright tests. This command invokes the workflow agent.

---

## Quick Start

```
/generate-tests
```

Answer 4 input prompts:
1. **Requirement** — Feature to test (e.g., "Verify deleting a service updates totals")
2. **Module** — Which module (e.g., "Contract Module")
3. **Documentation file** — Where test cases are documented (e.g., `docs/contract-module-test-steps.md`)
4. **Test output file** — Where to write automation (e.g., `tests/e2e/contract-module.spec.js`)

The agent will execute the full 8-phase workflow and report results.

---

## CRITICAL Constraint

All test case names (TC codes) **MUST** be defined in your documentation file FIRST. Never invent TC codes during test generation.

Example:
- (CORRECT) Document `TC-CONTRACT-DELETE-006 | Verify grand total updates...` in docs file, then generate
- (INCORRECT) Invent `TC-CONTRACT-DELETE-006` during test generation without prior documentation

---

## Full Workflow (8 Phases)

The agent (`@.claude/agents/generate-playwright-tests.md`) orchestrates:

1. **Phase 0**: Pre-flight checks (parse docs, validate env, compute DELTA)
2. **Phase 1** (optional): Record flow with Playwright codegen
3. **Phase 2**: Analyze selectors, map to Page Objects
4. **Phase 3**: Update documentation with test scenarios
5. **Phase 4**: Update Page Object Model with new methods (append-only)
6. **Phase 5**: Generate DELTA tests (skip existing tests)
7. **Phase 6**: Validate syntax and standards compliance
8. **Phase 7**: Execute tests in headed browser and auto-fix failures (max 3 attempts)

All code follows `@.claude/skills/playwright-test-standards/SKILL.md`.

---

## Standards Reference

See these files for authoritative standards:

| File | Purpose |
|------|---------|
| `@.claude/agents/generate-playwright-tests.md` | Full 8-phase workflow orchestration |
| `@.claude/skills/playwright-test-standards/SKILL.md` | Selector strategy, timeouts, waits, assertions, POM rules, test isolation |
| `@.claude/commands/generate-test.md` | (Claude Code version — same workflow) |

---

## Workflow Diagram

```
User runs: /generate-tests
    ↓
Cursor command collects 4 inputs
    ↓
Invokes @.claude/agents/generate-playwright-tests.md
    ├─ Loads @.claude/skills/playwright-test-standards/SKILL.md
    ├─ Phase 0: Pre-flight (validate docs, env)
    ├─ Phase 1: Codegen (optional)
    ├─ Phase 2-5: Analysis, docs, POM, tests
    ├─ Phase 6: Validate
    ├─ Phase 7: Execute + auto-fix
    └─ Report final results
```

---

## Key Rules (No Duplication)

1. **Document First** — TC codes must exist in docs before automation runs
2. **Assertions Required** — Every test must validate outcomes, not just check existence
3. **Append-Only POM** — Never modify existing Page Object methods, only add new ones
4. **No Invented Tests** — Only generate tests that are documented (DELTA workflow)
5. **Single Source** — This command invokes the agent; agent invokes the skill

---

## Examples

### Example 1: Add 5 new contract tests

```
/generate-tests

Requirement: "Verify service deletion updates totals"
Module: "Contract Module"
Docs file: "docs/contract-module-test-steps.md"
Test file: "tests/e2e/contract-module.spec.js"
```

Result: Agent reads TC-CONTRACT-DELETE-001 through TC-CONTRACT-DELETE-010 from docs, finds that TC-DELETE-001 to TC-DELETE-005 already exist in test file, generates only TC-DELETE-006 to TC-DELETE-010 (DELTA = 5 new tests).

### Example 2: Create tests for new module

```
/generate-tests

Requirement: "Verify task creation and assignment"
Module: "Task Module"
Docs file: "docs/task-module-test-steps.md"
Test file: "tests/e2e/task-module.spec.js"
```

Result: Agent creates new test file with all documented TC codes (fresh file, no DELTA needed).

---

## Next Steps

1. **Document test cases** in `docs/{{module}}-test-steps.md` with TC codes
2. **Define expected behavior** (steps, assertions, edge cases)
3. **Run `/generate-tests`** and answer the 4 input prompts
4. **Review generated tests** in headed mode
5. **Commit** when all tests pass

---

## Troubleshooting

**"TC code not found in docs"**
- You invented a TC code during generation instead of documenting it first
- Add the TC code to your docs file with expected steps and assertions
- Re-run the command

**"Test assertion is weak"**
- `expect(value).toBeDefined()` alone is insufficient (per skill Section 6)
- Pair with format/value checks: `expect(value).toMatch(/\$[\d,]+\.\d{2}/)`
- Agent's Phase 2 analysis should catch this

**"Selector not found"**
- Use `HEADLESS=false npx playwright test ... --debug` to inspect live DOM
- Try alternatives: `[data-testid]` → CSS → `text=` → `getByLabel` → `getByRole`
- Add selector to POM and re-generate
