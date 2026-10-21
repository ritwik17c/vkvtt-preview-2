import {deriveMasterVenues,logicalClassName,reconcileSeating,seatingSummary} from './exam-seating-core.js?v=20260914-manual-auto-mix-4';

const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const api=()=>window.vkvExamWorkspace;
const workspace=()=>api()?.getWorkspace?.();

function selectedClasses(ws){
  return [...new Set((ws?.papers||[]).filter(item=>item.included!==false).map(item=>logicalClassName(item.className)).filter(Boolean))];
}
function importedVenues(ws){
  const fallbacks=[...(ws?.classes||[]),...(ws?.papers||[]).map(item=>item.roomId||item.className)];
  return deriveMasterVenues(api()?.getMaster?.()||{},fallbacks);
}
function model(){
  const ws=workspace();if(!ws)return null;
  ws.seating=reconcileSeating(ws.seating||{},selectedClasses(ws),importedVenues(ws));
  return ws.seating;
}
function capacity(venue){return 2*(Number(venue.twoSeaterBenches)||0)+3*(Number(venue.threeSeaterBenches)||0)}
function rowLabel(row){return row.className+(row.sectionName?' · '+row.sectionName:'')}
function studentLabel(student){return student?student.className+(student.sectionName?' '+student.sectionName:'')+' · Roll '+student.rollNo:'Vacant'}

function injectStyles(){
  if($('examSeatingStyles'))return;
  const style=document.createElement('style');style.id='examSeatingStyles';style.textContent=`
    .seatingMetrics{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:12px;margin:14px 0}
    .seatingMetric{border:1px solid var(--line,#d9e2ea);border-radius:14px;padding:14px;background:var(--surface,#fff)}
    .seatingMetric strong{display:block;font-size:1.55rem}.seatingMetric span{font-size:.82rem;opacity:.75}
    .sourceBadge{display:inline-block;border-radius:999px;padding:3px 8px;background:#e7f4ff;color:#075985;font-size:.72rem;font-weight:700}
    .sourceBadge.manual{background:#f4e8ff;color:#6b21a8}.seatingBalance.good{color:#166534}.seatingBalance.bad{color:#b91c1c}
    .seatPlanOutput{display:grid;gap:18px;margin-top:14px}.seatPlanSheet{background:#fff;border:1px solid #20313c;padding:18px;color:#111}
    .seatPlanSchool{text-align:center;font-family:Georgia,serif}.seatPlanSchool h2{margin:0;font-size:1.2rem;text-transform:uppercase}.seatPlanSchool h3{margin:3px 0;font-size:1rem}.seatPlanSchool p{margin:2px 0;font-size:.82rem}
    .seatPlanMeta{display:grid;grid-template-columns:1fr 1fr;border:1px solid #333;margin:12px 0}.seatPlanMeta div{padding:6px 8px;border-right:1px solid #333;font-size:.82rem}.seatPlanMeta div:last-child{border-right:0}
    .seatPlanRanges{width:100%;min-width:0;margin-bottom:10px}.seatPlanRanges th,.seatPlanRanges td{border:1px solid #333;font-size:.74rem;padding:5px}
    .benchGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.benchCard{border:1px solid #333;break-inside:avoid}.benchTitle{text-align:center;border-bottom:1px solid #333;padding:3px;font-weight:800;font-size:.7rem;background:#f2f2f2}
    .benchSeats{display:grid}.benchSeats.two{grid-template-columns:repeat(2,1fr)}.benchSeats.three{grid-template-columns:repeat(3,1fr)}.benchSeat{min-height:44px;padding:5px 3px;text-align:center;font-size:.68rem;border-right:1px solid #555;display:grid;place-items:center}.benchSeat:last-child{border-right:0}.benchSeat.vacant{color:#777}
    .seatPlanFoot{display:flex;justify-content:space-between;margin-top:22px;font-size:.76rem}.seatPlanWarning{padding:10px;border:1px solid #d97706;background:#fff7ed;color:#9a3412;border-radius:8px}
    @media(max-width:760px){.seatingMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}.benchGrid{grid-template-columns:1fr 1fr}}
    .seatPlanSummarySheet{background:#fff;border:1px solid #20313c;padding:18px;color:#111}.seatPlanSummaryTable{width:100%;min-width:0}.seatPlanSummaryTable th,.seatPlanSummaryTable td{border:1px solid #222;padding:7px;text-align:center}.seatPlanSummaryTable th{background:#f0f0f0}.summaryRoom,.summaryGrand{font-weight:800}\n    .allocationNotice{padding:10px 12px;border-radius:9px;margin-bottom:12px;font-size:.8rem}.allocationNotice.good{background:#eaf7ed;color:#245f39;border:1px solid #b8d9c0}.allocationNotice.bad{background:#fff0f1;color:#9a3038;border:1px solid #e4b7bc}
.occupancyBadge{display:inline-block;margin-left:6px;padding:3px 8px;border-radius:999px;font-size:.69rem;font-weight:850}.occupancyBadge.full{background:#dcfce7;color:#166534}.occupancyBadge.empty{background:#fff7df;color:#825810}\n    .seatEditor{display:grid;gap:3px;width:100%}.seatEditor select{min-width:0;width:100%;padding:3px;font-size:.64rem}.seatPrintLabel{display:none}.roomModeBadge{display:inline-block;padding:3px 8px;border-radius:999px;background:#e7f2f7;color:#123d58;font-size:.68rem;font-weight:800}.roomEditHint{font-size:.7rem;color:#647987;text-align:center;margin:5px 0}
    .roomStickerPack{display:grid;gap:18px}.roomStickerSheet{background:#fff;border:2px solid #111;padding:18px;color:#111}.roomStickerTitle{text-align:center;margin:0 0 8px;font-size:1.15rem}.roomFront,.roomEntrance{text-align:center;border:1px solid #333;background:#f3f3f3;padding:5px;margin:8px 0;font-size:.72rem;font-weight:850;letter-spacing:.08em}.roomStickerSheet .benchGrid{grid-template-columns:repeat(var(--bench-cols,3),minmax(0,1fr))}\n    @media print{
      body.printingSeatingSummary .topbar,body.printingSeatingSummary .sidebar,body.printingSeatingSummary .pane:not([data-pane="seatingPlan"]),body.printingSeatingSummary [data-pane="seatingPlan"]>*:not(.surface:last-child),
      body.printingRoomStickers .topbar,body.printingRoomStickers .sidebar,body.printingRoomStickers .pane:not([data-pane="seatingPlan"]),body.printingRoomStickers [data-pane="seatingPlan"]>*:not(.surface:last-child){display:none!important}
      body.printingSeatingSummary .appShell,body.printingSeatingSummary .workspace,body.printingSeatingSummary [data-pane="seatingPlan"],body.printingSeatingSummary [data-pane="seatingPlan"]>.surface:last-child,
      body.printingRoomStickers .appShell,body.printingRoomStickers .workspace,body.printingRoomStickers [data-pane="seatingPlan"],body.printingRoomStickers [data-pane="seatingPlan"]>.surface:last-child{display:block!important;padding:0;margin:0;border:0;box-shadow:none}
      body.printingSeatingSummary .sectionTitle,body.printingSeatingSummary .roomStickerPack,
      body.printingRoomStickers .sectionTitle,body.printingRoomStickers .seatPlanSummarySheet{display:none!important}
      body.printingRoomStickers .seatEditor,body.printingRoomStickers .roomEditHint,body.printingRoomStickers .allocationNotice{display:none!important}body.printingRoomStickers .seatPrintLabel{display:block!important}
      body.printingSeatingSummary .seatPlanSummarySheet{display:block!important;border:0;padding:8mm}
      body.printingRoomStickers .roomStickerPack{display:block!important}
      body.printingRoomStickers .roomStickerSheet{display:block!important;page-break-after:always;border:0;padding:8mm;min-height:270mm}
    }
  `;document.head.appendChild(style);
}

function renderReviewCard(summary){
  const host=$('reviewSummary');if(!host)return;
  host.querySelector('[data-seating-review]')?.remove();
  const card=document.createElement('div');card.className='reviewCard '+(summary.ready?'good':'bad');card.dataset.seatingReview='true';
  card.innerHTML=`<strong>${summary.ready?'Ready':summary.totalStudents?summary.totalSeats+'/'+summary.totalStudents+' seats':'Incomplete'}</strong><span>Seating capacity</span>`;
  host.appendChild(card);
}

function occupancyText(assigned,roomCapacity){const empty=Math.max(0,Number(roomCapacity||0)-Number(assigned||0));return empty?empty+' empty seat'+(empty===1?'':'s'):'All seats occupied'}
function occupancyClass(assigned,roomCapacity){return Number(assigned)>=Number(roomCapacity)?'full':'empty'}
function studentId(student){return student&&student.rollNo?student.className+'|'+(student.sectionName||'')+'|'+Number(student.rollNo):''}
function allocationAudit(plan,seating){
  const expected=new Set();
  (seating?.sectionStrengths||[]).forEach(row=>{const start=Math.max(1,Number(row.startingRollNo)||1);for(let i=0;i<Number(row.strength||0);i++)expected.add(row.className+'|'+(row.sectionName||'')+'|'+(start+i))});
  const seen=new Map(),invalid=[];
  (plan?.rooms||[]).forEach(room=>room.benches.forEach(bench=>bench.students.forEach(student=>{if(!student)return;const id=studentId(student);if(!id||!expected.has(id))invalid.push(id||'Incomplete seat');else seen.set(id,(seen.get(id)||0)+1)})));
  const duplicates=[...seen].filter(([,count])=>count>1).map(([id])=>id),missing=[...expected].filter(id=>!seen.has(id));
  return {valid:!duplicates.length&&!missing.length&&!invalid.length,duplicates,missing,invalid,assigned:[...seen].reduce((sum,[,count])=>sum+count,0),expected:expected.size};
}
function seatEditor(student,seating,path,used){
  const rows=seating.sectionStrengths||[],selectedIndex=student?rows.findIndex(row=>row.className===student.className&&(row.sectionName||'')===(student.sectionName||'')):-1;
  const groupOptions=['<option value="">Vacant / Select class</option>',...rows.map((row,index)=>`<option value="${index}" ${index===selectedIndex?'selected':''}>${safe(rowLabel(row))}</option>`)].join('');
  let rollOptions='<option value="">Select roll</option>';
  if(selectedIndex>=0){const row=rows[selectedIndex],start=Math.max(1,Number(row.startingRollNo)||1);for(let i=0;i<Number(row.strength||0);i++){const roll=start+i,id=row.className+'|'+(row.sectionName||'')+'|'+roll,owner=used.get(id);rollOptions+=`<option value="${roll}" ${Number(student?.rollNo)===roll?'selected':''} ${owner&&owner!==path?'disabled':''}>${roll}</option>`}}
  return `<div class="seatEditor"><select data-seat-group data-seat-path="${path}" aria-label="Class and section">${groupOptions}</select><select data-seat-roll data-seat-path="${path}" ${selectedIndex<0?'disabled':''} aria-label="Roll number">${rollOptions}</select></div><span class="seatPrintLabel">${safe(studentLabel(student))}</span>`;
}
function roomRanges(room){
  const map=new Map();
  room.benches.flatMap(bench=>bench.students).filter(Boolean).forEach(student=>{
    const key=student.className+'|'+student.sectionName;
    const old=map.get(key)||{className:student.className,sectionName:student.sectionName,rolls:[]};old.rolls.push(student.rollNo);map.set(key,old);
  });
  return [...map.values()].map(item=>({...item,from:Math.min(...item.rolls),to:Math.max(...item.rolls),count:item.rolls.length}));
}
function renderPlan(plan){
  const host=$('seatingPlanOutput'),summaryButton=$('printSeatingSummary'),stickerButton=$('printRoomStickers'),seating=model();if(!host)return;
  if(!plan?.rooms?.length){host.innerHTML='<div class="empty">Enter strengths and venue capacities, then prepare the layout.</div>';if(summaryButton)summaryButton.disabled=true;if(stickerButton)stickerButton.disabled=true;return}
  const ws=workspace(),examName=safe(ws?.name||ws?.workspaceName||$('workspaceName')?.value||'Examination'),audit=allocationAudit(plan,seating),used=new Map();
  plan.rooms.forEach((room,ri)=>room.benches.forEach((bench,bi)=>bench.students.forEach((student,si)=>{const id=studentId(student);if(id&&!used.has(id))used.set(id,ri+'|'+bi+'|'+si)})));
  const summaryRows=plan.rooms.flatMap(room=>{const ranges=roomRanges(room),roomTotal=room.benches.flatMap(bench=>bench.students).filter(Boolean).length;return ranges.map((item,index)=>`<tr>${index===0?`<td class="summaryRoom" rowspan="${ranges.length}">${safe(room.venueName)}</td>`:''}<td>${safe(item.className+(item.sectionName?' - '+item.sectionName:''))}</td><td>${item.from===item.to?item.from:item.from+' - '+item.to}</td><td>${item.count}</td>${index===0?`<td class="summaryGrand" rowspan="${ranges.length}">${roomTotal}</td>`:''}</tr>`)});
  const summary=`<section class="seatPlanSummarySheet"><header class="seatPlanSchool"><h2>Vivekananda Kendra Vidyalaya, Nalbari</h2><h3>SEAT PLAN</h3><p><b>${examName}</b></p></header><table class="seatPlanSummaryTable"><thead><tr><th>Class Room</th><th>Class</th><th>Roll No. Range</th><th>Total No.</th><th>Grand Total</th></tr></thead><tbody>${summaryRows.join('')}</tbody></table><footer class="seatPlanFoot"><span>Exam Dept.</span><span>VKV Nalbari</span></footer></section>`;
  const stickers=`<div class="roomStickerPack">${plan.rooms.map((room,ri)=>{const ranges=roomRanges(room),roomTotal=room.benches.flatMap(bench=>bench.students).filter(Boolean).length;return `<section class="roomStickerSheet"><header class="seatPlanSchool"><h2>Vivekananda Kendra Vidyalaya, Nalbari</h2><h3>${examName}</h3></header><h3 class="roomStickerTitle">ROOM-WISE SEAT PLAN · ${safe(room.venueName)}</h3><div class="seatPlanMeta"><div><b>Students:</b> ${roomTotal} / ${room.capacity}<br><span class="occupancyBadge ${occupancyClass(roomTotal,room.capacity)}">${occupancyText(roomTotal,room.capacity)}</span></div><div><span class="roomModeBadge">${room.mixingMode==='manual'?'Manual Mixing':'Automatic · '+room.mixClassCount+' classes'}</span></div></div><div class="roomEditHint">Every seat is editable: choose the class-section first and then its roll number.</div><table class="seatPlanRanges"><thead><tr><th>Class</th><th>Section / Stream</th><th>Roll Nos.</th><th>Total</th></tr></thead><tbody>${ranges.map(item=>`<tr><td>${safe(item.className)}</td><td>${safe(item.sectionName||'—')}</td><td>${item.from===item.to?item.from:item.from+' - '+item.to}</td><td>${item.count}</td></tr>`).join('')}</tbody></table><div class="roomFront">FRONT · INVIGILATOR'S TABLE / BOARD</div><div class="benchGrid" style="--bench-cols:${Math.max(1,Math.min(6,Number(room.benchesPerRow)||3))}">${room.benches.map((bench,bi)=>`<article class="benchCard"><div class="benchTitle">BENCH ${String(bench.number).padStart(2,'0')} · ${bench.size}-SEATER</div><div class="benchSeats ${bench.size===3?'three':'two'}">${bench.students.map((student,si)=>{const path=ri+'|'+bi+'|'+si;return `<div class="benchSeat ${student?'':'vacant'}">${seatEditor(student,seating,path,used)}</div>`}).join('')}</div></article>`).join('')}</div><div class="roomEntrance">ENTRANCE</div></section>`}).join('')}</div>`;
  const notice=audit.valid?`<div class="allocationNotice good"><b>Allocation complete:</b> all ${audit.expected} students are assigned exactly once. Both print outputs are ready.</div>`:`<div class="allocationNotice bad"><b>Layout incomplete.</b> Assigned ${audit.assigned} of ${audit.expected}; missing ${audit.missing.length}; duplicates ${audit.duplicates.length}; invalid/incomplete ${audit.invalid.length}. Printing will be enabled after correction.</div>`;
  host.innerHTML=notice+summary+stickers;
  if(summaryButton)summaryButton.disabled=!audit.valid;if(stickerButton)stickerButton.disabled=!audit.valid;
}
function renderCapacitySummary(summary){
  renderCapacitySummary(summary);
  const status=summary.missingStrengths?'<b>'+summary.missingStrengths+' section strength(s) still need to be entered.</b>':summary.balance<0?'<b>Seating shortage: '+Math.abs(summary.balance)+' seat(s).</b> Add benches or venues before preparing the final plan.':summary.totalStudents?'<b>Capacity is sufficient.</b> '+summary.balance+' extra seat(s) available.':'<b>Total students will appear after class-section strengths are entered.</b>';
  const kind=summary.missingStrengths?'warn':summary.balance<0?'error':summary.totalStudents?'success':'info',notice=$('seatingStatus');notice.className='notice '+kind;notice.innerHTML=status;
}
function venueOccupancy(seating,venue){
  const room=seating?.plan?.rooms?.find(item=>item.venueId===venue.id);if(!room)return'';
  const assigned=room.benches.flatMap(bench=>bench.students).filter(Boolean).length;
  return '<br><span class="occupancyBadge '+occupancyClass(assigned,capacity(venue))+'">'+occupancyText(assigned,capacity(venue))+'</span>';
}
function render(){
  const seating=model(),ws=workspace(),pane=$('seatingPlanPane');if(!seating||!ws||!pane)return;
  const summary=seatingSummary(seating),strengthHost=$('seatingStrengthRows'),venueHost=$('seatingVenueRows');
  $('seatingClassCount').textContent=String(summary.classCount);$('seatingStudentTotal').textContent=String(summary.totalStudents);$('seatingSeatTotal').textContent=String(summary.totalSeats);
  $('seatingBalance').textContent=(summary.balance>=0?'+':'')+String(summary.balance);$('seatingBalance').className='seatingBalance '+(summary.balance>=0?'good':'bad');
  strengthHost.innerHTML=seating.sectionStrengths.length?seating.sectionStrengths.map((row,index)=>`<tr><td><b>${safe(row.className)}</b></td><td>${safe(row.sectionName||'Single section')}</td><td><input type="number" min="0" max="999" inputmode="numeric" data-strength-index="${index}" value="${Number(row.strength)||''}" placeholder="Enter strength"></td><td><input type="number" min="1" max="999" inputmode="numeric" data-roll-index="${index}" value="${Math.max(1,Number(row.startingRollNo)||1)}"></td></tr>`).join(''):'<tr><td colspan="4">Select at least one class in the Subjects step. Its section-strength rows will appear here automatically.</td></tr>';
  venueHost.innerHTML=seating.venues.length?seating.venues.map((venue,index)=>`<tr><td><input type="checkbox" data-venue-field="active" data-venue-index="${index}" ${venue.active!==false?'checked':''}></td><td><b>${safe(venue.name)}</b><br><span class="sourceBadge ${venue.source==='manual'?'manual':''}">${venue.source==='manual'?'Added venue':'Master timetable'}</span></td><td><input type="number" min="0" max="999" inputmode="numeric" data-venue-field="twoSeaterBenches" data-venue-index="${index}" value="${Number(venue.twoSeaterBenches)||0}"></td><td><input type="number" min="0" max="999" inputmode="numeric" data-venue-field="threeSeaterBenches" data-venue-index="${index}" value="${Number(venue.threeSeaterBenches)||0}"></td><td><input type="number" min="1" max="6" inputmode="numeric" data-venue-field="benchesPerRow" data-venue-index="${index}" value="${Math.max(1,Math.min(6,Number(venue.benchesPerRow)||3))}"></td><td><select data-venue-field="mixingMode" data-venue-index="${index}"><option value="auto" ${venue.mixingMode!=="manual"?"selected":""}>Automatic</option><option value="manual" ${venue.mixingMode==="manual"?"selected":""}>Manual</option></select></td><td><select data-venue-field="mixClassCount" data-venue-index="${index}" ${venue.mixingMode==="manual"?"disabled":""}><option value="2" ${Number(venue.mixClassCount)!==3?"selected":""}>2 classes</option><option value="3" ${Number(venue.mixClassCount)===3?"selected":""}>3 classes</option></select></td><td><b data-venue-capacity="${index}">${capacity(venue)}</b>${venueOccupancy(seating,venue)}</td><td>${venue.source==='manual'?'<button type="button" class="button" data-remove-venue="'+index+'">Remove</button>':'—'}</td></tr>`).join(''):'<tr><td colspan="9">No class venues were found. Add a venue below.</td></tr>';
  renderPlan(seating.plan);renderReviewCard(summary);
}
function changed(message){
  const ws=workspace();if(ws?.seating){ws.seating.updatedAtMs=Date.now();ws.seating.plan=null}
  api()?.markDirty?.(message);render();
}
function buildStudentPools(rows){
  return rows.filter(row=>Number(row.strength)>0).map(row=>({key:row.className+'|'+(row.sectionName||''),items:Array.from({length:Number(row.strength)},(_,i)=>({className:row.className,sectionName:row.sectionName||'',rollNo:Math.max(1,Number(row.startingRollNo)||1)+i}))}));
}
function combinations(items,count,start=0,prefix=[],result=[]){
  if(prefix.length===count){result.push(prefix.slice());return result}
  for(let i=start;i<=items.length-(count-prefix.length);i++){prefix.push(items[i]);combinations(items,count,i+1,prefix,result);prefix.pop()}
  return result;
}
function choosePools(pools,roomCapacity,groupLimit){
  const active=pools.filter(pool=>pool.items.length),size=Math.min(groupLimit,active.length);if(!size)return[];
  const choices=combinations(active,size);let best=choices[0],bestScore=-Infinity;
  for(const choice of choices){const amounts=choice.map(pool=>pool.items.length),total=amounts.reduce((a,b)=>a+b,0),covers=total>=roomCapacity;const score=(covers?1000000-Math.abs(total-roomCapacity)*100:total*100)+Math.min(...amounts);if(score>bestScore){best=choice;bestScore=score}}
  return best;
}
function takeRoomStudents(pools,roomCapacity,groupLimit){
  const selected=choosePools(pools,roomCapacity,groupLimit),result=[],placed=new Map(selected.map(pool=>[pool.key,0]));let last='';
  while(result.length<roomCapacity&&selected.some(pool=>pool.items.length)){
    const active=selected.filter(pool=>pool.items.length).sort((a,b)=>(placed.get(a.key)||0)-(placed.get(b.key)||0)||b.items.length-a.items.length);
    const pick=active.find(pool=>pool.key!==last)||active[0];result.push(pick.items.shift());placed.set(pick.key,(placed.get(pick.key)||0)+1);last=pick.key;
  }
  return result;
}
function removeAssignedStudent(pools,student){
  const pool=pools.find(item=>item.key===student?.className+'|'+(student?.sectionName||''));if(!pool)return;
  const index=pool.items.findIndex(item=>Number(item.rollNo)===Number(student.rollNo));if(index>=0)pool.items.splice(index,1);
}
function generatePlan(){
  const seating=model(),summary=seatingSummary(seating);if(!seating)return;
  if(summary.missingStrengths){alert('Please enter every class-section strength before preparing the layout.');return}
  if(!summary.venueCount||!summary.totalSeats){alert('Please select venues and enter bench numbers first.');return}
  const pools=buildStudentPools(seating.sectionStrengths),rooms=[],oldRooms=new Map((seating.plan?.rooms||[]).map(room=>[room.venueId,room]));
  for(const venue of seating.venues.filter(item=>item.active!==false&&item.mixingMode==='manual')){
    const old=oldRooms.get(venue.id);old?.benches?.flatMap(bench=>bench.students).filter(Boolean).forEach(student=>removeAssignedStudent(pools,student));
  }
  for(const venue of seating.venues.filter(item=>item.active!==false)){
    const sizes=[...Array(Number(venue.twoSeaterBenches)||0).fill(2),...Array(Number(venue.threeSeaterBenches)||0).fill(3)],roomCapacity=sizes.reduce((sum,size)=>sum+size,0),old=oldRooms.get(venue.id);
    let roomQueue=venue.mixingMode==='manual'?(old?.benches?.flatMap(bench=>bench.students)||[]):takeRoomStudents(pools,roomCapacity,Number(venue.mixClassCount)===3?3:2);
    const benches=[];sizes.forEach((size,index)=>{const students=Array.from({length:size},()=>roomQueue.shift()||null);benches.push({number:index+1,size,students})});
    if(benches.length)rooms.push({venueId:venue.id,venueName:venue.name,capacity:roomCapacity,studentCount:benches.flatMap(bench=>bench.students).filter(Boolean).length,benchesPerRow:Math.max(1,Math.min(6,Number(venue.benchesPerRow)||3)),mixingMode:venue.mixingMode==='manual'?'manual':'auto',mixClassCount:Number(venue.mixClassCount)===3?3:2,benches});
  }
  const unseated=pools.flatMap(pool=>pool.items);seating.plan={schemaVersion:3,generatedAtMs:Date.now(),rooms,unseated,totalStudents:summary.totalStudents,totalSeats:summary.totalSeats};
  seating.updatedAtMs=Date.now();api()?.markDirty?.('Editable seating layout prepared');render();
}
function seatAssignmentChanged(event){
  const control=event.target.closest?.('[data-seat-group],[data-seat-roll]');if(!control)return;
  const [ri,bi,si]=String(control.dataset.seatPath||'').split('|').map(Number),seating=model(),seat=seating?.plan?.rooms?.[ri]?.benches?.[bi]?.students;if(!seat||!Number.isInteger(si))return;
  if(control.hasAttribute('data-seat-group')){const row=seating.sectionStrengths[Number(control.value)];seat[si]=row?{className:row.className,sectionName:row.sectionName||'',rollNo:null}:null}
  else if(seat[si])seat[si].rollNo=control.value?Number(control.value):null;
  const room=seating.plan.rooms[ri];room.studentCount=room.benches.flatMap(bench=>bench.students).filter(student=>student?.rollNo).length;seating.plan.updatedAtMs=Date.now();seating.updatedAtMs=Date.now();api()?.markDirty?.('Seat assignment updated');render();
}
function printOutput(kind){
  const seating=model();if(!seating?.plan?.rooms?.length){alert('Prepare the seating layout first.');return}if(!allocationAudit(seating.plan,seating).valid){alert('Complete the seat allocation and remove duplicates before printing.');return}
  const className=kind==='summary'?'printingSeatingSummary':'printingRoomStickers';document.body.classList.add(className);
  window.addEventListener('afterprint',()=>document.body.classList.remove(className),{once:true});window.print();
}
function liveCapacityChanged(event){
  const control=event.target.closest?.('[data-venue-field]'),field=control?.dataset.venueField;if(!['twoSeaterBenches','threeSeaterBenches'].includes(field))return;
  const index=Number(control.dataset.venueIndex),seating=model(),venue=seating?.venues?.[index];if(!venue)return;
  venue[field]=Math.max(0,Number(control.value)||0);seating.plan=null;seating.updatedAtMs=Date.now();
  const cell=$('seatingVenueRows')?.querySelector('[data-venue-capacity="'+index+'"]');if(cell)cell.textContent=String(capacity(venue));
  renderCapacitySummary(seatingSummary(seating));renderPlan(null);api()?.markDirty?.('Examination room capacity updated');
}
function bind(){
  injectStyles();
  $('seatingStrengthRows')?.addEventListener('change',event=>{
    const strengthIndex=Number(event.target.dataset.strengthIndex),rollIndex=Number(event.target.dataset.rollIndex),seating=model();
    if(Number.isInteger(strengthIndex)&&seating?.sectionStrengths[strengthIndex])seating.sectionStrengths[strengthIndex].strength=Math.max(0,Number(event.target.value)||0);
    else if(Number.isInteger(rollIndex)&&seating?.sectionStrengths[rollIndex])seating.sectionStrengths[rollIndex].startingRollNo=Math.max(1,Number(event.target.value)||1);else return;
    changed('Class-section roll details updated');
  });
  $('seatingVenueRows')?.addEventListener('input',liveCapacityChanged);
  $('seatingVenueRows')?.addEventListener('change',event=>{const index=Number(event.target.dataset.venueIndex),field=event.target.dataset.venueField;if(!Number.isInteger(index)||!field)return;const seating=model(),venue=seating?.venues[index];if(!venue)return;venue[field]=field==='active'?event.target.checked:field==='mixingMode'?event.target.value:field==='mixClassCount'?(Number(event.target.value)===3?3:2):field==='benchesPerRow'?Math.max(1,Math.min(6,Number(event.target.value)||3)):Math.max(0,Number(event.target.value)||0);changed('Seating venue capacity updated')});
  $('seatingVenueRows')?.addEventListener('click',event=>{const button=event.target.closest('[data-remove-venue]');if(!button)return;const seating=model(),index=Number(button.dataset.removeVenue);if(!seating?.venues[index])return;seating.venues.splice(index,1);changed('Added venue removed')});
  $('addSeatingVenue')?.addEventListener('click',()=>{const input=$('newSeatingVenue'),name=input.value.trim();if(!name){input.focus();return}const seating=model();if(seating.venues.some(item=>item.name.toLowerCase()===name.toLowerCase())){alert('This venue is already listed.');return}seating.venues.push({id:'VENUE_MANUAL_'+Date.now(),name,source:'manual',active:true,twoSeaterBenches:0,threeSeaterBenches:0,benchesPerRow:3,mixingMode:'auto',mixClassCount:2});input.value='';changed('New seating venue added')});
  $('reimportSeatingVenues')?.addEventListener('click',()=>{const ws=workspace();ws.seating=reconcileSeating(ws.seating||{},selectedClasses(ws),importedVenues(ws));changed('Class venues refreshed from Master Timetable')});
  $('seatingPlanOutput')?.addEventListener('change',seatAssignmentChanged);
  $('generateSeatingPlan')?.addEventListener('click',generatePlan);$('printSeatingSummary')?.addEventListener('click',()=>printOutput('summary'));$('printRoomStickers')?.addEventListener('click',()=>printOutput('stickers'));$('printSeatPlanSummaryReview')?.addEventListener('click',()=>printOutput('summary'));$('printRoomStickersReview')?.addEventListener('click',()=>printOutput('stickers'));
  document.addEventListener('vkv-exam-workspace-rendered',render);document.addEventListener('vkv-exam-workspace-subjects-applied',()=>setTimeout(render,0));
  document.addEventListener('change',event=>{if(event.target.closest?.('#paperRows,#majorClassGrid,#majorSubjectGrid'))setTimeout(render,40)});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-pane-target="seatingPlan"]'))setTimeout(render,0)});render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
