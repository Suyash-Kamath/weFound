# Auth + Dashboard Fix Notes

## Issue Reported
- User could sign in and open `/dashboard`.
- After page reload (or re-entering `/dashboard` URL), user got signed out and was redirected to login.

## Root Cause
1. Auth hydration timing race on app load:
- Dashboard route guard checked `isAuthenticated` before hydration finished.
- This caused early redirect to `/auth` during refresh.

2. Token handling was too aggressive:
- During hydrate failure, token was cleared for any error.
- Temporary API/network errors could incorrectly log out valid sessions.

## Fix Implemented
1. Added explicit hydration state:
- Introduced `isHydrating` in auth store.
- Protected routes now wait until hydration completes before redirect logic runs.

2. Hardened hydrate logic:
- If no token exists: mark unauthenticated and finish hydration.
- If API fails with `401/403`: clear token and sign out.
- For non-auth failures: do not clear token; just end hydration.

3. Added structured API errors:
- Introduced `ApiError` with HTTP status in API client.
- Auth store uses status code to distinguish auth failure vs temporary failure.

4. Prevented stale persisted hydrate flags:
- Persist now stores only stable auth session fields.
- Hydration flag is always recomputed on load.

## Dashboard Behavior After Fix
- Reloading `/dashboard` keeps user signed in when token is valid.
- Redirect to `/auth` only happens after hydration completes and user is truly unauthenticated.

## Files Changed
- `client/src/stores/authStore.ts`
- `client/src/lib/api.ts`
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/Auth.tsx`

## Validation
- Client lint checks passed for changed auth/dashboard files.
- Client production build passed.
