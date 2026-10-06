import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {limitArrowImpacts} from '../../src/rendering/arrow-impact-visuals.js';

function hit({element=null,wall=false,lethal=false}={}){
 const run=newRun(42),room=currentRoom(run);
 run.attack=100;run.player.x=100;run.player.y=200;
 if(element)run.player[element]=1;
 room.obstacles=wall?[{x:145,y:150,w:20,h:100}]:[];
 room.enemies=[{id:1,type:'chaser',x:210,y:200,hp:lethal?1:1000,max:1000,cd:3}];
 run.projectiles=[{x:120,y:200,vx:1000,vy:0,life:1,enemy:false,pierce:0,hit:[],element}];
 return stepRun(run,.12).effects;
}

test('plain and precision arrows mark actual contact, even on a lethal hit',()=>{
 for(const element of [null,'precision']){
  const effect=hit({element,lethal:true}).filter(f=>f.arrowImpact);
  assert.equal(effect.length,1);assert.ok(effect[0].x>165&&effect[0].x<210);
  assert.equal(effect[0].precision,element==='precision');assert.equal(effect[0].angle,0);
  assert.equal(hit({element,wall:true}).filter(f=>f.arrowImpact).length,0);
 }
});

test('elemental contacts keep their own visuals without a duplicate plain spark',()=>{
 for(const element of ['fire','frost','poison','chain']){
  const effects=hit({element});assert.equal(effects.filter(f=>f.arrowImpact).length,0);
  assert.equal(effects.filter(f=>f.hitElement===element).length,1);
 }
});

test('dense contact effects keep newest sparks and unrelated cues',()=>{
 const impacts=Array.from({length:36},(_,id)=>({arrowImpact:true,id}));
 const text={text:'-1 ♥'},output=limitArrowImpacts([text,...impacts]);
 assert.equal(output.length,25);assert.equal(output[0],text);assert.equal(output[1].id,12);assert.equal(output.at(-1).id,35);
});
