import {DeferredImage} from './asset-requests.js';
import {environmentMaterial,environmentReferenceReady} from './environment-material.js';
const frames=[];
export const wardenRoomArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new DeferredImage();im.onload=async()=>{try{
  await environmentReferenceReady;
  for(let i=0;i<4;i++){
   const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   g.drawImage(im,i%2*im.naturalWidth/2,Math.floor(i/2)*im.naturalHeight/2,im.naturalWidth/2,im.naturalHeight/2,0,0,96,96);
   frames.push(i?environmentMaterial(c,true):c);
  }resolve(true);
 }catch{resolve(false);}};im.onerror=()=>resolve(false);im.src=new URL('../../assets/images/warden-room-props-v1.png',import.meta.url).href;
});
export function drawWardenRoom(c,s,r){
 if(s.floor!==1||r.type!=='boss'||frames.length!==4)return;
 c.save();c.beginPath();c.rect(27,46,906,452);c.clip();c.imageSmoothingEnabled=false;
 // These are flat dressings, never additional collision blocks or danger fields.
 const props=[[0,125,125,95],[0,820,135,88],[0,165,390,108],[0,795,405,94],[0,335,105,68],[1,105,240,54],[1,850,340,58],[2,145,150,48],[2,830,395,44],[2,265,440,35],[3,160,420,56],[3,790,115,47]];
 for(const [i,x,y,size] of props){c.globalAlpha=i===0?.58:.85;c.drawImage(frames[i],Math.round(x-size/2),Math.round(y-size/2),size,size);}
 c.restore();
}
