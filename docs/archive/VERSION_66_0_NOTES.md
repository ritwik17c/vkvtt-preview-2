# Version 66.0 — Timetable Studio and Annual Calendar

## Purpose

Version 66.0 adds a non-destructive timetable design and generation system. A generated timetable is never an automatic replacement for the operational master. Every saved candidate remains an independently named version and can be activated later by the Principal/Admin.

It also integrates the official Annual Calendar 2026–27 on the home page. Full View opens by default, with Daily and Monthly alternatives. The Principal/Admin can add, edit or delete calendar items from a dedicated management page.

## Professional interface redesign

- Shared institutional design system across the home page and every active administration, leave, attendance, access, import/export and integrity module.
- Restrained deep-blue, neutral and warm-gold palette aligned with a professional school operations product.
- Consistent typography, spacing, radii, surfaces, form controls, buttons, status messages and table treatment.
- Functional emoji labels are progressively replaced with a consistent lightweight line-icon system without changing button IDs or event handlers.
- Home-page functions are presented as compact, neutral action cards with clearer separation between My Area, timetable views and Daily Management.
- Admin Dashboard tiles use a denser three-column workspace with restrained category accents, stronger hierarchy and keyboard activation.
- Mobile layouts collapse cleanly to one or two columns, preserve minimum touch targets and contain wide data tables without shifting the whole page.
- Visible keyboard focus, skip-to-content navigation, live status announcements, reduced-motion support and loading-state indicators improve accessibility.
- Existing Annual Calendar and Timetable Studio workspaces retain their purpose-built professional layouts and are visually aligned through the same palette and interaction principles.
- The redesign is presentation-only: no Firestore schema, role, attendance, leave, proxy, calendar or timetable-generation behavior is changed.

## Annual Calendar

- Home-page Annual Calendar button visible to signed-in staff only while the Principal/Admin setting is On.
- Principal/Admin On/Off control retains all saved calendar entries; Off also blocks staff reads of the managed calendar document.
- Full View active by default, with Daily and Monthly views retained.
- Original April 2026–April 2027 calendar preserved as the safe first-load baseline.
- Search, category filters, Today, print and event-detail views.
- Dates displayed and entered as `dd/mm/yyyy` throughout all active app modules; Firestore continues to use ISO keys internally for safe sorting.
- Admin Dashboard → Annual Calendar Management.
- Add, edit and delete events across session milestones, examinations, holidays, celebrations, observances, restricted holidays and common programmes.
- A saved managed list is stored in `annualCalendar/current`; the original baseline remains available when no managed document exists.

## New Timetable Studio

- Professional desktop and mobile-responsive workspace.
- Complete version library with Draft, Ready, Active and Inactive states.
- Automatic snapshot of the previous operational master before the first Studio activation.
- Open an active version only as a safe working copy.
- Copy-on-write protection for an inactive historical version: the first edit becomes a new Draft instead of rewriting history.
- JSON export, share summary, print and explicit Admin-only deletion.

## Editable components

- Teachers, codes, daily load limits and unavailable slots.
- Classes and sections with their own active-period patterns.
- Subjects, short names, card colours and daily repetition limits.
- Venues/rooms, types, capacities and unavailable slots.
- Period numbers and bell-time labels.
- Reusable teacher allocation cards containing subject, teacher(s), class(es), venues, weekly periods, lesson length, priority and preferred days.
- Combined classes and co-teaching are represented as single timetable events and expand safely into the existing master-record format on activation.

## Generation

- Every click receives a new random seed and produces a separately stored candidate.
- Each candidate retains its seed, parameter snapshot, attempt count, score and unplaced cards.
- Hard constraints: class, teacher and venue collisions; unavailability; consecutive double/triple periods; joined classes.
- Soft scoring: lesson distribution, repeat-subject avoidance, teacher daily load, gaps and last-period preference.
- Generator yields periodically so the interface remains responsive.

## Visual editor

- Colour-coded timetable cards.
- Desktop drag-and-drop.
- Mobile tap-card then tap-destination workflow.
- Move, swap and replace operations.
- Unplaced-card tray.
- Venue reassignment.
- Card locking for future generation.
- Thirty-step undo/redo history.
- Conflict-increasing edits are rejected immediately.

## Validation and activation

- Full teacher, class, venue, availability and entity-reference validation.
- A version cannot be marked Ready or activated with a hard conflict or unplaced lesson.
- Delegated members may configure, generate, edit, validate and save non-active versions.
- Only the Principal/Admin may activate or delete versions.
- Activation updates `master/current` only after confirmation and records an immutable activation audit.
- Proxy, Free Teachers, workload and public timetable views continue to use only the active operational master.

## Firestore additions

- `timetableVersions/{versionId}` — complete named version documents.
- `timetableActivations/{activationId}` — immutable Admin activation audit.
- `authorizedUsers.permissions.timetableStudio` — independent delegated Studio permission.
- `annualCalendar/current` — complete Principal-managed Annual Calendar event list.

The complete replace-all rules are provided in `FIRESTORE_RULES_V66_REPLACE_ALL.txt` (identical to the current `firestore.rules.v62.txt`) and must be published before the Studio is released.

## Rollback

- Source rollback point: Version 65.4 commit `e1bf53d`.
- Operational rollback: open an earlier retained timetable, validate it and activate it.
- Existing attendance, leave, proxy, temporary-replacement and non-teaching data are preserved during timetable activation.
