const SIZE={1:3,3:6,9:10},COLOR={1:'#c4edff',3:'#79d7fb',9:'#b7a1ed'};
const frames=[];let loaded=false;
export const xpShardsReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new Image();im.onload=()=>{try{
  const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0);const data=c.getImageData(0,0,im.width,im.height).data;
  for(let i=0;i<3;i++){const left=Math.round(i*im.width/3),right=Math.round((i+1)*im.width/3);let x0=right,y0=im.height,x1=left,y1=0;
   for(let y=0;y<im.height;y++)for(let x=left;x<right;x++)if(data[(y*im.width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   if(x1<=x0||y1<=y0)throw Error('Empty XP sprite');frames.push({image:im,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
  }loaded=true;resolve(true);
 }catch{frames.length=0;resolve(false);}};im.onerror=()=>resolve(false);im.src=new URL('../../assets/images/xp-shards-atlas-v1.png',import.meta.url).href;
});
export function xpShardsState(){return {ready:loaded,frames:frames.length};}
function shard(c,tier,x,y){
 const w=SIZE[tier],f=frames[tier===1?0:tier===3?1:2];
 if(loaded&&f){const h=Math.max(2,Math.round(w*f.h/f.w));c.drawImage(f.image,f.x,f.y,f.w,f.h,Math.round(x-w/2),Math.round(y-h/2),w,h);}
 else{c.fillStyle=COLOR[tier];c.fillRect(Math.round(x-w/2),Math.round(y-1),w,2);c.fillStyle='#edf3ff';c.fillRect(Math.round(x-w/3),Math.round(y-2),Math.max(1,Math.round(w/3)),1);}
}
export function drawXpDrops(c,s,r,reduced=false){
 if(!r.xpDrops?.length)return;c.save();c.imageSmoothingEnabled=false;
 for(const d of r.xpDrops){
  const age=Math.max(0,s.elapsed-d.born),q=Math.min(1,age/.18),x=d.fromX+(d.x-d.fromX)*q,y=d.fromY+(d.y-d.fromY)*q-(reduced?0:Math.sin(q*Math.PI)*7);
  if(d.attract&&!reduced){const angle=Math.atan2(s.player.y-d.y,s.player.x-d.x);c.fillStyle=COLOR[d.tier];c.globalAlpha=.3;c.fillRect(Math.round(x-Math.cos(angle)*5),Math.round(y-Math.sin(angle)*5),1,1);c.globalAlpha=1;}
  shard(c,d.tier,x,y);
  if(d.value>d.tier){c.fillStyle=COLOR[d.tier];c.fillRect(Math.round(x+SIZE[d.tier]/2+1),Math.round(y),1,2);if(Math.hypot(s.player.x-d.x,s.player.y-d.y)<110){c.font='9px Galmuri, monospace';c.textAlign='center';c.fillText('×'+(d.value/d.tier),x,y-9);}}
 }
 c.restore();
}
export function drawXpPickup(c,f,reduced=false){
 if(!f.xpPickup)return false;c.save();c.globalAlpha*=Math.min(1,f.t/.16);c.fillStyle='#c9e8ff';c.fillRect(Math.round(f.x-2),Math.round(f.y),5,1);if(!reduced)c.fillRect(Math.round(f.x),Math.round(f.y-2),1,5);c.restore();return true;
}
