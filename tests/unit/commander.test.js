import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,bossDefeated,travel} from '../../src/game/engine.js';
import {challengeCommander,commanderPhase,updateCommander,resetCommanderAttack} from '../../src/combat/commander.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {createPractice,practiceBosses} from '../../src/game/boss-practice.js';

function fight(){const s=newRun(123,{campaign:'expanded'});s.generationVersion=30;s.floor=8;s.room=s.floors[8].findIndex(r=>r.type==='boss');s.player.x=480;s.player.y=435;const r=currentRoom(s);assert.equal(challengeCommander(s),true);return {s,r,e:r.enemies[0],p:s.player};}
test('commander challenge is exclusive to expanded ninth floor and survives save',()=>{
 const classic=newRun(123);assert.equal(classic.floors.length,8);
 assert.equal(practiceBosses.some(b=>b.id==='commander'),false);assert.equal(currentRoom(createPractice('commander','frost',123)).enemies[0].variant,'commander');
 const {s,r,e}=fight();assert.equal(challengeCommander(s),false);assert.equal(e.variant,'commander');assert.equal(r.commanderPending,false);
 assert.equal(parseSave(encodeSave(s)).floors[8][s.room].enemies[0].variant,'commander');
 r.enemies=[];assert.equal(bossDefeated(s),'stairs');assert.equal(travel(s,1),true);assert.equal(s.floor,9);
});
test('volley repeats fixed aim with two then three frost arrows',()=>{
 const {e,p,r}=fight(),bullets=[];e.commander.volleyClock=0;e.commander.rainClock=20;e.commander.blinkClock=10;
 updateCommander(e,p,r,.01,bullets,()=>{});assert.equal(e.commander.volley.count,2);p.x=750;
 updateCommander(e,p,r,.55,bullets,()=>{});assert.equal(bullets.length,2);updateCommander(e,p,r,.27,bullets,()=>{});assert.equal(bullets.length,4);
 assert.equal(bullets.every(b=>b.frostArrow),true);assert.deepEqual(bullets.slice(0,2).map(b=>[b.vx,b.vy]),bullets.slice(2).map(b=>[b.vx,b.vy]));
 e.hp=e.max/2;updateCommander(e,p,r,.01,bullets,()=>{});assert.equal(commanderPhase(e),2);assert.equal(e.commander.transition,1.1);assert.equal(bullets.every(b=>b.life===0),true);
 updateCommander(e,p,r,1.1,bullets,()=>{});e.commander.volleyClock=0;updateCommander(e,p,r,.01,bullets,()=>{});assert.equal(e.commander.volley.count,3);
});
test('rain fixes its target, then repeats after twenty seconds without a simultaneous blink',()=>{
 const {e,p,r}=fight(),bullets=[];let hits=0;const c=e.commander;c.rainClock=.01;c.blinkClock=.01;
 updateCommander(e,p,r,.02,bullets,()=>hits++);assert.deepEqual([c.rain.x,c.rain.y],[p.x,415]);assert.equal(c.rainClock,20);p.x=200;
 updateCommander(e,p,r,1.05,bullets,()=>hits++);assert.equal(hits,0);assert.equal(c.blinkClock,.8);assert.ok(c.rainFlash);assert.ok(c.rainClock>18);
 c.rainClock=.01;c.blinkClock=10;p.x=480;updateCommander(e,p,r,.02,bullets,()=>hits++);updateCommander(e,p,r,1.05,bullets,()=>hits++);assert.equal(hits,1);
});
test('blink warns at a safe landing before moving and serializes mid-windup',()=>{
 const {s,e,p,r}=fight(),c=e.commander,bullets=[];c.blinkClock=.01;c.rainClock=20;c.volleyClock=20;
 const origin={x:e.x,y:e.y};updateCommander(e,p,r,.02,bullets,()=>{});assert.deepEqual({x:e.x,y:e.y},origin);assert.ok(c.blink&&Math.hypot(c.blink.x-p.x,c.blink.y-p.y)>=150);
 const saved=parseSave(encodeSave(s));assert.ok(currentRoom(saved).enemies[0].commander.blink);
 updateCommander(e,p,r,.4,bullets,()=>{});assert.notDeepEqual({x:e.x,y:e.y},origin);assert.equal(c.blink,undefined);assert.equal(c.blinkClock,10);
});
test('frost slow expires and re-entry clears stale telegraphs',()=>{
 const {s,e,p}=fight();s.entryGrace=0;p.frostSlow=1.35;const y=p.y;stepRun(s,.5,{x:0,y:-1});assert.ok(p.y<y&&p.y>y-87);assert.ok(Math.abs(p.frostSlow-.85)<1e-9);
 e.commander.volley={aim:0,count:2,time:.4,fired:0};e.commander.rain={x:300,y:300,radius:105,time:.4};enterRoom(s);assert.equal(e.commander.volley,undefined);assert.equal(e.commander.rain,undefined);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
 resetCommanderAttack(e);
});
test('a landed frost arrow slows movement without freezing dodge or corrupting save',()=>{
 const {s,e,p}=fight();s.entryGrace=0;e.commander.volleyClock=10;e.commander.rainClock=10;e.commander.blinkClock=10;
 s.projectiles=[{x:p.x-25,y:p.y,vx:200,vy:0,enemy:true,frostArrow:true,source:'악마 군단장 빙결 화살',damage:9,life:2,hit:[]}];
 const hp=p.hp;stepRun(s,.2);assert.equal(p.hp,hp-1);assert.equal(p.frostSlow,1.35);assert.equal(s.dodge,0);
 assert.equal(parseSave(encodeSave(s)).player.frostSlow,1.35);
});
test('commander keeps flanking, telegraphs a fixed sniper shot, and resumes after save',()=>{
 const {s,e,p,r}=fight(),c=e.commander,bullets=[];
 c.volleyClock=20;c.blinkClock=20;c.rainClock=20;c.snipeClock=.02;
 const start={x:e.x,y:e.y};
 updateCommander(e,p,r,.03,bullets,()=>{});
 assert.ok(c.snipe);assert.equal(bullets.length,0);
 const aimed=c.snipe.aim;p.x+=100;
 assert.ok(currentRoom(parseSave(encodeSave(s))).enemies[0].commander.snipe);
 updateCommander(e,p,r,.72,bullets,()=>{});
 assert.equal(bullets.length,1);assert.equal(bullets[0].frostArrow,true);
 assert.ok(Math.abs(Math.atan2(bullets[0].vy,bullets[0].vx)-aimed)<1e-9);
 for(let i=0;i<180;i++)updateCommander(e,p,r,1/60,bullets,()=>{});
 assert.ok(Math.hypot(e.x-start.x,e.y-start.y)>35);
 assert.ok(currentRoom(parseSave(encodeSave(s))).enemies[0].commander.strafeDirection);
});
