# VKVTT Examination Module — Production Readiness

Date: 07/09/2026
Repository: `ritwik17c/vkvtt-preview-2`

## Approval and authority model

- Exam Managers / Exam In-charges may prepare, edit and submit their own permitted examination work.
- Principal/Admin may open any saved timetable/template.
- Principal/Admin may approve a saved or submitted timetable and publish it.
- Principal/Admin may approve a saved template for shared reuse.
- Only Principal/Admin may delete saved examination timetables/templates.
- Published timetables are protected from deletion in the production-facing UI.

## Authoritative saved-work UI

`vkv-exam-manager-shared-library.js` is now the authoritative shared library for:

- Saved Examination Timetables
- timetable approval/publication
- Saved Examination Templates
- template approval
- shared template access
- Admin-only deletion controls
- read-only view/print access for other Exam Managers

The old owner-only / duplicate saved timetable panels are visually suppressed by the production library. Their underlying core handlers are retained temporarily for safe compatibility when opening an existing editable cloud workspace.

## Approved-output consolidation

The separate `vkv-exam-approved-output-access.js` panel is no longer loaded by the active cleanup loader. Published timetables are displayed within the single Saved Examination Timetables library instead.

The old file is intentionally retained for one stabilization cycle so stale browser caches do not fail with a missing script. It should be removed only after production verification.

## Template approval behaviour

- Creator/Admin can continue using the creator's own draft template.
- A template approved by Admin becomes reusable by all authorised Exam Managers.
- An unapproved template created by another person is not offered for shared reuse.
- Approval adds `status: approved` and `templateApproved: true` plus approval audit fields.

## Timetable approval behaviour

Admin approval accepts a saved timetable when it contains actual timetable content from either:

- generated timetable events, or
- the stabilized manual timetable assignments.

Duty allocation is not required merely to approve the timetable itself. Duty planning remains a separate operational workflow.

Approval writes the approved workspace to `publishedExam/current` and marks the source `examSchedules` record `published`.

## Firestore production rule warning

The historical file `FIRESTORE_RULES_V66_REPLACE_ALL.txt` still contains the old Exam Manager delete permission and MUST NOT be treated as authoritative for the Examination block.

Use `FIRESTORE_RULES_EXAM_PRODUCTION_BLOCK_2026-09-07.txt` for the current production Examination rules. The required deletion rule is:

`allow delete: if isAdmin();`

## Active production helper stack

- `vkv-exam-multi-manager.js` — multiple Exam Manager delegation
- `vkv-exam-calendar-date-guard.js` — Academic Calendar exam-date validation
- `vkv-exam-datewise-duty-planner.js` — date-wise venue/duty planning
- `vkv-exam-manager-shared-library.js` — authoritative saved timetable/template library and approval workflow
- `vkv-exam-template-delete.js` — compatibility guard for Admin-only delete controls still emitted by older template cards
- `vkv-exam-template-class-scope-fix.js` — legacy template class-scope repair
- `vkv-exam-source-summary-clean.js` — production loader / ordering compatibility layer

## Do not remove yet

The following are retained for one stabilization cycle because existing saved work or cached pages may still rely on them:

- legacy template recovery/import helpers
- old approved-output file (not actively loaded)
- core cloud-workspace renderer (hidden duplicate UI, retained as open/edit handler)

## Required pre-production verification

1. Admin account shows Approve & Publish for saved/submitted timetables with timetable content.
2. Admin account shows Approve Template for draft templates.
3. Exam Manager does not see approval/delete controls.
4. Exam Manager sees shared saved timetables.
5. Exam Manager sees approved shared templates and can use them with fresh dates.
6. Another Exam Manager's unapproved template is not reusable.
7. Admin can open an existing saved timetable for review.
8. Manual timetable records can be approved and printed.
9. Published timetable appears read-only to Exam Managers.
10. No duplicate Saved Timetable / Approved Timetable panels are visible.
11. Academic Calendar invalid-date warnings still work.
12. Date-wise duty planner still follows selected exam dates.
13. Firestore deployed rules use Admin-only deletion.

Do not merge Preview 2 into production until these checks pass in both an Admin account and at least one delegated Exam Manager account.
