# Version 65.1 — Operational Replacement Proxy Integration

## Purpose

Complete the temporary leave-vacancy workflow so an active replacement teacher can receive day-to-day proxy duties without changing the permanent roster or master timetable.

## Changes

- Free Teachers now uses the operational roster, including active temporary replacements.
- Proxy candidate lists now include an active replacement teacher whenever that teacher is genuinely free.
- The replacement's inherited timetable periods remain busy and cannot be selected for proxy.
- The permanent teacher being covered is excluded from operational free-teacher and proxy lists.
- Proxy allotment, simplified allotment and emergency-supervision lookups now recognise temporary teacher codes.
- Temporary replacements are labelled in free-teacher results and proxy selectors.
- Regular-load calculations continue to include the timetable inherited from the permanent teacher.
- The operational-teacher list is memoised by date and replacement state; proxy rendering does not rebuild or rescan the 1,140-row master timetable.

## Performance safeguards retained

- Version 65.0's cached `operationalRecords()` function is unchanged.
- Admin master-data loading remains idle/lazy and heavy panels remain on-demand.
- No new Firestore reads, listeners or initial-page calculations were introduced.
- Candidate filtering operates on the small cached staff list; timetable occupancy uses the existing cached operational records.

## Data and timetable safety

- No permanent teacher was added, removed or renamed.
- No master timetable record was edited.
- No Firestore data was changed by this source-code commit.
- Jahnabi Barman should be configured through Admin Dashboard → Temporary Leave-Vacancy Replacements and linked to Minu Limboo for the applicable dates.

## Rollback

This release is isolated in its own commit. Revert that commit to restore Version 65.0 behaviour. Any temporary replacement record entered through the Admin Dashboard remains an independent Firestore record and can be ended, cancelled or archived from the dashboard.
