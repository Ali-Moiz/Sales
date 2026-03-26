require('dotenv').config({ quiet: true });

const credentials = {
  baseUrl: (process.env.BASE_URL || 'https://proud-desert-02abf6a10.1.azurestaticapps.net').replace(/\/$/, ''),
  email: process.env.SIGNAL_EMAIL || '',
  password: process.env.SIGNAL_PASSWORD || ''
};

module.exports = { credentials };
