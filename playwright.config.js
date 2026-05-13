const { defineConfig, devices } = require('@playwright/test');
require('./utils/auth/load-env');
const { resolvePlaywrightTimeouts } = require('./utils/playwright-timeouts');


const baseURL = process.env.BASE_URL || "https://uat.sales.teamsignal.com";
const headless = (process.env.HEADLESS || "false").toLowerCase() === "true";
const playwrightTimeouts = resolvePlaywrightTimeouts();

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: playwrightTimeouts.test,
  expect: {
    timeout: playwrightTimeouts.expect,
  },
  reporter: [
    ['json'],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["junit", { outputFile: "reports/junit/results.xml" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    headless,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: playwrightTimeouts.action,
    navigationTimeout: playwrightTimeouts.navigation,
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
});
