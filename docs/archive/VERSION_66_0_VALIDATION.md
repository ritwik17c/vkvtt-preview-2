# Version 66.0 Validation Checklist

## Automated checks completed

- JavaScript syntax checks for all active inline scripts and `timetable-studio.js`.
- HTML script/style balance and referenced static element IDs.
- Git whitespace validation.
- Pure generator test covering teachers, classes, subjects, combined classes, collision validation, candidate generation and activation conversion.
- Preservation test for temporary-replacement and non-teaching fields during master conversion.
- Public-source scan for embedded personal Gmail/Yahoo/Outlook/Hotmail addresses.
- Annual Calendar baseline-data parity, Full View default and `dd/mm/yyyy` display checks.
- Annual Calendar Admin add/edit/delete and Firestore payload structure checks.
- Annual Calendar Admin On/Off control, hidden staff navigation and hidden-document rule boundary checks.
- Active date-input and user-visible date audit: `dd/mm/yyyy` only; Firestore ISO keys remain internal.
- Attendance test-audit rule and Principal/Admin attendance edit/delete boundary checks.
- Shared Version 66.0 design-system and interface-enhancement assets referenced by every active legacy workspace page.
- No archived leave-editor page is changed or loaded by the redesigned interface.
- Keyboard activation added to Admin Dashboard tiles while preserving their existing click handlers.
- Destructive-button styling, polite live regions, visible focus treatment, reduced-motion behavior and responsive touch targets.
- Homepage and Admin Dashboard grid breakpoints checked for desktop, tablet and narrow mobile widths.
- Timetable Studio and Annual Calendar purpose-built workspaces preserved without generic style overrides.

## Required authenticated checks before merging

1. Publish the Version 66.0 Firestore rules.
2. Open Admin Dashboard → Timetable Studio as Principal/Admin.
3. Confirm the active master imports into components and allocation cards.
4. Save a named Draft and reopen it from the Version Library.
5. Delegate Timetable Studio to a non-Admin UID and verify that the member can save drafts but cannot activate or delete.
6. Generate at least two candidates and confirm both remain stored with different seeds.
7. Test drag/drop on a computer and tap-to-move/swap/replace on a phone.
8. Confirm a conflict-increasing move is rejected and undo/redo works.
9. Confirm Mark Ready remains blocked when any hard conflict or unplaced card exists.
10. Activate one validated test candidate only after reviewing its timetable.
11. Confirm the former operational master appears as an Inactive preserved version.
12. Refresh the main app and verify Teacher Wise, Class Wise, Day Wise, Free Teachers and Proxy Allotment use the newly active timetable.
13. Reactivate the preserved former version and confirm rollback.
14. Open the home-page Annual Calendar and confirm Full View opens by default; test Daily, Monthly, search, filters and print.
15. Open Admin Dashboard → Annual Calendar Management and save the original baseline.
16. Turn the Annual Calendar Off and confirm its home-page button disappears for staff and its direct page is blocked; turn it On and confirm it returns.
17. Add a harmless test event, edit it, delete it, and confirm the public calendar follows each saved change.
18. Check proxy, attendance, leave, replacement and history date inputs on phone and computer; all must accept/show `dd/mm/yyyy`.
19. Check the home page at desktop and mobile widths; confirm My Area, timetable views and Daily Management remain stable without horizontal page movement.
20. Use Tab, Enter and Space on the Admin Dashboard; confirm each focused module tile opens the same module as a pointer click.
21. Check at least one long table in User Access, Attendance Administration and Leave Administration; confirm the table scrolls inside its container rather than shifting the whole page.
22. Confirm success, warning, error and loading messages remain readable and are not hidden by the visual redesign.

Do not merge or deploy if Firestore rules are not published or any activation/rollback test fails.
