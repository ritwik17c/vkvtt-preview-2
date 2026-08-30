/* VKVTT v66.6.5 — premium shell + authoritative one-time staff identity */
(function(){
  'use strict';
  const portraitUrl='./Swami%20Vivekananda.png?v=swamiji-live-1';
  function applyPortrait(){
    const isMobile=window.matchMedia('(max-width:700px)').matches;
    const p=document.querySelector('.swamijiHomePortrait');
    if(p){
      p.src=portraitUrl;p.removeAttribute('srcset');const host=p.closest('.head')||p.parentElement;
      if(host){host.style.position='relative';host.style.setProperty('padding-right',isMobile?'86px':'132px','important');}
      p.style.setProperty('position','absolute','important');p.style.setProperty('right','0','important');p.style.setProperty('top','50%','important');p.style.setProperty('transform','translateY(-50%)','important');p.style.setProperty('margin','0','important');p.style.setProperty('width',isMobile?'68px':'108px','important');p.style.setProperty('height',isMobile?'68px':'108px','important');p.style.setProperty('object-fit','contain','important');p.style.setProperty('z-index','1','important');
      const title=document.querySelector('.homeTitleBlock');if(title){title.style.setProperty('position','relative','important');title.style.setProperty('z-index','2','important');title.style.setProperty('max-width',isMobile?'calc(100% - 92px)':'calc(100% - 170px)','important');if(isMobile)title.style.setProperty('padding-right','78px','important');}
    }
    const lp=document.querySelector('#vkvSlowLoader .vkvLoaderPortrait img');if(lp){lp.src=portraitUrl;lp.removeAttribute('srcset');}
  }
  function tileHost(el){return el&&el.closest&&el.closest('.myGrid>button,.nav>button,.opsGrid>button')}
  document.addEventListener('click',e=>{const b=tileHost(e.target);if(!b)return;b.classList.remove('v662-click-nudge');void b.offsetWidth;b.classList.add('v662-click-nudge');setTimeout(()=>b.classList.remove('v662-click-nudge'),220)},true);
  function loadStaffOnce(){if(document.getElementById('v666StaffIdentityOnce'))return;const s=document.createElement('script');s.id='v666StaffIdentityOnce';s.src='v66-staff-identity-once.js?v=66.6.5-canonical-link';s.defer=true;document.body.appendChild(s);}
  function isLinkedTeachingStaff(){
    const code=String(window.__vkvMyTeacherCode||'').trim();
    const role=String(window.__vkvRole||'').trim();
    if(!code||!window.DATA||role==='admin')return false;
    const teachers=Array.isArray(window.DATA.teachers)?window.DATA.teachers:[];
    return teachers.some(t=>t&&String(t.code)===code&&t.nonTeaching!==true&&t.active!==false);
  }
  function installQuestionBankTile(){
    const grid=document.getElementById('myAreaGrid');if(!grid)return;
    let tile=document.getElementById('myQuestionBankBtn');
    if(!tile){
      tile=document.createElement('button');tile.id='myQuestionBankBtn';tile.type='button';
      tile.innerHTML='📚 Question Bank &amp; Paper Builder <span id="myQbBadge" class="myBadge" style="display:none"></span>';
      tile.title='Add questions, see submission history, use the verified Question Bank and build question papers.';
      tile.addEventListener('click',()=>location.href='qb-module-v2.html?v=preview2-qb-2');
      grid.appendChild(tile);
    }
    tile.style.display=isLinkedTeachingStaff()?'':'none';
  }
  function init(){applyPortrait();setTimeout(installQuestionBankTile,1800);setTimeout(installQuestionBankTile,3200);setTimeout(installQuestionBankTile,5200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('resize',applyPortrait);
  window.addEventListener('focus',installQuestionBankTile);
  window.addEventListener('load',()=>{setTimeout(loadStaffOnce,1400);setTimeout(installQuestionBankTile,3800)},{once:true});
  setInterval(installQuestionBankTile,7000);
})();