# AGENTS.md

## Repository Expectations

- This repository is a Playwright end-to-end automation framework for the Sales CRM.
- Follow the existing Page Object Model structure: selectors and UI actions belong in `pages/*-module.js`; specs belong in `tests/e2e/*.spec.js`; test case documentation belongs in `docs/*-test-steps.md`.
- For Playwright test generation, review, or debugging, load `.agents/skills/playwright-test-standards/SKILL.md` first. It is the project source of truth for selector strategy, waits, assertions, test data, POM conventions, and generated-test workflow.
- `CLAUDE.md` and `.claude/` files remain useful legacy references, but Codex project-local agents live in `.codex/agents/` and Codex repo skills live in `.agents/skills/`.
- Never invent TC codes. Document test cases in `docs/*.md` before automating them.
- Use credentials and URLs through `utils/env.js` and `.env.*` files. Do not hardcode secrets or role credentials in tests.
- Prefer the single-session Playwright pattern: one browser context, one page, and one login per spec file, with `beforeEach` used for navigation/state reset only.
- Run `npm run lint` after JavaScript changes when feasible.
- Run the smallest relevant `npx playwright test ... --grep "<TC-CODE>"` command when changing or generating Playwright tests.

## Common Commands

- `npm run lint` checks the repository with ESLint.
- `npm run lint:fix` applies safe ESLint fixes.
- `npm run test:uat` runs all UAT tests headless.
- `npm run test:uat:headed` runs all UAT tests headed.
- `npm run test:prod` runs all production tests.
- `npm run report` opens the latest Playwright HTML report.
- `npm run codegen` launches Playwright codegen against UAT.
- Module scripts include `npm run test:uat:login`, `npm run test:uat:company`, `npm run test:uat:contact`, `npm run test:uat:property`, `npm run test:uat:deal`, `npm run test:uat:contract`, `npm run test:uat:tasks`, and `npm run test:uat:market-verticals`.
- For a targeted run, prefer `npx playwright test tests/e2e/<module>.spec.js --grep "<TC-CODE>"`.

## Runtime Configuration

- Playwright config is in `playwright.config.js`.
- Tests live under `tests/` and match `**/*.spec.js`.
- The configured browser project is `chrome`.
- The suite is intentionally single-worker and not fully parallel.
- Environment variables are loaded by `utils/auth/load-env.js` from `.env.<ENV_NAME>`.
- `BASE_URL` defaults to UAT when not provided.
- Screenshots and videos are retained on failure; traces are collected on first retry.

## Codex Agents

- Use `tests-generator` for turning user requirements into documented and automated Playwright tests.
- Use `code-fixer` for standards reviews and targeted fixes in Playwright specs or page objects.
- Use `debugger` for Playwright failure logs that need reproduction, root-cause analysis, and a focused fix.
- Codex custom agents are subagents. Ask explicitly to spawn or delegate to them when you want parallel or specialized agent work.
