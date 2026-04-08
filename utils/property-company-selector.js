const readline = require('readline');

const DEFAULT_COMPANY_NAME = 'Regression Phase';

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

async function resolvePropertyCompanyName() {
  const explicitCompanyName = (process.env.PROPERTY_TEST_COMPANY || '').trim();
  if (explicitCompanyName) {
    return explicitCompanyName;
  }

  const mode = (process.env.PROPERTY_COMPANY_MODE || '').trim().toLowerCase();
  if (mode === 'hardcoded' || mode === 'existing') {
    process.env.PROPERTY_TEST_COMPANY = DEFAULT_COMPANY_NAME;
    return DEFAULT_COMPANY_NAME;
  }

  if (mode === 'new' || mode === 'custom') {
    const customName = (process.env.PROPERTY_CUSTOM_COMPANY_NAME || '').trim();
    if (!customName) {
      throw new Error('PROPERTY_CUSTOM_COMPANY_NAME is required when PROPERTY_COMPANY_MODE=new.');
    }

    process.env.PROPERTY_TEST_COMPANY = customName;
    return customName;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.env.PROPERTY_TEST_COMPANY = DEFAULT_COMPANY_NAME;
    return DEFAULT_COMPANY_NAME;
  }

  const selection = await ask(
    `Select company option for Property suite:\n` +
    `1. Hardcoded company (${DEFAULT_COMPANY_NAME})\n` +
    `2. New company name\n` +
    `Enter choice [1/2]: `
  );

  if (selection === '2' || selection.toLowerCase() === 'new') {
    const customName = await ask('Enter company name for Property suite: ');
    if (!customName) {
      process.env.PROPERTY_TEST_COMPANY = DEFAULT_COMPANY_NAME;
      return DEFAULT_COMPANY_NAME;
    }

    process.env.PROPERTY_TEST_COMPANY = customName;
    return customName;
  }

  process.env.PROPERTY_TEST_COMPANY = DEFAULT_COMPANY_NAME;
  return DEFAULT_COMPANY_NAME;
}

module.exports = {
  DEFAULT_COMPANY_NAME,
  resolvePropertyCompanyName
};
