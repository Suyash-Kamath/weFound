# Session Change Log - March 1, 2026

This document captures all implementation work completed in this session.

## 1) Sticker generation, linking, and item edit failures

### Reported problem
- `Generate Sticker` was not working reliably.
- In `Your Items`, linking and editing items was failing.

### Root cause
- Frontend expected `id` fields.
- Backend returned Mongo documents mostly with `_id` and ObjectId refs.
- This broke ID comparisons, route params, and mapping operations.

### Fix
- Added normalization in item store:
  - `_id` -> `id`
  - ObjectId refs -> string IDs
  - Applied to Items, Stickers, and Scans across create/update/refresh flows.
- Guarded dashboard item view action to only render when item has linked sticker.
- Fixed dashboard scan-loading effect dependency to use `stickers`.

### Files changed
- `client/src/stores/itemStore.ts`
- `client/src/pages/Dashboard.tsx`

---

## 2) Session persistence bug (reload on `/dashboard` caused sign-out)

### Reported problem
- User signed in, opened dashboard, reloaded page, got signed out and redirected to login.

### Root cause
- Auth hydration timing race (route guard evaluated before hydration completed).
- Token clearing was too aggressive (any hydrate error cleared token).

### Fix
- Added `isHydrating` state in auth store.
- Dashboard/Auth redirect logic now waits for hydration completion.
- Added structured API error class with HTTP status.
- Hydrate behavior:
  - no token -> unauthenticated, finish
  - `401/403` -> clear token/sign out
  - other failures -> do not clear token
- Persisted auth state now excludes transient hydration flag.

### Files changed
- `client/src/lib/api.ts`
- `client/src/stores/authStore.ts`
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/Auth.tsx`

---

## 3) Pricing purchase -> sticker credit system with synchronized deduction

### Requested behavior
- `Basic` should allow only 1 sticker.
- `Plus` should allow only 6 stickers.
- `Business` special/unlimited behavior.
- Deduction must happen from a single shared quota whether user clicks:
  - `Generate Sticker`, or
  - `Add New Item` (auto-generates sticker if none linked).

### Backend implementation
- Extended User model with:
  - `plan`
  - `stickerCreditsRemaining`
  - `stickerCreditsUsed`
  - `unlimitedStickers`
- Added billing routes:
  - `GET /billing/status`
  - `POST /billing/purchase`
- Registered billing router.
- Enforced sticker credit check inside `POST /stickers`:
  - Rejects generation when credits are insufficient (for non-unlimited plans).
  - Deducts remaining credits and increments used count on successful generation.
- Included plan/credit fields in auth + `/me` responses.

### Frontend implementation
- Added purchase page at `/purchase?plan=<basic|plus|business>`.
- `Choose Plan` now routes to purchase page (or contact for custom plan).
- Updated plan naming/content:
  - `Starter` -> `Basic`
  - Added 1-sticker mention for Basic
- Dashboard:
  - shows sticker credits left
  - disables generate when no credits
  - shows buy-plan CTA when needed
  - refreshes user state after sticker generation
- New Item page:
  - blocks create when auto-generation needs a credit but none left
  - shows clear error message
  - refreshes user state after successful create/mapping

### Files changed
- `server/src/models/User.js`
- `server/src/routes/billing.js` (new)
- `server/src/routes/index.js`
- `server/src/routes/stickers.js`
- `server/src/routes/auth.js`
- `server/src/routes/users.js`
- `client/src/pages/PurchasePlan.tsx` (new)
- `client/src/App.tsx`
- `client/src/components/landing/PricingSection.jsx`
- `client/src/data/siteData.js`
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/NewItem.tsx`
- `client/src/types/index.ts`
- `client/src/stores/authStore.ts`
- `client/src/lib/api.ts`

---

## 4) Contact toggle controls not working in Add/Edit Item

### Reported problem
- Toggle controls (WhatsApp, Phone Call, Email, In-App Chat) were not reliably clickable.

### Root cause
- Custom switch UI used hidden input with non-clickable visual wrapper.

### Fix
- Replaced broken custom switch with reliable explicit ON/OFF button toggles.
- Implemented in both Add Item and Edit Item forms.
- Updated scan page to render contact options only when:
  - corresponding toggle is enabled, and
  - required contact value exists (for WhatsApp/Phone/Email).

### Files changed
- `client/src/pages/NewItem.tsx`
- `client/src/pages/EditItem.tsx`
- `client/src/pages/ScanLanding.tsx`

---

## 5) Prefilled communication templates on scan page

### Requested behavior
- Clicking WhatsApp/Email should open with ready template message.

### Fix
- Added shared template message containing item/category/QR short code.
- WhatsApp link now uses `?text=` with encoded template.
- Email link now uses encoded subject/body template.
- In-App Chat button now copies template to clipboard and shows toast feedback.

### Files changed
- `client/src/pages/ScanLanding.tsx`

---

## 6) Docs requested during session

### Added documentation for auth/dashboard bug
- Created dedicated note documenting issue, cause, and fix.

### File added
- `docs/auth-dashboard-fix.md`

---

## Validation performed in this session

- Multiple targeted ESLint runs on changed files.
- Repeated client production builds (`npm run build:client`) after major changes.
- Node syntax checks for updated server route files.

---

## New files added in this session

- `server/src/routes/billing.js`
- `client/src/pages/PurchasePlan.tsx`
- `docs/auth-dashboard-fix.md`
- `docs/session-2026-03-01-change-log.md`
