# VKVTT v66.3 — Phase 2

## Development branch
`v66-3-phase2`

Base production commit: `aec7698716650b41cc78b5c6eeb12c16af24873c`

## Phase-2 principle
Phase 2 strengthens delegation, approval control, operational responsiveness, auditability, and interface consistency without rewriting the working VKVTT architecture or weakening Firestore security.

---

## 1. Leave Editor role

Add a privileged role:

`leave_editor`

A Leave Editor may:
- create a new leave record;
- edit a provisional leave record;
- view relevant leave history and current balance information required for leave administration;
- submit or resubmit a record for Principal approval.

A Leave Editor may not:
- approve leave;
- silently alter an approved leave record;
- delete official historical leave records;
- edit Leave Rules unless separately authorised as Admin;
- change approval metadata.

The Principal/Admin remains the approval authority.

---

## 2. Leave record workflow

Canonical workflow states:

`provisional` → `approved`

or

`provisional` → `returned` → corrected/resubmitted → `provisional` → `approved`

A record may also become `cancelled` through an authorised administrative action while preserving audit history.

### Required workflow metadata

Where operationally applicable, leave records should carry:
- `approvalStatus`: `provisional | approved | returned | cancelled`
- `createdByUid`
- `createdByEmail`
- `createdAt`
- `updatedByUid`
- `updatedByEmail`
- `updatedAt`
- `submittedAt`
- `approvedByUid`
- `approvedByEmail`
- `approvedAt`
- `returnedByUid`
- `returnedAt`
- `returnRemark`

Do not erase audit fields when a record changes state.

---

## 3. Provisional leave and proxy planning

A provisional leave record is not yet an officially sanctioned leave record, but it is operationally significant.

Therefore a valid provisional leave must immediately affect:
- Proxy Manager absence detection;
- free-teacher / availability calculations;
- day-level operational absence summaries;
- timetable operational overlays;
- clash checking for another leave entry affecting the same staff member/date.

In Proxy Manager it must be visibly marked:

**PROVISIONAL · Awaiting Principal Approval**

Approved and provisional absences must remain visually distinguishable.

---

## 4. Leave-balance treatment

A provisional record should reserve its leave quantity immediately so that two editors cannot allocate the same remaining balance simultaneously.

Balance presentation should distinguish:
- Approved used
- Pending / provisional reserved
- Available after reservations

A provisional quantity is not included in the official approved-used total until approval.

If a provisional record is returned or cancelled, its reservation must be released.

When editing a leave record, the record being edited must be excluded from its own validation calculation before the revised value is checked.

All leave entry paths must use the same balance/eligibility engine.

---

## 5. Principal Leave Approvals workspace

Add a dedicated Admin action/tile:

**Leave Approvals**

The tile should show the count of currently pending provisional records, for example:

`Leave Approvals · 4 Pending`

The approval queue should show, at minimum:
- Staff member
- Leave category
- Date / date range
- Units
- Reason / remarks where permitted
- Available balance before and after reservation
- Created/last edited by
- Submission time
- Status

Principal actions:
- **Approve**
- **Return for Correction**
- view audit history

Approval must be a deliberate action; opening or editing a record must never auto-approve it.

---

## 6. Approved-record correction

Leave Editors must not directly overwrite an approved record.

Safe direction:
1. Editor opens approved record.
2. Editor uses **Request Correction** / prepares a correction proposal.
3. Principal/Admin explicitly authorises reopening or applies the correction.
4. The audit trail preserves the previous approved values and the responsible users/timestamps.

No silent mutation of official history.

---

## 7. Conditional leave safeguards retained

Phase 2 must retain the existing policy safeguards:
- never infer sensitive leave eligibility from name, gender, designation, or assumption;
- ML/EOL/PJ and similar conditional categories must not appear as ordinary universal balances;
- EOL should use policy-appropriate wording such as **No fixed maximum · subject to approval** instead of a fake numerical maximum;
- do not invent historical leave dates;
- do not delete historical categories merely because they are no longer active.

---

## 8. Security invariants

Firestore rules must enforce the workflow, not merely hide buttons in the UI.

Target permissions:
- `admin`: create/edit/approve/return/cancel within authorised administrative scope;
- `leave_editor`: create/edit/submit provisional leave only; no approval authority;
- other roles: existing permissions retained unless explicitly expanded.

Do not weaken existing Firestore rules to make the interface work.

---

## 9. Phase-2 regression targets

After the approval workflow is implemented, verify:
1. Leave Editor can create provisional leave.
2. Leave Editor cannot approve it.
3. Principal can approve it.
4. Principal can return it with a remark.
5. Returned leave can be corrected and resubmitted.
6. Provisional leave is seen by Proxy Manager.
7. Provisional leave reserves balance.
8. Returned/cancelled leave releases reservation.
9. Approved leave moves from reserved to official used quantity without double counting.
10. Editing excludes the original record from its own balance calculation.
11. Existing approved historical leave remains intact.
12. Direct Firestore writes by a Leave Editor cannot forge approval metadata.

---

## 10. Wider Phase-2 programme

After the leave approval workflow is stable:
- Proxy Manager refinement and mobile regression;
- attendance workflow and audit refinement;
- Timetable Studio validation/version improvements;
- Personal Staff Area consolidation;
- Annual Calendar refinement;
- notification centre;
- premium v60-inspired visual shell across remaining admin modules;
- final Firestore and PWA regression.

Production `main` must remain untouched until the development branch passes the required runtime checks.