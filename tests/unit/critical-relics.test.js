import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {grantRelic,removeRelic,canGrantRelic,offerRelics,relics} from '../../src/progression/relics.js';
import {criticalRelicIds} from '../../src/progression/critical-relics.js';
import {criticalStats,createCriticalSnapshot,createCriticalProfile,applyPlayerDamage,createDamagePacket,drainDamageResults,bindCriticalRun} from '../../src/combat/critical.js';
import {lightningImpact} from '../../src/combat/lightning.js';
import {hitEnemy} from '../../src/progression/progression.js';
import {reactToRelicHit} from '../../src/combat/relic-effects.js';
import {weaponSnapshot} from '../../src/combat/weapon-projectiles.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {relicPreview} from '../../src/ui/relic-preview.js';
import {relicIconIds,relicIconMarkup} from '../../src/rendering/relic-icons.js';
import {relicSelectionMarkup,relicStateText} from '../../src/ui/relic-ui.js';
import {criticalFeedback} from '../../src/rendering/critical-feedback.js';

function scene(){const s=newRun(47),r=currentRoom(s);r.obstacles=[];r.enemies=[{id:0,x:500,y:300,hp:10000,max:10000,type:'chaser',cd:20,balanceVersion:1}];return {s,p:s.player,r,e:r.enemies[0]};}
function forced(s,e,options={}){const snapshot={version:1,id:++s.critical.sequence,critical:true,multiplier:1.5,countedTargets:[]};return applyPlayerDamage(s,e,100,{snapshot,...options});}
test('four approved relic objects share catalog, icon and rarity mappings without changing atlas indices',()=>{
 assert.equal(relics.length,41);assert.deepEqual(new Set(relicIconIds),new Set(relics.map(r=>r.id)));
 const icons=criticalRelicIds.map(id=>relicIconMarkup(id));assert.equal(new Set(icons).size,4);for(const id of criticalRelicIds)assert.match(relicIconMarkup(id),new RegExp('data-relic-icon="'+id+'"'));
 assert.equal(relicIconIds.indexOf('windSeal'),0);assert.equal(relicIconIds.indexOf('voidBell'),36);
});
test('cracked crown pays max health once, clamps current health and restores no healing on removal',()=>{
 const {p}=scene();assert.equal(grantRelic(p,'crackedCrown'),true);assert.equal(p.max,4);assert.equal(p.hp,4);assert.equal(grantRelic(p,'crackedCrown'),false);assert.equal(p.max,4);
 p.hp=2;removeRelic(p,'crackedCrown');assert.equal(p.max,5);assert.equal(p.hp,2);p.max=p.hp=1;assert.equal(canGrantRelic(p,'crackedCrown'),false);assert.equal(grantRelic(p,'crackedCrown'),false);
});
test('unaffordable crown is excluded from new offers and disabled in stale offers',()=>{
 const {s,p,r}=scene();p.max=p.hp=1;for(const relic of relics)if(!['crackedCrown','sunFairy','snowFairy','stormFairy'].includes(relic.id))grantRelic(p,relic.id);
 // The heart grant above increased max; put the fixture at the actual boundary.
 p.max=p.hp=1;offerRelics(s,r);assert.deepEqual(r.relicOffers,[]);r.relicOffers=['crackedCrown'];assert.match(relicSelectionMarkup(s,r),/disabled aria-disabled="true"/);
});
test('relic and skill critical bonuses use common caps and are not counted again in weapon profiles',()=>{
 const {p}=scene();grantRelic(p,'hawkCharm');grantRelic(p,'crackedCrown');Object.assign(p,{keenEye:3,criticalTraining:3});
 assert.ok(Math.abs(criticalStats(p).chance-.3)<1e-9);assert.equal(criticalStats(p).multiplier,2.15);
 const w=weaponSnapshot(p);assert.equal(w.criticalResolved,true);assert.deepEqual(criticalStats(w),criticalStats(p));removeRelic(p,'hawkCharm');p.keenEye=0;assert.ok(Math.abs(criticalStats(w).chance-.3)<1e-9);
 p.critChance=.49;p.critMultiplier=2.5;assert.equal(criticalStats(p).chance,.5);assert.equal(criticalStats(p).multiplier,2.5);
});
test('resolve grows only on throttled new noncritical hits, caps at ten points and resets on critical',()=>{
 const {s,p,e}=scene();grantRelic(p,'resolveEmblem');p.critChance=0;const packet=createDamagePacket();applyPlayerDamage(s,e,1,{packet});applyPlayerDamage(s,e,1,{packet});applyPlayerDamage(s,e,1);assert.equal(p.resolveStacks,1);
 for(let i=0;i<8;i++){s.elapsed+=.3;s.critical.randomState=0;applyPlayerDamage(s,e,1);}assert.equal(p.resolveStacks,5);assert.equal(criticalStats(p).chance,.1);
 const profile=createCriticalProfile(p);assert.equal(profile.critChance,0);assert.equal(criticalStats(profile).chance,0);
 // A live pity bonus is applied at the real hit, not permanently baked into a tower.
 s.critical.randomState=1972;const hit=createCriticalSnapshot(s,profile);assert.equal(hit.critical,true);applyPlayerDamage(s,e,1,{snapshot:hit});assert.equal(p.resolveStacks,0);
 applyPlayerDamage(s,e,1,{procDepth:1});assert.equal(p.resolveStacks,0);removeRelic(p,'resolveEmblem');assert.equal(p.resolveStacks,undefined);
});
test('hunter follows a critical against elites only once, cannot crit/recurse, and does not consume extra RNG',()=>{
 const {s,p,e}=scene();grantRelic(p,'hunterSeal');grantRelic(p,'resolveEmblem');p.resolveStacks=5;p.royalJudgment=1;e.elite='volley';const rng=s.critical.randomState;
 forced(s,e);assert.ok(Math.abs(10000-e.hp-156.8)<1e-8);assert.equal(s.critical.randomState,rng);assert.equal(s.critical.royalCharges,1);assert.equal(p.resolveStacks,0);
 const results=drainDamageResults(s),bonus=results.find(r=>r.source==='hunterSeal');assert.ok(bonus&&!bonus.critical&&bonus.procDepth===1&&!bonus.procEligible);assert.ok(criticalFeedback(results).some(f=>f.hunterSeal));
 const hp=e.hp;forced(s,e);assert.equal(hp-e.hp,150);s.elapsed=2;forced(s,e,{procDepth:1});assert.equal(s.critical.hunterNextAt,1);
});
test('hunter does not proc on ordinary enemies, noncritical hits or lethal overkill',()=>{
 const {s,p,e}=scene();grantRelic(p,'hunterSeal');forced(s,e);assert.equal(s.critical.hunterNextAt,undefined);e.type='boss';p.critChance=0;applyPlayerDamage(s,e,1);assert.equal(s.critical.hunterNextAt,undefined);
 e.hp=1;forced(s,e);assert.equal(s.critical.hunterNextAt,undefined);
});
test('actual arrow route includes hunter damage exactly once in total damage metrics',()=>{
 const {s,p,e}=scene();grantRelic(p,'hunterSeal');p.critChance=.5;s.critical.randomState=0;e.elite='volley';e.eliteCooldown=20;
 s.projectiles=[{x:490,y:300,vx:420,vy:0,life:3,enemy:false,pierce:0,hit:[],elemental:false,primary:true}];const result=stepRun(s,.1);
 assert.ok(result.damageResults.some(r=>r.source==='hunterSeal'));assert.ok(Math.abs(s.metrics.damageDealt-(10000-e.hp))<1e-8);assert.ok(Math.abs(s.critical.damage-s.metrics.damageDealt)<1e-8);
});
test('proc state and resolved snapshots survive saving while invalid new fields are rejected',()=>{
 const {s,p,r,e}=scene();grantRelic(p,'hawkCharm');grantRelic(p,'resolveEmblem');p.resolveStacks=3;p.resolveNextAt=.25;s.critical.hunterNextAt=1;
 r.turrets=[{x:480,y:300,time:14,clock:0,aim:0,build:weaponSnapshot(p),seekerClock:1.5}];const saved=parseSave(encodeSave(s));assert.equal(saved.player.resolveStacks,3);assert.equal(currentRoom(saved).turrets[0].build.criticalResolved,true);assert.equal(saved.critical.hunterNextAt,1);
 for(const mutate of [v=>v.player.resolveStacks=6,v=>v.player.resolveNextAt=-1,v=>v.critical.hunterNextAt=-1,v=>currentRoom(v).turrets[0].build.criticalResolved=false]){const broken=structuredClone(s);mutate(broken);assert.throws(()=>encodeSave(broken));}
 assert.equal(e.hp,10000);
});
test('previews show critical and health costs with conditional explanations and live owned state',()=>{
 const {s,p}=scene();const crown=relicPreview(p,'crackedCrown');assert.ok(crown.rows.some(r=>r.label==='최대 체력'&&r.after===4));assert.ok(crown.rows.some(r=>r.label==='치명타 확률(%)'));
 assert.ok(relicPreview(p,'hunterSeal').notes.some(n=>n.includes('파생')));grantRelic(p,'resolveEmblem');p.resolveStacks=4;assert.match(relicStateText(s,'resolveEmblem'),/4\/5.*8%p/);
});
test('actual chain transfers, frost death shards and reflected thorns cannot trigger proc relics',()=>{
 const {s,p,r,e}=scene();grantRelic(p,'hunterSeal');grantRelic(p,'resolveEmblem');p.critChance=.5;p.chain=1;e.elite='volley';
 const other={...e,id:1,x:540};r.enemies.push(other);bindCriticalRun(s,r.enemies);s.critical.randomState=0;lightningImpact(p,e,r.enemies);
 assert.ok(drainDamageResults(s).some(hit=>hit.source==='chainTransfer'&&hit.procDepth===1&&!hit.procEligible));
 delete s.critical.hunterNextAt;s.elapsed=2;s.critical.randomState=0;hitEnemy({...p,chain:0,frostShardAttack:true},e,r.enemies,[],1,false,r,p);assert.equal(s.critical.hunterNextAt,undefined);
 assert.ok(drainDamageResults(s).some(hit=>hit.source==='frostShard'&&hit.procDepth===1));
 grantRelic(p,'thornBuckle');s.critical.randomState=0;reactToRelicHit(s,r);assert.equal(s.critical.hunterNextAt,undefined);assert.ok(drainDamageResults(s).some(hit=>hit.source==='thornBuckle'&&hit.procDepth===1));
});
