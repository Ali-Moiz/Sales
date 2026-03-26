// utils/contract-test-data.js
//
// Central test-data resolver for the Contract Module suite.
//
// Priority order for every value:
//   1. Environment variable  — CI / runner override
//   2. data/test-data.json   — project-level defaults (edit once, applies everywhere)
//   3. Hard-coded fallback   — only used if JSON is somehow missing
//
// Dynamic dates
//   Dates are calculated from TODAY so the suite never fails just because a
//   hardcoded date is in the past.  Offsets are defined in test-data.json under
//   contract.proposal.startDateOffsetDays / renewalDateOffsetDays.
//
// Environment variables accepted
// ─────────────────────────────────────────────────────────────────
//  CONTRACT_E2E_DEAL      Deal name to run E2E suite against
//  CREATED_DEAL_NAME      Populated automatically in a full pipeline run
//  CONTRACT_START_DATE    Override start date (MM/DD/YYYY)
//  CONTRACT_RENEWAL_DATE  Override renewal date (MM/DD/YYYY)
//  SERVICE_NAME           Override service name
//  OFFICER_COUNT          Override officer/guard count
//  HOURLY_RATE            Override hourly rate
//  JOB_DAYS               Comma-separated day abbreviations e.g. "Mon,Wed"
//  ANNUAL_RATE            Override annual rate increase %
//  BILLING_TYPE           Override billing type
//  CONTRACT_TYPE          Override contract type
//  BILLING_FREQ           Override billing frequency
//  PAYMENT_TERMS          Override payment terms
//  PAYMENT_METHOD         Override payment method
//  CYCLE_REF_DAY          Override billing cycle reference day
//  BILLING_FIRST_NAME     Override billing contact first name
//  BILLING_LAST_NAME      Override billing contact last name
//  BILLING_EMAIL          Override billing contact email
//  BILLING_PHONE          Override billing contact phone
//  CLOSE_STATUS           Override deal close status  (e.g. "Closed Won")
//  HUBSPOT_STAGE          Override Hubspot stage label

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

const e2eDealName =
  process.env.CONTRACT_E2E_DEAL  ||
  process.env.CREATED_DEAL_NAME  ||
  (cd.e2eDealName ?? 'Regression Phase 2');

// ── Proposal data ─────────────────────────────────────────────────────────────

const startOffsetDays   = cd.proposal?.startDateOffsetDays   ?? 1;
const renewalOffsetDays = cd.proposal?.renewalDateOffsetDays ?? 7;

const PROPOSAL_DATA = {
  startDate:   process.env.CONTRACT_START_DATE   || formatDate(addDays(today, startOffsetDays)),
  renewalDate: process.env.CONTRACT_RENEWAL_DATE || formatDate(addDays(today, renewalOffsetDays)),
  timeZone:    process.env.CONTRACT_TIME_ZONE    || cd.proposal?.timeZone || 'Eastern',
};

// ── Service data ──────────────────────────────────────────────────────────────

const SERVICE_DATA = {
  serviceName:  process.env.SERVICE_NAME   || cd.service?.serviceName  || 'Automation Service 1',
  officerCount: process.env.OFFICER_COUNT  || cd.service?.officerCount || '1',
  hourlyRate:   process.env.HOURLY_RATE    || cd.service?.hourlyRate   || '15',

  // JOB_DAYS env var: comma-separated abbreviations, e.g. "Mon,Wed,Fri"
  jobDays: process.env.JOB_DAYS
    ? process.env.JOB_DAYS.split(',').map((d) => d.trim())
    : (cd.service?.jobDays ?? ['Mon']),

  // Time objects are only overridable via JSON (not worth splitting into 6 env vars)
  startTime: cd.service?.startTime ?? { hours: '08', minutes: '00', meridiem: 'AM' },
  endTime:   cd.service?.endTime   ?? { hours: '05', minutes: '00', meridiem: 'PM' },
};

// ── Payment data ──────────────────────────────────────────────────────────────

const PAYMENT_DATA = {
  annualRateIncrease: process.env.ANNUAL_RATE      || cd.payment?.annualRateIncrease || '3',
  billingType:        process.env.BILLING_TYPE     || cd.payment?.billingType        || 'Pre Bill',
  contractType:       process.env.CONTRACT_TYPE    || cd.payment?.contractType       || 'Ongoing',
  billingFrequency:   process.env.BILLING_FREQ     || cd.payment?.billingFrequency   || 'Weekly',
  paymentTerms:       process.env.PAYMENT_TERMS    || cd.payment?.paymentTerms       || 'Net 30',
  paymentMethod:      process.env.PAYMENT_METHOD   || cd.payment?.paymentMethod      || 'Bank Transfer',
  cycleRefDay:        process.env.CYCLE_REF_DAY    || cd.payment?.cycleRefDay        || '25',

  billingContact: {
    firstName: process.env.BILLING_FIRST_NAME || cd.payment?.billingContact?.firstName || 'Test',
    lastName:  process.env.BILLING_LAST_NAME  || cd.payment?.billingContact?.lastName  || 'Automation',
    email:     process.env.BILLING_EMAIL      || cd.payment?.billingContact?.email     || 'test.automation@example.com',
    phone:     process.env.BILLING_PHONE      || cd.payment?.billingContact?.phone     || '+15551234567',
  },
};

// ── Publish data ──────────────────────────────────────────────────────────────

const PUBLISH_DATA = {
  closeStatus:  process.env.CLOSE_STATUS  || cd.publish?.closeStatus  || 'Closed Won',
  hubspotStage: process.env.HUBSPOT_STAGE || cd.publish?.hubspotStage || 'Closed Won (Sales Pipeline)',
};

// ── Export ────────────────────────────────────────────────────────────────────

module.exports = {
  e2eDealName,
  PROPOSAL_DATA,
  SERVICE_DATA,
  PAYMENT_DATA,
  PUBLISH_DATA,
};
