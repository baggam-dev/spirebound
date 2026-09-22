import test from 'node:test';
import assert from 'node:assert/strict';
import {updatePattern} from './patterns.js';
function volley(tier,enraged=false,escapeDepth=0){
 const e={type:'scatter',tier,escapeDepth,x:200,y:200,hp:100,cd:0},p={x:480,y:270},bullets=[];
 updatePattern(e,p,[],.01,bullets,enraged);assert.equal(e.attackPhase,'warning');
 updatePattern(e,p,[],.71,bullets,enraged);const first=bullets.length;assert.ok(first>0);assert.equal(e.attackPhase,'firing');
 updatePattern(e,p,[],.39,bullets,enraged);assert.equal(bullets.length,first);
 updatePattern(e,p,[],.02,bullets,enraged);assert.equal(e.attackPhase,'recover');return {first,total:bullets.length,recovery:e.attackTime};
}
test('ascent floors 1 and 2 fire one fan without shortening their attack cadence',()=>{
 for(const tier of [0,1]){const r=volley(tier);assert.equal(r.total,r.first);assert.ok(Math.abs(r.recovery-2.8*.85*(1-tier*.065))<1e-10);}
});
test('higher ascent floors and returning scatter enemies retain both rows',()=>{
 for(const tier of [2,3,4,5]){const r=volley(tier);assert.equal(r.total,r.first*2);}
 for(const [enraged,depth] of [[true,0],[false,8],[true,8]]){const r=volley(0,enraged,depth);assert.equal(r.total,r.first*2);}
});
