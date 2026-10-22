import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareEnemyGroup,moveWaitingEnemy} from '../../src/combat/enemy-group.js';
import {enemyMovementGoal,enemyNavigationTarget,enemySeparationStep} from '../../src/world/enemy-movement-goals.js';
import {moveBody,blocked} from '../../src/world/terrain.js';
import {seekEnemyShot} from '../../src/combat/enemy-sightline.js';
import {updateChaserAttack} from '../../src/combat/chaser.js';
import {warningCount} from '../../src/combat/tactics.js';
import {updateElites} from '../../src/combat/elites.js';
const actor=(id,type='chaser',extra={})=>({id,type,x:350,y:270,hp:100,max:100,cd:1,...extra});
const setup=(enemies,obstacles=[])=>({room:{enemies,obstacles},p:{x:480,y:270,hp:5}});
test('crowded melee choose distinct approach positions without writing actors or the player',()=>{
 const {room,p}=setup([actor(0),actor(1),actor(2)]),before=JSON.stringify({room,p});prepareEnemyGroup(room,p,.016);
 const goals=room.enemies.map(e=>enemyMovementGoal(e,p));assert.ok(goals.every(g=>g.positioned));assert.ok(new Set(goals.map(g=>g.target.x+','+g.target.y)).size>1);assert.equal(JSON.stringify({room,p}),before);
 for(const g of goals){const theta=Math.atan2(g.target.y-p.y,g.target.x-p.x);assert.ok(Math.cos(theta)<0,'stay on the approaching side');}
});
test('attack, frozen, boss, named and fixed bodies never receive formation movement',()=>{
 const enemies=[actor(0),actor(1,'charger',{meleeAttack:{stage:'windup',time:.2,aim:0}}),actor(2,'brute',{phase:'air'}),actor(3,'archer',{attackPhase:'warning'}),actor(4,'chaser',{frozen:1}),actor(5,'boss'),actor(6,'starKnight',{gateTitle:'칼드'}),actor(7,'pulseTurret'),actor(8,'charger',{trialChampion:true,cd:1.8}),actor(9,'brute',{meleeCooldown:.2})],{room,p}=setup(enemies);prepareEnemyGroup(room,p,.016);
 for(const e of enemies.slice(1)){assert.equal(enemyMovementGoal(e,p),null);assert.equal(enemyNavigationTarget(e,p),p);}
});
test('separation preserves the movement budget and cannot push the player or redirect a new windup',()=>{
 const e=actor(0),{room,p}=setup([e,actor(1)]);prepareEnemyGroup(room,p,.016);const step=enemySeparationStep(e,3,4);assert.ok(Math.abs(Math.hypot(step.dx,step.dy)-5)<1e-8);assert.deepEqual(enemySeparationStep(p,3,4),{dx:3,dy:4});
 e.chaserWindup=.1;assert.deepEqual(enemySeparationStep(e,3,4),{dx:3,dy:4});
});
test('a close ranged actor repositions during cooldown but a ready shot is never held for a group slot',()=>{
 const e=actor(0,'laser',{x:400}),{room,p}=setup([e,actor(1,'charger',{x:400,y:280})]);prepareEnemyGroup(room,p,.016);const x=e.x;
 assert.equal(seekEnemyShot(e,p,room.obstacles,.1,{speed:30}),false);assert.ok(e.x<x);e.cd=0;assert.equal(seekEnemyShot(e,p,room.obstacles,.1,{speed:30}),true);
});
test('waiting movement stays bounded, respects cover and leaves player coordinates unchanged',()=>{
 const e=actor(0),wall={x:380,y:150,w:40,h:240,type:'bookshelf'},{room,p}=setup([e,actor(1)], [wall]),before=JSON.stringify(p);prepareEnemyGroup(room,p,.016);
 for(let i=0;i<10;i++)moveWaitingEnemy(e,p,room,.016);assert.equal(blocked(e.x,e.y,18,room.obstacles),false);assert.equal(JSON.stringify(p),before);assert.ok(Math.hypot(e.x-350,e.y-270)<=30);
 const b={x:350,y:270};moveBody(b,100,0,room.obstacles,18);assert.equal(blocked(b.x,b.y,18,room.obstacles),false);
});
test('new room/actor references discard hints and normal single-enemy pursuit remains available',()=>{
 const e=actor(0),{room,p}=setup([e,actor(1)]);prepareEnemyGroup(room,p,.016);assert.ok(enemyMovementGoal(e,p));const single={enemies:[actor(3)],obstacles:[]};prepareEnemyGroup(single,p,.016);assert.equal(enemyMovementGoal(e,p),null);assert.equal(enemyNavigationTarget(single.enemies[0],p),p);
});
test('chaser shares the two-warning budget without canceling an existing fixed-aim attack',()=>{
 const a=actor(0,'archer',{attackPhase:'warning'}),b=actor(1,'laser',{phase:'aim'}),e=actor(2,'chaser',{x:440,chaserCooldown:0}),{room,p}=setup([a,b,e]);assert.equal(warningCount(room,e),2);updateChaserAttack(e,p,[],.01,warningCount(room,e)<2);assert.equal(e.chaserWindup,undefined);
 e.chaserWindup=.01;e.chaserAim=0;assert.equal(updateChaserAttack(e,p,[],.02,false),9);assert.ok(e.chaserStrike>0);
});
test('an elite volley does not begin on top of a committed chaser slash or charger dash',()=>{
 for(const extra of [{chaserWindup:.1},{chargeAngle:0}]){const e=actor(0,'chaser',{elite:'volley',eliteCooldown:0,...extra}),{room,p}=setup([e]);updateElites(room,.016,[],p);assert.ok(!(e.eliteWarning>0));}
});
