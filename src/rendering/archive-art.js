import {DeferredImage} from './asset-requests.js';
import {environmentMaterial,environmentSurface,environmentReferenceReady} from './environment-material.js';
// Approved floor 3 archive materials. All caches live outside run/save/game RNG state.
let frames=[],epoch=0,pending;
const floors=new Map();
// Generated furniture spans wider than its nominal cell: isolate the actual source regions.
const regions=[
 [0,0,.25,1/3],[.25,0,.25,1/3],[.5,0,.25,1/3],[.75,0,.25,1/3],
 [0,1/3,.22,1/3],[.225,1/3,.217,1/3],[.445,1/3,.303,1/3],[.75,1/3,.25,1/3],
 [0,2/3,.318,1/3],[.322,2/3,.205,1/3],[.55,2/3,.15,1/3],[.74,2/3,.26,1/3]
];
export const archiveLoaded=()=>frames.length===12;
export const archiveVersion=()=>epoch;
export function loadArchiveArt(){
 if(pending)return pending;
 pending=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
  const image=new DeferredImage();image.onload=async()=>{try{await environmentReferenceReady;
   const next=[];
   for(let i=0;i<12;i++){
    const [rx,ry,rw,rh]=regions[i],sw=rw*image.naturalWidth,sh=rh*image.naturalHeight;
    const scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(image,rx*image.naturalWidth,ry*image.naturalHeight,sw,sh,0,0,sw,sh);
    const pixels=c.getImageData(0,0,scan.width,scan.height),data=pixels.data;let left=scan.width,top=scan.height,right=-1,bottom=-1;
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){const alpha=(y*scan.width+x)*4+3;if(data[alpha]<64){data[alpha]=0;continue;}left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    c.putImageData(pixels,0,0);
    if(right<=left||bottom<=top){resolve(false);return;}
    const width=right-left+1,height=bottom-top+1,target=i<4?128:Math.min(128,width/height*96),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(target));canvas.height=i<4?128:Math.max(1,Math.ceil(target*height/width));const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(scan,left,top,width,height,0,0,canvas.width,canvas.height);next.push(environmentMaterial(canvas,i>=4,i===3));
   }
   frames=next;epoch++;floors.clear();resolve(true);
  }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/archive-atlas-v1.png',import.meta.url).href;
 });return pending;
}
const roomSeed=(s,r)=>((s.seed||0)^Math.imul((r.x||0)+31,73856093)^Math.imul((r.y||0)+43,19349663))>>>0;
export function drawArchiveProp(c,index,x,feet,width){
 const f=frames[index];if(!f)return false;const height=width*f.height/f.width;c.save();c.imageSmoothingEnabled=false;c.drawImage(f,Math.round(x-width/2),Math.round(feet-height),width,height);c.restore();return true;
}
export function drawArchiveFloor(c,s,r){
 if(!archiveLoaded()){loadArchiveArt();return false;}const seed=roomSeed(s,r),key=[seed,r.type,r.objectPosition?.x,r.objectPosition?.y,epoch].join(':');let layer=floors.get(r);
 if(!layer||layer.key!==key){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#36333e';cc.fillRect(0,0,960,540);
  for(let row=0;row<6;row++)for(let col=0;col<8;col++){const x=col*144-(row%2?72:0),y=row*96,h=(seed+Math.imul(row+5,7919)+Math.imul(col+11,17389))>>>0;cc.save();cc.translate(x+72,y+48);cc.rotate((h>>>5)%2*Math.PI);cc.drawImage(frames[h%3],-72,-48,144,96);cc.restore();}
  // Existing shared facilities keep their stored anchor; this is a quiet stone footing only.
  if(['shrine','event'].includes(r.type)){const q=r.objectPosition||{x:480,y:115};cc.fillStyle=r.type==='shrine'?'#88778f16':'#7f576416';cc.fillRect(q.x-38,q.y-25,76,46);cc.strokeStyle='#b7a18c24';cc.strokeRect(q.x-37.5,q.y-24.5,75,45);}
  const shade=cc.createRadialGradient(480,270,100,480,270,540);shade.addColorStop(0,'#2c273624');shade.addColorStop(1,'#17142070');cc.fillStyle=shade;cc.fillRect(0,0,960,540);layer={key,canvas:environmentSurface(canvas)};floors.set(r,layer);while(floors.size>3)floors.delete(floors.keys().next().value);
 }
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();return true;
}
export function paintArchiveWalls(c,walls,edges){
 if(!archiveLoaded()){loadArchiveArt();return false;}c.save();c.imageSmoothingEnabled=false;const covered=new Set();
 for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/80)*80;x<o.x+o.w;x+=80){const key=x+':'+y;if(covered.has(key))continue;covered.add(key);c.drawImage(frames[3],x,y,80,40);}
 for(const e of edges){const horizontal=e.side==='top'||e.side==='bottom',light=e.side==='top'||e.side==='left';c.fillStyle=light?'#887e8b38':'#2b263348';if(horizontal)c.fillRect(e.start,e.axis-(light?0:3),e.end-e.start,3);else c.fillRect(e.axis-(light?0:3),e.start,3,e.end-e.start);}
 c.restore();return true;
}
export function drawArchiveDoor(c,x,y,side,locked){
 const f=frames[5];if(!f){loadArchiveArt();return false;}c.save();if(side){c.translate(x,y+70);c.rotate(-Math.PI/2);}else c.translate(x,y);const w=side?70:80,h=side?29:35;c.imageSmoothingEnabled=false;c.fillStyle='#1a1720';c.fillRect(0,0,w,h);
 if(locked)c.drawImage(f,0,0,w,h);else{const strip=Math.round(f.width*.24);c.drawImage(f,0,0,strip,f.height,0,0,w*.24,h);c.drawImage(f,f.width-strip,0,strip,f.height,w*.76,0,w*.24,h);c.drawImage(f,0,0,f.width,Math.round(f.height*.18),0,0,w,h*.18);}
 c.restore();return true;
}
export const isArchiveObstacle=o=>['bookshelf','table','rock','bones'].includes(o.type);
export function drawArchiveObstacle(c,o){
 if(!isArchiveObstacle(o))return false;if(!archiveLoaded()){loadArchiveArt();return false;}
 const f=frames[o.type==='bookshelf'?6:o.type==='table'?7:8];c.save();c.fillStyle='#0005';c.fillRect(o.x-2,o.y+5,o.w+4,o.h);c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.fillStyle='#211d26';c.fillRect(o.x,o.y,o.w,o.h);c.imageSmoothingEnabled=false;c.drawImage(f,o.x,o.y,o.w,o.h);c.restore();return true;
}
function tablePage(c,o,t,reduced){
 const f=frames[11],x=Math.round(o.x+o.w*.62),y=Math.round(o.y+o.h*.32);c.save();c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.imageSmoothingEnabled=false;
 for(let i=0;i<4;i++){const sy=Math.floor(i*f.height/4),end=Math.floor((i+1)*f.height/4),shift=!reduced&&i===3?Math.round(Math.sin(t*1.4+o.x*.03)):0;c.drawImage(f,0,sy,f.width,end-sy,x+shift,y+i*2,12,2);}c.restore();
}
export function drawArchiveDetails(c,s,r,reduced=false){
 if(s.floor!==2)return;if(!archiveLoaded()){loadArchiveArt();return;}const seed=roomSeed(s,r),t=reduced?0:s.elapsed;c.save();
 // Wall bookcases never masquerade as new blockers on a traversal lane.
 drawArchiveProp(c,6,seed%2?190:770,41,Math.min(59,31*frames[6].width/frames[6].height));drawArchiveProp(c,8,seed%2?770:190,42,Math.min(39,26*frames[8].width/frames[8].height));
 for(const x of [125,835])drawArchiveProp(c,9,x,35,21);
 for(const x of [13,947])for(const feet of [160,400])drawArchiveProp(c,4,x,feet,22);
 let pages=0;for(const o of r.obstacles||[])if(o.type==='table'&&pages++<2)tablePage(c,o,t,reduced);
 if(!reduced){c.beginPath();c.rect(26,45,908,455);c.clip();for(let i=0;i<8;i++){const phase=(t*.1+i*.127+seed%107/107)%1;c.globalAlpha=Math.sin(phase*Math.PI)*.1;c.fillStyle='#d3c7b1';c.fillRect(70+(seed+i*137)%820,90+i%2*340-phase*12,1,1);}}
 c.restore();
}
