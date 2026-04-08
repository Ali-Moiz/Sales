#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const repoRoot = path.resolve(__dirname, '..');
const playwrightBin = require.resolve('@playwright/test/cli');

function resolveEnvSelection(rawValue) {
  const value = (rawValue || '').trim().toLowerCase();

  if (value === '1' || value === 'uat') {
    return 'uat';
  }

  if (value === '2' || value === 'prod' || value === 'production') {
    return 'prod';
  }

  return '';
}

function promptForEnv() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Select environment: [1] UAT  [2] Prod : ', (answer) => {
      rl.close();
      resolve(resolveEnvSelection(answer) || 'uat');
    });
  });
}

async function main() {
  const explicitEnv = resolveEnvSelection(process.env.TEST_ENV);
  const selectedEnv = explicitEnv || (
    process.stdin.isTTY && process.stdout.isTTY
      ? await promptForEnv()
      : 'uat'
  );

  process.env.TEST_ENV = selectedEnv;

  const child = spawn(
    process.execPath,
    [playwrightBin, 'test', ...process.argv.slice(2)],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env
    }
  );

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
