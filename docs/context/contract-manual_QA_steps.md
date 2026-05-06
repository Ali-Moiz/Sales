# Contract Module — Manual QA Steps: Publish, Signatures & Deal Stage Automation

This document covers manual QA test cases and automation strategy for the **Publish flow**, **Request Signatures flow**, and **Deal Stage auto-transitions** in the Contract & Terms module.

All test points are numbered using the `M-CONTRACT-PUB-` and `M-CONTRACT-SIG-` prefix series.

---

## Scope

- Publish action with incomplete/complete contract fields
- Deal stage popup on Publish
- Request Signatures modal behavior (open, signee listing, status tags)
- Signature request sending (success and failure paths)
- Deal stage auto-transitions triggered by signatures
- Multi-signee partial and full signing scenarios

## Preconditions (shared across all test cases)

- User is logged in with valid HO credentials from `.env.uat`.
- A deal exists in the system at `Proposal Creation` stage (or further) with at least one proposal/contract created.
- At least one signee is configured on the contract.
- The `Contract & Terms` tab is accessible on the Deal Detail page.
- `BASE_URL` is set correctly in the environment.

---

## A. Manual QA Test Cases

---

### M-CONTRACT-PUB-001 | Verify attempting to Publish with incomplete required contract fields is blocked and shows error (if applicable)

**Scope:** Validate that the Publish action enforces required field completion before allowing the contract to be published.

#### Preconditions
- User is on Deal Detail → `Contract & Terms` tab.
- A proposal/contract exists in draft/unpublished state.
- One or more required contract fields are intentionally left empty.

#### Detailed Execution Steps

1. Open the target deal and navigate to the `Contract & Terms` tab.
2. Open the existing draft contract/proposal (do not create a new one).
3. Identify which required fields are present in the contract (e.g., service type, start date, payment terms, signee).
4. Leave at least one required field empty or in an invalid state.
5. Locate and click the `Publish` button (or equivalent publish action).
6. Observe the system response immediately after clicking Publish.
7. Verify the contract remains in draft/unpublished state (not published).
8. Check whether an inline validation error, toast notification, or modal appears indicating what is missing.
9. Note the exact error message and which fields are flagged.
10. Fill in all required fields with valid data.
11. Click `Publish` again.
12. Verify the contract transitions to published state without errors.

#### Expected Results
- Publish is blocked when required fields are incomplete.
- A clear error (toast, inline validation, or modal) is shown indicating the missing fields.
- After completing all required fields, Publish succeeds and contract state changes to published.

#### Edge Cases
- **E1 - Multiple missing fields:** Leave more than one required field empty. Verify all missing fields are either flagged simultaneously or the user is guided sequentially to each.
- **E2 - Partially filled required field:** Enter an incomplete value (e.g., partial date). Verify system treats it as invalid.
- **E3 - Rapid publish clicks:** Click Publish multiple times quickly. Verify no duplicate error stacking or UI freeze.

---

### M-CONTRACT-PUB-002 | Verify if user publishes contract before manually updating stage, system shows 'deal stages update' popup and handles update

**Scope:** Validate the deal stage update popup that appears when Publish is triggered and the deal stage has not been manually advanced.

#### Preconditions
- User is on Deal Detail → `Contract & Terms` tab.
- Deal stage is at `Proposal Creation` (not yet manually moved to `Negotiation` or beyond).
- Contract has all required fields filled and is ready to publish.

#### Detailed Execution Steps

1. Confirm the current deal stage is `Proposal Creation` (visible in stage bar on deal detail).
2. Navigate to `Contract & Terms` tab and open the publishable contract.
3. Ensure all required fields are complete.
4. Click `Publish`.
5. Observe if a `Deal Stage Update` popup/modal appears.
6. Read the popup message and available actions (e.g., confirm stage move, cancel, or dismiss).
7. **Path A — Accept/Confirm stage update:**
   - Click the confirm/accept button in the popup.
   - Verify the deal stage advances (e.g., to `Negotiation` or the appropriate stage).
   - Verify the contract is now published.
8. **Path B — Dismiss/Cancel popup:**
   - Click Cancel or close the popup without confirming.
   - Verify the deal stage remains unchanged.
   - Verify the publish action was either completed or rolled back per expected behavior.
9. Recheck the deal stage bar after each path to confirm correct state.

#### Expected Results
- Publishing without a manual stage update triggers the `Deal Stage Update` popup.
- Confirming the popup advances the deal stage and completes the publish.
- Cancelling the popup keeps the deal stage unchanged.
- No data loss or inconsistency occurs in either path.

#### Edge Cases
- **E1 - Popup reappears on re-publish:** After cancelling the popup, attempt to publish again. Verify popup reappears correctly.
- **E2 - Stage already at Negotiation:** If deal stage is already at `Negotiation`, verify Publish completes without showing the stage popup.

---

### M-CONTRACT-SIG-001 | Verify Request Signatures opens selection modal listing all signees with status tags

**Scope:** Validate that the Request Signatures action opens a modal that displays all configured signees along with their current status tags.

#### Preconditions
- Contract is in published state.
- At least two signees are configured on the contract.
- User is on the Deal Detail → `Contract & Terms` tab.

#### Detailed Execution Steps

1. Locate the published contract card on the `Contract & Terms` tab.
2. Click `Request Signatures` button/link on the contract card.
3. Verify a modal/drawer opens.
4. Verify the modal lists all signees configured for this contract (check count matches expected).
5. Verify each signee row shows:
   - Signee name or email.
   - A status tag next to their name.
6. Note the status tag value for each signee.
7. Close the modal without taking any action.

#### Expected Results
- Request Signatures modal opens successfully.
- All configured signees are listed in the modal.
- Each signee has a visible status tag indicating their current request state.

#### Edge Cases
- **E1 - Contract with single signee:** Verify modal lists exactly one signee.
- **E2 - Contract with many signees (5+):** Verify all signees are visible (scroll if needed, no truncation).

---

### M-CONTRACT-SIG-002 | Verify default status tag is 'Not Requested' for signees who were not sent a request

**Scope:** Validate the initial/default status of signees who have never been sent a signature request.

#### Preconditions
- Contract is published.
- No signature request has been sent to any signee yet.
- User opens Request Signatures modal (follow steps from M-CONTRACT-SIG-001).

#### Detailed Execution Steps

1. Open the Request Signatures modal on a freshly published contract (no requests sent yet).
2. Inspect the status tag for each signee in the list.
3. Verify every signee displays the tag `Not Requested`.
4. Verify the tag is visible, clearly labeled, and distinguishable (e.g., color or label).
5. Close the modal without sending any request.
6. Reopen the modal.
7. Verify status tags still show `Not Requested` (not reset or changed on reopen).

#### Expected Results
- All signees display `Not Requested` status tag before any signature request is sent.
- Status persists correctly across modal open/close cycles.

---

### M-CONTRACT-SIG-003 | Verify selecting a signee and clicking Request Signatures sends email and updates status tag to 'Requested'

**Scope:** Validate the full happy path of requesting a signature — selection, sending, and tag update.

#### Preconditions
- Contract is published.
- At least one signee has `Not Requested` status.
- User is in the Request Signatures modal.

#### Detailed Execution Steps

1. Open Request Signatures modal.
2. Select one signee (e.g., using a checkbox or row selection).
3. Confirm the signee is visually selected (highlighted row, checked box, etc.).
4. Click the `Request Signatures` button (confirm/send action).
5. Observe the system response:
   - Toast or inline success confirmation appears.
   - No error is shown.
6. Verify the selected signee's status tag changes from `Not Requested` to `Requested`.
7. Verify unselected signees (if any) retain their previous status tag unchanged.
8. Close and reopen the modal.
9. Verify the `Requested` status tag persists after modal reopen (data persisted server-side).

#### Expected Results
- Signature request email is triggered for the selected signee.
- Status tag updates to `Requested` immediately after successful send.
- Other signees' status tags remain unchanged.
- Status persists on modal reopen.

#### Edge Cases
- **E1 - Re-request already Requested signee:** Select a signee already tagged `Requested` and send again. Verify behavior (allowed with re-send confirmation, or blocked with message).

---

### M-CONTRACT-SIG-004 | Verify when a signee signs, status tag updates to 'Signed' in Request Signatures modal

**Scope:** Validate that after a signee completes the signing action (simulated or via test account), their status tag updates to `Signed`.

#### Preconditions
- Signature request has been sent to at least one signee (status = `Requested`).
- Signing action has been completed (via test account, email link, or simulation tool).

#### Detailed Execution Steps

1. After the signee completes signing (external action), return to the Deal Detail page.
2. Navigate to `Contract & Terms` tab.
3. Click `Request Signatures` on the contract card.
4. Verify the signed signee's status tag displays `Signed`.
5. Verify the `Signed` tag is visually distinct from `Requested` and `Not Requested`.
6. Verify other signees retain their respective tags unchanged.

#### Expected Results
- Signee who completed signing shows `Signed` status tag.
- Tag update is reflected correctly in the modal.
- Other signees are not affected.

#### Edge Cases
- **E1 - Page refresh before checking:** Refresh the Deal Detail page before opening the modal. Verify `Signed` tag still shows (server-side persistence).

---

### M-CONTRACT-SIG-005 | Verify Request Signatures is blocked if no signee is selected — show validation/toast

**Scope:** Validate that clicking Request Signatures without selecting any signee is blocked with user-visible feedback.

#### Preconditions
- Contract is published.
- User is in the Request Signatures modal.
- No signee is selected.

#### Detailed Execution Steps

1. Open Request Signatures modal.
2. Ensure no signee is selected (all checkboxes/rows unchecked).
3. Click the `Request Signatures` / send button.
4. Observe the system response immediately.
5. Verify the modal remains open (not closed or submitted).
6. Verify a validation error or toast appears indicating a signee must be selected.
7. Verify no signature request email is triggered.
8. Select one signee and click `Request Signatures` again.
9. Verify the action now succeeds (validation cleared, email sent, tag updated).

#### Expected Results
- Sending without selecting a signee is blocked.
- Clear validation message or toast explains the required action.
- After selecting a signee, the action proceeds normally.

#### Edge Cases
- **E1 - Rapid click without selection:** Click the send button multiple times quickly without selecting. Verify no duplicate errors or freeze.

---

### M-CONTRACT-SIG-006 | Verify email delivery failure (simulate/forced) shows error and status does not incorrectly change to Requested

**Scope:** Validate system behavior when the signature request email fails to deliver — status must NOT change to Requested.

#### Preconditions
- Contract is published.
- An environment or method exists to simulate email delivery failure (invalid email, test flag, or network interception).
- User is in the Request Signatures modal.

#### Detailed Execution Steps

1. Configure or identify a signee whose email is known to fail (invalid address or test simulation).
2. Open Request Signatures modal.
3. Select the failing signee.
4. Click `Request Signatures`.
5. Observe the system response.
6. Verify an error message, toast, or failure notification is displayed.
7. Verify the failed signee's status tag remains `Not Requested` (does NOT change to `Requested`).
8. Verify no success confirmation is shown for the failed signee.
9. Verify other signees (if present) are not affected by this failure.

#### Expected Results
- Email delivery failure is surfaced to the user with a clear error.
- Status tag stays `Not Requested` for the failed signee.
- No false `Requested` state is recorded.

#### Notes
- If direct simulation is not possible in the test environment, document this as a deferred test case and flag for environment-level testing.

---

### M-CONTRACT-SIG-007 | Verify deal stage auto-moves to Negotiation after sending signature request when deal was in Proposal Creation

**Scope:** Validate the automatic deal stage transition from `Proposal Creation` to `Negotiation` triggered by sending a signature request.

#### Preconditions
- Deal is at `Proposal Creation` stage.
- Contract is published.
- User sends a signature request for the first time.

#### Detailed Execution Steps

1. Confirm the deal stage is `Proposal Creation` (visible in stage bar).
2. Navigate to `Contract & Terms` tab.
3. Open Request Signatures modal.
4. Select at least one signee with `Not Requested` status.
5. Click `Request Signatures` / send.
6. Observe the system response.
7. Close the modal.
8. Inspect the deal stage bar on Deal Detail page.
9. Verify the deal stage has automatically advanced to `Negotiation`.
10. Verify no manual stage update was required to trigger this transition.

#### Expected Results
- Deal stage automatically moves from `Proposal Creation` to `Negotiation` upon sending a signature request.
- Transition is immediate and visible in the stage bar without page refresh.

#### Edge Cases
- **E1 - Deal already at Negotiation:** Send signature request when deal is already at `Negotiation`. Verify stage stays at `Negotiation` and does not regress or double-advance.
- **E2 - Multiple requests sent:** Send additional requests to other signees. Verify stage does not regress.

---

### M-CONTRACT-SIG-008 | Verify once all signees sign, deal stage moves to Closed Won automatically

**Scope:** Validate that when every signee on the contract has signed, the deal stage automatically advances to `Closed Won`.

#### Preconditions
- Deal is at `Negotiation` stage.
- At least one signee has `Requested` status.
- Signing completion can be simulated or performed via test accounts.

#### Detailed Execution Steps

1. Confirm the deal stage is `Negotiation`.
2. Confirm all signees are in `Requested` status in the Request Signatures modal.
3. Complete the signing action for every signee (via test account, simulation, or email link).
4. Return to Deal Detail page.
5. Inspect the deal stage bar.
6. Verify the deal stage has automatically advanced to `Closed Won`.
7. Verify no manual stage update was needed.
8. Open the Request Signatures modal and verify signee tags (expected: all `Signed`).

#### Expected Results
- All signees signing triggers automatic deal stage transition to `Closed Won`.
- Stage bar reflects `Closed Won` without manual intervention.

---

### M-CONTRACT-SIG-009 | Verify once all signees sign, 'Request Signatures' text disappears from contract card (no longer shown)

**Scope:** Validate the UI state change on the contract card after all signatures are collected — the `Request Signatures` action should no longer be shown.

#### Preconditions
- All signees have signed (deal is at `Closed Won`).
- User is on Deal Detail → `Contract & Terms` tab.

#### Detailed Execution Steps

1. After all signees have signed, navigate to the `Contract & Terms` tab.
2. Locate the contract card on the tab.
3. Verify the `Request Signatures` button/link/text is no longer visible on the card.
4. Scroll the contract card fully to confirm no hidden instance exists.
5. Refresh the page and verify `Request Signatures` remains hidden after reload.

#### Expected Results
- `Request Signatures` text/button is no longer present on the contract card after all signees sign.
- State persists after page refresh.

#### Edge Cases
- **E1 - Only some signees signed:** Verify `Request Signatures` still appears when partial signing is done.

---

### M-CONTRACT-SIG-010 | Verify with multiple signees, deal does NOT move to Closed Won until all signees have Signed

**Scope:** Validate that partial signing (not all signees have signed) does not prematurely advance the deal to `Closed Won`.

#### Preconditions
- Deal is at `Negotiation` stage.
- Contract has at least two signees, both in `Requested` status.

#### Detailed Execution Steps

1. Confirm deal stage is `Negotiation` with at least two signees in `Requested` status.
2. Complete signing for only one signee (leave at least one as `Requested`).
3. Return to Deal Detail page.
4. Verify deal stage is still `Negotiation` (NOT `Closed Won`).
5. Open Request Signatures modal and verify:
   - Signed signee shows `Signed` tag.
   - Remaining signee(s) show `Requested` tag.
6. Confirm the `Request Signatures` button is still visible on the contract card.

#### Expected Results
- Deal does not move to `Closed Won` while any signee has not yet signed.
- Stage remains at `Negotiation` with partial signing.

---

### M-CONTRACT-SIG-011 | Verify with multiple signees, partial signing keeps stage as Negotiation and tags reflect Requested/Signed/Not Requested correctly

**Scope:** Validate the combined tag accuracy scenario — multiple signees in different states simultaneously, and the deal stage correctly stays at `Negotiation`.

#### Preconditions
- Deal has at least three signees.
- Contract is published.
- Signature requests have been sent to some but not all signees.
- At least one signee has signed.

#### Detailed Execution Steps

1. Set up the following signee states (before this test):
   - Signee A: `Not Requested` (no request sent)
   - Signee B: `Requested` (request sent, not yet signed)
   - Signee C: `Signed` (completed signing)
2. Navigate to Deal Detail → `Contract & Terms` tab.
3. Confirm deal stage is `Negotiation` (not `Closed Won`).
4. Open Request Signatures modal.
5. Verify:
   - Signee A displays `Not Requested` tag.
   - Signee B displays `Requested` tag.
   - Signee C displays `Signed` tag.
6. Verify each tag is visually distinct and correctly labeled.
7. Close modal and confirm `Request Signatures` is still visible on contract card.
8. Verify deal stage remains `Negotiation`.

#### Expected Results
- Each signee reflects their actual status: `Not Requested`, `Requested`, or `Signed`.
- Deal stage stays at `Negotiation` until ALL signees reach `Signed`.
- `Request Signatures` remains accessible for unsent/pending signees.

#### Edge Cases
- **E1 - All possible tag states shown simultaneously:** All three tag types visible at once — verify no overlap, visual misalignment, or tag swapping.
- **E2 - Reload between tag updates:** Refresh page between individual sign actions. Verify tags reload accurately from server state.

---

## B. Automation Strategy

| Test Case ID | Title (unchanged from test points) | Test Type | Reason |
|---|---|---|---|
| M-CONTRACT-PUB-001 | Verify attempting to Publish with incomplete required contract fields is blocked and shows error (if applicable) | **Single test with `test.step`** | Publish attempt, error verification, and successful publish after fix are tightly coupled in one linear flow |
| M-CONTRACT-PUB-002 | Verify if user publishes contract before manually updating stage, system shows 'deal stages update' popup and handles update | **Separate serial test** | Two branching paths (accept vs. dismiss) require independent assertions; each path changes system state differently |
| M-CONTRACT-SIG-001 | Verify Request Signatures opens selection modal listing all signees with status tags | **Single test with `test.step`** | Modal open and signee listing check is a single read-only verification; couples naturally as one assert block |
| M-CONTRACT-SIG-002 | Verify default status tag is 'Not Requested' for signees who were not sent a request | **Single test with `test.step`** | Directly extends SIG-001 — same modal, zero-state check; share session context |
| M-CONTRACT-SIG-003 | Verify selecting a signee and clicking Request Signatures sends email and updates status tag to 'Requested' | **Separate serial test** | Mutates server state (sends email, changes tag); must run after SIG-002 confirms clean state |
| M-CONTRACT-SIG-004 | Verify when a signee signs, status tag updates to 'Signed' in Request Signatures modal | **Separate serial test** | Depends on an external signing action; isolated from the request-sending flow; distinct async state change |
| M-CONTRACT-SIG-005 | Verify Request Signatures is blocked if no signee is selected — show validation/toast | **Single test with `test.step`** | Pure negative validation — no state mutation; couples with SIG-001 session (same modal), no independent setup needed |
| M-CONTRACT-SIG-006 | Verify email delivery failure (simulate/forced) shows error and status does not incorrectly change to Requested | **Separate serial test** | Requires specific environment setup (forced failure); isolated concern from happy-path tests; may be deferred |
| M-CONTRACT-SIG-007 | Verify deal stage auto-moves to Negotiation after sending signature request when deal was in Proposal Creation | **Separate serial test** | Validates a stage-level side effect triggered by SIG-003; must run sequentially after a fresh send action |
| M-CONTRACT-SIG-008 | Verify once all signees sign, deal stage moves to Closed Won automatically | **Separate serial test** | Terminal state transition; depends on all signees signing; isolated and irreversible — must run last in sequence |
| M-CONTRACT-SIG-009 | Verify once all signees sign, 'Request Signatures' text disappears from contract card (no longer shown) | **Single test with `test.step`** | Directly coupled with SIG-008 state; runs in same post-signing session as a UI assertion step |
| M-CONTRACT-SIG-010 | Verify with multiple signees, deal does NOT move to Closed Won until all signees have Signed | **Separate serial test** | Requires a controlled partial-signing setup; independent assertion that guards against premature state transition |
| M-CONTRACT-SIG-011 | Verify with multiple signees, partial signing keeps stage as Negotiation and tags reflect Requested/Signed/Not Requested correctly | **Separate serial test** | Multi-state tag accuracy check across three concurrent signee states; requires deliberate setup distinct from SIG-010 |

### Recommended `test.describe.serial` Block Groupings

```
describe.serial: "Contract Publish Flow"
  ├── M-CONTRACT-PUB-001  (test.step)
  └── M-CONTRACT-PUB-002  (separate test)

describe.serial: "Request Signatures — Zero State & Validation"
  ├── M-CONTRACT-SIG-001  (test.step — modal open + listing)
  ├── M-CONTRACT-SIG-002  (test.step — default tags)
  └── M-CONTRACT-SIG-005  (test.step — no selection blocked)

describe.serial: "Request Signatures — Happy Path & Stage Transitions"
  ├── M-CONTRACT-SIG-003  (separate test — send + tag = Requested)
  ├── M-CONTRACT-SIG-007  (separate test — stage → Negotiation)
  ├── M-CONTRACT-SIG-004  (separate test — tag → Signed)
  ├── M-CONTRACT-SIG-010  (separate test — partial signing, no Closed Won)
  ├── M-CONTRACT-SIG-011  (separate test — all tag states correct)
  ├── M-CONTRACT-SIG-008  (separate test — all signed → Closed Won)
  └── M-CONTRACT-SIG-009  (test.step — Request Signatures hidden post-all-signed)

describe.serial: "Request Signatures — Failure Path" (deferred/conditional)
  └── M-CONTRACT-SIG-006  (separate test — email failure simulation)
```

---

## C. Notes & Risks

### Flaky Areas

1. **Signature completion (SIG-004, SIG-008, SIG-009, SIG-010, SIG-011):**  
   If real email-based signing links are required, these tests cannot be fully automated without a test-account signing mechanism or API-level state injection. Mark as partially manual or environment-gated until a signing simulation exists.

2. **Deal stage bar updates (SIG-007, SIG-008):**  
   Stage transitions may be asynchronous (SSE, polling, or WebSocket). Use `waitForSelector` or `expect().toHaveText()` with a reasonable timeout rather than fixed sleeps. Flakiness risk is high if network is slow.

3. **Email delivery failure simulation (SIG-006):**  
   Highly environment-dependent. Cannot be reliably automated in standard UAT without test tooling (e.g., invalid email injection, email service mock, or feature flag). Recommend deferring to manual testing or marking as conditional in the spec file.

4. **Deal stage popup (PUB-002):**  
   The popup may not appear consistently if the deal stage was already advanced in a prior session. Ensure test setup resets the deal stage to `Proposal Creation` before running this test.

### Optimization Suggestions

- **Shared published contract:** The entire Signatures suite should reuse a single published contract created once in `beforeAll` — do not re-publish for each test.
- **Signee reset between runs:** If signee states are server-persisted, tests that depend on `Not Requested` default state may fail on re-run. Consider using a freshly created contract per run or an API to reset signee states.
- **Stage bar assertion selector:** Confirm the deal stage bar selector is stable across deals and does not rely on positional indexing. Use `getByRole('button', { name: 'Negotiation' })` or equivalent ARIA-based selector.
- **SIG-009 + SIG-008 coupling:** These two can be co-located in the same test using `test.step` since SIG-009 is purely a UI assertion that follows SIG-008's state. Do not run SIG-009 without SIG-008 completing first.
- **TC codes for automation:** Before automating any of the above, each scenario must have a formal TC code assigned in this documentation (e.g., `TC-CONTRACT-PUB-001`). The `M-` prefix used here indicates manual/documentation status — automation spec file entries require the `TC-` prefix per project conventions.
