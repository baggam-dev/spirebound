import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceHeroLanding,heroLandingFrame,resetHeroLanding} from '../../src/rendering/hero-landing.js';
const setup=(kind=null)=>({status:'playing',player:{x:100,y:200,hp:5},roll:{kind,x:1,y:0,elapsed:.05,duration:.28}});
const finish=(run,room)=>{const q=run.roll;advanceHeroLanding(run,room,q,.016);delete run.roll;advanceHeroLanding(run,room,q,.016);};
test('observed roll end recovers at actual position with a bounded presentation lifetime and no saved writes',()=>{
 const run=setup(),room={};finish(run,room);const before=JSON.stringify(run);
 assert.equal(heroLandingFrame(run,room),0);advanceHeroLanding(run,room,null,.09);assert.equal(heroLandingFrame(run,room),3);
 assert.equal(heroLandingFrame(run,room,{reduced:true}),3);advanceHeroLanding(run,room,null,.1);assert.equal(heroLandingFrame(run,room),null);
 assert.equal(JSON.stringify(run),before);
});
test('new actions, damage, repositioning and cast rendering cancel recovery without replay',()=>{
 for(const options of [{moving:true},{shot:true},{hit:true},{casting:true}]){
  const run=setup(),room={};finish(run,room);advanceHeroLanding(run,room,null,.01,options);assert.equal(heroLandingFrame(run,room),null);
  advanceHeroLanding(run,room,null,.01);assert.equal(heroLandingFrame(run,room),null);
 }
 const run=setup(),room={};finish(run,room);assert.equal(heroLandingFrame(run,room,{blocked:true}),null);
 assert.equal(heroLandingFrame(run,room),null);
 run.roll=setup().roll;finish(run,room);run.player.x+=1;assert.equal(heroLandingFrame(run,room),null);
});
test('load first observation, room changes, reset, slash and dead players never replay landing',()=>{
 const room={},run=setup(),q=run.roll;delete run.roll;advanceHeroLanding(run,room,q,.016);assert.equal(heroLandingFrame(run,room),null);
 run.roll=setup().roll;finish(run,room);advanceHeroLanding(run,{},null,.016);assert.equal(heroLandingFrame(run,room),null);
 run.roll=setup().roll;finish(run,room);resetHeroLanding(run);assert.equal(heroLandingFrame(run,room),null);
 const slash=setup('slash');finish(slash,room);assert.equal(heroLandingFrame(slash,room),null);
 run.roll=setup().roll;finish(run,room);run.player.hp=0;assert.equal(heroLandingFrame(run,room),null);
});
