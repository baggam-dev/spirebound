import test from 'node:test';
import assert from 'node:assert/strict';
import {attackInterval} from './relics.js';
import {encounter} from './encounters.js';
import {upperEncounter} from './formations.js';
import {seededRandom} from './random.js';
import {openingLabel} from './tactics.js';
test('fire reduces firing frequency by thirty percent with every attack-speed build',()=>{
 for(const build of [{},{haste:3,bonusAttack:.25},{evolutions:{haste:'tempo',split:'focus'}}]){
  const p={relics:[],...build};const normal=attackInterval(p);
  for(const fire of [1,2,3])assert.ok(Math.abs(normal/attackInterval({...p,fire})-.7)<1e-10);
  for(const skill of ['poison','frost','chain'])assert.equal(attackInterval({...p,[skill]:3}),normal);
 }
});
test('new room combinations preserve population limits and single upper support',()=>{
 const seen=new Set();
 for(let seed=0;seed<200;seed++)for(const floor of [1,4,6,7]){
  const pack=encounter(floor,seededRandom(Math.imul(seed+1,2654435761)>>>0));assert.ok(pack.length>=4+Math.floor(floor*.65)&&pack.length<=6+Math.floor(floor*.65));
  if(floor>=6){seen.add(pack[0].formation);assert.ok(pack.filter(e=>['gravityMage','starBearer'].includes(e.type)).length<=1);}
  assert.ok(pack.every(e=>e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y)));
 }
 for(const id of ['siege','garden','hunt','bulwark'])assert.ok(seen.has(id),id);
 assert.deepEqual(upperEncounter(7,seededRandom(42)),upperEncounter(7,seededRandom(42)));
});
test('boss openings distinguish earned counters and judgment recovery',()=>{
 assert.equal(openingLabel({counterReason:'cover'}),'충돌! 반격 기회');
 assert.equal(openingLabel({counterReason:'evade'}),'연속 베기 회피! 반격');
 assert.equal(openingLabel({type:'boss',kneel:1}),'심판 종료! 반격 기회');
 assert.equal(openingLabel({type:'boss'}),'공격 기회');
});
