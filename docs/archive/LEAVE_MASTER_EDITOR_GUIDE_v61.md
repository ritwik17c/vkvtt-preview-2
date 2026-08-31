# Leave Master Editor v61.0 — Tomorrow's Correction Workflow

## Before you start
1. Keep the original `Leave record 2026-27.xlsx` unchanged.
2. Keep the previously prepared Pending Resolution Correction Guide.
3. Publish `firestore.rules.v61.txt` in Firebase first.
4. Copy the v61 files into your clean GitHub clone, commit and push.
5. Open `admin-leave-editor.html?v=61.0` from the new **Leave Master Editor** tile.

## What you should see
At the top:
- Pending Resolution count.
- My Area leave history = LOCKED while Pending > 0.
- Original non-dated accounting entries are not treated as unresolved unless reopened.
- The items temporarily parked with the book icon during v60.1 appear as Pending cards.

## Correct a Pending card
1. Open **Resolve with dated records**.
2. Verify the original Excel / application / attendance / proxy record.
3. Add one row for each genuine date.
4. Choose the status separately for each date.
5. Choose the leave category separately for each date.
6. For Half Leave, choose P1–P4 or P5–P8 as actually approved.
7. Enter units and remarks/reference.
8. Ensure `Entered leave units = expected leave units`.
9. Enter an audit/correction reason.
10. Save.

The pending card disappears only after a successful dated resolution or deliberate Final Accounting decision.

## If the item genuinely has no dated leave event
Use **Confirm as final non-dated accounting** only after verification.
- It stops blocking My Area.
- It remains preserved in Legacy Accounting.
- It can be reopened later if new evidence appears.

## Edit any existing leave
Use the **Leave Editor Master Template** section.
- Filter teacher/category/date.
- Click **Edit date-wise**.
- The old record is expanded into date rows.
- Change category/status individually per date.
- Save with an audit reason.

## Important warnings
- Never add a date merely to make the leave total match.
- Do not use Archive to fix an uncertain record.
- If a published historical proxy exists, the app warns you. Leave correction does not rewrite that proxy automatically.
- Future corrected leave is written back into the operational leave plan so proxy availability can use it.
- My Area leave history unlocks automatically only when Pending Resolution = 0.
- When the final pending item is resolved, the editor automatically syncs linked approved leave histories into My Area. Use the manual Sync My Area button if you later link more teacher emails.
- Even after unlock, the Leave Master Editor remains permanently available to Principal/Admin.
