# Fix Playwright Test Failure

Thin router that delegates to the `Debugger` agent. All logic lives in `.claude/agents/debugger.md`.

## Usage

```
/fix-playwright-failure
```

Paste the Playwright failure log when prompted. The Debugger agent will:

1. Load project standards (`playwright-test-standards/SKILL.md` + `CLAUDE.md`)
2. Analyze the root cause from the log
3. Reproduce the failure via Playwright MCP in a live browser
4. Implement a targeted fix (compliant with project standards)
5. Search the codebase for the same anti-pattern
6. Update documentation with the lesson learned

## When to Use

- A test failed and you have the error log
- You want root cause analysis, not just a quick selector swap
- You want the fix verified in a live browser before finalizing

## References

| File | Purpose |
|------|---------|
| `.claude/agents/debugger.md` | Full debugging workflow |
| `.claude/skills/playwright-test-standards/SKILL.md` | Standards the fix must comply with |
