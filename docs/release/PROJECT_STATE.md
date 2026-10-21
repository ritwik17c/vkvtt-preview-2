# VKV Nalbari Timetable — Production State

## Production consolidation — 9 September 2026

The tested Preview 2 cleanup candidate has been promoted into the production repository `ritwik17c/vkvtt`. Production now uses the consolidated Preview 2 application tree, with the Main repository identity and GitHub Pages deployment preserved.

The active production service-worker shell uses cache `vkvtt-shell-2026-09-09-production-main-1`. Navigation requests are network-first with no-store handling for presentation-critical pages, and presentation assets are refreshed network-first before cache fallback. The production Home path `/vkvtt/` is recognised explicitly by the service-worker controller.

The production candidate includes the cleaned Home/theme system, Proxy and Leave refinements, consolidated Question Bank workflow and Paper Builder helpers, Examination Department workflow, Class Observation, Annual Calendar theme handling, manual-only Staff Notice Board behaviour, and the current Admin Dashboard integrations.

Temporary promotion machinery and the obsolete Preview 2 correction checklist were removed after the successful cutover. Historical operational/admin fallback tools and Firestore rule reference files are retained unless they are proven unreferenced, because they remain useful for recovery and controlled administration.

## Examination Department workflow — 2 September 2026

Production includes the complete cloud workflow: Exam Manager draft → submission → Principal return/approval → staff publication. Approved Leave, Duty/OD and Special Assignment records are checked before duties are generated. Invigilators and relievers can be replaced manually for day-of corrections while the scheduler revalidates hard rules.

Cloud data uses `examSchedules` and `publishedExam/current`. The staff-facing output is `exam-timetable.html`. Staff Notice Board remains manual-only; approved examination information is surfaced through its proper Exam/Home workflow rather than being auto-posted as a Principal notice.

## v66.0 — Timetable Studio and Annual Calendar

The Studio builds and stores complete timetable versions without modifying the operational master. Components and allocation cards are reusable; each generator run stores its own seed, parameters and score. Only the Principal/Admin can activate a clean Ready version. Previous active timetables remain in the version library for later reactivation.

The Studio uses `timetableVersions`, `timetableActivations`, and the independent `authorizedUsers.permissions.timetableStudio` delegation flag.

The home page also opens the Annual Calendar 2026–27, with Daily, Monthly/Grid and Full alternatives. Admin Dashboard → Annual Calendar Management controls the saved event list in `annualCalendar/current` without exposing the source documents.

## v65.0 — Performance Architecture Reset

Reason: repeated v64.x feature patches left too much expensive work on initial page load and repeated calculations.

v65.0 keeps the full feature set but changes heavy operations to cached or on-demand execution.

Protected working feature: Bulk VL Update.
Master Timetable remains untouched.

## v65.1 — Operational Replacement Proxy Integration

Active temporary replacements are included in Free Teachers and proxy candidate selection while inheriting the replaced teacher's regular timetable. The permanent roster and master timetable records remain untouched.

Configuration remains date-bound through Admin Dashboard → Temporary Leave-Vacancy Replacements. Operational-record rollback remains: end, cancel or archive the replacement record in the dashboard.
