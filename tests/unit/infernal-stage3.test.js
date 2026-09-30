import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from '../../src/game/engine.js';
import {seededRandom} from '../../src/game/random.js';
import {encounter} from '../../src/world/encounters.js';
import {formationPool,upperEncounter} from '../../src/world/formations.js';
import {updateInfernal,infernalTypes} from '../../src/combat/infernal-enemies.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {stepRun} from '../../src/game/simulation.js';

const foe=(type,cd=0)=>({id:0,type,x:300,y:260,hp:100,max:100,cd,tier:8});
const room=e=>({enemies:[e],obstacles:[]});
const tick=(e,p,seconds,bullets=[],hurt=()=>{})=>{const r=room(e);for(let i=0;i<Math.ceil(seconds/.02);i++)updateInfernal(e,p,r,.02,bullets,hurt);};

test('sixth through ninth floors favor their own packs and ninth has every demon role',()=>{
 const themes=new Map([[5,'hive'],[6,'sniper'],[7,'royal'],[8,'infernal']]);
 for(const [floor,prefix] of themes){let focus=0;const seen=new Set();for(let seed=0;seed<250;seed++){const pack=upperEncounter(floor,seededRandom(seed));const id=pack[0].formation;seen.add(id);if(id.startsWith(prefix)||floor===6&&['gravity','escort','crossfire','vanguard','pursuit','siege','garden'].includes(id)||floor===7&&['rift','court','hunt','bulwark'].includes(id))focus++;}assert.ok(focus>150,`${floor+1}F focus ${focus}/250`);assert.ok(formationPool(floor).length>0);}
 const types=new Set();for(let seed=0;seed<100;seed++)for(const e of encounter(8,seededRandom(seed*7919)))if(infernalTypes.includes(e.type))types.add(e.type);
 assert.deepEqual(types,new Set(infernalTypes));
 for(const formation of formationPool(8).filter(f=>f.theme===8))assert.ok(!['demonBat','spikeNest','demonArcher'].every(t=>formation.units.includes(t)),formation.id);
 assert.equal(newRun(77,{campaign:'expanded'}).floors[8][1].enemies.some(e=>e.type==='demonBat'),true);
});

test('infernal attacks telegraph, lock their target, and serialize through save',()=>{
 const p={x:420,y:260},nest=foe('spikeNest'),hits=[];tick(nest,p,.02,[],(...args)=>hits.push(args));assert.equal(nest.attackPhase,'warning');assert.equal(hits.length,0);
 const locked={x:nest.targetX,y:nest.targetY};tick(nest,{x:700,y:440},.92,[],(...args)=>hits.push(args));assert.equal(hits.length,0);assert.deepEqual(locked,{x:nest.targetX,y:nest.targetY});
 const archer=foe('demonArcher'),shots=[];tick(archer,p,.02,shots);assert.equal(shots.length,0);tick(archer,p,.7,shots);assert.equal(shots.length,2);assert.ok(shots.every(b=>b.enemy&&b.life===4));
 const s=newRun(55,{campaign:'expanded'}),r=s.floors[8].find(r=>r.enemies.some(e=>e.type==='demonArcher'));assert.ok(r);const loaded=parseSave(encodeSave(s));assert.equal(loaded.floors[8].find(x=>x.x===r.x&&x.y===r.y).enemies.some(e=>e.type==='demonArcher'),true);
});

test('fast bat self-destructs after a warning while soldier and captain retain dodge windows',()=>{
 const bat=foe('demonBat'),p={x:360,y:260},hits=[];tick(bat,p,.02,[],(...args)=>hits.push(args));assert.equal(bat.attackPhase,'warning');assert.equal(hits.length,0);tick(bat,p,.9,[],(...args)=>hits.push(args));assert.equal(bat.hp,0);assert.equal(bat.summoned,true);assert.equal(bat.selfDestruct,true);
 for(const type of ['demonSoldier','demonCaptain']){const e=foe(type),target={x:350,y:260};tick(e,target,.02);assert.equal(e.attackPhase,'warning');const escaped=[];tick(e,{x:350,y:430},1.3,[],(...args)=>escaped.push(args));assert.equal(escaped.length,0);}
});

test('previous classic and expanded saves load without being relabeled',()=>{
 for(const [campaign,season,rules] of [['classic','BETA-1','ranking-v1'],['expanded','ASCENT-3','ranking-v4']]){const s=newRun(55,{campaign});s.ranking.seasonId=season;s.ranking.rulesVersion=rules;const loaded=parseSave(encodeSave(s));assert.equal(loaded.ranking.seasonId,season);assert.equal(loaded.ranking.rulesVersion,rules);}
});

test('live bat explosion resolves through combat without awarding a player kill',()=>{
 const s=newRun(12,{campaign:'expanded'});s.floor=8;s.room=1;s.player.x=360;s.player.y=260;s.attack=999;s.invulnerable=999;s.entryGrace=0;
 const r=s.floors[8][1];r.enemies=[foe('demonBat')];for(let i=0;i<80&&r.enemies.length;i++)stepRun(s,.02);
 assert.equal(r.enemies.length,0);assert.equal(s.kills,0);assert.deepEqual(s.ranking.defeated,[]);assert.equal(s.bestiary?.demonBat?.kills||0,0);
});
