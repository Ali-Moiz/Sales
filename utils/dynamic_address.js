"use strict";

const { TIMEOUTS } = require('./playwright-timeouts');
const { expect } = require("@playwright/test");
const MIN_RELEVANT_SUGGESTION_SCORE = 100;

// ── Omaha, NE street pool ────────────────────────────────────────────────────
// Each entry carries its canonical suffix and the safe house-number range for
// that street so every generated candidate resolves in Google Maps autocomplete.
// Named E-W streets: house number ≈ 100 × nearest N-S cross street.
// Numbered N-S streets: house number = distance in 100-block units from Dodge.
const OMAHA_STREET_POOL = [
  // ── Named east-west streets ──────────────────────────────────────────────
  { name: "Farnam",      suffix: "St",  houseMin: 100,   houseMax: 6800  },
  { name: "Harney",      suffix: "St",  houseMin: 100,   houseMax: 4800  },
  { name: "Leavenworth", suffix: "St",  houseMin: 200,   houseMax: 6400  },
  { name: "Douglas",     suffix: "St",  houseMin: 100,   houseMax: 3200  },
  { name: "Dodge",       suffix: "St",  houseMin: 2000,  houseMax: 8400  },
  { name: "Cass",        suffix: "St",  houseMin: 1200,  houseMax: 7600  },
  { name: "California",  suffix: "St",  houseMin: 1200,  houseMax: 4800  },
  { name: "Cuming",      suffix: "St",  houseMin: 1600,  houseMax: 5600  },
  { name: "Pacific",     suffix: "St",  houseMin: 2000,  houseMax: 9600  },
  { name: "Nicholas",    suffix: "St",  houseMin: 2000,  houseMax: 10200 },
  { name: "Blondo",      suffix: "St",  houseMin: 2000,  houseMax: 13200 },
  { name: "Ames",        suffix: "Ave", houseMin: 2000,  houseMax: 6400  },
  { name: "Lake",        suffix: "St",  houseMin: 2000,  houseMax: 5600  },
  { name: "Q",           suffix: "St",  houseMin: 1600,  houseMax: 5600  },
  { name: "L",           suffix: "St",  houseMin: 1600,  houseMax: 5600  },
  { name: "Vinton",      suffix: "St",  houseMin: 1600,  houseMax: 4800  },
  { name: "Harrison",    suffix: "St",  houseMin: 4400,  houseMax: 8800  },
  { name: "Center",      suffix: "Rd",  houseMin: 5200,  houseMax: 13600 },
  { name: "Maple",       suffix: "Rd",  houseMin: 6400,  houseMax: 15200 },
  { name: "West Dodge",  suffix: "Rd",  houseMin: 8000,  houseMax: 17000 },
  { name: "Saddle Creek",suffix: "Rd",  houseMin: 200,   houseMax: 5600  },
  { name: "Military",    suffix: "Ave", houseMin: 4000,  houseMax: 7200  },
  { name: "Woolworth",   suffix: "Ave", houseMin: 2400,  houseMax: 6400  },
  { name: "Underwood",   suffix: "Ave", houseMin: 4800,  houseMax: 6800  },
  { name: "Fontenelle",  suffix: "Blvd",houseMin: 3200,  houseMax: 5600  },
  { name: "Happy Hollow",suffix: "Blvd",houseMin: 600,   houseMax: 4800  },
  // ── Numbered north-south streets ─────────────────────────────────────────
  { name: "72nd",        suffix: "St",  houseMin: 100,   houseMax: 5200  },
  { name: "84th",        suffix: "St",  houseMin: 100,   houseMax: 5600  },
  { name: "90th",        suffix: "St",  houseMin: 100,   houseMax: 5200  },
  { name: "108th",       suffix: "St",  houseMin: 100,   houseMax: 5200  },
  { name: "120th",       suffix: "St",  houseMin: 100,   houseMax: 5200  },
  { name: "144th",       suffix: "St",  houseMin: 100,   houseMax: 4400  },
];

function toUniqueAddress(seedOffset = 0) {
  const now = Date.now() + seedOffset;
  const street = OMAHA_STREET_POOL[now % OMAHA_STREET_POOL.length];
  const houseRange = street.houseMax - street.houseMin;
  const houseNumber = street.houseMin + (now % houseRange);
  return `${houseNumber} ${street.name} ${street.suffix}, Omaha, NE`;
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

async function clearAddressInputValue(addressInput) {
  await addressInput.clear().catch(async () => {
    await addressInput.fill("");
  });
  await addressInput.fill("");
}

async function clearAddressInput(addressInput) {
  await addressInput.scrollIntoViewIfNeeded().catch(() => {});
  await expect(addressInput).toBeVisible({ timeout: TIMEOUTS.BASE * 10 });
  await expect(addressInput).toBeEditable({ timeout: TIMEOUTS.BASE * 10 });
  // Dismiss any open autocomplete dropdown so the widget resets its internal
  // cached query; without this the Maps widget replays the previous suggestion
  // mid-type(), appending residual keystrokes to the committed value.
  // NOTE: Do NOT use press("Escape") here — MUI Drawer/Modal has a document-
  // level Escape handler that closes the entire drawer when the Google Maps
  // .pac-container dropdown is not open to absorb the event first.
  // Instead, blur + refocus the input, which dismisses the pac-container
  // without triggering MUI's Escape-to-close behavior.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await addressInput.click();
    await clearAddressInputValue(addressInput);
    await addressInput.press("Tab").catch(() => {});
    await addressInput.click();
    await clearAddressInputValue(addressInput);

    const cleared = await expect(addressInput)
      .toHaveValue("", { timeout: TIMEOUTS.BASE * 4 })
      .then(() => true)
      .catch(() => false);
    if (cleared) return;

    debugLog("clear_retry", {
      attempt,
      value: await addressInput.inputValue().catch(() => ""),
    });
  }

  await expect(addressInput).toHaveValue("", { timeout: TIMEOUTS.BASE * 4 });
}

function looksLikeCommittedAddress(value) {
  const text = String(value || "").trim();
  // "123 Main St, Austin, TX" style sanity check.
  if (!/\d/.test(text) || !/,/.test(text) || text.length < 10) return false;
  // Reject corruption fingerprint: a 5-digit zip immediately followed by letters
  // (e.g. "…, OH 43215Dr") indicates the Maps widget replayed a cached suggestion
  // while type() was still feeding keystrokes.
  if (/\d{5}[A-Za-z]/.test(text)) return false;
  return true;
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

function suggestionSignature(entries) {
  return entries.map((entry) => normalizeText(entry.text)).join("|");
}

async function waitForSuggestions(
  page,
  timeoutMs = TIMEOUTS.BASE * 20,
  { previousSignature = "", typedVariant = "", addressText = "" } = {},
) {
  let visibleSuggestions = [];
  let acceptedSuggestions = [];
  await expect
    .poll(
      async () => {
        visibleSuggestions = await getVisibleSuggestions(page);
        if (!visibleSuggestions.length) return 0;
        if (!typedVariant) {
          acceptedSuggestions = visibleSuggestions;
          return acceptedSuggestions.length;
        }

        const currentSignature = suggestionSignature(visibleSuggestions);
        const refreshed = currentSignature !== previousSignature;
        const bestScore = Math.max(
          ...visibleSuggestions.map((entry) =>
            scoreSuggestion({
              suggestion: entry.text,
              typedVariant,
              addressText,
            }),
          ),
        );
        if (refreshed || bestScore >= MIN_RELEVANT_SUGGESTION_SCORE) {
          acceptedSuggestions = visibleSuggestions;
          return acceptedSuggestions.length;
        }

        return 0;
      },
      { timeout: timeoutMs, intervals: [TIMEOUTS.BASE / 4] },
    )
    .toBeGreaterThan(0)
    .catch(() => {});
  return acceptedSuggestions;
}

async function waitForCommittedInputValue({ addressInput, previousValue, timeoutMs = TIMEOUTS.BASE * 8 }) {
  let committedAddress = "";
  await expect
    .poll(
      async () => {
        const current = await addressInput.inputValue().catch(() => "");
        const changed = normalizeText(current) !== normalizeText(previousValue);
        committedAddress = looksLikeCommittedAddress(current) && changed ? current : "";
        return committedAddress;
      },
      { timeout: timeoutMs, intervals: [TIMEOUTS.BASE / 4] },
    )
    .not.toBe("")
    .catch(() => {});
  return committedAddress;
}

async function commitAddressSelectionViaReact(addressInput, addressText) {
  if (!addressText) return false;

  return addressInput
    .evaluate(async (input, selectedAddress) => {
      const fiberKey = Object.keys(input).find((key) => key.startsWith("__reactFiber"));
      let node = fiberKey ? input[fiberKey] : null;

      while (node) {
        const onSelect = node.memoizedProps?.onSelect;
        if (typeof onSelect === "function") {
          await onSelect(selectedAddress);
          return true;
        }
        node = node.return;
      }
      return false;
    }, addressText)
    .catch(() => false);
}

async function selectAddressFromAutocomplete({
  page,
  addressInput,
  addressText,
  optionTimeoutMs = TIMEOUTS.BASE * 20,
  attempts = 2,
} = {}) {
  const variants = buildSearchVariants(addressText);
  if (!variants.length) return false;

  debugLog("candidate_start", { addressText, attempts, variants });

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    for (const variant of variants) {
      const valueBefore = await addressInput.inputValue().catch(() => "");
      const previousSuggestionSignature = suggestionSignature(await getVisibleSuggestions(page));
      await clearAddressInput(addressInput);
      await addressInput.fill(variant);
      // Guard: confirm fill() was not a no-op.  The Google autocomplete widget
      // may immediately overwrite the typed text with a suggestion, so we cannot
      // assert the exact variant text — only that the input is now non-empty.
      await expect(addressInput).not.toHaveValue("", { timeout: TIMEOUTS.BASE * 4 });

      const suggestions = await waitForSuggestions(page, optionTimeoutMs, {
        previousSignature: previousSuggestionSignature,
        typedVariant: variant,
        addressText,
      });
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

      await picked.locator.scrollIntoViewIfNeeded().catch(() => {});
      await picked.locator.click().catch(async () => {
        // Keyboard fallback if click path is blocked by overlays.
        await addressInput.press("ArrowDown").catch(() => {});
        await addressInput.press("Enter").catch(() => {});
      });

      const committedValue = await waitForCommittedInputValue({
        addressInput,
        previousValue: valueBefore,
        timeoutMs: TIMEOUTS.BASE * 8,
      });

      const committedNorm = normalizeText(committedValue);
      const pickedNorm = normalizeText(picked.text);
      const committedMatchesSuggestion =
        committedNorm &&
        (committedNorm === pickedNorm ||
          committedNorm.includes(pickedNorm) ||
          pickedNorm.includes(committedNorm));
      const validCommittedAddress = looksLikeCommittedAddress(committedValue);
      const finalPass = validCommittedAddress && committedMatchesSuggestion;

      if (finalPass) {
        await commitAddressSelectionViaReact(addressInput, picked.text);
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
  optionTimeoutMs = TIMEOUTS.BASE * 20,
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
  clearAddressInput,
  generateUniqueUsAddressCandidates,
  selectAddressFromAutocomplete,
  selectDynamicAddressWithRetry,
};
