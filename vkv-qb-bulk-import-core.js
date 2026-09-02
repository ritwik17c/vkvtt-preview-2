/* Pure parsing and validation helpers for teacher/admin QB bulk import. */

const ALIASES={
  className:['class','classname','standard','std','grade'],
  section:['section','sectionstream','stream','division','div'],
  subject:['subject','papersubject'],
  chapter:['chapter','chapterunit','unit','lesson','lessonchaptername'],
  topic:['topic','topicsubtopic','subtopic'],
  learningOutcome:['learningoutcome','competency','competencyassessed','learningoutcomecompetencyassessed'],
  marks:['marks','mark','maxmarks'],
  difficulty:['difficulty','difficultylevel'],
  questionType:['type','questiontype'],
  questionText:['question','questiontext','questionwithonlytexts'],
  answer:['answer','answerkey','expectedanswer'],
  markingScheme:['markingscheme','markingschemenotes','notes'],
  teacherCode:['teachercode','staffcode','shortcode'],
  teacherEmail:['teacheremail','email','emailaddress'],
  teacherName:['teachername','nameoftheteacher','name']
};

export const QB_IMPORT_COLUMNS=[
  'Class','Section / Stream','Subject','Chapter / Unit','Topic / Sub-topic',
  'Learning Outcome','Marks','Difficulty','Question Type','Question','Answer','Marking Scheme'
];

export const QB_QUESTION_TYPES=['Very Short Answer','Short Answer','Long Answer','MCQ','Numerical','Case-based','Competency-based'];
export const QB_DIFFICULTIES=['Easy','Moderate','Difficult'];

export function normaliseHeader(value){
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
}

function text(value){return String(value ?? '').trim()}

function findValue(row,field){
  const wanted=new Set(ALIASES[field] || []),entries=Object.entries(row || {});
  for(const [key,value] of entries) if(wanted.has(normaliseHeader(key))) return value;
  return '';
}

function normaliseDifficulty(value){
  const key=text(value).toLowerCase();
  if(!key || key === 'average' || key === 'medium' || key === 'moderate') return 'Moderate';
  if(key === 'easy') return 'Easy';
  if(key === 'hard' || key === 'difficult') return 'Difficult';
  return text(value);
}

function inferType(question,marks,value){
  const supplied=text(value);
  if(supplied){
    const match=QB_QUESTION_TYPES.find(x=>x.toLowerCase()===supplied.toLowerCase());
    return match || supplied;
  }
  if(/(^|\n)\s*(?:\(?[a-dA-D]\)|[a-dA-D][.)])\s+/.test(question)) return 'MCQ';
  if(Number(marks)<=1) return 'Very Short Answer';
  if(Number(marks)<=3) return 'Short Answer';
  return 'Long Answer';
}

export function normaliseQuestionRow(row={},defaults={}){
  const marksRaw=findValue(row,'marks') || defaults.marks || '';
  const markMatch=text(marksRaw).match(/\d+(?:\.\d+)?/);
  const questionText=text(findValue(row,'questionText') || defaults.questionText);
  const marks=markMatch ? Number(markMatch[0]) : 0;
  return {
    className:text(findValue(row,'className') || defaults.className),
    section:text(findValue(row,'section') || defaults.section),
    subject:text(findValue(row,'subject') || defaults.subject),
    chapter:text(findValue(row,'chapter') || defaults.chapter),
    topic:text(findValue(row,'topic') || defaults.topic),
    learningOutcome:text(findValue(row,'learningOutcome') || defaults.learningOutcome),
    marks,
    difficulty:normaliseDifficulty(findValue(row,'difficulty') || defaults.difficulty),
    questionType:inferType(questionText,marks,findValue(row,'questionType') || defaults.questionType),
    questionText,
    answer:text(findValue(row,'answer') || defaults.answer),
    markingScheme:text(findValue(row,'markingScheme') || defaults.markingScheme),
    teacherCode:text(findValue(row,'teacherCode') || defaults.teacherCode),
    teacherEmail:text(findValue(row,'teacherEmail') || defaults.teacherEmail).toLowerCase(),
    teacherName:text(findValue(row,'teacherName') || defaults.teacherName),
    sourceRow:Number(defaults.sourceRow || 0)
  };
}

export function parseExcelQuestionRows(rows=[],defaults={}){
  return rows.map((row,index)=>normaliseQuestionRow(row,{...defaults,sourceRow:index+2}))
    .filter((item,index)=>item.questionText || Object.values(rows[index]||{}).some(value=>text(value)));
}

function extractTrailingMarks(question,defaultMarks){
  const match=question.match(/\s*[\[(]\s*(\d+(?:\.\d+)?)\s*(?:marks?|m)\s*[\])]\s*$/i);
  if(!match) return {question:question.trim(),marks:Number(defaultMarks)||0};
  return {question:question.slice(0,match.index).trim(),marks:Number(match[1])};
}

function splitWordAnswer(value){
  const source=String(value || '').trim(),matches=[...source.matchAll(/(?:answer|ans(?:wer)?)\s*[:\-]\s*/gi)];
  const marker=matches.at(-1);
  if(!marker)return{question:source,answer:''};
  const answer=source.slice(marker.index+marker[0].length).trim();
  if(!answer)return{question:source,answer:''};
  return{question:source.slice(0,marker.index).trim(),answer};
}

function isLineStart(source,index){
  const start=source.lastIndexOf('\n',index-1)+1;
  return !source.slice(start,index).trim();
}

function numberedQuestionBlocks(rawText='',options={}){
  const source=String(rawText || '').replace(/\r/g,'').replace(/\u00a0/g,' '),inlineSequential=options.inlineSequential===true;
  const marker=/(?:q(?:uestion)?\s*[.:#\-]?\s*)?(\d{1,4})\s*[.):-]\s*/gi,matches=[];
  let found;
  while((found=marker.exec(source))){
    const after=source.slice(marker.lastIndex).trimStart();
    if(!after || /^[\d.,;%)}\]]/.test(after))continue;
    matches.push({no:Number(found[1]),index:found.index,end:marker.lastIndex,lineStart:isLineStart(source,found.index)});
  }
  if(!matches.length)return[];
  let first=matches.findIndex(item=>item.no===1&&item.lineStart);
  if(first<0)first=matches.findIndex(item=>item.lineStart);
  if(first<0)return[];
  const accepted=[matches[first]];
  for(let i=first+1;i<matches.length;i++){
    const candidate=matches[i],previous=accepted.at(-1),expected=previous.no+1;
    if(candidate.no<expected)continue;
    const currentText=source.slice(previous.end,candidate.index);
    const followsAnswer=/(?:answer|ans(?:wer)?)\s*[:\-]/i.test(currentText);
    // Objective sections remain strict because numbers can legitimately occur
    // in options and answers. Explicit 3/5-mark sections are different: Word
    // often stores Q1...Q2...Q3 in one paragraph, so a consecutive number is
    // a safe boundary even when there is no line break or Answer: marker.
    if(candidate.no===expected&&(candidate.lineStart||followsAnswer||inlineSequential))accepted.push(candidate);
    else if(candidate.no>expected&&candidate.lineStart)accepted.push(candidate);
  }
  return accepted.map((item,index)=>({
    no:item.no,
    text:source.slice(item.end,accepted[index+1]?.index ?? source.length).trim()
  })).filter(item=>item.text);
}

// Word can occasionally lose one automatic-list number while retaining the
// full question text. If a numbered sequence jumps by one and the preceding
// captured block contains two complete Answer: lines, split that block into
// two questions instead of silently merging the missing-number question.
function recoverEmbeddedAnsweredQuestions(blocks=[]){
  const out=[];
  for(let i=0;i<blocks.length;i++){
    const block=blocks[i],next=blocks[i+1],gap=next?next.no-block.no:1;
    const answers=[...String(block.text||'').matchAll(/(?:^|\n)\s*(?:answer|ans(?:wer)?)\s*[:\-][^\n]*(?:\n|$)/gi)];
    if(gap>1&&answers.length>1){
      let start=0,no=block.no;
      const take=Math.min(answers.length,gap);
      for(let j=0;j<take;j++){
        const end=answers[j].index+answers[j][0].length,part=block.text.slice(start,end).trim();
        if(part)out.push({no:no++,text:part});
        start=end;
      }
      const tail=block.text.slice(start).trim();
      if(tail&&out.length)out[out.length-1].text+='\n'+tail;
      else if(tail)out.push({no:block.no,text:tail});
    }else out.push(block);
  }
  return out;
}

function wordQuestionItem(block,defaults={}){
  const separated=splitWordAnswer(block.text),parsed=extractTrailingMarks(separated.question,defaults.marks);
  return normaliseQuestionRow({}, {...defaults,questionText:parsed.question,answer:separated.answer||defaults.answer,marks:parsed.marks,sourceRow:block.no});
}

function wordQuestionSections(rawText='',defaults={}){
  const source=String(rawText||'').replace(/\r/g,'').replace(/\u00a0/g,' ');
  // Explicit marks-section headings are strong structure signals. Teachers
  // commonly restart numbering at Q1 under THREE MARKS / FIVE MARKS sections.
  const heading=/^[^\n]*\b(?:(?:3|5)\s*[-–—]?\s*marks?|three\s+marks?|five\s+marks?)\s+questions?\b[^\n]*$/gim;
  const matches=[...source.matchAll(heading)];
  if(!matches.length)return[{body:source,defaults,inlineSequential:false}];
  const sections=[];
  if(matches[0].index>0)sections.push({body:source.slice(0,matches[0].index),defaults,inlineSequential:false});
  for(let i=0;i<matches.length;i++){
    const line=matches[i][0],start=matches[i].index+line.length,end=matches[i+1]?.index??source.length;
    const marks=/\b(?:3\s*[-–—]?\s*marks?|three\s+marks?)\b/i.test(line)?3:5;
    let body=source.slice(start,end);
    // A./B./C. subsection labels inside 3/5-mark banks are headings, not
    // answer options. Removing them prevents a heading being appended to the
    // preceding question when Word stores many questions in one paragraph.
    body=body.replace(/^\s*[A-Z]\.\s+[^\n]{1,100}\s*$/gim,'');
    sections.push({body,defaults:{...defaults,marks,questionType:marks===3?'Short Answer':'Long Answer'},inlineSequential:true});
  }
  return sections;
}

export function parseWordQuestionText(rawText='',defaults={}){
  const items=[];
  for(const section of wordQuestionSections(rawText,defaults)){
    const blocks=recoverEmbeddedAnsweredQuestions(numberedQuestionBlocks(section.body,{inlineSequential:section.inlineSequential}));
    items.push(...blocks.map(block=>wordQuestionItem(block,section.defaults)));
  }
  if(!items.length){
    // A labelled Word template may use one QUESTION: block separated by ---.
    for(const block of String(rawText || '').split(/\n\s*-{3,}\s*\n/g)){
      const question=(block.match(/(?:^|\n)\s*question\s*:\s*([\s\S]*?)(?=\n\s*(?:answer|marks|type|difficulty)\s*:|$)/i)||[])[1];
      if(!question) continue;
      const answer=(block.match(/(?:^|\n)\s*answer\s*:\s*([\s\S]*?)(?=\n\s*(?:marks|type|difficulty)\s*:|$)/i)||[])[1] || '';
      const marks=(block.match(/(?:^|\n)\s*marks?\s*:\s*(\d+(?:\.\d+)?)/i)||[])[1] || defaults.marks;
      const typeValue=(block.match(/(?:^|\n)\s*(?:question\s*)?type\s*:\s*([^\n]+)/i)||[])[1] || defaults.questionType;
      const difficulty=(block.match(/(?:^|\n)\s*difficulty\s*:\s*([^\n]+)/i)||[])[1] || defaults.difficulty;
      items.push(normaliseQuestionRow({}, {...defaults,questionText:question.trim(),answer:answer.trim(),marks,questionType:typeValue,difficulty,sourceRow:items.length+1}));
    }
  }
  return items;
}

function elementText(element){
  const copy=element.cloneNode(true),doc=copy.ownerDocument;
  copy.querySelectorAll('br').forEach(node=>node.replaceWith(doc.createTextNode('\n')));
  copy.querySelectorAll('p,div,tr,li').forEach(node=>node.append(doc.createTextNode('\n')));
  return String(copy.textContent || '').replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

export function parseWordQuestionHtml(rawHtml='',defaults={}){
  if(typeof DOMParser==='undefined'||!String(rawHtml || '').trim())return[];
  const doc=new DOMParser().parseFromString(String(rawHtml),'text/html'),blocks=[];
  for(const list of doc.querySelectorAll('ol')){
    if(list.parentElement?.closest('ol'))continue;
    const entries=[...list.children].filter(child=>child.tagName==='LI');
    if(entries.length<2)continue;
    const texts=entries.map(elementText),questionLike=texts.filter(value=>/[?？]/.test(value)||/(?:answer|ans(?:wer)?)\s*[:\-]/i.test(value)||value.length>=50).length;
    if(entries.length<5&&questionLike<Math.ceil(entries.length/2))continue;
    const start=Math.max(1,Number(list.getAttribute('start'))||1);
    texts.forEach((value,index)=>blocks.push({no:start+index,text:value}));
  }
  return blocks.map(block=>wordQuestionItem(block,defaults));
}

export function parseWordQuestionDocument(source={},defaults={}){
  const fromText=parseWordQuestionText(source.text||'',defaults);
  const fromStructure=parseWordQuestionHtml(source.html||'',defaults);
  return fromStructure.length>fromText.length?fromStructure:fromText;
}

export function importFingerprint(item,teacherKey=''){
  return [teacherKey,item.className,item.section,item.subject,item.questionText]
    .map(value=>text(value).toLowerCase().replace(/\s+/g,' ')).join('|');
}

export function validateQuestionImports(items=[],subjects=[],options={}){
  const subjectMap=new Map(subjects.map(subject=>[String(subject).trim().toLowerCase(),subject]));
  const seen=new Set(),valid=[],duplicates=[];
  for(const original of items.slice(0,500)){
    const item={...original,errors:[]};
    if(!item.className) item.errors.push('Class is required');
    if(!item.subject) item.errors.push('Subject is required');
    else{
      const canonical=subjectMap.get(String(item.subject).trim().toLowerCase());
      if(!canonical) item.errors.push('Subject is not in the active QB Subjects list');
      else item.subject=canonical;
    }
    if(!item.questionText) item.errors.push('Question is required');
    if(!(Number(item.marks)>0)) item.errors.push('Marks must be greater than 0');
    if(options.requireTeacher && !(item.teacherCode || item.teacherEmail)) item.errors.push('Teacher Code or Teacher Email is required');
    const fingerprint=importFingerprint(item,item.teacherCode || item.teacherEmail || options.teacherKey || '');
    if(seen.has(fingerprint)){duplicates.push(item);continue}
    seen.add(fingerprint);
    valid.push(item);
  }
  return {items:valid,duplicates,overflow:Math.max(0,items.length-500),invalid:valid.filter(item=>item.errors.length)};
}
