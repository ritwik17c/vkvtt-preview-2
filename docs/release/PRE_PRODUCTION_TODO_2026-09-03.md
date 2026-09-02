# VKVTT Pre-Production To-Do — 03/09/2026

## Safety / release control
- [x] Keep production `ritwik17c/vkvtt/main` read-only during pre-production work.
- [x] Create Preview-2 safety checkpoint branch: `release-candidate-checkpoint-2026-09-03`.
- [x] Record production pointing / transfer audit.
- [ ] Freeze Preview-2 only after the signed-in acceptance tests below pass.

## Repository parity / latest modules
- [x] Confirm Examination Department files are present in Preview-2.
- [x] Confirm latest QB bulk-import workflow is present in Preview-2.
- [x] Confirm merged Firestore rules file in Preview-2 matches production by blob SHA.
- [ ] Re-check Preview-2 `main` immediately before production promotion in case another QB/Exam update lands.

## Date-format consistency
- [x] Shared visible-date layer `vkv-date-ui.js` exists and preserves ISO values internally.
- [x] Home proxy-history date selector uses the shared date layer.
- [x] Routed Leave / Attendance / Calendar pages load the shared date layer or already use explicit dd/mm/yyyy text inputs.
- [x] Examination Department Start/End date controls now load the shared dd/mm/yyyy layer while retaining ISO internally.
- [ ] Examination Department advanced multi-date fields remain explicitly marked as internal ISO tokens; convert them to dd/mm/yyyy only after a safe parser/conversion test.
- [ ] Spot-check date fields in QB and remaining admin/recovery pages after the latest module sync.

## Critical signed-in acceptance tests
- [ ] Home: login, logout, role sections, Home/Reset, Admin Dashboard return.
- [ ] Proxy: Today’s Finalised Proxy, past-date lookup, My Proxy Today, finalisation, leave exclusion.
- [ ] Leave: Quick Add, approval/return, Approved Leave Register, historical editor, OD/Special Assignment.
- [ ] Attendance: punch in/out, late rule, early departure, geofence, OD, admin verification.
- [ ] QB: submit, teacher history, coordinator inbox, verify/reject, correction/resubmission, import, paper builder.
- [ ] Examination: setup, eligible papers, generate timetable, duties, leave exclusion, submit, return, approve/publish, staff timetable, same-day replacement.
- [ ] Role visibility: admin, ordinary teacher, delegated manager/coordinator, non-teaching staff.
- [ ] Mobile: Home, Proxy, Leave, QB, Examination.

## PWA / Android / pointing
- [x] `manifest.webmanifest` already points to production `/vkvtt/` start_url and scope.
- [x] `vkv-route-policy.js` derives root from the current repository path.
- [x] Service-worker APP_SHELL uses relative paths.
- [x] Android wrapper HOME URL already points to production `https://ritwik17c.github.io/vkvtt/`.
- [ ] At production promotion, bump service-worker `CACHE_NAME` once.
- [ ] Preserve Android branch/build workflow; do not perform a destructive whole-repository mirror.

## Firestore / data safety
- [x] Preview-2 and production merged rules file SHA currently match.
- [ ] Verify the rules actually deployed in Firebase are the intended merged rules before production release.
- [ ] Do not delete historical Firestore rule patches during this release.

## Production promotion gate
Production promotion is allowed only when:
1. Critical signed-in acceptance tests above pass.
2. No new QB/Exam commits have appeared without re-checking them.
3. Final service-worker cache bump is prepared.
4. Deployed Firestore rules are verified.
5. Production transfer is a controlled web-app synchronization, not a destructive mirror.

## Post-release
- [ ] Smoke-test production Home, Proxy, Leave, QB, Examination and Admin Dashboard.
- [ ] Confirm installed/PWA clients receive the new shell after cache bump.
- [ ] Re-baseline Preview-2 from the confirmed production state for future development.
