import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {tickSpectralBlade,spectralBladeState} from '../../src/combat/spectral-blade.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {takeDamage} from '../../src/combat/survival.js';
import {skills,skillChoices,skillOfferWeight} from '../../src/progression/progression.js';
import {applyLoot,eligibleLoot} from '../../src/progression/loot.js';

function fight(branch){const s=newRun(31),r=currentRoom(s);s.player.aura=3;s.player.evolutions=branch?{aura:branch}:{};s.metrics={damageDealt:0};s.entryGrace=0;r.obstacles=[];r.enemies=[{id:0,type:'archer',x:540,y:300,hp:1000,max:1000,cd:999,balanceVersion:1}];return {s,r,e:r.enemies[0],tick:dt=>tickSpectralBlade(s,r,dt,[])};}

test('a wall appearing during preparation blocks damage; an escaping enemy is not hit',()=>{
 for(const escape of [false,true]){const {r,e,tick}=fight();tick(.01);if(escape)e.x=700;else r.obstacles=[{x:505,y:280,w:10,h:40,type:'rock'}];tick(.11);assert.equal(e.hp,1000);}
});
test('dance rechecks its target and never hits a dead target twice',()=>{
 const {s,e,tick}=fight('dance');tick(.01);tick(.11);assert.ok(e.hp<1000);e.hp=0;const damage=s.metrics.damageDealt;tick(.18);assert.equal(s.metrics.damageDealt,damage);
});
test('precision blade favors an existing mark without advancing it',()=>{
 const {s,r,e,tick}=fight();s.player.mainSkill='precision';s.player.precision=1;
 e.precisionHits=1;e.precisionTime=4;r.enemies.push({...e,id:1,x:500,precisionHits:0});tick(.01);assert.equal(spectralBladeState(s).target,e);tick(.11);assert.equal(e.precisionHits,1);assert.ok(e.hp<1000-52);
});
test('blade poison cannot create poison gas, explosions or primary marks',()=>{
 const {s,e,tick}=fight();s.player.mainSkill='poison';s.player.poison=3;tick(.01);tick(.11);assert.equal(e.bladeDot.kind,'poison');tick(.5);assert.equal(e.poisonStacks,undefined);assert.equal(e.poisonKilled,undefined);assert.equal(e.precisionHits,undefined);
});
test('saved cooldown prevents a repeated slash after loading and rejects corruption',()=>{
 const {s,tick}=fight();tick(.01);const loaded=parseSave(encodeSave(s)),r=currentRoom(loaded),hp=r.enemies[0].hp;tickSpectralBlade(loaded,r,.1,[]);assert.equal(r.enemies[0].hp,hp);assert.ok(loaded.bladeCooldown>0);loaded.bladeCooldown=-1;assert.throws(()=>encodeSave(loaded));
});
test('old level-three aura keeps its guard once; newly learned Vergas does not grant a shield',()=>{
 const {s}=fight();delete s.spectralBladeVersion;const loaded=parseSave(encodeSave(s));assert.equal(loaded.player.legacyAuraGuard,true);assert.equal(takeDamage(loaded,20),'blocked');assert.equal(takeDamage(s,20),'hurt');assert.equal(parseSave(encodeSave(loaded)).player.legacyAuraGuard,true);
});
test('Vergas remains unique while acquisition is rare and owned upgrades use normal weight',()=>{
 const {s}=fight(),skill=skills.find(k=>k.id==='aura');assert.equal(skill.grade,'unique');
 s.player.aura=0;assert.equal(skillOfferWeight(s.player,skill),.04);
 s.player.aura=1;assert.equal(skillOfferWeight(s.player,skill),1);
 s.player.aura=3;assert.ok(!skillChoices(s.player,()=>.5).some(k=>k.id==='aura'));
 assert.equal(skill.weight,.04);assert.equal(skill.max,3);
});
test('saved ordinary-support Vergas rewards remain claimable even when all ordinary supports are capped',()=>{
 const {s,r}=fight();s.player.aura=1;s.player.mainSkill='precision';s.player.precision=1;
 for(const skill of skills)if(skill.tree==='support'&&skill.grade!=='unique')s.player[skill.id]=skill.max;
 r.chestReward={id:'support',skill:'aura'};
 const loaded=parseSave(encodeSave(s));assert.equal(eligibleLoot(loaded.player,'support'),false);
 const reward=currentRoom(loaded).chestReward;assert.deepEqual(applyLoot(loaded,reward),reward);assert.equal(loaded.player.aura,2);
 assert.doesNotThrow(()=>parseSave(encodeSave(loaded)));
});
