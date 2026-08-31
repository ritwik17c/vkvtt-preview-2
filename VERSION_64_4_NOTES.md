# v64.4 — Careful Leave Editor Repair

Built directly from the deployed/tested v64.3 line. The unused earlier experimental v64.4 package is superseded.

## Performance
- Leave Editor renders after core Leave Plans + Legacy Accounting load.
- Daily-record history, viewer-email mapping and audit history load in the background.
- Full Leave Integrity scan is no longer run automatically on first open.
- Admin verification and Master Timetable verification run in parallel.
- Admin Dashboard shell appears immediately while verification completes.

## Full editing
- Every approved operational leave card has **Full Edit**.
- Continuous approved ranges reopen as a Date-Range Row instead of exploding into dozens of date rows.
- Daily approved status cards also have Full Edit.
- Existing VL bulk tools and VL date ranges are preserved.

## Duplicate / overlap repair
- Adds **Probable duplicate** classification: same teacher, same date, same status and same day/period span even if category/source metadata differ.
- Probable duplicates receive Keep A / Remove B, Keep B / Remove A, and Edit & Keep actions.
- The old misleading bulk auto-remover no longer silently guesses; it opens the resolver for exact/probable duplicates.
- Removing the redundant record happens before Edit & Keep, eliminating the save deadlock.

## Erroneous cards
- Multi-select cleanup is available for operational, pending legacy and final accounting cards.
- Removal requires confirmation and retains audit history.

## Data safety
- Bulk VL functionality is preserved unchanged.
- Master Timetable is not rewritten.
- Published historical proxy sheets are not automatically rewritten.
