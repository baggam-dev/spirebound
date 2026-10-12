const sourceFrames=[
 {x:28,y:126,w:911,h:756,anchorX:580,feet:873},
 {x:979,y:0,w:791,h:884,anchorX:1370,feet:875}
];
const bodyHeight=108,scale=bodyHeight/744,frames=[];
export const wardenSpriteState=()=>({ready:frames.length===2,frames:frames.length,bodyHeight});
export const wardenHealthOffset=()=>frames.length?bodyHeight-29+12:52;
export const wardenLabelOffset=()=>frames.length?bodyHeight-29+20:57;
export const wardenSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  frames.push(...sourceFrames.map(f=>{const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale};}));resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/warden-horns-blood-atlas.png',import.meta.url).href;
});
export function drawWardenSprite(c,e,p,attack,red=false){
 if(frames.length!==2||e.type!=='boss'||e.variant&&e.variant!=='warden')return false;
 const face=Number.isFinite(e.patternAim)&&['windup','strike','air'].includes(attack.stage)?(Math.cos(e.patternAim)<0?-1:1):p.face||1;
 const f=frames[['windup','air'].includes(attack.stage)?1:0];c.save();c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(red){c.strokeStyle='#ee8791';c.lineWidth=2;c.beginPath();c.moveTo(-22,20);c.lineTo(-27,13);c.moveTo(22,20);c.lineTo(27,13);c.stroke();}c.restore();return true;
}
