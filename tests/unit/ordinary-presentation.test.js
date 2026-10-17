import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyGuide} from '../../src/world/expedition.js';
import {isOrdinary,resetOrdinaryPresentation,clearOrdinaryActors,tickOrdinaryPresentation,notifyOrdinaryHits,ordinaryPose,ordinaryDeathFace,applyOrdinaryPresentation,tickHeroPresentation,heroPresentationPose} from '../../src/rendering/ordinary-presentation-state.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
const excluded=new Set(['kald','vera','warden','prism','slime','king','commander','demon']);
const types=Object.keys(enemyGuide).filter(type=>!excluded.has(type));
const actor=type=>({id:3,type,hp:100,max:100,x:240,y:200});
const hit=(loss=.04)=>[{enemyFeedback:'hit',enemyId:3,beforeRatio:1,afterRatio:1-loss}];
test('all ordinary bestiary types receive bounded view reactions, with no boss overlap or actor writes',()=>{
 assert.equal(types.length,24);
 for(const type of types){const e=actor(type),r={enemies:[e]},saved=JSON.stringify(r);resetOrdinaryPresentation();assert.equal(isOrdinary(e),true);tickOrdinaryPresentation(r,.01);assert.equal(ordinaryPose(e).kind,'arrival');for(let i=0;i<6;i++)ordinaryPose(e);tickOrdinaryPresentation(r,.31);assert.equal(ordinaryPose(e),null);notifyOrdinaryHits(r,hit());assert.equal(ordinaryPose(e).kind,'hit');assert.equal(ordinaryPose(e).heavy,false);assert.equal(ordinaryPose(e,{staticPose:true}),null);assert.equal(ordinaryPose(e,{reduced:true}),null);tickOrdinaryPresentation(r,.25);notifyOrdinaryHits(r,hit(.2));assert.equal(ordinaryPose(e).heavy,true);tickOrdinaryPresentation(r,.15);assert.equal(ordinaryPose(e),null);assert.equal(JSON.stringify(r),saved);}
 for(const e of [{type:'boss'},{type:'starKnight',gateTitle:'칼드'},{type:'boss',variant:'demon'},{type:'player'}])assert.equal(isOrdinary(e),false);
});
test('seen-room load and room reentry do not replay arrival, while new summons do',()=>{
 const e=actor('archer'),r={seen:true,enemies:[e]};resetOrdinaryPresentation([r]);tickOrdinaryPresentation(r,.01);assert.equal(ordinaryPose(e),null);clearOrdinaryActors();tickOrdinaryPresentation(r,.01);assert.equal(ordinaryPose(e),null);
 const summoned={...actor('chaser'),id:4,summoned:true};r.enemies.push(summoned);tickOrdinaryPresentation(r,.01);assert.equal(ordinaryPose(summoned).kind,'arrival');const saved=JSON.parse(JSON.stringify(r));resetOrdinaryPresentation([saved]);tickOrdinaryPresentation(saved,.01);assert.equal(ordinaryPose(saved.enemies[1]),null);
});
test('melee, charge, ranged, aerial, elite and hazard threats take priority without cancellation',()=>{
 const cases=[{chaserWindup:.08},{chaserStrike:.12},{chargeAngle:0},{attackPhase:'warning'},{attackPhase:'firing'},{phase:'aim'},{phase:'beam'},{phase:'air'},{phase:'swing'},{phase:'recover'},{darkAttack:{kind:'slash'}},{darkFlash:{time:.1}},{gravity:{}},{eliteWarning:1},{frozen:1},{opening:1}];
 for(const threat of cases){const e=actor('chaser'),r={enemies:[e]};resetOrdinaryPresentation();tickOrdinaryPresentation(r,.01);Object.assign(e,threat);const saved=JSON.stringify(r);tickOrdinaryPresentation(r,.01,hit(.2));assert.equal(ordinaryPose(e),null);assert.equal(JSON.stringify(r),saved);for(const key of Object.keys(threat))delete e[key];assert.equal(ordinaryPose(e),null);}
 const e=actor('flower'),r={enemies:[e],hazards:[{owner:e.id,phase:'warning'}]};resetOrdinaryPresentation();tickOrdinaryPresentation(r,.01,hit());assert.equal(ordinaryPose(e),null);
});
test('ordinary death snapshots keep style/timing and root anchors, self-destruct stays distinct',()=>{
 for(const type of types){const e=actor(type);e.hp=0;const saved=JSON.stringify(e),f=enemyDeathEffect(e);assert.equal(f.ordinary,true);assert.equal(f.bodyType,type);assert.equal(f.duration,.55);assert.equal(Object.values(f).some(v=>v&&typeof v==='object'),false);assert.equal(JSON.stringify(e),saved);}
 const e=actor('archer'),r={enemies:[e]};resetOrdinaryPresentation();tickOrdinaryPresentation(r,.01);e.x-=3;tickOrdinaryPresentation(r,.01);assert.equal(ordinaryDeathFace(e),-1);
 assert.equal(enemyDeathEffect({...actor('demonBat'),selfDestruct:true}).style,'batExplosion');assert.equal(enemyDeathEffect(actor('flower')).style,'petal');assert.equal(enemyDeathEffect(actor('minislime')).style,'slime');
 const flower=actor('flower');let calls=0;applyOrdinaryPresentation({translate(){calls++;},scale(){calls++;}},flower);assert.equal(calls,0);
});
test('hero reaction is visual only, reduced mode quiet, defeat immediate with no result delay',()=>{
 const p={hp:5,x:400,y:200},saved=JSON.stringify(p);resetOrdinaryPresentation();tickHeroPresentation(p,.01,[{hitSource:'적 탄환'}]);tickHeroPresentation(p,.08);assert.equal(heroPresentationPose(p).kind,'hit');assert.equal(heroPresentationPose(p,{reduced:true}),null);assert.equal(JSON.stringify(p),saved);tickHeroPresentation(p,.1);assert.equal(heroPresentationPose(p),null);p.hp=0;assert.equal(heroPresentationPose(p).kind,'defeat');assert.equal(heroPresentationPose(p,{reduced:true}).kind,'defeat');
});
test('ordinary removals and rewards remain immediate with one detached death effect',()=>{
 const s=newRun(42),r=currentRoom(s);s.attack=100;r.obstacles=[];r.enemies=[{...actor('archer'),hp:0}];const first=stepRun(s,0);assert.equal(r.enemies.length,0);assert.equal(s.kills,1);assert.equal(first.effects.filter(f=>f.enemyFeedback==='death'&&f.ordinary).length,1);assert.equal(stepRun(s,0).effects.some(f=>f.enemyFeedback==='death'),false);
});
