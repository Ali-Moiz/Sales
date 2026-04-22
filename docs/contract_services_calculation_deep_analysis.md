# Contract → Services: Deep Calculation Analysis
**Mode:** Training / Logic Discovery Only  
**Source:** Live JavaScript bundle (`main.b38037be.js`) — Signal Sales UAT  
**Modules Analyzed:** 26026 (calc engine), 42890 (Redux slice), 88752 (grand total), 88963 (UI component)  
**Date:** 2026-04-16  

---

## Part 1 — Internal Constants & Enums

### 1.1 Field Name Enum (`JJ` / `fe`)
All service object properties are keyed by this enum:

| Constant | Actual Key | Purpose |
|---|---|---|
| `NAME` | `name` | Service name |
| `TYPE` | `type` | Service type (DEDICATED / PATROL / DISPATCH) |
| `OFFICER_TYPE` | `officerType` | Officer resource type |
| `LINE_ITEM` | `lineItem` | Line item selection |
| `VISITS` | `visits` | Array of visit set objects |
| `START_TIME` | `startTime` | Duty start time |
| `END_TIME` | `endTime` | Duty end time |
| `DUTY_DAYS` | `dutyDays` | Array of selected day strings |
| `REQ_OFFICERS` | `reqOfficers` | Number of officers |
| `HOURLY_RATE` | `hourlyRate` | Hourly rate per officer ($) |
| `VEHICLE_RATE` | `vehicleRate` | Vehicle hourly rate ($) |
| `NO_OF_VEHICLES` | `noOfVehicles` | Number of vehicles |
| `INCLUDE_VEHICLE` | `includeVehicle` | Boolean flag |
| `ADD_FUEL_SURCHARGE` | `addFuelSurcharge` | Boolean flag (for payment terms step) |
| `PRICE_PER_HIT` | `pricePerHit` | Patrol price per visit ($) |
| `NUMBER_OF_VISITS` | `numberOfVisits` | Visits per day (per visit set) |
| `TOTAL` | `total` | Calculated total price |
| `ESTIMATED_PROFIT` | `estimatedProfit` | Calculated profit |
| `HOURS` | `hours` | Total officer-hours (Dedicated) |
| `CALCULATIONS` | `calculations` | Object of all billing cycle results |
| `TOTAL_VISITS` | `totalVisits` | Total visits (Patrol) |
| `TOTAL_DUTY_DAYS` | `totalDutyDays` | Per-day visit count map (Patrol) |
| `TIME_ON_PROPERTY` | `timeOnProperty` | Minutes on property per visit (informational) |

### 1.2 Billing Cycle Enum (`GO` / `Ae`)
```
MONTHLY   → '0'
BI_WEEKLY → '1'
WEEKLY    → '2'
FLAT      → implicit (no enum value, handled as special case in grand total)
```

### 1.3 Billing Cycle Multipliers (`O` / `Te`)
```javascript
{
  MONTHLY:   4.35,   // = 52.2 weeks ÷ 12 months
  BI_WEEKLY: 2,
  WEEKLY:    1,
  FLAT:      undefined  // → falls back to 1 (Te[e] ?? 1) in Patrol calc
}
```

### 1.4 Service Type Enum (`n3`)
```
PATROL    → 'patrol'
DEDICATED → 'dedicated'
DISPATCH  → 'dispatch'
```

---

## Part 2 — Duration Calculation Function `we()`

**Location:** Module 26026, exported indirectly (internal helper)  
**Signature:** `we({ startTime, endTime }) → Number (minutes) | null`

### Source Logic (reconstructed):
```javascript
we = ({ startTime, endTime }) => {
  if (!startTime || !endTime) return null;

  const now  = moment();                           // current moment (date irrelevant)
  const sObj = parse(startTime);                   // parse HH:mm from stored format
  const eObj = parse(endTime);

  // Set start: today at startTime hours:minutes
  const s = now.clone().set('hour', sObj.hour()).set('minute', sObj.minute());

  // Set end: today at endTime hours:minutes
  let l = now.clone().set('hour', eObj.hour()).set('minute', eObj.minute());

  // CROSS-DAY DETECTION: if end <= start (midnight crossing)
  if (l.isSameOrBefore(s, 'minute')) {
    l = l.add(1, 'd');   // push end to next calendar day
  }

  return l.diff(s, 'minute');   // result is in MINUTES
};
```

### Key Properties:
| Scenario | Behavior |
|---|---|
| `11:00 PM → 10:00 AM` | `l ≤ s` → add 1 day → diff = **660 min (11 hrs)** |
| `11:00 PM → 05:00 AM` | `l ≤ s` → add 1 day → diff = **360 min (6 hrs)** |
| `12:00 PM → 11:00 PM` | `l > s` → same day → diff = **660 min (11 hrs)** |
| `03:00 AM → 05:00 PM` | `l > s` → same day → diff = **840 min (14 hrs)** |
| `11:00 PM → 11:00 PM` | `l.isSameOrBefore(s)` = TRUE → add 1 day → diff = **1440 min (24 hrs)** |
| `startTime = null` | returns **null** → downstream total becomes 0 |
| `endTime = null` | returns **null** → downstream total becomes 0 |

### Cross-Day Logic — Critical Detail:
- The function uses `isSameOrBefore` (not strictly `isBefore`).
- **Exact same start and end time** (e.g., `09:00 AM → 09:00 AM`) is treated as a **24-hour shift**, NOT zero duration.
- A true zero-duration result is impossible via the normal cross-day path. The only way to get zero duration is if `we()` returns `null` (missing time input).

---

## Part 3 — Dedicated Service Calculation `uJ()` (function `Ee`)

**Location:** Module 26026, export `uJ`  
**Trigger:** Called inside Redux `updateServiceCardData` action when `service.type === DEDICATED`  
**Signature:** `uJ({ service, baseRates }) → { [billingCycle]: { total, estimatedProfit, hours } }`

### Full Step-by-Step Logic:

```
STEP 1 — Get first visit set
  o = service.visits[0]

STEP 2 — Compute total officer-minutes across all duty days
  duration_minutes = we(o)              // duration per day in minutes (null if times missing)
  
  if (dutyDays is null or empty) → a = null
  else → a = duration_minutes * dutyDays.length   // total minutes × days

STEP 3 — Compute officer-hours
  c = (a / 60) * o.reqOfficers         // total officer-hours = (minutes/60) × officers

STEP 4 — Compute officer revenue (weekly base)
  u = c * service.hourlyRate            // total cost to client per week

STEP 5 — Compute estimated profit
  baseRate = ke(service.officerType)    // look up base cost rate from baseRates
  d = u - c * baseRate                  // profit = revenue - (hours × base cost)

STEP 6 — Compute vehicle cost (conditional)
  if service.includeVehicle
     AND service.vehicleRate  (truthy)
     AND service.noOfVehicles (truthy)
     AND visits[0].dutyDays.length > 0
     AND service.type === DEDICATED:
    
    vehicleHours = we(visits[0]) / 60   // hours per day
    p = vehicleHours
        × parseFloat(service.vehicleRate)
        × parseInt(service.noOfVehicles)
        × visits[0].dutyDays.length
        × Te[WEEKLY]                    // × 1 (normalization to weekly base)
  else:
    p = 0

STEP 7 — Combine base totals
  m = u + p                             // weekly total = officer revenue + vehicle cost

STEP 8 — Apply billing cycle multipliers
  For each billing cycle (MONTHLY, BI_WEEKLY, WEEKLY):
    total[cycle]  = m > 0 ? m × Te[cycle] : 0
    profit[cycle] = m > 0 ? d × Te[cycle] : 0
    hours[cycle]  = m > 0 ? c × Te[cycle] : 0

  FLAT special case: total = m (no multiplier), profit = d, hours = c

STEP 9 — Format output
  CALCULATIONS[cycle].TOTAL            = total.toFixed(2)   ← string, 2 decimal places
  CALCULATIONS[cycle].ESTIMATED_PROFIT = profit             ← raw number
  CALCULATIONS[cycle].HOURS            = hours              ← raw number
```

### Dedicated Formula Summary:
```
Weekly Officer Cost  = (duration_min / 60) × officers × hourlyRate × days
Weekly Vehicle Cost  = (duration_min / 60) × vehicleRate × vehicles × days
Weekly Total (m)     = Officer Cost + Vehicle Cost
Cycle Total          = m × Te[cycle]
```

---

## Part 4 — Patrol Service Calculation `zI()` (function `_e`)

**Location:** Module 26026, export `zI`  
**Trigger:** Called inside Redux `updateServiceCardData` action when `service.type !== DEDICATED`  
**Signature:** `zI({ service, baseRates }) → { [billingCycle]: { total, estimatedProfit, totalVisits, totalDutyDays } }`

### Full Step-by-Step Logic:

```
STEP 1 — Accumulate visits across ALL visit sets
  i = {}   // per-day visit count map (e.g. { 'Mon': 3, 'Tue': 1 })
  o = service.visits.reduce((sum, visitSet) => {
    visitSet.dutyDays.forEach(day => {
      i[day] = (i[day] || 0) + Number(visitSet.numberOfVisits)
    })
    return sum + visitSet.numberOfVisits × visitSet.dutyDays.length
  }, 0)
  // o = total visits = Σ (visits_per_day × days) for each visit set

STEP 2 — Compute weekly base price
  l = o × service.pricePerHit          // total visits × price per visit

STEP 3 — Compute estimated profit
  baseRate = ke(service.officerType)
  c = l - o × baseRate                 // revenue - (visits × base cost)

STEP 4 — Apply billing cycle multipliers
  For each billing cycle:
    multiplier = Te[cycle] ?? 1        // fallback 1 for unknown cycles
    total[cycle]  = l > 0 ? l × multiplier : 0
    profit[cycle] = l > 0 ? c × multiplier : 0

STEP 5 — Store visit metadata (same for all cycles)
  CALCULATIONS[cycle].TOTAL_DUTY_DAYS = i   // per-day breakdown
  CALCULATIONS[cycle].TOTAL_VISITS    = o   // grand total visits

STEP 6 — Format output
  CALCULATIONS[cycle].TOTAL            = total       ← raw Number (NOT toFixed!)
  CALCULATIONS[cycle].ESTIMATED_PROFIT = profit      ← raw Number
```

### Patrol Formula Summary:
```
Total Visits (o) = Σ (visits_per_day × days) for each visit set
Weekly Base (l)  = Total Visits × pricePerHit
Cycle Total      = l × Te[cycle]
```

### Critical Patrol Insight — Time Window Has No Price Effect:
The `we()` duration function is **never called** inside `zI()`. The Start Time and End Time on patrol visit sets define the patrol window for operational scheduling only. They have absolutely zero mathematical contribution to the price calculation.

---

## Part 5 — Calculation Dispatch (Redux Action)

**Location:** Module 42890, `updateServiceCardData` reducer  

```javascript
// Called on every field change in a service card
e.services[n][a.JJ.CALCULATIONS] =
  s[a.JJ.TYPE] === a.n3.DEDICATED
    ? (0, a.uJ)({ service: s, baseRates: { ...i } })   // → Dedicated calc
    : (0, a.zI)({ service: s, baseRates: { ...i } });  // → Patrol calc
```

**Trigger timing:** Every time any field in a service card changes (real-time).  
**Result:** The `CALCULATIONS` property of the service is always fresh — no stale cache risk.

---

## Part 6 — Grand Total Aggregation `D2()` (function `N`)

**Location:** Module 88752, export `D2`  
**Called from:** Main wizard `useMemo` in module 88963  
**Signature:** `D2({ paymentTerms, services, onDemandServices }) → { [billingCycle]: { fuelSurchargeAmount, taxAmount, total } }`

### Full Step-by-Step Logic:

```
STEP 1 — Read payment term parameters
  taxRate        = paymentTerms.taxRate          // e.g. 5 (percent)
  flatRate       = paymentTerms.flatRate         // for FLAT billing
  fuelSurcharge  = paymentTerms.fuelSurcharge    // fuel surcharge % (from Step 4)

STEP 2 — Compute WEEKLY services subtotal (once, shared across cycles)
  u = services.reduce((sum, s) => sum + s.calculations[WEEKLY].total, 0)
  // ↑ ALL services' weekly totals summed FIRST, then multiplied

STEP 3 — For each billing cycle compute:

  a. Service base total at this cycle:
     d = u × O[cycle]

  b. Fuel surcharge amount (ONLY if paymentTerms.fuelSurcharge is set):
     fuelAmt = 0
     For each service where addFuelSurcharge = true:
       fuelAmt += (fuelSurcharge / 100) × service.calculations[cycle].total

  c. On-demand flat-rate dispatch:
     p = onDemandServices with flatRate dispatch × (price × quantity)
         × O[cycle]

  d. On-demand hourly dispatch:
     h = onDemandServices with hourly dispatch × (price × quantity)
         ÷ R[cycle]   (different multiplier/divisor for hourly)

  e. Subtotal before tax:
     f = d + (p × O[cycle]) + (h / R[cycle]) + fuelAmt

  f. FLAT billing override:
     if cycle === FLAT: f = Number(flatRate) + fuelAmt

  g. Tax:
     taxAmount = taxRate ? (taxRate / 100) × f : 0

  h. Grand total:
     grandTotal = f + taxAmount

STEP 4 — Return per-cycle result:
  s[cycle] = { fuelSurchargeAmount, taxAmount, total: grandTotal }
```

### Grand Total Formula (simplified, services step only — no on-demand, no tax):
```
weeklyBase  = Σ service.calculations[WEEKLY].total   (sum all services' weekly totals)
cycleTotal  = weeklyBase × Te[billingCycle]
```

---

## Part 7 — Service Card Price Display

**Location:** Module 88963 (UI component)  

```javascript
// Individual service card header shows:
service.calculations[selectedBillingCycle.value][JJ.TOTAL]

// Footer shows:
D2({ paymentTerms, services, onDemandServices })[selectedBillingCycle.value].total
```

**Formatting difference:**
- Dedicated `TOTAL` → stored as **string** (`toFixed(2)` applied during calc)
- Patrol `TOTAL` → stored as **raw Number** (toFixed NOT applied during calc; UI formatter handles display)

---

## Part 8 — Fuel Surcharge: Two-Level Behavior

This is the most nuanced behavior in the calculation system:

| Level | What it does |
|---|---|
| **Services Step (Step 1)**: `Include Fuel Surcharge` checkbox | Sets `service.addFuelSurcharge = true/false`. **Zero dollar impact** on service card price display. Purely a flag. |
| **Payment Terms Step (Step 4)**: Fuel Surcharge % field | Sets `paymentTerms.fuelSurcharge`. This is the actual percentage value. |
| **Grand Total**: `D2()` function | Multiplies `fuelSurcharge% / 100` × `service.calculations[cycle].total` **for each service where `addFuelSurcharge = true`**. Adds to footer total. |

**Implication:** A service with `addFuelSurcharge = true` but no Payment Terms fuel surcharge % → fuel surcharge = $0. A service with `addFuelSurcharge = false` but Payment Terms has a fuel surcharge % → that service is excluded from surcharge.

---

## Part 9 — Edge Case Coverage

| Edge Case | System Behavior |
|---|---|
| **startTime = null OR endTime = null** | `we()` returns `null` → `a = null` → guard fails → `c = 0, u = 0, m = 0` → total = $0 |
| **No days selected (dutyDays = [])** | `dutyDays.length = 0` → `a = null` guard fails → total = $0 |
| **officers = 0** | `c = 0` → `u = 0` → total from officers = $0 (vehicle still applies if set) |
| **hourlyRate = 0** | `u = 0` → officer total = $0 |
| **Same start and end time (e.g. 9AM → 9AM)** | `isSameOrBefore` = TRUE → treated as **24-hour shift** → 1440 minutes |
| **endTime exactly 1 min before startTime** | Cross-day → adds 1 day → 1439 minutes (23h 59m) |
| **Cross-day (11PM → 5AM)** | `5AM ≤ 11PM` → adds 1 day → 360 minutes (6 hrs) correctly |
| **Vehicle with includeVehicle = false** | Guard condition fails → `p = 0` |
| **Vehicle with vehicleRate = 0 or null** | `parseFloat(0) = 0` → `p = 0` |
| **Vehicle with noOfVehicles = 0 or null** | `parseInt(null) = NaN` → `p = NaN` → effectively breaks total ⚠️ |
| **Patrol with zero visits** | `o = 0` → `l = 0` → total = $0 |
| **Patrol with multiple visit sets** | Fully additive: total visits = Σ(visits_per_day × days per set) |
| **Patrol time window** | `we()` is NOT called → zero price impact regardless of duration |
| **Multiple services** | Each service independently calculates its WEEKLY total; D2() sums them before multiplying by cycle |
| **FLAT billing cycle** | `Te[FLAT] = undefined → ?? 1` in per-service calc; D2() overrides total to `flatRate` value |
| **m = 0 (no valid inputs)** | Guard `m > 0 ? ... : 0` → all billing cycle totals forced to $0 |
| **baseRates missing** | Early return: all billing cycles get `{ total: 0, estimatedProfit: 0, hours: 0 }` |
| **service = null** | Early return from both `uJ` and `zI` → zeroed out result |
| **Tax rate = 0 or null** | `Number(0) = falsy` → taxAmount = 0 (no tax) |
| **Fuel surcharge % without payment terms set** | `a = undefined` → entire fuel surcharge block skipped (no-op) |

---

## Part 10 — Dependency Map

### Dedicated Service Total — All Inputs:

```
service.visits[0].startTime          → we() → duration_minutes
service.visits[0].endTime            → we() → duration_minutes
service.visits[0].dutyDays           → days count
service.visits[0].reqOfficers        → officer count
service.hourlyRate                   → rate per officer-hour
service.officerType                  → baseRates lookup key (for profit only)
baseRates[officerType]               → base cost rate (profit calc only)
service.includeVehicle               → gate for vehicle cost
service.vehicleRate                  → vehicle rate per hour (if vehicle enabled)
service.noOfVehicles                 → vehicle count (if vehicle enabled)
billingCycle (Te multiplier)         → final cycle total
```

### Patrol Service Total — All Inputs:

```
service.visits[n].numberOfVisits     → visits per day (each visit set)
service.visits[n].dutyDays           → days per visit set
service.pricePerHit                  → price per visit
service.officerType                  → baseRates lookup (profit only)
baseRates[officerType]               → base cost rate (profit only)
billingCycle (Te multiplier)         → final cycle total
```
> **Not in dependency chain:** `startTime`, `endTime`, `timeOnProperty`

### Grand Total — All Inputs:

```
services[*].calculations[WEEKLY].total   → base for billing cycle scale-up
billingCycle                             → Te multiplier
paymentTerms.fuelSurcharge               → fuel surcharge %
service.addFuelSurcharge                 → which services are surcharge-eligible
paymentTerms.taxRate                     → tax %
paymentTerms.flatRate                    → flat billing total override
onDemandServices[*]                      → additional on-demand charges
```

---

## Part 11 — Calculation Flow Summary

```
USER CHANGES FIELD IN SERVICE CARD
           ↓
   Redux: updateServiceCardData
           ↓
   Is service.type === DEDICATED?
    YES → uJ({ service, baseRates })          NO → zI({ service, baseRates })
           ↓                                           ↓
   we(visits[0])                          visits.reduce(totalVisits)
   = duration in minutes                  = Σ (visits_per_day × days)
           ↓                                           ↓
   a = minutes × days                     l = totalVisits × pricePerHit
   c = (a/60) × officers                  c = l - totalVisits × baseRate
   u = c × hourlyRate                              ↓
   p = (hrs × vehicleRate × vehicles × days)  CALCULATIONS = {
   m = u + p                                 [cycle]: {
           ↓                                   TOTAL = l × Te[cycle],
   CALCULATIONS = {                            TOTAL_VISITS,
     [cycle]: {                                TOTAL_DUTY_DAYS
       TOTAL = m × Te[cycle].toFixed(2),     }
       HOURS = c × Te[cycle],              }
       ESTIMATED_PROFIT = d × Te[cycle]
     }
   }
           ↓                   ↓
   service.CALCULATIONS updated in Redux store
           ↓
   D2({ paymentTerms, services, onDemandServices })  ← useMemo in wizard
           ↓
   u = Σ service.calculations[WEEKLY].total
   d = u × Te[selectedCycle]
   + fuelSurcharge (per-service, from paymentTerms %)
   + onDemand
   + tax
           ↓
   Footer: grandTotal[selectedCycle].total displayed as "USD X.XX Weekly"
   Service card: service.calculations[selectedCycle].total displayed as "$X.XX / Weekly"
```

---

## Part 12 — Rounding Behavior

| Location | Rounding Applied |
|---|---|
| Dedicated `CALCULATIONS[cycle].TOTAL` | `.toFixed(2)` — stored as **2-decimal string** |
| Patrol `CALCULATIONS[cycle].TOTAL` | **None** — stored as raw float |
| Grand total `D2().total` | No explicit rounding; UI formatter handles display |
| `ESTIMATED_PROFIT` | No rounding |
| `HOURS` | No rounding |

**Implication for automation:** When asserting Dedicated service card price, expect exact 2-decimal string match. For Patrol totals and footer totals, floating point imprecision is possible — use approximate assertion (`toBeCloseTo`) or format after retrieval.

---

## Appendix — Officer Type Enum (`VH`)
```
ARMED_OFFICER       → 'armed_officer'
PATROL_OFFICER      → 'patrol_officer'
DEDICATED_OFFICER   → 'dedicated_officer'
VISITOR_MANAGEMENT  → (add-on)
LOAD_MANAGEMENT     → (add-on)
```

## Appendix — Visit Type Enum (`xu`)
```
FIXED  → fixed schedule
RANDOM → random within time window
```
(Visit type does not affect price calculation — for operational use only)
