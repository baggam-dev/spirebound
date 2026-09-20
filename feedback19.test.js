import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,roomLocked,travel,enrage} from './engine.js';
import {stepRun,enterRoom,enemyAirborne} from './simulation.js';
import {incantations,enterShrine,prepareIncantations,claimIncantation} from './shrine.js';
import {parseSave,encodeSave} from './storage.js';
import {updatePrismSummons} from './prism.js';
import {splitSlime,updatePoisonEnemy,bossHealth} from './poison.js';
import {seededRandom} from './random.js';
import {updateReturnEnemy,returnEnemyTypes} from './return-enemies.js';
import {encounter} from './encounters.js';
import {movementSpeed,attackInterval,ultimateCooldown,ownedRelics,relics} from './relics.js';
import {hitEnemy,skills} from './progression.js';
import {iconSVG} from './pixel-icons.js';
import {healthMarkup,displayedStats,createDamageMeter} from './hud.js';

function shrine(seed=9){const s=newRun(seed);s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='shrine');s.attack=999;enterRoom(s);return s;}
function boss(kind='prism'){const s=newRun(44);s.floor=kind==='prism'?3:5;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');s.attack=999;s.invulnerable=999;return s;}
const foe=(id=0)=>({id,type:'chaser',x:650,y:300,hp:100,max:100,cd:1,balanceVersion:1});

test('shrine room contains only elites and cannot be left before mandatory choice',()=>{
 const s=shrine(),r=currentRoom(s);assert.equal(r.enemies.length,3);assert.ok(r.enemies.every(e=>e.elite));assert.ok(roomLocked(s));assert.equal(claimIncantation(s,0),false);
 s.player.x=931;s.player.y=270;const room=s.room;stepRun(s,.01);assert.equal(s.room,room);assert.equal(travel(s,1),false);
 r.enemies.forEach(e=>e.hp=0);assert.ok(stepRun(s,.01).events.includes('incantation'));assert.equal(r.shrineState,'choice');assert.equal(r.incantations.length,2);const time=s.elapsed;stepRun(s,1);assert.equal(s.elapsed,time);assert.ok(claimIncantation(s,0));assert.equal(roomLocked(s),false);assert.equal(claimIncantation(s,1),false);
});
test('shrine has ten blessings and five curses, including double-curse offers that persist on reload',()=>{
 assert.equal(incantations.filter(k=>k.good).length,10);assert.equal(incantations.filter(k=>!k.good).length,5);let found=false;
 for(let seed=0;seed<80;seed++){const s=shrine(seed),r=currentRoom(s);r.enemies=[];prepareIncantations(s);assert.equal(new Set(r.incantations).size,2);const copy=parseSave(encodeSave(s));assert.deepEqual(currentRoom(copy).incantations,r.incantations);if(r.incantations.every(id=>!incantations.find(k=>k.id===id).good))found=true;}
 assert.ok(found);
});
test('legacy unused shrine is populated once on entry, used shrines never regain rewards',()=>{
 const s=shrine(),r=currentRoom(s);delete r.shrineState;r.enemies=[];enterShrine(s);assert.equal(r.enemies.length,3);r.enemies[0].hp=1;enterShrine(s);assert.equal(r.enemies[0].hp,1);r.used=true;r.enemies=[];delete r.shrineState;enterShrine(s);assert.equal(r.enemies.length,0);
});
test('all incantations apply once, affect combat stats, and preserve valid saves',()=>{
 for(const k of incantations){const s=shrine(),r=currentRoom(s);r.enemies=[];prepareIncantations(s);r.incantations=[k.id,k.id==='might'?'blood':'might'];r.incantationRelic='boots';s.player.hp=3;const p=s.player;const before=displayedStats(p);assert.ok(claimIncantation(s,0));assert.equal(claimIncantation(s,0),false);
  if(k.id==='frailty'){const e=foe();hitEnemy(p,e,[e]);assert.ok(Math.abs(e.hp-(100-17*.92))<1e-8);}
  if(k.id==='torpor')assert.ok(attackInterval(p)>.65);if(k.id==='burden')assert.ok(movementSpeed(p)<174);if(k.id==='silence')assert.ok(ultimateCooldown(p)>25);if(k.id==='rain')assert.equal(ultimateCooldown(p),22.5);if(k.id==='blood')assert.equal(p.hp,1);if(k.id==='relic')assert.equal(ownedRelics(p).length,1);if(k.id==='might')assert.ok(displayedStats(p).attack>before.attack);
  assert.doesNotThrow(()=>parseSave(encodeSave(s)));
 }
});
test('prism first summons at two seconds, caps three living elites, and all summoned deaths have no rewards',()=>{
 const s=boss(),r=currentRoom(s),e=r.enemies[0],random=seededRandom(3);updatePrismSummons(e,s.player,r,1.99,random);assert.equal(r.enemies.length,1);updatePrismSummons(e,s.player,r,.02,random);assert.equal(r.enemies.length,2);assert.ok(r.enemies[1].elite&&r.enemies[1].summoned);
 for(let i=0;i<5;i++)updatePrismSummons(e,s.player,r,7,random);assert.equal(r.enemies.length,4);const potions=s.player.potions;r.enemies.slice(1).forEach(e=>e.hp=0);stepRun(s,.01);assert.equal(s.player.potions,potions);assert.equal(s.player.xp,0);assert.equal(r.essences?.length||0,0);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('prism summon timer is preserved rather than restarted on resume',()=>{
 const s=boss(),r=currentRoom(s),e=r.enemies[0];updatePrismSummons(e,s.player,r,1,seededRandom(1));const t=parseSave(encodeSave(s));assert.equal(currentRoom(t).enemies[0].summonClock,1);updatePrismSummons(currentRoom(t).enemies[0],t.player,currentRoom(t),2,seededRandom(1));assert.equal(currentRoom(t).enemies.length,2);
});
test('slime splitting leaves a puddle and airborne children land at separated telegraphed destinations',()=>{
 const s=boss('slime'),r=currentRoom(s),e=r.enemies.shift();splitSlime(e,r,s.player,seededRandom(5));assert.equal(r.enemies.length,2);assert.equal(r.hazards[0].kind,'puddle');assert.equal(r.hazards[0].phase,'warning');const [a,b]=r.enemies;assert.ok(enemyAirborne(a));assert.ok(Math.hypot(a.landX-b.landX,a.landY-b.landY)>=180);
 for(const c of r.enemies){assert.ok(Math.hypot(c.landX-s.player.x,c.landY-s.player.y)>=145);updatePoisonEnemy(c,s.player,r,.55);assert.ok(enemyAirborne(c));updatePoisonEnemy(c,s.player,r,.55);assert.equal(enemyAirborne(c),false);assert.equal(c.x,c.landX);assert.equal(c.y,c.landY);}
 assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('airborne split progression resumes identically from saved mid-jump state',()=>{
 const s=boss('slime'),r=currentRoom(s),e=r.enemies.shift();splitSlime(e,r,s.player,seededRandom(8));stepRun(s,.3);const copy=parseSave(encodeSave(s));for(let i=0;i<60;i++){stepRun(s,1/60);stepRun(copy,1/60);}assert.deepEqual(currentRoom(copy).enemies,r.enemies);
});
test('slime has needle and orb projectile patterns and shrinking close gas',()=>{
 for(const stage of [0,1,2]){const radii=[];for(const turn of [stage<2?4:3,stage<2?5:4]){const e={...foe(),type:'boss',variant:'slime',stage,poisonTurn:turn,cd:0},r={enemies:[e],hazards:[],obstacles:[]},bullets=[];updatePoisonEnemy(e,{x:400,y:400},r,.01,bullets);assert.equal(bullets.length>0,stage<2);assert.ok(bullets.every(b=>b.poisonShot));radii.push(r.hazards.find(h=>h.closeGas).r);}assert.ok(radii.every(r=>r===90-stage*20));}
});
test('boss health bar uses actual total health through splits and final fragment deaths',()=>{
 const s=boss('slime'),r=currentRoom(s);assert.deepEqual(bossHealth(r),{current:4050,max:4050,ratio:1});const e=r.enemies.shift();e.hp=0;splitSlime(e,r,s.player,seededRandom(4));assert.equal(bossHealth(r).max,4050);assert.ok(Math.abs(bossHealth(r).ratio-2/3)<1e-8);r.enemies.shift();assert.ok(Math.abs(bossHealth(r).ratio-1/3)<1e-8);
});
test('return variants replace part of existing packs without increasing count or appearing on ascent',()=>{
 const found=new Set();for(let seed=0;seed<60;seed++){const regular=encounter(2,seededRandom(seed)),down=encounter(2,seededRandom(seed),[],4);assert.ok(regular.every(e=>!returnEnemyTypes.includes(e.type)));assert.ok(down.length===11||down.length===12);for(const e of down)if(returnEnemyTypes.includes(e.type))found.add(e.type);}assert.deepEqual([...found].sort(),[...returnEnemyTypes].sort());
});
test('new return attackers telegraph and produce distinct attacks with saved state',()=>{
 for(const type of returnEnemyTypes){const e={...foe(),type,cd:0,escapeDepth:4},p={x:400,y:300},bullets=[];updateReturnEnemy(e,p,[],.01,bullets);assert.equal(e.attackPhase,'warning');assert.equal(bullets.length,0);const copy=structuredClone(e),other=[];for(let i=0;i<70;i++){updateReturnEnemy(e,p,[],.02,bullets);updateReturnEnemy(copy,p,[],.02,other);}assert.deepEqual(e,copy);assert.deepEqual(bullets,other);if(type!=='ambusher')assert.ok(bullets.length>0);}
});
test('multiple elites award at most one potion per room even after save and reentry',()=>{
 const s=newRun(7),r=currentRoom(s);s.attack=999;r.enemies=[{...foe(0),hp:0,elite:'volley'},{...foe(1),hp:0,elite:'guardian'}];stepRun(s,.01);assert.equal(s.player.potions,2);const copy=parseSave(encodeSave(s));currentRoom(copy).enemies=[{...foe(2),hp:0,elite:'volley'}];enterRoom(copy);stepRun(copy,.01);assert.equal(copy.player.potions,2);
});
test('pixel icons have distinct relic and skill silhouettes and hearts never show unused diamonds',()=>{
 assert.equal(new Set(relics.map(k=>iconSVG(k.id))).size,31);assert.equal(new Set(skills.map(k=>iconSVG(k.id))).size,12);for(const id of [...relics,...skills].map(k=>k.id)){const svg=iconSVG(id);assert.ok(svg.includes('viewBox="0 0 16 16"'));assert.ok(!svg.includes('NaN'));}assert.ok(!healthMarkup({hp:5,max:8}).includes('◇'));assert.ok(healthMarkup({hp:23,max:25}).includes('23/25'));
});
test('DPS readout measures the last five seconds and resets between runs',()=>{
 const meter=createDamageMeter(),s={runId:'one',elapsed:0,metrics:{damageDealt:0}};assert.equal(meter(s),0);for(let i=1;i<=6;i++){s.elapsed=i;s.metrics.damageDealt=i*100;meter(s);}assert.equal(meter(s),100);s.elapsed=12;assert.equal(meter(s),0);assert.equal(meter({runId:'two',elapsed:0,metrics:{damageDealt:0}}),0);
});
test('invalid incantations, multipliers, summoning clocks and jump destinations are rejected',()=>{
 const s=shrine(),r=currentRoom(s);r.incantations=['blood','blood'];assert.throws(()=>encodeSave(s));delete r.incantations;s.player.hexes={damage:-1};assert.throws(()=>encodeSave(s));delete s.player.hexes;r.enemies[0].summonClock=99;assert.throws(()=>encodeSave(s));delete r.enemies[0].summonClock;Object.assign(r.enemies[0],{phase:'splitJump',phaseTime:.5,landX:9999,landY:200,launchX:100,launchY:100});assert.throws(()=>encodeSave(s));
});

test('ascent trial strength does not enable descent-only enemy variants',()=>{
 for(let seed=1;seed<=50;seed++){const pack=encounter(4,seededRandom(seed),[],5,false);assert.ok(pack.every(e=>!returnEnemyTypes.includes(e.type)));assert.ok(pack.every(e=>e.escapeDepth===5));}
});
