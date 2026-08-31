# VKV Nalbari Timetable — v62.0

## Stability + Leave Management Release

### 1. Sanitised timetable runtime
- The stored Master Timetable is not rewritten by this release.
- Runtime teacher-code resolution now accepts:
  - `codes[]`
  - `teacherCodes[]`
  - `teacherCode`
  - `code`
  - recognised roster codes embedded in assignment text such as `Hindi-DK`.
- All operational timetable views now receive sanitised teacher-code arrays.
- My Timetable uses the same sanitised source logic as operational views.

### 2. Combined-duty proxy correction
- Same teacher + same day + same period is treated as one teaching duty even when multiple class records are present.
- Combined classes are merged into one proxy requirement (for example XI-SCI + XI-ARTS).
- Classes/assignments remain visible as a combined duty; they are not deleted from master data.

### 3. Timetable Integrity Checker
New `admin-timetable-integrity.html` (read-only):
- unresolved teacher-code structures
- exact duplicate master rows
- multiple entries in one class/day/period slot
- combined teacher-duty slots (informational)
- records suppressed by the active schedule profile
- count of legacy assignment-text records successfully resolved

### 4. Powerful Leave Master Editor
- Continuous Date Range builder (From Date / To Date).
- Range expands into date-level rows for precise proxy/history behaviour.
- Existing Individual Date rows remain available.
- Full Leave hides From Period / To Period controls.
- Full labels replace abbreviated From P. / To P.
- Legacy pending items can use the same range builder.
- Range generation never silently removes dates; administrator reviews/removes non-leave dates before save.

### 5. Leave Integrity Checker
- Scans current approved plans and daily approved statuses.
- Detects exact duplicate leave records.
- Detects overlapping/contradictory statuses for the same teacher/date/period span.
- Read-only whole-database report inside Leave Master Editor.
- New save-time protection blocks exact duplicates and contradictory overlaps.
- Existing record must be edited/archived rather than silently duplicated.

### 6. Legacy Leave loading reliability
- Leave Master Editor no longer uses one all-or-nothing `Promise.all` for every auxiliary collection.
- Pending legacy accounting has its own required load result.
- Optional viewer/audit data failures no longer leave Pending Resolutions stuck indefinitely on “Loading…”.
- A genuine legacy-permission/load failure is surfaced as an explicit error.

### Firestore Rules
- `firestore.rules.v62.txt` is included for version tracking.
- No new Firestore collection is required for the v62.0 Integrity Checkers; both operate read-only on collections already used by v61.
