import {characterSizes} from './character-sizes.js';
const sources=[
 {x:69,y:36,w:534,h:596,anchorX:275,feet:625},
 {x:707,y:36,w:520,h:596,anchorX:910,feet:625},
 {x:69,y:652,w:534,h:579,anchorX:275,feet:1224},
 {x:706,y:652,w:525,h:581,anchorX:910,feet:1226}
];
const frames=[];
const layered=[];
// Approved v5 lower-body cells; waist and grounded foot are aligned separately.
const legs=[
 {x:75,y:103,w:607,h:493,waistX:355,feet:589},
 {x:712,y:104,w:482,h:497,waistX:958,feet:595},
 {x:69,y:705,w:625,h:459,waistX:355,feet:1157},
 {x:767,y:705,w:473,h:468,waistX:958,feet:1167}
];
const loadAtlas=file=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth===1254&&img.naturalHeight===1254?img:null);img.onerror=()=>resolve(null);img.src=new URL('../../assets/images/'+file,import.meta.url).href;});
export const chaserWalkState=()=>({ready:frames.length===4||layered.length===4,frames:layered.length||frames.length,layered:layered.length===4});
const originalReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  frames.push(...sources.map(f=>{const scale=characterSizes.grunt/(f.feet-f.y),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:21-(f.feet-f.y)*scale};}));resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/chaser-walk-atlas.png',import.meta.url).href;
});
// Keep the original complete walk as a fallback if the new lower-body atlas fails.
const layeredReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all([
 loadAtlas('chaser-walk-atlas.png'),loadAtlas('chaser-walk-legs-atlas.png')
]).then(([upper,lower])=>{
 if(!upper||!lower)return false;
 try{
  const torso=sources[0],scale=characterSizes.grunt/(torso.feet-torso.y);
  const waistY=21-(torso.feet-340)*scale;
  const next=legs.map(f=>{
   const canvas=document.createElement('canvas');canvas.width=90;canvas.height=72;
   const c=canvas.getContext('2d');c.translate(40,45);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   const legScale=(21-waistY)/(f.feet-f.y);
   c.drawImage(lower,f.x,f.y,f.w,f.h,(f.x-f.waistX)*legScale,waistY,f.w*legScale,f.h*legScale);
   // Cover the seam with the existing shirt; retain hands and the complete knife.
   c.save();c.beginPath();c.rect(-40,-45,90,21-(torso.feet-410)*scale+45);c.rect(13,2,37,18);c.rect(-19,2,10,4);c.clip();
   c.drawImage(upper,torso.x,torso.y,torso.w,torso.h,(torso.x-torso.anchorX)*scale,21-(torso.feet-torso.y)*scale,torso.w*scale,torso.h*scale);c.restore();
   return {canvas,x:-40,y:-45};
  });layered.push(...next);return true;
 }catch{return false;}
});
export const chaserWalkReady=Promise.all([originalReady,layeredReady]).then(results=>results.some(Boolean));
export function drawChaserWalk(c,p){
 const active=layered.length===4?layered:frames;
 if(active.length!==4||!p.moving)return false;
 // Walk phase follows actual travelled distance (p.walk), including slowed movement.
 const index=((Math.floor((p.walk||0)*2/Math.PI)%4)+4)%4,f=active[index];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
