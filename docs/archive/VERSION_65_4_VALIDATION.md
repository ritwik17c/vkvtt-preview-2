# Version 65.4 Validation Record

## Passed in this development checkpoint

- JavaScript syntax parsing for every existing HTML module, including the two new attendance pages.
- Git whitespace/error scan (`git diff --check`).
- Version and navigation integration checks.
- Static review of role gates and private/public field separation.
- Append-only original punch design; staff edits/deletes are denied in rules.
- Separate biometric correction/audit records.
- Non-teaching importer preview, code-collision validation and confirmed-write boundary.
- Existing timetable/proxy algorithms were not modified; the separate `nonTeachingStaff` dataset remains outside those calculations.

## Required before release (not available in this runtime)

- Compile and publish the complete v65.4 Firestore rules against the Firebase project.
- Create any Firestore composite indexes requested by real authenticated queries.
- Test with at least one Teacher/Viewer, Non-Teaching Staff, Attendance Manager and Principal account.
- Test real mobile GPS at 0–75 m, 75–100 m and beyond 100 m from the punching machine.
- Test an approved preconfigured OD destination and a provisional destination.
- Compare app punches with an actual biometric export and exercise all five verification outcomes.
- Confirm browser download/import of the generated `.xlsx` template on the school’s intended devices.
- Complete a mobile regression pass on timetable, leave and proxy flows.

## Release decision

**DO NOT MERGE OR DEPLOY YET.** Backend-rule publication and authenticated field testing are mandatory safety gates. The live v65.3 app must remain unchanged until these checks pass.

