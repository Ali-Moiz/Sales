const { test: base, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');

const test = base.extend({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  }
});

module.exports = { test, expect };
