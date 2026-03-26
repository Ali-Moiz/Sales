'use strict';

const fs = require('fs');
const path = require('path');

const stateDir = path.join(__dirname, '..', '.tmp');
const stateFile = path.join(stateDir, 'shared-run-state.json');

function ensureStateDir() {
  fs.mkdirSync(stateDir, { recursive: true });
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(nextState) {
  ensureStateDir();
  fs.writeFileSync(stateFile, JSON.stringify(nextState, null, 2));
}

function readCreatedDealName() {
  return readState().createdDealName || '';
}

function writeCreatedDealName(createdDealName) {
  const current = readState();
  writeState({
    ...current,
    createdDealName,
  });
}

module.exports = {
  readCreatedDealName,
  writeCreatedDealName,
};
