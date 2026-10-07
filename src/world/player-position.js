import {blocked,safeSpawn} from './terrain.js';
// Repair existing invalid positions without changing room, progress, or combat state.
export function recoverPlayerPosition(player,obstacles){
 if(!blocked(player.x,player.y,14,obstacles))return false;
 const before={x:player.x,y:player.y};player.x=Math.max(31,Math.min(929,player.x));player.y=Math.max(49,Math.min(491,player.y));
 if(blocked(player.x,player.y,14,obstacles))safeSpawn(player,obstacles,14);
 return player.x!==before.x||player.y!==before.y;
}
