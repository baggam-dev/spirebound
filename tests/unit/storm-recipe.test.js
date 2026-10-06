import test from 'node:test';
import assert from 'node:assert/strict';
import {turnStormArrow} from '../../src/combat/weapon-projectiles.js';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

const foe=(id,x,y)=>({id,type:'chaser',x,y,hp:500,max:500,cd:9,frozen:5,balanceVersion:1});

test('storm arrow turns once toward a visible forward enemy, never through cover or backward',()=>{
 const arrow={vx:420,vy:0,hit:[1],pierce:0},weapon={split:1,pierce:1};
 const enemies=[foe(1,180,200),foe(2,260,250),foe(3,120,200)];
 assert.equal(turnStormArrow(arrow,weapon,{x:180,y:200},enemies,()=>false),true);
 assert.ok(arrow.vy>0);
 assert.equal(turnStormArrow(arrow,weapon,{x:180,y:200},enemies,()=>true),false);
 assert.equal(turnStormArrow({...arrow,hit:[1,2]},weapon,{x:180,y:200},enemies,()=>false),false);
 assert.equal(turnStormArrow({...arrow,vy:0,vx:420},weapon,{x:180,y:200},[enemies[2]],()=>false),false);
 assert.equal(turnStormArrow({...arrow,vy:0,vx:420},weapon,{x:180,y:200},[{...enemies[1],phase:'air'}],()=>false),false);
});

test('new run storm volley changes route and survives a save; older run keeps straight path',()=>{
 const setup=version=>{
  const s=newRun(99);s.generationVersion=version;s.tutorialComplete=true;s.attack=999;
  Object.assign(s.player,{x:120,y:200,split:1,pierce:1,damage:17});
  const room=currentRoom(s);room.obstacles=[];room.enemies=[foe(1,180,200),foe(2,260,250)];
  s.projectiles=[{x:120,y:200,vx:420,vy:0,enemy:false,elemental:true,damageScale:1,life:3,pierce:1,hit:[]}];
  return s;
 };
 const fresh=setup(30),legacy=setup(28);
 for(let i=0;i<8;i++){stepRun(fresh,1/60);stepRun(legacy,1/60);}
 assert.ok(fresh.projectiles[0].vy>0);
 assert.equal(legacy.projectiles[0].vy,0);
 const resumed=parseSave(encodeSave(fresh));
 for(let i=0;i<30;i++){stepRun(fresh,1/60);stepRun(resumed,1/60);}
 assert.deepEqual(resumed,JSON.parse(JSON.stringify(fresh)));
 assert.ok(currentRoom(fresh).enemies[1].hp<500);
 assert.equal(currentRoom(legacy).enemies[1].hp,500);
});
