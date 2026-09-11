import test from 'node:test';import assert from 'node:assert/strict';
import {newRun} from './engine.js';import {applySkill} from './progression.js';
import {heartContainer,migrateHealth,damageHearts,heal} from './health.js';
test('start at five hearts, containers cap at ten and haste does not grow health',()=>{const s=newRun(),p=s.player;assert.equal(p.hp,5);assert.equal(p.max,5);applySkill(p,'haste');assert.equal(p.max,5);for(let i=0;i<8;i++)heartContainer(p);assert.equal(p.max,10);assert.equal(heartContainer(p),false);p.hp=9;heal(p,3);assert.equal(p.hp,10);});
test('legacy health conversion keeps health ratio and is idempotent',()=>{const s={player:{hp:50,max:100}};migrateHealth(s);assert.equal(s.player.hp,3);assert.equal(s.player.max,5);migrateHealth(s);assert.equal(s.player.hp,3);});
test('light, heavy and boss slam attacks deal integer hearts',()=>{assert.equal(damageHearts(10),1);assert.equal(damageHearts(20),2);assert.equal(damageHearts(24),3);});
