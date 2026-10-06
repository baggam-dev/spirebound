import {drawSoftField} from '../rendering/ground-visuals.js';
import {moveBody,steering,segmentBlocked,safeSpawn} from '../world/terrain.js';

export const infernalTypes=['demonBat','spikeNest','demonSoldier','demonArcher','demonCaptain'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const radius=e=>e.type==='demonBat'?14:e.type==='demonCaptain'?24:19;
function walk(e,p,obstacles,dt,speed){const a=steering(e,p,obstacles,radius(e)),slow=e.slow>0?e.slowFactor:1;moveBody(e,Math.cos(a)*speed*slow*dt,Math.sin(a)*speed*slow*dt,obstacles,radius(e));e.x=clamp(e.x,45,915);e.y=clamp(e.y,60,480);}
function shoot(e,a,bullets){bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*270,vy:Math.sin(a)*270,enemy:true,source:'악마 사수 화살',damage:e.escapeDepth>=4?12:10,life:4,hit:[]});}
export function updateInfernal(e,p,room,dt,bullets,hurt){
 const obstacles=room.obstacles,kind=e.type;
 if(e.attackPhase){
  e.attackTime=Math.max(0,e.attackTime-dt);
  if(kind==='demonBat'&&e.attackPhase==='dash'){
   const before={x:e.x,y:e.y},speed=340*(e.slow>0?e.slowFactor:1);
   moveBody(e,Math.cos(e.aim)*speed*dt,Math.sin(e.aim)*speed*dt,obstacles,14);
   e.x=clamp(e.x,45,915);e.y=clamp(e.y,60,480);
   if(!e.hit&&distance(e,p)<28&&!segmentBlocked(before,p,obstacles)){hurt(12,'폭렬 박쥐 충돌');e.hit=true;}
   if(e.attackTime===0){if(distance(e,p)<48&&!e.hit&&!segmentBlocked(e,p,obstacles))hurt(12,'폭렬 박쥐 폭발');e.hp=0;e.summoned=true;e.selfDestruct=true;}
   return;
  }
  if(kind==='demonCaptain'&&e.attackPhase==='dash'){
   const before={x:e.x,y:e.y};moveBody(e,Math.cos(e.aim)*255*dt,Math.sin(e.aim)*255*dt,obstacles,24);
   e.x=clamp(e.x,50,910);e.y=clamp(e.y,65,475);
   if(!e.hit&&distance(e,p)<40&&!segmentBlocked(before,p,obstacles)){hurt(18,'악마 부대장 돌진');e.hit=true;}
   if(e.attackTime===0){e.attackPhase='recover';e.attackTime=.8;}return;
  }
  if(e.attackTime>0)return;
  if(e.attackPhase==='warning'){
   if(kind==='demonBat'){e.attackPhase='dash';e.attackTime=.34;e.hit=false;return;}
   if(kind==='demonCaptain'){e.attackPhase='dash';e.attackTime=.42;e.hit=false;return;}
   if(kind==='spikeNest'){if(Math.hypot(p.x-e.targetX,p.y-e.targetY)<34)hurt(9,'심연 가시핵 솟구침');}
   if(kind==='demonSoldier'&&distance(e,p)<72&&Math.abs(Math.atan2(Math.sin(aim(e,p)-e.aim),Math.cos(aim(e,p)-e.aim)))<1.05&&!segmentBlocked(e,p,obstacles))hurt(9,'악마 병사 베기');
   if(kind==='demonArcher')for(const offset of [-.14,.14])shoot(e,e.aim+offset,bullets);
   e.attackPhase='recover';e.attackTime=kind==='spikeNest'?.55:.65;return;
  }
  e.attackPhase=null;e.cd=kind==='spikeNest'?2.5:kind==='demonArcher'?2.1:kind==='demonCaptain'?2.3:1.6;
  return;
 }
 e.cd=(e.cd??1)-dt;
 const gap=distance(e,p);
 if(kind==='demonBat')walk(e,p,obstacles,dt,145);
 if(kind==='demonSoldier'||kind==='demonCaptain')walk(e,p,obstacles,dt,kind==='demonCaptain'?82:68);
 if(kind==='demonArcher'&&(gap>260||segmentBlocked(e,p,obstacles,3)))walk(e,p,obstacles,dt,42);
 if(e.cd>0||kind==='demonBat'&&gap>85||kind==='demonSoldier'&&gap>85||kind==='demonCaptain'&&gap>260)return;
 if(kind==='spikeNest'){const point={x:clamp(p.x,65,895),y:clamp(p.y,75,465)};safeSpawn(point,obstacles,34);e.targetX=point.x;e.targetY=point.y;}
 e.aim=aim(e,p);e.attackPhase='warning';e.attackTime=kind==='spikeNest'?.9:kind==='demonBat'?.5:kind==='demonCaptain'?.75:.65;
}
export function drawInfernalGround(c,e){if(e.type==='spikeNest'&&e.attackPhase==='warning'){drawSoftField(c,e.targetX,e.targetY,36,'#d68daa',.55);c.fillStyle='#eab7c5';c.fillRect(e.targetX-2,e.targetY-15,4,12);}}
export function drawInfernal(c,e){if(!infernalTypes.includes(e.type))return;c.save();c.translate(e.x,e.y);const red=!!e.escapeDepth;c.fillStyle='#0008';c.fillRect(-18,18,36,5);
 if(e.type==='demonBat'){c.fillStyle='#211c2a';c.fillRect(-26,-10,14,5);c.fillRect(12,-10,14,5);c.fillRect(-23,-5,7,5);c.fillRect(16,-5,7,5);c.fillStyle=red?'#702c3d':'#39213a';c.fillRect(-13,-14,26,20);c.fillRect(-24,-8,12,7);c.fillRect(12,-8,12,7);c.fillStyle=red?'#b65257':'#71405d';c.fillRect(-21,-7,8,2);c.fillRect(13,-7,8,2);c.fillStyle=red?'#e67b60':'#9c567b';c.fillRect(-8,-20,5,8);c.fillRect(3,-20,5,8);c.fillStyle='#ff9e8c';c.fillRect(-7,-7,4,3);c.fillRect(3,-7,4,3);c.fillStyle='#d28c8d';c.fillRect(-2,1,4,2);}
 if(e.type==='spikeNest'){c.fillStyle='#211e29';c.fillRect(-25,13,50,8);c.fillRect(-20,2,40,17);c.fillStyle=red?'#883c45':'#5a3949';for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*8-5,5);c.lineTo(i*8,-21-(i%2)*5);c.lineTo(i*8+5,5);c.fill();}c.fillStyle=red?'#ea8467':'#ad7084';for(const x of [-16,0,16])c.fillRect(x,-9,2,10);c.fillStyle=red?'#ffe0a2':'#e5aab7';c.fillRect(-4,-4,8,5);c.fillStyle='#67394d';c.fillRect(-21,17,8,4);c.fillRect(13,17,8,4);}
 if(['demonSoldier','demonArcher','demonCaptain'].includes(e.type)){const captain=e.type==='demonCaptain',archer=e.type==='demonArcher';c.fillStyle='#1d1e27';c.fillRect(-14,-25,28,40);c.fillStyle=red?(captain?'#713944':'#65313b'):captain?'#4c4356':'#393840';c.fillRect(-12,-23,24,35);c.fillStyle=red?'#ad454b':'#8e5360';c.fillRect(-10,-28,20,12);c.fillStyle=red?'#ffd5a0':'#f3ba86';c.fillRect(-7,-24,14,4);c.fillStyle='#24242b';c.fillRect(-10,12,7,9);c.fillRect(3,12,7,9);c.fillStyle=captain?'#b6a59f':'#8b8385';c.fillRect(-15,-16,5,22);c.fillRect(10,-16,5,22);c.fillStyle='#79666a';c.fillRect(-9,-10,18,2);c.fillRect(-9,6,18,2);c.fillStyle='#be8b76';c.fillRect(-2,-6,4,10);if(captain){c.fillStyle='#b6a59f';c.fillRect(-12,-34,24,7);c.fillRect(-18,-27,6,9);c.fillRect(12,-27,6,9);c.fillStyle='#d2bdad';c.fillRect(-8,-33,16,2);}if(archer){c.strokeStyle='#d8b68a';c.lineWidth=3;c.beginPath();c.arc(18,-8,12,-Math.PI/2,Math.PI/2);c.stroke();}else{c.fillStyle='#d5b0a4';c.fillRect(15,-20,4,29);}}
 if(red){
  c.strokeStyle='#e97558';c.lineWidth=2;c.beginPath();
  if(e.type==='demonBat'){for(const side of [-1,1]){c.moveTo(side*11,-9);c.lineTo(side*18,-5);c.lineTo(side*22,-7);}c.stroke();c.fillStyle='#ffe6a7';for(const x of [-7,3])c.fillRect(x,-7,4,3);c.fillStyle='#ed785a';c.fillRect(-10,-23,4,9);c.fillRect(6,-23,4,9);}
  else if(e.type==='spikeNest'){for(const x of [-16,0,16]){c.moveTo(x,-12);c.lineTo(x-3,-3);c.lineTo(x+2,4);}c.stroke();c.fillStyle='#ffd88f';c.fillRect(-5,-5,10,6);}
  else{c.moveTo(-8,-15);c.lineTo(-2,-8);c.lineTo(-6,-2);c.lineTo(3,6);c.stroke();c.fillStyle='#ff9c64';c.fillRect(-14,-28,5,7);c.fillRect(9,-28,5,7);c.fillStyle='#fff0b7';c.fillRect(-7,-24,14,3);
   if(e.type==='demonArcher'){c.strokeStyle='#ff9c64';c.lineWidth=2;c.beginPath();c.arc(18,-8,14,-Math.PI/2,Math.PI/2);c.stroke();}
   if(e.type==='demonCaptain'){c.fillStyle='#ef9a65';c.fillRect(-16,-37,7,5);c.fillRect(9,-37,7,5);}
  }
 }
 if(e.attackPhase==='warning'&&e.type!=='spikeNest'){const reach=e.type==='demonArcher'?230:e.type==='demonCaptain'?160:e.type==='demonBat'?130:75;c.globalAlpha=.55;c.strokeStyle='#edaa9c';c.lineWidth=1;c.setLineDash([5,5]);c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(e.aim)*reach,Math.sin(e.aim)*reach);c.stroke();}
 c.restore();}
