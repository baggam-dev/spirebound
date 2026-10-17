import {isDemonSweep} from '../combat/demon-sweep.js';
import {CORE_MOTION,demonCorePose} from '../combat/demon-core-motion.js';
import {demonPresentationPose} from './demon-presentation-state.js';
import {drawDemonPresentationBody,hasDemonPresentationPose} from './demon-presentation-art.js';
// Layered display assets for the approved wall-breach boss. No combat/save writes.
const images=new Map();
const sizes={body:[1536,1024],arm:[1254,1254],wall:[1774,887],foot:[1254,1254]};
export const demonCoreSpriteState=()=>({ready:images.size===4});
export const demonCoreSpriteReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(Object.entries(sizes).map(([name,[w,h]])=>new Promise(resolve=>{
 const image=new Image();image.onload=()=>{if(image.naturalWidth!==w||image.naturalHeight!==h){resolve(false);return;}images.set(name,image);resolve(true);};image.onerror=()=>resolve(false);image.src=new URL(`../../assets/images/demon-core-${name}-atlas.png`,import.meta.url).href;
}))).then(results=>results.every(Boolean));
// Explicit rectangles preserve shoulder anchors; generated poses are not equal cells.
const arms=[
 {x:210,y:0,w:370,h:637,ax:325,ay:165},
 {x:665,y:0,w:580,h:630,ax:780,ay:165},
 {x:25,y:635,w:675,h:614,ax:565,ay:785},
 {x:830,y:632,w:375,h:620,ax:955,ay:790}
];
const feet=[{x:25,y:20,w:610,h:590},{x:695,y:25,w:559,h:600},{x:5,y:690,w:680,h:550},{x:680,y:640,w:574,h:605}];
function sample(c,image,r,x,y,scale){c.drawImage(image,r.x,r.y,r.w,r.h,x,y,r.w*scale,r.h*scale);}
function arm(c,side,index,tilt=0){
 const r=arms[index];c.save();c.translate(side*64,-61);c.scale(side,1);if(tilt)c.rotate(tilt);if(index===2)c.rotate(-.5);sample(c,images.get('arm'),r,(r.x-r.ax)*.22,(r.y-r.ay)*.22,.22);c.restore();
}
function foot(c,x,y,index,opacity=1,lift=0){
 const r=feet[index],scale=.16;c.save();c.globalAlpha*=Math.max(0,Math.min(1,opacity));sample(c,images.get('foot'),r,x-r.w*scale/2,y+24-r.h*scale-lift,scale);c.restore();
}
export function drawDemonCoreSprite(c,e,time=0,{attack=null,staticPose=false,reduced=false,wall=false,sweepFlash=null,coreFlash=null,enhanced=false,room=null,deathPose=null,bodyAlpha=1}={}){
 if(e.variant!=='demon'||e.part!=='core'||images.size!==4)return false;
 const p=demonCorePose({attack,staticPose,sweepFlash,coreFlash,enhanced});
 const mouth=p.kind?.startsWith('mouth')||p.kind==='coreBurst',eye=p.kind?.startsWith('eye'),sweep=isDemonSweep(p.kind);
 const face=p.stage===0?0:mouth?(p.stage===1?1:p.stage===2?2:5):eye?(p.stage===1?3:p.stage===2?4:5):0;
 const requested=deathPose||(!p.stage?demonPresentationPose(e,room,{reduced,staticPose}):null);
 const presentation=hasDemonPresentationPose(requested)?requested:null;
 const tilt=reduced?0:presentation==='rest'?.16:presentation==='death'?.09:presentation==='arrival'?-.03:presentation==='heavy'?-.04:0;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.imageSmoothingEnabled=false;
 if(wall)c.drawImage(images.get('wall'),-150,-74,300,150);
 c.save();c.globalAlpha*=bodyAlpha;
 // Arms sit below the torso shoulders; only the selected arm changes pose.
 const moving=sweep&&p.stage>0;
 if(!moving||p.side!==-1)arm(c,-1,0,tilt);if(!moving||p.side!==1)arm(c,1,0,tilt);
 if(!presentation||!drawDemonPresentationBody(c,presentation))c.drawImage(images.get('body'),face%3*512,Math.floor(face/3)*512,512,512,-90,-140,180,180);
 if(moving)arm(c,p.side,p.stage);
 c.restore();
 // The generated lower sill is a separate foreground layer, never baked into the body.
 if(wall){c.save();c.beginPath();c.rect(-151,28,302,50);c.clip();c.drawImage(images.get('wall'),-150,-74,300,150);c.restore();}
 if(!staticPose&&(p.stage===1||p.stage===2)&&eye){
  c.fillStyle='#e9c66a';c.globalAlpha*=reduced?.18:p.stage===2?.55:.2+p.progress*.25;for(const x of [-14,14]){c.beginPath();c.ellipse(x,-91,4,2,0,0,Math.PI*2);c.fill();}
 }
 c.restore();
 if(!staticPose&&p.kind==='footJump'&&p.target&&Number.isFinite(p.target.x)&&Number.isFinite(p.target.y)){
  c.save();c.imageSmoothingEnabled=false;
  if(p.stage===1)foot(c,p.target.x,p.target.y,p.progress<.65?0:1,reduced?1:Math.min(1,p.progress*4),reduced?0:60*(1-p.progress));
  else if(p.stage===2)foot(c,p.target.x,p.target.y,2);
  else if(p.stage===3){const t=Math.max(0,Math.min(1,(p.elapsed-CORE_MOTION.strike)/CORE_MOTION.recover));foot(c,p.target.x,p.target.y,3,1-t,reduced?0:t*55);}
  c.restore();
 }
 return true;
}
export function drawDemonCoreDeath(c,f,{reduced=false}={}){
 if(!f.demonCore||images.size!==4||!hasDemonPresentationPose('death')||!hasDemonPresentationPose('rest'))return false;
 const age=Math.max(0,Math.min(1,1-f.t/f.duration));
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 drawDemonCoreSprite(c,{variant:'demon',part:'core',x:f.x,y:f.y},0,{wall:true,staticPose:true,reduced,deathPose:reduced||age>.42?'rest':'death',bodyAlpha:Math.min(1,(1-age)*2)});
 c.restore();return true;
}
