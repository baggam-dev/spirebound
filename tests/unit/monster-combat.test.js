// Prepared with the implementation; do not execute before an explicit deploy request.
import test from 'node:test';
import assert from 'node:assert/strict';
import {clearEnemyShot,seekEnemyShot,enemyShotLane} from '../../src/combat/enemy-sightline.js';
import {meleeProfiles,updateEnemyMelee,meleeIntersects,weaponContactReplaced} from '../../src/combat/enemy-melee.js';
import {monsterStatus} from '../../src/rendering/monster-status-effects.js';
import {blocked,navigationRoute} from '../../src/world/terrain.js';
import {newRun} from '../../src/game/engine.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
test('a mobile shooter routes around cover to a clear shot without crossing it',()=>{
 const e={id:0,x:180,y:260},p={x:500,y:260},obstacles=[{x:260,y:170,w:80,h:180,type:'bookshelf'}];
 assert.equal(clearEnemyShot(e,p,obstacles),false);let ready=false;
 for(let i=0;i<1200&&!ready;i++){ready=seekEnemyShot(e,p,obstacles,1/60,{speed:90});assert.equal(blocked(e.x,e.y,18,obstacles),false);}
 assert.equal(ready,true);assert.equal(clearEnemyShot(e,p,obstacles),true);
});
test('enclosed shooters report no route and never accept a blocked shot',()=>{
 const e={x:200,y:200},p={x:500,y:200},walls=[{x:140,y:120,w:140,h:20},{x:140,y:260,w:140,h:20},{x:120,y:120,w:20,h:160},{x:280,y:120,w:20,h:160}];
 assert.equal(navigationRoute(e,p,walls).distance,Infinity);for(let i=0;i<20;i++)assert.equal(seekEnemyShot(e,p,walls,.1),false);assert.deepEqual(e,{x:200,y:200});
});
test('fixed aim checks the committed lane rather than following a dodging player',()=>{
 const e={x:200,y:200},p={x:260,y:160},wall=[{x:230,y:190,w:5,h:20}];
 assert.equal(enemyShotLane(e,0,p,wall),false);assert.equal(clearEnemyShot(e,p,wall),true);
});
test('all new melee profiles telegraph, hit once and keep a recovery window',()=>{
 for(const [type,profile] of Object.entries(meleeProfiles)){
  const e={type,x:200,y:200},p={x:240,y:200};assert.deepEqual(updateEnemyMelee(e,p,[],.01),{handled:true,damage:0});assert.equal(e.meleeAttack.stage,'windup');
  assert.equal(updateEnemyMelee(e,p,[],profile.warning).damage,profile.damage);assert.equal(e.meleeAttack.stage,'strike');
  assert.equal(updateEnemyMelee(e,p,[],.12).damage,0);assert.equal(e.meleeAttack.stage,'recover');
  assert.equal(updateEnemyMelee(e,p,[],profile.recover).damage,0);assert.equal(e.meleeAttack,undefined);
  assert.equal(updateEnemyMelee(e,p,[],.01).damage,0);assert.equal(e.meleeAttack,undefined);assert.equal(weaponContactReplaced(e),true);
 }
});
test('melee windup keeps its direction and rechecks walls and current player position',()=>{
 for(const kind of ['behind','away','wall']){
  const e={type:'charger',x:200,y:200},p={x:240,y:200};updateEnemyMelee(e,p,[],.01);const aim=e.meleeAttack.aim;
  if(kind==='behind')p.x=160;if(kind==='away')p.x=300;const obstacles=kind==='wall'?[{x:220,y:185,w:5,h:30}]:[];
  assert.equal(updateEnemyMelee(e,p,obstacles,.2).damage,0);assert.equal(e.meleeAttack.aim,aim);
 }
 assert.equal(meleeIntersects({x:0,y:0},{x:72,y:0},0,58,Math.PI/3),true);
 assert.equal(meleeIntersects({x:0,y:0},{x:72.01,y:0},0,58,Math.PI/3),false);
});
test('committed jumps and charge windups do not also start a close-range swing',()=>{
 for(const e of [{type:'brute',phase:'air'},{type:'charger',chargeAngle:0},{type:'demonCaptain',attackPhase:'warning'}]){
  Object.assign(e,{x:200,y:200});assert.equal(updateEnemyMelee(e,{x:220,y:200},[],.01).handled,false);assert.equal(e.meleeAttack,undefined);
 }
});
test('mid-windup save resumes exactly once and invalid new combat fields are rejected',()=>{
 const s=newRun(871),e={id:0,type:'charger',x:200,y:200,hp:100,max:100,cd:2};s.floors[0][0].enemies=[e];updateEnemyMelee(e,{x:240,y:200},[],.01);updateEnemyMelee(e,{x:240,y:200},[],.1);
 const loaded=parseSave(encodeSave(s)),n=loaded.floors[0][0].enemies[0];assert.equal(n.meleeAttack.aim,0);assert.equal(n.meleeAttack.time,e.meleeAttack.time);
 assert.equal(updateEnemyMelee(n,{x:240,y:200},[],.1).damage,9);assert.equal(updateEnemyMelee(n,{x:240,y:200},[],.01).damage,0);
 e.meleeAttack.aim=Infinity;assert.throws(()=>parseSave(encodeSave(s)));
});
test('status priority follows real guardian identity without changing actors or room',()=>{
 const e={id:2,elite:'guardian',trialChampion:true},r={returnSeal:'guardian',returnSealReleased:false,returnGuardianId:2},before=JSON.stringify({e,r});
 assert.equal(monsterStatus(e,r),'key');assert.equal(JSON.stringify({e,r}),before);assert.equal(monsterStatus(e,{...r,returnSealReleased:true}),'trial');
 assert.equal(monsterStatus({...e,id:3},r),'trial');assert.equal(monsterStatus({id:4,gateTitle:'칼드'},r),'guardian');assert.equal(monsterStatus({id:5,elite:'volley'},r),'elite');
});
