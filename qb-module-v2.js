if(!document.querySelector('link[data-vkv-black-gold-theme]')){
  const theme=document.createElement('link');
  theme.rel='stylesheet';
  theme.href='vkv-black-gold-screen.css?v=20260908-theme-1';
  theme.dataset.vkvBlackGoldTheme='1';
  document.head.appendChild(theme);
}
import './qb-module-v3.js?v=20260908-p2-qb-sync-1';
import './vkv-qb-dictation.js?v=20260902-language-safe-review-1';
import './vkv-qb-history-enhancement.js?v=20260830-unverified-2';
import './vkv-qb-imported-history-bridge.js?v=20260902-complete-legacy-history-1';
import './vkv-qb-coordinator-ui.js?v=20260903-resubmitted-queue-1';
import './vkv-qb-coordinator-feedback-bridge.js?v=20260831-feedback-1';
import './vkv-qb-submission-readiness.js?v=20260902-local-draft-recovery-1';
import './vkv-qb-paper-scoring.js?v=20260908-p2-qb-sync-1';
import './vkv-qb-paper-builder-shell.js?v=20260901-e5-1';
import './vkv-qb-verified-bank-picker.js?v=20260831-e5-myverified-1';
import './vkv-qb-paper-preview.js?v=20260901-e5-1';
import './vkv-qb-paper-structure.js?v=20260901-e5-1';
import './vkv-qb-paper-question-counts.js?v=20260902-section-target-balance-1';
import './vkv-qb-paper-health.js?v=20260901-e5-6';
import './vkv-qb-paper-checkpoint.js?v=20260831-e4-7';
import './vkv-qb-paper-subquestion-drafting.js?v=20260831-e4-8';
import './vkv-qb-paper-subquestion-marks.js?v=20260908-p2-qb-sync-1';
import './vkv-qb-callouts-sound.js?v=20260830-1';
import './vkv-qb-smart-defaults.js?v=20260902-safe-restore-1';
import './vkv-qb-teacher-bulk-import.js?v=20260903-mark-aware-dedup-1';
