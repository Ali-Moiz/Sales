# Signal Mobile Report API Agent Skill

## Primary Goal

Assist in creating, debugging, and refactoring API-based tests for mobile activity reports. Use **CommonJS** (`require` / `module.exports`) only. All HTTP for mobile report flows goes through **`Utilities/api/`** — not legacy helpers, not raw `fetch` in tests.

## Project Architecture and Rules

### Do not use

- **`Utilities/apiUtils.js`** — deprecated; do not add or extend usage.
- **`Utilities/activityReportMobileApiSetup.js`** — deprecated for new work; shift/report setup belongs in **`Utilities/api/services/*`** (or thin orchestrators that call those services).
- **Direct `fetch`** in test files.
- **Manual header construction** in tests (no one-off `Authorization`, `franchise_id`, etc.).
- **Inline API logic** in spec files (no URL building, no payload assembly beyond calling services and passing fixture-driven values).

### Must use

| Layer | Role |
|--------|------|
| [`Utilities/api/apiClient.js`](../../Utilities/api/apiClient.js) | Single orchestrator: base headers, auth token injection, `apiRequest` / `fetch`. |
| [`Utilities/api/index.js`](../../Utilities/api/index.js) | Barrel export of all services. |
| [`Utilities/api/services/auth.js`](../../Utilities/api/services/auth.js) | `loginViaApi` (mobile auth). |
| [`Utilities/api/services/shift.js`](../../Utilities/api/services/shift.js) | Shift lifecycle: `startShift`, `endShift`, `startPatrolShift`, `startDedicatedShiftFromHomeScreen`, `startPatrolShiftFromHomeScreen`. |
| [`Utilities/api/services/job.js`](../../Utilities/api/services/job.js) | `getDedicatedHomeScreen`, `getSupervisorHomeScreen`. |
| [`Utilities/api/services/report.js`](../../Utilities/api/services/report.js) | Activity report: `fetchReportTemplate`, `getActivityReportTemplateById`, `submitActivityReport`, `completeActivityReportFlow`, `normalizeActivityReportTemplateListResponse`. |

**Fixture-driven selection:** use **`reportTemplate.templateTitle`** from [`readFixture()`](../../Utilities/FixtureHelper.js) / `fixtures/<ENV_NAME>.json` — not hardcoded titles in tests.

### Dedicated home screen and patrol (`shift.js`)

- **`getDedicatedHomeScreen`** (`job.js`) returns `data` with **`ongoingShift`** and **`nextShift`**.
- **`startPatrolShiftFromHomeScreen(token)`**:
  - Picks **ongoing** if it is a non-empty **patrol** shift; otherwise **next** patrol (non-patrol ongoing, e.g. dedicated, is ignored so the next patrol can still be used).
  - If the chosen shift is **ongoing patrol** and already started (`shiftStatus` / `patrolStartLog` + `startedAt`), it **does not** call `PATCH .../patrol/start`; it returns **`skippedPatrolStart: true`**, **`startResponse: null`**, plus **`shiftId`** (activity log `_id` or `id`) and **`homeData`**.
  - Otherwise it builds the patrol payload and calls **`startPatrolShift`**; returns **`startResponse`**, **`skippedPatrolStart: false`**.
- **`startDedicatedShiftFromHomeScreen(token)`** resolves dedicated (non-patrol) shift from home data, calls **`startShift`**, returns **`{ shiftId, homeData, startResponse }`**.

### Submit report ID (`report.js`)

- **`PATCH .../shiftActivityLog/submitReport/{id}`** expects the **ShiftActivityLog** document id (Mongo **ObjectId** string, 24 hex chars), not necessarily the **template** list row id from `GET .../mobile/templates`.
- If submit fails with `CastError` on `_id`, resolve the correct activity-log id from **`homeData`**, **`startResponse`**, or a refetched **`getDedicatedHomeScreen`** — keep that resolution inside **`report.js`** / services, not in spec files.

Import in tests:

```javascript
const {
  loginViaApi,
  startPatrolShiftFromHomeScreen,
  fetchReportTemplate,
  completeActivityReportFlow,
  getActivityReportTemplateById,
  normalizeActivityReportTemplateListResponse,
} = require("../Utilities/api");
```

(Adjust path depth to the spec file.)

## Environment Rules

- Load env via **`dotenv`** from **`./fixtures/.env.<ENV_NAME>`** (see [`fixtures/constants.js`](../../fixtures/constants.js)). **`ENV_NAME`** selects the file.
- **Never hardcode** in tests: `siteId`, `shiftId`, report instance ids, or user credentials — use `process.env.*` and/or fixture keys.

## Architecture Constraints

- Tests call **service-level** functions only; services call **`apiRequest`** from **`apiClient.js`**.
- All HTTP for this stack is centralized in **`Utilities/api/apiClient.js`** (headers, errors, JSON).

## Critical Rules

- Do **not** bypass the service layer.
- Do **not** duplicate headers anywhere outside **`apiClient.js`**.
- Do **not** move API orchestration into test files.
- Do **not** use legacy **`apiUtils.js`** for new or refactored code.

## Expected Behavior

- Deterministic tests (fixture + env driven).
- Reusable flows (`completeActivityReportFlow`, shift helpers).
- No API drift between specs and real mobile routes.
- Clear separation: **tests → services → apiClient**.

## API Endpoints (reference)

- **Dedicated home:** `GET /scheduling/api/v1/job/dedicatedHomeScreen`
- **List templates:** `GET /template/api/v1/mobile/templates/?templateableType=activityReport&site_id={siteId}`
- **Single template:** `GET /template/api/v1/mobile/templates/{template_id}`
- **Patrol start:** `PATCH /scheduling/api/v1/shiftActivityLog/patrol/start/{shiftActivityLogId}`
- **Submit report:** `PATCH /scheduling/api/v1/shiftActivityLog/submitReport/{shiftActivityLogId}`

Paths are implemented behind **`job.js`**, **`shift.js`**, **`report.js`** / **`apiClient`** — do not re-string these in specs.

## Payload Logic

When building `sectionsAttributes`, follow the structure used in [`OBXPages/MobilePageApi.js`](../../OBXPages/MobilePageApi.js):

- Each section requires an `id`.
- `questionsAttributes` require an `id` and `answers`.
- Select-type answers use an array: `[{ "id": optionId, "optionText": "Text" }]`.

## Quick Reference: Playwright Test Snippet

```javascript
const { test, expect } = require("@playwright/test");
const { readFixture } = require("../Utilities/FixtureHelper.js");
const {
  loginViaApi,
  fetchReportTemplate,
  completeActivityReportFlow,
  startPatrolShiftFromHomeScreen,
} = require("../Utilities/api");

test("Submit mobile report via API", async () => {
  const token = await loginViaApi(
    process.env.USER1_EMAIL,
    process.env.USER1_PASSWORD,
  );
  const { homeData, startResponse, skippedPatrolStart } =
    await startPatrolShiftFromHomeScreen(token);
  // startResponse / skippedPatrolStart: use when wiring submitReport id in report service
  const siteId =
    homeData?.siteId || process.env.FIRST_SITE_ID;
  const templateTitle = readFixture().reportTemplate.templateTitle;

  await completeActivityReportFlow({
    token,
    siteId,
    templateTitle,
    reportBodyBuilder: (template) => ({
      id: template.id,
      title: template.title,
      sectionsAttributes: [],
    }),
  });
});
```

Adjust `require` path to your spec location relative to `Utilities/api`. Add `readFixture` import from `FixtureHelper` as needed.
