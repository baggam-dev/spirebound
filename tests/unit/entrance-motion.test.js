import test from 'node:test';
import assert from 'node:assert/strict';
import {entranceMotion,ENTRANCE_CUES,ENTRANCE_DURATION} from '../../src/ui/entrance-state.js';
test('entrance uses dedicated walking and decision keys with constant actor scale inside each cut',()=>{
 const walking=new Set();for(let t=.01;t<.96;t+=.06){const p=entranceMotion(t);walking.add(p.frame);assert.equal(p.height,260);assert.equal(p.sheet,'walk');}
 assert.equal(walking.size,8);assert.equal(entranceMotion(2).frame,1);assert.equal(entranceMotion(2.4).frame,2);
 assert.equal(entranceMotion(3.1).sheet,'actions');assert.equal(entranceMotion(3.1).frame,3);assert.equal(entranceMotion(3.1).height,360);
 const front=new Set();for(let t=3.21;t<3.94;t+=.07){const p=entranceMotion(t);front.add(p.frame);assert.equal(p.sheet,'front');assert.equal(p.height,300);}assert.deepEqual([...front].sort(),[0,1,2,3]);
 assert.equal(entranceMotion(5).phase,3);assert.equal(entranceMotion(5).visible,false);assert.equal(entranceMotion(7).visible,false);
});
test('door closure, reduced representatives and audio cues follow the independent entrance clock',()=>{
 assert.equal(entranceMotion(5.08).door,0);assert.equal(entranceMotion(6.4).door,1);assert.equal(entranceMotion(5.7,true).door,0);assert.equal(entranceMotion(6.4,true).door,1);
 assert.equal(entranceMotion(.6,true).frame,0);assert.equal(entranceMotion(2,true).frame,2);assert.equal(entranceMotion(3.7,true).frame,0);
 assert.ok(ENTRANCE_CUES.every(([t],i)=>t>0&&t<ENTRANCE_DURATION&&(i===0||t>ENTRANCE_CUES[i-1][0])));
 assert.equal(entranceMotion(Infinity).phase,0);assert.equal(entranceMotion(-1).phase,0);
});
