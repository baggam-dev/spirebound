import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,advanceClock} from '../../src/game/engine.js';
import {chooseMain} from '../../src/progression/skill-tree.js';
import {levelChoices,hitEnemy,tickEffects} from '../../src/progression/progression.js';
import {chooseEvolution} from '../../src/progression/evolutions.js';
import {chooseUtility,castUtility} from '../../src/combat/utility.js';
import {emitWeaponVolley,weaponSnapshot} from '../../src/combat/weapon-projectiles.js';
import {attackInterval} from '../../src/progression/relics.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

test('precision main guarantees an early direct synergy and only primary arrows advance a saved mark',()=>{
 const s=newRun(144);s.pendingLevels=1;assert.equal(chooseMain(s,'precision'),true);assert.equal(s.player.mainSkill,'precision');
 s.player.level=2;s.pendingLevels=1;s.levelQueue=[2];const offers=levelChoices(s,()=>.99);assert.ok(offers.some(k=>['weakpoint','finisher'].includes(k.id)));
 const p=s.player,e={id:1,type:'chaser',x:100,y:100,hp:500,max:500};const hits=[];
 for(let i=0;i<3;i++){const before=e.hp;hitEnemy(p,e,[e],[],1,true,null,p,{primary:true});hits.push(before-e.hp);}
 assert.ok(hits[2]>hits[0]*1.4);assert.equal(e.precisionHits,0);
 hitEnemy(p,e,[e],[],1,true,null,p,{primary:false});assert.equal(e.precisionHits,0);
 hitEnemy(p,e,[e],[],1,true,null,p,{primary:true});assert.equal(e.precisionHits,1);tickEffects(e,4);assert.equal(e.precisionHits,0);
 currentRoom(s).enemies=[e];assert.equal(parseSave(encodeSave(s)).floors[0][0].enemies[0].precisionHits,0);
 const volley=[];emitWeaponVolley(volley,{...p,split:2,repeat:1,focusTime:5},p,e);assert.equal(volley.filter(b=>b.primary).length,1);assert.equal(volley.filter(b=>b.focused).length,4);
 const turret=[];emitWeaponVolley(turret,weaponSnapshot(p),p,e,1,true);assert.ok(turret.every(b=>!b.primary&&!b.focused));
});

test('precision level-three branches differ and focus only boosts direct player arrows',()=>{
 const s=newRun(2),p=s.player;p.mainSkill='precision';p.precision=3;
 assert.equal(chooseEvolution(p,'precision','sniper'),true);
 const e={id:1,type:'chaser',x:100,y:100,hp:1000,max:1000};const first=e.hp;hitEnemy(p,e,[e],[],1,true,null,p,{primary:true});const hit1=first-e.hp;const second=e.hp;hitEnemy(p,e,[e],[],1,true,null,p,{primary:true});assert.ok(second-e.hp>hit1*1.4);
 const normal=attackInterval(p);assert.equal(chooseUtility(s,'focus'),false);p.level=4;assert.equal(chooseUtility(s,'focus'),true);assert.equal(castUtility(s),'focus');assert.ok(attackInterval(p)<normal);
 const target={id:2,type:'chaser',x:120,y:100,hp:500,max:500};let before=target.hp;hitEnemy(p,target,[target],[],1,true,null,p,{primary:true,focused:false});const unbuffed=before-target.hp;before=target.hp;target.precisionHits=0;hitEnemy(p,target,[target],[],1,true,null,p,{primary:true,focused:true});assert.ok(before-target.hp>unbuffed*1.19);
 const restored=parseSave(encodeSave(s));assert.equal(restored.player.utility,'focus');assert.equal(restored.player.focusTime,5);advanceClock(restored,5,false);assert.equal(restored.player.focusTime,0);
});

test('first aid is floor bounded and guardian intercepts one live hit without changing enemy movement',()=>{
 const heal=newRun(3);heal.player.level=4;heal.player.hp=3;assert.equal(chooseUtility(heal,'firstAid'),true);assert.equal(castUtility(heal),'firstAid');assert.equal(heal.player.hp,4);assert.equal(castUtility(heal),false);advanceClock(heal,20,false);assert.equal(castUtility(heal),false);assert.deepEqual(parseSave(encodeSave(heal)).utilityHealedFloors,[0]);
 const s=newRun(4);s.player.level=4;assert.equal(chooseUtility(s,'guardian'),true);assert.equal(castUtility(s),'guardian');const r=currentRoom(s);r.enemies=[];s.entryGrace=0;s.projectiles=[{x:s.player.x-30,y:s.player.y,vx:600,vy:0,life:1,enemy:true,damage:20,hit:[]}];const hp=s.player.hp;stepRun(s,.1);assert.equal(s.player.hp,hp);assert.equal(s.guardianCharges,0);assert.equal(s.projectiles.length,0);
});
