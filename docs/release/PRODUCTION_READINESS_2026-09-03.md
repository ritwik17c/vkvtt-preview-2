# VKVTT Production Readiness — 03/09/2026

## Release-candidate checkpoint
- Preview repository: `ritwik17c/vkvtt-preview-2`
- Audited Preview-2 commit before final production-prep work: `8b0e4e97056677bccaf2f7977b8866ecea3edc09`
- Safety branch: `release-candidate-checkpoint-2026-09-03`
- Production reference only: `ritwik17c/vkvtt` main at `3dc71d0142a677238ba654fe59c046ef8efa4aa0`

## Current release-candidate status
- Examination Department files are present in Preview-2 and match the current production Examination Department baseline.
- Latest Question Bank bulk-import workflow has been brought into Preview-2 after the date-format and proxy-history fixes.
- The tested homepage Finalised Proxy Allotment compatibility/history fix remains in Preview-2.
- Shared visible-date policy is present: visible dates should be `dd/mm/yyyy`, while ISO `yyyy-mm-dd` remains internal for Firestore keys, sorting and queries.
- Current merged Firestore rules file `FIRESTORE_RULES_V66_REPLACE_ALL.txt` has the same blob SHA in Preview-2 and production (`3c4eadff015005818a67f730fd56c1096bd1ee4f`).

## Pointing / path audit
### 1. Relative HTML/JS/CSS routes
Most operational links use relative paths such as `index.html`, `admin-dashboard.html`, `exam-department.html` and module-local scripts/styles. These are transfer-safe when the same files move from `/vkvtt-preview-2/` to `/vkvtt/`.

### 2. Central route policy
`vkv-route-policy.js` derives the repository root from the current URL path segment. On Preview-2 it resolves `/vkvtt-preview-2/`; on production it resolves `/vkvtt/`. No production-specific rewrite should be needed for routes controlled by this policy.

### 3. PWA manifest
`manifest.webmanifest` already uses:
- `start_url: /vkvtt/`
- `scope: /vkvtt/`

This is already correct for production. It also means an installed PWA created from Preview-2 can point back to production, so Preview-2 PWA testing must be interpreted carefully.

### 4. Service worker
`sw.js` uses relative APP_SHELL paths and is structurally transfer-safe. Before/at production promotion, bump `CACHE_NAME` so existing installed/browser clients cannot remain on an older cached shell after the release.

### 5. Firebase / Firestore pointing
The web modules use the same Firebase project (`vkv-nalbari-timetable`) in Preview-2 and production. Moving the web files does not require a Firebase project change. Firestore rules deployment is separate from GitHub Pages deployment and must be verified independently.

### 6. Android wrapper
The Android wrapper is maintained on the production repo's `v66-2-refinement` branch, not on Preview-2 main. Its `MainActivity.java` already points to `https://ritwik17c.github.io/vkvtt/`, so the Android HOME URL does not need to be changed when the web release is promoted. The APK build workflow is also branch-specific and must not be deleted by a web-file mirror operation.

## Items to finish/check before production promotion
1. Complete signed-in acceptance testing of Home, Proxy, Leave, Attendance, QB, Examination, Admin Dashboard and role-based visibility.
2. Confirm the latest QB and Examination additions remain present after any final Preview-2 commits.
3. Finish the date-format consistency check. The Examination Department still has advanced text-list guidance using ISO-looking examples (`YYYY-MM-DD`) for excluded/custom dates and unavailable-session tokens; these should either be converted to `dd/mm/yyyy` UI or explicitly treated as an advanced/internal format before release.
4. Test Examination flow end-to-end: draft → submit → Principal return/approve → published staff timetable → leave exclusion → day-of duty replacement.
5. Test QB end-to-end: submit → teacher history → coordinator verification → correction/resubmission → import → paper builder.
6. Test Proxy: today, past-date history, My Proxy Today and Proxy Manager finalisation.
7. Test mobile rendering for Home, Proxy, Leave, QB and Examination.
8. Verify the currently deployed Firestore rules are the intended merged rules before production release.
9. Bump the service-worker cache name immediately before/with production promotion.
10. Preserve production-only/non-main Android build history and do not use a destructive repo-wide mirror that removes branch-only Android assets.

## Recommended promotion method
Do **not** blindly replace the entire production repository by deleting everything and copying Preview-2.

Use a controlled web-app synchronization from Preview-2 into production main:
- copy/update the validated web runtime and module files,
- preserve production repository history and branch-only Android wrapper/build workflow,
- keep `manifest.webmanifest` production pointing,
- bump the service-worker cache version,
- verify rules deployment separately,
- then perform a short smoke test on the production URL.

After production is confirmed, re-baseline Preview-2 from the new production state so Preview-2 again becomes the clean forward-development/release-candidate repository.
