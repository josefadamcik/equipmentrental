# Frontend Test Report

## Metadata
- **Date:** 2026-02-14
- **Scenario:** Section 2.1 — Create Equipment
- **Environment:** http://localhost:5173, Chrome (via MCP integration), backend at http://localhost:3000
- **Overall Result:** PARTIAL (client-side validation PASS; all form submissions FAIL due to missing backend route)

## Summary

The Equipment Create form at `/equipment/new` renders correctly and all client-side validations behave as expected: blank name, blank category, zero daily rate, and negative daily rate are all rejected with informative inline error messages before any API call is made. The condition dropdown contains all 6 required values and each can be selected. However, every form submission attempt fails because the backend `EquipmentController` does not implement the `POST /api/equipment` route — only `GET /` and `GET /:id` are registered. As a result, scenarios 2.1.1, 2.1.2, and 2.1.7 (which require actual persistence) all fail with a 404 "Route not found: POST /api/equipment" error displayed inline in the form.

---

## Test Steps

### Step 1: Pre-Test — Verify frontend is running
- **Action:** Navigate to http://localhost:5173
- **Expected:** App loads at dashboard
- **Actual:** App loaded and redirected to `/dashboard` showing the Equipment Rental dashboard with stat cards
- **Result:** PASS
- **Notes:** Dashboard shows "Failed to load availability data: Equipment not found: available" error on the Equipment Availability chart — pre-existing unrelated issue

---

### Step 2: Pre-Test — Verify backend POST /api/equipment route
- **Action:** Inspect `EquipmentController.ts` and make a direct `POST /api/equipment` fetch call from the browser
- **Expected:** POST endpoint exists and responds to create requests
- **Actual:** `EquipmentController.ts` only registers `GET /` and `GET /:equipmentId` routes. Direct POST call returns HTTP 404 with body `{"error":{"code":"ROUTE_NOT_FOUND","message":"Route not found: POST /api/equipment"}}`
- **Result:** FAIL (critical infrastructure defect)
- **Notes:** The `index.ts` startup log lists `POST /api/equipment` as an available endpoint in comments, but the actual controller does not implement it. This blocks all create-equipment scenarios.

---

### Scenario 2.1.1: Create valid equipment

- **Action:** Navigate to `/equipment/new`; fill Name="Excavator", Category="Heavy", Daily Rate=150, Condition=GOOD, Description="Test"; click "Create Equipment"
- **Expected:** Redirects to equipment detail or list page; new item visible
- **Actual:** Form passes client-side validation (no inline errors shown). Submission reaches the backend and fails with error banner: "Route not found: POST /api/equipment". Form remains on the create page.
- **Result:** FAIL
- **Notes:** Client-side form rendering and field population work correctly. The condition dropdown defaults to "Good" (GOOD) as expected. The failure is entirely backend — missing POST route implementation in `EquipmentController`.

---

### Scenario 2.1.2: Create with minimum fields (no description)

- **Action:** Navigate to `/equipment/new`; fill Name="Bulldozer", Category="Heavy", Daily Rate=200, Condition=GOOD (default); leave Description blank; click "Create Equipment"
- **Expected:** Success — description is optional, form should submit without errors
- **Actual:** Form correctly passes client-side validation — no error is shown for the empty description field. The submission proceeds to the API call and fails with the same backend error: "Route not found: POST /api/equipment"
- **Result:** PARTIAL PASS (client-side: PASS — description correctly treated as optional; server-side: FAIL — missing POST route)
- **Notes:** The frontend `validate()` function does not require description, which is correct behaviour per the specification.

---

### Scenario 2.1.3: Empty name validation

- **Action:** Navigate to `/equipment/new`; fill Category="Heavy", Daily Rate=100, Condition=GOOD; leave Name blank; click "Create Equipment"
- **Expected:** Error shown, form not submitted
- **Actual:** Form shows inline error "Name is required" in red text below the Name input; the Name input border turns red. The form is not submitted (no API call made).
- **Result:** PASS
- **Notes:** Validation error message is clear and specific. Error clears as soon as the user starts typing in the Name field (reactive validation).

---

### Scenario 2.1.4: Empty category validation

- **Action:** Navigate to `/equipment/new`; fill Name="Crane", Daily Rate=75, Condition=GOOD; leave Category blank; click "Create Equipment"
- **Expected:** Error shown, form not submitted
- **Actual:** Form shows inline error "Category is required" in red text below the Category input; the Category input border turns red. The form is not submitted.
- **Result:** PASS
- **Notes:** Validation mirrors the Name field pattern — clear inline error, no API call triggered.

---

### Scenario 2.1.5: Zero daily rate

- **Action:** Navigate to `/equipment/new`; fill Name="Forklift", Category="Warehouse", Daily Rate=0, Condition=GOOD; click "Create Equipment"
- **Expected:** Error or rejection (daily rate must be > 0)
- **Actual:** Form shows inline error "Daily rate must be a positive number" in red text below the Daily Rate input; the Daily Rate input border turns red. The form is not submitted.
- **Result:** PASS
- **Notes:** Frontend `validate()` function checks `rate <= 0` which correctly catches 0. The HTML input has `min="0.01"` attribute as well, providing a secondary browser-native constraint.

---

### Scenario 2.1.6: Negative daily rate

- **Action:** Navigate to `/equipment/new`; fill Name="Loader", Category="Construction", Daily Rate=-10, Condition=GOOD; click "Create Equipment"
- **Expected:** Error or rejection (daily rate must be > 0)
- **Actual:** Form shows inline error "Daily rate must be a positive number" in red text below the Daily Rate input; the Daily Rate input border turns red. The form is not submitted.
- **Result:** PASS
- **Notes:** The same validation path handles both zero and negative values (`rate <= 0`). The value -10 is correctly rejected.

---

### Scenario 2.1.7: All conditions selectable

- **Action:** Navigate to `/equipment/new`; verify all condition options exist in the dropdown; select each of EXCELLENT, GOOD, FAIR, POOR, DAMAGED, UNDER_REPAIR in sequence; submit with UNDER_REPAIR selected
- **Expected:** All conditions present in dropdown; each saves correctly
- **Actual (frontend):** All 6 conditions confirmed present via DOM inspection: `[{"value":"EXCELLENT","text":"Excellent"},{"value":"GOOD","text":"Good"},{"value":"FAIR","text":"Fair"},{"value":"POOR","text":"Poor"},{"value":"DAMAGED","text":"Damaged"},{"value":"UNDER_REPAIR","text":"Under Repair"}]`. Each value selects correctly in the UI. Dropdown defaults to "Good" on page load.
- **Actual (submission):** Submitting with any condition value (including UNDER_REPAIR) fails with "Route not found: POST /api/equipment" — the condition value is correctly read by the frontend but cannot be persisted.
- **Result:** PARTIAL PASS (dropdown population and selection: PASS for all 6 values; persistence: FAIL for all 6 values due to missing backend route)
- **Notes:** Frontend form behavior for the Condition field is fully correct. The backend must implement the POST route to complete this scenario.

---

## Issues Found

### Issue 1 — BLOCKER: Backend POST /api/equipment route not implemented
- **Severity:** Blocker
- **Affects:** Scenarios 2.1.1, 2.1.2, 2.1.7
- **Description:** The `EquipmentController` (`packages/backend/src/adapters/inbound/http/controllers/EquipmentController.ts`) only registers two routes: `GET /` and `GET /:equipmentId`. There is no `POST /` handler for creating equipment. Every create-equipment form submission returns HTTP 404 with `{"error":{"code":"ROUTE_NOT_FOUND","message":"Route not found: POST /api/equipment"}}`.
- **Evidence:** Code inspection of `EquipmentController.ts` lines 25–31 shows only GET routes in `setupRoutes()`. Direct API call via browser `fetch('/api/equipment', {method:'POST',...})` returns 404.
- **UI behavior:** The error is surfaced to the user in a red banner at the top of the form reading "Route not found: POST /api/equipment", which is acceptable error-display behavior but an unhelpful message for end users.

### Issue 2 — MINOR: Dashboard "Equipment Availability" chart error
- **Severity:** Minor / Pre-existing
- **Affects:** Dashboard page only (not tested in this scenario)
- **Description:** The dashboard shows "Failed to load availability data: Equipment not found: available" in the Equipment Availability section. This appears to be a separate pre-existing bug where the dashboard attempts to fetch `/api/equipment/available` (a non-existent endpoint) instead of `/api/equipment?status=available` or similar.
- **Evidence:** Observed in initial screenshot of the dashboard.

### Issue 3 — MINOR: API error message exposed to users
- **Severity:** Minor / UX
- **Affects:** All form submissions when backend is missing or errors
- **Description:** The submit error banner shows raw API error messages (e.g., "Route not found: POST /api/equipment") directly to users. This is a developer-level message that should be translated to a user-friendly message like "Unable to create equipment. Please try again later."
- **Evidence:** Observed in screenshots for scenarios 2.1.1, 2.1.2, and 2.1.7.

---

## Recommendations

1. **Implement POST /api/equipment in EquipmentController** — Add a `createEquipment` handler to `EquipmentController.ts` that accepts the `CreateEquipmentRequest` DTO, invokes a `CreateEquipmentCommand` (application layer), and returns the created equipment with HTTP 201. Also implement `PUT /api/equipment/:id` (update) and `DELETE /api/equipment/:id` (delete) which are similarly missing.

2. **Add user-friendly API error messages** — In `EquipmentFormPage.tsx`, the `submitError` state currently displays raw API error text. Consider mapping known error codes (e.g., `ROUTE_NOT_FOUND`, `VALIDATION_ERROR`) to localized, user-friendly messages.

3. **Fix dashboard availability endpoint** — The dashboard's "Equipment Availability" chart appears to query a non-existent endpoint. Investigate whether `/api/equipment/available` needs to be added or if the frontend should call `/api/equipment` instead.

4. **Add frontend unit/integration tests for the form** — The validation logic (`validate()` function in `EquipmentFormPage.tsx`) is well-implemented and could be covered by Jest unit tests. Integration tests using MSW (Mock Service Worker) could also cover successful and failed submission scenarios without requiring the backend.

---

## Test Results Summary

| Scenario | Description | Client Validation | API Submission | Overall |
|----------|-------------|-------------------|----------------|---------|
| 2.1.1 | Create valid equipment (all fields) | PASS | FAIL | FAIL |
| 2.1.2 | Create with minimum fields (no description) | PASS | FAIL | FAIL |
| 2.1.3 | Empty name validation | PASS | N/A | PASS |
| 2.1.4 | Empty category validation | PASS | N/A | PASS |
| 2.1.5 | Zero daily rate | PASS | N/A | PASS |
| 2.1.6 | Negative daily rate | PASS | N/A | PASS |
| 2.1.7 | All conditions selectable | PASS (all 6 options present and selectable) | FAIL | PARTIAL |
