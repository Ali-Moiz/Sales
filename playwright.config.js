const { defineConfig, devices } = require("@playwright/test");
require("./utils/load-env");

const baseURL = process.env.BASE_URL || "https://uat.sales.teamsignal.com";
const headless = (process.env.HEADLESS || "false").toLowerCase() === "true";

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
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
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
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
