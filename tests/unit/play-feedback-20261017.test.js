import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,neighbor,enrage} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {chargeProfile,chargerRecovering} from '../../src/combat/balance.js';
import {updateUpper} from '../../src/combat/upper-floors.js';
import {commanderProfile} from '../../src/combat/boss-pressure.js';
import {challengeCommander,updateCommander} from '../../src/combat/commander.js';
import {feedbackBodyHeight,feedbackSpriteKey} from '../../src/rendering/feedback-sprites.js';
import {enemyKey,enemyName} from '../../src/world/expedition.js';

test('compact early floors include all facilities and preserve saved maps and tutorial gates',()=>{
 for(let seed=0;seed<150;seed++)for(const campaign of ['classic','expanded']){
  const s=newRun(seed,{campaign});assert.equal(s.floors[0].length,5);assert.equal(s.floors[1].length,6);
  for(const [i,rooms] of s.floors.slice(0,2).entries()){
   assert.ok(rooms.some(r=>r.type==='fountain'));assert.ok(rooms.some(r=>r.type==='treasure'));
   assert.equal(rooms.filter(r=>r.type==='boss').length,i);
   const seen=new Set([0]);let prior;do{prior=seen.size;for(const n of seen)rooms.forEach((r,j)=>{if(Math.abs(r.x-rooms[n].x)+Math.abs(r.y-rooms[n].y)===1)seen.add(j);});}while(prior!==seen.size);assert.equal(seen.size,rooms.length);
  }
  assert.equal([0,1,2,3].filter(d=>neighbor(s,d)>=0).length,1);
  const saved=parseSave(encodeSave(s));assert.deepEqual(saved.floors.map(rs=>rs.map(r=>[r.x,r.y,r.type])),s.floors.map(rs=>rs.map(r=>[r.x,r.y,r.type])));
 }
});
test('trial charger gives a full contact-free stationary recovery after each charge and reload',()=>{
 const s=newRun(12);s.tutorialComplete=true;s.room=3;s.attack=999;s.entryGrace=0;s.player.x=500;s.player.y=270;s.player.damage=1;
 const r=currentRoom(s);r.obstacles=[];r.enemies=[{id:0,type:'charger',x:480,y:270,hp:10000,max:10000,cd:.005,chargeAngle:0,balanceVersion:1,trialChampion:true,escapeDepth:1}];
 stepRun(s,.01);const e=r.enemies[0],q=chargeProfile(e);assert.ok(e.cd>=q.duration+q.warning+1-.001);assert.ok(chargerRecovering(e));
 s.invulnerable=0;const hp=s.player.hp,x=e.x,y=e.y;
 for(let i=0;i<50;i++)stepRun(s,1/60);assert.equal(s.player.hp,hp);assert.equal(e.x,x);assert.equal(e.y,y);
 const round=parseSave(encodeSave(s));assert.equal(chargerRecovering(currentRoom(round).enemies[0]),true);
});
test('sniper and gravity caster move between attacks and hold their position while channeling',()=>{
 for(const type of ['astralSniper','gravityMage']){
  const e={id:0,type,x:720,y:220,hp:100,max:100,cd:2},p={x:480,y:300},r={obstacles:[],enemies:[e]},b=[];
  updateUpper(e,p,r,.1,b,()=>{});assert.ok(Math.hypot(e.x-720,e.y-220)>0);
  if(type==='gravityMage')e.gravity={x:p.x,y:p.y,time:2};else e.darkAttack={kind:'fan',time:.5,aim:0,x:e.x,y:e.y,step:0};
  const origin={x:e.x,y:e.y};updateUpper(e,p,r,.1,b,()=>{});assert.deepEqual({x:e.x,y:e.y},origin);
 }
});
test('Velkar both stages have deliberate recovery, blink followup and serializable longer clocks',()=>{
 for(const phase of [1,2])for(const pressure of [false,true]){
  const s=newRun(44,{campaign:'expanded'});s.floor=8;s.room=s.floors[8].findIndex(r=>r.type==='boss');challengeCommander(s);const r=currentRoom(s),e=r.enemies[0];if(!pressure)delete e.bossPressureVersion;e.hp=e.max*(phase===1?1:.4);e.commander.phase=phase;
  const q=commanderProfile(e);assert.ok(q.recovery>=(pressure?(phase===1?1.3:.98):1.76));assert.ok(q.beat>=(pressure?(phase===1?.28:.24):.35));
  e.commander.rainClock=0;updateCommander(e,s.player,r,.01,[],()=>{});assert.ok(parseSave(encodeSave(s)));e.commander.rain.time=q.rainWindup;assert.ok(parseSave(encodeSave(s)));
 }
});
test('named guardians have separate identity and art while display scale never changes combat radius',()=>{
 const kald={type:'starKnight',gateTitle:'王'},vera={type:'astralSniper',gateTitle:'星'};
 assert.equal(feedbackSpriteKey(kald),'kald');assert.equal(enemyKey(kald),'kald');assert.ok(enemyName(kald).includes('칼드'));
 assert.equal(feedbackSpriteKey(vera),'vera');assert.equal(enemyKey(vera),'vera');assert.ok(enemyName(vera).includes('베라'));
 assert.equal(feedbackBodyHeight('king1'),84*1.1);assert.ok(Math.abs(feedbackBodyHeight('commander1')-84*.9)<1e-10);
 const s=newRun(11);enrage(s);assert.ok(parseSave(encodeSave(s)));
});
