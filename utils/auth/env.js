const { envName } = require('./load-env');

const env = {
  baseUrl: (process.env.BASE_URL || 'https://uat.sales.teamsignal.com').replace(/\/$/, ''),
  email: process.env.SIGNAL_EMAIL || '',
  password: process.env.SIGNAL_PASSWORD || '',
  headless: (process.env.HEADLESS || 'true').toLowerCase() === 'true',
  envName
};

module.exports = { env };
