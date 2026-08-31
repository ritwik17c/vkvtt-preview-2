# VKV Nalbari Timetable — Version 63.0

## Leave workflow redesign

- Default leave-entry mode is **One Date**.
- A compact **More ▾** section reveals:
  - **Date Range +** — add multiple continuous date blocks.
  - **Staggered Dates +** — add multiple unrelated individual dates.
- Multiple ranges and staggered-date groups can coexist in the same leave record.
- All generated entries flow into one date-wise allocation area before saving.
- Dates are entered/displayed explicitly as **DD/MM/YYYY**.
- Reconciliation now shows:
  - total leave units entered,
  - expected legacy units where applicable,
  - category-wise breakdown (CL, EL, SEL, etc.).
- Mixed leave categories/statuses are totalled across the whole editor.

## Dashboard quick entry

- New **Quick Add Leave** dashboard card.
- Opens the same v63 Leave Editor in quick-entry mode inside the Admin Dashboard.
- Uses the same Firestore records, duplicate checks and audit trail; it is not a separate data system.
- After saving, the quick editor resets for the next leave entry.

## Duplicate & Conflict Manager

- Replaces the read-only duplicate checker presentation with a safer management workflow.
- Exact duplicates may be reviewed and archived one at a time.
- Same-date contradictions/overlaps are flagged for review and are never automatically deleted.
- Archive actions preserve the audit trail and continue to warn if a historical published proxy exists.

## Proxy shortcut and hover behaviour

- **Today’s Allotted Proxy** remains visible as a permanent Daily Management shortcut.
- If no final proxy list has been published yet, the existing published-proxy view simply reports that status.
- Pointer/hand cursor is reinforced for clickable buttons, cards, summaries and links.
- Disabled controls continue to use the not-allowed cursor.

## Data safety

- Legacy dates are never invented.
- Pending legacy records cannot be saved until entered leave units reconcile with expected units.
- Existing duplicate/conflict checks remain active before save.
- Past leave changes do not silently rewrite already-finalised historical proxy lists.
