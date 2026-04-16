#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '..');
const playwrightBin = require.resolve('@playwright/test/cli');
const envFilePath = path.join(repoRoot, '.env');

dotenv.config({ path: envFilePath, override: false, quiet: true });

const isRunnerDebug = (process.env.PW_RUNNER_DEBUG || '').trim() === '1';
function runnerLog(message) {
  if (isRunnerDebug) {
    console.log(`[run-playwright] ${message}`);
  }
}

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

  const existingNodeOptions = (process.env.NODE_OPTIONS || '').trim();
  const hasOldSpace = /--max-old-space-size(=|\s)\d+/i.test(existingNodeOptions);
  const hasSemiSpace = /--max-semi-space-size(=|\s)\d+/i.test(existingNodeOptions);
  const safeHeapOptions = [
    hasOldSpace ? '' : '--max-old-space-size=4096',
    hasSemiSpace ? '' : '--max-semi-space-size=128'
  ].filter(Boolean).join(' ');
  process.env.NODE_OPTIONS = [existingNodeOptions, safeHeapOptions].filter(Boolean).join(' ').trim();
  runnerLog(`TEST_ENV=${process.env.TEST_ENV}`);
  runnerLog(`NODE_OPTIONS=${process.env.NODE_OPTIONS}`);

  // Use async spawn instead of spawnSync. On Windows, spawnSync waits for the
  // entire process tree (including Chrome grandchild processes) which causes the
  // terminal to hang long after Playwright has finished.
  const child = spawn(
    process.execPath,
    [playwrightBin, 'test', ...process.argv.slice(2)],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
      detached: false,
    }
  );

  child.on('error', (err) => {
    console.error('[run-playwright] Failed to start Playwright child process:', err);
    process.exit(1);
  });

  child.on('close', (code, signal) => {
    runnerLog(`Child finished (code=${code}, signal=${signal || 'none'})`);
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
