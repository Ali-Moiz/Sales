// @ts-check

"use strict";

const { expect } = require("@playwright/test");
const { ContractModule } = require("../pages/contract-module");

const parseMoneyValue = (page, valueText) => {
  void page;
  if (!valueText) return null;
  const normalized = String(valueText).replace(/[^0-9.-]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseFirstCurrencyFromText = (page, valueText) => {
  if (!valueText) return null;
  const match = String(valueText).match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  return match ? parseMoneyValue(page, match[1]) : null;
};

const readGrandTotalValue = async (page, contractModule) => {
  const summaryHeading = page
    .getByRole("heading", {
      name: /USD\s*[\d,]+(?:\.\d{1,2})?\s*(Weekly|Monthly|Yearly)?/i,
    })
    .first();
  const summaryVisible = await summaryHeading.isVisible().catch(() => false);
  if (summaryVisible) {
    const summaryText = await summaryHeading.textContent().catch(() => "");
    const parsedFromSummary = parseFirstCurrencyFromText(page, summaryText);
    if (parsedFromSummary !== null) return parsedFromSummary;
  }

  const raw = await contractModule.getGrandTotal().catch(() => null);
  return parseMoneyValue(page, raw);
};

const readVisibleServiceAmounts = async (page) => {
  const rowTexts = await page.locator("p").allTextContents().catch(() => []);
  const amounts = rowTexts
    .map((text) => {
      if (!/\$\s*[\d,]+(?:\.\d{1,2})?\s*\/\s*(Weekly|Monthly|Yearly)/i.test(text)) {
        return null;
      }
      return parseFirstCurrencyFromText(page, text);
    })
    .filter((value) => value !== null);
  return amounts;
};

const resolveCheckbox = async (page, nameRegex) => {
  const checkbox = page.getByRole("checkbox", { name: nameRegex }).first();
  const visible = await checkbox.isVisible().catch(() => false);
  return visible ? checkbox : null;
};

const scrollUntilVisible = async (page, locator, label, maxScrolls = 20) => {
  const contractModule = new ContractModule(page);
  return contractModule.scrollUntilVisible(locator, label, maxScrolls);
};

const resolveCheckboxFromLabel = async (page, labelRegex, labelTextForLogs) => {
  const isAdditionalServiceToggle = /visitor management|load management/i.test(
    labelTextForLogs,
  );
  if (isAdditionalServiceToggle) {
    const additionalServicesHeading = page.getByText(/Additional Services/i).first();
    for (let i = 0; i < 6; i += 1) {
      const headingVisible = await additionalServicesHeading
        .isVisible()
        .catch(() => false);
      if (headingVisible) break;
      await page.mouse.wheel(0, 900).catch(() => {});
      await page.waitForTimeout(200);
    }
    const headingVisible = await additionalServicesHeading
      .isVisible()
      .catch(() => false);
    if (headingVisible) {
      const additionalServicesSection = page
        .locator("div")
        .filter({ hasText: /Additional Services/i })
        .filter({ has: page.getByRole("checkbox") })
        .first();
      const directRow = additionalServicesSection
        .locator("div")
        .filter({ hasText: labelRegex })
        .first();
      const directRoleCheckbox = directRow.getByRole("checkbox").first();
      if (await directRoleCheckbox.isVisible().catch(() => false)) {
        return directRoleCheckbox;
      }
      const sectionCheckboxes = additionalServicesSection.getByRole("checkbox");
      const sectionCheckboxCount = await sectionCheckboxes.count().catch(() => 0);
      if (sectionCheckboxCount >= 2) {
        const index = /visitor management/i.test(labelTextForLogs) ? 0 : 1;
        return sectionCheckboxes.nth(index);
      }
    }
  }

  const labelNode = page.getByText(labelRegex).first();
  await scrollUntilVisible(page, labelNode, `${labelTextForLogs} label`);
  const rowWithCheckbox = page
    .locator("div")
    .filter({ hasText: labelTextForLogs })
    .filter({ has: page.locator('input[type="checkbox"]') })
    .first();
  const checkbox = rowWithCheckbox.locator('input[type="checkbox"]').first();
  const checkboxVisible = await checkbox.isVisible().catch(() => false);
  return checkboxVisible ? checkbox : null;
};

const toggleLabelBasedCheckbox = async (
  page,
  labelRegex,
  labelText,
  targetChecked,
) => {
  const labelNode = page.getByText(labelRegex).first();
  const checkbox = await resolveCheckboxFromLabel(page, labelRegex, labelText);

  if (checkbox) {
    if (targetChecked) {
      await checkbox.check().catch(async () => {
        await checkbox.click({ force: true });
      });
      await expect(checkbox).toBeChecked({ timeout: 6_000 });
    } else {
      await checkbox.uncheck().catch(async () => {
        await checkbox.click({ force: true });
      });
      await expect(checkbox).not.toBeChecked({ timeout: 6_000 });
    }
    return;
  }

  await labelNode.click({ force: true });
  const ariaCheckedState = await labelNode
    .evaluate((el) => {
      const container = el.closest("[aria-checked]");
      return container ? container.getAttribute("aria-checked") : null;
    })
    .catch(() => null);
  // eslint-disable-next-line no-console
  console.log(
    `[TC-CONTRACT-031] ${labelText} toggled via label click; aria-checked=${ariaCheckedState}`,
  );
};

module.exports = {
  parseMoneyValue,
  parseFirstCurrencyFromText,
  readGrandTotalValue,
  readVisibleServiceAmounts,
  resolveCheckbox,
  scrollUntilVisible,
  resolveCheckboxFromLabel,
  toggleLabelBasedCheckbox,
};
