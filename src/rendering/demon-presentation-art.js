import {cleanDetachedCrop} from './sprite-crop.js';
const poses=new Map(),keys=['arrival','awaken','light','heavy','death','rest'];
export const demonPresentationArtState=()=>({ready:poses.size===6,keys:[...poses.keys()]});
export const demonPresentationArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new Image();image.onload=()=>{try{
  if(image.naturalWidth!==1536||image.naturalHeight!==1024){resolve(false);return;}
  keys.forEach((key,i)=>{
   const canvas=document.createElement('canvas');canvas.width=180;canvas.height=180;
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   c.drawImage(image,i%3*512,Math.floor(i/3)*512,512,512,0,0,180,180);cleanDetachedCrop(canvas);poses.set(key,canvas);
  });resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/demon-presentation-body-v1.png',import.meta.url).href;
});
export const hasDemonPresentationPose=pose=>poses.has(pose);
// Local coordinates match the existing 180px torso, shoulder and wall anchors.
export function drawDemonPresentationBody(c,pose){
 const image=poses.get(pose);if(!image)return false;
 c.drawImage(image,-90,-140);return true;
}
