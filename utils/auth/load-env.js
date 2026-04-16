const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '../..');
const envName = (process.env.ENV_NAME || 'uat').trim().toLowerCase();

const envFile = path.join(repoRoot, `.env.${envName}`);

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile, override: false, quiet: true });
} else {
  throw new Error(`Environment file .env.${envName} not found. Set ENV_NAME to a valid environment (uat, prod).`);
}

const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
const headless = (process.env.HEADLESS || 'true').toLowerCase() === 'true';

console.log(`\nENV_NAME: ${envName}`);
console.log(`Base URL: ${baseUrl}`);
console.log(`Headless mode: ${headless}\n`);

module.exports = { envName };
