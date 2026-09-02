import assert from 'node:assert/strict';
import {candidateExamDates,createWorkspaceFromMaster,deriveExamModel,generateDutyRoster,generateExamTimetable,validateDutyRoster,validateExamTimetable} from './exam-scheduler-core.js';

const master={
  classes:['X A','X B'],
  teachers:[{code:'AA',name:'Asha'},{code:'BB',name:'Biren'},{code:'CC',name:'Chetan'},{code:'DD',name:'Dipa'},{code:'EE',name:'Esha'}],
  records:[
    {class:'X A',day:'Monday',period:1,entry:'Geography-AA',codes:['AA'],subject:'Geography'},
    {class:'X A',day:'Tuesday',period:1,entry:'English-BB',codes:['BB'],subject:'English'},
    {class:'X B',day:'Monday',period:1,entry:'Geography-AA',codes:['AA'],subject:'Geography'},
    {class:'X B',day:'Tuesday',period:1,entry:'Mathematics-CC',codes:['CC'],subject:'Mathematics'}
  ],
  scheduleProfiles:[{id:'REGULAR',name:'Regular Bell Schedule',times:{1:'08:50–09:30'}}],activeScheduleProfileId:'REGULAR'
};

assert.deepEqual(candidateExamDates({startDate:'2026-09-01',endDate:'2026-09-07',cadence:'continuous',excludedWeekdays:[0]}),['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-07']);
assert.deepEqual(candidateExamDates({startDate:'2026-09-01',endDate:'2026-09-07',cadence:'alternate',excludedWeekdays:[0]}),['2026-09-01','2026-09-03','2026-09-05','2026-09-07']);
assert.deepEqual(candidateExamDates({startDate:'2026-09-01',endDate:'2026-09-07',cadence:'custom',excludedWeekdays:[0],customDates:['2026-09-02','2026-09-06','2026-09-09']}),['2026-09-02']);

const model=deriveExamModel(master);
assert.equal(model.papers.length,4);
assert.equal(model.teachers.find(item=>item.code==='AA').subjectNames[0],'Geography');
assert.equal(model.schedule.name,'Regular Bell Schedule');

const workspace=createWorkspaceFromMaster(master);
Object.assign(workspace.settings,{startDate:'2026-09-01',endDate:'2026-09-05',cadence:'alternate',excludedWeekdays:[0],relieversPerSession:1});
workspace.timetable=generateExamTimetable(workspace);
assert.equal(validateExamTimetable(workspace).valid,true);
assert.equal(workspace.timetable.events.length,4);
const geography=workspace.timetable.events.filter(item=>item.subject==='Geography');
assert.equal(geography.length,2);
assert.equal(geography[0].date,geography[1].date);
assert.equal(geography[0].slotId,geography[1].slotId);

workspace.duties=generateDutyRoster(workspace);
assert.equal(validateDutyRoster(workspace).valid,true);
const invigilatorDates=new Set(workspace.duties.invigilation.map(item=>item.teacherCode+'|'+item.date));
assert.equal(workspace.duties.relievers.some(item=>invigilatorDates.has(item.teacherCode+'|'+item.date)),false);

const leaveAware=createWorkspaceFromMaster(master);
Object.assign(leaveAware.settings,{startDate:'2026-09-01',endDate:'2026-09-05',cadence:'alternate',excludedWeekdays:[0],relieversPerSession:1});
leaveAware.timetable=generateExamTimetable(leaveAware);
leaveAware.teachers.find(item=>item.code==='AA').approvedLeaveDates=['2026-09-01','2026-09-03','2026-09-05'];
leaveAware.duties=generateDutyRoster(leaveAware);
assert.equal([...leaveAware.duties.invigilation,...leaveAware.duties.relievers].some(item=>item.teacherCode==='AA'&&['2026-09-01','2026-09-03','2026-09-05'].includes(item.date)),false);
assert.equal(validateDutyRoster(leaveAware).valid,true);

const impossible=createWorkspaceFromMaster(master);
Object.assign(impossible.settings,{startDate:'2026-09-01',endDate:'2026-09-01',cadence:'continuous',maxExamsPerClassPerDay:1});
impossible.timetable=generateExamTimetable(impossible);
assert.ok(impossible.timetable.unplaced.length>0);
assert.equal(validateExamTimetable(impossible).valid,false);

console.log('exam-scheduler-core: all tests passed');
