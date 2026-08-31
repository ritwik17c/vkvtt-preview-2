# Version 65.3 — Separate Non-Teaching Staff Leave Roster

## Summary

- Adds a Principal-only Non-Teaching Staff register in the Admin Dashboard.
- Stores name, unique staff code, designation, optional email and remarks.
- Supports add, edit and warned deletion with administrative change history.
- Includes active non-teaching staff in Leave / OD / Special Assignment entry, Leave Master Editor and Approved Leave Register.
- Keeps non-teaching staff completely outside the master timetable, workload, Free Teachers, Where Now and proxy candidate/allotment systems.
- Preserves historical leave records if a roster entry is later deleted.

## Performance and data safeguards

- The cached `operationalRecords()` implementation is unchanged.
- Non-teaching staff are never inserted into `teachers` or timetable records; they remain in the separate `nonTeachingStaff` dataset.
- Existing master, leave and proxy data remain backward-compatible because a missing `nonTeachingStaff` array is treated as empty.

## Rollback

Revert the Version 65.3 merge commit to restore Version 65.2. Existing `nonTeachingStaff` data in Firestore is inert under Version 65.2 and does not need to be deleted.
