# Version 65.2 — Dated Proxy Drafts and Controlled Corrections

## Purpose

Improve the operational proxy workflow without changing the Version 65.0/65.1 cached timetable architecture that restored fast home and admin loading.

## Changes

- Proxy Managers can select today or the next day in Proxy Allotment.
- Today and next-day allotments/supervisions use separate date-keyed local and Firestore daily records, so partial work remains saved.
- A finalised proxy timetable is locked against changes.
- Only the Principal (`admin` role) can enable a correction window, and a reason is mandatory.
- Correction authorization is recorded with date/time, UID, email, reason, and bounded history; re-finalising closes the correction window and increments the revision.
- Incomplete drafts cannot be shared or printed; they remain editable and saved.
- Background schedule and leave-plan refreshes no longer reset the currently selected proxy period to Period 1.
- The app URL cache marker is advanced to `65.2` so clients receive this release cleanly.
- All active home-page, Admin Dashboard, admin-module, navigation-link and dashboard add-on version displays/cache markers are standardised to `65.2`; older release-note and archived legacy filenames remain unchanged as historical records.

## Performance safeguard

- The memoised `operationalRecords()` implementation and its cache invalidation design are unchanged.
- No new timetable-wide recalculation loop was added.
- Next-day cloud polling runs only while a next-day proxy date has been selected; today continues to use the existing daily poll.

## Rollback

- Revert the Version 65.2 merge commit (or restore the Version 65.1 merge commit `b0c8416bb1730b3dc338bf42b9b9d7585414ba3b`).
- Stored daily records are date-keyed and backward-compatible; rollback does not require deleting Firestore data.
