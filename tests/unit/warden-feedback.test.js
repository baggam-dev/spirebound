import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {wardenArriving} from '../../src/combat/warden-arrival.js';
import {startWardenMelee,updateWardenMelee,wardenSlashHits} from '../../src/combat/warden-attacks.js';
import {updatePattern} from '../../src/combat/patterns.js';
import {castUltimate} from '../../src/combat/abilities.js';

function sleeping(){const s=newRun(912,{campaign:'expanded'});s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');s.player.mainSkill='fire';s.player.fire=1;enterRoom(s);return s;}
test('first warden arrival permits movement but blocks every combat simulation path for one second',()=>{
 const s=sleeping(),r=currentRoom(s),e=r.enemies[0];r.obstacles=[];s.player.x=480;s.player.y=300;e.x=480;e.y=300;
 s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};s.player.sunFairy=3;s.player.snowFairy=3;s.player.stormFairy=3;s.player.aura=3;
 e.burn=2;e.burnDamage=100;r.hazards=[{kind:'puddle',phase:'active',x:480,y:300,r:150,time:2,damage:30}];
 s.projectiles=[{x:e.x,y:e.y,vx:0,vy:0,life:2,enemy:false,damageScale:10,hit:[],pierce:0}];
 const hp=e.hp,playerHp=s.player.hp,x=s.player.x;assert.equal(castUltimate(s),false);
 for(let i=0;i<30;i++){const result=stepRun(s,1/60,{x:1,y:0});assert.equal(result.events.includes('shot'),false);}
 assert.equal(e.hp,hp);assert.equal(s.player.hp,playerHp);assert.ok(s.player.x>x);assert.equal(wardenArriving(s),true);
 // The synthetic hazard above deliberately omits save-only metadata; remove it for roundtrip.
 r.hazards=[];s.projectiles=[];s.player.sunFairy=1;s.player.snowFairy=1;s.player.stormFairy=1;
 const loaded=parseSave(encodeSave(s));assert.ok(currentRoom(loaded).wardenArrival>0);assert.ok(currentRoom(loaded).wardenArrival<1);
 for(let i=0;i<31;i++)stepRun(s,1/60);assert.equal(wardenArriving(s),false);
});
test('reentry and return do not replay awakening',()=>{
 const s=sleeping(),r=currentRoom(s);r.wardenArrival=0;enterRoom(s);assert.equal(r.wardenArrival,0);
 r.seen=false;s.key=true;enterRoom(s);assert.equal(r.wardenArrival,0);
});
test('warden cleave locks facing, respects walls and gives recovery',()=>{
 const e={x:400,y:250,type:'boss',hp:100,tier:1},p={x:465,y:250};assert.equal(startWardenMelee(e,p),true);assert.equal(e.pattern,'cleave');
 p.x=350;assert.equal(updateWardenMelee(e,p,[],.38),0);assert.equal(e.attackPhase,'firing');updateWardenMelee(e,p,[],.12);assert.equal(e.attackPhase,'recover');assert.ok(e.attackTime>=.8);
 assert.equal(wardenSlashHits({...e,patternAim:0},{x:470,y:250},[{x:430,y:210,w:10,h:80}]),false);
});
test('warden charge hits once, stops at walls and cannot immediately repeat',()=>{
 const e={x:300,y:250,type:'boss',hp:100,tier:1},p={x:480,y:250};assert.equal(startWardenMelee(e,p),true);assert.equal(e.pattern,'charge');const aim=e.patternAim;p.y=280;
 updateWardenMelee(e,p,[],.55);let damage=0;for(let i=0;i<40;i++)damage+=updatePattern(e,p,[],.02,[]);
 assert.equal(e.patternAim,aim);assert.equal(damage,18);assert.ok(e.wardenChargeCd>0);assert.equal(e.attackPhase,'recover');
 const wall={...e,x:300,y:250,attackPhase:'dash',attackTime:.5,wardenHit:false};updateWardenMelee(wall,p,[{x:350,y:200,w:30,h:100}],.2);assert.equal(wall.attackPhase,'recover');assert.ok(wall.x<=318);
});
test('only floor2 warden gets shorter jump warning and faster movement',()=>{
 for(const [tier,time] of [[1,.9],[3,1.1]]){const e={type:'boss',tier,x:300,y:250,hp:100,cd:0,patternIndex:1,wardenChargeCd:9,wardenSlashCd:9};updatePattern(e,{x:420,y:250},[],0,[]);assert.equal(e.pattern,'slam');assert.equal(e.attackTime,time);}
});
