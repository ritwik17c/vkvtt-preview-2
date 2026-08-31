# VKV Timetable v60.0

## Assisted Legacy Leave Resolution

- Adds collapsible, filterable legacy-resolution groups with teacher/month/row search.
- Detects and protects suspicious long legacy date ranges instead of expanding them into hundreds of dates.
- Offers explicit, non-silent suggested year corrections for malformed or immediately out-of-session years.
- Adds guided half-day resolution for fractional totals such as 1.5 days across two dates; Admin selects the half-day date and the importer creates separate full/half validated records.
- Adds manual date allocation for multi-category groups when category totals exactly reconcile with the available dates.
- Keeps all suggestions advisory until Admin accepts them.
- Keeps accounting-only items separated from dated leave and proxy operations.
- Retains the final reconciliation gate; import is disabled until every error source item has an explicit valid resolution.
- Master Timetable import remains completely separate.
- No Firestore Rules change is required.
