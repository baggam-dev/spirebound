import {seededRandom} from '../game/random.js';
import {applyRoomShape} from './room-shapes.js';
// One active layout rule for both new and loaded expeditions.
export function refreshRoomLayout(run){
 if(run.roomLayoutVersion===1)return;
 for(const [floor,rooms] of run.floors.entries()){
  // The final demon arena has no ascending stairs and retains its dedicated coordinates.
  if(floor===9)continue;
  const random=seededRandom(((run.seed||1)^Math.imul(floor+1,0x9e3779b9))>>>0);
  const turns=Math.floor(random()*4),mirror=random()<.5;
  for(const room of rooms){
   let x=mirror?-room.x:room.x,y=room.y;
   for(let i=0;i<turns;i++)[x,y]=[-y,x];
   room.x=x;room.y=y;
   if(room.shape==='compact'&&!room.gate&&!room.tutorial&&room.type!=='boss'){
    room.obstacles=(room.obstacles||[]).filter(o=>o.type!=='wall');
    applyRoomShape(room,3);
   }
  }
 }
 run.roomLayoutVersion=1;
}
