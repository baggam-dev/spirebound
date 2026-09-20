import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,advanceClock} from './engine.js';
import {castUltimate} from './abilities.js';
import {tickPassives,passivePower} from './passives.js';
import {relics,grantRelic,ultimateCooldown} from './relics.js';
import {lootTable,drawLoot,prepareTrialLoot} from './loot.js';
import {seededRandom} from './random.js';
const setup=()=>{const s=newRun(123);s.player.ultimate=1;s.player.evolutions={ultimate:'turret'};const r=currentRoom(s);r.obstacles=[];r.enemies=[];return s;};
test('one cooldown relic gives two to three seconds of natural turret overlap',()=>{
 assert.equal(ultimateCooldown(setup().player),20);
 for(const relic of relics.filter(r=>r.stats?.ultimateCooldown)){
  const s=setup();grantRelic(s.player,relic.id);assert.ok(castUltimate(s));const cd=s.skill;
  assert.equal(currentRoom(s).turrets[0].time,19);assert.ok(cd>=16&&cd<=17);
  advanceClock(s,cd,false);tickPassives(s,cd);assert.ok(castUltimate(s));
  assert.equal(currentRoom(s).turrets.length,2);assert.equal(currentRoom(s).turrets[0].time,19-cd);
  tickPassives(s,19-cd);assert.equal(currentRoom(s).turrets.length,1);
 }
});
test('tower has 308 range from installation and fires 200 percent every half second',()=>{
 const s=setup(),r=currentRoom(s);castUltimate(s);const t=r.turrets[0];s.player.x=100;
 const e={id:0,type:'archer',hp:1000,x:t.x+309,y:t.y};r.enemies=[e];tickPassives(s,.01);assert.equal(s.projectiles.length,0);
 e.x=t.x+308;tickPassives(s,.01);assert.equal(s.projectiles.length,1);assert.equal(s.projectiles[0].passiveDamage,passivePower(s.player)*2);
 tickPassives(s,.49);assert.equal(s.projectiles.length,1);tickPassives(s,.01);assert.equal(s.projectiles.length,2);
});
test('chests allocate eight percent to relics and trial offers never duplicate rewards',()=>{
 assert.equal(lootTable.reduce((a,b)=>a+b.weight,0),100);assert.equal(lootTable.find(r=>r.id==='relic').weight,8);
 const s=setup();s.player.hp--;for(let i=0;i<8;i++)assert.equal(drawLoot(s.player,()=> (i+.5)/100).id,'relic');assert.equal(drawLoot(s.player,()=>.085).id,'heal');
 let appearances=0;for(let seed=1;seed<=1000;seed++){const run=newRun(seed),r=currentRoom(run);r.enemies=[];r.trialState='reward';const offers=prepareTrialLoot(run);assert.equal(new Set(offers.map(o=>o.id)).size,3);if(offers.some(o=>o.id==='relic'))appearances++;}
 assert.ok(appearances>100&&appearances<400,appearances);
 s.player.relics=relics.map(r=>r.id);const random=seededRandom(9);for(let i=0;i<100;i++)assert.notEqual(drawLoot(s.player,random).id,'relic');
});
