# Deploy Notes

## Summary of This Chat (Errors, Fixes, Changes)

### 1) Error
Cannot find module `@rollup/rollup-linux-x64-gnu` during Vercel build.

**Cause (likely)**  
npm optional dependency bug + missing platform-specific Rollup binary on Linux build environment.

**Change**  
Added explicit optional dependency for Rollup Linux binary.

**Files changed**
- `client/package.json`
- `package-lock.json`

---

### 2) Error
Failed to load native binding from `@swc/core` while loading `vite.config.js` on Vercel.

**Cause (likely)**  
Missing SWC native Linux binding in Vercel environment.

**Change**  
Added explicit optional dependency for SWC Linux binary.

**Files changed**
- `client/package.json`
- `package-lock.json`

---

### 3) Issue
Vercel deployment shows “No Screenshot Available” even though site loads when clicked.

**Cause (likely)**  
Vercel’s screenshotter doesn’t wait for SPA JS to render; HTML shell is blank.

**Change**  
Added static HTML fallback in `client/index.html` so a basic hero appears without JS.

**Files changed**
- `client/index.html`

---

### 4) Error
TypeScript error in `main.tsx`:  
“An import path can only end with a '.tsx' extension when 'allowImportingTsExtensions' is enabled.”

**Cause (likely)**  
Import included a `.tsx` extension without `allowImportingTsExtensions` enabled.

**Change**  
Removed `.tsx` extension from the import path.

**Files changed**
- `client/src/main.tsx`

---

## All Changes Made (in order)
1. Added `@rollup/rollup-linux-x64-gnu` `4.53.3` to `optionalDependencies` in `client/package.json`.
2. Ran `npm install`, updated `package-lock.json`.
3. Added `@swc/core-linux-x64-gnu` `1.15.3` to `optionalDependencies` in `client/package.json`.
4. Ran `npm install`, updated `package-lock.json`.
5. Added static fallback UI in `client/index.html` for Vercel screenshot generation.
6. Removed `.tsx` extension from `App` import in `client/src/main.tsx`.

---

## Files Touched
- `client/package.json`
- `package-lock.json`
- `client/index.html`
- `client/src/main.tsx`

---

## 5) Error
Directly opening or refreshing frontend routes (for example `/dashboard` or `/s/ULWKGMDG`) returns:
`404: NOT_FOUND` on Vercel.

**Cause (likely)**  
The app uses React Router (`BrowserRouter`) with client-side routes.  
Vercel tries to find a real file for `/dashboard` or `/s/...` and returns 404 when no rewrite is configured.

**Change**  
Added SPA fallback rewrites in `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This makes Vercel always serve `index.html` for route requests, and then React Router resolves the route on the client.

**Files changed**
- `client/vercel.json`

---

## How to Remember This
- If your frontend is a SPA with `BrowserRouter`, deep links need rewrites.
- Symptom: opening route URLs directly works in-app navigation, but fails on refresh/direct hit with hosting 404.
- Fix on Vercel: add `vercel.json` rewrite from `/(.*)` to `/index.html`.
