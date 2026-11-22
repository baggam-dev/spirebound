import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {newRun,enrage,neighbor,currentRoom} from '../../src/game/engine.js';
import {enterRoom,stepRun,enemyRadius,enemyAirborne} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {roomGeometry,roomDoorArrival,roomDoorCenter} from '../../src/world/room-geometry.js';
import {blocked} from '../../src/world/terrain.js';
const out=process.argv[2];await mkdir(out,{recursive:true});const results=[];let active,profiles=0;
try{
 for(const campaign of ['classic','expanded'])for(let seed=1;seed<=24;seed++){
  active={campaign,seed};const s=newRun(seed,{campaign}),before=s.randomState,loaded=parseSave(encodeSave(s)),list=[];
  assert.equal(loaded.randomState,before);
  for(const [floor,rooms] of loaded.floors.entries())for(const [index,r] of rooms.entries())if(r.footprint){
   profiles++;list.push({floor,index,profile:r.footprint});assert.ok(r.obstacles.length<=30);
   loaded.floor=floor;loaded.room=index;
   for(let d=0;d<4;d++)if(neighbor(loaded,d)>=0){const p=roomDoorArrival(r,d);assert.equal(blocked(p.x,p.y,24,r.obstacles),false,`door ${floor}/${index}/${d}`);}
  }
  // Exercise a real step across a generated doorway, not just coordinate helpers.
  for(const q of list){const run=parseSave(encodeSave(s));run.floor=q.floor;run.room=q.index;run.tutorialComplete=true;const r=currentRoom(run),d=[0,1,2,3].find(d=>{const n=neighbor(run,d);return n>=0&&run.floors[q.floor][n].type==='normal';});if(d===undefined)continue;
   const next=neighbor(run,d);r.enemies=[];run.floors[q.floor][next].enemies=[];enterRoom(run);const b=roomGeometry(r).recovery,n=roomDoorCenter(r,d);Object.assign(run.player,{x:d===1?b.maxX:d===3?b.minX:n,y:d===0?b.minY:d===2?b.maxY:n});
   const result=stepRun(run,.1,{x:d===1?1:d===3?-1:0,y:d===0?-1:d===2?1:0});assert.ok(result.events.includes('room'),'door step');assert.equal(run.room,next);assert.equal(blocked(run.player.x,run.player.y,14,currentRoom(run).obstacles),false);break;
  }
  const returning=parseSave(encodeSave(s));enrage(returning);parseSave(encodeSave(returning));
  for(const q of list){returning.floor=q.floor;returning.room=q.index;const r=currentRoom(returning),d=[0,1,2,3].find(d=>neighbor(returning,d)>=0);Object.assign(returning.player,roomDoorArrival(r,d));enterRoom(returning);returning.attack=999;returning.invulnerable=999;
   for(let i=0;i<20;i++)stepRun(returning,.05);
   const f=roomGeometry(r).footprint;
   for(const e of r.enemies)if(e.hp>0&&!enemyAirborne(e)){const n=enemyRadius(e);assert.ok(e.x>=f.x+n-.1&&e.x<=f.x+f.width-n+.1&&e.y>=f.y+n-.1&&e.y<=f.y+f.height-n+.1,`return actor ${q.floor}/${q.index}/${e.type}`);}
   parseSave(encodeSave(returning));
  }
  results.push({...active,profiles:list.length});
 }
 assert.ok(profiles>0);await writeFile(out+'/result.json',JSON.stringify({runs:results.length,profiles,results},null,2));console.log(JSON.stringify({runs:results.length,profiles}));
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({active,error:String(error),results},null,2));throw error;}
