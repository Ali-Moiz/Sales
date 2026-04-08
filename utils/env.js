require('./load-env');

const env = {
  baseUrl: process.env.BASE_URL || 'https://uat.sales.teamsignal.com',
  headless: (process.env.HEADLESS || 'true').toLowerCase() === 'true',
  testEnv: process.env.TEST_ENV || 'uat'
};

module.exports = { env };
