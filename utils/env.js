const env = {
  baseUrl: process.env.BASE_URL || 'https://playwright.dev',
  headless: (process.env.HEADLESS || 'true').toLowerCase() === 'true'
};

module.exports = { env };
