import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
import {drawHeroWalkLower} from './hero-sprite.js';
import {heroCastPose} from './hero-cast-state.js';
const sheets={};
function load(kind,file){
 if(typeof Image==='undefined')return;
 const atlas=new DeferredImage();atlas.onload=()=>{
  if(atlas.naturalWidth!==1024||atlas.naturalHeight!==1536)return;
  try{
   const scale=kind==='body'?characterSizes.hero/225:(characterSizes.hero-26)/153;
   sheets[kind]=Array.from({length:24},(_,i)=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil(256*scale);
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(atlas,i%4*256,Math.floor(i/4)*256,256,256,0,0,256*scale,256*scale);
    return {canvas,x:-128*scale,y:kind==='body'?22-249*scale:-4-180*scale};
   });
  }catch{delete sheets[kind];}
 };atlas.onerror=()=>{delete sheets[kind];};atlas.src=new URL('../../assets/images/'+file,import.meta.url).href;
}
load('body','hero-utility-casts-v1.png');load('upper','hero-utility-upper-v1.png');
export const heroCastArtState=()=>({body:!!sheets.body,upper:!!sheets.upper});
export function drawHeroCast(c,player,walking,time,options={}){
 const pose=heroCastPose(player,time,options);if(!pose)return false;
 const kind=walking.moving?'upper':'body',f=sheets[kind]?.[pose.row*4+pose.frame];
 if(!f)return false;
 // The dedicated upper atlas includes cape/bow/skirt, but no baked-in legs.
 if(walking.moving&&!drawHeroWalkLower(c,walking))return false;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
