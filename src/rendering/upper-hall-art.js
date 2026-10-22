import {DeferredImage} from './asset-requests.js';
import {environmentMaterial,environmentSurface,environmentReferenceReady} from './environment-material.js';
// Approved floor-pair presentation. Images/caches never enter run, save or game RNG.
const regular=()=>Array.from({length:12},(_,i)=>[i%4/4,Math.floor(i/4)/3,1/4,1/3]);
const royal={file:'royal-hall-atlas-v1.png',frames:[],epoch:0,floors:new Map(),regions:regular()};
const infernal={file:'infernal-hall-atlas-v1.png',frames:[],epoch:0,floors:new Map(),regions:regular()};
// Isolate real source outlines where generated wide props crossed nominal gutters.
royal.regions.splice(8,4,[0,2/3,.27,1/3],[.3,2/3,.19,1/3],[.56,2/3,.14,1/3],[.79,2/3,.15,1/3]);
infernal.regions=[
 [0,0,.25,1/3],[.25,0,.23,1/3],[.49,0,.22,1/3],[.72,0,.28,1/3],
 [0,1/3,.19,1/3],[.19,1/3,.28,1/3],[.48,1/3,.255,1/3],[.74,1/3,.26,1/3],
 [0,2/3,.33,1/3],[.365,2/3,.13,1/3],[.55,2/3,.12,1/3],[.72,2/3,.26,1/3]
];
const pack=floor=>floor===6||floor===7?royal:floor===8||floor===9?infernal:null;
// v2 has hand-inspected row gutters; keep old regions for source-load fallback.
const rows=[0,273,522,750,973,1221,1448],columns=[0,273,543,790,1086];
for(const [offset,p] of [[0,royal],[3,infernal]]){
 p.legacyFile=p.file;p.legacyRegions=p.regions;p.file='high-hall-atlas-v2.png';
 p.regions=Array.from({length:12},(_,i)=>[columns[i%4]/1086,rows[Math.floor(i/4)+offset]/1448,(columns[i%4+1]-columns[i%4])/1086,(rows[Math.floor(i/4)+offset+1]-rows[Math.floor(i/4)+offset])/1448]);
}
export const isUpperHallFloor=floor=>pack(floor)!==null;
export const royalHallLoaded=()=>royal.frames.length===12;
export const infernalHallLoaded=()=>infernal.frames.length===12;
export const upperHallLoaded=floor=>pack(floor)?.frames.length===12;
export const upperHallVersion=floor=>pack(floor)?.epoch||0;
function load(p){
 if(p.pending)return p.pending;
 p.pending=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
  const image=new DeferredImage();image.onload=async()=>{try{await environmentReferenceReady;
   if(!p.fallback&&(image.naturalWidth!==1086||image.naturalHeight!==1448)){image.onerror();return;}
   const next=[];
   for(let i=0;i<12;i++){
    const [rx,ry,rw,rh]=p.regions[i],sw=rw*image.naturalWidth,sh=rh*image.naturalHeight,scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(image,rx*image.naturalWidth,ry*image.naturalHeight,sw,sh,0,0,sw,sh);
    const pixels=c.getImageData(0,0,scan.width,scan.height),data=pixels.data;let left=scan.width,top=scan.height,right=-1,bottom=-1;
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){const alpha=(y*scan.width+x)*4+3;if(data[alpha]<64){data[alpha]=0;continue;}left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    if(right<=left||bottom<=top){image.onerror();return;}c.putImageData(pixels,0,0);
    const width=right-left+1,height=bottom-top+1,target=i<4?128:Math.min(128,width/height*96),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(target));canvas.height=i<4?128:Math.max(1,Math.ceil(target*height/width));const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(scan,left,top,width,height,0,0,canvas.width,canvas.height);next.push(environmentMaterial(canvas,i>=4,i===3,{preserve:true}));
   }
   p.frames=next;p.epoch++;p.floors.clear();resolve(true);
  }catch{image.onerror();}};image.onerror=()=>{if(!p.fallback){p.fallback=true;p.file=p.legacyFile;p.regions=p.legacyRegions;image.src=new URL('../../assets/images/'+p.file,import.meta.url).href;}else resolve(false);};image.src=new URL('../../assets/images/'+p.file,import.meta.url).href;
 });return p.pending;
}
export const loadRoyalHallArt=()=>load(royal);
export const loadInfernalHallArt=()=>load(infernal);
const seedFor=(s,r)=>((s.seed||0)^Math.imul((r.x||0)+31,73856093)^Math.imul((r.y||0)+43,19349663))>>>0;
export function drawUpperHallProp(c,floor,index,x,feet,width){
 const f=pack(floor)?.frames[index];if(!f)return false;const height=width*f.height/f.width;c.save();c.imageSmoothingEnabled=false;c.drawImage(f,Math.round(x-width/2),Math.round(feet-height),width,height);c.restore();return true;
}
export function drawUpperHallFloor(c,s,r){
 const p=pack(s.floor);if(!p)return false;if(p.frames.length!==12){load(p);return false;}const seed=seedFor(s,r),key=[seed,s.floor,r.type,r.gate,p.epoch].join(':');let layer=p.floors.get(r);
 if(!layer||layer.key!==key){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle=p===royal?'#333641':'#2a292e';cc.fillRect(0,0,960,540);
  for(let row=0;row<6;row++)for(let col=0;col<8;col++){const x=col*144-(row%2?72:0),y=row*96,h=(seed+Math.imul(row+5,7919)+Math.imul(col+11,17389))>>>0;cc.save();cc.translate(x+72,y+48);cc.rotate((h>>>5)%2*Math.PI);cc.drawImage(p.frames[h%2],-74,-50,148,100);cc.restore();}
  const shade=cc.createRadialGradient(480,270,100,480,270,540);shade.addColorStop(0,'#17162420');shade.addColorStop(1,'#12121d70');cc.fillStyle=shade;cc.fillRect(0,0,960,540);layer={key,canvas:environmentSurface(canvas)};p.floors.set(r,layer);while(p.floors.size>3)p.floors.delete(p.floors.keys().next().value);
 }
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();return true;
}
export function paintUpperHallWalls(c,walls,edges,floor){
 const p=pack(floor);if(!p)return false;if(p.frames.length!==12){load(p);return false;}c.save();c.imageSmoothingEnabled=false;const covered=new Set();
 for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/80)*80;x<o.x+o.w;x+=80){const key=x+':'+y;if(covered.has(key))continue;covered.add(key);c.drawImage(p.frames[3],x,y,80,40);}
 if(floor===9)for(const o of walls){c.save();c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();for(let n=42;n<Math.max(o.w,o.h);n+=128){const vertical=o.h>o.w;drawUpperHallProp(c,floor,11,vertical?o.x+o.w/2:o.x+n,vertical?o.y+n:o.y+o.h,vertical?Math.min(o.w,22):40);}c.restore();}
 for(const e of edges){const horizontal=e.side==='top'||e.side==='bottom',light=e.side==='top'||e.side==='left';c.fillStyle=light?'#7d797c38':'#29293648';if(horizontal)c.fillRect(e.start,e.axis-(light?0:3),e.end-e.start,3);else c.fillRect(e.axis-(light?0:3),e.start,3,e.end-e.start);}
 c.restore();return true;
}
export function drawUpperHallDoor(c,x,y,side,locked,floor){
 const p=pack(floor);if(!p)return false;const f=p.frames[5];if(!f){load(p);return false;}c.save();if(side){c.translate(x,y+70);c.rotate(-Math.PI/2);}else c.translate(x,y);const w=side?70:80,h=side?29:35;c.imageSmoothingEnabled=false;c.fillStyle='#171821';c.fillRect(0,0,w,h);
 if(locked)c.drawImage(f,0,0,w,h);else{const strip=Math.round(f.width*.24);c.drawImage(f,0,0,strip,f.height,0,0,w*.24,h);c.drawImage(f,f.width-strip,0,strip,f.height,w*.76,0,w*.24,h);c.drawImage(f,0,0,f.width,Math.round(f.height*.18),0,0,w,h*.18);}c.restore();return true;
}
export const isUpperHallObstacle=o=>['bookshelf','table','rock','bones'].includes(o.type);
export function drawUpperHallObstacle(c,o,floor){
 const p=pack(floor);if(!p||!isUpperHallObstacle(o))return false;if(p.frames.length!==12){load(p);return false;}const f=p.frames[o.type==='bookshelf'?6:o.type==='table'?7:8];c.save();c.fillStyle='#0005';c.fillRect(o.x-2,o.y+5,o.w+4,o.h);c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.fillStyle='#25252c';c.fillRect(o.x,o.y,o.w,o.h);c.imageSmoothingEnabled=false;c.drawImage(f,o.x,o.y,o.w,o.h);c.restore();return true;
}
function cloth(c,x,t,reduced){
 const f=royal.frames[11];c.save();c.imageSmoothingEnabled=false;for(let i=0;i<9;i++){const sy=Math.floor(i*f.height/9),end=Math.floor((i+1)*f.height/9),shift=reduced?0:Math.round(Math.sin(t*1.6+i*.4+x*.03)*i/8);c.drawImage(f,0,sy,f.width,end-sy,x-7+shift,10+i*3,14,3);}c.restore();
}
function details(c,s,r,reduced){
 const p=pack(s.floor);if(!p)return;if(p.frames.length!==12){load(p);return;}const t=reduced?0:s.elapsed,seed=seedFor(s,r);c.save();
 // Side-wall pillars leave every door offset and the demon upper wall actor clear.
 for(const x of [13,947])for(const feet of [160,400])drawUpperHallProp(c,s.floor,4,x,feet,22);
 for(const x of [125,835])drawUpperHallProp(c,s.floor,9,x,36,Math.min(22,29*p.frames[9].width/p.frames[9].height));
 for(const [x,index] of [[190,s.floor===6?6:8],[770,8]])drawUpperHallProp(c,s.floor,index,x,42,Math.min(43,30*p.frames[index].width/p.frames[index].height));
 if(p===royal)for(const x of (s.floor===7?[160,230,730,800]:[160,800]))cloth(c,x,t,reduced);
 if(!reduced){c.beginPath();c.rect(26,45,908,455);c.clip();for(let i=0;i<6;i++){const age=(t*.09+i*.157+seed%101/101)%1;c.globalAlpha=Math.sin(age*Math.PI)*.08;c.fillStyle=p===royal?'#c4baa3':'#c49384';c.fillRect(70+(seed+i*137)%820,i%2?477-age*10:65-age*10,1,1);}}c.restore();
}
export function drawRoyalHallDetails(c,s,r,reduced=false){if(s.floor===6||s.floor===7)details(c,s,r,reduced);}
export function drawInfernalHallDetails(c,s,r,reduced=false){if(s.floor===8||s.floor===9)details(c,s,r,reduced);}
