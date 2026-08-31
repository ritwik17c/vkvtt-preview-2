# Version 64.3 — Performance, Duplicate Resolver & VL Date Ranges

- Faster Admin verification: profile and master reads run in parallel.
- Slow-verification message + Retry button after 3.5 seconds.
- Main app no longer blocks first opening on optional Leave Control metadata.
- Exact duplicate resolver adds Keep A/Remove B, Keep B/Remove A, Edit & Keep A/B.
- Edit & Keep removes the redundant exact duplicate first, eliminating duplicate-save deadlock.
- Bulk exact duplicate remover keeps one canonical record per exact group and removes redundant copies with audit history.
- VL bulk tool now requires From Date and To Date.
- Standard VL range + units saved to all non-exception VL cards.
- Individual VL exceptions support their own From/To range, units and reason.
- No Master Timetable rewrite.
