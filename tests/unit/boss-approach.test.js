import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {approachIntersection,pendingBoss,startApproachedBoss} from '../../src/world/boss-approach.js';

function waiting(floor){const s=newRun(77,{campaign:'expanded'});s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='boss');s.player.mainSkill='frost';s.player.frost=1;s.attack=99;s.tutorialComplete=true;return {s,r:currentRoom(s)};}

test('approach ellipse catches exact boundaries and a roll crossing with both ends outside',()=>{
 assert.equal(approachIntersection({x:480,y:281},{x:480,y:281}),null);
 assert.deepEqual(approachIntersection({x:480,y:280},{x:480,y:280}),{x:480,y:280});
 const crossing=approachIntersection({x:300,y:190},{x:660,y:190});assert.ok(Math.abs(crossing.x-315)<1e-9);assert.equal(crossing.y,190);
 assert.equal(approachIntersection({x:300,y:281},{x:660,y:281}),null);
});

test('all three pending bosses start through simulation once and stay started after save',()=>{
 for(const [floor,kind] of [[7,'king'],[8,'commander'],[9,'demon']]){
  const {s,r}=waiting(floor);Object.assign(s.player,{x:480,y:285});assert.equal(pendingBoss(s,r),kind);
  assert.ok(!stepRun(s,1/60).events.some(e=>e.startsWith('bossApproach:')));
  s.player.y=279;const result=stepRun(s,1/60);assert.ok(result.events.includes('bossApproach:'+kind));
  assert.equal(pendingBoss(s,r),null);assert.ok(r.enemies.some(e=>e.hp>0));
  assert.ok(!stepRun(s,1/60).events.some(e=>e.startsWith('bossApproach:')));
  const loaded=parseSave(encodeSave(s));assert.equal(pendingBoss(loaded,currentRoom(loaded)),null);
 }
});

test('walls, practice, the return journey and ordinary rooms cannot trigger a pending boss',()=>{
 const {s,r}=waiting(7),from={x:480,y:281},to={x:480,y:279};
 r.obstacles=[{x:440,y:225,w:80,h:20,type:'rock'}];assert.equal(startApproachedBoss(s,r,from,to),null);assert.equal(r.kingPending,true);
 r.obstacles=[];s.key=true;assert.equal(startApproachedBoss(s,r,from,to),null);s.key=false;
 s.practice={};assert.equal(startApproachedBoss(s,r,from,to),null);delete s.practice;
 r.type='normal';assert.equal(startApproachedBoss(s,r,from,to),null);r.type='boss';
 assert.equal(startApproachedBoss(s,r,from,to),'king');assert.equal(startApproachedBoss(s,r,from,to),null);
});
