import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceRollTrail,drawRollTrail,resetRollTrail} from '../../src/rendering/roll-trail.js';
const context=()=>({globalAlpha:1,save(){},restore(){},beginPath(){},rect(){},clip(){}});
test('roll ghosts use bounded snapshots of actual positions rather than extrapolated movement',()=>{
 const run={player:{x:100,y:200},roll:{x:1,y:0,kind:null,elapsed:.01,duration:.28}},room={};
 for(let i=0;i<8;i++){run.player.x=100+i*4;run.roll.elapsed+=.04;advanceRollTrail(run,room,.04);}
 const before=JSON.stringify(run),poses=[];drawRollTrail(context(),run,(_,p)=>poses.push(p.player.x));
 assert.ok(poses.length>0&&poses.length<=3);assert.ok(poses.every(x=>x>=100&&x<=128&&(x-100)%4===0));
 assert.equal(JSON.stringify(run),before);
 delete run.roll;advanceRollTrail(run,room,.1);advanceRollTrail(run,room,.1);
 assert.equal(drawRollTrail(context(),run,()=>assert.fail('expired')),false);
});
test('reduced effects, room changes and reset prevent stale roll silhouettes',()=>{
 const run={player:{x:100,y:200},roll:{x:1,y:0,elapsed:.1,duration:.28}},room={};advanceRollTrail(run,room,.04);run.player.x=110;advanceRollTrail(run,room,.04);
 assert.equal(drawRollTrail(context(),run,()=>assert.fail('reduced'),{reduced:true}),false);
 delete run.roll;advanceRollTrail(run,{},.04);assert.equal(drawRollTrail(context(),run,()=>assert.fail('room')),false);
 resetRollTrail(run);assert.equal(drawRollTrail(context(),run,()=>assert.fail('reset')),false);
});
