import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from './engine.js';
import {stepRun} from './simulation.js';
import {elementHitEffects,limitElementHits} from './element-hit-visuals.js';
function setup(element,{wall=false,lethal=false}={}){
 const s=newRun(42);s.attack=100;s.player.x=100;s.player.y=200;s.player[element]=1;
 const room=currentRoom(s);room.obstacles=wall?[{x:145,y:150,w:20,h:100}]:[];
 room.enemies=[{id:1,type:'chaser',x:210,y:200,hp:lethal?1:1000,max:1000,cd:3}];
 s.projectiles=[{x:120,y:200,vx:1000,vy:0,life:1,enemy:false,pierce:0,hit:[],element}];return s;
}
test('each elemental projectile emits a localized contact effect only on an actual hit',()=>{
 for(const element of ['fire','frost','poison','chain']){const s=setup(element),fx=stepRun(s,.12).effects.filter(f=>f.hitElement===element);
  assert.equal(fx.length,1);assert.ok(fx[0].x>165&&fx[0].x<210);assert.ok(fx[0].duration<=.4);assert.equal(fx[0].angle,0);
  assert.ok(currentRoom(s).enemies[0].hp<1000);
  const blocked=setup(element,{wall:true});assert.equal(stepRun(blocked,.12).effects.filter(f=>f.hitElement).length,0);assert.equal(currentRoom(blocked).enemies[0].hp,1000);
 }
});
test('lethal poison contact still splashes; ordinary arrows do not create elemental flashes',()=>{
 assert.equal(stepRun(setup('poison',{lethal:true}),.12).effects.filter(f=>f.hitElement==='poison').length,1);
 const s=setup('fire');s.player.fire=0;assert.equal(stepRun(s,.12).effects.filter(f=>f.hitElement).length,0);
});
test('piercing and frost-shard visuals respect actual elemental application',()=>{
 const p=Object.freeze({fire:3,frost:3,poison:3,chain:3}),point=Object.freeze({x:20,y:10}),origin=Object.freeze({x:0,y:10});
 assert.deepEqual(elementHitEffects(p,point,origin,false).map(f=>f.hitElement),['poison']);
 const shard=elementHitEffects({frost:3},point,origin,false,true);assert.equal(shard[0].hitElement,'frost');assert.equal(shard[0].small,true);
});
test('dense hit effects keep newest contacts without dropping damage text or other cues',()=>{
 const hits=Array.from({length:80},(_,i)=>Object.freeze({hitElement:'fire',id:i})),text=Object.freeze({text:'-1 ♥'}),cue=Object.freeze({slash:true});
 const source=Object.freeze([text,...hits,cue]),out=limitElementHits(source);
 assert.equal(out.filter(f=>f.hitElement).length,48);assert.equal(out[1].id,32);assert.equal(out[48].id,79);assert.equal(out[0],text);assert.equal(out.at(-1),cue);assert.equal(source.length,82);
});
