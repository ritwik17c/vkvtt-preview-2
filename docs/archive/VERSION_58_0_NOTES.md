# VKV Timetable v58.0

## Leave Import Review & Correction

- Adds an in-app Review & Correct Import Errors workflow.
- Keeps original Excel workbook unchanged.
- Each ambiguous/error item can be:
  - corrected and revalidated,
  - retained as non-dated legacy accounting,
  - explicitly excluded from the import,
  - reset to its original unresolved state.
- Final import remains blocked while any unresolved error remains.
- Corrected rows are revalidated against the same safety rules before becoming importable.
- Legacy accounting never creates leave dates or proxy obligations.
- Existing Master Timetable import remains separate and unchanged.
- Date display remains dd/mm/yyyy.
