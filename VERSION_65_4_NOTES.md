# Version 65.4 — Pilot Geo-Attendance and Campus Movement

Development branch: `feature/v65.4-pilot-attendance`

v65.3 rollback point: `cbd0cb689130b505e59c690d77021a2008ffb36a`

## Staff workflow

- Adds **My Attendance** to My Area.
- Records Arrival, Leave Campus, Return to Campus and Final Departure as separate immutable events.
- Supports unlimited properly sequenced temporary exits and returns.
- Shows the applied schedule, reporting time, late threshold and expected departure.
- Stores the full schedule snapshot on every punch so later configuration changes do not rewrite history.
- Calculates exact late and early-departure minutes.
- Requires a reason for temporary exit, early final departure and geofence exception.
- Captures location only while punching; it does not continuously track a device.
- Displays and records the pilot acknowledgement for VPN off, mock location off and Precise Location on.
- Provides Today, Daily/Date Range, Monthly Summary and privacy-limited Latecomers Today views.

## School and On Duty geofences

- School pilot default: `26.430612, 91.408792`, 100 m radius, normal acceptance to 75 m.
- GPS accuracy and distance are stored separately.
- OD assignments have exact place name, date range, optional preconfigured coordinates, configurable radius (default 150 m), expected reporting/completion and approval metadata.
- Actual phone coordinates are captured for OD check-in/out; a typed place name is never treated as location proof.

## Administration and biometric verification

- Adds Principal-only schedule and school-geofence settings.
- Supports any number of schedules, effective dates, weekdays, staff groups, arrival grace, expected departure, departure tolerance and priority/date overrides.
- Adds daily attendance metrics, location-warning queue and Excel-compatible export with Principal signature placeholder.
- Keeps the original app event immutable. Biometric verification/correction is a separate audited record with verifier, biometric time, reason and original event snapshot.
- Adds the dedicated `attendance_manager` role; Admin and authorised Manager access is retained.

## Non-teaching staff import

- Downloads a controlled two-sheet Excel template.
- Previews every row before any write.
- Uses Staff Code as the unique add/update key.
- Rejects missing required fields, invalid codes/emails, workbook duplicates, teacher-code clashes and temporary-replacement-code clashes.
- Imports only confirmed valid rows and records accepted/rejected counts and source filename in change history.
- Non-teaching staff remain outside timetable, workload and proxy calculations.

## Firestore data model

- `attendanceSettings`
- `attendanceSchedules`
- `attendanceEvents` (append-only originals)
- `attendanceLate` (privacy-limited public projection)
- `odAssignments`
- `attendanceVerifications` (correction/audit layer)

The v65.4 rule additions are currently in `firestore.rules.v62.txt` on the feature branch. The filename is retained to avoid changing existing deployment documentation; publish the complete file as the active Firestore rules before enabling the module.

## Proxy history and operational summary extension

- The Proxy Manager sees a read-only summary of today’s approved Leave, On Duty and Special Assignment records at the top of Proxy Allotment.
- Earlier dates remain locked for the Proxy Manager until the Principal authorises the selected date with a compulsory reason.
- Date-wise permission is stored in `proxyEditAuthorizations`, including the authoriser and timestamp.
- If a final proxy already exists, authorisation opens a correction window and appends to correction history.
- If the work was done manually but never entered, the authorised earlier date opens as a new draft that must be reviewed and finalised.

## Rollback

The live v65.3 application remains at commit `cbd0cb689130b505e59c690d77021a2008ffb36a`. If v65.4 is eventually released, rollback is a normal revert of the release merge commit or a fast redeployment of this recorded v65.3 point. New attendance collections are isolated and inert under v65.3; do not delete them during rollback.
