import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,travel,bossDefeated,currentRoom,canEscape,generateFloor} from './engine.js';
import {updatePrism} from './prism.js';
import {encodeSave,parseSave} from './storage.js';
test('six connected floors place three bosses and flowers only on upper ascent floors',()=>{
 for(let seed=0;seed<60;seed++){
  const s=newRun(seed);assert.equal(s.floors.length,6);
  s.floors.forEach((rooms,f)=>{const bosses=rooms.filter(r=>r.type==='boss');assert.equal(bosses.length,f%2);assert.ok(rooms.length-bosses.length>=7&&rooms.length-bosses.length<=10);assert.equal(rooms.some(r=>r.enemies.some(e=>e.type==='flower')),f>=4);});
  assert.equal(s.floors[1].at(-1).enemies[0].max,825);assert.equal(s.floors[3].at(-1).enemies[0].max,1500);assert.equal(s.floors[5].at(-1).enemies[0].variant,'slime');assert.equal(parseSave(encodeSave(s)).floors.length,6);
 }
});
test('all six ascent and descent transitions preserve gates, maps and key timing',()=>{
 const s=newRun(71),coords=s.floors.map(rs=>rs.map(r=>[r.x,r.y]));
 for(let f=0;f<6;f++){s.room=s.floors[f].findIndex(r=>r.type==='up'||r.type==='boss');if(f%2){assert.equal(travel(s,1),false);currentRoom(s).enemies=[];assert.equal(bossDefeated(s),f===5?'key':'stairs');}assert.equal(s.key,f===5);if(f<5)assert.ok(travel(s,1));}
 for(let f=5;f>0;f--){s.room=0;assert.ok(travel(s,-1));assert.equal(s.floor,f-1);}s.room=0;assert.ok(canEscape(s));assert.deepEqual(s.floors.map(rs=>rs.map(r=>[r.x,r.y])),coords);
});
test('legacy two and four floor saves keep their maps and final key floor',()=>{
 for(const count of [2,4]){let s=newRun(14);s.floors=Array.from({length:count},(_,f)=>generateFloor(f));s=parseSave(encodeSave(s));assert.equal(s.floors.length,count);s.floor=count-1;s.room=s.floors.at(-1).findIndex(r=>r.type==='boss');currentRoom(s).enemies=[];assert.equal(bossDefeated(s),'key');assert.equal(travel(s,1),false);}
});
test('prism emits 18 reflected rounds and fixed five beams resume identically',()=>{
 let e={x:480,y:200,cd:0},p={x:700,y:200},b=[];updatePrism(e,p,[],.02,b);assert.equal(b.length,0);while(e.prismPhase==='warning')updatePrism(e,p,[],.02,b);assert.equal(b.length,18);assert.ok(b.every(b=>b.bounces===1));while(e.prismAttack!=='laser')updatePrism(e,p,[],.02,b);const copy=structuredClone(e),other=[],aim=e.aim;p={x:350,y:450};for(let i=0;i<70;i++)assert.equal(updatePrism(e,p,[],.02,b),updatePrism(copy,p,[],.02,other));assert.equal(e.aim,aim);assert.deepEqual(e,copy);
});
