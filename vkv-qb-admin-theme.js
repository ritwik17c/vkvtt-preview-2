(()=>{
  const KEY='vkvtt-qb-admin-theme',root=document.documentElement;
  const css=`
html[data-qb-theme="light"]{color-scheme:light}
html[data-qb-theme="light"] body{background:#edf6f1!important;color:#263d4e!important}
html[data-qb-theme="light"] body>header{background:#1d638e!important;color:#fff!important}
html[data-qb-theme="light"] body h1,html[data-qb-theme="light"] body h2,html[data-qb-theme="light"] body h3,html[data-qb-theme="light"] body h4,html[data-qb-theme="light"] body strong{color:#17364f!important}
html[data-qb-theme="light"] header h1,html[data-qb-theme="light"] header h2,html[data-qb-theme="light"] header strong{color:#fff!important}
html[data-qb-theme="light"] .card,html[data-qb-theme="light"] .panel{background:#fff!important;color:#263d4e!important;border-color:#cbdce5!important;box-shadow:0 4px 16px #17324d0d!important}
html[data-qb-theme="light"] .metric,html[data-qb-theme="light"] .qcard,html[data-qb-theme="light"] .leader,html[data-qb-theme="light"] .empty{background:#f8fbfc!important;color:#263d4e!important;border-color:#dbe6eb!important}
html[data-qb-theme="light"] .leader *,html[data-qb-theme="light"] .qcard *{text-shadow:none!important}
html[data-qb-theme="light"] .leader b,html[data-qb-theme="light"] .leader strong,html[data-qb-theme="light"] .qcard b,html[data-qb-theme="light"] .qcard strong{color:#17364f!important}
html[data-qb-theme="light"] .small,html[data-qb-theme="light"] .sub,html[data-qb-theme="light"] .lab,html[data-qb-theme="light"] label{color:#617685!important}
html[data-qb-theme="light"] .leader .small,html[data-qb-theme="light"] .qcard .small{color:#5f6f79!important}
html[data-qb-theme="light"] input,html[data-qb-theme="light"] select,html[data-qb-theme="light"] textarea{background:#fbfefd!important;color:#263d4e!important;border-color:#c6d7e0!important}
html[data-qb-theme="light"] option{background:#fff!important;color:#263d4e!important}
html[data-qb-theme="light"] .btn,html[data-qb-theme="light"] button{background:#e7f2f7!important;color:#17364f!important;border-color:#b9ced9!important}
html[data-qb-theme="light"] .btn:hover,html[data-qb-theme="light"] button:hover{background:#d7eaf3!important;color:#17364f!important;border-color:#82a9bd!important}
html[data-qb-theme="light"] .btn:active,html[data-qb-theme="light"] button:active{background:#c8e0ec!important;color:#102f47!important;border-color:#5489a3!important}
html[data-qb-theme="light"] .primary,html[data-qb-theme="light"] .tabs button.active{background:#236d99!important;color:#fff!important;border-color:#236d99!important}
html[data-qb-theme="light"] .primary:hover,html[data-qb-theme="light"] .tabs button.active:hover{background:#1c5d85!important;color:#fff!important;border-color:#1c5d85!important}
html[data-qb-theme="light"] .primary:active,html[data-qb-theme="light"] .tabs button.active:active{background:#164e72!important;color:#fff!important;border-color:#164e72!important}
html[data-qb-theme="light"] .green{background:#e7f6ea!important;color:#245c34!important}
html[data-qb-theme="light"] .danger{background:#fdecec!important;color:#8b2d2d!important}
html[data-qb-theme="light"] .tip{background:#eef7fb!important;border-color:#bfdae7!important;color:#345d73!important}
html[data-qb-theme="light"] .warn{background:#fff7df!important;border-color:#e5cd8c!important;color:#745917!important}
html[data-qb-theme="light"] .badge{background:#eaf3f7!important;color:#17364f!important;border-color:#cbdce5!important}
html[data-qb-theme="light"] .rank,html[data-qb-theme="light"] .num,html[data-qb-theme="light"] .qtext{color:#236d99!important}
html[data-qb-theme="light"] table{background:#fff!important;color:#263d4e!important}
html[data-qb-theme="light"] th{background:#edf5f9!important;color:#17364f!important;border-color:#dfe8ed!important}
html[data-qb-theme="light"] td{background:#fff!important;color:#263d4e!important;border-color:#dfe8ed!important}
html[data-qb-theme="light"] tr:hover td{background:#f7fafb!important}
html[data-qb-theme="light"] a,html[data-qb-theme="light"] a:visited{color:#1d638e!important}
html[data-qb-theme="light"] a.btn,html[data-qb-theme="light"] a.btn:visited{color:#17364f!important}
html[data-qb-theme="light"] a.primary,html[data-qb-theme="light"] a.primary:visited{color:#fff!important}
html[data-qb-theme="light"] a.green,html[data-qb-theme="light"] a.green:visited{color:#245c34!important}
html[data-qb-theme="light"] a.danger,html[data-qb-theme="light"] a.danger:visited{color:#8b2d2d!important}
html[data-qb-theme="light"] header a,html[data-qb-theme="light"] header .btn{color:#17364f!important}
html[data-qb-theme="light"] :is(a,button,input,select,textarea,summary):focus-visible{outline:3px solid #b45309!important;outline-offset:2px!important}
html[data-qb-theme="light"] :is(button,.btn,input,select,textarea):disabled{background:#e8eef1!important;color:#596d79!important;border-color:#bdcbd2!important;cursor:not-allowed!important;opacity:1!important;transform:none!important;filter:none!important}
html[data-qb-theme="dark"]{color-scheme:dark}
html[data-qb-theme="dark"] body{background:#0c1720!important;color:#e7edf0!important}
html[data-qb-theme="dark"] .card,html[data-qb-theme="dark"] .panel{background:#152630!important;color:#e7edf0!important;border-color:#3d5967!important;box-shadow:0 4px 16px #07101866!important}
html[data-qb-theme="dark"] .metric,html[data-qb-theme="dark"] .qcard,html[data-qb-theme="dark"] .leader,html[data-qb-theme="dark"] .empty{background:#10212b!important;border-color:#3d5967!important;color:#e7edf0!important}
html[data-qb-theme="dark"] .small,html[data-qb-theme="dark"] .sub,html[data-qb-theme="dark"] .lab,html[data-qb-theme="dark"] label{color:#b8c8d1!important}
html[data-qb-theme="dark"] input,html[data-qb-theme="dark"] select,html[data-qb-theme="dark"] textarea{background:#0f202a!important;color:#f2f6f8!important;border-color:#547180!important}
html[data-qb-theme="dark"] option{background:#152630!important;color:#f2f6f8!important}
html[data-qb-theme="dark"] .btn,html[data-qb-theme="dark"] button{background:#203744!important;color:#f2f6f8!important;border-color:#547180!important}
html[data-qb-theme="dark"] .btn:hover,html[data-qb-theme="dark"] button:hover{background:#294654!important;color:#fff!important;border-color:#7693a1!important}
html[data-qb-theme="dark"] .btn:active,html[data-qb-theme="dark"] button:active{background:#345766!important;color:#fff!important;border-color:#91abb7!important}
html[data-qb-theme="dark"] .primary,html[data-qb-theme="dark"] .tabs button.active{background:#2b739f!important;color:#fff!important;border-color:#5da4cb!important}
html[data-qb-theme="dark"] .primary:hover,html[data-qb-theme="dark"] .tabs button.active:hover{background:#24638a!important;color:#fff!important;border-color:#72b5da!important}
html[data-qb-theme="dark"] .primary:active,html[data-qb-theme="dark"] .tabs button.active:active{background:#1e5679!important;color:#fff!important;border-color:#72b5da!important}
html[data-qb-theme="dark"] .green{background:#244d35!important;color:#dff5e7!important}
html[data-qb-theme="dark"] .danger{background:#4a262b!important;color:#ffd9de!important}
html[data-qb-theme="dark"] .tip{background:#18303c!important;border-color:#446575!important;color:#d6e8f0!important}
html[data-qb-theme="dark"] .warn{background:#3a301c!important;border-color:#6b5a2b!important;color:#f1dfaa!important}
html[data-qb-theme="dark"] .badge{background:#223746!important;color:#dceaf1!important}
html[data-qb-theme="dark"] table{background:#152630!important;color:#e7edf0!important}
html[data-qb-theme="dark"] th{background:#203744!important;color:#f2f6f8!important}
html[data-qb-theme="dark"] td{background:#152630!important;color:#e7edf0!important}
html[data-qb-theme="dark"] td,html[data-qb-theme="dark"] th{border-color:#466270!important}
html[data-qb-theme="dark"] tr:hover td{background:#1d3440!important;color:#fff!important}
html[data-qb-theme="dark"] .qtext,html[data-qb-theme="dark"] .rank,html[data-qb-theme="dark"] .num{color:#8fd2f5!important}
html[data-qb-theme="dark"] a,html[data-qb-theme="dark"] a:visited{color:#8fd2f5!important}
html[data-qb-theme="dark"] a.btn,html[data-qb-theme="dark"] a.btn:visited,html[data-qb-theme="dark"] a.primary,html[data-qb-theme="dark"] a.primary:visited{color:#fff!important}
html[data-qb-theme="dark"] a.green,html[data-qb-theme="dark"] a.green:visited{color:#dff5e7!important}
html[data-qb-theme="dark"] a.danger,html[data-qb-theme="dark"] a.danger:visited{color:#ffd9de!important}
html[data-qb-theme="dark"] header a,html[data-qb-theme="dark"] header a:visited{color:#f2f6f8!important}
html[data-qb-theme="dark"] details{background:#152630!important;color:#e7edf0!important;border-color:#466270!important}
html[data-qb-theme="dark"] details summary{color:#f2f6f8!important}
html[data-qb-theme="dark"] #qbMultiSubjects label{background:#10212b!important;color:#e7edf0!important;border-color:#466270!important}
html[data-qb-theme] input[type="checkbox"],html[data-qb-theme] input[type="radio"]{accent-color:#2f7fae}
html[data-qb-theme="dark"] :is(a,button,input,select,textarea,summary):focus-visible{outline:3px solid #f2c335!important;outline-offset:2px!important}
html[data-qb-theme="dark"] :is(button,.btn,input,select,textarea):disabled{background:#263944!important;color:#9fb0b9!important;border-color:#485f6b!important;cursor:not-allowed!important;opacity:1!important;transform:none!important;filter:none!important}
#qbThemeToggle{min-width:98px}`;
  function installCss(){if(document.getElementById('qbThemeStyles'))return;const s=document.createElement('style');s.id='qbThemeStyles';s.textContent=css;document.head.appendChild(s)}
  function systemDark(){return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches}
  function current(){const saved=localStorage.getItem(KEY);return saved==='dark'||saved==='light'?saved:(systemDark()?'dark':'light')}
  function apply(theme){root.dataset.qbTheme=theme;localStorage.setItem(KEY,theme);const b=document.getElementById('qbThemeToggle');if(b){b.textContent=theme==='dark'?'☀️ Light':'🌙 Dark';b.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');b.title=b.getAttribute('aria-label')}}
  function inject(){installCss();if(document.getElementById('qbThemeToggle'))return;const host=document.querySelector('header .actions');if(!host)return;const b=document.createElement('button');b.type='button';b.id='qbThemeToggle';b.className='btn';b.style.width='auto';b.addEventListener('click',()=>apply(root.dataset.qbTheme==='dark'?'light':'dark'));host.prepend(b);apply(current())}
  installCss();apply(current());if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
})();
