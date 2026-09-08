// VKVTT QB Paper Builder — deterministic local scoring rules
// Shared by the builder, Paper Health and print preview. No Firestore access or writes.
(function(root){
  const round=n=>Math.round((Number(n)||0)*1000)/1000;
  const mark=q=>Math.max(0,Number(q?.marks)||0);
  const questions=s=>Array.isArray(s?.questions)?s.questions:[];
  function sectionScore(section){
    const qs=questions(section),marks=qs.map(mark),availableMarks=round(marks.reduce((a,m)=>a+m,0));
    const raw=Number(section?.attemptAny),attemptAny=Number.isFinite(raw)&&raw>0?Math.floor(raw):0;
    const result={valid:true,mode:attemptAny?'attempt_any':'all',attemptAny,questionCount:qs.length,questionMarks:marks,availableMarks,countedMarks:availableMarks,problems:[]};
    if(!attemptAny)return result;
    if(!qs.length){result.valid=false;result.countedMarks=null;result.problems.push(`Answer Any ${attemptAny} is set, but this section has no questions.`);return result}
    if(attemptAny>qs.length){result.valid=false;result.countedMarks=null;result.problems.push(`Answer Any ${attemptAny} is set, but this section has only ${qs.length} question${qs.length===1?'':'s'}.`);return result}
    if(attemptAny===qs.length)return result;
    const first=marks[0],equal=marks.every(m=>Math.abs(m-first)<0.001);
    if(!equal){
      result.valid=false;result.countedMarks=null;
      result.problems.push(`Answer Any ${attemptAny} requires equal marks for all ${qs.length} choices; otherwise the paper total is ambiguous.`);
      return result;
    }
    result.countedMarks=round(attemptAny*first);
    return result;
  }
  function paperScore(paper){
    const sections=(Array.isArray(paper?.sections)?paper.sections:[]).map(sectionScore);
    const valid=sections.every(s=>s.valid);
    const availableMarks=round(sections.reduce((a,s)=>a+s.availableMarks,0));
    const counted=sections.reduce((a,s)=>a+(s.valid?s.countedMarks:0),0);
    return{valid,sections,availableMarks,countedMarks:valid?round(counted):null,problems:sections.flatMap((s,i)=>s.problems.map(x=>`Section ${String.fromCharCode(65+i)}: ${x}`))};
  }
  root.__vkvQbPaperScoring={sectionScore,paperScore};
})(typeof window!=='undefined'?window:globalThis);
