import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,neighbor,enrage} from './engine.js';
import {fireArrow,stepRun,enemyRadius} from './simulation.js';
import {hitEnemy,xpRequired,skills} from './progression.js';
import {elementalImpact,tickElements,resolveFireFields} from './elements.js';
import {lootTable,drawLoot,prepareChest,openChest,applyLoot,prepareTrialLoot,claimTrialLoot} from './loot.js';
import {chooseEvent} from './adventures.js';
import {encodeSave,parseSave} from './storage.js';
import {movementSpeed} from './relics.js';
const foe=(hp=100)=>({id:0,type:'archer',x:700,y:300,hp,max:1000,cd:999,balanceVersion:1});
const burn=(time=2,dps=1)=>Array.from({length:3},()=>({time,dps}));
function chest(){const s=newRun(17);s.room=3;currentRoom(s).enemies=[];s.attack=999;return s;}
test('every split and repeat combination has at most homing level guided arrows per volley',()=>{
 for(let split=0;split<=4;split++)for(let repeat=0;repeat<=1;repeat++)for(let homing=0;homing<=3;homing++){const s=newRun(1);Object.assign(s.player,{split,repeat,homing});fireArrow(s,{x:800,y:300});assert.equal(s.projectiles.filter(b=>b.homing).length,Math.min(homing,1+split+repeat));if(homing)assert.ok(s.projectiles[0].homing);}
});
test('fire explosion has stronger base damage and level growth',()=>{const loss=[];for(let fire=1;fire<=3;fire++){const e=foe(1000);elementalImpact({damage:20,fire},e,[e],{enemies:[e]});loss.push(1000-e.hp);}assert.ok(Math.abs(loss[0]-23.4)<1e-9);assert.ok(Math.abs(loss[2]-loss[1]-6.3)<1e-9);});
test('fire field requires existing three stacks, max fire and a fire killing hit',()=>{
 for(let fire=2;fire<=3;fire++)for(let count=0;count<=3;count++){const e=foe(1);e.burnStacks=burn().slice(0,count);const r={enemies:[e]};hitEnemy({damage:20,fire},e,[e],[],1,true,r);resolveFireFields(r);assert.equal(r.fireZones?.length||0,fire===3&&count===3?1:0);resolveFireFields(r);assert.ok((r.fireZones?.length||0)<=1);}
 const e=foe(1);e.burnStacks=burn();const r={enemies:[e]};hitEnemy({damage:20,aura:3},e,[e],[],1,true,r);resolveFireFields(r);assert.equal(r.fireZones,undefined);
});
test('explosion and simultaneous burn can finish three-stack enemies but field damage cannot chain',()=>{
 const target=foe(1000),e={...foe(1),id:1,burnStacks:burn()},r={enemies:[target,e]};elementalImpact({damage:20,fire:3},target,r.enemies,r);resolveFireFields(r);assert.equal(r.fireZones.length,1);
 for(const source of ['burn','field']){const a=foe(1),q={enemies:[a]};a.burnStacks=burn(2,source==='burn'?1:0);a.burnField={r:42.5,time:1.5,dps:10.2};if(source==='field')q.fireZones=[{x:700,y:300,...a.burnField}];tickElements(q,.5);resolveFireFields(q);assert.equal(a.fireFieldSpawned,source==='burn'?true:undefined);}
});
test('burn expirations do not count dead stacks at a later lethal tick',()=>{const e=foe(2);e.burnStacks=[{time:.1,dps:1},{time:.1,dps:1},{time:2,dps:2}];e.burnField={r:42.5,time:1.5,dps:10.2};const r={enemies:[e]};tickElements(r,2);resolveFireFields(r);assert.ok(e.hp<=0);assert.equal(r.fireZones.length,0);});
test('tutorial cannot be bypassed and pays exactly one level; escape never repeats it',()=>{
 for(let seed=0;seed<20;seed++){const s=newRun(seed);assert.equal(neighbor(s,2),-1);assert.equal(neighbor(s,1),1);s.room=1;const r=currentRoom(s);assert.equal(r.enemies.length,4);assert.deepEqual([...new Set(r.enemies.map(e=>e.type))],['chaser']);assert.equal(r.obstacles.length,0);assert.equal(r.enemies.reduce((n,e)=>n+e.xpReward,0),xpRequired(1));r.enemies.forEach(e=>e.hp=0);s.attack=999;stepRun(s,.01);assert.equal(s.player.level,2);assert.equal(s.player.xp,0);assert.equal(s.pendingLevels,1);assert.ok(s.tutorialComplete);s.room=0;assert.equal(neighbor(s,2),5);enrage(s);s.room=1;currentRoom(s).enemies.forEach(e=>e.hp=0);stepRun(s,.01);assert.equal(s.player.xp,0);}
});
test('raw chest weights total one hundred and invalid rewards redraw only positives',()=>{
 assert.equal(lootTable.reduce((n,k)=>n+k.weight,0),100);const p=newRun(1).player;assert.equal(drawLoot(p,()=>0).id,'relic');assert.equal(drawLoot(p,()=>.5).id,'elites');assert.equal(drawLoot(p,()=>.98).id,'boss');for(const k of skills)p[k.id]=k.max;for(let i=0;i<100;i++){const result=drawLoot(p,()=>i/100,true);assert.ok(!lootTable.find(k=>k.id===result.id).trap);assert.ok(!result.skill);}
});
test('chest roll survives save, one payout only, and skill reward respects main lock',()=>{
 let s=chest();const reward=prepareChest(s);s=parseSave(encodeSave(s));assert.deepEqual(prepareChest(s),reward);assert.ok(openChest(s));assert.equal(openChest(s),false);s=chest();s.player.mainSkill='frost';s.player.frost=1;const result=drawLoot(s.player,()=>.95);assert.equal(result.id,'main');assert.equal(result.skill,'frost');applyLoot(s,result);assert.equal(s.player.frost,2);assert.equal(s.player.fire,0);
});
test('permanent move and attack rewards survive migration and affect actual movement/cadence',()=>{let s=chest();applyLoot(s,{id:'speed'});applyLoot(s,{id:'attackSpeed'});s=parseSave(encodeSave(s));assert.equal(movementSpeed(s.player),174*1.02);fireArrow(s,{x:800,y:300});assert.equal(s.attack,.65/1.02);});
test('small chest bosses award relics but never stairs keys or XP',()=>{
 for(const boss of ['warden','prism','slime']){let s=chest();currentRoom(s).chestReward={id:'boss',boss};openChest(s);let r=currentRoom(s);assert.equal(r.enemies[0].scale,.7);assert.ok(enemyRadius(r.enemies[0])<30);for(let stage=0;stage<3;stage++){r.enemies.forEach(e=>e.hp=0);stepRun(s,.01);s=parseSave(encodeSave(s));r=currentRoom(s);for(const e of r.enemies){assert.ok(e.chestBoss);assert.equal(e.scale,.7);}}assert.equal(r.enemies.length,0);assert.equal(r.chestBattle,'done');assert.equal(s.key,false);assert.equal(s.player.xp,0);assert.equal(r.relicOffers.length,3);}
});
test('three elite trap spawns valid distinct enemies with entry grace',()=>{const s=chest();applyLoot(s,{id:'elites'});const r=currentRoom(s);assert.equal(r.enemies.length,3);assert.equal(new Set(r.enemies.map(e=>e.id)).size,3);assert.ok(r.enemies.every(e=>e.elite));assert.equal(s.entryGrace,1.2);assert.doesNotThrow(()=>parseSave(encodeSave(s)));});
test('trials occur only on floors three and five, preserve active encounters on escape',()=>{
 const s=newRun(2);assert.deepEqual(s.floors.map((rs,i)=>rs.some(r=>r.type==='event')?i+1:0).filter(Boolean),[3,5]);s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='event');assert.ok(chooseEvent(s,'trial'));const enemies=structuredClone(currentRoom(s).enemies);enrage(s);assert.equal(currentRoom(s).trialState,'active');assert.deepEqual(currentRoom(s).enemies,enemies);s.floor=4;s.room=s.floors[4].findIndex(r=>r.type==='event');assert.equal(chooseEvent(s,'trial'),false);
});
test('trial offers are three saved distinct positives, one claim, reject corrupt rewards',()=>{
 let s=chest(),r=currentRoom(s);r.trialState='reward';s.player.hp=4;const offers=prepareTrialLoot(s);assert.equal(new Set(offers.map(k=>k.id)).size,3);assert.ok(offers.every(k=>!lootTable.find(t=>t.id===k.id).trap));s=parseSave(encodeSave(s));assert.deepEqual(prepareTrialLoot(s),offers);assert.ok(claimTrialLoot(s,0));assert.equal(claimTrialLoot(s,1),false);r=currentRoom(s);r.trialOffers[0]={id:'boss',boss:'slime'};assert.throws(()=>encodeSave(s));delete r.trialOffers;r.chestReward={id:'support',skill:'fire'};assert.throws(()=>encodeSave(s));
});
