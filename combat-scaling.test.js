import test from 'node:test';
import assert from 'node:assert/strict';
import {updatePattern} from './patterns.js';
import {updatePrism} from './prism.js';
import {fireArrow} from './simulation.js';
import {newRun} from './engine.js';
import {migrateEnemies} from './balance.js';
import {hitEnemy} from './progression.js';
test('same archer gains rounds, speed and shorter recovery with ascent and escape',()=>{
 const results=[];
 for(const [tier,escapeDepth] of [[0,0],[4,0],[0,6]]){
  const e={type:'archer',tier,escapeDepth,x:400,y:250,hp:100,cd:0},b=[];
  for(let i=0;i<500&&e.attackPhase!=='recover';i++)updatePattern(e,{x:700,y:250},[],.01,b,escapeDepth>0);
  results.push({count:b.length,speed:Math.hypot(b[0].vx,b[0].vy),rest:e.attackTime});
 }
 for(let i=1;i<results.length;i++){assert.ok(results[i].count>results[i-1].count);assert.ok(results[i].speed>results[i-1].speed);assert.ok(results[i].rest<results[i-1].rest);}
});
test('split has one full arrow and discounted secondary arrows; haste grows ten percent',()=>{
 const s=newRun(1);s.player.split=4;s.player.haste=2;fireArrow(s,{x:700,y:300});assert.equal(s.projectiles.length,5);assert.equal(s.projectiles.filter(b=>b.damageScale===1).length,1);assert.equal(s.projectiles.filter(b=>b.damageScale===.45).length,4);assert.equal(s.attack,.65/1.2);
 const e={x:0,y:0,hp:100};hitEnemy({damage:20},e,[e],[],.45);assert.equal(e.hp,91);
});
test('third prism pattern emits three rotated volleys and survives saved salvo state',()=>{
 let e={type:'boss',x:480,y:200,cd:0,prismTurn:2},b=[];updatePrism(e,{x:600,y:300},[],.01,b);assert.equal(e.prismAttack,'shards');assert.equal(b.length,0);
 while(e.prismPhase==='warning')updatePrism(e,{x:600,y:300},[],.01,b);
 const copy=structuredClone(e),other=[];for(let i=0;i<80;i++){updatePrism(e,{x:600,y:300},[],.01,b);updatePrism(copy,{x:600,y:300},[],.01,other);}
 assert.equal(b.length,36);assert.notEqual(b[0].vx,b[12].vx);assert.deepEqual(e,copy);assert.equal(other.length,24);
});
test('legacy boss HP upgrade preserves wounds and is idempotent without extending maps',()=>{
 const s=newRun(4);s.floors=s.floors.slice(0,4);const e=s.floors[3].at(-1).enemies[0];delete e.bossHealthVersion;delete e.tier;e.max=1000;e.hp=400;migrateEnemies(s);assert.equal(e.max,1500);assert.equal(e.hp,600);assert.equal(e.tier,3);migrateEnemies(s);assert.equal(e.hp,600);assert.equal(e.max,1500);assert.equal(s.floors.length,4);
});
