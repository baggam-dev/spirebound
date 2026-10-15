// Approved v2 package. Cached crops share one scale; drawing never changes actors.
const frames=[],motion=new WeakMap(),scale=.18;
export const demonBatSpriteState=()=>({ready:frames.length===4});
export const demonBatSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  // Unequal pose bounds: the raised wings extend above the nominal sheet cell.
  for(const f of [
   {x:55,y:340,w:610,h:305,ax:370,ay:515,clip:[[55,340],[620,340],[620,510],[665,555],[665,645],[55,645]]},
   {x:640,y:100,w:555,h:510,ax:995,ay:535,clip:[[640,100],[1195,100],[1195,610],[710,610],[710,510],[640,400]]},
   {x:65,y:755,w:570,h:375,ax:370,ay:980},
   {x:620,y:730,w:585,h:365,ax:1055,ay:1020}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   // Separate neighboring wing tips that overlap the rectangular pose bounds.
   if(f.clip){ctx.beginPath();f.clip.forEach(([x,y],i)=>i?ctx.lineTo((x-f.x)*scale,(y-f.y)*scale):ctx.moveTo((x-f.x)*scale,(y-f.y)*scale));ctx.closePath();ctx.clip();}
   ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:(f.y-f.ay)*scale-8});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/demon-bat-reference-atlas.png',import.meta.url).href;
});
export function drawDemonBatSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type!=='demonBat'||frames.length!==4)return false;
 let face=1;
 if(!staticPose){
  let p=motion.get(e);if(!p){p={x:e.x,face:1};motion.set(e,p);}
  if(Math.abs(e.x-p.x)>.1)p.face=Math.sign(e.x-p.x);p.x=e.x;
  face=e.attackPhase&&Number.isFinite(e.aim)?(Math.cos(e.aim)<0?-1:1):p.face;
 }
 const frame=staticPose?0:e.attackPhase==='dash'?3:e.attackPhase==='warning'?2:reduced||e.frozen>0?0:Math.floor(time*7+(e.id||0))%2;
 const f=frames[frame],bob=staticPose||reduced||e.frozen>0||e.attackPhase?0:Math.sin(time*7+(e.id||0))*2;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));
 if(!staticPose){c.fillStyle='#0005';c.fillRect(-16,16,32,5);}
 c.translate(0,bob);c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(!staticPose&&e.escapeDepth){c.strokeStyle='#e7a0a0';c.lineWidth=1.5;c.beginPath();c.moveTo(-15,10);c.lineTo(-21,7);c.moveTo(15,10);c.lineTo(21,7);c.stroke();}
 c.restore();return true;
}
