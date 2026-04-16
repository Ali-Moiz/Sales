const { env } = require("../env");
const {
  enableSliderImageBlocking,
  disableSliderImageBlocking,
} = require("./slider-image-blocker");

async function gotoBaseUrl(page) {
  const homeUrl = `${env.baseUrl}/`;

  const domLoaded = await page
    .goto(homeUrl, { waitUntil: "domcontentloaded", timeout: 60_000 })
    .then(() => true)
    .catch(() => false);

  if (domLoaded) {
    return;
  }

  const committed = await page
    .goto(homeUrl, { waitUntil: "commit", timeout: 60_000 })
    .then(() => true)
    .catch(() => false);

  if (committed) {
    await page
      .waitForLoadState("domcontentloaded", { timeout: 20_000 })
      .catch(() => {});
    return;
  }

  await page.goto(`${env.baseUrl}/login`, {
    waitUntil: "commit",
    timeout: 60_000,
  });
  await page
    .waitForLoadState("domcontentloaded", { timeout: 20_000 })
    .catch(() => {});
}

async function performLoginAttempt(page) {
  await enableSliderImageBlocking(page);

  try {
    await gotoBaseUrl(page);

    const loginCandidates = [
      page.getByRole("button", { name: /^Login$/i }).first(),
      page.getByText("Login", { exact: true }).first(),
    ];

    for (const candidate of loginCandidates) {
      await Promise.allSettled([
        page.waitForURL(/auth0\.com|\/app\/sales\//, { timeout: 7_000 }),
        candidate.click({ force: true }),
      ]);
      if (/auth0\.com|\/app\/sales\//.test(page.url())) break;
    }

    const appEmail = page.getByPlaceholder("Enter your Email");
    const appPassword = page.getByPlaceholder("Enter your Password");
    const appLogIn = page.getByRole("button", { name: "Log In" });
    const appError = page.locator("p.invalid-feedback").first();

    const waitForAppShell = async (timeout) => {
      await Promise.any([
        page.waitForURL(/\/app\/sales\//, { timeout, waitUntil: "commit" }),
        page.waitForFunction(
          () => window.location.pathname.includes("/app/sales/"),
          null,
          { timeout },
        ),
      ]).catch(() => {});
    };

    if (
      !/auth0\.com/.test(page.url()) &&
      !/\/app\/sales\//.test(page.url()) &&
      !(await appEmail.isVisible().catch(() => false))
    ) {
      await page
        .goto(`${env.baseUrl}/login`, { waitUntil: "domcontentloaded" })
        .catch(() => {});
    }

    if (await appEmail.isVisible().catch(() => false)) {
      await appEmail.fill(env.email);
      await appPassword.fill(env.password);

      const submitAttempts = [
        async () => appLogIn.click(),
        async () => appLogIn.click({ force: true }),
        async () => appPassword.press("Enter"),
      ];

      for (const submit of submitAttempts) {
        await Promise.allSettled([waitForAppShell(15_000), submit()]);

        if (/auth0\.com|\/app\/sales\//.test(page.url())) break;
        if (await appError.isVisible({ timeout: 1_500 }).catch(() => false))
          break;
      }
    }

    const auth0User = page
      .locator('input[name="username"], input[type="email"]')
      .first();
    const auth0Pass = page
      .locator('input[name="password"], input[type="password"]')
      .first();
    const auth0Submit = page
      .locator('button[type="submit"], button[name="action"]')
      .first();

    if (
      /auth0\.com/.test(page.url()) ||
      (await auth0User.isVisible().catch(() => false))
    ) {
      await auth0User.fill(env.email);
      await auth0Pass.fill(env.password);
      if (/auth0\.com/.test(page.url())) {
        const authSubmitAttempts = [
          async () => auth0Submit.click({ timeout: 5_000 }),
          async () => auth0Pass.press("Enter"),
        ];

        for (const submit of authSubmitAttempts) {
          await submit().catch(() => {});
          await waitForAppShell(20_000);
          if (/\/app\/sales\//.test(page.url())) break;
        }
      }
    }

    await waitForAppShell(60_000);

    if (!/\/app\/sales\//.test(page.url())) {
      const appErrorText = await appError.textContent().catch(() => "");
      throw new Error(
        `Login did not reach app shell. Current URL: ${page.url()}${appErrorText ? ` | App error: ${appErrorText.trim()}` : ""}`,
      );
    }

    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
  } finally {
    await disableSliderImageBlocking(page);
  }
}

async function performLogin(page, { attempts = 2, loginCredentials } = {}) {
  const creds = loginCredentials || env;
  if (!creds?.email || !creds?.password) {
    throw new Error(
      "Login credentials are required. Set SIGNAL_EMAIL_HO/SIGNAL_PASSWORD_HO or pass loginCredentials.",
    );
  }

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await performLoginAttempt(page, creds);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;

      await gotoBaseUrl(page).catch(() => {});
      await page.waitForTimeout(2_000);
    }
  }

  throw lastError;
}

module.exports = { performLogin };
