// Approved shared floors 5-6 conservatory materials. All caches live outside run/save/game RNG state.
let frames=[],epoch=0,pending;
const floors=new Map();
// Source modules span nominal row/column gutters; isolate the actual bounds.
// The original PNG is preserved; only the runtime cache trims low-alpha fringes.
const regions=[
 [0,0,.25,.37],[.25,0,.25,.37],[.5,0,.25,.37],[.75,0,.25,.37],
 [0,.37,.25,.34],[.25,.37,.24,.34],[.49,.37,.24,.34],[.735,.37,.265,.34],
 [0,.71,.34,.29],[.365,.71,.19,.29],[.6,.71,.12,.29],[.81,.71,.14,.29]
];
export const infestedHallLoaded=()=>frames.length===12;
export const infestedHallVersion=()=>epoch;
export const isInfestedFloor=floor=>floor===4||floor===5;
export function loadInfestedHallArt(){
 if(pending)return pending;
 pending=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
  const image=new Image();image.onload=()=>{try{
   const next=[];
   for(let i=0;i<12;i++){
    const [rx,ry,rw,rh]=regions[i],sw=rw*image.naturalWidth,sh=rh*image.naturalHeight;
    const scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(image,rx*image.naturalWidth,ry*image.naturalHeight,sw,sh,0,0,sw,sh);
    const pixels=c.getImageData(0,0,scan.width,scan.height),data=pixels.data;let left=scan.width,top=scan.height,right=-1,bottom=-1;
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){const alpha=(y*scan.width+x)*4+3;if(data[alpha]<64){data[alpha]=0;continue;}left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    c.putImageData(pixels,0,0);
    if(right<=left||bottom<=top){resolve(false);return;}
    const width=right-left+1,height=bottom-top+1,target=i<4?128:Math.min(128,width/height*96),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(target));canvas.height=i<4?128:Math.max(1,Math.ceil(target*height/width));const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';cc.drawImage(scan,left,top,width,height,0,0,canvas.width,canvas.height);next.push(canvas);
   }
   frames=next;epoch++;floors.clear();resolve(true);
  }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/infested-hall-atlas-v1.png',import.meta.url).href;
 });return pending;
}
const roomSeed=(s,r)=>((s.seed||0)^Math.imul((r.x||0)+31,73856093)^Math.imul((r.y||0)+43,19349663))>>>0;
export function drawInfestedHallProp(c,index,x,feet,width){
 const f=frames[index];if(!f)return false;const height=width*f.height/f.width;c.save();c.imageSmoothingEnabled=false;c.drawImage(f,Math.round(x-width/2),Math.round(feet-height),width,height);c.restore();return true;
}
export function drawInfestedHallFloor(c,s,r){
 if(!infestedHallLoaded()){loadInfestedHallArt();return false;}const seed=roomSeed(s,r),key=[seed,s.floor,r.type,epoch].join(':');let layer=floors.get(r);
 if(!layer||layer.key!==key){const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#3b3e32';cc.fillRect(0,0,960,540);
  for(let row=0;row<6;row++)for(let col=0;col<8;col++){const x=col*144-(row%2?72:0),y=row*96,h=(seed+Math.imul(row+5,7919)+Math.imul(col+11,17389))>>>0;cc.save();cc.translate(x+72,y+48);cc.rotate((h>>>5)%2*Math.PI);cc.drawImage(frames[h%3],-72,-48,144,96);cc.restore();}
  const shade=cc.createRadialGradient(480,270,100,480,270,540);shade.addColorStop(0,'#343b2d24');shade.addColorStop(1,'#191e1670');cc.fillStyle=shade;cc.fillRect(0,0,960,540);layer={key,canvas};floors.set(r,layer);while(floors.size>3)floors.delete(floors.keys().next().value);
 }
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();return true;
}
export function paintInfestedHallWalls(c,walls,edges,floor=4){
 if(!infestedHallLoaded()){loadInfestedHallArt();return false;}c.save();c.imageSmoothingEnabled=false;const covered=new Set();
 for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/80)*80;x<o.x+o.w;x+=80){const key=x+':'+y;if(covered.has(key))continue;covered.add(key);c.drawImage(frames[3],x,y,80,40);}
 // Same wall material on both floors; deeper roots stay clipped to existing walls.
 if(floor===5)for(const o of walls){c.save();c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();for(let offset=26;offset<Math.max(o.w,o.h);offset+=96){const vertical=o.h>o.w;drawInfestedHallProp(c,9,vertical?o.x+o.w/2:o.x+offset,vertical?o.y+offset:o.y+o.h,vertical?Math.min(o.w,20):30);}c.restore();}
 for(const e of edges){const horizontal=e.side==='top'||e.side==='bottom',light=e.side==='top'||e.side==='left';c.fillStyle=light?'#a8a58a76':'#1c2017b0';if(horizontal)c.fillRect(e.start,e.axis-(light?0:3),e.end-e.start,3);else c.fillRect(e.axis-(light?0:3),e.start,3,e.end-e.start);}
 c.restore();return true;
}
export function drawInfestedHallDoor(c,x,y,side,locked){
 const f=frames[5];if(!f){loadInfestedHallArt();return false;}c.save();if(side){c.translate(x,y+70);c.rotate(-Math.PI/2);}else c.translate(x,y);const w=side?70:80,h=side?29:35;c.imageSmoothingEnabled=false;c.fillStyle='#1c2019';c.fillRect(0,0,w,h);
 if(locked)c.drawImage(f,0,0,w,h);else{const strip=Math.round(f.width*.24);c.drawImage(f,0,0,strip,f.height,0,0,w*.24,h);c.drawImage(f,f.width-strip,0,strip,f.height,w*.76,0,w*.24,h);c.drawImage(f,0,0,f.width,Math.round(f.height*.18),0,0,w,h*.18);}
 c.restore();return true;
}
export const isInfestedHallObstacle=o=>['bookshelf','table','rock','bones'].includes(o.type);
export function drawInfestedHallObstacle(c,o,floor=4){
 if(!isInfestedHallObstacle(o))return false;if(!infestedHallLoaded()){loadInfestedHallArt();return false;}
 const f=frames[o.type==='bookshelf'?6:o.type==='table'?7:8];c.save();c.fillStyle='#0005';c.fillRect(o.x-2,o.y+5,o.w+4,o.h);c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.fillStyle='#272b20';c.fillRect(o.x,o.y,o.w,o.h);c.imageSmoothingEnabled=false;c.drawImage(f,o.x,o.y,o.w,o.h);
 if(floor===5)drawInfestedHallProp(c,9,o.x+o.w*.6,o.y+o.h*.86,Math.min(28,o.w*.45));c.restore();return true;
}
function leaf(c,x,feet,t,reduced){
 const shift=reduced?0:Math.round(Math.sin(t*1.3+x*.03));c.save();c.beginPath();c.rect(x-6,feet-10,12,10);c.clip();drawInfestedHallProp(c,11,x+shift,feet,6);c.restore();
}
function resinGlint(c,x,y,t,phase,reduced){
 if(reduced)return;const strength=Math.pow(Math.max(0,Math.sin(t*.7+phase)),10)*.18;c.save();c.globalAlpha*=strength;c.fillStyle='#c4b48a';c.fillRect(Math.round(x),Math.round(y),2,1);c.restore();
}
export function drawInfestedHallDetails(c,s,r,reduced=false){
 if(!isInfestedFloor(s.floor))return;if(!infestedHallLoaded()){loadInfestedHallArt();return;}const deep=s.floor===5,seed=roomSeed(s,r),t=reduced?0:s.elapsed;c.save();
 // New dressings stay wholly inside the 44px top / 25px side-wall strips.
 for(const [x,index] of [[190,6],[770,8]])drawInfestedHallProp(c,index,x,42,Math.min(44,30*frames[index].width/frames[index].height));
 for(const x of [13,947])for(const feet of [160,400])drawInfestedHallProp(c,4,x,feet,22);
 for(const x of (deep?[125,160,800,835]:[125,835]))drawInfestedHallProp(c,9,x,39,Math.min(24,27*frames[9].width/frames[9].height));
 for(const x of (deep?[170,790]:[165,190,770,795]))leaf(c,x,29,t,reduced);
 if(deep)for(const x of [125,835])resinGlint(c,x,24,t,x*.03,reduced);
 let count=0;for(const o of r.obstacles||[])if(isInfestedHallObstacle(o)&&count++<2){c.save();c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();if(deep)resinGlint(c,o.x+o.w*.6,o.y+o.h*.55,t,o.x*.02,reduced);else leaf(c,o.x+o.w*.4,o.y+o.h*.25,t,reduced);c.restore();}
 // Sparse neutral edge motes, never a poison cloud or a field over the arena.
 if(!reduced){c.beginPath();c.rect(26,45,908,455);c.clip();for(let i=0;i<(deep?6:4);i++){const age=(t*.08+i*.173+seed%97/97)%1;c.globalAlpha=Math.sin(age*Math.PI)*.09;c.fillStyle='#bdb598';c.fillRect(70+(seed+i*137)%820,i%2?476-age*9:64-age*9,1,1);}}
 c.restore();
}
