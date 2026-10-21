# VKVTT Repository Cleanup Audit — 19 Sep 2026

## Cleanup principle
Production runtime files are not to be deleted merely because their names contain "fix", "bridge", "patch", or old version strings. A file is removable only after proving it is not referenced by current production entry points and its behavior has been consolidated elsewhere.

## Source of truth
- **Firestore replace-all source:** `FIRESTORE_RULES_V66_REPLACE_ALL.txt`
- This file must track the currently published production rules.
- Standalone Firestore patch files are historical migration aids only and must never be used as a replacement ruleset.

## Confirmed historical patch artifacts in repository root
The following are non-runtime patch/reference files. They are retained for now to avoid destructive cleanup before the current access regression is field-tested:
- `FIRESTORE_RULES_CLASS_OBSERVATION_PATCH_2026-09-08.txt`
- `FIRESTORE_RULES_EXAM_DELETE_ADMIN_ONLY_PATCH.txt`
- `FIRESTORE_RULES_EXAM_PRODUCTION_BLOCK_2026-09-07.txt`
- `FIRESTORE_RULES_MANAGER_DELEGATION_PATCH.txt`
- `FIRESTORE_RULES_QB_BULK_IMPORT_PREFLIGHT_PATCH_2026-09-07.txt`
- `FIRESTORE_RULES_QB_TEACHER_SELF_EDIT_PATCH.txt`
- `FIRESTORE_RULES_V663_PHASE2_PATCH.txt`

## Safe cleanup completed in this pass
1. Restored Class Observation policy into the master replace-all ruleset.
2. Aligned Exam Schedule rules with the current production policy, including `EXAM_SUBJECT_MASTER` editing and admin-only deletion.
3. Aligned Question Bank rules with the deterministic `QBTI-` bulk-import preflight protection.
4. Kept runtime bridge/module files intact while Devendra Sir's Class Observation fix awaits field testing.
5. Avoided deleting historical patches until the live access test passes.

## Next cleanup after field test
After Class Observation access is confirmed:
- move historical Firestore patch files into `docs/archive/firestore-patches/`;
- remove duplicate nested Class Observation bridge loading once direct loading is proven stable;
- audit stale cache-version strings across production HTML entry points;
- identify repair/test pages not linked from production and archive them;
- consolidate theme-specific one-off fixes only after page-by-page light/dark regression checks.

## Guardrail
Do not replace production Firestore rules from any standalone `*_PATCH*.txt` file.
