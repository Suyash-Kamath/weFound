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
