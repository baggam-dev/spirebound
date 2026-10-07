import {blocked,segmentBlocked,safeSpawn} from '../world/terrain.js';
import {runRandom} from '../game/random.js';
import {allocateEnemyId} from './poison.js';

export const demonSpecialNames={flame:'헬 플레임',ice:'서브제로 메테오',zeus:'제우스'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function tryDemonBolt(r,x,y,p,routeOpen){
 const bolt={x:Math.max(110,Math.min(814,Math.round(x-13))),y:Math.max(110,Math.min(394,Math.round(y-23))),w:26,h:46,type:'rock',demonBolt:true};
 const center={x:bolt.x+13,y:bolt.y+23};
 if(blocked(center.x,center.y,48,r.obstacles)||distance(center,p)<50||[[60,270],[480,63],[480,145],[480,477]].some(([x,y])=>distance(center,{x,y})<100))return false;
 const next=[...r.obstacles,bolt],targets=[{x:60,y:270},...r.enemies.filter(e=>e.hp>0).map(e=>({x:e.x,y:e.y}))];
 if(!routeOpen(next,p,targets))return false;
 r.obstacles=next;return true;
}
export function clearDemonSpecials(r,clearBolts=true){const d=r.demon;d.special=null;d.specialClock=3;d.summonClock=5;d.fields=[];d.flash=null;d.attacks=[];d.force=null;if(clearBolts)r.obstacles=r.obstacles.filter(o=>!o.demonBolt);}
export function updateDemonSpecials(s,r,p,dt,bullets,hurt,routeOpen){
 const d=r.demon;if(d.phase!==3)return;
 if(d.flash){d.flash.time=Math.max(0,d.flash.time-dt);if(!d.flash.time)d.flash=null;}
 for(const f of d.fields){f.time=Math.max(0,f.time-dt);if(f.time>0&&distance(f,p)<f.radius&&!segmentBlocked(f,p,r.obstacles))hurt(9,'헬 플레임 화염 장판');}d.fields=d.fields.filter(f=>f.time>0);
 // A single grace timer applies across every bolt, preventing overlapping auras
 // from chaining a permanent stun. Entry grace and blink immunity also protect it.
 if(!(p.electricGrace>0)&&!(s.entryGrace>0)&&!(s.invulnerable>0)&&r.obstacles.some(o=>o.demonBolt&&distance({x:o.x+13,y:o.y+23},p)<62)){p.actionStun=1;p.electricGrace=2.5;}
 if(d.special){const a=d.special;a.time=Math.max(0,a.time-dt);if(!a.time){
  if(distance(a,p)<a.radius&&!segmentBlocked(a,p,r.obstacles))hurt(18,demonSpecialNames[a.kind]+' 직격');
  d.flash={kind:a.kind,x:a.x,y:a.y,radius:a.radius,time:.6};
  if(a.kind==='flame')d.fields.push({x:a.x,y:a.y,radius:86,time:3});
  if(a.kind==='ice')for(let i=0;i<12;i++){const angle=i*Math.PI/6;bullets.push({x:a.x,y:a.y,vx:Math.cos(angle)*280,vy:Math.sin(angle)*280,enemy:true,source:'서브제로 메테오 얼음 파편',damage:9,life:3,hit:[],demonIce:true});}
  if(a.kind==='zeus'){for(const [dx,dy] of [[0,0],[60,0],[-60,0],[0,60],[0,-60]])if(tryDemonBolt(r,a.x+dx,a.y+dy,p,routeOpen))break;}
  d.special=null;d.specialClock=0;
 }}
 if(!d.special){d.specialClock=Math.max(0,d.specialClock-dt);if(!d.specialClock){const kind=['flame','ice','zeus'][Math.floor(runRandom(s)*3)];d.special={kind,x:Math.max(35,Math.min(925,p.x)),y:Math.max(50,Math.min(490,p.y)),radius:60,time:3};}}
 d.summonClock=Math.max(0,d.summonClock-dt);if(!d.summonClock){d.summonClock=6;let count=r.enemies.filter(e=>e.summoned&&e.hp>0).length;
  for(let i=0;i<2&&count<8;i++){let point=null;for(let j=0;j<30;j++){const candidate={x:125+runRandom(s)*710,y:130+runRandom(s)*280};safeSpawn(candidate,r.obstacles,22);if(!blocked(candidate.x,candidate.y,22,r.obstacles)&&distance(candidate,p)>170&&distance(candidate,{x:60,y:270})>100){point=candidate;break;}}if(!point)continue;const type=i?'demonArcher':'demonSoldier',max=type==='demonArcher'?180:230;r.enemies.push({id:allocateEnemyId(r),type,...point,max,hp:max,tier:9,balanceVersion:1,cd:1.2,summoned:true,summoner:r.enemies.find(e=>e.part==='core').id,spawnGrace:1});count++;}
 }
}
