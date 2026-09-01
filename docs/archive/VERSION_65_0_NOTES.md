# v65.0 — Performance Architecture Reset

This is not another feature patch. It changes when expensive work is performed so the app remains responsive.

## Main Timetable
- Memoises sanitised master records.
- Memoises operational timetable records by date / schedule / replacement state.
- Avoids repeatedly rebuilding the 1,140-row operational timetable for every view and proxy calculation.

## Admin Dashboard
- Admin access is verified first.
- Dashboard opens before the Master Timetable is fetched/rendered.
- Master data is preloaded only when the browser is idle.
- Heavy teacher/class/replacement/history tables render only when an inline Admin panel is actually opened.

## Leave Editor
- Initial load is limited to core scheduled leave plans + legacy accounting.
- Daily approved status history is no longer fetched automatically.
- Daily status history loads only when requested, or when the Integrity Checker needs it.
- Viewer/email mapping loads only when Sync My Area is used.
- Audit history remains on-demand.
- Existing 40-card pagination is retained.
- Integrity scan remains manual and grouped by Teacher + Date.
- Common save operations update only relevant leave sections rather than always rebuilding the whole page.

## Preserved functionality
- My Leave Record visibility
- Full Edit
- Edit A/B & Keep conflict workflow
- Bulk erroneous-card cleanup
- Bulk VL Update
- VL date ranges and exceptions
- Timetable sanitation / combined-period proxy logic
- Master Timetable is not rewritten.
