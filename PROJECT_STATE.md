# VKV Nalbari Timetable — Current Next Release

## v66.0 — Timetable Studio and Annual Calendar

The new Studio builds and stores complete timetable versions without modifying the operational master. Components and allocation cards are reusable; each generator run stores its own seed, parameters and score. Only the Principal/Admin can activate a clean Ready version. Previous active timetables remain in the version library for later reactivation.

The Studio uses `timetableVersions`, `timetableActivations`, and the independent `authorizedUsers.permissions.timetableStudio` delegation flag. Publish the accompanying Firestore rules before release.

The home page also opens the Annual Calendar 2026–27 in Full View by default, with Daily and Monthly alternatives. Admin Dashboard → Annual Calendar Management controls the saved event list in `annualCalendar/current` without exposing the source documents.

## v65.0 — Performance Architecture Reset
Reason: repeated v64.x feature patches left too much expensive work on initial page load and repeated calculations.

v65.0 keeps the full feature set but changes heavy operations to cached or on-demand execution.

Protected working feature: Bulk VL Update.
Master Timetable remains untouched.

## v65.1 — Operational Replacement Proxy Integration

Active temporary replacements are now included in Free Teachers and proxy candidate selection while inheriting the replaced teacher's regular timetable. The permanent roster and all 1,140 master timetable records remain untouched.

Configuration remains date-bound through Admin Dashboard → Temporary Leave-Vacancy Replacements. Source-code rollback: revert the v65.1 commit. Operational-record rollback: end, cancel or archive the replacement record in the dashboard.
