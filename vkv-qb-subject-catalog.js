/* Shared Question Bank subject catalogue.
   Every QB/QP dropdown must use this file so subjects added in QB Administration
   are visible consistently without changing the Master Timetable. */

export const DEFAULT_QB_SUBJECTS = [
  'English','Assamese','Hindi','Sanskrit','Mathematics','Environmental Studies','EVS',
  'Science','Social Science','Physics','Chemistry','Biology','History','Geography',
  'Political Science','Economics','Accountancy','Business Studies','Computer Science',
  'Informatics Practices','Artificial Intelligence','Information Technology',
  'Physical Education','Art Education','Work Experience','Value Education',
  'General Knowledge','Music','Yoga'
];

export function normaliseQBSubject(value){
  return String(value || '').trim().replace(/\s+/g,' ').toLowerCase();
}

function add(map,value){
  value=String(value || '').trim().replace(/\s+/g,' ');
  if(value && value.length < 100 && !/^[-–—]+$/.test(value)) map.set(normaliseQBSubject(value),value);
}

function addValue(map,value){
  if(typeof value === 'string') return add(map,value);
  if(Array.isArray(value)) return value.forEach(item=>addValue(map,item));
  if(value && typeof value === 'object') add(map,value.name || value.subject || value.subjectName || value.title || value.label || '');
}

function recordCodes(record,root){
  if(Array.isArray(record?.codes) && record.codes.length) return record.codes.map(String).filter(Boolean);
  const entry=String(record?.entry || '');
  const known=(root.teachers || []).map(t=>String(t?.code || t?.shortCode || '')).filter(Boolean);
  return known.filter(code=>code && new RegExp('(^|[^A-Za-z0-9])'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^A-Za-z0-9])').test(entry));
}

function recordSubject(record,root){
  let subject=String(record?.subject || record?.subjectName || record?.assignment || record?.entry || '').trim();
  for(const code of recordCodes(record,root)){
    subject=subject.replace(new RegExp('(^|[-/ ,&])'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[-/ ,&])','g'),'$1');
  }
  return subject.replace(/[\s\-\/,&]+$/g,'').trim() || String(record?.entry || '').trim();
}

export function collectMasterQBSubjects(root={}){
  const subjects=new Map(),seen=new Set();
  const subjectKeys=new Set(['subject','subjectname','subjects','teachingsubject','teachingsubjects','papersubject','papersubjects']);
  function walk(value,depth=0){
    if(!value || depth > 8 || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if(Array.isArray(value)) return value.forEach(item=>walk(item,depth+1));
    for(const [key,child] of Object.entries(value)){
      const cleanKey=String(key).replace(/[^a-z]/gi,'').toLowerCase();
      if(subjectKeys.has(cleanKey)) addValue(subjects,child);
      if(child && typeof child === 'object') walk(child,depth+1);
    }
  }
  walk(root);
  for(const record of root.records || []) add(subjects,recordSubject(record,root));
  for(const record of root.assignmentCards || []) add(subjects,record?.subject || record?.subjectName || record?.assignment || '');
  return [...subjects.values()].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
}

export function activeQBSubjects(master={},config={},fallbacks=DEFAULT_QB_SUBJECTS){
  const excluded=new Set([
    ...(config.excludedSubjects || []),
    ...(config.excludedCanonicalSubjects || [])
  ].map(normaliseQBSubject));
  const subjects=new Map();
  const addActive=value=>{
    const key=normaliseQBSubject(value);
    if(key && !excluded.has(key)) add(subjects,value);
  };
  const confirmed=Array.isArray(config.canonicalSubjects) && config.canonicalSubjects.length
    ? config.canonicalSubjects
    : null;
  if(confirmed){
    confirmed.forEach(addActive);
  }else{
    collectMasterQBSubjects(master).forEach(addActive);
    (config.syncedMasterSubjects || []).forEach(addActive);
    (fallbacks || []).forEach(addActive);
  }
  // Subjects added explicitly in QB Administration always remain part of the
  // catalogue unless the same subject was deliberately excluded.
  (config.extraSubjects || []).forEach(addActive);
  return [...subjects.values()].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
}

