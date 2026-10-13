import {characterSizes} from './character-sizes.js';
let frame;
export const chaserSlashReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1433||atlas.naturalHeight!==1098){resolve(false);return;}
  const scale=characterSizes.grunt/938,canvas=document.createElement('canvas');canvas.width=Math.ceil(1433*scale);canvas.height=Math.ceil(1098*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,0,0,canvas.width,canvas.height);frame={canvas,x:-750*scale,y:21-1020*scale};resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/chaser-slash-atlas.png',import.meta.url).href;
});
export function drawChaserSlash(c,e){if(!frame||!(e.chaserStrike>0))return false;c.drawImage(frame.canvas,Math.round(frame.x),Math.round(frame.y));return true;}
