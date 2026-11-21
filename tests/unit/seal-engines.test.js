import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage} from '../../src/game/engine.js';
import {planSealEngines,engineLane,tickSealEngine,disableSealEngine,resetSealEngine,silenceSealEngine,SEAL_ENGINE} from '../../src/world/seal-engines.js';
import {drawSealEngine,drawSealEngineWarning} from '../../src/rendering/seal-engine.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
const idle={x:0,y:0};
function fixture(){const d={version:1,x:70,y:130,direction:1,disabled:false,rewarded:false,phase:'rest',time:0,disarm:0};return {s:{player:{x:480,y:270},projectiles:[],elapsed:0},r:{sealEngine:d,enemies:[{hp:10}],obstacles:[]},d};}
function planned(){for(let seed=1;seed<=80;seed++){const s=newRun(seed),r=s.floors.flat().find(r=>r.sealEngine);if(r)return {s,r,d:r.sealEngine};}assert.fail('expected a seeded device');}
test('independent device plans preserve combat RNG and exclude services, visited rooms and other encounters',()=>{
 let count=0;for(let seed=1;seed<=20;seed++){const s=newRun(seed),before=s.randomState,snapshot=JSON.stringify(s.floors);planSealEngines(s);assert.equal(s.randomState,before);assert.equal(JSON.stringify(s.floors),snapshot);s.floors.forEach((rooms,f)=>{assert.ok(rooms.filter(r=>r.sealEngine).length<=1);for(const r of rooms)if(r.sealEngine){count++;assert.ok(f>=2&&f<=7);assert.equal(r.type,'normal');assert.ok(!r.gate&&!r.hasChest&&!r.tutorial&&!r.seen&&!r.specialEncounter&&!r.supportEncounter&&!r.pursuerEncounter);assert.ok(engineLane(r.sealEngine,r).length>=240);}});}assert.ok(count>0);
});
test('fixed lane is clipped by obstacles in either direction',()=>{
 const {r,d}=fixture();r.obstacles=[{x:300,y:100,w:30,h:60}];assert.ok(engineLane(d,r).end.x<300);d.x=890;d.direction=-1;assert.ok(engineLane(d,r).end.x>330);
});
test('full warning precedes exactly one fixed nonhoming bolt and bounded recovery',()=>{
 const {s,r,d}=fixture();tickSealEngine(s,r,.01,idle);assert.equal(d.phase,'warning');assert.equal(d.time,1.2);assert.equal(s.projectiles.length,0);s.player.y=450;tickSealEngine(s,r,1.19,idle);assert.equal(s.projectiles.length,0);tickSealEngine(s,r,.02,idle);assert.equal(s.projectiles.length,1);assert.equal(s.projectiles[0].vy,0);assert.equal(s.projectiles[0].vx,330);assert.equal(s.projectiles[0].damage,9);assert.equal(d.phase,'release');tickSealEngine(s,r,.24,idle);assert.equal(d.phase,'rest');assert.equal(d.time,3);
});
test('entry grace suppresses firing and reentry discards old warnings',()=>{
 const {s,r,d}=fixture();s.entryGrace=.5;tickSealEngine(s,r,5,idle);assert.equal(s.projectiles.length,0);assert.equal(d.phase,'rest');d.phase='warning';d.time=.01;d.disarm=.8;resetSealEngine(r);assert.equal(d.phase,'rest');assert.equal(d.time,2);assert.equal(d.disarm,0);
});
test('nearby stationary disarm awards 18 XP once, cancels bolts and stays disabled on reentry',()=>{
 const {s,r,d}=fixture();s.player={x:100,y:130};s.projectiles=[{source:'봉인 기관 석궁'},{source:'다른 적'}];tickSealEngine(s,r,.6,idle);assert.equal(d.disabled,false);tickSealEngine(s,r,.6,idle);assert.equal(d.disabled,true);assert.equal(d.rewarded,true);assert.equal(r.xpDroppedTotal,18);assert.equal(s.projectiles.length,1);assert.equal(disableSealEngine(s,r),false);resetSealEngine(r);assert.equal(d.phase,'disabled');assert.equal(r.xpDroppedTotal,18);
});
test('movement, rolling, action stun and walls prevent accumulating disarm progress',()=>{
 for(const kind of ['move','roll','stun','wall']){const {s,r,d}=fixture();s.player={x:100,y:130};d.disarm=.5;if(kind==='roll')s.roll={};if(kind==='stun')s.player.actionStun=1;if(kind==='wall')r.obstacles=[{x:80,y:110,w:5,h:40}];tickSealEngine(s,r,.2,kind==='move'?{x:1,y:0}:idle);assert.equal(d.disarm,0,kind);}
});
test('empty rooms are silent but allow deliberate cleanup rewards',()=>{
 const {s,r,d}=fixture();r.enemies=[];s.projectiles=[{source:'봉인 기관 석궁'}];tickSealEngine(s,r,.1,idle);assert.equal(s.projectiles.length,0);assert.equal(d.phase,'rest');assert.equal(d.rewarded,false);s.player={x:100,y:130};tickSealEngine(s,r,SEAL_ENGINE.disarm,idle);assert.equal(r.xpDroppedTotal,18);silenceSealEngine(s,r);assert.equal(d.phase,'disabled');
});
test('device state survives return regeneration and malformed state is rejected',()=>{
 const {s,r,d}=planned();assert.ok(parseSave(encodeSave(s)));disableSealEngine(s,r);assert.ok(parseSave(encodeSave(s)));enrage(s);assert.equal(d.disabled,true);assert.ok(!r.pursuerEncounter&&!r.supportEncounter);assert.ok(parseSave(encodeSave(s)));
 for(const field of ['time','disarm']){const bad=structuredClone(s),device=bad.floors.flat().find(r=>r.sealEngine).sealEngine;device[field]=99;assert.throws(()=>encodeSave(bad));}const bad=structuredClone(s);bad.floors.flat().find(r=>r.sealEngine).sealEngine.rewarded=false;assert.throws(()=>encodeSave(bad));
});
test('body and reduced warning rendering preserve simulation state and readable contours',()=>{
 const {s,r,d}=fixture();d.phase='warning';const before=JSON.stringify(r),calls=[],ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});drawSealEngine(ctx,r);drawSealEngineWarning(ctx,r,{reduced:true,player:s.player});assert.equal(JSON.stringify(r),before);assert.ok(calls.some(c=>c[0]==='strokeRect'));assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='석궁 발사'));
});
