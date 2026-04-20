# Contract > Services Module — Exploration Report

**Application:** Signal Sales UAT  
**URL:** `https://uat.sales.teamsignal.com`  
**Module Path:** Deals → Deal Detail → Contract & Terms tab → Create Proposal → Step 1: Services  
**Contract URL Pattern:** `/app/sales/deals/deal/{dealId}/contract/{contractId}`  
**Explored By:** QA Automation (moiz.qureshi+ho@camp1.tkxel.com)  
**Date:** 2026-04-15  
**Contract Created:** Deal ID 19097 / Contract ID 246 (Eastern Timezone)

---

## Navigation Path to Services Module

1. Left sidebar → **Deals**
2. Click **Create Deal** → fill Deal Name, Company, Property → submit
3. Open the created deal → click **Contract & Terms** tab
4. Click **Create Proposal** button (empty state)
5. In the modal: set Service Type, Proposal Name, Timezone (Eastern), Start Date, Renewal Date → **Create Proposal**
6. Auto-navigates to the Contract wizard → **Step 1: Services**

---

## Create Proposal Modal (Gateway)

Before reaching the Services module, the Create Proposal modal must be completed.

| Field | Type | Required | Notes |
|---|---|---|---|
| Service Type | Radio Group | Yes | Dedicated / Patrol (default) OR Dispatch Only |
| Proposal Name | Text Input | Yes | Auto-filled with deal name |
| Time Zone | Dropdown | Yes | Full timezone list; Eastern = (UTC-05:00) Eastern Time (US & Canada) |
| Contract Dates to be decided | Checkbox | No | Disables date fields when checked |
| Start Date | Date Picker | Yes | MM/DD/YYYY format |
| End Date / Renewal Date | Radio + Date Picker | Yes | Toggle between End Date and Renewal Date modes |
| Auto Renewal of Contract | Checkbox | No | Enables auto-renewal |
| Notify for Renewal Before (Days) | Spinbutton | Yes | Default: 10 |

---

## Services Module — Layout Overview

The Services module is a **6-step wizard** with:

### Top Stepper (Steps Navigation)
| Step | Label | Tooltip |
|---|---|---|
| 1 | Services | Add services of this proposal |
| 2 | Devices | Add devices for checkpoints |
| 3 | On Demand | Add additional services |
| 4 | Payment Terms | Set payment preferences |
| 5 | Description | Add description of services |
| 6 | Signees | Add signees for contract |

### Header Bar
- **Billing Cycle dropdown** (top-left): Options — `Weekly`, `Bi-Weekly`, `Monthly` (default: Weekly)
- **Proposal Name** (heading, H3)
- **Update Proposal** button (edit proposal settings — icon + label)

### Footer Bar
- **USD 0.00 Weekly** — live running total (updates as services are configured)
- **Save & Next** button — disabled until all required fields on current step are valid

---

## Service Card Structure

Each service card is an expandable form block with:
- **Service Name textbox** — placeholder: "Service 1" (Required; "Service Name is required" on submit)
- **Price display** — e.g., "$0.00 / Weekly" (calculated, read-only)
- **Service Type radio group** — switches the visible field set

---

## Service Type A: Dedicated Service (Default Selected)

> Used for assigning dedicated officers/guards to a location at fixed hours.

### Fields

| Field | Element Type | Required | Default | Notes |
|---|---|---|---|---|
| Select Resource Type | Dropdown | Yes | Armed Officer | Options: `Armed Officer`, `Dedicated Officer` |
| Line Item | Dropdown | Yes | — | Options: `Dedicated Security Officer (CBA)`, `Roving Patrol Tours` |
| Officer/Guard | Spinbutton (number) | Yes | — | Number of officers/guards |
| Hourly Rate ($) | Spinbutton (number) | Yes | — | Placeholder: `$20` |
| Job Days | Day-toggle buttons | Yes | None | Mon, Tue, Wed, Thu, Fri, Sat, Sun (click to toggle active/inactive) |
| Start Time | Time Input + Picker | Yes | — | Placeholder: `hh:mm AM/PM`; picker button with clock icon |
| End Time | Time Input + Picker | Yes | — | Disabled until Start Time is set |
| Include Fuel Surcharge | Checkbox | No | Unchecked | — |
| Include Vehicle | Checkbox | No | Unchecked | — |
| Add Instructions | Rich Text Editor | No | — | Toolbar: Bold, Italic, Unordered List, Ordered List, H1, H2; max 2000 chars (counter shown) |

### Additional Services (sub-section within Dedicated)

| Service | Element | Notes |
|---|---|---|
| Visitor Management | Checkbox | Optional add-on |
| Load Management | Checkbox | Optional add-on |

---

## Service Type B: Patrol Service

> Used for scheduled patrol visits with configurable visit patterns.

### Fields

| Field | Element Type | Required | Default | Notes |
|---|---|---|---|---|
| Select Resource Type | Dropdown | Yes | Armed Officer | Options: `Armed Officer`, `Dedicated Officer` |
| Line Item | Dropdown | Yes | — | Options: `Dedicated Security Officer (CBA)`, `Roving Patrol Tours` |
| Price Per Visit ($) | Spinbutton (number) | Yes | — | Validation: "Price Per Hit is required." |
| Total time on Property (mins) | Spinbutton (number) | No | — | Optional duration per visit |
| **Total Visits: 0** | Calculated Heading (H5) | — | 0 | Auto-calculated from visit sets |

### Visit Set Configuration (Patrol-specific)

Each **Visit Set** has:

| Field | Element Type | Required | Notes |
|---|---|---|---|
| Visit Type | Radio Group | No | `Random` (default) or `Fixed` |
| Visits Per Day | Number Input | Yes | Validation: "Number of Visits is required." |
| Time Duration → Start Time | Time Input | Yes | Validation: "Start Time is required." |
| Time Duration → End Time | Time Input | Yes | Validation: "End Time is required." |
| Visit Days (Mon–Sun) | Day-toggle buttons | Yes | Validation: "Job Days must have at least 1 item." |

- **Add Visit** button — adds additional visit set rows within same service
- **Visit summary** — displays: `Total 0: Mon 0, Tue 0, Wed 0, Thu 0, Fri 0, Sat 0, Sun 0`

### Additional Patrol Fields (outside Visit Set)

| Field | Element | Notes |
|---|---|---|
| Include Fuel Surcharge | Checkbox | No "Include Vehicle" in Patrol mode |
| Add Instructions | Rich Text Editor | Same as Dedicated (Bold, Italic, lists, H1/H2, 2000 char limit) |

> **Key difference from Dedicated:** No "Include Vehicle" checkbox and no "Additional Services" (Visitor Management / Load Management) in Patrol mode.

---

## Add Another Service

- **Button:** `+ Add another service` (icon + heading H3)
- **Description:** "Add more services as required by the contract to manage different duty types and timings."
- Each new service card gets its own independent configuration (Dedicated or Patrol)
- Services are numbered sequentially: Service 1, Service 2, etc.

---

## Validation Behavior

Validation is triggered on **Save & Next** click. Error messages appear inline below fields:

| Validation | Trigger Field | Message |
|---|---|---|
| Service name empty | Service Name textbox | "Service Name is required" |
| Line item not selected | Line Item dropdown | "Line Item is required." |
| No price set (Patrol) | Price Per Visit | "Price Per Hit is required." |
| No visit count | Visits Per Day | "Number of Visits is required." |
| No start time | Start Time | "Start Time is required." |
| No end time | End Time | "End Time is required." |
| No days selected | Day toggles | "Job Days must have at least 1 item." |

**Save & Next** button is **disabled** while required fields are incomplete.

---

## Locator Strategy Notes

| Element | Recommended Locator Strategy |
|---|---|
| Wizard steps | `getByText('1. Services')`, `getByText('2. Devices')`, etc. |
| Billing Cycle dropdown | `page.locator('div').filter({ hasText: /^Weekly$/ })` |
| Service Name input | `getByRole('textbox', { name: 'Service 1' })` |
| Dedicated Service radio | `getByRole('radio', { name: 'Dedicated Service' })` |
| Patrol Service radio | `getByRole('radio', { name: 'Patrol Service' })` |
| Resource Type dropdown | `getByText('Armed Officer')` (heading inside clickable div) |
| Line Item dropdown | `getByText('Select Line Item')` |
| Day buttons (Mon–Sun) | `page.locator('div').filter({ hasText: /^Mon$/ })` |
| Start Time input | `getByRole('textbox', { name: 'hh:mm AM/PM' }).first()` |
| End Time input | `getByRole('textbox', { name: 'hh:mm AM/PM' }).last()` |
| Include Fuel Surcharge | `getByRole('checkbox')` near `getByText('Include Fuel Surcharge')` |
| Include Vehicle | `getByRole('checkbox')` near `getByText('Include Vehicle')` |
| Instructions editor | `getByRole('textbox', { name: 'rdw-editor' })` |
| Visitor Management | `getByRole('checkbox')` near `getByText('Visitor Management')` |
| Load Management | `getByRole('checkbox')` near `getByText('Load Management')` |
| Add Visit button | `getByRole('button', { name: 'Add Visit' })` |
| Add Another Service | `getByRole('button')` with img + text `Add another service` |
| Save & Next | `getByRole('button', { name: 'Save & Next' })` |
| Update Proposal | `getByRole('button', { name: 'Update Proposal' })` |

---

## Key Behavioral Observations

1. **End Time is disabled** until a valid Start Time is entered.
2. **Billing Cycle** (Weekly/Bi-Weekly/Monthly) applies globally to all services in the proposal.
3. **Price display** on each service card updates live as fields are filled.
4. **USD total** in the footer bar updates dynamically.
5. **Patrol vs Dedicated** render significantly different field sets — selector matters for test branching.
6. **Add Visit** allows multiple visit patterns within a single Patrol service.
7. **Line Item options are the same** for both resource types (Armed Officer / Dedicated Officer).
8. **Service Name** defaults to "Service 1", "Service 2", etc. but is editable.
9. **Instructions editor** supports rich text (Bold, Italic, H1, H2, ordered/unordered lists) with 2000 char limit.
10. **Save & Next is disabled** (not just validation-blocked) when required fields are empty.

---

## Calculation Logic & Formulas

> All formulas below were **verified live** against the Signal Sales UAT application during exploratory testing on 2026-04-15.  
> Credentials used: `moiz.qureshi+ho@camp1.tkxel.com`  
> Contract under: Deal ID 19097 / Contract ID 246

---

### 1. Dedicated Service — Core Formula

```
Service Price (Weekly) =
  (Officers × Hourly Rate × Hours Per Day × Job Days)
  + (Vehicles × Vehicle Rate × Hours Per Day × Job Days)
```

Where:
- **Officers** = value in the Officer/Guard spinbutton
- **Hourly Rate** = value in the Hourly Rate ($) field
- **Hours Per Day** = End Time − Start Time (decimal hours)
- **Job Days** = number of active day-toggle buttons
- **Vehicles** = value in the Vehicle Count spinbutton (only if "Include Vehicle" is checked)
- **Vehicle Rate** = value in the Vehicle Rate ($) field (only if "Include Vehicle" is checked)

#### Verified Test Cases

| Case | Config | Formula | Expected | Verified |
|---|---|---|---|---|
| 1 — Cross-day, Sun, no vehicle | 1 officer @$30, 11:00 PM–10:00 AM (11 hrs), 1 day | 1×30×11×1 | **$330.00** | ✅ |
| 1b — Cross-day with vehicle | 1 officer @$30, 1 vehicle @$10, 11 PM–10 AM (11 hrs), Sun | (1×30×11×1)+(1×10×11×1) = 330+110 | **$440.00** | ✅ |
| 2 — Same-day, Thu, with vehicle | 1 officer @$30, 1 vehicle @$10, 12:00 PM–11:00 PM (11 hrs), Thu | (1×30×11×1)+(1×10×11×1) | **$440.00** | ✅ |
| 3 — Cross-day 6hrs (Omaha TZ) | 1 officer @$30, 1 vehicle @$10, 11:00 PM–5:00 AM (6 hrs), Mon | (1×30×6×1)+(1×10×6×1) = 180+60 | **$240.00** | ✅ |
| 4 — Same-day 14hrs (Omaha TZ) | 1 officer @$30, 1 vehicle @$10, 3:00 AM–5:00 PM (14 hrs), Mon | (1×30×14×1)+(1×10×14×1) = 420+140 | **$560.00** | ✅ |

---

### 2. Cross-Day Time Handling

The system **correctly computes hours across midnight**. It subtracts start time from end time treating overnight spans as valid durations:

| Start | End | Hours Computed |
|---|---|---|
| 11:00 PM | 10:00 AM | **11 hours** |
| 11:00 PM | 5:00 AM | **6 hours** |
| 3:00 AM | 5:00 PM | **14 hours** |
| 12:00 PM | 11:00 PM | **11 hours** |

No special handling is required by the automation — the UI resolves the span automatically once both times are entered.

---

### 3. Timezone Impact on Calculations

**Timezone does NOT affect the hour-count calculation.** The system computes price purely from:
> `End Time − Start Time` (wall-clock difference)

Testing with both **Eastern** and **Omaha (Central)** timezones for identical time inputs (e.g. 11PM–5AM) produced identical prices. Timezone selection is for scheduling/display context only.

---

### 4. Patrol Service — Core Formula

```
Service Price (Weekly) = Visits Per Day × Price Per Visit × Working Days
```

Where:
- **Visits Per Day** = value in the "Visits Per Day" number input
- **Price Per Visit** = value in the "Price Per Visit ($)" field
- **Working Days** = total number of unique days selected across ALL visit sets for this service
- **Time window (Start–End)** = defines patrol operating window only; has **zero effect** on price

#### Verified Test Case

| Case | Config | Formula | Expected | Verified |
|---|---|---|---|---|
| 5 — Patrol cross-day | 1 visit/day @$30, 11:00 PM–5:00 AM, Mon | 1×30×1 | **$30.00** | ✅ |

> The time duration (11PM–5AM = 6 hrs) has **no bearing** on the $30 price. Only the visit count and price-per-visit matter.

---

### 5. Multiple Visit Sets (within a single Patrol service)

Each additional visit set added via **"Add Visit"** contributes **additively** to Total Visits:

```
Total Visits = Σ (Visits Per Day × Days) for each visit set
Service Price = Total Visits × Price Per Visit
```

#### Verified Example

| Visit Set | Visits/Day | Days | Contribution |
|---|---|---|---|
| Set 1 | 1 | Mon | 1 |
| Set 2 | 2 | Tue | 2 |
| **Total** | — | — | **3** |

Price = 3 × $30 = **$90.00 / Weekly** ✅

---

### 6. Multiple Services — Grand Total

When multiple service cards exist, the **footer total is purely additive**:

```
Grand Total = Service 1 Price + Service 2 Price + ... + Service N Price
```

#### Verified Example

| Service | Type | Price |
|---|---|---|
| Service 1 (Patrol) | 3 visits × $30 | $90.00 |
| Service 2 (Dedicated) | 1 officer @$100/hr × 8 hrs × 1 day | $800.00 |
| **Footer Total** | — | **$890.00 / Weekly** ✅ |

---

### 7. Billing Cycle Multipliers

The **Billing Cycle** dropdown (top of the Services step) applies a global multiplier to all service prices and the footer total:

| Billing Cycle | Multiplier | Formula |
|---|---|---|
| Weekly | ×1 | Base price (no change) |
| Bi-Weekly | ×2 | Weekly price × 2 |
| Monthly | ×4.35 | Weekly price × (52.2 ÷ 12) |

> The Monthly multiplier of **4.35** is derived from 52.2 weeks per year ÷ 12 months.

#### Verified Examples

| Weekly Base | Bi-Weekly | Monthly (×4.35) |
|---|---|---|
| $830.00 | $1,660.00 ✅ | $3,610.50 ✅ |
| $30.00 | $60.00 ✅ | $130.50 ✅ |
| $800.00 | $1,600.00 ✅ | $3,480.00 ✅ |

The multiplier is applied **consistently** across all service types (Dedicated and Patrol) and the footer grand total.

---

### 8. Include Fuel Surcharge

The **"Include Fuel Surcharge"** checkbox is a **display/flag only** feature:

- Checking it does **not change** the service price.
- Checking it does **not change** the footer total.
- It is available on both Dedicated and Patrol service cards.
- Its purpose is to flag the contract as including a fuel surcharge for documentation/billing reference — no calculation effect.

**Verified:** Service price remained $800.00 before and after enabling Fuel Surcharge. ✅

---

### 9. Include Vehicle (Dedicated Only)

The **"Include Vehicle"** checkbox unlocks two additional fields:
- **Vehicle Count** (number spinbutton)
- **Vehicle Rate ($)** (number spinbutton)

The vehicle component is added **on top of** the officer component:

```
Total = (Officers × Hourly Rate × Hours × Days) + (Vehicles × Vehicle Rate × Hours × Days)
```

**Verified:** With 1 officer @$30, 1 vehicle @$10, 11 hrs, 1 day → $330 + $110 = **$440** ✅

> "Include Vehicle" is **not available** in Patrol service mode.

---

### 10. Suggested Rate System

The UI may display **Suggested Rates** (e.g., Hourly Rate: $25.26, Vehicle Rate: $3.32) derived from the selected Line Item:

- These are **informational suggestions only** — the system does **not enforce** them.
- Users (and automation) may enter any numeric rate value.
- Calculations use the **actual entered value**, not the suggested rate.

---

### 11. Delete Service / Delete Visit Set

- Each service card has a **Delete** control to remove the entire service.
- Each visit set within a Patrol service has a **Delete** control to remove that visit set.
- Deleting a service immediately removes its price contribution from the footer total.
- Deleting a visit set immediately reduces Total Visits and the service price accordingly.

---

### Quick Reference: Formula Summary

| Service Type | Formula |
|---|---|
| **Dedicated (no vehicle)** | `Officers × Hourly Rate × Hours × Days` |
| **Dedicated (with vehicle)** | `(Officers × Hourly Rate × Hours × Days) + (Vehicles × Vehicle Rate × Hours × Days)` |
| **Patrol (single visit set)** | `Visits Per Day × Price Per Visit × Days` |
| **Patrol (multiple visit sets)** | `(Σ Visits Per Day × Days per set) × Price Per Visit` |
| **Multiple services** | `Σ Individual Service Prices` |
| **Billing: Bi-Weekly** | `Weekly Total × 2` |
| **Billing: Monthly** | `Weekly Total × 4.35` |
