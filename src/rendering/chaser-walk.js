import {characterSizes} from './character-sizes.js';
const sources=[
 {x:69,y:36,w:534,h:596,anchorX:275,feet:625},
 {x:707,y:36,w:520,h:596,anchorX:910,feet:625},
 {x:69,y:652,w:534,h:579,anchorX:275,feet:1224},
 {x:706,y:652,w:525,h:581,anchorX:910,feet:1226}
];
const frames=[];
export const chaserWalkState=()=>({ready:frames.length===4,frames:frames.length});
export const chaserWalkReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  frames.push(...sources.map(f=>{const scale=characterSizes.grunt/(f.feet-f.y),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:21-(f.feet-f.y)*scale};}));resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/chaser-walk-atlas.png',import.meta.url).href;
});
export function drawChaserWalk(c,p){
 if(frames.length!==4||!p.moving)return false;
 // Walk phase follows actual travelled distance (p.walk), including slowed movement.
 const index=((Math.floor((p.walk||0)*2/Math.PI)%4)+4)%4,f=frames[index];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
