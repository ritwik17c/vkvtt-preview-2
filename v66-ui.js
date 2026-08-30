/* VKV Nalbari · Version 66.0 shared interface enhancements */
(function () {
  'use strict';

  document.documentElement.classList.add('v66-ui');

  const ICONS = {
    home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    building: '<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-4h6v4"/><path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 6.5A2.5 2.5 0 0 1 6.5 9H20"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    board: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21l4-4 4 4M7 9h4M7 12h7"/>',
    pencil: '<path d="m4 20 4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    swap: '<path d="m17 3 4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.06l2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15.03 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.62.65 1.03 1.52 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 21h14"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M8 15h8"/>',
    arrow: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };

  function iconName(text) {
    const t = String(text || '').toLowerCase();
    if (/return|back|home|reset/.test(t)) return 'home';
    if (/calendar|date|day wise|annual/.test(t)) return 'calendar';
    if (/bell|announcement|notice/.test(t)) return 'bell';
    if (/history|past|schedule|period|time/.test(t)) return 'clock';
    if (/teacher|staff|member|proxy|supervision/.test(t)) return /proxy|supervision/.test(t) ? 'swap' : 'people';
    if (/class|section|room|venue|school/.test(t)) return 'building';
    if (/studio|generate|candidate/.test(t)) return 'board';
    if (/timetable|subject|workload/.test(t)) return 'book';
    if (/leave|assignment|record|document/.test(t)) return 'file';
    if (/attendance|geofence|where now|location|on duty/.test(t)) return 'pin';
    if (/integrity|verify|approved|security/.test(t)) return 'shield';
    if (/admin|setting|configuration|manage/.test(t)) return 'settings';
    if (/access|role|account|sign in|profile/.test(t)) return 'lock';
    if (/overview|summary|report|metric/.test(t)) return 'chart';
    if (/export|download|share|print/.test(t)) return 'download';
    if (/import|upload|restore/.test(t)) return 'upload';
    if (/backup|database|cloud|sync/.test(t)) return 'database';
    if (/edit|correction|update|master/.test(t)) return 'edit';
    if (/write|allocation|lesson/.test(t)) return 'pencil';
    if (/test|mock|trial/.test(t)) return 'flask';
    if (/save|finali[sz]e|accept|working/.test(t)) return 'check';
    if (/user|my /.test(t)) return 'user';
    return 'dots';
  }

  function makeIcon(name) {
    const span = document.createElement('span');
    span.className = 'v66-icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24">' + (ICONS[name] || ICONS.dots) + '</svg>';
    return span;
  }

  function firstTextNode(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) { return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; }
    });
    return walker.nextNode();
  }

  function replaceLeadingEmoji(target) {
    if (!target || target.querySelector(':scope > .v66-icon')) return;
    const node = firstTextNode(target);
    if (!node) return;
    const original = node.nodeValue;
    const cleaned = original.replace(/^\s*(?:(?:\p{Extended_Pictographic}|[←↻↩︎↪︎✦✓✕＋])(?:\uFE0F|\u200D|\p{Emoji_Modifier})*\s*)+/u, '');
    if (cleaned === original) return;
    node.nodeValue = cleaned;
    const host = node.parentElement || target;
    host.insertBefore(makeIcon(iconName(target.textContent)), node);
  }

  function setLoadingState(el) {
    if (!el) return;
    const loading = /checking|loading|connecting|please wait|verifying|preparing/i.test(el.textContent || '');
    el.classList.toggle('is-loading', loading);
    if (loading) el.setAttribute('aria-busy', 'true');
    else el.removeAttribute('aria-busy');
  }

  function schoolIllustration() {
    return '<svg class="v66-school-illustration" viewBox="0 0 460 142" role="img" aria-label="Line illustration of a school, timetable, clock and open book">' +
      '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14 119h430" opacity=".32"/>' +
      '<path class="v66-soft-fill" d="M31 119V58h118v61M21 58l69-41 69 41M63 119V91h54v28"/>' +
      '<path d="M31 119V58h118v61M21 58l69-41 69 41M63 119V91h54v28M52 70h17v16H52zM111 70h17v16h-17z"/>' +
      '<path class="v66-gold-line" d="M90 17v19M80 27h20"/>' +
      '<rect class="v66-soft-fill" x="190" y="30" width="105" height="77" rx="5"/>' +
      '<path d="M190 30h105v77H190zM205 49h75M205 66h75M205 83h75M225 30v77M258 30v77"/>' +
      '<circle class="v66-gold-fill" cx="349" cy="59" r="31"/><circle cx="349" cy="59" r="31"/><path class="v66-gold-line" d="M349 42v18l13 8"/>' +
      '<path class="v66-gold-fill" d="M372 101c17-10 34-10 51 0v25c-17-10-34-10-51 0-17-10-34-10-51 0v-25c17-10 34-10 51 0Z"/>' +
      '<path d="M372 101c17-10 34-10 51 0v25c-17-10-34-10-51 0-17-10-34-10-51 0v-25c17-10 34-10 51 0ZM372 101v25"/>' +
      '</g></svg>';
  }

  function addSchoolRibbon(file) {
    if (!['index', 'admin-dashboard'].includes(file) || document.querySelector('.v66-school-ribbon')) return;
    const ribbon = document.createElement('section');
    ribbon.className = 'v66-school-ribbon';
    const admin = file === 'admin-dashboard';
    ribbon.innerHTML = '<div class="v66-school-copy"><div class="v66-eyebrow">Vivekananda Kendra Vidyalaya, Nalbari</div>' +
      '<strong>' + (admin ? 'School Administration Workspace' : 'School Day Operations') + '</strong>' +
      '<p>' + (admin ? 'Timetable, classes, staff, attendance and academic records in one organised workspace.' : 'Timetables, classes, teachers, leave and daily school coordination at a glance.') + '</p></div>' + schoolIllustration();
    if (admin) {
      const host = document.getElementById('dashboardHome');
      const anchor = document.getElementById('activeScheduleStatus');
      if (host) host.insertBefore(ribbon, anchor || host.firstChild);
    } else {
      const anchor = document.getElementById('activeScheduleBanner');
      if (anchor?.parentElement) anchor.insertAdjacentElement('afterend', ribbon);
      else document.querySelector('main')?.prepend(ribbon);
    }
  }

  function enhance() {
    const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index';
    document.body.dataset.page = file;
    document.body.classList.add('v66-school-context');

    const pageHeading = document.querySelector('body > header:not(.topbar) h1');
    if (pageHeading && !pageHeading.parentElement.querySelector('.v66-eyebrow')) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'v66-eyebrow';
      eyebrow.textContent = file.startsWith('admin-') ? 'Administration workspace' : (file === 'attendance' ? 'Staff self-service' : 'School operations');
      pageHeading.parentElement.insertBefore(eyebrow, pageHeading);
    }

    const main = document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main-content';
      const skip = document.createElement('a');
      skip.className = 'v66-skip-link';
      skip.href = '#' + main.id;
      skip.textContent = 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    document.querySelectorAll('button, a.btn, .tile b, .myAreaTitle, .opsTitle').forEach(replaceLeadingEmoji);

    document.querySelectorAll('.tile').forEach(tile => {
      if (tile.tabIndex < 0) tile.tabIndex = 0;
      if (!tile.hasAttribute('role')) tile.setAttribute('role', 'button');
      tile.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          tile.click();
        }
      });
      if (!tile.querySelector('.v66-tile-motif')) {
        const motif = makeIcon(iconName(tile.textContent));
        motif.classList.add('v66-tile-motif');
        tile.appendChild(motif);
      }
    });

    addSchoolRibbon(file);

    document.querySelectorAll('button').forEach(button => {
      if (/delete|remove|archive/i.test(button.textContent || '')) button.dataset.tone = 'destructive';
    });

    const liveRegions = document.querySelectorAll('.status, [id$="Msg"], [id$="Message"], [id$="Status"]');
    liveRegions.forEach(el => {
      if (!el.hasAttribute('aria-live')) el.setAttribute('aria-live', 'polite');
      setLoadingState(el);
    });
    const observer = new MutationObserver(records => {
      records.forEach(record => setLoadingState(record.target.nodeType === 1 ? record.target : record.target.parentElement));
    });
    liveRegions.forEach(el => observer.observe(el, { childList: true, characterData: true, subtree: true }));

    if (!document.querySelector('.v66-product-footer')) {
      const footer = document.createElement('footer');
      footer.className = 'v66-product-footer';
      footer.textContent = 'VKV Nalbari · Secure school operations workspace · Version 66.0';
      document.body.appendChild(footer);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();
}());
\n\n/* v66.2 delayed Swamiji loader */\n(function(){\n  function build(){\n    if(document.getElementById('vkvSwamijiLoader'))return;\n    const box=document.createElement('div');box.id='vkvSwamijiLoader';box.setAttribute('aria-live','polite');box.setAttribute('aria-hidden','true');\n    box.innerHTML='<div class="vkvLoaderCard"><img src="swamiji-loader.svg?v=66.2" alt=""><div class="vkvLoaderText">Loading school workspace…</div></div>';\n    document.body.appendChild(box);\n    if(!document.getElementById('vkvSwamijiLoaderStyle')){const st=document.createElement('style');st.id='vkvSwamijiLoaderStyle';st.textContent='#vkvSwamijiLoader{position:fixed;inset:0;z-index:99999;display:none;place-items:center;background:rgba(246,250,248,.72);backdrop-filter:blur(1.5px);pointer-events:none}#vkvSwamijiLoader.show{display:grid}.vkvLoaderCard{width:min(190px,44vw);padding:14px 14px 12px;border:1px solid #d7c28e;border-radius:22px;background:#fbfaf6;box-shadow:0 12px 34px rgba(14,48,70,.13);text-align:center}.vkvLoaderCard img{display:block;width:100%;height:auto;max-height:150px;object-fit:contain}.vkvLoaderText{margin-top:-4px;font-size:.82rem;font-weight:750;color:#31526a;letter-spacing:.02em}';document.head.appendChild(st)}\n  }\n  let manual=0,busySince=0;\n  const get=()=>document.getElementById('vkvSwamijiLoader');\n  function show(text){build();manual++;const e=get();if(text){const t=e.querySelector('.vkvLoaderText');if(t)t.textContent=text}e.classList.add('show');e.setAttribute('aria-hidden','false')}\n  function hide(force){manual=force?0:Math.max(0,manual-1);if(manual)return;const e=get();if(e){e.classList.remove('show');e.setAttribute('aria-hidden','true')}}\n  function visible(el){if(!el||el.hidden)return false;const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&cs.opacity!=='0'}\n  function autoBusy(){\n    const candidates=['authMessage','gateMsg','activeScheduleStatus','activeScheduleBanner'].map(id=>document.getElementById(id)).filter(Boolean);\n    return candidates.some(el=>visible(el)&&/(checking|verifying|loading|connecting|opening|please wait)/i.test(String(el.textContent||'')));\n  }\n  function tick(){if(manual)return;const b=autoBusy(),now=Date.now();if(b){if(!busySince)busySince=now;if(now-busySince>650){build();const e=get();e.classList.add('show');e.setAttribute('aria-hidden','false')}}else{busySince=0;const e=get();if(e){e.classList.remove('show');e.setAttribute('aria-hidden','true')}}}\n  window.VKVLoader={show,hide:()=>hide(false),forceHide:()=>hide(true)};\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();\n  setInterval(tick,240);\n})();\n

/* v66.2 preview correction batch: navigation, alignment and tool hierarchy */
(function(){
  function navBtn(label,href){const a=document.createElement('a');a.className='btn v66-return-btn';a.href=href;a.textContent=label;return a}
  function addReturnNav(){
    const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(file==='index.html'||file==='')return;
    const main=document.querySelector('main');if(!main||document.getElementById('v66ReturnNav'))return;
    const admin=file.startsWith('admin-'),box=document.createElement('div');box.id='v66ReturnNav';box.className='v66-return-nav';
    const parentMap={
      'admin-biometric-import.html':['← Attendance Administration','admin-attendance.html?v=66.2'],
      'admin-attendance-tests.html':['← Attendance Administration','admin-attendance.html?v=66.2'],
      'admin-leave-editor.html':['← Approved Leave','admin-leave.html?v=66.2'],
      'admin-leave-import.html':['← Approved Leave','admin-leave.html?v=66.2'],
      'admin-leave-rules.html':['← Leave Administration','admin-leave.html?v=66.2'],
      'admin-schedules.html':['← Admin Dashboard','admin-dashboard.html?v=66.2'],
      'admin-timetable-studio.html':['← Admin Dashboard','admin-dashboard.html?v=66.2']
    };
    const p=parentMap[file];if(p)box.appendChild(navBtn(p[0],p[1]));
    if(admin&&!box.querySelector('[href^="admin-dashboard"]'))box.appendChild(navBtn('⌂ Admin Dashboard','admin-dashboard.html?v=66.2'));
    box.appendChild(navBtn('▦ Timetable Home','index.html?v=66.2'));
    main.prepend(box);
  }
  function moveIntegrityCard(){
    if(!/admin-leave-editor\.html$/i.test(location.pathname))return;
    const cards=[...document.querySelectorAll('#app > section.card, #app > .card')];
    const recon=cards.find(x=>/Leave Reconciliation Control/i.test(x.textContent||''));
    const integrity=cards.find(x=>/Leave Integrity Checker\s*&\s*Duplicate Remover/i.test(x.textContent||''));
    if(recon&&integrity&&recon.nextElementSibling!==integrity)recon.insertAdjacentElement('afterend',integrity);
  }
  function style(){if(document.getElementById('v66CorrectionStyle'))return;const st=document.createElement('style');st.id='v66CorrectionStyle';st.textContent=`
    .v66-return-nav{max-width:1320px;margin:0 auto 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .v66-return-nav .v66-return-btn{display:inline-flex;align-items:center;text-decoration:none}
    @media(min-width:1100px){body.v66-school-context main,.v66-school-context .wrap,.v66-school-context .cloudInner{max-width:1320px!important}}
    @media(max-width:1099px){.v66-return-nav{padding-left:2px;padding-right:2px}}
  `;document.head.appendChild(st)}
  function run(){style();addReturnNav();moveIntegrityCard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
