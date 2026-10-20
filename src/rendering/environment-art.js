import {DeferredImage} from './asset-requests.js';
import {environmentMaterial,environmentSurface,environmentReferenceReady} from './environment-material.js';
// Approved environment atlas. Originals stay untouched; only draw-time crops are cached.
let frames=[],epoch=0;
const floorLayers=new Map();
export const environmentArtLoaded=()=>frames.length===16;
export const environmentArtVersion=()=>epoch;
export const environmentArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=async()=>{try{await environmentReferenceReady;
  const next=[],sw=image.naturalWidth/4,sh=image.naturalHeight/4;
  for(let i=0;i<16;i++){
   const scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(image,i%4*sw,Math.floor(i/4)*sh,sw,sh,0,0,sw,sh);
   const d=c.getImageData(0,0,scan.width,scan.height).data;let left=scan.width,top=scan.height,right=-1,bottom=-1;
   for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(d[(y*scan.width+x)*4+3]>48){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top){resolve(false);return;}
   const width=right-left+1,height=bottom-top+1,target=i<3?128:Math.min(128,width/height*96),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(target));canvas.height=i<3?128:Math.max(1,Math.ceil(target*height/width));const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(scan,left,top,width,height,0,0,canvas.width,canvas.height);next.push(environmentMaterial(canvas,i>=3,i===2));
  }
  frames=next;epoch++;floorLayers.clear();resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/environment-hall-atlas-v1.png',import.meta.url).href;
});
export function drawEnvironmentProp(c,index,x,feet,width,opacity=1){
 const f=frames[index];if(!f)return false;const height=width*f.height/f.width;c.save();c.globalAlpha*=opacity;c.imageSmoothingEnabled=false;c.drawImage(f,Math.round(x-width/2),Math.round(feet-height),width,height);c.restore();return true;
}
// Baked into the floor cache, never animated or written into the saved room.
function tileWear(c,seed,row,col){
 let h=Math.imul(seed^Math.imul(row+23,19349663)^Math.imul(col+41,73856093),1274126177);h=(h^(h>>>16))>>>0;
 if(h%100>=43)return;
 c.save();c.translate(20+(h>>>7)%70,20+(h>>>15)%70);c.rotate((h>>>24)%4*Math.PI/2);
 if(h%100<32){
  const length=12+(h>>>4)%17,branch=(h>>>21)%2;
  // Stepped one-pixel fissures, with a faint worn lip instead of a bright outline.
  for(const [color,offset] of [['#101b1a80',0],['#b4b09a28',1]]){
   c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(.5,offset+.5);c.lineTo(5.5,offset+2.5);c.lineTo(8.5,offset+7.5);c.lineTo(14.5,offset+5.5);c.lineTo(length+.5,offset+11.5);
   if(branch){c.moveTo(8.5,offset+7.5);c.lineTo(5.5,offset+12.5);c.lineTo(7.5,offset+16.5);}c.stroke();
  }
 }else{
  const width=5+(h>>>11)%6,depth=3+(h>>>19)%5;
  c.fillStyle='#15211d99';c.beginPath();c.moveTo(-width,0);c.lineTo(-2,-depth);c.lineTo(width,-1);c.lineTo(width-3,depth);c.lineTo(-width+2,depth+2);c.closePath();c.fill();
  c.strokeStyle='#afa78c45';c.lineWidth=1;c.beginPath();c.moveTo(-width+.5,.5);c.lineTo(-1.5,-depth+.5);c.lineTo(width-.5,-.5);c.stroke();
  c.fillStyle='#787b6459';c.fillRect(width+2,depth+3,3,2);c.fillStyle='#373f3259';c.fillRect(width-3,depth+6,2,1);
 }
 c.restore();
}
export function drawHallFloor(c,s,r){
 if(!environmentArtLoaded())return false;const key=[s.seed||0,r.x||0,r.y||0,epoch].join(':');let layer=floorLayers.get(r);
 if(!layer||layer.key!==key){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const cc=canvas.getContext('2d');cc.fillStyle='#29312d';cc.fillRect(0,0,960,540);cc.imageSmoothingEnabled=false;
  const seed=((s.seed||0)^Math.imul((r.x||0)+13,73856093)^Math.imul((r.y||0)+29,19349663))>>>0;
  for(let row=0;row<5;row++)for(let col=0;col<9;col++){const x=col*112-(row%2?56:0),y=row*112,h=(seed+col*37+row*61)>>>0;cc.save();cc.translate(x+56,y+56);cc.rotate((h%4)*Math.PI/2);cc.drawImage(frames[h%2],-56,-56,112,112);cc.restore();cc.save();cc.translate(x,y);tileWear(cc,seed,row,col);cc.restore();}
  // A quiet center keeps bullets and telegraphs above the material texture.
  const shade=cc.createRadialGradient(480,270,85,480,270,540);shade.addColorStop(0,'#26302b30');shade.addColorStop(1,'#0c131a70');cc.fillStyle=shade;cc.fillRect(0,0,960,540);layer={key,canvas:environmentSurface(canvas)};floorLayers.set(r,layer);while(floorLayers.size>3)floorLayers.delete(floorLayers.keys().next().value);
 }
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();return true;
}
export function paintHallWalls(c,walls,edges){
 if(!environmentArtLoaded())return false;c.save();c.imageSmoothingEnabled=false;
 const covered=new Set();for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/80)*80;x<o.x+o.w;x+=80){const key=x+':'+y;if(covered.has(key))continue;covered.add(key);c.drawImage(frames[2],x,y,80,40);}
 for(const e of edges){const horizontal=e.side==='top'||e.side==='bottom',light=e.side==='top'||e.side==='left';c.fillStyle=light?'#827d6738':'#29322d48';if(horizontal)c.fillRect(e.start,e.axis-(e.side==='bottom'?3:0),e.end-e.start,3);else c.fillRect(e.axis-(e.side==='right'?3:0),e.start,3,e.end-e.start);c.fillStyle=light?'#b3aa8c18':'#263b2b88';if(horizontal)c.fillRect(e.start+2,e.axis+(light?3:-5),Math.max(0,e.end-e.start-4),1);}
 c.restore();return true;
}
export function drawHallDoor(c,x,y,side,locked){
 const f=frames[14];if(!f)return false;c.save();if(side){c.translate(x,y+70);c.rotate(-Math.PI/2);}else c.translate(x,y);const w=side?70:80,h=side?29:40;c.imageSmoothingEnabled=false;c.fillStyle='#111916';c.fillRect(0,0,w,h);
 if(locked)c.drawImage(f,0,0,w,h);
 else{const strip=Math.round(f.width*.26);c.drawImage(f,0,0,strip,f.height,0,0,w*.26,h);c.drawImage(f,f.width-strip,0,strip,f.height,w*.74,0,w*.26,h);c.drawImage(f,0,0,f.width,Math.round(f.height*.2),0,0,w,h*.2);}
 c.restore();return true;
}
