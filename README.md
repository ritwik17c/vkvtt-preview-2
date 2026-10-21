# VKV Nalbari Timetable and Daily Proxy Management System

## Repository layout

- **Root** — the live web app (HTML, JS, CSS, images). GitHub Pages serves these files at their current paths, so runtime files stay at the root; moving them would break links, bookmarks and the service worker.
- `firestore.rules` — the complete Firestore security rules, identical to the Firebase Console. This is the single source of truth. Deploy with `firebase deploy --only firestore:rules`.
- `functions/` — Cloud Functions (Question Bank AI review).
- `tests/` — Node tests for the examination scheduler and seating cores (`node tests/<file>.mjs`).
- `docs/firestore-patches/` — historical rule patches and old full rule sets. Reference only; never deploy these.
- `docs/release/`, `docs/module-notes/`, `docs/archive/` — release records, module notes and old version notes.

### Release safety

- `sw.js` and `vkv-build.json` clear browser caches and service workers for the whole `ritwik17c.github.io` site. Change them only for a deliberate release, never just to test a preview.
- Pages that are not linked from the app but are kept on purpose: `admin-qb-ai-review.html`, `admin-qb-quality-audit.html`, `admin-qb-principal-self-approval.html`, `admin-qb-subject-mapping.html`, `admin-uid-staff-link.html`, `admin-leave-editor-access-repair.html`, plus the redirect stubs `qb-safe.html` and `exam-admit-cards-v2.html`.

## v66.0 — Timetable Studio

- Admin/delegated timetable configuration with editable teachers, classes, subjects, venues, periods and allocation cards.
- Seeded multi-attempt timetable generation with retained parameters and separately stored results.
- Colourful drag/tap move, swap and replace editor with unplaced tray, locks and undo/redo.
- Named Draft, Ready, Active and Inactive timetable library.
- Principal-only validation-gated activation; the previous operational master remains stored for reactivation.
- Existing leave, proxy, attendance, temporary replacement and non-teaching data remain separate and preserved.
- Home-page Annual Calendar 2026–27 with Full View by default, plus Daily and Monthly views.
- Principal-only Annual Calendar management for adding, editing and deleting events.

## v57.0 — Safe Leave Import & Legacy Accounting Update

- Master Timetable Import / Restore accepts JSON only and remains separate from Leave Import.
- Approved Leave / OD / Special Excel import validates the entire workbook before saving.
- Any genuine validation error blocks the whole import; no partial import is performed.
- Dated approved events are stored as operational leave/status records.
- Non-dated legacy balances are preserved separately as **Legacy Leave Accounting**. No date is invented.
- Legacy accounting is read-only reference data and is not used for proxy coverage or dated leave events.
- Exact duplicate dated records and duplicate legacy accounting items are skipped.
- Error Report and Legacy Accounting exports are available.
- Approved Leave Viewer remains read-only.
- Date display is dd/mm/yyyy throughout visible reporting.
