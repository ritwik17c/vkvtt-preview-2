import assert from 'node:assert/strict';
import {defaultSectionsForClass,deriveMasterVenues,logicalClassName,reconcileSeating,seatingSummary} from '../exam-seating-core.js';

assert.equal(logicalClassName('XI Science'),'XI');
assert.equal(logicalClassName('XII – Humanities'),'XII');
assert.deepEqual(defaultSectionsForClass('B1'),['']);
assert.deepEqual(defaultSectionsForClass('B2'),['']);
assert.deepEqual(defaultSectionsForClass('X'),['Vivek','Anand']);
assert.deepEqual(defaultSectionsForClass('XI'),['Science','Humanities']);
assert.deepEqual(defaultSectionsForClass('XII'),['Science','Humanities']);

const master={
  classes:[{name:'VI Vivek',venue:'Room 6A'},{name:'VI Anand',venue:'Room 6B'},'B1'],
  rooms:[{name:'Auditorium'}],
  records:[{class:'VII Vivek',roomId:'Room 7A'}]
};
const venues=deriveMasterVenues(master,[]);
assert.deepEqual(venues,['Auditorium','B1','Room 6A','Room 6B','Room 7A']);

let seating=reconcileSeating({},['B1','X','XI'],venues);
assert.deepEqual(seating.sectionStrengths.map(item=>[item.className,item.sectionName]),[
  ['B1',''],['X','Vivek'],['X','Anand'],['XI','Science'],['XI','Humanities']
]);
seating.sectionStrengths.forEach((item,index)=>item.strength=[30,35,34,24,21][index]);
seating.venues[0].twoSeaterBenches=20;
seating.venues[1].threeSeaterBenches=35;
let summary=seatingSummary(seating);
assert.equal(summary.totalStudents,144);
assert.equal(summary.totalSeats,145);
assert.equal(summary.balance,1);
assert.equal(summary.ready,true);

seating=reconcileSeating(seating,['B1','XI'],[...venues,'New Hall']);
assert.equal(seating.sectionStrengths.find(item=>item.className==='B1').strength,30);
assert.equal(seating.sectionStrengths.some(item=>item.className==='X'),false);
assert.equal(seating.venues.some(item=>item.name==='New Hall'&&item.source==='master'),true);

console.log('exam-seating-core: all tests passed');
