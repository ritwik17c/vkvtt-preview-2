# VKVTT Examination Module — Production Regression Checklist

Date established: 21 September 2026

This is the release gate for Examination Module changes. A change is not production-ready merely because one button works.

## Canonical lifecycle
1. Open the Examination Module with an authorised account.
2. Open an existing published timetable.
3. Amend Published Timetable creates or reuses one editable revision.
4. Save Cloud Draft updates that same revision; it must not create another same-title draft.
5. Move Papers by Date preserves class-subject assignments and updates revised dates.
6. Submit to Principal changes the same revision to submitted.
7. Approve & Publish replaces the original published timetable in place.
8. The temporary revision disappears after successful publication.
9. Only one canonical published timetable remains for that group/title.
10. Admit Card / Assessment Ticket source selection sees the revised canonical published timetable.

## Delete behaviour
1. Draft Delete removes the draft permanently.
2. Deleting an active draft detaches it from editor/autosave first.
3. A deleted draft must not reappear after Refresh or reload.
4. The sole/current canonical published timetable is protected.
5. Only an older same-title published duplicate may expose Delete Duplicate.

## Manual timetable
1. Opening a cloud draft restores its manual timetable assignments.
2. Edits autosave only to the active draft ID.
3. Autosave must never switch to a different same-title timetable while an active ID exists.
4. Moving papers preserves subject and class and must not silently drop assignments.

## Published outputs
1. Print / View shows the canonical published timetable.
2. Admit Cards inherit published exam name, dates and subject codes.
3. Assessment Tickets B1–II hide the exam-name line and use the assessment preset.
4. Admit Card / Assessment Ticket printing is black-and-white/grayscale.
5. Default signatures and Swamiji asset load without manual upload.

## Regression safety
- Do not add a second save/publish/delete implementation in another script.
- New UI cards call the existing lifecycle path instead of duplicating Firestore writes.
- Historical recovery/fallback scripts are lazy-loaded and do not run during ordinary timetable workflows.
- No new MutationObserver or recurring interval may mutate lifecycle state without explicit justification.
