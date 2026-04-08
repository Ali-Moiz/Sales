const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '..');
const requestedEnv = (process.env.TEST_ENV || '').trim().toLowerCase();
const normalizedEnv = requestedEnv === 'prod' || requestedEnv === 'production'
  ? 'prod'
  : requestedEnv === 'uat'
    ? 'uat'
    : '';

const candidateFiles = normalizedEnv
  ? [`.env.${normalizedEnv}`, '.env']
  : ['.env'];

for (const fileName of candidateFiles) {
  const filePath = path.join(repoRoot, fileName);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  dotenv.config({
    path: filePath,
    override: false,
    quiet: true
  });

  break;
}

const resolvedEnv = normalizedEnv || (
  (process.env.BASE_URL || '').includes('sales.teamsignal.com') &&
  !(process.env.BASE_URL || '').includes('uat.sales.teamsignal.com')
    ? 'prod'
    : 'uat'
);

process.env.TEST_ENV = resolvedEnv;

module.exports = {
  testEnv: resolvedEnv
};
