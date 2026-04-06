const env = {
  baseUrl: process.env.BASE_URL || 'https://uat.sales.teamsignal.com',
  headless: (process.env.HEADLESS || 'true').toLowerCase() === 'true'
};

module.exports = { env };
