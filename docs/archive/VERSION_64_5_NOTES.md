# v64.5 — Smooth Operation, My Leave Visibility & Conflict Repair

- My Leave Record is always visible in My Area; lock/unlock is explained inside the view.
- Fixes the async Leave Control race that could leave My Leave hidden after reconciliation was unlocked.
- Approved leave cards render 40 at a time with Load More.
- Audit history loads only when requested.
- Integrity scan remains manual and now groups comparisons by Teacher + Date instead of all-to-all scanning.
- Overlap/contradiction rows now offer Keep A/Remove B, Keep B/Remove A, Edit A & Keep, Edit B & Keep.
- Existing Full Edit, Bulk Erroneous Cleanup, Bulk VL Update and VL date ranges are preserved.
- Master Timetable is not rewritten.
