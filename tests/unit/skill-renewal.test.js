import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {mainChoices,rerollMain,chooseMain,allowedSkill,frostShatter} from '../../src/progression/skill-tree.js';
import {skills,levelChoices,tickEffects} from '../../src/progression/progression.js';
import {synergySkills,synergyIds,exclusiveMain} from '../../src/progression/synergies.js';
import {parseSave,encodeSave} from '../../src/persistence/storage.js';
import {weaponSnapshot} from '../../src/combat/weapon-projectiles.js';
import {elementalImpact,tickElements} from '../../src/combat/elements.js';
import {applyFrost} from '../../src/combat/frost.js';
import {chargePrimary,lightningImpact} from '../../src/combat/lightning.js';
import {draftMarkup} from '../../src/ui/skill-draft.js';
const foe=(id,x=0,y=0)=>({id,type:'archer',x,y,hp:1000,max:1000,cd:999,balanceVersion:1});
function run(){const s=newRun(94);s.player.level=2;s.pendingLevels=1;s.levelQueue=[2];return s;}

test('main offers persist across saves and reject a main outside the three choices',()=>{
 const s=run(),offers=mainChoices(s,()=>0);assert.equal(new Set(offers).size,3);
 const loaded=parseSave(encodeSave(s));assert.deepEqual(mainChoices(loaded,()=>{throw Error('must not redraw');}),offers);
 assert.equal(chooseMain(loaded,'precision'),false);assert.equal(chooseMain(loaded,offers[0]),true);assert.equal(loaded.mainChoices,undefined);
});
test('main reroll spends the same single reroll used by later supports',()=>{
 const s=run();mainChoices(s);assert.equal(rerollMain(s),true);assert.equal(s.rerolls,0);assert.equal(rerollMain(s),false);
 assert.equal(chooseMain(s,s.mainChoices[0]),true);assert.equal(parseSave(encodeSave(s)).rerolls,0);
});
test('every dedicated support respects its main and prerequisite',()=>{
 for(const k of synergySkills){assert.equal(allowedSkill({mainSkill:'precision',[k.main]:3},k.id),false);assert.equal(allowedSkill({mainSkill:k.main,[k.main]:k.requires||1},k.id),true);if(k.requires)assert.equal(allowedSkill({mainSkill:k.main,[k.main]:1},k.id),false);}
});
test('ultimate guarantee and a useful synergy survive the same three-card offer',()=>{
 const s=run();Object.assign(s.player,{mainSkill:'fire',fire:2,level:5});s.levelQueue=[5];
 const choices=levelChoices(s,()=>.99);assert.equal(choices.length,3);assert.equal(new Set(choices.map(k=>k.id)).size,3);assert.ok(choices.some(k=>k.id==='ultimate'));assert.ok(choices.some(k=>k.id==='fire'||exclusiveMain(k.id)==='fire'));
 const loaded=parseSave(encodeSave(s));assert.deepEqual(levelChoices(loaded,()=>{throw Error('must restore');}).map(k=>k.id),choices.map(k=>k.id));
});
test('fire powder only boosts the explosion center; ember cannot recursively trigger',()=>{
 const base=[foe(0),foe(1,35)],boosted=[foe(0),foe(1,35)],p={fire:2,damage:20};
 elementalImpact(p,base[0],base,{enemies:base});elementalImpact({...p,blastTip:2},boosted[0],boosted,{enemies:boosted});
 assert.ok(boosted[0].hp<base[0].hp);assert.equal(boosted[1].hp,base[1].hp);
 const e=foe(0),r={enemies:[e]};let triggers=0;for(let i=0;i<4;i++)triggers+=elementalImpact({...p,emberMark:3},e,[e],r).filter(f=>f.slash).length;
 assert.equal(triggers,1);assert.equal(e.emberCooldown,1.4);assert.equal(r.fireZones,undefined);
});
test('frost bond preserves two-hit freeze and immunity while adding a thaw slow',()=>{
 const e=foe(0),p={frost:3,frostBond:3};applyFrost(p,e);assert.ok(!e.frozen);assert.equal(e.frostStackTime,4);applyFrost(p,e);assert.equal(e.frozen,1.2);tickEffects(e,1.2);assert.equal(e.frozen,0);assert.ok(e.freezeImmune>0);assert.ok(e.slow>=1&&e.slowFactor<=.85);applyFrost(p,e);assert.equal(e.frozen,0);
});
test('shard bonuses are stored once and keep existing shard count and base scale',()=>{
 const projectiles=[];frostShatter({frost:4,shardHone:3},{id:1,x:480,y:300,hp:0,frozen:1},projectiles);
 assert.equal(projectiles.length,12);assert.ok(projectiles.every(b=>b.shardBoost===1.3&&b.life===2.3&&b.damageScale===.5));
 const s=run();s.projectiles=projectiles;assert.equal(parseSave(encodeSave(s)).projectiles[0].shardBoost,1.3);s.projectiles[0].shardBoost=1.31;assert.throws(()=>encodeSave(s));
});
test('poison stacks stay capped and spores do not seed a second generation',()=>{
 const e=foe(0),other=foe(1,40),third=foe(2,80),r={enemies:[e,other,third],obstacles:[]},p={poison:2,venomPenetration:3,plagueSpore:1,damage:20};
 for(let i=0;i<12;i++)elementalImpact(p,e,r.enemies,r,{venomPrimary:true,validDirect:true});
 assert.equal(e.poisonStacks.length,8);assert.equal(e.venomCooldown,1.5);assert.ok(e.poisonStacks.every(d=>d.time===3.5));
 tickElements(r,.01,2);assert.ok(other.sporeDot);assert.equal(other.poisonStacks,undefined);tickElements(r,.01,2);assert.equal(third.sporeDot,undefined);
});
test('charge counts each primary projectile once and consumes on the following primary',()=>{
 const p={chargeCell:3},first={primary:true,projectile:{}};chargePrimary(p,first);chargePrimary(p,first);assert.equal(p.chargeHits,1);
 chargePrimary(p,{primary:true,projectile:{}});chargePrimary(p,{primary:true,projectile:{}});assert.equal(p.chargeReady,true);
 assert.equal(chargePrimary(p,{primary:false,projectile:{}}),0);assert.equal(p.chargeReady,true);
 assert.equal(chargePrimary(p,{primary:true,projectile:{}}),.4);assert.equal(p.chargeReady,false);assert.equal(p.chargeHits,0);
});
test('focused conduction retains a useful first-link bonus and extends reach',()=>{
 const center=foe(0),next=foe(1,150),p={damage:100,chain:3,conduction:3,evolutions:{chain:'surge'}};
 lightningImpact(p,center,[center,next]);assert.ok(Math.abs((1000-next.hp)-120*1.06*1.15)<1e-9);
});
test('new synergy snapshots and pre-renewal snapshots both load',()=>{
 const s=run();Object.assign(s.player,{mainSkill:'fire',fire:2,blastTip:3,emberMark:1});const build=weaponSnapshot(s.player);assert.equal(build.blastTip,3);assert.equal(build.emberMark,1);
 currentRoom(s).turrets=[{x:480,y:300,time:1,clock:0,aim:0,build}];assert.doesNotThrow(()=>parseSave(encodeSave(s)));
 for(const key of synergyIds)delete build[key];assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('draft uses three readable cards and preserves unique rarity and recipe hints without mutations',()=>{
 const s=run();Object.assign(s.player,{mainSkill:'fire',fire:1});const before=JSON.stringify(s),choices=['repeat','aura','blastTip'].map(id=>skills.find(k=>k.id===id)),html=draftMarkup(s,choices);
 assert.equal((html.match(/data-draft-choice=/g)||[]).length,3);assert.ok(html.includes('유니크 보조'));assert.ok(html.includes('선택 시 조합 완성'));assert.ok(html.includes('상세 성장 보기'));assert.equal(JSON.stringify(s),before);
});
