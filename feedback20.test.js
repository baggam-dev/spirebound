import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,roomLocked,travel} from './engine.js';
import {stepRun,enterRoom} from './simulation.js';
import {chooseEvent} from './adventures.js';
import {openChest} from './loot.js';
import {useFountain} from './fountain.js';
import {collectEssences} from './essences.js';
import {essenceMarkup} from './hud.js';
import {encodeSave,parseSave} from './storage.js';
const enemy=(type='archer',id=0)=>({id,type,x:480,y:300,hp:100,max:100,cd:999,balanceVersion:1});
function combat(){const s=newRun(1);s.room=1;s.attack=999;s.player.hp=s.player.max=10;currentRoom(s).enemies=[];currentRoom(s).obstacles=[];return s;}
test('all grounded enemy families inflict one contact heart with shared immunity',()=>{
 for(const type of ['chaser','charger','archer','scatter','brute','laser','ricochet','flower','minislime','boss','strafer','ringcaster','ambusher']){const s=combat(),r=currentRoom(s);r.enemies=[enemy(type),enemy(type,1)];stepRun(s,.01);assert.equal(s.player.hp,9,type);stepRun(s,.01);assert.equal(s.player.hp,9);}
 const s=combat();s.invulnerable=1;currentRoom(s).enemies=[enemy()];stepRun(s,.01);assert.equal(s.player.hp,10);
});
test('airborne bodies cannot contact hit, entry grace protects nearby bodies',()=>{
 const s=combat(),e={...enemy('boss'),attackPhase:'leap',pattern:'slam',attackTime:.4,fromX:480,fromY:300,targetX:480,targetY:300};currentRoom(s).enemies=[e];stepRun(s,.01);assert.equal(s.player.hp,10);e.attackPhase=null;enterRoom(s);assert.ok(Math.hypot(e.x-s.player.x,e.y-s.player.y)>=100);stepRun(s,.01);assert.equal(s.player.hp,10);
});
test('ricochet projectile inflicts one heart',()=>{const s=combat();s.projectiles=[{x:470,y:300,vx:100,vy:0,enemy:true,ricochet:true,bounces:1,life:2,hit:[]}];stepRun(s,.1);assert.equal(s.player.hp,9);});
test('ascent gates require a clear room; descent gates allow living bosses and stairs',()=>{
 const s=combat();currentRoom(s).enemies=[enemy()];assert.ok(roomLocked(s));s.player.x=931;s.player.y=270;const before=s.room;stepRun(s,.01);assert.equal(s.room,before);s.key=true;assert.equal(roomLocked(s),false);s.player.x=931;stepRun(s,.01);assert.notEqual(s.room,before);
 s.key=false;s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='up');assert.equal(travel(s,1),false);currentRoom(s).enemies=[];assert.ok(travel(s,1));s.key=true;currentRoom(s).enemies=[enemy('boss')];assert.equal(roomLocked(s),false);assert.ok(travel(s,-1));
});
test('fountain generation includes empty, bounded solo fights, and full combined fights',()=>{
 let empty=0,solo=0,combined=0;for(let seed=1;seed<=100;seed++){const s=newRun(seed);for(const rooms of s.floors){const r=rooms.find(r=>r.type==='fountain');if(r.hasChest){combined++;assert.ok(r.enemies.length>=4);}else{solo++;assert.ok(r.enemies.length<=3);if(!r.enemies.length)empty++;}}}assert.ok(combined>90&&combined<210);assert.ok(empty/solo>.2&&empty/solo<.4);
});
test('combined chest and fountain each pay once and persist independently',()=>{
 for(const chestFirst of [true,false]){let s=combat();s.room=s.floors[0].findIndex(r=>r.type==='fountain');let r=currentRoom(s);Object.assign(r,{hasChest:true,chestUsed:false,used:false,enemies:[enemy()],chestReward:{id:'attack3'}});s.player.hp=2;assert.equal(useFountain(s),false);assert.equal(openChest(s),false);r.enemies=[];assert.ok(chestFirst?openChest(s):useFountain(s));s=parseSave(encodeSave(s));assert.ok(chestFirst?useFountain(s):openChest(s));assert.equal(useFountain(s),false);assert.equal(openChest(s),false);assert.equal(s.player.hp,5);assert.equal(s.player.damage,20);}
});
test('trial enemies equal floor number with bounded repeats, stagger and persistent count',()=>{
 for(let seed=0;seed<40;seed++)for(const floor of [2,4]){let s=newRun(seed);s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='event');assert.ok(chooseEvent(s,'trial'));const enemies=currentRoom(s).enemies;assert.equal(enemies.length,floor+1);const counts={};for(const e of enemies){counts[e.type]=(counts[e.type]||0)+1;assert.ok(counts[e.type]<=2);assert.ok(e.trialChampion);}assert.equal(new Set(enemies.map(e=>e.cd)).size,floor+1);s=parseSave(encodeSave(s));assert.equal(currentRoom(s).enemies.length,floor+1);assert.ok(roomLocked(s));}
});
test('essence counts save without applying bonuses twice and show multiplicative cooldown',()=>{
 let s=combat(),r=currentRoom(s);r.essences=['attack','speed','health','haste','ultimate','ultimate','ultimate'].map(id=>({id,x:480,y:300}));collectEssences(s,r);assert.deepEqual(s.player.essenceCounts,{attack:1,speed:1,health:1,haste:1,ultimate:3});assert.equal(s.player.damage,20);s=parseSave(encodeSave(s));collectEssences(s,currentRoom(s));assert.equal(s.player.damage,20);assert.match(essenceMarkup(s.player),/27.1%/);s.player.essenceCounts.attack=-1;assert.throws(()=>encodeSave(s));
});
