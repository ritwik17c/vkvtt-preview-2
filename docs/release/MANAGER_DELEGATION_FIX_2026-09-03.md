# Manager Delegation Pre-Production Fix — 03/09/2026

## Intended Manager role
An active `authorizedUsers` profile with `role: "manager"` is an operational delegated role, not Principal/Admin.

Manager receives:
- Proxy Manager
- Leave / Duty preparation through Quick Add, submitted provisionally for Principal approval
- Attendance Manager

Manager does not automatically receive:
- Admin Dashboard / role administration
- Principal approval authority
- Ultimate/Historical destructive leave editing
- Timetable Studio (separate permission)
- Examination Department (separate permission)
- QB Coordinator responsibilities (separate subject delegation)

## Files aligned in Preview-2
- `vkv-home-app-final.js` — Manager now receives Proxy, Leave and Attendance delegated tiles.
- `leave-manager.html` — Manager is recognised as a valid leave-preparation role.
- `leave-manager-entry.html` — Manager may open Quick Add and submit provisional records.
- `FIRESTORE_RULES_V66_REPLACE_ALL.txt` — Manager may read/create/revise their own provisional leave requests while approval/delete remains Admin-only.
- `FIRESTORE_RULES_MANAGER_DELEGATION_PATCH.txt` — exact rules change retained as an audit/rollback aid.

## Required Firebase step before Manager Quick Add can be fully tested
Publishing a rules file to GitHub does not deploy Firestore rules. Publish the updated `FIRESTORE_RULES_V66_REPLACE_ALL.txt` in Firebase before testing Devendra Sir's Quick Add submission.

## Acceptance test
Using Devendra Sir's Manager account:
1. Home should show Section 3 delegated tiles for Proxy Manager, Leave Manager and Attendance Manager.
2. Leave Manager should show Quick Add Leave / Duty.
3. Quick Add should allow submission of a test provisional request.
4. The request should remain provisional and require Principal/Admin approval.
5. Manager should not see Principal/Admin leave controls or Admin Dashboard.
6. Proxy Manager and Attendance Manager should open without an access-denied message.
