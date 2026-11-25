import test from 'node:test';
import assert from 'node:assert/strict';
import {strengthenKing} from '../../src/combat/balance.js';
import {startUpperAttack,updateUpper,challengeKing} from '../../src/combat/upper-floors.js';
import {upperAttackProgress} from '../../src/combat/boss-pressure.js';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

function arena(){const e={id:0,type:'boss',variant:'king',x:300,y:200,hp:8000,max:16000,cd:0,kingOverhaulVersion:1},p={x:550,y:200},r={enemies:[e],obstacles:[]},bullets=[];return {e,p,r,bullets,tick:dt=>updateUpper(e,p,r,dt,bullets,()=>{})};}
test('Mordo health upgrade preserves injury and death and applies only once',()=>{
 for(const hp of [0,4000,16000]){const e={type:'boss',variant:'king',hp,max:16000};strengthenKing(e);assert.equal(e.max,21760);assert.equal(e.hp,hp/16000*21760);strengthenKing(e);assert.equal(e.max,21760);assert.equal(e.hp,hp/16000*21760);}
 const e={type:'boss',variant:'archer',max:100,hp:50};strengthenKing(e);assert.equal(e.max,100);assert.equal(e.kingOverhaulVersion,undefined);
});
test('Mordo dash adds separately warned slashes then a single fixed target mark',()=>{
 const {e,p,r,tick}=arena();startUpperAttack(e,'dash',p,r);tick(e.darkAttack.time);assert.ok(e.darkAttack.moving);tick(.32);assert.equal(e.darkAttack.kind,'slash');assert.equal(e.darkAttack.time,.6);assert.equal(upperAttackProgress(e,e.darkAttack),0);tick(.6);assert.equal(e.darkAttack.step,1);tick(e.darkAttack.time);assert.equal(e.darkAttack.kind,'mark');assert.equal(e.darkAttack.chain,undefined);const target=e.darkAttack.tx;p.x=750;tick(.3);assert.equal(e.darkAttack.tx,target);tick(.45);assert.equal(e.darkAttack,undefined);
});
test('Mordo triple mark locks each target and stops after three releases',()=>{
 const {e,p,r,tick}=arena();startUpperAttack(e,'mark',p,r);const first=e.darkAttack.tx;p.x=650;tick(.2);assert.equal(e.darkAttack.tx,first);tick(e.darkAttack.time);assert.equal(e.darkAttack.step,1);assert.equal(e.darkAttack.tx,650);p.x=750;tick(e.darkAttack.time);assert.equal(e.darkAttack.step,2);assert.equal(e.darkAttack.tx,750);tick(e.darkAttack.time);assert.equal(e.darkAttack,undefined);
});
test('evading all dash combo slashes preserves the counter window and skips the mark',()=>{
 const {e,p,r,tick}=arena();startUpperAttack(e,'dash',p,r);tick(e.darkAttack.time);tick(.32);p.x=850;tick(.6);tick(e.darkAttack.time);assert.equal(e.darkAttack,undefined);assert.equal(e.counterReason,'evade');assert.equal(e.opening,1.4);
});
test('Mordo ring releases before separately warned fan and other enemies keep ordinary attacks',()=>{
 const {e,p,r,bullets,tick}=arena();startUpperAttack(e,'ring',p,r);tick(e.darkAttack.time);assert.equal(bullets.length,19);assert.equal(e.darkAttack.kind,'fan');assert.equal(e.darkAttack.time,.8);tick(.79);assert.equal(bullets.length,19);tick(.01);assert.equal(bullets.length,24);assert.equal(e.darkAttack,undefined);
 const other={type:'starBearer',x:300,y:200,hp:50,max:100};startUpperAttack(other,'ring',p,r);assert.equal(other.darkAttack.chain,undefined);
});
test('Mordo chain warning and target survive saves without applying health twice',()=>{
 const s=newRun(23);s.floor=7;s.room=s.floors[7].findIndex(r=>r.type==='boss');assert.ok(challengeKing(s));const r=currentRoom(s),e=r.enemies[0];e.hp=e.max*.5;startUpperAttack(e,'mark',{x:600,y:300},r);updateUpper(e,{x:650,y:300},r,e.darkAttack.time,[],()=>{});updateUpper(e,{x:800,y:300},r,.2,[],()=>{});const loaded=parseSave(encodeSave(s)),copy=currentRoom(loaded).enemies[0];assert.equal(copy.max,e.max);assert.equal(copy.hp,e.hp);assert.deepEqual(copy.darkAttack,e.darkAttack);copy.darkAttack.chain='ringFan';assert.throws(()=>parseSave(encodeSave(loaded)));
});
