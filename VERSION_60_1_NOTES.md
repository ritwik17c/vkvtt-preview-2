# VKV Timetable v60.1 — Audit Clarity Update

## Purpose
This is a focused audit-clarity refinement of v60.0. It does not change the core legacy leave validation philosophy.

## Improvements
- Corrected cards now show the exact accepted interpretation.
- Half-day corrections explicitly show:
  - full-day date(s)
  - half-day date
  - Half Leave status
  - P5–P8 duration
  - leave category
  - units against each date
- Corrected records show the original source interpretation beside the accepted correction.
- A visible “Correction accepted by Admin” indicator is shown.
- The reconciliation area includes an expandable correction audit list with exact date allocation.
- The final import confirmation includes the exact correction audit before anything is written.
- Imported corrected plans retain correction-audit metadata for administrative traceability.
- Review decisions made in v60.1 are autosaved in the current browser for the selected workbook and restored when the same workbook is reselected after a refresh.
- Saved browser review progress is removed after a successful final import.

## Safety
- No historical data is silently changed.
- No guessed half-day date is accepted automatically.
- Master Timetable import remains completely separate.
- Final import remains blocked while unresolved items remain.
- No Firestore Rules change is required.
