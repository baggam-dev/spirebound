import {drawPixelActor} from './pixel-world.js';
import {drawUpper} from './upper-visuals.js';
import {upperTypes} from '../combat/upper-floors.js';
import {drawInfernal,infernalTypes} from '../combat/infernal-enemies.js';
import {drawPoisonEnemy} from '../combat/poison.js';
const snapshots=new WeakMap();
export function drawOrdinaryDeath(c,f,{reduced=false}={}){
 if(!f.ordinary||f.style==='batExplosion')return false;
 let canvas=snapshots.get(f);
 if(!canvas){
  canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.translate(128,160);
  const e={id:0,type:f.bodyType,hp:1,max:1,x:0,y:0,scale:f.bodyScale,escapeDepth:f.bodyEscapeDepth,facing:f.face<0?Math.PI:0};
  ctx.scale(f.face<0?-1:1,1);
  if(upperTypes.includes(e.type))drawUpper(ctx,e,0,true,true);
  else if(infernalTypes.includes(e.type))drawInfernal(ctx,e,0,true,true);
  else if(['flower','minislime'].includes(e.type))drawPoisonEnemy(ctx,e,0,{}, {staticPose:true,reduced:true});
  else{ctx.scale(e.scale??1,e.scale??1);drawPixelActor(ctx,e,0,null,true);}
  snapshots.set(f,canvas);
 }
 const age=Math.max(0,Math.min(1,1-f.t/f.duration));c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 c.globalAlpha*=Math.max(0,1-age)*.85;c.translate(Math.round(f.x),Math.round(f.y));
 if(!reduced){const feet=f.bodyType==='brute'?24:21;c.translate(0,feet);c.scale(1+age*.07,1-age*.25);c.translate(0,-feet);}
 c.imageSmoothingEnabled=false;c.drawImage(canvas,-128,-160);c.restore();return true;
}
