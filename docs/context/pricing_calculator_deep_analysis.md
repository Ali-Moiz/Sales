# Pricing Calculator — Complete Calculation Intelligence Report
**Source File:** Pricing Calculator Calculation-Phase 1.xlsm  
**Sheets Analyzed:** Assumptions, Dedicated, Dedicated Vehicle, Patrol  
**Mode:** Training Only — Logic Discovery  
**Date:** 2026-04-16  
**Linked To:** Contract → Services red hyperlink (Profit/Loss indicator)

---

## Part 1 — Assumptions Sheet: Complete Configuration Map

The Assumptions sheet is the **master configuration store** for all pricing calculations. It maps directly to `Settings → Pricing Configuration → Franchise Level → [Franchise Name, e.g. 216 Omaha]` in the application. Every percentage and dollar value here feeds into the Dedicated, Dedicated Vehicle, and Patrol sheets.

### 1.1 Payroll Taxes (Column C — % of Payroll)

| Cell | Label | Value | Purpose |
|---|---|---|---|
| C5 | Social Security | 6.20% | Federal payroll tax |
| C6 | SUTA | 1.75% | State unemployment tax |
| C7 | FUTA | 0.60% | Federal unemployment tax |
| C8 | Medicare Taxes | 1.45% | Federal Medicare |
| C9 | Other | 0.00% | Configurable |
| **C10** | **Total Payroll Taxes** | **10.00%** | `=SUM(C5:C9)` — used everywhere |

**Application mapping:** Settings → Pricing Configuration → Payroll Taxes section

---

### 1.2 Overtime Configuration (Column C)

| Cell | Label | Value | Purpose |
|---|---|---|---|
| **C13** | **Overtime %** | **2.00%** | % of payroll hours classified as overtime |

Used to compute the extra 50% premium on overtime hours in all three service types.

---

### 1.3 Overhead (Column C — % of Revenue)

| Cell | Label | Value | Purpose |
|---|---|---|---|
| **C16** | **Dedicated Overhead** | **8.00%** | Applied to Dedicated service revenue |
| **C17** | **Patrol Overhead** | **8.00%** | Applied to Patrol service revenue |

Overhead payroll represents supervisory, admin, and indirect labor not billed directly to the client.

---

### 1.4 Payment Terms Adjustment (Column C)

| Cell | Label | Value | Purpose |
|---|---|---|---|
| **C20** | **Payment Terms Adjustment** | **0.82%** | Applied to Dedicated revenue only |

This is added as a cost when the client requests extended payment terms (e.g. Net-30, Net-60). For favorable/pre-payment terms, a negative value (discount) is entered.

**Lookup table (rows 24–29):**
| Days to Pay | APR Equivalent |
|---|---|
| 30 days | ≈ 0.82% |
| 60 days | ≈ 1.64% |
| 90 days | ≈ 2.47% |
| 120 days | ≈ 3.29% |

Formula: `APR = Days / 365 × 10%` (assuming 10% annual rate)

---

### 1.5 FAS Charges — Franchise System Fees (Column G — % of Revenue)

| Cell | Label | Value | Excluded from Ded. Vehicle? |
|---|---|---|---|
| G5 | Royalty | 9.00% | No |
| G6 | Territory | 4.00% | No |
| G7 | GL Insurance | 0.00% | **YES (marked X)** |
| G8 | Auto Insurance | 0.00% | No |
| G9 | Interest | 1.00% | No |
| G10 | Convention | 3.00% | No |
| G11 | Dispatch | 4.00% | No |
| G12 | ALN | 5.00% | No |
| G13 | Email | 3.00% | No |
| G14 | Other | 4.00% | No |
| **G15** | **Total FAS (Dedicated & Patrol)** | **33.00%** | `=SUM(G5:G14)` |
| **G16** | **Dedicated Vehicle FAS** | **33.00%** | `=SUMIFS(G5:G14, H5:H14, "<>X")` |

**Application mapping:** Settings → Pricing Configuration → FAS Charges

---

### 1.6 Monthly Vehicle Expenses (Column K — $ per Vehicle per Month)

| Cell | Label | Value |
|---|---|---|
| K5 | Payment (Loan/Lease) | $700.00 |
| K6 | Insurance | $160.00 |
| K7 | Repairs & Maintenance | $250.00 |
| K8 | Tax & Registration | $50.00 |
| **K9** | **Total Monthly per Vehicle** | **$1,160.00** (`=SUM(K5:K8)`) |

### 1.7 Vehicle Fuel Assumptions (Column K)

| Cell | Label | Value |
|---|---|---|
| K12 | Cost per Gallon | $3.00 |
| K13 | Avg MPG | 16 mpg |
| K14 | Patrol Roaming Speed | 5 mph |

---

### 1.8 Administration Expenses (Column N — % of Revenue)

| Cell | Label | Value | Excluded from Ded. Vehicle? |
|---|---|---|---|
| N5 | Advertising & Marketing | 0.00% | No |
| N6 | Background Check | 0.10% | No |
| N7 | Bank Charges | 0.00% | No |
| N8 | Charitable Donations | 0.00% | No |
| N9 | Drug Tests | 0.10% | No |
| N11 | Dues & Subscriptions | 0.00% | No |
| N12 | Education & Training | 0.50% | No |
| N13 | Employee Benefits | 0.00% | No |
| N14 | Equipment Expense | 0.25% | No |
| N15 | Insurance - GL (Non FG) | 0.00% | **YES (X)** |
| N16 | Insurance - Workers Comp | 2.50% | **YES (X)** |
| N17 | Interest | 0.00% | No |
| N18 | Licenses & Permits | 0.25% | No |
| N19 | Meals/Entertainment | 0.00% | No |
| N20 | Office Supplies & Software | 0.00% | No |
| N21 | Professional Fees | 0.00% | No |
| N25 | Uniforms | 0.50% | **YES (X)** |
| **N28** | **Total Admin Expenses** | **4.20%** | `=SUM(N5:N27)` — used for Dedicated & Patrol |
| **N29** | **Dedicated Vehicle Admin** | **1.20%** | `=SUMIFS(N5:N27,O5:O27,"<>X")` — excludes Workers Comp, GL, Uniforms |

---

## Part 2 — Dedicated Sheet: Full Calculation Chain

### 2.1 User Inputs (Blue Cells)

| Column | Field | Purpose |
|---|---|---|
| N (rows 5–13) | Pay Rate ($/hr) | Hourly cost per officer role |
| O (rows 5–13) | Bill Rate ($/hr) | Hourly charge to client per role |
| P (rows 5–13) | Weekly Hours | Hours per week per role |

**Roles supported:** Officer, Advanced Officer, Branch Supervisor, Coordinator-Site, and more (rows 5–13). Row 13 is reserved for 1099 contractors (different tax treatment).

---

### 2.2 Per-Role Calculations (Columns Q, R, S, T)

For each officer role row:

```
Q = P × N                    → Weekly Payroll (hours × pay rate)
R = ((P×N) + (P × OT% × N/2)) × (1 + PayrollTaxRate)
  = Total Loaded Cost per Week
  = Regular pay + Overtime premium + Payroll taxes

S = P × O                    → Weekly Revenue (hours × bill rate)

T = R / S                    → Labor Efficiency % (LE%) = loaded cost / revenue
```

**1099 exception (row 13):** `R13 = (P×N) + (P × OT% × N/2)` — no payroll tax multiplier.

---

### 2.3 Blended Rates (Row 14)

```
P14 = SUM(P5:P13)            → Total Weekly Hours (all roles combined)
Q14 = SUM(Q5:Q13)            → Total Weekly Payroll
S14 = SUM(S5:S13)            → Total Weekly Revenue

N14 = Q14 / P14              → Blended Pay Rate ($/hr)
O14 = S14 / P14              → Blended Bill Rate ($/hr)
```

---

### 2.4 Revenue Row (Row 5)

```
C5  = O14                    → Hourly rate (= blended bill rate)
D5  = O14 × (P14/7)          → Daily Revenue (bill rate × daily hours)
E5  = D5 × 7                 → Weekly Revenue
F5  = D5 × 14                → Bi-Weekly Revenue
G5  = D5 × 30.42             → Monthly Revenue
H5  = D5 × 180               → 180-day Revenue
I5  = G5 × (365/30.42)       → Annual Revenue
```

---

### 2.5 Payroll & Overtime Rows (Rows 7–8)

```
D7  = N14 × (P14/7)          → Daily Payroll (blended pay rate × daily hours)
D8  = (P14/7 × OT%) × (N14/2)  → Daily Overtime Premium
    = Daily hours × 2% overtime × half pay rate
    (The "half" is the premium above base: OT rate = 1.5× base; premium above base = 0.5×)
```

---

### 2.6 Payroll Taxes Row (Row 9)

```
D9 = (D7 + D8) × (SUM(Q5:Q12)/Q14) × C10_Assumptions
   = (Payroll + OT) × (non-1099 ratio) × 10% payroll tax
```
The `SUM(Q5:Q12)/Q14` ratio excludes 1099 contractors from tax calculation.

---

### 2.7 Total Officer Payroll → Total Payroll (Rows 10–12)

```
Row 10 = SUM(Rows 7:9)       → Total Officer Payroll (payroll + OT + taxes)
Row 11 = Revenue × 8%        → Overhead Payroll (Assumptions!C16)
Row 12 = Row10 + Row11       → Total Payroll
```

**LE Target:** Total Officer Payroll / Revenue < 64%

---

### 2.8 Gross Profit (Row 14)

```
Gross Profit = Revenue − Total Payroll
```

---

### 2.9 FAS Charges (Row 16)

```
FAS = Revenue × 33%          (Assumptions!G15)
```

---

### 2.10 Remaining Balance (Row 18)

```
Remaining = Gross Profit − FAS
```

---

### 2.11 Administration Expenses (Row 21)

```
Admin = Revenue × 4.2%       (Assumptions!N28)
```

---

### 2.12 Payment Terms Adjustment (Row 22)

```
Payment Terms = Revenue × 0.82%   (Assumptions!C20)
```
Only applies to Dedicated service. Not present in Vehicle or Patrol calculators.

---

### 2.13 Net Margin (Row 24) — The Profit/Loss Output

```
Net Margin = Remaining Balance − Vehicle Expenses − Admin − Payment Terms
           = (Gross Profit − FAS) − 0 − Admin − Payment Terms
```

**Net Margin % Thresholds (Red Hyperlink Color Logic):**
| Net Margin % | Indicator |
|---|---|
| ≥ 12% | **Green** — Healthy profit |
| 8% – 12% | **Yellow** — Marginal |
| < 8% | **Red** — Loss risk |

---

### 2.14 Complete Dedicated Formula Chain

```
Revenue (Weekly) = BlendedBillRate × WeeklyHours

Payroll       = BlendedPayRate × WeeklyHours
Overtime      = WeeklyHours × OT% × PayRate/2
PayrollTaxes  = (Payroll + Overtime) × 10%
OfficerPayroll= Payroll + Overtime + PayrollTaxes
OverheadPayroll = Revenue × 8%
TotalPayroll  = OfficerPayroll + OverheadPayroll

GrossProfit   = Revenue − TotalPayroll

FAS           = Revenue × 33%
Remaining     = GrossProfit − FAS

AdminExpenses = Revenue × 4.2%
PaymentTerms  = Revenue × 0.82%

NetMargin     = Remaining − AdminExpenses − PaymentTerms
NetMargin%    = NetMargin / Revenue
```

---

## Part 3 — Dedicated Vehicle Sheet: Full Calculation Chain

### 3.1 User Inputs (Blue Cells)

| Cell | Field | Default |
|---|---|---|
| M4 | Bill Rate ($/hr) | $20.00 |
| M5 | Hours per Day | 2 |
| M6 | Hours Used for Unrelated Activities | 0 |
| M8 | Number of Vehicles | 2 |
| M9 | Days per Month | 30.42 |

---

### 3.2 Vehicle Usage Ratio

```
M7 = M5 / (M5 + M6) = Dedicated Vehicle Usage Ratio
   = Hours used for THIS service / Total vehicle hours
   = 2 / (2 + 0) = 100%
```

This ratio scales all fixed vehicle costs (payment, insurance, R&M, registration) proportionally.

---

### 3.3 Revenue (Row 5)

```
C5  = M4                         → Hourly bill rate
D5  = M5 × M4 × M8               → Daily Revenue = Hours/day × Rate × Vehicles
E5  = D5 × 7                     → Weekly
F5  = D5 × 14                    → Bi-Weekly
G5  = D5 × 30.42                 → Monthly
```

---

### 3.4 Vehicle Expenses — Individual Breakdown (Rows 15–19, Monthly = Column G)

| Row | Expense | Formula (Monthly) |
|---|---|---|
| 15 | Payment | `= Vehicles × $700 × UsageRatio` |
| 16 | Insurance | `= Vehicles × $160 × UsageRatio` |
| 17 | Repairs & Maintenance | `= Vehicles × $250 × UsageRatio` |
| 18 | Tax & Registration | `= Vehicles × $50 × UsageRatio` |
| 19 | Fuel | `= Hours/day × Days/month × Speed / MPG × CostPerGallon × Vehicles` |

**Fuel formula expanded:**
```
Monthly Fuel = M5 × M9 × K14 / K13 × K12 × M8
             = HoursPerDay × DaysPerMonth × PatrolSpeed(5mph) / MPG(16) × $/gal($3) × Vehicles
             = Miles/month / MPG × $/gal × Vehicles
             where Miles/month = HoursPerDay × DaysPerMonth × Speed
```

---

### 3.5 Total Vehicle Expenses (Row 20, Monthly)

```
G20 = (M8 × K9 × M7) + Fuel
    = (Vehicles × $1,160/month × UsageRatio) + Monthly_Fuel_Cost
```

Daily/Weekly/Annual versions are derived from the monthly G column:
```
D20 = (1/M9) × G20
E20 = (7/M9) × G20
I20 = G20 × (365/M9)
```

---

### 3.6 FAS Charges (Row 11)

```
FAS = Revenue × 33%    (Assumptions!G16 — Vehicle FAS, excludes GL Insurance)
```

---

### 3.7 Administration Expenses (Row 22)

```
Admin = Revenue × 1.2%    (Assumptions!N29 — Vehicle Admin, excludes Workers Comp, Uniforms, GL)
```
Significantly lower than the standard 4.2% because vehicle services exclude certain HR-related costs.

---

### 3.8 Net Profit (Row 24) — Profit/Loss Output

```
Net Profit = Remaining Balance − Vehicle Expenses − Admin Expenses
           = (Revenue − FAS) − Vehicle Expenses − Admin
```

**Threshold:** Must be > 0% to break even (no tiered color logic — simple positive/negative check).

### 3.9 Complete Dedicated Vehicle Formula Chain

```
Revenue (Daily)   = BillRate × HoursPerDay × NumVehicles
Revenue (Monthly) = Revenue(Daily) × 30.42

VehicleUsageRatio = HoursForService / (HoursForService + HoursUnrelated)

FixedVehicleCost (Monthly) = NumVehicles × $1,160 × VehicleUsageRatio
FuelCost (Monthly)         = HoursPerDay × 30.42 × 5mph / 16mpg × $3 × NumVehicles
TotalVehicleCost           = FixedCost + FuelCost

FAS        = Revenue × 33%
Remaining  = Revenue − FAS

AdminExp   = Revenue × 1.2%

NetProfit  = Remaining − TotalVehicleCost − AdminExp
NetProfit% = NetProfit / Revenue
```

---

## Part 4 — Patrol Sheet: Full Calculation Chain

### 4.1 User Inputs (Blue Cells)

| Cell | Field | Default |
|---|---|---|
| C5 | Total Patrols per Night | 4 |
| C6 | Avg Drive Time Between Properties (mins) | 40 |
| C7 | Avg Distance to Nearest Property (miles) | 8 |
| C8 | Total Time on Property (mins) | 15 |
| C10 | Bill Rate per Patrol ($) | $30.00 |
| C15 | Hours Vehicle Used for Unrelated Activities | 0 |
| C18 | Avg Hourly Pay Rate ($) | $10.00 |

---

### 4.2 Derived Operational Metrics

```
C9  = (C7 × C5) + (C5 × (C8/60 × K14))
    = Miles_to_site × Patrols + Patrols × (OnPropertyHours × RoamingSpeed)
    = Total Miles Driven per Night

C11 = C10 / C8          → Dollar per Minute on Property
C12 = 30.42             → Days per Month (constant)
C13 = C5 × (C6 + C8)    → Total Patrol Minutes per Night
    = Patrols × (Drive time + On-property time)

C14 = C13 / 60          → Total Patrol Hours per Night

C16 = C14 / (C14 + C15) → Patrol Vehicle Usage Ratio
C17 = C10 × C5 / C14    → Effective Hourly Bill Rate
    = (Rate × Patrols) / Total Hours
```

---

### 4.3 Revenue (Row 5)

```
H5 (Daily)   = C5 × C10 = Patrols × Bill Rate per Patrol
I5 (Weekly)  = H5 × 7
J5 (Bi-Wkly) = H5 × 14
K5 (Monthly) = H5 × 30.42
G5 (Hourly)  = H5 / C14 = Daily / Total Hours
```

---

### 4.4 Payroll Rows (Rows 7–12)

```
H7 (Payroll Daily)   = C14 × C18 = TotalHours × HourlyPayRate
H8 (Overtime Daily)  = (C14 × OT%) × (C18/2) = Overtime hours × 0.5× premium
H9 (PayrollTaxes)    = (H7+H8) × 10%

H10 (Officer Payroll) = H7+H8+H9

H11 (Overhead)        = H5 × 8%   (Revenue × Patrol Overhead Assumptions!C17)
H12 (Total Payroll)   = H10 + H11
```

**LE Target for Patrol:** Officer Payroll / Revenue < 34%  
(Much lower than Dedicated's 64% because patrol visits are brief and revenue per hour is higher)

---

### 4.5 Gross Profit & FAS (Rows 14–18)

```
H14 (Gross Profit)    = H5 − H12
H16 (FAS)             = H5 × 33%
H18 (Remaining)       = H14 − H16
```

---

### 4.6 Vehicle Expenses (Row 20, Monthly = Column K)

```
K20 = (K9 × C16) + ((C9/K13) × K12 × C12)
    = ($1,160 × VehicleUsageRatio) + ((MilesPerNight / MPG) × $/gal × DaysPerMonth)
    = FixedVehicleCost + FuelCost
```

Note: Patrol assumes **one patrol vehicle** (no vehicle count multiplier). The `K9` ($1,160) is the monthly fixed cost for that one vehicle, scaled by usage ratio.

---

### 4.7 Administration Expenses (Row 21)

```
Admin = Revenue × 4.2%    (Assumptions!N28 — same as standard Dedicated)
```

---

### 4.8 Net Profit (Row 23) — Profit/Loss Output

```
Net Profit = Remaining − Vehicle Expenses − Admin Expenses
           = (Gross Profit − FAS) − VehicleCost − Admin
```

### 4.9 Complete Patrol Formula Chain

```
TotalHours/Night  = (Patrols × (DriveTime + OnPropertyTime)) / 60

Revenue (Daily)   = Patrols × BillRatePerPatrol

Payroll           = TotalHours × PayRate
Overtime          = TotalHours × OT% × PayRate/2
PayrollTaxes      = (Payroll + Overtime) × 10%
OfficerPayroll    = Payroll + Overtime + PayrollTaxes
OverheadPayroll   = Revenue × 8%
TotalPayroll      = OfficerPayroll + OverheadPayroll

GrossProfit       = Revenue − TotalPayroll

FAS               = Revenue × 33%
Remaining         = GrossProfit − FAS

MilesPerNight     = (Distance × Patrols) + (Patrols × OnPropertyHours × 5mph)
FuelCostMonthly   = (MilesPerNight / 16mpg) × $3/gal × 30.42 days
VehicleCostMonthly= $1,160 × VehicleUsageRatio + FuelCostMonthly

AdminExpenses     = Revenue × 4.2%

NetProfit         = Remaining − VehicleCost − AdminExpenses
NetProfit%        = NetProfit / Revenue
```

---

## Part 5 — Red Hyperlink: How It Works

Inside Contract → Services, a **red hyperlink text** appears next to the Rate field. This is the application's live pricing profitability indicator. Here is exactly how it works:

### 5.1 What Triggers the Hyperlink
When a user enters an Hourly Rate (Dedicated) or Price Per Visit (Patrol), the system compares that entered rate against the **Suggested Rate** — which is derived from the Pricing Calculator logic using the Assumptions sheet values for the selected franchise.

### 5.2 What the Hyperlink Displays
When clicked, the hyperlink opens a breakdown showing:
- Total Revenue at the entered rate
- Total Payroll (with overtime and taxes)
- FAS Charges
- Administration Expenses  
- Net Margin / Net Profit
- **Profit or Loss determination**

### 5.3 Profit / Loss Color Logic
| Result | Display | Threshold |
|---|---|---|
| **Dedicated Net Margin ≥ 12%** | Green / Profit | Healthy |
| **Dedicated Net Margin 8–12%** | Yellow / Marginal | Warning |
| **Dedicated Net Margin < 8%** | Red / Loss | Unprofitable |
| **Vehicle Net Profit > 0%** | Positive | Breakeven |
| **Vehicle Net Profit ≤ 0%** | Red / Loss | Below breakeven |

### 5.4 Suggested Rate Origin
The Suggested Rate the application pre-fills is the **minimum profitable rate** — i.e., the bill rate at which Net Margin hits the target threshold, given all Assumptions values for the franchise.

---

## Part 6 — Sheet Dependency Map

```
Assumptions Sheet
     │
     ├── C10  (Payroll Taxes 10%)          → Dedicated Row 9, Vehicle N/A, Patrol Row 9
     ├── C13  (Overtime % 2%)              → Dedicated Row 8, Patrol Row 8
     ├── C16  (Dedicated Overhead 8%)      → Dedicated Row 11
     ├── C17  (Patrol Overhead 8%)         → Patrol Row 11
     ├── C20  (Payment Terms 0.82%)        → Dedicated Row 22 ONLY
     ├── G15  (Total FAS 33%)              → Dedicated Row 16, Patrol Row 16
     ├── G16  (Vehicle FAS 33%)            → Dedicated Vehicle Row 11
     ├── K5–K8 (Monthly Vehicle $/vehicle) → Dedicated Vehicle Rows 15–18
     ├── K9   (Total Monthly $1,160)       → Dedicated Vehicle Row 20, Patrol Row 20
     ├── K12  ($/gallon $3)                → Dedicated Vehicle Row 19, Patrol Row 20
     ├── K13  (MPG 16)                     → Dedicated Vehicle Row 19, Patrol Row 20
     ├── K14  (Patrol Speed 5mph)          → Patrol Row 9 (miles calc), Ded.Vehicle Row 19
     ├── N28  (Admin 4.2%)                 → Dedicated Row 21, Patrol Row 21
     └── N29  (Vehicle Admin 1.2%)         → Dedicated Vehicle Row 22
```

---

## Part 7 — Configuration Mapping Summary

```
Application Setting Path                      → Assumption Cell → Formula Usage → Output
─────────────────────────────────────────────────────────────────────────────────────────
Settings → Payroll Taxes → Social Security    → C5 (6.2%)       → C10 total     → Payroll cost
Settings → Payroll Taxes → SUTA               → C6 (1.75%)      → C10 total     → Payroll cost
Settings → Payroll Taxes → FUTA               → C7 (0.6%)       → C10 total     → Payroll cost
Settings → Payroll Taxes → Medicare           → C8 (1.45%)      → C10 total     → Payroll cost
Settings → Overtime %                         → C13 (2%)        → OT premium    → OT cost
Settings → Overhead → Dedicated               → C16 (8%)        → Overhead row  → Total payroll
Settings → Overhead → Patrol                  → C17 (8%)        → Overhead row  → Total payroll
Settings → Payment Terms Adjustment           → C20 (0.82%)     → Row 22        → Net margin
Settings → FAS → Royalty                      → G5 (9%)         → G15 total     → FAS charge
Settings → FAS → Territory                    → G6 (4%)         → G15 total     → FAS charge
Settings → FAS → Interest                     → G9 (1%)         → G15 total     → FAS charge
Settings → FAS → Convention                   → G10 (3%)        → G15 total     → FAS charge
Settings → FAS → Dispatch                     → G11 (4%)        → G15 total     → FAS charge
Settings → FAS → ALN                          → G12 (5%)        → G15 total     → FAS charge
Settings → FAS → Email                        → G13 (3%)        → G15 total     → FAS charge
Settings → Vehicle → Monthly Payment          → K5 ($700)       → Vehicle cost  → Net profit
Settings → Vehicle → Insurance                → K6 ($160)       → Vehicle cost  → Net profit
Settings → Vehicle → R&M                      → K7 ($250)       → Vehicle cost  → Net profit
Settings → Vehicle → Tax & Registration       → K8 ($50)        → Vehicle cost  → Net profit
Settings → Vehicle → Cost per Gallon          → K12 ($3)        → Fuel cost     → Net profit
Settings → Vehicle → Avg MPG                  → K13 (16)        → Fuel cost     → Net profit
Settings → Vehicle → Patrol Roaming Speed     → K14 (5mph)      → Miles calc    → Fuel cost
Settings → Admin → Background Check           → N6 (0.1%)       → N28 total     → Admin cost
Settings → Admin → Drug Tests                 → N9 (0.1%)       → N28 total     → Admin cost
Settings → Admin → Education & Training       → N12 (0.5%)      → N28 total     → Admin cost
Settings → Admin → Equipment Expense          → N14 (0.25%)     → N28 total     → Admin cost
Settings → Admin → Workers Comp               → N16 (2.5%)      → N28 (excl N29)→ Admin cost
Settings → Admin → Licenses & Permits         → N18 (0.25%)     → N28 total     → Admin cost
Settings → Admin → Uniforms                   → N25 (0.5%)      → N28 (excl N29)→ Admin cost
```

---

## Part 8 — Vehicle Logic: Key Differences from Dedicated

| Aspect | Dedicated (No Vehicle) | Dedicated Vehicle | Patrol |
|---|---|---|---|
| Vehicle Expenses | $0 (hardcoded) | `Vehicles × $1,160 × UsageRatio + Fuel` | `$1,160 × UsageRatio + Fuel` (1 vehicle) |
| Vehicle Count | N/A | User input (M8) | Always 1 (implied) |
| FAS Rate | 33% (G15) | 33% (G16, excludes GL Insurance) | 33% (G15) |
| Admin Rate | 4.2% (N28) | 1.2% (N29, excludes Workers Comp, Uniforms, GL) | 4.2% (N28) |
| Payment Terms | Yes (0.82%) | **No** | **No** |
| Payroll | Officer-based | $0 (no officers) | Officer-based |
| Profit Target | Net Margin ≥ 12% Green | Net Profit > 0% | Net Profit > 0% |
| Usage Ratio | N/A | Hours for service / Total hours | Patrol hours / Total hours |
| Fuel Formula | N/A | Hours × Days × Speed / MPG × $/gal × Vehicles | Miles/night / MPG × $/gal × Days |

---

## Part 9 — Patrol vs Dedicated: Key Differences

| Aspect | Dedicated | Patrol |
|---|---|---|
| Revenue driver | Bill Rate × Hours | Patrols × Bill Rate per Patrol |
| Payroll driver | Officers × Pay Rate × Hours | Total patrol hours × Pay Rate |
| LE Target | < 64% | < 34% |
| Time impact on revenue | Direct (hours × rate) | Indirect (patrols define revenue, time defines cost) |
| Vehicle expenses | None (unless Dedicated Vehicle sheet) | Always included (patrol vehicle) |
| Dollar per Minute metric | Not applicable | C11 = BillRate / OnPropertyMinutes |
| Payment Terms | Yes | No |
| Net Margin target | ≥ 12% / 8%–12% / < 8% (tiered) | > 0% (break-even only) |

---

## Part 10 — Risk Areas Identified

| Risk | Sheet | Impact |
|---|---|---|
| **Vehicle usage ratio near zero**: If hours for unrelated activities dominate, vehicle cost per service inflates dramatically | Dedicated Vehicle, Patrol | Net profit goes negative |
| **FAS 33% is the largest single cost**: Any rate entered that doesn't cover payroll + 33% is immediately unprofitable | All sheets | Red hyperlink triggered |
| **Patrol fuel uses Patrol Roaming Speed (K14=5mph)**: This is speed ON property, not transit speed. Transit distance (C7×C5) uses separate inputs | Patrol | Miles and fuel may be understated if transit speed ≠ roaming speed |
| **Payment Terms Adjustment only on Dedicated**: If client requests Net-60 payment and service is Patrol or Vehicle, no adjustment is factored | Dedicated Vehicle, Patrol | Profit overstated for extended-term patrol contracts |
| **1099 contractor tax exclusion**: Row 13 payroll does not include payroll taxes — mixing 1099 and W2 staff requires careful row-level input | Dedicated | Tax underestimation if 1099 inputs bleed into W2 rows |
| **Admin rate split (4.2% vs 1.2%)**: Workers Comp (2.5%) is excluded from vehicle admin — if vehicle operators require workers comp coverage, this is a gap | Dedicated Vehicle | Admin cost understated |
| **Patrol assumes 1 vehicle**: No vehicle count multiplier in patrol formula | Patrol | If patrol uses multiple vehicles, cost is understated |
| **Same-time start/end = 24hr shift**: From the application's time calculation logic, this is treated as 24 hours — if accidentally triggered, revenue/cost spikes | Application (we layer) | Extreme billing anomaly |

---

## Part 11 — Master Calculation Flow (End-to-End)

```
USER configures franchise in Settings → Pricing Configuration
    → Values stored in Assumptions sheet (C10, C13, C16/C17, C20, G15/G16, K5–K14, N28/N29)

USER enters service in Contract → Services
    → Enters Hourly Rate (Dedicated) or Price Per Visit (Patrol)

SYSTEM runs pricing calculator (linked via red hyperlink):

    IF Dedicated Service (no vehicle):
        Revenue = BillRate × WeeklyHours
        Payroll = PayRate × Hours × (1 + OT% × 0.5) × (1 + 10%) + Revenue × 8%
        GrossProfit = Revenue − Payroll
        FAS = Revenue × 33%
        Remaining = GrossProfit − FAS
        Admin = Revenue × 4.2%
        PaymentTerms = Revenue × 0.82%
        NetMargin = Remaining − Admin − PaymentTerms
        → ≥12% = Green, 8–12% = Yellow, <8% = Red

    IF Dedicated Vehicle Service:
        Revenue = BillRate × HoursPerDay × NumVehicles
        VehicleCost = (Vehicles × $1,160 × UsageRatio) + (Miles/MPG × $/gal)
        FAS = Revenue × 33%
        Admin = Revenue × 1.2%
        NetProfit = Revenue − FAS − VehicleCost − Admin
        → >0% = Profitable, ≤0% = Loss (red)

    IF Patrol Service:
        Revenue = Patrols × BillRatePerPatrol
        TotalHours = Patrols × (DriveTime + OnPropertyTime) / 60
        Payroll = TotalHours × PayRate × (1+OT%) × (1+10%) + Revenue × 8%
        GrossProfit = Revenue − Payroll
        FAS = Revenue × 33%
        Remaining = GrossProfit − FAS
        VehicleCost = ($1,160 × UsageRatio) + (MilesPerNight/MPG × $/gal × Days)
        Admin = Revenue × 4.2%
        NetProfit = Remaining − VehicleCost − Admin
        → >0% = Profitable, ≤0% = Loss (red)

RED HYPERLINK displays: Revenue, Payroll, FAS, Remaining, Expenses, Net Margin/Profit, Color
```
