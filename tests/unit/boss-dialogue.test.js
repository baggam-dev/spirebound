import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossDialogue} from '../../src/rendering/boss-dialogue.js';
import {BOSS_LINES,validBossDialogueSeen} from '../../src/ui/boss-dialogue-data.js';
import {newRun} from '../../src/game/engine.js';
import {encodeSave,parseSave,validateRun} from '../../src/persistence/storage.js';

const enemy=(variant,id=1)=>({id,type:variant==='kald'?'starKnight':variant==='vera'?'astralSniper':'boss',variant:['kald','vera'].includes(variant)?undefined:variant,gateTitle:['kald','vera'].includes(variant)?variant:undefined,x:480,y:190,hp:100,max:100,stage:0});
function fixture(enemies,extra={}){const room={type:'boss',seen:false,enemies,hazards:[],...extra};return {floors:[[room]],floor:0,room:0,player:{x:480,y:420},projectiles:[],key:false};}
const result=(...ids)=>({events:[],effects:ids.map(enemyId=>({enemyFeedback:'death',enemyId}))});

test('introductions occur once, speech controls do not advance actor or run clocks',()=>{
 const run=fixture([enemy('warden')]),saved=JSON.stringify(run.floors),d=createBossDialogue(run);run.elapsed=7;d.observe();
 assert.equal(d.blocking,true);assert.deepEqual(d.lines,['.......']);d.tick(10);assert.equal(d.blocking,true);assert.equal(run.elapsed,7);assert.equal(JSON.stringify(run.floors),saved);
 d.skip();d.observe();assert.equal(d.blocking,false);assert.deepEqual(d.lines,[]);assert.equal(run.bossDialogueSeen.length,1);
});

test('a loaded seen encounter suppresses old introductions and phases, but future phases still speak',()=>{
 const e=enemy('king');e.hp=50;const run=fixture([e]);run.floors[0][0].seen=true;
 const d=createBossDialogue(run,{loaded:true});d.observe();assert.deepEqual(d.lines,[]);assert.ok(run.bossDialogueSeen.includes('0:0:king:phase2'));
 const before=d.capture();e.hp=20;d.after(before,result());assert.deepEqual(d.lines,[]);assert.ok(run.bossDialogueSeen.includes('0:0:king:phase3'));
 const next=fixture([enemy('commander')]),c=createBossDialogue(next);c.observe();c.skip();const state=c.capture();next.floors[0][0].enemies[0].hp=40;c.after(state,result());assert.deepEqual(c.lines,BOSS_LINES.commander.phase2);assert.equal(c.blocking,false);
});

test('slime splitting never repeats its introduction or final collective death line',()=>{
 const run=fixture([enemy('slime')]),r=run.floors[0][0],d=createBossDialogue(run);d.observe();d.next();const before=d.capture();
 r.enemies=[{...enemy('slime',2),stage:1},{...enemy('slime',3),stage:1}];d.after(before,result(1));assert.deepEqual(d.lines,[]);
 const last=d.capture();r.enemies=[];d.after(last,result(2,3));assert.deepEqual(d.lines,BOSS_LINES.slime.death);assert.equal(d.blocking,true);d.next();d.after(last,result(2,3));assert.deepEqual(d.lines,[]);
});

test('gate dialogue is sequential and respects both guardian death orders',()=>{
 for(const first of ['kald','vera']){
  const run=fixture([enemy('kald',1),enemy('vera',2)],{gate:true}),r=run.floors[0][0],d=createBossDialogue(run);d.observe();
  assert.deepEqual(d.lines,BOSS_LINES.kald.intro);d.next();assert.deepEqual(d.lines,BOSS_LINES.vera.intro);d.next();
  const before=d.capture(),dead=r.enemies.find(e=>e.gateTitle===first);r.enemies=r.enemies.filter(e=>e!==dead);d.after(before,result(dead.id));
  assert.deepEqual(d.lines,BOSS_LINES[first].death);assert.equal(d.blocking,false);d.skip();
  const remaining=d.capture(),last=r.enemies[0];r.enemies=[];d.after(remaining,result(last.id));
  assert.deepEqual(d.lines,first==='kald'?BOSS_LINES.vera.last:[]);assert.equal(d.blocking,first==='kald');
 }
});

test('practice, return encounters and summoned bosses do not create story interruptions',()=>{
 for(const variant of [{practice:true},{key:true},{}]){
  const run=Object.assign(fixture([{...enemy('prism'),summoned:!variant.practice&&!variant.key}]),variant),d=createBossDialogue(run);d.observe();assert.equal(d.blocking,false);assert.deepEqual(d.lines,[]);
 }
});

test('a skill kill between simulation ticks still produces its single death line',()=>{
 const e=enemy('prism'),run=fixture([e]),r=run.floors[0][0],d=createBossDialogue(run);d.observe();d.skip();e.hp=0;
 const before=d.capture();r.enemies=[];d.after(before,result(e.id));assert.deepEqual(d.lines,BOSS_LINES.prism.death);assert.equal(d.blocking,true);
});

test('only the emerging demon core gets a safe first reading, including immediate hazards',()=>{
 const hand={...enemy('demon'),part:'hand'},run=fixture([hand]),r=run.floors[0][0],d=createBossDialogue(run);d.observe();assert.deepEqual(d.lines,[]);
 r.enemies=[{...enemy('demon',2),part:'core'}];r.demon={special:{kind:'hellFlame'}};r.hazards=[{phase:'warning'}];d.observe();
 assert.equal(d.blocking,true);assert.deepEqual(d.lines,BOSS_LINES.demon.intro);d.tick(7);assert.equal(d.blocking,true);d.skip();d.observe();assert.equal(d.blocking,false);
});

test('nonblocking phase lines hide during hazards and expire without changing combat state',()=>{
 const e=enemy('king'),run=fixture([e]),r=run.floors[0][0],d=createBossDialogue(run);d.observe();d.skip();const before=d.capture();e.hp=60;d.after(before,result());
 r.hazards=[{phase:'warning'}];const saved=JSON.stringify(run.floors);let plaques=0;
 const ctx={save(){},restore(){},measureText(s){return {width:s.length*14};},fillRect(){plaques++;},strokeRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}};
 d.draw(ctx);assert.equal(plaques,0);d.tick(6);assert.deepEqual(d.lines,[]);assert.equal(JSON.stringify(run.floors),saved);
});

test('optional bounded event history round trips; corrupt dialogue IDs cannot poison a save',()=>{
 const run=newRun(31);assert.equal(validBossDialogueSeen(undefined),true);validateRun(run);
 run.bossDialogueSeen=['1:0:warden:intro','7:2:king:phase2'];assert.deepEqual(parseSave(encodeSave(run)).bossDialogueSeen,run.bossDialogueSeen);
 for(const value of [null,['1:0:warden:intro','1:0:warden:intro'],['10:0:king:intro'],['1:0:unknown:intro'],Array(129).fill('1:0:warden:intro')]){
  assert.equal(validBossDialogueSeen(value),false);assert.throws(()=>validateRun({...run,bossDialogueSeen:value}));
 }
});
