---
name: codegen-workflow
description: Discover DOM selectors using Playwright codegen. Use this skill when selectors are unknown or when testing new features. Covers codegen launch, selector extraction, fallback patterns, and integration with Page Objects.
---

# Playwright Codegen Workflow

When implementing new tests and selectors are unknown, use this codegen workflow to capture actual DOM interactions.

## Quick Start

```bash
HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com
```

This opens:
- Browser window for manual interaction
- Codegen Inspector panel (top-right)
- Records all clicks, fills, and selectors in real-time

## Workflow Steps

### 1. **Launch Codegen**
```bash
HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com
```

### 2. **Perform Test Flow Manually**
- Login (if needed)
- Navigate to the feature being tested
- Interact with all elements (click, fill, select, etc.)
- Codegen records every interaction

### 3. **Review Generated Code**
```javascript
// Example output from codegen
await page.getByRole('button', { name: 'Create Proposal' }).click();
await page.getByRole('textbox', { name: 'Proposal Name' }).fill('My Proposal');
await page.locator('.MuiInputBase-root input').first().fill('25');
```

### 4. **Extract Selectors**
Identify reliable selectors from the generated code:
- ✅ Use `getByRole()` — most resilient
- ✅ Use `getByLabel()` / `getByPlaceholder()` — accessible
- ⚠️ Avoid XPath/CSS indices — brittle
- ⚠️ Avoid `.first()` / `.nth()` without context — flaky

### 5. **Add Page Object Methods**
```javascript
// pages/my-module.js
async createProposal(name) {
  await this.createProposalBtn.click();
  const nameInput = this.page.getByRole('textbox', { name: 'Proposal Name' });
  await nameInput.fill(name);
}

async setDeviceQuantity(quantity) {
  const quantityInput = this.page.locator('.MuiInputBase-root input').first();
  await quantityInput.fill(String(quantity));
}
```

### 6. **Write Tests**
```javascript
test('TC-FEATURE-001 | Create proposal with name', async () => {
  await myModule.createProposal('Test Proposal');
  // assertions...
});
```

## Best Practices

### ✅ DO
- Use ARIA roles first: `getByRole('button', { name: 'Save' })`
- Test with `.or()` for resilience:
  ```javascript
  const btn = page.getByRole('button', { name: 'Delete' })
    .or(page.locator('[data-testid="delete-btn"]'));
  ```
- Add waits for visibility before interaction
- Use meaningful method names in Page Objects

### ❌ DON'T
- Hardcode CSS selectors without testing
- Use indices blindly (`.nth(5)`, `.first()`)
- Test without codegen verification
- Skip Page Object abstraction

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Codegen not recording** | Ensure Headless mode is OFF: `HEADLESS=false` |
| **Selector keeps breaking** | Use `.or()` fallback or more accessible selector |
| **Element not visible** | Add `.waitFor({ state: 'visible' })` before interaction |
| **Dynamic content** | Use `page.waitForLoadState()` before continuing |

## Example: Device Quantity Test

```bash
# 1. Launch codegen
HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com

# 2. Login, navigate to devices, interact with + button
# Codegen captures:
# await page.getByRole('button', { name: '+' }).click();

# 3. Extract selector and add to Page Object:
async addDeviceQuantity(deviceName, count) {
  const heading = this.page.getByRole('heading', { name: deviceName, level: 6 });
  const plusBtn = heading.locator('..').locator('button', { hasText: '+' });
  for (let i = 0; i < count; i++) {
    await plusBtn.click();
  }
}

# 4. Write test:
test('TC-DEVICE-002 | Increment device quantity', async () => {
  await module.addDeviceQuantity('NFC Tags', 3);
  const qty = await module.getDeviceQuantity('NFC Tags');
  expect(qty).toBe(3);
});
```

## When to Use Codegen

✅ **Use codegen when:**
- Selectors are unknown or page structure is unclear
- Testing new feature for first time
- Element selectors keep breaking in tests
- Need to verify timing/waits

❌ **Skip codegen when:**
- Page Object methods already exist
- Selectors are documented in Page Objects
- Writing similar test to existing pattern

---

**Pro Tip:** Always commit codegen findings! Update memory/docs with discovered selectors so future tests don't repeat exploration.
