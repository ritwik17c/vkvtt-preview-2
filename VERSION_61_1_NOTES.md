# VKV Nalbari Timetable — Cloud v61.1
## Stability Repair: Timetable Integrity + Legacy Leave Loader

### Critical fixes
1. **Combined-period proxy bug fixed**
   - Same teacher + same day + same period is now one canonical teacher-duty slot.
   - Combined classes such as XI-SCI + XI-ARTS generate ONE proxy requirement, not two.
   - Proxy requirement keys no longer depend on the displayed class name.

2. **Teacher Wise / active-schedule anomaly made diagnosable**
   - Teacher Wise now uses canonical teacher-duty slots.
   - If the permanent Master Timetable contains an assignment that the active schedule suppresses, the app explicitly says so instead of falsely implying that the Master entry is missing.
   - New Admin Dashboard tool: **Timetable Integrity Check**. It scans the live current Master Timetable for suppressed assignments, combined duty slots and structural anomalies.

3. **Legacy leave Pending Resolution loader fixed**
   - Leave Master Editor no longer uses one all-or-nothing Promise.all for all Firestore collections.
   - A permission/read failure in optional v61 collections can no longer leave the Pending Legacy section stuck forever on “Loading…”.
   - Pending legacy items load independently; visible diagnostics identify the exact Firestore collection/rules problem if one remains.
   - The page now warns clearly when `leaveAudit` / `leaveControl` permissions indicate that v61 rules still need publication.

### Safety
- No Master Timetable record is changed by this release.
- No schedule profile is automatically repaired or rewritten. The Integrity Check is read-only.
- No legacy leave date is invented.
- Existing v61 Leave Master Editor reconciliation rules remain intact.

### Firestore
- `firestore.rules.v61.1.txt` is included. It preserves the v61 permissions required by Leave Master Editor.
