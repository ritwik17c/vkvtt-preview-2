const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const text=value=>String(value??'').trim();
const key=value=>text(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const clone=value=>JSON.parse(JSON.stringify(value));
const idPart=value=>text(value).toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,36)||'ITEM';

export function parseDate(value){
  const match=text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match)return null;
  const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0);
  return Number.isNaN(date.valueOf())?null:date;
}
export function dateKey(date){
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
export function displayDate(value){
  const date=parseDate(value);return date?String(date.getDate()).padStart(2,'0')+'/'+String(date.getMonth()+1).padStart(2,'0')+'/'+date.getFullYear():text(value);
}
export function dayName(value){const date=parseDate(value);return date?DAY_NAMES[date.getDay()]:''}

function datesBetween(start,end){
  const a=parseDate(start),b=parseDate(end);if(!a||!b||a>b)return [];
  const out=[];for(const cursor=new Date(a);cursor<=b;cursor.setDate(cursor.getDate()+1))out.push(dateKey(cursor));return out;
}

export function candidateExamDates(settings={}){
  const excludedDays=new Set((settings.excludedWeekdays||[0]).map(Number));
  const excludedDates=new Set((settings.excludedDates||[]).map(text));
  const custom=[...new Set((settings.customDates||[]).map(text).filter(Boolean))].sort();
  if(settings.cadence==='custom'){
    const start=parseDate(settings.startDate),end=parseDate(settings.endDate);
    return custom.filter(value=>{const date=parseDate(value);return date&&(!start||date>=start)&&(!end||date<=end)&&!excludedDays.has(date.getDay())&&!excludedDates.has(value)});
  }
  const eligible=datesBetween(settings.startDate,settings.endDate).filter(value=>{
    const date=parseDate(value);return date&&!excludedDays.has(date.getDay())&&!excludedDates.has(value);
  });
  if(settings.cadence!=='alternate')return eligible;
  const out=[];let last=null;
  for(const value of eligible){
    const date=parseDate(value);
    if(!last||Math.round((date-last)/86400000)>=2){out.push(value);last=date}
  }
  return out;
}

function recordTeacherCodes(record,teachers){
  if(Array.isArray(record.codes)&&record.codes.length)return [...new Set(record.codes.map(text).filter(Boolean))];
  const entry=text(record.entry),out=[];
  for(const teacher of [...teachers].sort((a,b)=>b.code.length-a.code.length)){
    const escaped=teacher.code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(new RegExp('(^|[^A-Za-z0-9])'+escaped+'($|[^A-Za-z0-9])').test(entry))out.push(teacher.code);
  }
  return out;
}

function recordSubject(record,codes){
  if(text(record.subject))return text(record.subject);
  let value=text(record.entry);
  for(const code of codes){
    const escaped=code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    value=value.replace(new RegExp('(^|[-/ ,&])'+escaped+'(?=$|[-/ ,&])','g'),'$1');
  }
  return value.replace(/[\s\-\/,&]+$/g,'').trim();
}

function masterClasses(master){
  const values=[];
  for(const item of master.classes||[]){const value=text(typeof item==='string'?item:(item.name||item.id||item.class));if(value)values.push(value)}
  for(const record of master.records||[]){const value=text(record.class||record.className);if(value)values.push(value)}
  return [...new Set(values)].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}

export function deriveExamModel(rawMaster={}){
  const master=rawMaster&&rawMaster.data&&typeof rawMaster.data==='object'?{...rawMaster,...rawMaster.data}:rawMaster;
  const teachers=(master.teachers||[]).filter(item=>item&&item.active!==false).map(item=>({
    code:text(item.code||item.shortCode||item.id),name:text(item.name||item.code||item.shortCode),active:true,
    maxInvigilationDuties:Number(item.maxInvigilationDuties)||4,maxReliefDuties:Number(item.maxReliefDuties)||3,
    unavailableSlots:[],subjectNames:[]
  })).filter(item=>item.code);
  const teacherByCode=new Map(teachers.map(item=>[item.code,item]));
  const classes=masterClasses(master),classSubjects=new Map(classes.map(value=>[value,new Map()]));
  const add=(className,subject,codes=[])=>{
    className=text(className);subject=text(subject);if(!className||!subject)return;
    if(!classSubjects.has(className))classSubjects.set(className,new Map());
    const map=classSubjects.get(className),subjectKey=key(subject);
    if(!subjectKey)return;
    if(!map.has(subjectKey))map.set(subjectKey,{name:subject,teacherCodes:new Set()});
    for(const code of codes){map.get(subjectKey).teacherCodes.add(code);const teacher=teacherByCode.get(code);if(teacher&&!teacher.subjectNames.some(value=>key(value)===subjectKey))teacher.subjectNames.push(subject)}
  };
  for(const record of master.records||[]){const codes=recordTeacherCodes(record,teachers);add(record.class||record.className,recordSubject(record,codes),codes)}
  for(const allocation of master.assignmentCards||[]){
    const subject=text(allocation.subject||allocation.subjectName||allocation.name),codes=(allocation.teacherCodes||allocation.codes||[]).map(text);
    const targetClasses=allocation.classIds||allocation.classes||[allocation.class||allocation.className];
    for(const className of targetClasses||[])add(className,subject,codes);
  }
  const papers=[];
  for(const className of [...classSubjects.keys()].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))){
    for(const subject of [...classSubjects.get(className).values()].sort((a,b)=>a.name.localeCompare(b.name))){
      papers.push({id:'PAPER_'+idPart(className)+'_'+idPart(subject.name),className,subject:subject.name,teacherCodes:[...subject.teacherCodes],included:true,roomId:className,fixedDate:'',fixedSlotId:''});
    }
  }
  const scheduleId=text(master.activeScheduleProfileId),profiles=Array.isArray(master.scheduleProfiles)?master.scheduleProfiles:[];
  const schedule=profiles.find(item=>text(item.id)===scheduleId)||profiles.find(item=>item.active)||null;
  const scheduleTimes=clone((schedule&&schedule.times)||master.times||{});
  return {classes:[...classSubjects.keys()],teachers,papers,schedule:{id:scheduleId,name:text(schedule&&schedule.name)||'Activated Schedule',times:scheduleTimes}};
}

function normalizedSlots(workspace){
  const slots=(workspace.slots||[]).map((slot,index)=>({id:text(slot.id)||'SESSION_'+(index+1),name:text(slot.name)||'Session '+(index+1),startTime:text(slot.startTime),endTime:text(slot.endTime),durationMinutes:Number(slot.durationMinutes)||0}));
  return slots.length?slots:[{id:'SESSION_1',name:'Morning',startTime:'09:00',endTime:'12:00',durationMinutes:180}];
}

function cellKey(date,slotId){return date+'|'+slotId}

export function generateExamTimetable(workspace={}){
  const papers=(workspace.papers||[]).filter(item=>item.included!==false).map(clone);
  const dates=candidateExamDates(workspace.settings||{}),slots=normalizedSlots(workspace);
  const cells=dates.flatMap(date=>slots.map(slot=>({date,slotId:slot.id})));
  const maxPerDay=Math.max(1,Number(workspace.settings?.maxExamsPerClassPerDay)||1);
  const bySubject=new Map();
  for(const paper of papers){const subjectKey=key(paper.subject);if(!bySubject.has(subjectKey))bySubject.set(subjectKey,[]);bySubject.get(subjectKey).push(paper)}
  const groups=[...bySubject.values()].sort((a,b)=>b.length-a.length||a[0].subject.localeCompare(b[0].subject));
  const events=[],unplaced=[],classCell=new Set(),classDateCount=new Map(),dateLoad=new Map();
  const canPlace=(paper,cell)=>!classCell.has(paper.className+'|'+cellKey(cell.date,cell.slotId))&&(classDateCount.get(paper.className+'|'+cell.date)||0)<maxPerDay;
  const place=(paper,cell)=>{
    const event={id:'EXAM_'+idPart(paper.className)+'_'+idPart(paper.subject),paperId:paper.id,className:paper.className,subject:paper.subject,date:cell.date,day:dayName(cell.date),slotId:cell.slotId,teacherCodes:clone(paper.teacherCodes||[]),roomId:text(paper.roomId)||''};
    events.push(event);classCell.add(paper.className+'|'+cellKey(cell.date,cell.slotId));const classDate=paper.className+'|'+cell.date;classDateCount.set(classDate,(classDateCount.get(classDate)||0)+1);dateLoad.set(cellKey(cell.date,cell.slotId),(dateLoad.get(cellKey(cell.date,cell.slotId))||0)+1);
  };
  for(const group of groups){
    const remaining=[...group];
    while(remaining.length){
      const fixed=remaining.find(item=>item.fixedDate||item.fixedSlotId);
      let candidates=cells.filter(cell=>!fixed||(!fixed.fixedDate||fixed.fixedDate===cell.date)&&(!fixed.fixedSlotId||fixed.fixedSlotId===cell.slotId));
      candidates=candidates.map(cell=>({cell,fit:remaining.filter(item=>(!item.fixedDate||item.fixedDate===cell.date)&&(!item.fixedSlotId||item.fixedSlotId===cell.slotId)&&canPlace(item,cell)).length,load:dateLoad.get(cellKey(cell.date,cell.slotId))||0})).filter(item=>item.fit>0).sort((a,b)=>b.fit-a.fit||a.load-b.load||a.cell.date.localeCompare(b.cell.date)||a.cell.slotId.localeCompare(b.cell.slotId));
      if(!candidates.length){unplaced.push(...remaining.map(item=>({...item,reason:'No permitted date/session remains for this class.'})));break}
      const chosen=candidates[0].cell,placed=[];
      for(const paper of remaining){if((!paper.fixedDate||paper.fixedDate===chosen.date)&&(!paper.fixedSlotId||paper.fixedSlotId===chosen.slotId)&&canPlace(paper,chosen)){place(paper,chosen);placed.push(paper.id)}}
      for(let index=remaining.length-1;index>=0;index--)if(placed.includes(remaining[index].id))remaining.splice(index,1);
    }
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)||a.slotId.localeCompare(b.slotId)||a.className.localeCompare(b.className,undefined,{numeric:true}));
  return {events,unplaced,dates,slots};
}

export function validateExamTimetable(workspace={}){
  const result=workspace.timetable||{events:[],unplaced:[]},issues=[];
  const included=(workspace.papers||[]).filter(item=>item.included!==false),eventByPaper=new Map();
  for(const event of result.events||[]){
    if(eventByPaper.has(event.paperId))issues.push({level:'error',code:'DUPLICATE_PAPER',message:event.className+' · '+event.subject+' is scheduled more than once.'});
    eventByPaper.set(event.paperId,event);
  }
  for(const paper of included)if(!eventByPaper.has(paper.id))issues.push({level:'error',code:'UNPLACED_PAPER',message:paper.className+' · '+paper.subject+' is not scheduled.'});
  const maxPerDay=Math.max(1,Number(workspace.settings?.maxExamsPerClassPerDay)||1),counts=new Map();
  for(const event of result.events||[]){const k=event.className+'|'+event.date;counts.set(k,(counts.get(k)||0)+1)}
  for(const [k,count] of counts)if(count>maxPerDay)issues.push({level:'error',code:'CLASS_DAILY_LIMIT',message:k.replace('|',' on ')+' has '+count+' examinations; the limit is '+maxPerDay+'.'});
  if(!candidateExamDates(workspace.settings||{}).length)issues.push({level:'error',code:'NO_DATES',message:'No eligible examination dates are available in the selected range.'});
  return {valid:!issues.some(item=>item.level==='error'),issues,scheduled:(result.events||[]).length,total:included.length,unplaced:(result.unplaced||[]).length};
}

function unavailable(teacher,date,slotId){
  const values=new Set((teacher.unavailableSlots||[]).map(text));
  const approvedLeave=new Set((teacher.approvedLeaveDates||[]).map(text));
  return approvedLeave.has(date)||values.has(date)||values.has(date+'|'+slotId);
}

export function generateDutyRoster(workspace={}){
  const events=workspace.timetable?.events||[],teachers=(workspace.teachers||[]).filter(item=>item.active!==false),slots=normalizedSlots(workspace);
  const slotById=new Map(slots.map(item=>[item.id,item])),settings=workspace.settings||{};
  const invigilatorsPerRoom=Math.max(1,Number(settings.invigilatorsPerRoom)||1),relieversPerSession=Math.max(0,Number(settings.relieversPerSession)||0);
  const activeCells=[...new Set(events.map(item=>cellKey(item.date,item.slotId)))].sort(),invigilation=[],relievers=[],unfilled=[];
  const invigLoad=new Map(),reliefLoad=new Map(),invigDayLoad=new Map(),busyCell=new Set(),invigilatorDates=new Map();
  const teacherSubjects=new Map(teachers.map(item=>[item.code,new Set((item.subjectNames||[]).map(key))]));
  const roomsByCell=new Map();
  for(const event of events){const c=cellKey(event.date,event.slotId),room=text(event.roomId)||event.className;if(!roomsByCell.has(c))roomsByCell.set(c,new Map());if(!roomsByCell.get(c).has(room))roomsByCell.get(c).set(room,[]);roomsByCell.get(c).get(room).push(event)}
  for(const c of activeCells){
    const [date,slotId]=c.split('|'),rooms=roomsByCell.get(c)||new Map();
    for(const [roomId,roomEvents] of rooms){
      for(let position=1;position<=invigilatorsPerRoom;position++){
        const subjectKeys=new Set(roomEvents.map(item=>key(item.subject)));
        const candidates=teachers.filter(teacher=>{
          if(unavailable(teacher,date,slotId)||busyCell.has(teacher.code+'|'+c))return false;
          if((invigLoad.get(teacher.code)||0)>=Math.max(1,Number(teacher.maxInvigilationDuties)||4))return false;
          if((invigDayLoad.get(teacher.code+'|'+date)||0)>=Math.max(1,Number(settings.maxInvigilationPerDay)||1))return false;
          if(settings.avoidOwnSubject===true&&[...(teacherSubjects.get(teacher.code)||[])].some(value=>subjectKeys.has(value)))return false;
          return true;
        }).sort((a,b)=>(invigLoad.get(a.code)||0)-(invigLoad.get(b.code)||0)||a.name.localeCompare(b.name));
        const teacher=candidates[0];
        if(!teacher){unfilled.push({role:'Invigilator',date,slotId,roomId,reason:'No available teacher satisfies the current rules.'});continue}
        invigilation.push({date,day:dayName(date),slotId,session:slotById.get(slotId)?.name||slotId,roomId,teacherCode:teacher.code,teacherName:teacher.name,position});
        invigLoad.set(teacher.code,(invigLoad.get(teacher.code)||0)+1);invigDayLoad.set(teacher.code+'|'+date,(invigDayLoad.get(teacher.code+'|'+date)||0)+1);busyCell.add(teacher.code+'|'+c);
        if(!invigilatorDates.has(teacher.code))invigilatorDates.set(teacher.code,new Set());invigilatorDates.get(teacher.code).add(date);
      }
    }
  }
  for(const c of activeCells){
    const [date,slotId]=c.split('|'),slot=slotById.get(slotId)||{};
    for(let position=1;position<=relieversPerSession;position++){
      const candidates=teachers.filter(teacher=>{
        if(unavailable(teacher,date,slotId)||busyCell.has(teacher.code+'|RELIEF|'+c))return false;
        if(invigilatorDates.get(teacher.code)?.has(date))return false;
        if((reliefLoad.get(teacher.code)||0)>=Math.max(1,Number(teacher.maxReliefDuties)||3))return false;
        return true;
      }).sort((a,b)=>(reliefLoad.get(a.code)||0)-(reliefLoad.get(b.code)||0)||a.name.localeCompare(b.name));
      const teacher=candidates[0];
      if(!teacher){unfilled.push({role:'Reliever',date,slotId,roomId:'—',reason:'No available non-invigilating teacher satisfies the same-day separation rule.'});continue}
      relievers.push({date,day:dayName(date),slotId,session:slot.name||slotId,teacherCode:teacher.code,teacherName:teacher.name,position,startTime:text(settings.relieverStartTime)||slot.startTime,endTime:text(settings.relieverEndTime)||slot.endTime});
      reliefLoad.set(teacher.code,(reliefLoad.get(teacher.code)||0)+1);busyCell.add(teacher.code+'|RELIEF|'+c);
    }
  }
  return {invigilation,relievers,unfilled,loads:{invigilation:Object.fromEntries(invigLoad),relief:Object.fromEntries(reliefLoad)}};
}

export function validateDutyRoster(workspace={}){
  const duties=workspace.duties||{invigilation:[],relievers:[],unfilled:[]},issues=[];
  const invigDates=new Set((duties.invigilation||[]).map(item=>item.teacherCode+'|'+item.date));
  const teachers=new Map((workspace.teachers||[]).map(item=>[item.code,item]));
  const occupied=new Set();
  for(const item of duties.invigilation||[]){
    const teacher=teachers.get(item.teacherCode),cell=item.teacherCode+'|'+item.date+'|'+item.slotId;
    if(!teacher||teacher.active===false)issues.push({level:'error',code:'INELIGIBLE_INVIGILATOR',message:(item.teacherName||item.teacherCode)+' is not currently eligible for invigilation.'});
    else if(unavailable(teacher,item.date,item.slotId))issues.push({level:'error',code:'UNAVAILABLE_INVIGILATOR',message:item.teacherName+' is unavailable on '+displayDate(item.date)+' · '+item.slotId+'.'});
    if(occupied.has(cell))issues.push({level:'error',code:'DUPLICATE_SESSION_DUTY',message:item.teacherName+' has more than one duty in '+item.slotId+' on '+displayDate(item.date)+'.'});else occupied.add(cell);
  }
  for(const item of duties.relievers||[])if(invigDates.has(item.teacherCode+'|'+item.date))issues.push({level:'error',code:'SAME_DAY_DUAL_ROLE',message:item.teacherName+' is both invigilator and reliever on '+displayDate(item.date)+'.'});
  for(const item of duties.relievers||[]){
    const teacher=teachers.get(item.teacherCode),cell=item.teacherCode+'|'+item.date+'|'+item.slotId;
    if(!teacher||teacher.active===false)issues.push({level:'error',code:'INELIGIBLE_RELIEVER',message:(item.teacherName||item.teacherCode)+' is not currently eligible for relieving duty.'});
    else if(unavailable(teacher,item.date,item.slotId))issues.push({level:'error',code:'UNAVAILABLE_RELIEVER',message:item.teacherName+' is unavailable on '+displayDate(item.date)+' · '+item.slotId+'.'});
    if(occupied.has(cell))issues.push({level:'error',code:'DUPLICATE_SESSION_DUTY',message:item.teacherName+' has more than one duty in '+item.slotId+' on '+displayDate(item.date)+'.'});else occupied.add(cell);
  }
  for(const item of duties.unfilled||[])issues.push({level:'error',code:'UNFILLED_DUTY',message:item.role+' duty is unfilled on '+displayDate(item.date)+' · '+item.slotId+(item.roomId&&item.roomId!=='—'?' · '+item.roomId:'')+'.'});
  return {valid:!issues.some(item=>item.level==='error'),issues,invigilation:(duties.invigilation||[]).length,relievers:(duties.relievers||[]).length,unfilled:(duties.unfilled||[]).length};
}

export function createWorkspaceFromMaster(master={}){
  const model=deriveExamModel(master),today=new Date(),end=new Date(today);end.setDate(end.getDate()+20);
  return {schemaVersion:1,name:'New Examination Schedule',description:'',sourceSchedule:model.schedule,classes:model.classes,papers:model.papers,teachers:model.teachers,
    settings:{startDate:dateKey(today),endDate:dateKey(end),cadence:'continuous',excludedWeekdays:[0],excludedDates:[],customDates:[],maxExamsPerClassPerDay:1,groupSameSubject:true,invigilatorsPerRoom:1,maxInvigilationPerDay:1,relieversPerSession:1,relieverStartTime:'10:30',relieverEndTime:'11:00',avoidOwnSubject:false},
    slots:[{id:'SESSION_1',name:'Morning',startTime:'09:00',endTime:'12:00',durationMinutes:180}],timetable:{events:[],unplaced:[],dates:[],slots:[]},duties:{invigilation:[],relievers:[],unfilled:[]},updatedAtMs:Date.now()};
}
