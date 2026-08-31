# VKV Nalbari Timetable — Cloud v61.0
## Leave Master Editor & Reconciliation Lock

### Core purpose
v61.0 converts the temporary legacy-import correction workflow into a permanent Principal/Admin Leave Master Editor.

### My Area publication rule
- My Area → My Leave / OD / Special remains hidden while any legacy item has `resolutionStatus = pending`.
- Pending count is maintained in `leaveControl/current`.
- When pending count becomes zero, My Area leave history unlocks automatically.
- The Principal/Admin Leave Master Editor remains available permanently, even after the history is unlocked.
- Firestore rules also guard personal leave history using the publication flag.

### Pending Leave Resolutions
- Existing v60.1 accounting items are classified on first v61 editor load:
  - Admin-reviewed parked items → Pending Resolution.
  - Original non-dated legacy accounting items → Final Accounting Only.
- Pending cards show teacher, month, category, units, source row and the import reason.
- A pending item can be:
  - resolved into genuine dated leave records, or
  - deliberately confirmed as final non-dated accounting.
- A final accounting item can later be reopened as Pending.

### Leave Editor Master Template
Principal/Admin can edit all approved past, present and future:
- Full Leave
- Half Leave
- On Duty
- Special Assignment
- daily approved statuses as well as scheduled/imported leave plans
- VL / EL / CL / SEL / EOL / Maternity Leave
- one leave category/status per individual date
- different category/status on different dates within the original record
- half leave P1–P4 or P5–P8
- custom period ranges for OD / Special Assignment
- remarks/reference per date

Existing multi-date records are split into date-level approved records when saved through the editor. This makes date-wise leave type/category editing possible.

### Safety
- No invented dates.
- Pending legacy resolution must reconcile to the original parked leave-unit total.
- Audit/correction reason is compulsory before save.
- Overlapping approved status for the same teacher/date triggers a warning.
- Editing a past date that already has a published proxy triggers a strong warning.
- Past published proxy history is never silently rewritten by a leave-history correction.
- Archive requires confirmation.
- Every v61 editor save/finalisation/archive writes a Principal/Admin audit entry.

### Firestore
Publish `firestore.rules.v61.txt` before opening the new Leave Master Editor.

New collections/documents:
- `leaveControl/current`
- `leaveAudit/{auditId}`

Existing:
- `legacyLeaveAccounting`
- `dailyRecords/__leavePlans`
- `approvedStatusPlans`
- `personalStatus/{email}/records/{date}`

### No timetable change
The Master Timetable is not modified by this update.
