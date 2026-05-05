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

function readCreatedCompanyName() {
  return readState().createdCompanyName || '';
}

function writeCreatedCompanyName(createdCompanyName) {
  const current = readState();
  writeState({
    ...current,
    createdCompanyName,
  });
}

function readCreatedPropertyName() {
  return readState().createdPropertyName || '';
}

function writeCreatedPropertyName(createdPropertyName) {
  const current = readState();
  writeState({
    ...current,
    createdPropertyName,
  });
}

function readCreatedPropertyCompanyName() {
  return readState().createdPropertyCompanyName || '';
}

function writeCreatedPropertyCompanyName(createdPropertyCompanyName) {
  const current = readState();
  writeState({
    ...current,
    createdPropertyCompanyName,
  });
}

function readCreatedPropertyPath() {
  return readState().createdPropertyPath || '';
}

function writeCreatedPropertyPath(createdPropertyPath) {
  const current = readState();
  writeState({
    ...current,
    createdPropertyPath,
  });
}

function readCreatedContactName() {
  return readState().createdContactName || '';
}

function writeCreatedContactName(createdContactName) {
  const current = readState();
  writeState({
    ...current,
    createdContactName,
  });
}

module.exports = {
  readCreatedCompanyName,
  writeCreatedCompanyName,
  readCreatedPropertyName,
  writeCreatedPropertyName,
  readCreatedPropertyPath,
  writeCreatedPropertyPath,
  readCreatedPropertyCompanyName,
  writeCreatedPropertyCompanyName,
  readCreatedContactName,
  writeCreatedContactName,
  readCreatedDealName,
  writeCreatedDealName,
};
