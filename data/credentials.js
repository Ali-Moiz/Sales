require('dotenv').config({ quiet: true });

const credentials = {
  baseUrl: (process.env.BASE_URL || 'https://uat.sales.teamsignal.com').replace(/\/$/, ''),
  email: process.env.SIGNAL_EMAIL || '',
  password: process.env.SIGNAL_PASSWORD || ''
};

module.exports = { credentials };
