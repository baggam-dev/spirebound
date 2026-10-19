import {iconSVG} from './pixel-icons.js';
export const relicIconIds=['windSeal','lens','boots','iron','ember','rain','fang','ruby','quiver','feather','hourglass','crown','comet','moon','heart','chalice','bastion','blade','orbit','coal','sun','prism','hunter','execution','magnet','halo','openingWhetstone','thornBuckle','ritualKnot','fairyWhistle','phoenixReliquary','sunFairy','snowFairy','stormFairy','afterimage','orbitBlades','voidBell'];
const ready=new Set(),style=typeof document==='undefined'?null:document.createElement('style');if(style)document.head.append(style);
export const relicIconsReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new Image();im.onload=()=>{try{
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  // Generated sheets can have uneven vertical padding; split at the nearest empty scanline.
  const occupancy=Array.from({length:c.height},(_,y)=>{let n=0;for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>64)n++;return n;});
  const rows=[0];for(let i=1;i<6;i++){const target=i*c.height/6,margin=c.height/24;let best=Math.round(target);for(let y=Math.ceil(target-margin);y<=Math.floor(target+margin);y++)if(occupancy[y]<occupancy[best]||occupancy[y]===occupancy[best]&&Math.abs(y-target)<Math.abs(best-target))best=y;rows.push(best);}rows.push(c.height);
  for(let i=0;i<relicIconIds.length;i++){
   const left=Math.round(i%7*c.width/7),right=Math.round((i%7+1)*c.width/7),top=rows[Math.floor(i/7)],bottom=rows[Math.floor(i/7)+1];let x0=right,x1=left-1,y0=bottom,y1=top-1;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*c.width+x)*4+3]>64){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   if(x1<x0||y1<y0)continue;const w=x1-x0+1,h=y1-y0+1,scale=56/Math.max(w,h),tile=document.createElement('canvas');tile.width=tile.height=64;const t=tile.getContext('2d');t.imageSmoothingEnabled=false;t.drawImage(im,x0,y0,w,h,Math.round((64-w*scale)/2),Math.round((64-h*scale)/2),Math.round(w*scale),Math.round(h*scale));
   const id=relicIconIds[i];style.sheet.insertRule('.relic-art[data-relic-icon="'+id+'"]{background-image:url("'+tile.toDataURL()+'")}');style.sheet.insertRule('.relic-art[data-relic-icon="'+id+'"]>.pixel-icon{visibility:hidden}');ready.add(id);
  }resolve(ready.size===relicIconIds.length);
 }catch{resolve(false);}};im.onerror=()=>resolve(false);im.src=new URL('../../assets/images/relic-icons-atlas-v1.png',import.meta.url).href;
});
export const relicIconsState=()=>({ready:ready.size===relicIconIds.length,frames:ready.size,ids:[...ready]});
const fallback={openingWhetstone:'power',thornBuckle:'bastion',ritualKnot:'windSeal',fairyWhistle:'sunFairy',phoenixReliquary:'heart'};
export function relicIconMarkup(id){return relicIconIds.includes(id)?'<span class="pixel-icon relic-art" data-relic-icon="'+id+'" aria-hidden="true">'+iconSVG(fallback[id]||id)+'</span>':iconSVG(id);}
