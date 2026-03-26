const { test, expect } = require('@playwright/test');
const { CompanyModule } = require('../../pages/company-module');

let page;
let context;
let companyModule;

async function safeFill(locator, value) {
  try {
    await locator.fill(value, { timeout: 5_000 });
    return true;
  } catch (_) {}
  try {
    await locator.click({ timeout: 2_000 });
    await locator.press('Meta+a').catch(() => {});
    await locator.type(value, { delay: 20 });
    return true;
  } catch (_) {
    return false;
  }
}

async function resolveCreatedCompanyId(page, companyName) {
  const extractId = (url) => {
    const match = url.match(/\/company\/([^/?#]+)/);
    return match ? match[1] : null;
  };

  await page.locator('#outlined-search').fill(companyName).catch(async () => {
    await page.getByRole('textbox', { name: /search/i }).first().fill(companyName).catch(() => {});
  });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(2_000);

  const firstRow = page.locator('table tbody tr td:first-child').first();
  if (!(await firstRow.isVisible({ timeout: 5_000 }).catch(() => false))) return null;
  const startUrl = page.url();
  await firstRow.click({ force: true }).catch(() => {});
  await page.waitForTimeout(2_000);
  return page.url() !== startUrl ? extractId(page.url()) : null;
}

test.describe('Company Creation - Capture Name', () => {
  test.setTimeout(300_000);

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    companyModule = new CompanyModule(page);
    await companyModule.login();
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('TC-CREATE-001: Create a new company and capture its name', async () => {
    await companyModule.goToCompaniesFromMenu();
    await page.waitForSelector('button:has-text("Create Company")', { timeout: 20_000 });

    const runId = Date.now();
    const companyName = `Automation ${runId}`;
    const streetNum = 1000 + (runId % 7000);
    const companyAddress = `${streetNum} Farnam St, Omaha, NE`;

    console.log('=== COMPANY NAME TO BE CREATED: ' + companyName + ' ===');
    console.log('=== ADDRESS: ' + companyAddress + ' ===');

    // Intercept API to capture company ID
    let capturedCompanyId = null;
    const onResponse = async (response) => {
      try {
        if (capturedCompanyId) return;
        if (response.request().method() !== 'POST') return;
        if (response.status() < 200 || response.status() >= 300) return;
        if (!response.url().toLowerCase().includes('compan')) return;
        const body = await response.json().catch(() => null);
        if (!body) return;
        const id = body._id || body.id || body.companyId ||
                   body?.data?._id || body?.data?.id ||
                   body?.company?._id || body?.company?.id;
        if (id && String(id).length >= 4) capturedCompanyId = String(id);
      } catch {}
    };
    page.on('response', onResponse);

    let modalClosed = false;
    let createError = null;
    try {
      const { selectedMarketVertical } = await companyModule.createCompany({ companyName, companyAddress });
      modalClosed = true;
      console.log('=== SELECTED MARKET VERTICAL: ' + selectedMarketVertical + ' ===');
    } catch (error) {
      createError = error;
      console.log('=== CREATE ERROR: ' + error.message + ' ===');
      await page.keyboard.press('Escape').catch(() => {});
    }

    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    page.off('response', onResponse);

    if (!capturedCompanyId) {
      capturedCompanyId = await resolveCreatedCompanyId(page, companyName);
    }

    console.log('=== MODAL CLOSED: ' + modalClosed + ' ===');
    console.log('=== CAPTURED COMPANY ID: ' + (capturedCompanyId || 'not captured') + ' ===');
    console.log('=== FINAL COMPANY NAME: ' + companyName + ' ===');

    if (createError) {
      throw new Error(`Create Company success path is blocked in current browser state: ${createError.message}`);
    }
    expect(modalClosed).toBeTruthy();
    console.log('\n========================================');
    console.log('COMPANY SUCCESSFULLY CREATED:');
    console.log('  Name: ' + companyName);
    console.log('  ID:   ' + (capturedCompanyId || 'see app'));
    console.log('========================================\n');
  });
});
