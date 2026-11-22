import test from 'node:test';
import assert from 'node:assert/strict';
import {resetOrdinaryPresentation,tickOrdinaryPresentation,notifyOrdinaryHits,ordinaryPose} from '../../src/rendering/ordinary-presentation-state.js';
import {clearVelkarPresentation,tickVelkarPresentation,notifyVelkarHits,velkarPresentationPose} from '../../src/rendering/velkar-presentation-state.js';
import {resetPrismPresentation,tickPrismPresentation,notifyPrismHits,prismPresentationPose} from '../../src/rendering/prism-presentation-state.js';
import {clearDemonPresentation,tickDemonPresentation,notifyDemonHits,demonPresentationPose} from '../../src/rendering/demon-presentation-state.js';
import {resetRemainingBossPresentation,tickRemainingBossPresentation,notifyRemainingBossHits,remainingBossPose} from '../../src/rendering/remaining-boss-presentation.js';
import {resetWardenPresentation,tickWardenPresentation,notifyWardenHits,wardenPresentationPose} from '../../src/rendering/warden-presentation-state.js';
const hits=[{enemyFeedback:'hit',enemyId:7,beforeRatio:1,afterRatio:.96,wardenDirect:true,demonCore:true}];
const adapters=[
 ['ordinary',{type:'archer'},r=>resetOrdinaryPresentation([r]),(r,dt,h)=>tickOrdinaryPresentation(r,dt,h),r=>notifyOrdinaryHits(r,hits),r=>ordinaryPose(r.enemies[0])],
 ['Velkar',{variant:'commander',commander:{phase:1}},()=>clearVelkarPresentation(),(r,dt,h)=>tickVelkarPresentation(r.enemies,dt,h),r=>notifyVelkarHits(r.enemies,hits),r=>velkarPresentationPose(r.enemies[0])],
 ['Prism',{variant:'prism'},()=>resetPrismPresentation(),(r,dt,h)=>tickPrismPresentation(r.enemies,dt,h),r=>notifyPrismHits(r.enemies,hits),r=>prismPresentationPose(r.enemies[0])],
 ['demon core',{variant:'demon',part:'core'},()=>clearDemonPresentation(),(r,dt,h)=>tickDemonPresentation(r,dt,h),r=>notifyDemonHits(r,hits),r=>demonPresentationPose(r.enemies[0],r)],
 ['gate archer',{type:'astralSniper',gateTitle:'베라'},()=>resetRemainingBossPresentation(),(r,dt,h)=>tickRemainingBossPresentation(r,dt,h),r=>notifyRemainingBossHits(r,hits),r=>remainingBossPose(r.enemies[0])],
 ['Warden',{variant:'warden'},()=>resetWardenPresentation(),(r,dt,h)=>tickWardenPresentation(r.enemies,dt,h),r=>notifyWardenHits(r.enemies,hits),r=>wardenPresentationPose(r.enemies[0])]
];
for(const [name,fields,reset,tick,notify,pose] of adapters)test(name+' body flinch has a non-refreshing one-second interval, without queued replay',()=>{
 const e={id:7,type:'boss',hp:100,max:100,x:400,y:200,...structuredClone(fields)},r={seen:true,enemies:[e],demon:{phase:3}};
 const saved=JSON.stringify(r);reset(r);notify(r);assert.notEqual(pose(r),null);
 // Re-reading the renderer does not consume the cooldown or restart the body.
 for(let i=0;i<20;i++)pose(r);
 tick(r,.2,[]);assert.equal(pose(r),null);
 for(let i=0;i<7;i++){tick(r,.1,hits);assert.equal(pose(r),null);}
 tick(r,.099,hits);assert.equal(pose(r),null);
 // Time expiring is not a deferred hit; only a fresh contact can trigger again.
 tick(r,.002,[]);assert.equal(pose(r),null);notify(r);assert.notEqual(pose(r),null);
 assert.equal(JSON.stringify(r),saved);
});
test('a blocked Velkar hit does not consume or postpone the next valid body reaction',()=>{
 const e={id:7,type:'boss',variant:'commander',hp:100,max:100,commander:{phase:1,volley:{aim:0}}};
 clearVelkarPresentation();notifyVelkarHits([e],hits);assert.equal(velkarPresentationPose(e),null);
 delete e.commander.volley;notifyVelkarHits([e],hits);assert.notEqual(velkarPresentationPose(e),null);
});
