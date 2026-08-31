# v57.0 Update Notes

This update is based on the supplied GitHub ZIP, including its `.git` directory.

### Safety changes
1. Master Timetable Import and Leave Import remain completely separate.
2. Leave import now blocks the entire import if any genuine validation error exists.
3. No partial write occurs while errors remain.
4. Exact dated duplicates are skipped.
5. Non-dated legacy balances are preserved separately as `legacyLeaveAccounting`.
6. Legacy accounting is never converted into dated leave events and is never used for proxy coverage.
7. Legacy accounting can be viewed and exported from the Approved Leave Register.
8. Import batch metadata is retained for imported dated and legacy records.

### Important Firebase data model additions
- `legacyLeaveAccounting/{id}` — non-dated historical accounting only.
- Existing `dailyRecords/__leavePlans` remains the source for dated scheduled/imported approved status plans.
- Existing `approvedStatusPlans` remains the read-only operational projection.
