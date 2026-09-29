import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from '../../src/game/engine.js';
import {hitEnemy} from '../../src/progression/progression.js';
import {castBlink} from '../../src/combat/abilities.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
test('opening enemies take exactly three unmodified arrows and survive saving',()=>{
 const s=parseSave(encodeSave(newRun(17)));for(const e of s.floors[0][1].enemies){hitEnemy(s.player,e,[e]);hitEnemy(s.player,e,[e]);assert.equal(e.hp,17);hitEnemy(s.player,e,[e]);assert.equal(e.hp,0);}
});
test('first fire arrow kills a healthy floor-one basic enemy including splash',()=>{
 const s=newRun(17),e={type:'chaser',hp:40,max:40,x:600,y:300},near={...e,x:610};hitEnemy({...s.player,fire:1},e,[e,near]);assert.ok(e.hp<=0);assert.ok(Math.abs(near.hp-16.78)<1e-9);
});
test('blocked blink preserves cooldown and immunity; open direction still works',()=>{
 const s=newRun(17);s.player.x=480;s.player.y=300;s.floors[0][0].obstacles=[{x:494,y:250,w:30,h:100,type:'wall'}];assert.equal(castBlink(s,{x:1,y:0}),false);assert.equal(s.dodge,0);assert.equal(s.invulnerable,0);assert.equal(s.player.x,480);assert.equal(castBlink(s,{x:-1,y:0}),true);assert.ok(s.player.x<480);assert.equal(s.dodge,10);
});
