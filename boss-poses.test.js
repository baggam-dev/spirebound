import test from 'node:test';
import assert from 'node:assert/strict';
import {bossPose} from './boss-poses.js';
import {updatePattern} from './patterns.js';
import {updatePrism} from './prism.js';
import {startUpperAttack,updateUpper} from './upper-floors.js';
test('warden lift occurs only during the existing leap phase',()=>{
 const e={type:'boss',x:400,y:250,hp:1000,max:1000,cd:0,patternIndex:1},p={x:550,y:250};updatePattern(e,p,[],0,[]);assert.equal(e.pattern,'slam');assert.equal(bossPose(e).stage,'windup');assert.equal(bossPose(e).lift,0);
 updatePattern(e,p,[],1.1,[]);assert.equal(e.attackPhase,'leap');updatePattern(e,p,[],.25,[]);assert.equal(bossPose(e).stage,'air');assert.ok(bossPose(e).lift>40);updatePattern(e,p,[],.25,[]);assert.equal(bossPose(e).stage,'recover');assert.equal(bossPose(e).lift,0);
});
test('prism charge and release follow real warning and beam timing',()=>{
 const e={type:'boss',variant:'prism',x:400,y:250,hp:1000,max:1000,cd:0,prismTurn:1},p={x:550,y:250};updatePrism(e,p,[],0,[]);assert.equal(bossPose(e).stage,'windup');updatePrism(e,p,[],.65,[]);assert.equal(bossPose(e).charge,.5);updatePrism(e,p,[],.65,[]);assert.equal(bossPose(e).stage,'strike');updatePrism(e,p,[],.45,[]);assert.equal(bossPose(e).stage,'recover');
});
test('slime pose follows its own hazard, never another enemy warning',()=>{
 const e={id:1,type:'boss',variant:'slime',hp:100,max:100,stage:0};assert.equal(bossPose(e,{hazards:[{owner:2,phase:'warning',kind:'puddle',time:.2}]}).stage,'idle');
 assert.equal(bossPose(e,{hazards:[{owner:1,phase:'warning',kind:'puddle',time:.2}]}).stage,'windup');assert.equal(bossPose(e,{hazards:[{owner:1,phase:'flight',kind:'puddle',time:.4,flight:.65}]}).stage,'strike');assert.equal(bossPose({...e,phase:'splitJump',phaseTime:.55}).stage,'air');
});
test('king windup changes to follow-through only after the real attack resolves',()=>{
 const e={id:1,type:'boss',variant:'king',x:400,y:250,hp:7200,max:7200,kingStage:1},p={x:440,y:250},room={obstacles:[],enemies:[]};room.enemies=[e];startUpperAttack(e,'slash',p,room);assert.equal(bossPose(e).stage,'windup');let hits=0;updateUpper(e,p,room,.49,[],()=>hits++);assert.equal(hits,0);assert.equal(bossPose(e).stage,'windup');updateUpper(e,p,room,.01,[],()=>hits++);assert.equal(hits,1);assert.equal(bossPose(e).stage,'strike');
});
test('render pose is read-only and reconstructs identically after save or pause',()=>{
 const e=Object.freeze({type:'boss',variant:'king',x:400,y:250,hp:3000,max:7200,darkAttack:Object.freeze({kind:'slash',time:.25,aim:.7,step:1})});const before=JSON.stringify(e);assert.deepEqual(bossPose(e),bossPose(JSON.parse(before)));assert.deepEqual(bossPose(e),bossPose(e));assert.equal(JSON.stringify(e),before);
});
