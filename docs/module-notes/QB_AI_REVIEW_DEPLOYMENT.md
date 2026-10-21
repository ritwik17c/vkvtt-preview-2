# VKVTT Question Bank Deep AI Review — Deployment

This release keeps the OpenAI API key on the Firebase Functions server. Never place an API key in any HTML or browser JavaScript file.

## What is included
- `reviewQuestionWithAI`: Principal/Admin-only callable function for historical/manual review.
- `autoReviewSubmittedQuestion`: optional Firestore trigger for newly submitted QB questions.
- `admin-qb-ai-review.html`: Principal review console.
- `qbConfig/current.aiReviewModel`: `gpt-5.6-luna`, `gpt-5.6-terra` (default), or `gpt-5.6-sol`.
- `qbConfig/current.aiAutoReviewEnabled`: automatic future review switch; default/off unless explicitly enabled.

## One-time deployment
From the repository root with Firebase CLI authenticated to the correct school project:

```bash
cd functions
npm install
cd ..
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions:reviewQuestionWithAI,functions:autoReviewSubmittedQuestion
```

When prompted for `OPENAI_API_KEY`, paste the server API key. Do not commit it to GitHub.

## Safety model
- Callable function requires Firebase authentication and verifies `authorizedUsers/<uid>.role == admin` and `active == true`.
- Browser sends only the Question Bank document ID.
- Server fetches the actual question directly from Firestore before review.
- AI review is stored under `qbQuestions/<id>.aiQualityReview` and does not change `status`.
- A separate append-only operational record is written to `qbAiReviewAudit` by Admin SDK.
- Automatic review only runs when `qbConfig/current.aiAutoReviewEnabled == true`.
- Existing numerical and deterministic qualitative leaderboards are not changed by this deployment.

## Recommended rollout
1. Deploy functions with automatic review OFF.
2. Open `admin-qb-ai-review.html` as Principal.
3. Keep model on GPT-5.6 Terra initially.
4. Test 5–10 questions across different subjects/classes.
5. Compare AI findings with Subject Coordinator judgement.
6. Only then consider enabling automatic review for newly submitted questions.

## Limitation
The AI review can judge general factual/answer quality and pedagogical structure, but exact board/school syllabus alignment is only as reliable as the chapter/topic/learning-outcome context stored with the question. A later curriculum-reference layer can attach authoritative syllabus documents or curriculum maps for stronger syllabus-grounded review.
