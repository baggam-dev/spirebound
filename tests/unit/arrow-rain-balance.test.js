import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {castUltimate,tickRain} from '../../src/combat/abilities.js';
import {grantRelic} from '../../src/progression/relics.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {evolutions} from '../../src/progression/evolutions.js';
function fixture(){const s=newRun(85);s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};const r=currentRoom(s);r.obstacles=[];r.enemies=[{id:0,type:'archer',x:s.player.x+30,y:s.player.y,hp:10000,max:10000,cd:99,balanceVersion:1}];return s;}
test('new rain casts deal 500 percent per pulse with six real pulses and retain the crown multiplier',()=>{
 for(const crown of [false,true]){
  const s=fixture(),r=currentRoom(s);if(crown)grantRelic(s.player,'crown');const perPulse=crown?114.75:85;
  assert.equal(castUltimate(s),true);assert.equal(s.skill,25);assert.equal(r.arrowRain.r,280);assert.equal(r.arrowRain.pulses,1);assert.ok(Math.abs(r.arrowRain.damage-perPulse)<1e-8);
  for(let i=1;i<6;i++)tickRain(s,.3);assert.equal(r.arrowRain.pulses,6);assert.ok(Math.abs(10000-r.enemies[0].hp-perPulse*6)<1e-8);tickRain(s,.3);assert.equal(r.arrowRain,null);
 }
 assert.ok(evolutions.ultimate.find(e=>e.id==='burst').description.includes('500%씩 6회'));
});
test('an already active legacy rain keeps its saved cast damage while the next cast uses the new coefficient',()=>{
 let s=fixture(),r=currentRoom(s);r.arrowRain={x:s.player.x,y:s.player.y,r:280,elapsed:0,pulses:1,damage:119};
 s=parseSave(encodeSave(s));r=currentRoom(s);tickRain(s,.3);assert.equal(r.arrowRain.damage,119);assert.equal(r.enemies[0].hp,9881);
 tickRain(s,1.5);assert.equal(r.arrowRain,null);s.skill=0;assert.equal(castUltimate(s),true);assert.equal(r.arrowRain.damage,85);
});
