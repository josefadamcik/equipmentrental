# Testing Scenarios — Equipment Rental System

Structured testing scenarios for manual UI testing. Work through each section in order; earlier sections create data needed by later ones.

---

## 1. Smoke Tests

Run these first to confirm the app is up and pages load.

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1 | Health check | `GET /health` | 200 OK |
| 1.2 | API docs load | Navigate to `/api-docs` | Swagger UI renders |
| 1.3 | Dashboard loads | Navigate to `/dashboard` | Page renders with stats cards and charts |
| 1.4 | Equipment list loads | Navigate to `/equipment` | Page renders, table or empty state shown |
| 1.5 | Members list loads | Navigate to `/members` | Page renders, table or empty state shown |
| 1.6 | Rentals list loads | Navigate to `/rentals` | Page renders, table or empty state shown |
| 1.7 | Reservations list loads | Navigate to `/reservations` | Page renders, table or empty state shown |
| 1.8 | 404 page | Navigate to `/nonexistent` | Graceful not-found or redirect |

---

## 2. Equipment CRUD

### 2.1 Create Equipment

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1.1 | Create valid equipment | Go to `/equipment/new`, fill: name="Excavator", category="Heavy", dailyRate=150, condition=GOOD, description="Test" → Submit | Redirects to equipment detail or list; new item visible |
| 2.1.2 | Create with minimum fields | Name, category, dailyRate only (no description) → Submit | Success — description is optional |
| 2.1.3 | Empty name validation | Leave name blank → Submit | Error shown, form not submitted |
| 2.1.4 | Empty category validation | Leave category blank → Submit | Error shown |
| 2.1.5 | Zero daily rate | Set dailyRate=0 → Submit | Error or rejection (must be > 0) |
| 2.1.6 | Negative daily rate | Set dailyRate=-10 → Submit | Error or rejection |
| 2.1.7 | All conditions | Create equipment with each condition (EXCELLENT, GOOD, FAIR, POOR, DAMAGED, UNDER_REPAIR) | All save correctly |

### 2.2 View / List Equipment

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.2.1 | List shows created items | Navigate to `/equipment` | All created equipment visible |
| 2.2.2 | Category filter | If filter exists, filter by "Heavy" | Only matching items shown |
| 2.2.3 | Detail page | Click an equipment item | `/equipment/:id` loads with correct name, rate, condition |

### 2.3 Edit Equipment

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.3.1 | Edit name | Go to `/equipment/:id/edit`, change name → Save | Name updated on detail page |
| 2.3.2 | Edit daily rate | Change rate to 200 → Save | Rate updated |
| 2.3.3 | Change condition | Change condition to FAIR → Save | Condition updated |
| 2.3.4 | Form pre-populates | Go to edit page | All fields show current values |

---

## 3. Members CRUD

### 3.1 Create Member

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1.1 | Create BASIC member | Name="Alice Smith", email="alice@test.com", tier=BASIC → Submit | Success, member created |
| 3.1.2 | Create PLATINUM member | Name="Bob Gold", email="bob@test.com", tier=PLATINUM → Submit | Success |
| 3.1.3 | Invalid email — no @ | Email="notanemail" → Submit | Validation error |
| 3.1.4 | Invalid email — no domain | Email="user@" → Submit | Validation error |
| 3.1.5 | Empty name | Leave name blank → Submit | Validation error |
| 3.1.6 | Duplicate email | Create member with same email as existing | Backend error (check how UI handles it) |
| 3.1.7 | All tiers | Create one member per tier (BASIC, SILVER, GOLD, PLATINUM) | All succeed with correct tier |

### 3.2 View / List Members

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.2.1 | List shows members | Navigate to `/members` | All created members visible |
| 3.2.2 | Detail page | Click a member | Shows name, email, tier, active status, rental history |
| 3.2.3 | Rental history on detail | View member who has rentals | Rental history section populated |

### 3.3 Edit Member

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.3.1 | Change tier | Edit member, change tier from BASIC to GOLD → Save | Tier updated |
| 3.3.2 | Deactivate member | Edit member, uncheck isActive → Save | Member shows as inactive |
| 3.3.3 | Reactivate member | Edit inactive member, check isActive → Save | Member active again |
| 3.3.4 | Deactivate member with active rental | Try to deactivate member who has active rental | Should fail — domain rule prevents this |

---

## 4. Rentals

### 4.1 Create Rental

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1.1 | Create valid rental | Go to `/rentals/new`, select available equipment + active member, set start=today, end=today+3, payment=CREDIT_CARD → Submit | Success; shows rentalId, totalCost, discountApplied |
| 4.1.2 | Dropdowns populated | Open create rental page | Equipment dropdown shows available items; member dropdown shows active members |
| 4.1.3 | End before start | Set endDate before startDate → Submit | Validation error |
| 4.1.4 | Same day start/end | Set start=end → Submit | Error (end must be after start) |
| 4.1.5 | Discount applied (PLATINUM) | Create rental with PLATINUM member | `discountApplied` should be 15% |
| 4.1.6 | Discount applied (BASIC) | Create rental with BASIC member | `discountApplied` should be 0% |
| 4.1.7 | Equipment becomes unavailable | After creating rental, check equipment list | Rented equipment no longer available / marked as rented |
| 4.1.8 | Exceed rental limit | Create max rentals for a BASIC member (2), then try a 3rd | Error: rental limit exceeded |
| 4.1.9 | Exceed max days (BASIC) | BASIC member, rental period > 7 days | Error: exceeds max rental days |
| 4.1.10 | POOR condition equipment | Set equipment condition to POOR, try to rent | Error: condition unacceptable |
| 4.1.11 | Inactive member | Try to rent to an inactive member | Error or member not shown in dropdown |

### 4.2 View Rental

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.2.1 | Rental list | Navigate to `/rentals` | Shows all rentals with status |
| 4.2.2 | Rental detail | Click a rental | Shows equipment, member, dates, cost, status |
| 4.2.3 | Active rental actions | View active rental detail | Return and Extend buttons visible |
| 4.2.4 | Returned rental actions | View returned rental detail | No Return/Extend buttons |

### 4.3 Return Rental

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.3.1 | Return in GOOD condition | On active rental detail, click Return → condition=GOOD → Submit | Status changes to RETURNED; totalCost shown; damageFee=$0 |
| 4.3.2 | Return in DAMAGED condition | Return with condition=DAMAGED (originally rented in EXCELLENT) | damageFee > $0 (degradation penalty) |
| 4.3.3 | Return acceptable wear | Rented in EXCELLENT, return as GOOD | damageFee=$0 (1 level = acceptable wear) |
| 4.3.4 | Equipment available after return | After returning, check equipment | Should be available again; condition updated |
| 4.3.5 | Return already returned | Try to return same rental twice | Error: already returned |
| 4.3.6 | Late return | Create rental ending yesterday (or wait), then return | lateFee > $0 ($10/day) |

### 4.4 Extend Rental

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.4.1 | Extend by 7 days | On active rental, click Extend → 7 days → Submit | End date extended; additional cost charged |
| 4.4.2 | Extend by 1 day | Extend by minimum (1 day) → Submit | Success |
| 4.4.3 | Extend returned rental | Try to extend a returned rental | Error or button not visible |
| 4.4.4 | Extend with discount | Extend rental of GOLD member | 10% discount applied to extension cost |

---

## 5. Reservations

### 5.1 Create Reservation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1.1 | Create valid reservation | Go to `/reservations/new`, select equipment + member, start=tomorrow, end=tomorrow+5, payment=CREDIT_CARD → Submit | Success; reservation created with PENDING status |
| 5.1.2 | Start date in past | Set startDate to yesterday → Submit | Error: reservation must be in the future |
| 5.1.3 | Start date today | Set startDate to today → Submit | May error if "today" counts as started — verify behavior |
| 5.1.4 | Conflicting reservation | Create two reservations for same equipment, overlapping dates | Second one should fail |
| 5.1.5 | Inactive member | Try to reserve for inactive member | Error or member not in dropdown |
| 5.1.6 | Exceed max days | BASIC member, reservation > 7 days | Error |

### 5.2 View Reservation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.2.1 | Reservation list | Navigate to `/reservations` | Shows all reservations with status |
| 5.2.2 | Reservation detail | Click a reservation | Shows equipment, member, dates, status |
| 5.2.3 | Pending reservation actions | View pending reservation | Confirm and Cancel buttons visible |

### 5.3 Reservation Actions

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.3.1 | Confirm reservation | On pending reservation detail, click Confirm | Status changes to CONFIRMED |
| 5.3.2 | Cancel pending reservation | Click Cancel on pending reservation | Status changes to CANCELLED |
| 5.3.3 | Cancel confirmed reservation | Click Cancel on confirmed reservation | Status changes to CANCELLED |
| 5.3.4 | Fulfill reservation | On confirmed reservation (after start date has passed), click Fulfill | Status changes to FULFILLED; a rental is created |
| 5.3.5 | Fulfill before start date | Try to fulfill before the reservation start date | Error: not ready to fulfill |
| 5.3.6 | Cancel already cancelled | Try to cancel an already cancelled reservation | Error or button not visible |

---

## 6. Business Logic Scenarios

### 6.1 Membership Tier Rules

| # | Scenario | Expected |
|---|----------|----------|
| 6.1.1 | BASIC: max 2 concurrent rentals | 3rd rental rejected |
| 6.1.2 | SILVER: max 3 concurrent, 5% discount | Verify both limits and discount |
| 6.1.3 | GOLD: max 5 concurrent, 10% discount, 30-day max | Verify all |
| 6.1.4 | PLATINUM: max 10 concurrent, 15% discount, 60-day max | Verify all |
| 6.1.5 | BASIC: max 7-day rental | 8-day rental rejected |
| 6.1.6 | GOLD: 30-day rental allowed | 30-day rental succeeds |

### 6.2 Equipment Condition Rules

| # | Scenario | Expected |
|---|----------|----------|
| 6.2.1 | EXCELLENT → rentable | Can be rented |
| 6.2.2 | GOOD → rentable | Can be rented |
| 6.2.3 | FAIR → rentable | Can be rented |
| 6.2.4 | POOR → not rentable | Cannot be rented |
| 6.2.5 | DAMAGED → not rentable | Cannot be rented |
| 6.2.6 | UNDER_REPAIR → not rentable | Cannot be rented |

### 6.3 Late Fees

| # | Scenario | Expected |
|---|----------|----------|
| 6.3.1 | Return 1 day late | lateFee = $10 |
| 6.3.2 | Return 5 days late | lateFee = $50 |
| 6.3.3 | Return on time | lateFee = $0 |
| 6.3.4 | Extend overdue rental | Overdue status reverts to ACTIVE; late fee cleared |

### 6.4 Damage Fees (on Rental Return)

| # | Scenario | Expected |
|---|----------|----------|
| 6.4.1 | EXCELLENT → GOOD (1 level) | damageFee = $0 (acceptable wear) |
| 6.4.2 | EXCELLENT → FAIR (2 levels) | damageFee = $50 |
| 6.4.3 | EXCELLENT → DAMAGED (4 levels) | damageFee = $150 |
| 6.4.4 | GOOD → GOOD (0 levels) | damageFee = $0 |
| 6.4.5 | Return in better condition | damageFee = $0 |

---

## 7. Navigation and UI

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.1 | Sidebar navigation | Click each sidebar link | Correct page loads |
| 7.2 | Back navigation | Use browser back button after navigating | Returns to previous page |
| 7.3 | Direct URL access | Paste `/equipment/:id` directly in address bar | Detail page loads (or 404 if invalid ID) |
| 7.4 | Root redirect | Navigate to `/` | Redirects to `/dashboard` |
| 7.5 | Links from detail pages | Click equipment/member links on rental detail | Navigate to correct detail page |
| 7.6 | Create buttons | Click "New Equipment" / "New Member" / etc. from list pages | Navigate to create form |
| 7.7 | Cancel button on forms | Click cancel during form creation | Returns to list page without saving |
| 7.8 | Loading states | Navigate to pages with data | Loading indicator shown briefly before data appears |
| 7.9 | Empty states | View lists when no data exists | Friendly empty state message (not a blank page or error) |

---

## 8. Edge Cases and Error Handling

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8.1 | Invalid equipment ID in URL | Navigate to `/equipment/nonexistent-uuid` | 404 or error message, no crash |
| 8.2 | Invalid rental ID in URL | Navigate to `/rentals/nonexistent-uuid` | 404 or error message |
| 8.3 | Network error | Stop the backend, try to load a page | Error state shown, no unhandled crash |
| 8.4 | Large daily rate | Create equipment with dailyRate=999999.99 | Handles gracefully |
| 8.5 | Special characters in name | Create equipment named `<script>alert('xss')</script>` | No XSS; text displayed safely |
| 8.6 | Very long description | Submit a 5000+ character description | Either accepts or shows validation error |
| 8.7 | Concurrent rental conflict | Two users try to rent same equipment simultaneously | One succeeds, other gets clear error |
| 8.8 | Member with overdue rental | Create rental, let it go overdue, try to create another rental for same member | Error: member has overdue rentals |

---

## Quick Reference: Test Data Setup

To run through the full test suite, create this seed data first:

1. **Equipment** (4 items):
   - "Excavator" — Heavy — $150/day — EXCELLENT
   - "Drill Press" — Power Tools — $45/day — GOOD
   - "Concrete Mixer" — Heavy — $85/day — FAIR
   - "Broken Saw" — Power Tools — $30/day — DAMAGED

2. **Members** (4 members):
   - "Alice Basic" — alice@test.com — BASIC
   - "Bob Silver" — bob@test.com — SILVER
   - "Carol Gold" — carol@test.com — GOLD
   - "Dave Platinum" — dave@test.com — PLATINUM

3. **Rentals**: Create using the members and equipment above as needed per scenario.
