# Admin Users UI Scaffolding

This document explains how to use and extend the new Admin Users management area inside the AI Admin Dashboard (`public/admin-dashboard.html` + `public/js/admin-dashboard.js`).

## Features in place

1. **Directory Table**
   - Columns: `login`, `display_name`, `email`, `role`, `status`, `last_login_at`, `failed_attempts`, `locked_until`.
   - Action buttons per row: **Reset Password**, **Lock / Unlock**, **Edit**.
2. **Create / Edit Modals**
   - Create modal matches `POST /api/admin/users` payload.
   - Edit modal supports updating core fields and optional password reset via `PUT /api/admin/users/:login`.
3. **Audit Viewer**
   - Preview list on the card plus a full modal showing filtered entries.
   - Hits `GET /api/admin/users/audit` with `actor`, `target`, `action` query params.
4. **State Management + API Hooks**
   - `AIDashboard` now tracks `adminUsers`, `adminAudit`, filters, and modal state.
   - All admin actions use `requestAdminAPI()` helper (JSON fetch with credentials included).
   - Each API call gracefully falls back to mock data (`getMockAdminUsers`, `getMockAuditEntries`) so the UI works even when endpoints are offline.

## Wiring to Backend

- **Load users** → `GET /api/admin/users?status=`; returns an array or `{ users: [] }` and respects the status filter dropdown.
- **Create admin** → `POST /api/admin/users`; payload `{ login, display_name, email, role, status, password }`.
- **Edit admin** → `PUT /api/admin/users/:login`; omit `password` unless performing a reset. The UI automatically reloads the table afterwards.
- **Reset password** → `POST /api/admin/users/:login/reset-password`; shows a toast on success.
- **Lock / unlock** → `POST /api/admin/users/:login/lock` or `/unlock`; confirmation prompts are already wired in the UI.
- **Audit log** → `GET /api/admin/users/audit?actor=&target=&action=`; fills both the preview list and the full modal.

## API Payload Examples

> Replace `http://localhost:8080` with your environment host.

### List Admins

```bash
curl -s -H "Cookie: session=..." \
  "http://localhost:8080/api/admin/users?status=locked"
```

```json
{
  "users": [
    {
      "login": "dealer_ops",
      "display_name": "Dealer Ops",
      "email": "dealer@example.com",
      "role": "operator",
      "status": "locked",
      "last_login_at": "2026-01-11T19:20:00.000Z",
      "failed_attempts": 6,
      "locked_until": "2026-01-11T20:00:00.000Z"
    }
  ]
}
```

### Create Admin

```bash
curl -s -X POST -H "Content-Type: application/json" -H "Cookie: session=..." \
  -d '{"login":"ops_lead","display_name":"Ops Lead","email":"ops@example.com","role":"admin","status":"active","password":"TempP@ss123"}' \
  http://localhost:8080/api/admin/users
```

```json
{
  "login": "ops_lead",
  "display_name": "Ops Lead",
  "email": "ops@example.com",
  "role": "admin",
  "status": "active",
  "created_at": "2026-01-12T08:00:00.000Z"
}
```

### Update Admin

```bash
curl -s -X PUT -H "Content-Type: application/json" -H "Cookie: session=..." \
  -d '{"display_name":"Dealer Ops","status":"active","role":"moderator"}' \
  http://localhost:8080/api/admin/users/dealer_ops
```

```json
{
  "login": "dealer_ops",
  "updated": true
}
```

### Reset Password

```bash
curl -s -X POST -H "Cookie: session=..." \
  http://localhost:8080/api/admin/users/dealer_ops/reset-password
```

```json
{
  "login": "dealer_ops",
  "temporaryPassword": "1X8-ABCD",
  "message": "Reset email dispatched."
}
```

### Lock / Unlock

```bash
curl -s -X POST -H "Cookie: session=..." \
  http://localhost:8080/api/admin/users/dealer_ops/lock
```

```json
{
  "login": "dealer_ops",
  "status": "locked",
  "locked_until": "2026-01-12T08:50:00.000Z"
}
```

### Audit Log

```bash
curl -s -H "Cookie: session=..." \
  "http://localhost:8080/api/admin/users/audit?actor=mercetti&action=locked_admin"
```

```json
{
  "logs": [
    {
      "id": 201,
      "actor": "mercetti",
      "target": "dealer_ops",
      "action": "locked_admin",
      "created_at": "2026-01-11T18:10:00.000Z",
      "metadata": {
        "reason": "Too many failed attempts"
      }
    }
  ]
}
```

## UI State Flow

1. **Section Activation**: clicking the “Admin Users” nav item toggles the `#admin-users-section` into view and triggers `loadAdminUsers` + `loadAdminAudit`.
2. **Filters**: status dropdown updates `state.adminFilters.status` and re-fetches on change; audit modal inputs update `adminAuditFilters` in place.
3. **Modals**: `toggleModal` adds/removes `.open` + `aria-hidden`; Escape key or clicking backdrop buttons closes all modals.
4. **Actions**: table buttons emit `data-admin-action`, which route to reset, lock/unlock, or edit flows. Each action uses `requestAdminAPI`, shows toast notifications, and refreshes the table/audit preview when applicable.
5. **Mock fallback**: if any fetch fails, mock data is injected and a warning toast surfaces so the UI remains interactive during backend outages.

## Styling Hooks

Key CSS classes to extend or override:

- `.admin-users-grid`, `.admin-table-card`, `.audit-card` – layout containers.
- `.admin-table` + `.table-wrapper` – table styling (scroll behavior, zebra striping).
- `.status-chip`, `.status-active`, `.status-locked`, `.status-disabled` – badges for account state.
- `.modal`, `.modal-panel`, `.modal-header`, `.modal-footer`, `.modal.open` – modal visuals.
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-tertiary`, `.btn-xs` – button hierarchy used for actions.
- `.audit-list`, `.audit-item`, `.audit-details` – audit log formatting in both preview and modal.

Update `public/admin-dashboard.html`’s inline `<style>` or the global dashboard stylesheet to change colors/spacing, or append new classes for additional statuses/roles.

## Testing Recipes

1. **Seed Admins** (example): run `node scripts/seed-streamer.js --admin mercetti --password TempP@ss123` to ensure at least one admin exists for login.
2. **Local Smoke Test**:

   ```bash
   npm run dev
   open http://localhost:8080/admin-dashboard.html
   ```

   - Toggle status filter; verify network requests in dev tools succeed.
   - Trigger create/edit/reset flows and confirm audit entries append.
3. **API Health Check**: `npm run test-admin-api` (create a Jest suite hitting the endpoints) to guarantee regressions are caught before deployment.
4. **Accessibility Spot Check**: run `npx playwright test --grep "@admin-users"` or `npx axe http://localhost:8080/admin-dashboard.html` to confirm modals are focus-trapped and labelled.

## Steps to enable real data

1. **Confirm backend auth**: These calls assume the user already holds an authenticated admin session (cookies). Ensure `/admin-dashboard.html` is served behind the same session.
2. **Verify endpoints locally**

   ```bash
   curl -H "Cookie: session=..." http://localhost:8080/api/admin/users
   ```

   The front-end expects HTTP 200 with JSON arrays (or `{ users: [] }`).
3. **Remove mock fallbacks (optional)**: Once the API is stable, you can delete `getMockAdminUsers/getMockAuditEntries` or behind a feature flag. Currently they only activate on fetch failure.
4. **Adjust status chips**: The table renders `<span class="status-chip status-<status>>`. Add CSS for any new statuses in your stylesheet.
5. **Time formatting**: `formatTimestamp` uses `toLocaleString`. Change formatting or timezone awareness there if needed.

## Adding New Fields

1. Update column list in `public/admin-dashboard.html` (table `<thead>`).
2. Mirror the value inside `renderAdminUsersTable()` in `public/js/admin-dashboard.js`.
3. Update create/edit modals and `prefillEditForm`/`getFormValues` logic.
4. Ensure backend payload accepts the new property.

## Testing Checklist

- [ ] Navigate to **Admin Users** section → table loads real data.
- [ ] Filter by status (Active/Locked/Disabled) and verify server-side filtering.
- [ ] Create admin → new row appears after refresh.
- [ ] Edit admin → roles/status changes reflected.
- [ ] Reset password shows success toast.
- [ ] Lock/unlock toggles button label and status chip.
- [ ] Audit preview updates when actions occur; full modal respects filters.

## Next Ideas

- **Pagination & search**: extend `loadAdminUsers` with `page`, `limit`, and `query` parameters once the backend supports them.
- **Role-based surfaces**: conditionally show action buttons depending on the current admin’s permissions (e.g., only super-admins can lock others).
- **Inline audit context**: add hover tooltips or expanders per row to display the latest audit event without leaving the table.
- **Improved notifications**: replace `window.confirm/alert` calls with a shared toast/snackbar component for consistency.
- **Form validation**: integrate a lightweight validator (e.g., Yup) to highlight invalid fields before submitting API calls.
- **WebSocket refresh**: subscribe to admin/audit events so the UI updates instantly when another operator makes changes.
