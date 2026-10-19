import {environmentMaterial,environmentSurface,environmentReferenceReady} from './environment-material.js';
// Approved floor 4 prism materials. All caches live outside run/save/game RNG state.
let frames=[],epoch=0,pending;
const floors=new Map();
// The gate and balustrade span nominal gutters: isolate each actual source region.
// Source pixels remain untouched; only the runtime drawing cache is trimmed.
const regions=[
 [0,0,.25,1/3],[.25,0,.25,1/3],[.5,0,.25,1/3],[.75,0,.25,1/3],
 [0,1/3,.235,1/3],[.235,1/3,.24,1/3],[.49,1/3,.195,1/3],[.695,1/3,.3,1/3],
 [0,2/3,.27,1/3],[.3,2/3,.18,1/3],[.56,2/3,.14,1/3],[.75,2/3,.25,1/3]
];
export const prismHallLoaded=()=>frames.length===12;
export const prismHallVersion=()=>epoch;
export function loadPrismHallArt(){
 if(pending)return pending;
 pending=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
  const image=new Image();image.onload=async()=>{try{await environmentReferenceReady;
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
  }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/prism-hall-atlas-v1.png',import.meta.url).href;
 });return pending;
}
const roomSeed=(s,r)=>((s.seed||0)^Math.imul((r.x||0)+31,73856093)^Math.imul((r.y||0)+43,19349663))>>>0;
export function drawPrismHallProp(c,index,x,feet,width){
 const f=frames[index];if(!f)return false;const height=width*f.height/f.width;c.save();c.imageSmoothingEnabled=false;c.drawImage(f,Math.round(x-width/2),Math.round(feet-height),width,height);c.restore();return true;
}
export function drawPrismHallFloor(c,s,r){
 if(!prismHallLoaded()){loadPrismHallArt();return false;}const seed=roomSeed(s,r),key=[seed,r.type,epoch].join(':');let layer=floors.get(r);
 if(!layer||layer.key!==key){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#303b4a';cc.fillRect(0,0,960,540);
  for(let row=0;row<6;row++)for(let col=0;col<8;col++){const x=col*144-(row%2?72:0),y=row*96,h=(seed+Math.imul(row+5,7919)+Math.imul(col+11,17389))>>>0;cc.save();cc.translate(x+72,y+48);cc.rotate((h>>>5)%2*Math.PI);cc.drawImage(frames[h%3],-72,-48,144,96);cc.restore();}
  // Quiet stone inlay only: no laser-like line or gameplay warning.
  if(r.type==='boss'){cc.strokeStyle='#b0b6c021';cc.lineWidth=1;for(const radius of [125,180]){cc.beginPath();cc.moveTo(480,270-radius*.62);cc.lineTo(480+radius,270);cc.lineTo(480,270+radius*.62);cc.lineTo(480-radius,270);cc.closePath();cc.stroke();}}  const shade=cc.createRadialGradient(480,270,100,480,270,540);shade.addColorStop(0,'#24334924');shade.addColorStop(1,'#111a2b70');cc.fillStyle=shade;cc.fillRect(0,0,960,540);layer={key,canvas:environmentSurface(canvas)};floors.set(r,layer);while(floors.size>3)floors.delete(floors.keys().next().value);
 }
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();return true;
}
export function paintPrismHallWalls(c,walls,edges){
 if(!prismHallLoaded()){loadPrismHallArt();return false;}c.save();c.imageSmoothingEnabled=false;const covered=new Set();
 for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/80)*80;x<o.x+o.w;x+=80){const key=x+':'+y;if(covered.has(key))continue;covered.add(key);c.drawImage(frames[3],x,y,80,40);}
 for(const e of edges){const horizontal=e.side==='top'||e.side==='bottom',light=e.side==='top'||e.side==='left';c.fillStyle=light?'#7d8d9838':'#26324448';if(horizontal)c.fillRect(e.start,e.axis-(light?0:3),e.end-e.start,3);else c.fillRect(e.axis-(light?0:3),e.start,3,e.end-e.start);}
 c.restore();return true;
}
export function drawPrismHallDoor(c,x,y,side,locked){
 const f=frames[5];if(!f){loadPrismHallArt();return false;}c.save();if(side){c.translate(x,y+70);c.rotate(-Math.PI/2);}else c.translate(x,y);const w=side?70:80,h=side?29:35;c.imageSmoothingEnabled=false;c.fillStyle='#141e2a';c.fillRect(0,0,w,h);
 if(locked)c.drawImage(f,0,0,w,h);else{const strip=Math.round(f.width*.24);c.drawImage(f,0,0,strip,f.height,0,0,w*.24,h);c.drawImage(f,f.width-strip,0,strip,f.height,w*.76,0,w*.24,h);c.drawImage(f,0,0,f.width,Math.round(f.height*.18),0,0,w,h*.18);}
 c.restore();return true;
}
export const isPrismHallObstacle=o=>['bookshelf','table','rock','bones'].includes(o.type);
export function drawPrismHallObstacle(c,o){
 if(!isPrismHallObstacle(o))return false;if(!prismHallLoaded()){loadPrismHallArt();return false;}
 const f=frames[o.type==='bookshelf'?6:o.type==='table'?7:o.type==='bones'?8:11];c.save();c.fillStyle='#0005';c.fillRect(o.x-2,o.y+5,o.w+4,o.h);c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.fillStyle='#202a37';c.fillRect(o.x,o.y,o.w,o.h);c.imageSmoothingEnabled=false;c.drawImage(f,o.x,o.y,o.w,o.h);c.restore();return true;
}
function glimmer(c,x,y,t,phase,reduced){
 if(reduced)return;const strength=Math.pow(Math.max(0,Math.sin(t*.85+phase)),8)*.28;
 c.save();c.globalAlpha*=strength;c.fillStyle='#b9dbed';c.fillRect(Math.round(x),Math.round(y),2,2);c.restore();
}
export function drawPrismHallDetails(c,s,r,reduced=false){
 if(s.floor!==3)return;if(!prismHallLoaded()){loadPrismHallArt();return;}const seed=roomSeed(s,r),t=reduced?0:s.elapsed;c.save();
 // All new static dressings stay within the pre-existing wall strips.
 for(const x of [125,835])drawPrismHallProp(c,9,x,35,Math.min(22,29*frames[9].width/frames[9].height));
 for(const [x,index] of [[190,6],[770,8]])drawPrismHallProp(c,index,x,42,Math.min(42,30*frames[index].width/frames[index].height));
 for(const x of [13,947])for(const feet of [160,400])drawPrismHallProp(c,4,x,feet,22);
 for(const [i,x] of [125,190,770,835].entries())glimmer(c,x,23,t,i*1.7+seed%17,reduced);
 // At most two glints, inside existing obstacle bounds. No state or RNG writes.
 let count=0;for(const o of r.obstacles||[])if(isPrismHallObstacle(o)&&count++<2){c.save();c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();glimmer(c,o.x+o.w*.5,o.y+o.h*.35,t,o.x*.02,reduced);c.restore();}
 c.restore();
}
export function drawPrismHallLamp(c,x,y,t,reduced=false){
 if(!prismHallLoaded())return false;c.save();drawPrismHallProp(c,10,x,y+17,Math.min(16,32*frames[10].width/frames[10].height));
 // Small cool light and separate moving glint; no painted fire or radial hazard.
 const pulse=reduced?1:.9+.1*Math.sin(t*1.1+x*.03),light=c.createRadialGradient(x,y,1,x,y,25);light.addColorStop(0,'#86b9e91c');light.addColorStop(1,'#86b9e900');c.globalAlpha*=pulse;c.fillStyle=light;c.fillRect(x-25,y-25,50,50);glimmer(c,x,y,t,x*.03,reduced);c.restore();return true;
}
