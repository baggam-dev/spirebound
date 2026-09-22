import test from 'node:test';
import assert from 'node:assert/strict';
import {strengthenGateKnight} from './balance.js';
import {startUpperAttack,updateUpper} from './upper-floors.js';
import {newRun} from './engine.js';
import {encodeSave,parseSave} from './storage.js';
test('gate knight health upgrade preserves health ratio and cannot stack across reloads',()=>{
 const e={type:'starKnight',gateTitle:'Cald',hp:500,max:1000};strengthenGateKnight(e);assert.equal(e.max,1100);assert.equal(e.hp,550);strengthenGateKnight(e);assert.equal(e.max,1100);
 const s=newRun(42),knight=s.floors[6].find(r=>r.gate).enemies.find(e=>e.type==='starKnight');assert.equal(knight.gateKnightBuff,1);const max=knight.max;const loaded=parseSave(encodeSave(s));assert.equal(loaded.floors[6].find(r=>r.gate).enemies.find(e=>e.type==='starKnight').max,max);
 e.hp=0;delete e.gateKnightBuff;strengthenGateKnight(e);assert.equal(e.hp,0);
});
test('gate knight walks ten percent faster and has shorter post-attack cooldown',()=>{
 const e={id:0,type:'starKnight',gateTitle:'Cald',hp:100,max:100,x:300,y:270,cd:2},p={x:600,y:270},r={enemies:[e],obstacles:[]};updateUpper(e,p,r,.1,[],()=>{});assert.ok(Math.abs(e.x-309.68)<1e-9);
 startUpperAttack(e,'slash',p,r);updateUpper(e,p,r,.5,[],()=>{});assert.equal(e.darkAttack.time,.5);updateUpper(e,p,r,.5,[],()=>{});assert.equal(e.cd,.585);
});
