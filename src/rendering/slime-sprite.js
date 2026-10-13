const frames=[];
export const slimeSpriteState=()=>({ready:frames.length===4});
export const slimeSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  for(const [index,width] of [76,56,40,22].entries()){
   const f=index===3?{x:1340,y:500,w:434,h:360,anchorX:1550,feet:842}:{x:10,y:10,w:1330,h:850,anchorX:680,feet:842};
   const scale=width/f.w,canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.anchorX)*scale,y:-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/slime-reference-atlas.png',import.meta.url).href;
});
export function drawSlimeSprite(c,e,time,attack){
 if(frames.length!==4||e.variant!=='slime'&&e.type!=='minislime')return false;
 const f=frames[e.type==='minislime'?3:Math.max(0,Math.min(2,e.stage||0))],pulse=e.frozen>0?0:Math.sin(time*Math.PI*2/1.8+(e.id||0)*1.71);
 c.save();c.scale(e.scale??1,e.scale??1);c.translate(0,21);c.scale(1+pulse*.025+(attack.charge||0)*.035,1-pulse*.04-(attack.charge||0)*.06);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,f.x,f.y);
 if(e.escapeDepth){c.strokeStyle='#df8995';c.lineWidth=1.5;c.beginPath();c.moveTo(-12,-9);c.lineTo(-17,-13);c.moveTo(12,-9);c.lineTo(17,-13);c.stroke();}c.restore();return true;
}
