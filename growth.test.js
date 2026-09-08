import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from './engine.js';
import {xpRequired,migrateRun} from './progression.js';
test('start with one potion; existing inventory survives migration',()=>{const s=newRun();assert.equal(s.player.potions,1);s.player.potions=4;migrateRun(s);assert.equal(s.player.potions,4);});
test('experience thresholds increase 35 percent rounded up',()=>{assert.equal(xpRequired(1),41);assert.equal(xpRequired(2),81);assert.equal(xpRequired(3),122);for(let level=1;level<30;level++)assert.equal(xpRequired(level),Math.ceil(level*30*1.35));});
