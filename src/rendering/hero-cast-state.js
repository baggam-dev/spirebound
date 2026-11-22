// Presentation history only; no saved fields or combat clocks are written.
export const heroCastIds=Object.freeze(['focus','firstAid','guardian','frostWave','thunderSigil','galeVeil']);
const duration=.38;
let casts=new WeakMap();
const roomOf=s=>s?.floors?.[s.floor]?.[s.room];
const interrupted=s=>!s?.player||s.status!=='playing'||s.player.hp<=0||s.player.actionStun>0||!!s.roll;
export function clearHeroCast(player){if(player)casts.delete(player);else casts=new WeakMap();}
// The caller supplies only the id returned by a successful castUtility.
export function beginHeroCast(s,id){
 if(!heroCastIds.includes(id)||interrupted(s)||!Number.isFinite(s.elapsed))return false;
 casts.set(s.player,{id,start:s.elapsed,room:roomOf(s),floor:s.floor,index:s.room});return true;
}
export function tickHeroCast(s){
 const v=casts.get(s?.player);if(!v)return;
 if(interrupted(s)||roomOf(s)!==v.room||s.floor!==v.floor||s.room!==v.index||s.elapsed<v.start||s.elapsed-v.start>=duration)clearHeroCast(s.player);
}
export function heroCastPose(player,time,{reduced=false}={}){
 const v=casts.get(player);if(!v||player.hp<=0||player.actionStun>0)return null;
 const age=time-v.start,limit=reduced ? .24 : duration;
 if(age<0||age>=limit)return null;
 const frame=reduced?(age<.15?1:3):age<.045?0:age<.17?1:age<.27?2:3;
 return {id:v.id,row:heroCastIds.indexOf(v.id),frame};
}
