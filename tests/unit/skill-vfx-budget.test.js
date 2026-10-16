import test from 'node:test';
import assert from 'node:assert/strict';
import {limitPlayerBlasts} from '../../src/rendering/skill-burst-art.js';
import {limitSynergyEffects} from '../../src/rendering/combat-vfx.js';
import {readableEffects} from '../../src/combat/combat-readability.js';
test('player explosion budget never discards hostile fields or damage labels',()=>{
 const hostile={groundBurst:true,color:'#c88'},label={text:'-1'},effects=[hostile,label,...Array.from({length:20},(_,id)=>({id,playerBlast:'fire'}))];
 const result=limitPlayerBlasts(effects);assert.equal(result.filter(f=>f.playerBlast).length,12);assert.ok(result.includes(hostile)&&result.includes(label));assert.equal(result.at(-1).id,19);assert.equal(effects.length,22);
});
test('synergy budget retains newest effects and unrelated warnings',()=>{
 const warning={hostileWarning:true},effects=[warning,...Array.from({length:50},(_,id)=>({id,synergyEffect:'spore'}))],result=limitSynergyEffects(effects);
 assert.equal(result.length,33);assert.ok(result.includes(warning));assert.equal(result.at(-1).id,49);
});
test('mobile density deduplicates player effects while retaining every hostile warning',()=>{
 const warning={hostileWarning:true},effects=[warning,...Array.from({length:40},()=>({x:100,y:100,playerBlast:'fire'}))];
 const result=readableEffects(effects,true);assert.equal(result.length,2);assert.ok(result.includes(warning));assert.equal(readableEffects(effects,false),effects);
});
