import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,enrage} from './engine.js';
import {claimTreasure,chooseEvent,canChooseEvent,claimTrial} from './adventures.js';
import {chooseEvolution,pendingEvolution} from './evolutions.js';
import {hitEnemy} from './progression.js';
import {fireArrow,stepRun,enterRoom} from './simulation.js';
import {castUltimate} from './abilities.js';
import {promoteElite,updateElites,eliteDeath,tickBlasts} from './elites.js';
import {returnRoutes} from './routes.js';
import {encodeSave,parseSave} from './storage.js';
function at(type){const s=newRun(312);s.floor=type==='event'?2:0;s.room=s.floors[s.floor].findIndex(r=>r.type===type);currentRoom(s).enemies=[];currentRoom(s).seen=true;return s;}
test('treasure grants one fixed random reward and rejects repeats or occupied rooms',()=>{const s=at('treasure');currentRoom(s).chestReward={id:'attack3'};assert.ok(claimTreasure(s));assert.equal(s.player.damage,20);assert.equal(claimTreasure(s),false);const t=at('treasure');currentRoom(t).enemies=[{}];assert.equal(claimTreasure(t),false);});
test('events enforce affordable visible costs and cannot be purchased twice',()=>{
 const s=at('event');s.player.hp=2;assert.equal(canChooseEvent(s,'blood'),false);assert.equal(chooseEvent(s,'blood'),false);s.player.hp=3;assert.ok(chooseEvent(s,'blood'));assert.equal(s.player.hp,1);assert.equal(s.player.armor,2);assert.equal(chooseEvent(s,'supply'),false);
 const t=at('event');assert.ok(chooseEvent(t,'supply'));assert.equal(t.player.potions,0);assert.equal(t.player.unique,true);
});
test('trial battle, save, clear and reward have exactly-once transitions',()=>{
 let s=at('event');assert.ok(chooseEvent(s,'trial'));assert.equal(currentRoom(s).enemies.length,3);assert.equal(claimTrial(s,'weapon'),false);s=parseSave(encodeSave(s));currentRoom(s).enemies.forEach(e=>e.hp=0);stepRun(s,.01);assert.equal(currentRoom(s).trialState,'reward');assert.equal(currentRoom(s).trialOffers.length,3);assert.ok(claimTrial(s,0));assert.equal(claimTrial(s,0),false);assert.equal(s.pendingLevels,0); // three kills remain below the first XP threshold
});
test('skill evolution requires level three, locks once, and resumes pending choice after save',()=>{
 let s=newRun(2);s.player.chain=2;assert.equal(chooseEvolution(s.player,'chain','surge'),false);s.player.chain=3;s=parseSave(encodeSave(s));assert.equal(pendingEvolution(s.player),'chain');assert.ok(chooseEvolution(s.player,'chain','surge'));assert.equal(chooseEvolution(s.player,'chain','web'),false);assert.equal(parseSave(encodeSave(s)).player.evolutions.chain,'surge');
});
test('lightning branches trade concentrated damage for additional sharply fading links',()=>{
 const enemies=()=>Array.from({length:6},(_,i)=>({x:i*50,y:0,hp:100}));
 const a=enemies();hitEnemy({damage:20,chain:3,evolutions:{chain:'surge'}},a[0],a);assert.equal(a[1].hp,87);assert.equal(a[2].hp,100);
 const b=enemies();hitEnemy({damage:20,chain:3,evolutions:{chain:'web'}},b[0],b);assert.equal(b[1].hp,96);assert.ok(b[5].hp<100);assert.ok(100-b[2].hp<100-b[1].hp);
});
test('arrow branches change spread, penetration and timing without multiplying primary arrows',()=>{
 const s=newRun(2);s.player.split=3;s.player.pierce=3;s.player.evolutions={split:'fan',pierce:'depth',haste:'tempo'};fireArrow(s,{x:700,y:300});assert.equal(s.projectiles.filter(b=>b.damageScale===1).length,1);assert.equal(s.projectiles[0].pierce,5);assert.equal(s.projectiles[1].damageScale,.5);assert.equal(s.attack,.65*.85);
 s.projectiles=[];s.player.evolutions.pierce='impact';fireArrow(s,{x:700,y:300});assert.equal(s.projectiles[0].pierce,0);
});
test('ultimate field deals bounded damage only within its region and expires',()=>{
 const s=at('normal'),r=currentRoom(s);s.player.split=4;s.player.chain=1;s.player.evolutions={ultimate:'field'};s.attack=999;r.enemies=[{id:0,type:'archer',x:500,y:300,hp:500,max:500,cd:999},{id:1,type:'archer',x:900,y:100,hp:500,max:500,cd:999}];assert.ok(castUltimate(s));assert.equal(r.enemies[0].hp,500);for(let i=0;i<301;i++)stepRun(s,1/60);assert.ok(Math.abs(r.enemies[0].hp-300)<.001);assert.equal(r.enemies[1].hp,500);assert.equal(r.allyZone,null);
});
test('guardian protection ends with its owner; explosive elite detonates only after warning',()=>{
 const a={id:0,x:200,y:200,hp:100,max:100,type:'chaser'},b={id:1,x:220,y:200,hp:100,max:100,type:'chaser'},r={enemies:[a,b]};promoteElite(a,'guardian');updateElites(r,.01,[],{x:500,y:300});hitEnemy({damage:20},b,r.enemies);assert.equal(b.hp,90);a.hp=0;updateElites(r,.01,[],{x:500,y:300});hitEnemy({damage:20},b,r.enemies);assert.equal(b.hp,70);
 a.elite='explosive';eliteDeath(a,r);let hits=0;tickBlasts(r,.9,a,()=>hits++);assert.equal(hits,0);tickBlasts(r,.11,a,()=>hits++);tickBlasts(r,1,a,()=>hits++);assert.equal(hits,1);
});
test('volley elite warns for a full interval and locks aim before its added shots',()=>{
 const e={x:200,y:200,hp:100,max:100,type:'chaser'},r={enemies:[e]},b=[];promoteElite(e,'volley');e.eliteCooldown=0;updateElites(r,.01,b,{x:400,y:200});for(let i=0;i<70;i++)updateElites(r,.01,b,{x:200,y:400});assert.equal(b.length,0);for(let i=0;i<11;i++)updateElites(r,.01,b,{x:200,y:400});assert.equal(b.length,3);assert.equal(b[1].vy,0);
});
test('return paths offer distinct routes in new maps and never reveal unseen rooms',()=>{
 for(let seed=0;seed<40;seed++){const s=newRun(seed);enrage(s);for(let f=0;f<6;f++){s.floor=f;s.floors[f].forEach(r=>r.seen=true);s.room=s.floors[f].findIndex(r=>r.type==='up'||r.type==='boss');const paths=returnRoutes(s);assert.ok(paths.short.length&&paths.safe.length);assert.notDeepEqual(paths.short,paths.safe);assert.ok(paths.safe.filter(i=>s.floors[s.floor][i].returnRisk==='high').length<paths.short.filter(i=>s.floors[s.floor][i].returnRisk==='high').length);s.floors[s.floor][1].seen=false;assert.ok(returnRoutes(s).safe.every(i=>s.floors[s.floor][i].seen));}}
});
test('new choice and hazard state is validated rather than silently accepting invalid ids',()=>{
 const s=newRun(3);s.player.evolutions={chain:'invalid'};assert.throws(()=>encodeSave(s));delete s.player.evolutions;s.routePreference='teleport';assert.throws(()=>encodeSave(s));
});
test('leaving a trial preserves damage and does not grant its reward early',()=>{
 const s=at('event'),index=s.room;chooseEvent(s,'trial');const r=currentRoom(s),hp=r.enemies[0].hp-=10;s.room=0;enterRoom(s);s.room=index;enterRoom(s);assert.equal(r.enemies[0].hp,hp);assert.equal(r.trialState,'active');assert.equal(claimTrial(s,'weapon'),false);
});
test('elite reward is not repeated after saving its delayed explosion',()=>{
 let s=at('normal');const r=currentRoom(s);r.enemies=[{id:0,type:'chaser',elite:'explosive',x:800,y:400,hp:0,max:100,cd:1,balanceVersion:1}];stepRun(s,.01);assert.equal(s.player.potions,2);assert.equal(r.blasts.length,1);s=parseSave(encodeSave(s));for(let i=0;i<100;i++)stepRun(s,.02);assert.equal(s.player.potions,2);assert.equal(currentRoom(s).blasts.length,0);
});
