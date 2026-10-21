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
  html[data-vkv-theme="black-gold"] #monthView,html[data-vkv-theme="black-gold"] #monthView .calendar-grid{background:#0c1720!important;color:#f6f2e8!important;border-color:#496675!important}
  html[data-vkv-theme="black-gold"] #monthView .month-controls{background:#152630!important;border-color:#496675!important}
  html[data-vkv-theme="black-gold"] #monthView .month-controls h2{color:#fff7dc!important}
  html[data-vkv-theme="black-gold"] #monthView .dow{background:#1b3644!important;color:#f2c335!important;border-color:#496675!important}
  html[data-vkv-theme="black-gold"] #monthView .day-cell{background:#152630!important;color:#f6f2e8!important;border-color:#34505d!important}
  html[data-vkv-theme="black-gold"] #monthView .day-cell.outside{background:#0d1b24!important;color:#91a6b0!important}
  html[data-vkv-theme="black-gold"] #monthView .day-cell.today{background:#203a47!important;box-shadow:inset 0 0 0 2px #f2c335!important}
  html[data-vkv-theme="black-gold"] #monthView .day-num{color:#fff7dc!important}
  html[data-vkv-theme="black-gold"] #monthView .cal-event{background:color-mix(in srgb,var(--event-color) 24%,#152630)!important;color:#fff!important;border-color:var(--event-color)!important}
  html[data-vkv-theme="black-gold"] #monthView .cal-cont{background:color-mix(in srgb,var(--event-color) 58%,#1b303b)!important}
  html[data-vkv-theme="black-gold"] .notice-card,html[data-vkv-theme="black-gold"] .notice-card *,html[data-vkv-theme="black-gold"] .hero-chip{color:#f6f2e8!important}
  html[data-vkv-theme="light"] .notice-card,html[data-vkv-theme="light"] .notice-card *{color:#334b5d!important}
  html[data-vkv-theme="light"] .tab-btn.active,html[data-vkv-theme="light"] .tab-btn.active:hover,html[data-vkv-theme="light"] .tab-btn.active:active{background:#236d99!important;color:#fff!important;border-color:#236d99!important}
  html[data-vkv-theme="black-gold"] .tab-btn.active,html[data-vkv-theme="black-gold"] .tab-btn.active:hover,html[data-vkv-theme="black-gold"] .tab-btn.active:active{background:#f2c335!important;color:#15130b!important;border-color:#f2c335!important}
  html[data-vkv-theme] .filter-chip.active,html[data-vkv-theme] .filter-chip.active:hover,html[data-vkv-theme] .filter-chip.active:active{color:#fff!important;border-color:transparent!important}
  html[data-vkv-theme="light"] .filter-chip[data-cat="all"].active{background:#236d99!important}
  html[data-vkv-theme="black-gold"] .filter-chip[data-cat="all"].active{background:#f2c335!important;color:#15130b!important}
  html[data-vkv-theme] .filter-chip[data-cat="programme"].active{background:#3559a8!important}
  html[data-vkv-theme] .filter-chip[data-cat="exam"].active{background:#7b4bb7!important}
  html[data-vkv-theme] .filter-chip[data-cat="holiday"].active{background:#bd3d4a!important}
  html[data-vkv-theme] .filter-chip[data-cat="celebration"].active{background:#d87813!important;color:#0c1720!important}
  html[data-vkv-theme] .filter-chip[data-cat="observance"].active{background:#237a62!important}
  html[data-vkv-theme] .filter-chip[data-cat="restricted"].active{background:#8b6e3f!important}
  html[data-vkv-theme] .filter-chip[data-cat="session"].active{background:#306d9a!important}
  @media screen{
    html[data-vkv-theme="black-gold"] .toolbar,
    html[data-vkv-theme="black-gold"] .search{
      background:rgba(21,38,48,.94)!important;color:#f6f2e8!important;border-color:#496675!important;
    }
    html[data-vkv-theme="black-gold"] .stat,
    html[data-vkv-theme="black-gold"] .notice-card,
    html[data-vkv-theme="black-gold"] .event-card,
    html[data-vkv-theme="black-gold"] .day-card,
    html[data-vkv-theme="black-gold"] .modal-card,
    html[data-vkv-theme="black-gold"] .access-gate{
      background:#152630!important;color:#f6f2e8!important;border-color:#42606f!important;
    }
    html[data-vkv-theme="black-gold"] .event-card:hover,
    html[data-vkv-theme="black-gold"] .day-card:hover{background:#1b303b!important;border-color:#607985!important}
    html[data-vkv-theme="black-gold"] :is(.stat b,.month-title h2,.date-main,.event-card h3,.day-head h2,.day-card h3,.modal h2,.access-gate h1){color:#fff7dc!important}
    html[data-vkv-theme="black-gold"] :is(.stat span,.date-sub,.event-details,.day-card p,.modal-body,.access-gate p,.footer,.more){color:#a8bdc8!important}
    html[data-vkv-theme="black-gold"] .month-title .count,
    html[data-vkv-theme="black-gold"] .meta-pill{background:#1b303b!important;color:#c3d2d9!important;border-color:#496675!important}
    html[data-vkv-theme="black-gold"] .source-alert{background:#392f16!important;color:#f2d88a!important;border-color:#725d25!important}
    html[data-vkv-theme="black-gold"] .rail:before{background:#34505d!important}
    html[data-vkv-theme="black-gold"] .rail:after{box-shadow:0 0 0 4px #152630,0 0 0 5px #607985!important}
  }
  @media(max-width:900px){#monthView .day-cell{min-height:112px!important}}
  @media(max-width:620px){#monthView .day-cell{min-width:82px!important;min-height:104px!important}#monthView .dow{min-width:82px!important}}
  `;document.head.appendChild(st);
  function showMonth(){const b=document.querySelector('.tab-btn[data-view="month"]');if(b&&!b.classList.contains('active'))b.click()}
  function start(){let tries=0;const t=setInterval(()=>{const shell=document.getElementById('calendarShell'),grid=document.getElementById('monthGrid');if(shell&&grid&&getComputedStyle(shell).display!=='none'){showMonth();clearInterval(t)}else if(++tries>80)clearInterval(t)},150)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
