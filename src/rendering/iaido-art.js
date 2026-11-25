import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
const hero=[],fx=[],recoveries=new WeakMap();
function load(family,index){return typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{const expected=family==='hero'?[144,128]:[96,96];if(image.naturalWidth!==expected[0]||image.naturalHeight!==expected[1]){resolve(false);return;}(family==='hero'?hero:fx)[index]=image;resolve(true);};image.onerror=()=>resolve(false);image.src=new URL(`../../assets/images/iaido-${family}-${index}.png`,import.meta.url).href;
});}
export const iaidoArtReady=Promise.all(['hero','fx'].flatMap(family=>Array.from({length:6},(_,i)=>load(family,i))));
export const iaidoArtState=()=>({hero:hero.filter(Boolean).length,effects:fx.filter(Boolean).length});
export function resetIaido(run){if(run)recoveries.delete(run);}
function pose(c,p,q,index){
 const image=hero[index];if(!image)return false;
 const scale=characterSizes.hero/80;
 c.save();c.translate(Math.round(p.x),Math.round(p.y+20));if(q.x<0)c.scale(-1,1);c.rotate(Math.max(-.3,Math.min(.3,q.y*.25)));c.imageSmoothingEnabled=false;c.drawImage(image,-64*scale,-112*scale,144*scale,128*scale);c.restore();return true;
}
export function drawIaidoHero(c,s){
 const room=s.floors?.[s.floor]?.[s.room],q=s.roll;
 if(q?.kind==='slash'){
  const progress=Math.min(1,q.elapsed/q.duration),index=progress<.15?1:progress<.55?2:3;
  if(!hero[index])return false;
  if(room)recoveries.set(s,{room,ends:(s.elapsed||0)+q.duration-q.elapsed,x:q.x,y:q.y});
  return pose(c,s.player,q,index);
 }
 const old=recoveries.get(s);if(!old||old.room!==room||s.player.hp<=0||q){resetIaido(s);return false;}
 const age=(s.elapsed||0)-old.ends;if(age<0||age>.14){if(age>.14)resetIaido(s);return false;}
 return pose(c,s.player,old,age<.06?4:5);
}
function effect(c,index,x,y,w,h,alpha=1){
 const image=fx[index];if(!image)return false;c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;c.drawImage(image,x-w/2,y-h/2,w,h);c.restore();return true;
}
export function drawIaidoEffect(c,f,{reduced=false}={}){
 if(!f.iaido)return false;const age=Math.max(0,f.duration-f.t),fade=Math.max(0,f.t/f.duration),scale=characterSizes.hero/64;
 c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);
 if(f.iaidoKind==='hit'){
  if(!effect(c,4,0,-10,reduced?28:100*scale,reduced?28:100*scale,fade*(reduced?.45:1))){c.strokeStyle='#f5dda0';c.globalAlpha*=fade;c.beginPath();c.moveTo(-10,0);c.lineTo(10,-10);c.stroke();}
 }else{
  const cut=f.cutIndex%2?3:2;
  const ok=effect(c,cut,14,-18,(reduced?102:160)*scale,(reduced?86:136)*scale,fade*(reduced?.45:1));
  if(!reduced){effect(c,cut===2?3:2,2,-16,125*scale,106*scale,fade*.28);effect(c,5,22+age*60,-16,142*scale,116*scale,fade*.8);effect(c,1,-24,-4,180*scale,36*scale,fade*.65);}
  if(!ok){c.strokeStyle='#efd4a0';c.globalAlpha*=fade;c.lineWidth=3;c.beginPath();c.moveTo(-26,16);c.lineTo(38,-24);c.stroke();}
 }
 c.restore();return true;
}
