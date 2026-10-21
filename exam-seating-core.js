const text=value=>String(value??'').trim();
const unique=values=>[...new Set(values.map(text).filter(Boolean))];

export function logicalClassName(value){
  return text(value).replace(/^class\s+/i,'').replace(/\s+/g,' ')
    .replace(/^((?:XI|XII))\s*(?:[-–]\s*|\s+|\(\s*)(?:SCI(?:ENCE)?|ARTS?|HUMANITIES)\s*\)?$/i,(_,grade)=>grade.toUpperCase())
    .replace(/(?:\s*[-–]\s*|\s+)(?:SECTION\s*)?(?:VIVEK|ANAND)$/i,'').trim();
}

export function defaultSectionsForClass(value){
  const className=logicalClassName(value).toUpperCase();
  if(/^B[12]$/.test(className))return [''];
  if(/^(XI|XII)$/.test(className))return ['Science','Humanities'];
  return ['Vivek','Anand'];
}

function itemName(item){
  if(typeof item==='string')return text(item);
  if(!item||typeof item!=='object')return '';
  return text(item.name||item.venueName||item.roomName||item.venue||item.room||item.roomId||item.id||item.className||item.class);
}

export function deriveMasterVenues(rawMaster={},fallbackNames=[]){
  const master=rawMaster?.data&&typeof rawMaster.data==='object'?{...rawMaster,...rawMaster.data}:rawMaster;
  const values=[];
  for(const listName of ['venues','rooms','classVenues']){
    const source=master?.[listName];
    if(Array.isArray(source))for(const item of source){const name=itemName(item);if(name)values.push(name)}
    else if(source&&typeof source==='object')for(const [name,item] of Object.entries(source)){values.push(itemName(item)||name)}
  }
  const classSource=master?.classes||[];
  const classItems=Array.isArray(classSource)?classSource:Object.entries(classSource).map(([name,item])=>item&&typeof item==='object'?{name,...item}:name);
  for(const item of classItems){
    if(typeof item==='string'){values.push(item);continue}
    const explicit=text(item?.venueName||item?.roomName||item?.venue||item?.room||item?.roomId);
    values.push(explicit||itemName(item));
  }
  for(const record of master?.records||[]){
    values.push(text(record?.venueName||record?.roomName||record?.venue||record?.room||record?.roomId||record?.classVenue||record?.className||record?.class));
  }
  values.push(...fallbackNames);
  return unique(values).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
}

export function reconcileSeating(existing={},selectedClasses=[],masterVenueNames=[]){
  const classes=unique(selectedClasses.map(logicalClassName)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
  const oldStrengths=new Map((existing.sectionStrengths||[]).map(item=>[text(item.className)+'|'+text(item.sectionName),item]));
  const sectionStrengths=[];
  for(const className of classes)for(const sectionName of defaultSectionsForClass(className)){
    const old=oldStrengths.get(className+'|'+sectionName)||{};
    sectionStrengths.push({className,sectionName,strength:Math.max(0,Number(old.strength)||0),startingRollNo:Math.max(1,Number(old.startingRollNo)||1)});
  }
  const oldVenues=new Map((existing.venues||[]).map(item=>[text(item.name).toLowerCase(),item]));
  const venues=[];
  for(const name of unique(masterVenueNames)){
    const old=oldVenues.get(name.toLowerCase())||{};
    venues.push({id:text(old.id)||'VENUE_'+name.toUpperCase().replace(/[^A-Z0-9]+/g,'_'),name,source:'master',active:old.active!==false,twoSeaterBenches:Math.max(0,Number(old.twoSeaterBenches)||0),threeSeaterBenches:Math.max(0,Number(old.threeSeaterBenches)||0),benchesPerRow:Math.max(1,Math.min(6,Number(old.benchesPerRow)||3)),mixingMode:old.mixingMode==='manual'?'manual':'auto',mixClassCount:Number(old.mixClassCount)===3?3:2});
    oldVenues.delete(name.toLowerCase());
  }
  for(const old of oldVenues.values())venues.push({id:text(old.id)||'VENUE_'+Date.now(),name:text(old.name),source:old.source==='master'?'master':'manual',active:old.active!==false,twoSeaterBenches:Math.max(0,Number(old.twoSeaterBenches)||0),threeSeaterBenches:Math.max(0,Number(old.threeSeaterBenches)||0),benchesPerRow:Math.max(1,Math.min(6,Number(old.benchesPerRow)||3)),mixingMode:old.mixingMode==='manual'?'manual':'auto',mixClassCount:Number(old.mixClassCount)===3?3:2});
  return {schemaVersion:3,sectionStrengths,venues,plan:existing.plan&&typeof existing.plan==='object'?existing.plan:null,updatedAtMs:Number(existing.updatedAtMs)||Date.now()};
}

export function seatingSummary(seating={}){
  const rows=seating.sectionStrengths||[],venues=(seating.venues||[]).filter(item=>item.active!==false);
  const totalStudents=rows.reduce((sum,item)=>sum+Math.max(0,Number(item.strength)||0),0);
  const totalSeats=venues.reduce((sum,item)=>sum+2*Math.max(0,Number(item.twoSeaterBenches)||0)+3*Math.max(0,Number(item.threeSeaterBenches)||0),0);
  return {classCount:new Set(rows.map(item=>item.className)).size,sectionCount:rows.length,missingStrengths:rows.filter(item=>!(Number(item.strength)>0)).length,venueCount:venues.length,totalStudents,totalSeats,balance:totalSeats-totalStudents,ready:rows.length>0&&rows.every(item=>Number(item.strength)>0)&&totalSeats>=totalStudents};
}
