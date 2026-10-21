# Attendance lateness repair — 09–10 September 2026

Purpose: correct arrival lateness calculations for 09/09/2026 and 10/09/2026 after Attendance incorrectly resolved the previous Heat Schedule instead of the active Normal Schedule.

Repair rule:
- Reporting time: 08:00
- Grace: 5 minutes
- Late begins: 08:06

Scope and safeguards:
- only `attendanceEvents` with `type == arrival` and date 2026-09-09 or 2026-09-10;
- original event snapshots are copied to `attendanceTestAudit` before modification;
- only arrival schedule/lateness fields are corrected;
- matching `attendanceLate` documents are updated or removed as needed;
- geolocation, arrival timestamp, biometric verification, leave/proxy/exam data, and all other dates are untouched;
- a fixed run marker prevents the repair from being executed twice.

Execution page: `admin-attendance-repair-2026-09-09-10.html`

This repair requires Principal/Admin authentication and existing Firestore rules; no rules change is required.
