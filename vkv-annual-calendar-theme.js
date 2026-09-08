/* Annual Calendar presentation bridge: prominent monthly grid + theme-safe contrast. */
(function(){
  'use strict';
  if(window.__VKV_ANNUAL_CAL_THEME__)return;window.__VKV_ANNUAL_CAL_THEME__=true;
  const st=document.createElement('style');st.id='vkvAnnualCalendarContrast';st.textContent=`
  #monthView{overflow:hidden!important}
  #monthView .calendar-grid{gap:0!important;padding:0!important;border-top:1px solid #b8c9d4!important;border-left:1px solid #b8c9d4!important}
  #monthView .dow{font-size:12px!important;font-weight:900!important;letter-spacing:.08em!important;padding:12px 6px!important;border-right:1px solid #c7d5de!important;border-bottom:1px solid #c7d5de!important}
  #monthView .day-cell{min-height:142px!important;border:0!important;border-right:1px solid #c7d5de!important;border-bottom:1px solid #c7d5de!important;padding:9px!important;overflow:hidden!important}
  #monthView .day-num{font-size:14px!important;font-weight:900!important}
  #monthView .cal-event{font-size:11px!important;line-height:1.25!important;padding:6px 7px!important;border-left-width:4px!important;box-shadow:none!important}
  html[data-vkv-theme="light"] #monthView,html[data-vkv-theme="light"] #monthView .calendar-grid{background:#fff!important;color:#17364f!important}
  html[data-vkv-theme="light"] #monthView .month-controls{background:#f7fafc!important;border-color:#b8c9d4!important}
  html[data-vkv-theme="light"] #monthView .dow{background:#edf5f9!important;color:#17364f!important}
  html[data-vkv-theme="light"] #monthView .day-cell{background:#fff!important;color:#17364f!important}
  html[data-vkv-theme="light"] #monthView .day-cell.outside{background:#f3f6f8!important;color:#72808d!important}
  html[data-vkv-theme="light"] #monthView .day-cell.today{background:#fff8e8!important;box-shadow:inset 0 0 0 2px #e9a925!important}
  html[data-vkv-theme="light"] #monthView .cal-event{background:color-mix(in srgb,var(--event-color) 13%,white)!important;color:#17364f!important;border-color:var(--event-color)!important}
  html[data-vkv-theme="light"] #monthView .cal-cont{background:color-mix(in srgb,var(--event-color) 42%,white)!important}
  html[data-vkv-theme="black-gold"] #monthView,html[data-vkv-theme="black-gold"] #monthView .calendar-grid{background:#111212!important;color:#f6f2e8!important;border-color:#655820!important}
  html[data-vkv-theme="black-gold"] #monthView .month-controls{background:#171817!important;border-color:#655820!important}
  html[data-vkv-theme="black-gold"] #monthView .month-controls h2{color:#fff7dc!important}
  html[data-vkv-theme="black-gold"] #monthView .dow{background:#1d1c17!important;color:#f2c335!important;border-color:#4b4430!important}
  html[data-vkv-theme="black-gold"] #monthView .day-cell{background:#121313!important;color:#f6f2e8!important;border-color:#3e3b32!important}
  html[data-vkv-theme="black-gold"] #monthView .day-cell.outside{background:#0d0e0e!important;color:#77736c!important}
  html[data-vkv-theme="black-gold"] #monthView .day-cell.today{background:#211d10!important;box-shadow:inset 0 0 0 2px #f2c335!important}
  html[data-vkv-theme="black-gold"] #monthView .day-num{color:#fff7dc!important}
  html[data-vkv-theme="black-gold"] #monthView .cal-event{background:color-mix(in srgb,var(--event-color) 24%,#121313)!important;color:#fff!important;border-color:var(--event-color)!important}
  html[data-vkv-theme="black-gold"] #monthView .cal-cont{background:color-mix(in srgb,var(--event-color) 58%,#171817)!important}
  html[data-vkv-theme="black-gold"] .notice-card,html[data-vkv-theme="black-gold"] .notice-card *,html[data-vkv-theme="black-gold"] .hero-chip{color:#f6f2e8!important}
  html[data-vkv-theme="light"] .notice-card,html[data-vkv-theme="light"] .notice-card *{color:#334b5d!important}
  @media(max-width:900px){#monthView .day-cell{min-height:112px!important}}
  @media(max-width:620px){#monthView .day-cell{min-width:82px!important;min-height:104px!important}#monthView .dow{min-width:82px!important}}
  `;document.head.appendChild(st);
  function showMonth(){const b=document.querySelector('.tab-btn[data-view="month"]');if(b&&!b.classList.contains('active'))b.click()}
  function start(){let tries=0;const t=setInterval(()=>{const shell=document.getElementById('calendarShell'),grid=document.getElementById('monthGrid');if(shell&&grid&&getComputedStyle(shell).display!=='none'){showMonth();clearInterval(t)}else if(++tries>80)clearInterval(t)},150)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
