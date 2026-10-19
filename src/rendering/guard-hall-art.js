import {environmentMaterial,environmentSurface} from './environment-material.js';
// Floor 2 presentation only. Approved originals and saved room geometry stay untouched.
let frames=[],epoch=0,pending;
const floors=new Map();
export const guardHallLoaded=()=>frames.length===12;
export const guardHallVersion=()=>epoch;
export function loadGuardHallArt(){
 if(pending)return pending;
 pending=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new Image();image.onload=()=>{try{
  const next=[],sw=image.naturalWidth/4,sh=image.naturalHeight/3;
  for(let i=0;i<12;i++){
   const scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(image,i%4*sw,Math.floor(i/4)*sh,sw,sh,0,0,sw,sh);
   const data=c.getImageData(0,0,scan.width,scan.height).data;let left=scan.width,top=scan.height,right=-1,bottom=-1;
   for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(data[(y*scan.width+x)*4+3]>48){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top){resolve(false);return;}
   const width=right-left+1,height=bottom-top+1,target=i<4?128:Math.min(128,width/height*96),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(target));canvas.height=i<4?128:Math.max(1,Math.ceil(target*height/width));const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(scan,left,top,width,height,0,0,canvas.width,canvas.height);next.push(environmentMaterial(canvas,i>=4));
  }
  frames=next;epoch++;floors.clear();resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/guard-hall-atlas-v1.png',import.meta.url).href;
});return pending;
}
const roomSeed=(s,r)=>((s.seed||0)^Math.imul((r.x||0)+19,73856093)^Math.imul((r.y||0)+37,19349663))>>>0;
export function drawGuardProp(c,index,x,feet,width,opacity=1){
 const f=frames[index];if(!f)return false;const height=width*f.height/f.width;c.save();c.globalAlpha*=opacity;c.imageSmoothingEnabled=false;c.drawImage(f,Math.round(x-width/2),Math.round(feet-height),width,height);c.restore();return true;
}
export function drawGuardHallFloor(c,s,r){
 if(!guardHallLoaded()){loadGuardHallArt();return false;}const seed=roomSeed(s,r),key=[seed,r.type,epoch].join(':');let layer=floors.get(r);
 if(!layer||layer.key!==key){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#2c333e';cc.fillRect(0,0,960,540);
  for(let row=0;row<6;row++)for(let col=0;col<7;col++){const x=col*160-(row%2?80:0),y=row*96,h=(seed+Math.imul(row+3,7919)+Math.imul(col+7,17389))>>>0;cc.save();cc.translate(x+80,y+48);cc.rotate((h>>>5)%2*Math.PI);cc.drawImage(frames[h%3],-80,-48,160,96);cc.restore();}
  // Worn drill-hall inlay is decorative: no danger circle or raised obstacle.
  if(r.type==='boss'){cc.strokeStyle='#a6a38b35';cc.lineWidth=1;cc.strokeRect(245.5,132.5,469,290);cc.strokeStyle='#17212c70';cc.strokeRect(249.5,136.5,461,282);for(const x of [245,700])for(const y of [132,408]){cc.fillStyle='#81775840';cc.fillRect(x,y,15,2);cc.fillRect(x,y,2,15);cc.fillStyle='#b9ae8350';cc.fillRect(x+4,y+4,2,2);}}
  const shade=cc.createRadialGradient(480,270,100,480,270,540);shade.addColorStop(0,'#24303d24');shade.addColorStop(1,'#10182470');cc.fillStyle=shade;cc.fillRect(0,0,960,540);layer={key,canvas:environmentSurface(canvas)};floors.set(r,layer);while(floors.size>3)floors.delete(floors.keys().next().value);
 }
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();return true;
}
export function paintGuardHallWalls(c,walls,edges){
 if(!guardHallLoaded()){loadGuardHallArt();return false;}c.save();c.imageSmoothingEnabled=false;const covered=new Set();
 for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/80)*80;x<o.x+o.w;x+=80){const key=x+':'+y;if(covered.has(key))continue;covered.add(key);c.drawImage(frames[3],x,y,80,40);}
 for(const e of edges){const horizontal=e.side==='top'||e.side==='bottom',light=e.side==='top'||e.side==='left';c.fillStyle=light?'#9aa8b37c':'#111a27b0';if(horizontal)c.fillRect(e.start,e.axis-(light?0:3),e.end-e.start,3);else c.fillRect(e.axis-(light?0:3),e.start,3,e.end-e.start);}
 c.restore();return true;
}
export function drawGuardHallDoor(c,x,y,side,locked){
 const f=frames[5];if(!f){loadGuardHallArt();return false;}c.save();if(side){c.translate(x,y+70);c.rotate(-Math.PI/2);}else c.translate(x,y);const w=side?70:80,h=side?29:35;c.imageSmoothingEnabled=false;c.fillStyle='#111923';c.fillRect(0,0,w,h);
 if(locked)c.drawImage(f,0,0,w,h);else{const strip=Math.round(f.width*.24);c.drawImage(f,0,0,strip,f.height,0,0,w*.24,h);c.drawImage(f,f.width-strip,0,strip,f.height,w*.76,0,w*.24,h);c.drawImage(f,0,0,f.width,Math.round(f.height*.18),0,0,w,h*.18);}
 c.restore();return true;
}
function banner(c,x,top,t,reduced){
 const f=frames[8],width=15;c.save();c.imageSmoothingEnabled=false;
 for(let i=0;i<9;i++){const sy=Math.floor(i*f.height/9),end=Math.floor((i+1)*f.height/9),shift=reduced?0:Math.round(Math.sin(t*2.1+i*.42+x*.03)*i/8);c.drawImage(f,0,sy,f.width,end-sy,Math.round(x-width/2)+shift,top+i*3,width,3);}
 drawGuardProp(c,9,x,top+1,25);c.restore();
}
export function drawGuardHallDetails(c,s,r,reduced=false){
 if(s.floor!==1)return;if(!guardHallLoaded()){loadGuardHallArt();return;}const seed=roomSeed(s,r),t=reduced?0:s.elapsed;c.save();
 // Wall-mounted dressings remain wholly inside the existing upper wall, away from offset doors.
 for(const x of [160,800])banner(c,x,12,t,reduced);
 for(const x of [125,835])drawGuardProp(c,10,x,35,17);
 drawGuardProp(c,6,seed%2?190:770,41,Math.min(43,32*frames[6].width/frames[6].height));drawGuardProp(c,7,seed%2?770:190,42,Math.min(31,30*frames[7].width/frames[7].height));
 for(const x of [13,947])for(const feet of [160,400])drawGuardProp(c,4,x,feet,22);
 if(r.type==='boss')for(const x of [225,735])drawGuardProp(c,10,x,35,20);
 if(!reduced){c.beginPath();c.rect(26,45,908,455);c.clip();for(let i=0;i<8;i++){const phase=(t*.12+i*.127+seed%113/113)%1;c.globalAlpha=Math.sin(phase*Math.PI)*.1;c.fillStyle='#c4c5b5';c.fillRect(65+(seed+i*137)%830,90+i%2*340-phase*14,1,1);}}
 c.restore();
}
