/* Preview2: connect Staff Manager directory to Teacher Transfer without altering live master. */
(()=>{'use strict';
const CFG={apiKey:'AIzaSyDheZpyXghd1aQ9_RLhwpacVriG__wNZW4',authDomain:'vkv-nalbari-timetable.firebaseapp.com',projectId:'vkv-nalbari-timetable',storageBucket:'vkv-nalbari-timetable.firebasestorage.app',messagingSenderId:'791432856951',appId:'1:791432856951:web:61324065a54bef30f98d72'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let busy=false,lastPanel=null;
async function enhance(panel){
  if(!panel||panel===lastPanel||panel.dataset.staffSyncReady==='1'||busy)return;
  busy=true;
  try{
    const to=panel.querySelector('#ttTo');
    const details=panel.querySelector('details');
    const code=panel.querySelector('#ttNewCode');
    const name=panel.querySelector('#ttNewName');
    const add=panel.querySelector('#ttAddTeacher');
    if(!to||!details||!code||!name||!add)return;
    const A=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js');
    const F=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore-lite.js');
    const app=A.getApps().length?A.getApp():A.initializeApp(CFG),db=F.getFirestore(app);
    const snap=await F.getDoc(F.doc(db,'master','current'));
    if(!snap.exists())return;
    const raw=snap.data()||{},master=raw.data||raw;
    const directory=(Array.isArray(master.staffDirectory)?master.staffDirectory:[])
      .filter(r=>r&&r.active!==false&&String(r.category||'').toLowerCase()==='teaching')
      .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    const currentCodes=new Set([...to.options].map(o=>String(o.value||'').toUpperCase()).filter(Boolean));
    const available=directory.filter(r=>!currentCodes.has(String(r.shortCode||'').trim().toUpperCase()));

    const block=document.createElement('div');
    block.id='ttStaffManagerAdd';
    block.style.cssText='margin:12px 0;padding:12px;border:1px solid #b8cdd8;border-radius:12px;background:#f7fbfd';
    block.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><b>＋ Add Teacher</b><div style="font-size:.84rem;color:#617685">Choose an active teaching staff member already entered in Staff Manager.</div></div><button id="ttShowStaffAdd" type="button">＋ Add Teacher</button></div><div id="ttStaffPicker" style="display:none;margin-top:10px"><label>Teacher from Staff Manager</label><select id="ttStaffSelect"><option value="">Select teacher…</option>${directory.map((r,i)=>`<option value="${i}">${esc(r.name||'Unnamed')}${r.shortCode?` (${esc(r.shortCode)})`:' · short code needed'}</option>`).join('')}</select><div id="ttStaffNote" style="font-size:.82rem;color:#617685;margin-top:6px"></div><button id="ttUseStaff" type="button" style="margin-top:8px">Add to this Transfer Draft</button></div>`;
    details.parentNode.insertBefore(block,details);
    const show=block.querySelector('#ttShowStaffAdd'),picker=block.querySelector('#ttStaffPicker'),sel=block.querySelector('#ttStaffSelect'),note=block.querySelector('#ttStaffNote'),use=block.querySelector('#ttUseStaff');
    show.onclick=()=>{picker.style.display=picker.style.display==='none'?'block':'none'};
    sel.onchange=()=>{const r=directory[Number(sel.value)];if(!r){note.textContent='';return}note.textContent=r.shortCode?'This teacher already has a timetable short code in Staff Manager.':'No timetable short code is stored yet. Enter a unique short code below before adding.'};
    use.onclick=()=>{
      const r=directory[Number(sel.value)];if(!r)return alert('Select a teacher from Staff Manager.');
      details.open=true;
      name.value=String(r.name||'').trim();
      code.value=String(r.shortCode||'').trim().toUpperCase();
      if(!code.value){code.focus();alert('This teacher has no timetable short code yet. Enter a unique short code, then press “Add to this draft”.');details.scrollIntoView({behavior:'smooth',block:'center'});return}
      add.click();
      setTimeout(()=>{if([...to.options].some(o=>o.value===code.value)){to.value=code.value;to.dispatchEvent(new Event('change',{bubbles:true}))}},80);
    };
    if(!directory.length){block.querySelector('#ttStaffSelect').innerHTML='<option value="">No active teaching staff found</option>';use.disabled=true}
    panel.dataset.staffSyncReady='1';lastPanel=panel;
  }catch(e){console.warn('Preview2 transfer Staff Manager sync:',e)}finally{busy=false}
}
const observer=new MutationObserver(()=>enhance(document.getElementById('vkvTeacherTransferPanel')));observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>enhance(document.getElementById('vkvTeacherTransferPanel')),1000);
})();