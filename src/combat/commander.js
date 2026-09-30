import {moveBody,safeSpawn,steering} from '../world/terrain.js';
import {emitShot} from './patterns.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const commanderPhase=e=>e.hp/e.max>.5?1:2;
export function challengeCommander(s){
 const r=s.floors[s.floor][s.room];
 if(s.campaign!=='expanded'||s.floor!==8||s.key||!r.commanderPending||r.enemies.length)return false;
 r.commanderPending=false;
 r.enemies=[{id:0,type:'boss',variant:'commander',x:480,y:175,hp:8500,max:8500,cd:1.5,tier:8,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18,commander:{phase:1,volleyClock:1.5,blinkClock:10,rainClock:9,snipeClock:5.5,strafeClock:3.5,strafeDirection:1,transition:0,blinkIndex:0}}];
 s.entryGrace=1;return true;
}
function fireSpread(e,a,bullets){
 const offsets=a.count===2?[-.15,.15]:[-.23,0,.23];
 for(const offset of offsets){emitShot(e,a.aim+offset,290,bullets);const b=bullets.at(-1);b.damage=9;b.source='악마 군단장 빙결 화살';b.frostArrow=true;}
}
function blinkDestination(e,p,r){
 const state=e.commander,candidates=[{x:175,y:150},{x:785,y:150},{x:175,y:390},{x:785,y:390},{x:480,y:120},{x:480,y:420}];
 for(let i=0;i<candidates.length;i++){
  const index=(state.blinkIndex+i)%candidates.length,point={...candidates[index]};safeSpawn(point,r.obstacles,32);
  if(Math.hypot(point.x-p.x,point.y-p.y)>=150&&Math.hypot(point.x-e.x,point.y-e.y)>=100){state.blinkIndex=(index+1)%candidates.length;return point;}
 }
 state.blinkClock=1;
}
export function resetCommanderAttack(e){
 if(e.variant!=='commander')return;
 const c=e.commander;delete c.volley;delete c.rain;delete c.blink;delete c.snipe;c.transition=0;c.volleyClock=Math.max(.8,c.volleyClock);c.blinkClock=Math.max(1,c.blinkClock);c.rainClock=Math.max(2,c.rainClock);c.snipeClock=Math.max(1,c.snipeClock??5.5);
}
export function updateCommander(e,p,r,dt,bullets,hurt){
 const c=e.commander;if(!c||e.hp<=0)return;
 c.snipeClock??=5.5;c.strafeClock??=3.5;c.strafeDirection??=1;
 c.blinkFlash=Math.max(0,(c.blinkFlash||0)-dt);
 const phase=commanderPhase(e);
 if(phase>c.phase){c.phase=phase;c.transition=1.1;c.volleyClock=1.6;c.blinkClock=Math.max(1.8,c.blinkClock);c.rainClock=Math.max(2.5,c.rainClock);c.snipeClock=Math.max(2,c.snipeClock);delete c.volley;delete c.rain;delete c.blink;delete c.snipe;for(const b of bullets)if(b.enemy)b.life=0;return;}
 if(c.transition>0){c.transition=Math.max(0,c.transition-dt);return;}
 c.rainClock=Math.max(0,c.rainClock-dt);c.blinkClock=Math.max(0,c.blinkClock-dt);c.volleyClock=Math.max(0,c.volleyClock-dt);c.snipeClock=Math.max(0,c.snipeClock-dt);
 if(c.rain){
  c.rain.time=Math.max(0,c.rain.time-dt);
  if(!c.rain.time){
   if(Math.hypot(p.x-c.rain.x,p.y-c.rain.y)<c.rain.radius)hurt(18,'악마 군단장 화살비');
   c.rainFlash={x:c.rain.x,y:c.rain.y,time:.4,radius:c.rain.radius};delete c.rain;c.volleyClock=Math.max(c.volleyClock,.75);c.blinkClock=Math.max(c.blinkClock,.8);
  }
  return;
 }
 if(c.rainFlash){c.rainFlash.time=Math.max(0,c.rainFlash.time-dt);if(!c.rainFlash.time)delete c.rainFlash;}
 if(c.blink){c.blink.time=Math.max(0,c.blink.time-dt);if(!c.blink.time){e.x=c.blink.x;e.y=c.blink.y;c.blinkFlash=.35;c.blinkClock=10;delete c.blink;}return;}
 if(c.snipe){c.snipe.time=Math.max(0,c.snipe.time-dt);if(!c.snipe.time){emitShot(e,c.snipe.aim,440,bullets);const b=bullets.at(-1);b.damage=11;b.source='악마 군단장 저격 화살';b.frostArrow=true;delete c.snipe;c.volleyClock=Math.max(c.volleyClock,.55);}return;}
 if(!c.rainClock){c.rain={x:clamp(p.x,145,815),y:clamp(p.y,125,415),radius:120,time:1.05};c.rainClock=20;delete c.volley;return;}
 if(c.volley){
  const a=c.volley;a.time=Math.max(0,a.time-dt);
  if(!a.time){fireSpread(e,a,bullets);a.fired++;if(a.fired===2){delete c.volley;c.volleyClock=Math.max(c.volleyClock,1.35);}else a.time=.27;}
  return;
 }
 if(!c.blinkClock){const point=blinkDestination(e,p,r);if(point){c.blink={...point,time:.4};c.volleyClock=Math.max(c.volleyClock,.5);}return;}
 if(!c.snipeClock){c.snipe={aim:Math.atan2(p.y-e.y,p.x-e.x),time:.72};c.snipeClock=phase===2?6:7.2;return;}
 const distance=Math.hypot(p.x-e.x,p.y-e.y),angle=steering(e,p,r.obstacles,32);
 c.strafeClock-=dt;if(c.strafeClock<=0){c.strafeDirection*=-1;c.strafeClock=phase===2?2.5:3.5;}
 const radial=distance<190?-1:distance>330?1:0,side=c.strafeDirection;
 const dx=Math.cos(angle)*radial+Math.sin(angle)*side*.9,dy=Math.sin(angle)*radial-Math.cos(angle)*side*.9;
 const speed=(phase===2?64:56)*dt*(e.slow>0?e.slowFactor??1:1);
 moveBody(e,dx*speed,dy*speed,r.obstacles,32);
 if(e.x<75||e.x>885||e.y<95||e.y>445)c.strafeDirection*=-1;
 e.x=clamp(e.x,55,905);e.y=clamp(e.y,75,465);
 if(!c.volleyClock)c.volley={aim:Math.atan2(p.y-e.y,p.x-e.x),count:phase===1?2:3,time:.55,fired:0};
}
