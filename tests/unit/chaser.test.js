import test from 'node:test';
import assert from 'node:assert/strict';
import {updateChaserAttack} from '../../src/combat/chaser.js';
import {newRun} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
test('knife reach triggers before contact, resolves rapidly and respects cooldown',()=>{
 const e={x:200,y:200},p={x:245,y:200};assert.equal(updateChaserAttack(e,p,[],.01),0);assert.equal(e.chaserWindup,.08);assert.equal(updateChaserAttack(e,p,[],.04),0);assert.equal(updateChaserAttack(e,p,[],.04),9);assert.equal(updateChaserAttack(e,p,[],.1),0);assert.ok(e.chaserStrike>0&&e.chaserStrike<.12);
 const far={x:200,y:200};updateChaserAttack(far,{x:245.01,y:200},[],.01);assert.equal(far.chaserWindup,undefined);
});
test('escaping blade reach and walls avoid damage at resolution',()=>{
 for(const wall of [false,true]){const e={x:200,y:200},p={x:240,y:200};updateChaserAttack(e,p,[],.01);if(!wall)p.x=246;assert.equal(updateChaserAttack(e,p,wall?[{x:219,y:180,w:3,h:40}]:[],.08),0);}
 const e={x:200,y:200};updateChaserAttack(e,{x:240,y:200},[{x:219,y:180,w:3,h:40}],.01);assert.equal(e.chaserWindup,undefined);
});
function fixture(){const s=newRun(871);s.tutorialComplete=true;s.attack=999;s.player.x=400;s.player.y=280;s.entryGrace=0;const r=s.floors[s.floor][s.room];r.tutorial=false;r.obstacles=[];r.enemies=[{id:0,type:'chaser',x:430,y:280,hp:100,max:100,cd:2}];return s;}
test('simulation replaces immediate contact and save/resume retains blade timing',()=>{
 const s=fixture(),hp=s.player.hp;stepRun(s,.01);assert.equal(s.player.hp,hp);const restored=parseSave(encodeSave(s));assert.ok(restored);const e=restored.floors[restored.floor][restored.room].enemies[0];assert.equal(e.chaserWindup,.08);stepRun(restored,.04);assert.equal(restored.player.hp,hp);stepRun(restored,.04);assert.ok(restored.player.hp<hp);
});
test('freezing prevents chaser blade progression',()=>{const s=fixture(),e=s.floors[s.floor][s.room].enemies[0];e.frozen=1;e.chaserWindup=.08;stepRun(s,.04);assert.equal(e.chaserWindup,.08);});
