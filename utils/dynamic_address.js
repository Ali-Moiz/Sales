"use strict";

const CITY_STATE_POOL = [
  { city: "Omaha", state: "NE", zip: "68131" },
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Phoenix", state: "AZ", zip: "85004" },
  { city: "Nashville", state: "TN", zip: "37203" },
  { city: "Tampa", state: "FL", zip: "33602" },
  { city: "Charlotte", state: "NC", zip: "28202" },
  { city: "Columbus", state: "OH", zip: "43215" },
  { city: "Denver", state: "CO", zip: "80203" },
  { city: "Atlanta", state: "GA", zip: "30303" },
  { city: "Kansas City", state: "MO", zip: "64106" },
];

const STREET_NAME_POOL = [
  "Main",
  "Oak",
  "Pine",
  "Maple",
  "Cedar",
  "Lake",
  "Hill",
  "Washington",
  "Lincoln",
  "Market",
  "Broadway",
  "Sunset",
  "Ridge",
  "Park",
  "Madison",
];

const STREET_SUFFIX_POOL = ["St", "Ave", "Blvd", "Rd", "Dr", "Ln", "Way"];
const ADDRESS_AUTOCOMPLETE_DEBUG =
  String(process.env.ADDRESS_AUTOCOMPLETE_DEBUG || "false").toLowerCase() === "true";

function toUniqueAddress(seedOffset = 0) {
  const now = Date.now() + seedOffset;
  const cityState = CITY_STATE_POOL[now % CITY_STATE_POOL.length];
  const streetName = STREET_NAME_POOL[(now + 7) % STREET_NAME_POOL.length];
  const suffix = STREET_SUFFIX_POOL[(now + 11) % STREET_SUFFIX_POOL.length];
  const houseNumber = 1000 + (now % 8000);
  return `${houseNumber} ${streetName} ${suffix}, ${cityState.city}, ${cityState.state} ${cityState.zip}`;
}

function generateUniqueUsAddressCandidates({ primaryCount = 8, fallbackCount = 0 } = {}) {
  const targetCount = Math.max(1, primaryCount + fallbackCount);
  const unique = new Set();

  for (let i = 0; i < targetCount * 2 && unique.size < targetCount; i += 1) {
    unique.add(toUniqueAddress(i * 97));
  }

  return [...unique];
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function debugLog(message, meta = {}) {
  if (!ADDRESS_AUTOCOMPLETE_DEBUG) return;
  // Structured log for CI/parsing.
  // eslint-disable-next-line no-console
  console.log(`[dynamic_address] ${message}`, JSON.stringify(meta));
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function buildSearchVariants(addressText) {
  const full = String(addressText || "").trim();
  if (!full) return [];

  const beforeZip = full.replace(/\s+\d{5}(?:-\d{4})?$/, "").trim();
  const beforeState = beforeZip.replace(/,\s*[A-Z]{2}$/, "").trim();
  const firstSegment = full.split(",")[0]?.trim() || full;
  const firstTwoWords = firstSegment.split(/\s+/).slice(0, 2).join(" ").trim();
  const streetOnly = firstSegment.replace(/^\d+\s+/, "").trim();
  const streetStem = streetOnly.split(/\s+/).slice(0, 2).join(" ").trim();

  return [...new Set([full, firstSegment, beforeZip, beforeState, firstTwoWords, streetStem].filter(Boolean))];
}

async function clearAddressInput(addressInput) {
  await addressInput.click().catch(() => {});
  await addressInput.fill("").catch(() => {});
  await addressInput.press("ControlOrMeta+a").catch(() => {});
  await addressInput.press("Backspace").catch(() => {});
}

function looksLikeCommittedAddress(value) {
  const text = String(value || "").trim();
  // "123 Main St, Austin, TX" style sanity check.
  return /\d/.test(text) && /,/.test(text) && text.length >= 10;
}

function scoreSuggestion({ suggestion, typedVariant, addressText }) {
  const suggestionNorm = normalizeText(suggestion);
  const typedNorm = normalizeText(typedVariant);
  const fullNorm = normalizeText(addressText);
  const typedTokens = tokenize(typedVariant);
  const fullTokens = tokenize(addressText);
  const suggestionTokens = new Set(tokenize(suggestion));

  let score = 0;
  if (suggestionNorm === fullNorm) score += 150;
  if (suggestionNorm.includes(fullNorm)) score += 100;
  if (suggestionNorm.includes(typedNorm)) score += 70;

  for (const token of typedTokens) {
    if (suggestionTokens.has(token)) score += 15;
  }
  for (const token of fullTokens.slice(0, 4)) {
    if (suggestionTokens.has(token)) score += 8;
  }

  if (/\d/.test(suggestionNorm)) score += 5;
  if (/,/.test(suggestionNorm)) score += 5;
  return score;
}

async function getVisibleSuggestions(page) {
  const selectors = [
    ".pac-container .pac-item:visible",
    ".pac-item:visible",
    '[role="listbox"] [role="option"]:visible',
    '[role="option"]:visible',
  ];
  for (const selector of selectors) {
    const loc = page.locator(selector);
    const count = await loc.count().catch(() => 0);
    if (!count) continue;

    const entries = [];
    const limit = Math.min(count, 8);
    for (let i = 0; i < limit; i += 1) {
      const item = loc.nth(i);
      const text = String(await item.textContent().catch(() => "")).trim();
      const visible = await item.isVisible().catch(() => false);
      if (visible && text) entries.push({ locator: item, text });
    }
    if (entries.length) return entries;
  }
  return [];
}

async function waitForSuggestions(page, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const suggestions = await getVisibleSuggestions(page);
    if (suggestions.length) return suggestions;
    await page.waitForTimeout(150);
  }
  return [];
}

async function waitForCommittedInputValue({ addressInput, previousValue, timeoutMs = 4_000 }) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const current = await addressInput.inputValue().catch(() => "");
    const changed = normalizeText(current) !== normalizeText(previousValue);
    if (looksLikeCommittedAddress(current) && changed) {
      return current;
    }
    await addressInput.page().waitForTimeout(120);
  }
  return "";
}

async function selectAddressFromAutocomplete({
  page,
  addressInput,
  addressText,
  optionTimeoutMs = 10_000,
  attempts = 2,
} = {}) {
  const variants = buildSearchVariants(addressText);
  if (!variants.length) return false;

  debugLog("candidate_start", { addressText, attempts, variants });

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    for (const variant of variants) {
      const valueBefore = await addressInput.inputValue().catch(() => "");
      await clearAddressInput(addressInput);
      await addressInput.type(variant, { delay: 25 }).catch(async () => {
        await addressInput.fill(variant);
      });

      const suggestions = await waitForSuggestions(page, optionTimeoutMs);
      if (!suggestions.length) {
        debugLog("retry_no_suggestions", { attempt: attempt + 1, variant });
        continue;
      }

      const ranked = suggestions
        .map((entry) => ({
          ...entry,
          score: scoreSuggestion({
            suggestion: entry.text,
            typedVariant: variant,
            addressText,
          }),
        }))
        .sort((a, b) => b.score - a.score);

      const picked = ranked[0];
      debugLog("suggestion_picked", {
        attempt: attempt + 1,
        variant,
        pickedSuggestion: picked.text,
        pickedScore: picked.score,
      });

      await picked.locator.click({ force: true }).catch(async () => {
        // Keyboard fallback if click path is blocked by overlays.
        await addressInput.press("ArrowDown").catch(() => {});
        await addressInput.press("Enter").catch(() => {});
      });

      const committedValue = await waitForCommittedInputValue({
        addressInput,
        previousValue: valueBefore,
        timeoutMs: 4_000,
      });

      const committedNorm = normalizeText(committedValue);
      const typedNorm = normalizeText(variant);
      const committedDifferentThanTyped = committedNorm && committedNorm !== typedNorm;
      const validCommittedAddress = looksLikeCommittedAddress(committedValue);
      const finalPass =
        validCommittedAddress &&
        (committedDifferentThanTyped || normalizeText(valueBefore).length === 0);

      if (finalPass) {
        debugLog("candidate_success", {
          attempt: attempt + 1,
          variant,
          committedValue,
        });
        return true;
      }

      debugLog("retry_commit_failed", {
        attempt: attempt + 1,
        variant,
        committedValue,
        reason: "value_not_committed_or_invalid_format",
      });
    }
  }

  debugLog("candidate_failed", { addressText });
  return false;
}

async function selectDynamicAddressWithRetry({
  page,
  addressInput,
  candidates,
  maxAttempts = 6,
  optionTimeoutMs = 10_000,
} = {}) {
  const candidateList = Array.isArray(candidates) && candidates.length
    ? candidates
    : generateUniqueUsAddressCandidates({ primaryCount: Math.max(6, maxAttempts) });

  let lastTried = "";
  for (let i = 0; i < Math.min(maxAttempts, candidateList.length); i += 1) {
    const candidate = candidateList[i];
    lastTried = candidate;
    debugLog("attempt_start", {
      attempt: i + 1,
      maxAttempts: Math.min(maxAttempts, candidateList.length),
      candidate,
    });
    const selected = await selectAddressFromAutocomplete({
      page,
      addressInput,
      addressText: candidate,
      optionTimeoutMs,
      attempts: 2,
    });
    if (selected) {
      debugLog("attempt_success", { attempt: i + 1, candidate });
      return candidate;
    }
    debugLog("attempt_retry", { attempt: i + 1, candidate, reason: "selection_not_committed" });
  }

  throw new Error(
    `Address autocomplete selection failed after ${Math.min(maxAttempts, candidateList.length)} attempts. Last candidate: "${lastTried}"`,
  );
}

module.exports = {
  buildSearchVariants,
  generateUniqueUsAddressCandidates,
  selectAddressFromAutocomplete,
  selectDynamicAddressWithRetry,
};

