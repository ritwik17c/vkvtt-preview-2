# VKVTT Question Bank & Paper Builder — Consolidated Roadmap

## Product goal
Make question contribution almost as easy as sending a message, while giving teachers, Subject Coordinators and the Principal a reliable academic workflow and a mature paper-building engine.

## 1. Roles and visibility
- Teaching staff: create, draft, submit, view own history, reuse own questions, build papers.
- Subject Coordinator: receives relevant submitted questions automatically by subject; verify, return for correction, add suggestion; original wording/history retained.
- Principal/Admin: sees all questions, statuses, routing, workflow, analytics, leaderboards, coordinator performance and exports.
- Non-teaching staff: no Question Bank access.
- Subject Coordinator is a delegated responsibility, not a separate base account role.
- UID ↔ staff link required for delegated authority; linking is available inside QB Admin.

## 2. Question lifecycle/status
- Draft — teacher-only working record.
- Unverified / Awaiting Verification — submitted and immediately visible to teacher, relevant coordinator and Principal/Admin.
- Verified — accepted by coordinator and enters verified school bank.
- Returned for Correction — teacher sees note and may edit/resubmit.
- Full workflow audit stores submitted/verified/returned dates and actors.

## 3. Quick Question Submission
Mandatory fields should be visually marked with * and kept minimal:
- Class / Standard *
- Subject *
- Question *
- Marks *
- Question Type * where required for analysis/paper logic

Optional fields:
- Section / Stream
- Chapter / Unit
- Topic / Sub-topic
- Difficulty
- Learning Outcome / Competency
- Bloom level / competency type (advanced)
- Expected Answer
- Marking Scheme / Points
- Keywords / Source / Remarks

Smart defaults remember recent class, subject and marks where practical.

## 4. Dictation and wording assistance
- Visible microphone button beside question field.
- Languages: English (India), Assamese, Hindi, Bengali.
- Dictation appends without destroying existing typed text.
- Stop control and clear status message.
- Graceful fallback when browser speech recognition is unsupported or microphone permission is denied.
- Teacher reviews transcription before submission.
- Correction helpers: spacing, punctuation, capitalisation; later optional AI-style suggestions for grammar, clarity, precise instruction, shortening, completing and alternative wording.
- No suggestion silently overwrites or submits the question.
- Semantic changes such as “make more challenging” are explicit actions only.
- Future Rapid Dictation: say “New question” to split multiple spoken questions into proposed cards; parse spoken marks with teacher confirmation.

## 5. Teacher history / My Bank
Each teacher sees own questions with class, subject, marks, text, status, submission date, verification date and use count.
Filters: All, Verified, Awaiting, Returned, Used, Unused; class, subject, chapter, marks, type, difficulty.
Actions: Add to Paper, Add to Draft Paper (unverified), Duplicate & Edit, View Workflow.

## 6. Coordinator Review Inbox
- Automatically filtered/routed by assigned subject and optional class scope.
- Shows teacher, class, question, marks and optional metadata.
- Actions: Verify, Return for Correction, Add Suggestion.
- Preserve original wording and full history.
- Homepage notification tile can show pending count and ageing.

## 7. Principal analytics
Core live metrics: Submitted, Verified, Pending, Returned, Coordinator Assignments, Subjects.
Drill-down reports:
- Subject-wise
- Teacher-wise
- Class-wise
- Coordinator-wise
- Date/month/session
- Pending-age buckets (0–2, 3–7, >7 days)
- Clickable metrics open underlying questions.
Exports: Excel, printable/PDF summary, copy summary.

## 8. Leaderboards
Three distinct leaderboards:
1. Submission / Quantity — total submitted.
2. Verified Contribution — total verified plus verification rate.
3. Quality Contribution — later, based on coordinator-approved quality measures, not AI alone.

Quality signals may include academic correctness, framing, difficulty appropriateness, learning-outcome alignment, originality/usefulness, competency orientation, diversity and low duplicate/return rate.
Use a configurable minimum verified-question sample before quality ranking.
Support This Month / This Session / All Time and subject-wise views.

## 9. Fluid Question Paper Builder
The actual paper remains the centre of the UI. Search, analytics and assistance are side/support tools.
Paper header: Class, Subject, Exam, Target Marks, Duration, official template.
Live progress: marks used / target, remaining, question count, section totals, optional estimated time.

Question structures:
- Normal question
- Parent + subquestions
- Nested subquestions such as Q1(a)(i)
- Internal choice (either/or) counting only attempted marks
- Attempt-any-N groups (e.g. any 4 of 6 × 2 = 8 marks)
- Passage/case/source groups
- MCQ groups

Behaviours:
- Inline add by typing/pasting/dictating.
- Automatic numbering and renumbering.
- Drag/move reorder.
- Question/subquestion marks roll up correctly.
- Sections with target/live totals.
- Add from My Bank and Verified School Bank; multi-select/search/filter.
- Prefer unused verified questions in recommendations.
- Create inline and optionally save to My Question Bank for normal verification workflow.
- Unverified questions may be used in private drafts with an internal warning; printed paper never shows the badge.
- Finalisation warns about remaining unverified questions; policy can allow Principal/teacher override.

## 10. Paper intelligence and quality checks
Contextual, dismissible tips rather than blocking popups:
- remaining marks
- section shortfall
- chapter imbalance
- repeated cognitive/question type
- competency gap
- duplicate/repeated questions
- verified percentage

Paper Health can analyse marks, coverage, difficulty balance, question type mix, repeated items and verified share.
Optional Blueprint and difficulty targets.
Advanced Bloom/competency analysis can be added later.
“Help fill remaining N marks” suggests combinations from verified unused bank but never inserts automatically.

## 11. Paper lifecycle and confidentiality
- Autosave plus visible “Saved just now”; manual Save also available.
- Draft → Ready for Review → Reviewed / Corrections Required → Final → Locked.
- Editing a locked paper creates a revised version.
- Version history/checkpoints/restore.
- Draft papers remain visible only to creator and explicitly authorised moderators/Principal/Admin per policy; question submission to coordinator does not expose the whole draft paper.
- Print preview must closely match final official paper.
- Official templates: Unit Test, Periodic, Half-Yearly, Annual, Pre-Board, Practice.
- Standard instruction library.
- Answer key/marking scheme export separately; verified question may carry answer/marking points automatically.
- Reusable passages/resources; future image/diagram support.
- Mobile supports add/edit/search/totals; desktop preferred for final formatting.
- Continue where I stopped and duplicate prior paper with repetition warning.

## 12. Implementation sequence
A. Stable submission foundation: mandatory-star form, history, statuses, coordinator + Principal visibility.
B. Dictation and safe correction helpers.
C. Coordinator routing/inbox + Principal analytics + quantity leaderboard.
D. Verified leaderboard, ageing, coordinator workflow reports.
E. Paper Builder core: paper header, live totals, sections, normal/subquestions, internal-choice/attempt-any-N logic, bank insertion, autosave.
F. Paper Health, blueprint, quality contribution layer and mature exports/official templates.

## Safety / architecture rules
- Do not weaken Firestore rules for UI convenience.
- Keep one canonical question record; views/routing should not duplicate question documents unnecessarily.
- Imported questions remain Pending Verification until coordinator action.
- Preserve original and audit trail through correction/verification.
- AI/wording help is opt-in and teacher-approved.
- Production changes should be surgical and tested; avoid rewriting unrelated stable VKVTT modules.
