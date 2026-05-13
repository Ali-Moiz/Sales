const { readCreatedPropertyName, readCreatedPropertyPath } = require('./shared-run-state');

const DEFAULT_COMPANY_NAME = 'PAT';

// ── Activity log regression fixtures ─────────────────────────────────────────
// Resolved at runtime from the property created during the test run (shared-run-state).
// Throws if no property path was recorded — the creation suite must run first.
function resolveActivityRegressionProperty() {
  const name = readCreatedPropertyName();
  const path = readCreatedPropertyPath();
  if (!name || !path) {
    throw new Error(
      'No property was found in shared run state. ' +
      'Ensure the property creation suite has run before the activity log suite.'
    );
  }
  return { name, path };
}

async function resolvePropertyCompanyName() {
  return DEFAULT_COMPANY_NAME;
}

module.exports = {
  DEFAULT_COMPANY_NAME,
  resolvePropertyCompanyName,
  resolveActivityRegressionProperty,
};
