import test from 'node:test';
import assert from 'node:assert/strict';
import {demonSweepIntersects,demonSweepSector} from '../../src/combat/demon-sweep.js';
import {demonCorePose} from '../../src/combat/demon-core-motion.js';
test('both core arms intersect player circles at front and angular edges, never behind',()=>{
 for(const kind of ['coreSweepLeft','coreSweepRight']){
  const a={kind,x:480,y:140},s=demonSweepSector(a),point=(r,angle)=>({x:s.x+Math.cos(angle)*r,y:s.y+Math.sin(angle)*r});
  assert.equal(demonSweepIntersects(a,point(94,Math.PI/2)),true);
  assert.equal(demonSweepIntersects(a,point(94.01,Math.PI/2)),false);
  assert.equal(demonSweepIntersects(a,point(40,-Math.PI/2)),false);
  const edge=s.halfAngle+Math.asin(14/60);
  for(const side of [-1,1]){assert.equal(demonSweepIntersects(a,point(60,s.aim+side*(edge-.001))),true);assert.equal(demonSweepIntersects(a,point(60,s.aim+side*(edge+.001))),false);}
 }
});
test('saved combat flashes determine strike and recovery without inferring canceled attacks',()=>{
 const input={coreFlash:{kind:'eyeRay',x:480,y:140,tx:480,ty:350,aim:1,time:.45}},snapshot=JSON.stringify(input);
 assert.equal(demonCorePose(input).stage,2);assert.equal(demonCorePose(JSON.parse(snapshot)).stage,2);assert.equal(JSON.stringify(input),snapshot);
 assert.equal(demonCorePose({coreFlash:{...input.coreFlash,time:.2}}).stage,3);
 assert.equal(demonCorePose({}).stage,0);assert.equal(demonCorePose({...input,staticPose:true}).stage,0);
});
