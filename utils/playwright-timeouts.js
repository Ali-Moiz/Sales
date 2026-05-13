const DEFAULT_BASE_TIMEOUT = 500;

function parseBaseTimeout(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BASE_TIMEOUT;
}

const TIMEOUTS = {
  BASE: parseBaseTimeout(process.env.BASE_TIMEOUT),
};

function resolvePlaywrightTimeouts() {
  return {
    test: TIMEOUTS.BASE * 1200,
    expect: TIMEOUTS.BASE * 20,
    action: TIMEOUTS.BASE * 30,
    navigation: TIMEOUTS.BASE * 60,
  };
}

module.exports = {
  DEFAULT_BASE_TIMEOUT,
  TIMEOUTS,
  resolvePlaywrightTimeouts,
};
