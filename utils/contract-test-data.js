// utils/contract-test-data.js
//
// Central test-data resolver for the Contract Module suite.
//
// Priority order for every value:
//   1. data/test-data.json   — project-level defaults (edit once, applies everywhere)
//   2. Hard-coded fallback   — only used if JSON is somehow missing
//
// Dynamic dates
//   Dates are calculated from TODAY so the suite never fails just because a
//   hardcoded date is in the past.  Offsets are defined in test-data.json under
//   contract.proposal.startDateOffsetDays / renewalDateOffsetDays.

'use strict';

const rawData = (() => {
  try {
    return require('../data/test-data.json');
  } catch {
    return {};
  }
})();

const cd = rawData.contract || {};

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Format a Date object as MM/DD/YYYY (the format the app accepts).
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Return a new Date that is `days` calendar days after `base`.
 * @param {Date}   base
 * @param {number} days
 * @returns {Date}
 */
function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const today = new Date();

// ── Deal name ─────────────────────────────────────────────────────────────────

const e2eDealName = cd.e2eDealName;

// ── Proposal data ─────────────────────────────────────────────────────────────

const startOffsetDays   = cd.proposal?.startDateOffsetDays   ?? 1;
const renewalOffsetDays = cd.proposal?.renewalDateOffsetDays ?? 7;

const PROPOSAL_DATA = {
  startDate:   formatDate(addDays(today, startOffsetDays)),
  renewalDate: formatDate(addDays(today, renewalOffsetDays)),
  timeZone:    cd.proposal?.timeZone || 'Eastern',
};

// ── Service data ──────────────────────────────────────────────────────────────

const SERVICE_DATA = {
  serviceName:  cd.service?.serviceName  || 'PAT Automation Service 1',
  officerCount: cd.service?.officerCount || '1',
  hourlyRate:   cd.service?.hourlyRate   || '15',
  jobDays:      cd.service?.jobDays      ?? ['Mon'],
  startTime:    cd.service?.startTime    ?? { hours: '08', minutes: '00', meridiem: 'AM' },
  endTime:      cd.service?.endTime      ?? { hours: '05', minutes: '00', meridiem: 'PM' },
};

// ── Payment data ──────────────────────────────────────────────────────────────

const PAYMENT_DATA = {
  annualRateIncrease: cd.payment?.annualRateIncrease || '3',
  billingType:        cd.payment?.billingType        || 'Pre Bill',
  contractType:       cd.payment?.contractType       || 'Ongoing',
  billingFrequency:   cd.payment?.billingFrequency   || 'Weekly',
  paymentTerms:       cd.payment?.paymentTerms       || 'Net 30',
  paymentMethod:      cd.payment?.paymentMethod      || 'Bank Transfer',
  cycleRefDay:        cd.payment?.cycleRefDay        || '25',

  billingContact: {
    firstName: cd.payment?.billingContact?.firstName || 'PAT Test',
    lastName:  cd.payment?.billingContact?.lastName  || 'PAT Automation',
    email:     cd.payment?.billingContact?.email     || 'test.automation@example.com',
    phone:     cd.payment?.billingContact?.phone     || '+15551234567',
  },
};

// ── Publish data ──────────────────────────────────────────────────────────────

const PUBLISH_DATA = {
  closeStatus:  cd.publish?.closeStatus  || 'Closed Won',
  hubspotStage: cd.publish?.hubspotStage || 'Closed Won (Sales Pipeline)',
};

// ── Export ────────────────────────────────────────────────────────────────────

module.exports = {
  e2eDealName,
  PROPOSAL_DATA,
  SERVICE_DATA,
  PAYMENT_DATA,
  PUBLISH_DATA,
};
