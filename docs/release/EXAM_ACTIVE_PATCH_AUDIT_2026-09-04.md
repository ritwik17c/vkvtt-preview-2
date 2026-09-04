# Exam Department active-patch audit — 2026-09-04

Audit checkpoint: `c9628f7936cc01f563e938ef36729bf15fa676f1` (`approved-layout-logo-1`).

Two active runtime patterns were identified as high-risk for page responsiveness:

1. `vkv-exam-major-workflow.js` attached a `MutationObserver` to the entire `document.body`. Every DOM mutation triggered a full text-node walk (`normalizeVisibleSubjects`) plus draft-card scanning. During initial rendering of hundreds of paper rows this can repeatedly re-scan the whole page.
2. `vkv-exam-output-finalizer.js` ran `tick()` every 700 ms forever. `tick()` recalculated metrics, inspected the printable matrix and repeatedly checked/rebound output buttons even when the user was idle.

Cleanup rule: preserve all exam features and layout, but replace broad/permanent watchers with event-driven or tightly scoped refreshes only. No timetable logic, persistence model, print layout, class/subject rules, or Firestore workflow is to be changed in this cleanup.
