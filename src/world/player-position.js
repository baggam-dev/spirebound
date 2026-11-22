import {blocked,safeSpawn} from './terrain.js';
import {roomGeometry} from './room-geometry.js';
// Repair existing invalid positions without changing room, progress, or combat state.
export function recoverPlayerPosition(player,obstacles,room=null){
 const {recovery,footprint}=roomGeometry(room);
 if(!blocked(player.x,player.y,14,obstacles)&&(!footprint||player.x>=recovery.minX&&player.x<=recovery.maxX&&player.y>=recovery.minY&&player.y<=recovery.maxY))return false;
 const before={x:player.x,y:player.y};player.x=Math.max(recovery.minX,Math.min(recovery.maxX,player.x));player.y=Math.max(recovery.minY,Math.min(recovery.maxY,player.y));
 if(blocked(player.x,player.y,14,obstacles))safeSpawn(player,obstacles,14);
 return player.x!==before.x||player.y!==before.y;
}
