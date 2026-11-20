import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,enrage} from '../../src/game/engine.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
import {planSpecialEncounters,activateSpecialEncounter,rewardSpecialEncounter,ROAMING_XP} from '../../src/world/special-encounters.js';
import {grantRelic,hasRelic} from '../../src/progression/relics.js';
import {enemyXpReward,enemyEssenceChance} from '../../src/progression/enemy-rewards.js';
import {enemyName,enemyKey} from '../../src/world/expedition.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {drawRoamingEliteBadge} from '../../src/rendering/special-encounter-visuals.js';
import {blocked} from '../../src/world/terrain.js';

function planned(){
 const s=newRun(47);let found;
 s.floors.forEach((rooms,floor)=>rooms.forEach((r,index)=>{if(!found&&r.specialEncounter)found={r,floor,index};}));assert.ok(found,'seed has a planned encounter');
 s.floor=found.floor;s.room=found.index;Object.assign(s.player,{x:65,y:270});return {s,r:found.r,p:s.player};
}
function active(){const fixture=planned();enterRoom(fixture.s);fixture.e=fixture.r.enemies.find(e=>e.roamingElite);assert.ok(fixture.e);return fixture;}
test('plans reproduce independently of combat/map RNG and are never rerolled',()=>{
 const a=newRun(47),b=newRun(47),plans=s=>s.floors.map(f=>f.map(r=>r.specialEncounter??null));assert.deepEqual(plans(a),plans(b));
 const before=JSON.stringify(plans(a)),rng=a.randomState,critical=a.critical.randomState;planSpecialEncounters(a);assert.equal(JSON.stringify(plans(a)),before);assert.equal(a.randomState,rng);assert.equal(a.critical.randomState,critical);
});
test('floor caps and safe room exclusions hold across seeded campaigns',()=>{
 let total=0;
 for(let seed=1;seed<=16;seed++){const s=newRun(seed,{campaign:'expanded',bossLayoutVersion:1});s.floors.forEach((rooms,floor)=>{const selected=rooms.filter(r=>r.specialEncounter);total+=selected.length;assert.ok(selected.length<=1);if(floor===0||floor>=8)assert.equal(selected.length,0);for(const r of selected)assert.ok(r.type==='normal'&&!r.hasChest&&!r.gate&&!r.tutorial&&!r.seen);});}
 assert.ok(total>10&&total<100);
});
test('legacy planning excludes current and explored rooms and does not alter actors',()=>{
 const {s,r}=planned();delete s.specialEncounterVersion;for(const room of s.floors.flat())delete room.specialEncounter;
 for(const floor of s.floors)floor[0].seen=true;const actors=JSON.stringify(s.floors.map(f=>f.map(r=>r.enemies)));planSpecialEncounters(s);
 assert.equal(r.specialEncounter,undefined);assert.ok(s.floors.flat().filter(r=>r.seen).every(r=>!r.specialEncounter));assert.equal(JSON.stringify(s.floors.map(f=>f.map(r=>r.enemies))),actors);
});
test('first entry replaces one actor with a clearly named elite without extra enemies or unsafe spawning',()=>{
 const {s,r,p}=planned(),count=r.enemies.length,rng=s.randomState;enterRoom(s);const e=r.enemies.find(e=>e.roamingElite);
 assert.equal(r.enemies.length,count);assert.equal(r.enemies.filter(e=>e.roamingElite).length,1);assert.equal(e.elite,'guardian');assert.equal(enemyXpReward(e),54);assert.equal(enemyEssenceChance(e,r),1);
 assert.equal(enemyKey(e),'roamingElite');assert.equal(enemyName(e),'유랑 유물사냥꾼');assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>=155);assert.equal(blocked(e.x,e.y,19,r.obstacles),false);assert.equal(s.randomState,rng);
 e.hp-=10;const hp=e.hp;enterRoom(s);assert.equal(e.hp,hp);assert.equal(r.enemies.length,count);
});
test('actual defeat grants 54XP and one essence once, persists defeat and cannot respawn on reentry',()=>{
 const {s,r,e}=active();r.specialEncounter.relicId=null;e.x=750;e.y=350;e.hp=0;const result=stepRun(s,0);
 assert.ok(result.events.includes('roamingDefeated'));assert.equal(r.xpDroppedTotal,ROAMING_XP);assert.equal(r.essences.length,1);assert.equal(r.specialEncounter.state,'defeated');assert.equal(r.specialEncounter.rewarded,true);
 stepRun(s,0);assert.equal(r.xpDroppedTotal,54);assert.equal(r.essences.length,1);enterRoom(s);assert.equal(r.enemies.some(e=>e.roamingElite),false);assert.ok(parseSave(encodeSave(s)));
});
test('prepared relic reward and duplicate fallback each grant once without rerolling',()=>{
 for(const duplicate of [false,true]){const {s,r,e,p}=active();r.specialEncounter.relicId='boots';r.specialEncounter.fallbackEssence='attack';if(duplicate)grantRelic(p,'boots');e.hp=0;r.enemies=r.enemies.filter(n=>n!==e);const rng=s.randomState;
  const effects=[],event=rewardSpecialEncounter(s,r,e,effects);assert.equal(event,duplicate?'roamingDefeated':'roamingRelic');assert.equal(hasRelic(p,'boots'),true);assert.equal((r.essences||[]).length,duplicate?1:0);assert.equal(effects.length,1);assert.equal(s.randomState,rng);
  assert.equal(rewardSpecialEncounter(s,r,e,effects),null);assert.equal(effects.length,1);assert.ok(parseSave(encodeSave(s)));
 }
});
test('descent regeneration retires ascent plans and actors without granting their rewards',()=>{
 const {s,r}=active();enrage(s);assert.equal(r.specialEncounter.state,'cancelled');assert.equal(r.specialEncounter.enemyId,null);assert.equal(r.specialEncounter.rewarded,false);assert.equal(s.floors.flat().some(r=>r.enemies.some(e=>e.roamingElite)),false);
 enterRoom(s);assert.equal(r.enemies.some(e=>e.roamingElite),false);assert.ok(parseSave(encodeSave(s)));
});
test('practice/return never activate and a room without safe space cancels before mutation',()=>{
 for(const flag of ['practice','key']){const {s,r}=planned();s[flag]=true;assert.equal(activateSpecialEncounter(s,r),false);assert.equal(r.specialEncounter.state,'planned');}
 const {s,r}=planned(),actors=JSON.stringify(r.enemies);r.obstacles=[{x:0,y:0,w:960,h:540}];assert.equal(activateSpecialEncounter(s,r),false);assert.equal(r.specialEncounter.state,'cancelled');assert.equal(JSON.stringify(r.enemies),actors);
});
test('active save loads without rerolling and rejects inconsistent plans, actors and reward flags',()=>{
 const {s,r}=active(),loaded=parseSave(encodeSave(s));assert.ok(loaded);assert.deepEqual(currentRoom(loaded).specialEncounter,r.specialEncounter);assert.equal(loaded.randomState,s.randomState);
 for(const mutate of [v=>delete v.specialEncounterVersion,v=>currentRoom(v).specialEncounter.rewarded=true,v=>currentRoom(v).specialEncounter.enemyId=99999,v=>currentRoom(v).specialEncounter.relicId='crackedCrown',v=>currentRoom(v).enemies.find(e=>e.roamingElite).xpReward=55,v=>delete currentRoom(v).specialEncounter]){const broken=structuredClone(s);mutate(broken);assert.throws(()=>encodeSave(broken));}
});
test('badge drawing is detached, clipped and leaves saved state unchanged in either mode',()=>{
 const {s,e}=active(),before=JSON.stringify(s),calls=[];const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});
 drawRoamingEliteBadge(c,e,0,false);drawRoamingEliteBadge(c,e,1,true);assert.equal(calls.filter(c=>c[0]==='fillText').length,2);assert.ok(calls.some(c=>c[0]==='clip'));assert.equal(JSON.stringify(s),before);
});
