# VKVTT v66.2 — Locked Preview Correction Batch

This batch is correction/regression work only. Do not add unrelated modules and do not merge to `main` until preview approval.

## Required corrections

1. Restore prior homepage logo/title alignment.
2. Fix exact approved Swami Vivekananda portrait asset/reference; do not regenerate artwork.
3. Period Reminder must read the same Activated Schedule source shown by the homepage; no guessed/hard-coded period times.
4. Preserve Firebase login/session across internal navigation and browser Back; logout only on explicit logout or genuine auth expiry/revocation.
5. Attendance full action audit: Arrival, Leave Campus, Return to Campus, repeated exit/return where valid, Final Departure, OD actions, acknowledgement/verification/admin controls. Verify UI state and Firestore writes, including invalid sequences.
6. My Attendance: add Return to Home and preserve session.
7. System-wide sub-page navigation: 2–3 context-appropriate same-tab return buttons, permission-aware. Typical destinations: parent module, Admin Dashboard, Timetable Home.
8. Biometric History Import: Return to Attendance Administration + Admin Dashboard + Timetable Home.
9. Daily History: restore Leave / Duty Leave (OD/Special Assignment) / Operational Status (Vacant Position) summary from authoritative dated operational records. Vacant remains operational status, not leave.
10. My Leave & Duty Leave: show all surviving approved dated records (past/current/future), not only recent records. Keep Leave and Duty Leave separate. Do not invent dates for non-dated legacy accounting.
11. Leave Master Editor: move Leave Integrity Checker & Duplicate Remover directly below Leave Reconciliation; layout move only.
12. Responsive layout: widen main content area appropriately on desktop and align header/content system-wide; retain safe tablet/mobile margins and no horizontal overflow.
13. Recheck existing Leave Rules, Quick Add, Proxy, Vacant Position, temporary replacements, Attendance, My Area, Annual Calendar and Timetable Studio after corrections.

## Non-negotiable safeguards

- Do not rewrite permanent timetable for temporary replacements.
- Never invent historical leave dates.
- Do not weaken Firestore rules to solve UI issues.
- Do not create a second leave-balance/history engine.
- Do not merge/deploy to production until isolated preview passes.
