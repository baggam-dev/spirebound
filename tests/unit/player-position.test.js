import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,roomLocked,enrage} from '../../src/game/engine.js';
import {castBlink} from '../../src/combat/abilities.js';
import {stepRun,enterRoom} from '../../src/game/simulation.js';
import {blocked} from '../../src/world/terrain.js';
import {recoverPlayerPosition} from '../../src/world/player-position.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
test('diagonal blink at left doorway never wraps outside and clamps into lower wall',()=>{
 const s=newRun(5);s.room=4;s.player.x=48;s.player.y=270;assert.ok(castBlink(s,{x:-1,y:1}));assert.ok(!blocked(s.player.x,s.player.y,14,currentRoom(s).obstacles));assert.ok(s.player.y<301);assert.ok(s.dodge>0);
});
test('all doorway directions and campaign rooms remain clear after blink',()=>{
 for(const campaign of ['classic','expanded']){const s=newRun(5,{campaign});for(let f=0;f<s.floors.length;f++)for(let r=0;r<s.floors[f].length;r++)for(const [x,y] of [[48,270],[912,270],[480,63],[480,477]])for(const [dx,dy] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){s.floor=f;s.room=r;Object.assign(s.player,{x,y});s.dodge=0;castBlink(s,{x:dx,y:dy});assert.ok(!blocked(s.player.x,s.player.y,14,currentRoom(s).obstacles),`${campaign}/${f}/${r}/${x}/${y}/${dx}/${dy}`);assert.ok(s.player.x>=31&&s.player.x<=929&&s.player.y>=49&&s.player.y<=491);}}
});
test('existing stuck save is repaired without changing build, health, cooldowns or seal',()=>{
 for(const generation of [27,33,34]){const s=newRun(5);s.generationVersion=generation;if(generation===27){s.ranking.seasonId='BETA-3';s.ranking.rulesVersion='ranking-v7';}s.floors[0][4].seen=true;enrage(s);s.room=4;s.player.x=50;s.player.y=386.67;s.player.precision=1;s.player.mainSkill='precision';s.dodge=7;s.skill=13;const raw=encodeSave(s),before=JSON.parse(JSON.stringify(s)),loaded=parseSave(raw);assert.ok(!blocked(loaded.player.x,loaded.player.y,14,currentRoom(loaded).obstacles));assert.equal(loaded.room,before.room);assert.equal(loaded.floor,before.floor);assert.equal(loaded.player.hp,before.player.hp);assert.equal(loaded.player.precision,1);assert.equal(loaded.dodge,7);assert.equal(loaded.skill,13);assert.deepEqual(loaded.floors,before.floors);assert.deepEqual(loaded.ranking,before.ranking);assert.equal(roomLocked(loaded),roomLocked(before));assert.ok(parseSave(encodeSave(loaded)));}
});
test('idle and room entry recover invalid player without requiring blink or granting immunity',()=>{
 const s=newRun(5);s.room=4;const r=currentRoom(s);r.enemies=[];s.player.x=50;s.player.y=386.67;s.dodge=7;s.invulnerable=0;stepRun(s,.001);assert.ok(!blocked(s.player.x,s.player.y,14,r.obstacles));assert.equal(s.invulnerable,0);const before={x:s.player.x,y:s.player.y};stepRun(s,.001);assert.deepEqual({x:s.player.x,y:s.player.y},before);s.player.x=50;s.player.y=386.67;enterRoom(s);assert.ok(!blocked(s.player.x,s.player.y,14,r.obstacles));
});
test('recovery leaves valid positions and open doorway movement untouched',()=>{
 const s=newRun(5);s.room=4;const r=currentRoom(s);s.player.x=48;s.player.y=270;assert.equal(recoverPlayerPosition(s.player,r.obstacles),false);s.tutorialComplete=true;r.enemies=[];s.player.x=31;stepRun(s,.1,{x:-1,y:0});assert.notEqual(s.room,4);assert.ok(!blocked(s.player.x,s.player.y,14,currentRoom(s).obstacles));
});
