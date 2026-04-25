---
name: generate-test
description: Claude Code version — Generate automated Playwright tests from manual test case documentation. For Cursor IDE users, use /generate-tests (see @.cursor/commands/generate-tests.md).
---

# Generate Test Plan for Sales CRM (Claude Code)

Convert manual test case documentation into automated Playwright tests.

---

## Quick Start

```
/generate-test
```

Answer 6 input prompts:
1. **Requirement** — Feature to test (e.g., "Verify deleting a service updates totals")
2. **Module** — Which module (e.g., "Contract Module")
3. **Documentation file** — Where test cases are documented (e.g., `docs/contract-module-test-steps.md`)
4. **Test output file** — Where to write automation (e.g., `tests/e2e/contract-module.spec.js`)
5. **Additional context** *(optional)* — Extra clarity: user role, preconditions, dependencies, priority (e.g., "HO role only, requires existing contract in draft status")
6. **Codegen recording** *(optional)* — Record the flow with Playwright Codegen first? Yes / No

The agent will execute the full 8-phase workflow and report results.

---

## Important Notes

(CRITICAL) All test case names (TC codes) **MUST** be defined in your documentation file FIRST. Never invent TC codes during test generation.

---

## Authoritative References

| File | Purpose |
|------|---------|
| `@.cursor/commands/generate-tests.md` | **AUTHORITATIVE** — Full workflow for all users |
| `@.claude/agents/generate-playwright-tests.md` | 8-phase workflow orchestration (shared by both commands) |
| `@.claude/skills/playwright-test-standards/SKILL.md` | All coding standards and constraints |

---

## For Claude Code Users

When you run `/generate-test` in Claude Code:

1. The command collects your 4 inputs
2. It invokes the `generate-playwright-tests` agent
3. The agent loads the `playwright-test-standards` skill
4. The agent executes phases 0-8 and reports results

The workflow is identical to Cursor's `/generate-tests` command — both invoke the same agent and skill.

---

## Workflow (8 Phases)

See `@.claude/agents/generate-playwright-tests.md` for complete phase details:

1. Pre-flight checks (parse docs, validate env)
2. Codegen (optional)
3. Analyze selectors, map to POM
4. Update documentation
5. Update Page Object Model
6. Generate tests (DELTA workflow)
7. Validate syntax & standards
8. Execute tests + auto-fix failures

---

## See Also

- `@.cursor/commands/generate-tests.md` — Main documentation (all users)
- `@.claude/agents/generate-playwright-tests.md` — Agent implementation
- `@.claude/skills/playwright-test-standards/SKILL.md` — All standards and rules
- `CLAUDE.md` — Project overview and guidelines
