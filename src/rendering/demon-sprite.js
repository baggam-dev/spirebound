// Display-only frames. Combat owners, attack timing and collision stay in combat/demon.js.
const frames=new Map(),motion=new WeakMap();
const specs={hand:{width:110,height:84},foot:{width:100,height:84},eye:{width:120,height:76},nose:{width:110,height:72},mouth:{width:120,height:76},core:{width:230,height:155}};
export const demonSpriteState=()=>({ready:frames.size===6,parts:[...frames.keys()]});
export const demonHealthOffset=e=>e.part==='core'?132:72;
function bake(atlas,x,y,w,h,maxWidth,maxHeight){
 const probe=document.createElement('canvas');probe.width=w;probe.height=h;const p=probe.getContext('2d');p.drawImage(atlas,x,y,w,h,0,0,w,h);
 const data=p.getImageData(0,0,w,h).data;let left=w,top=h,right=-1,bottom=-1;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[(yy*w+xx)*4+3]>8){left=Math.min(left,xx);top=Math.min(top,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);}
 if(right<left)throw Error('Empty demon frame');
 left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(w-1,right+2);bottom=Math.min(h-1,bottom+2);
 const bw=right-left+1,bh=bottom-top+1,scale=Math.min(maxWidth/bw,maxHeight/bh),canvas=document.createElement('canvas');canvas.width=Math.ceil(bw*scale);canvas.height=Math.ceil(bh*scale);
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(probe,left,top,bw,bh,0,0,canvas.width,canvas.height);return canvas;
}
function load(part){return new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  const {width,height}=specs[part],w=atlas.naturalWidth,h=atlas.naturalHeight;
  if(part==='core'){
   if(w!==1254||h!==1254)throw Error('Unexpected core atlas');
   frames.set(part,{poses:[bake(atlas,0,0,w,Math.round(h*.76),width,height)],full:bake(atlas,0,0,w,h,240,238)});
  }else{
   if(w!==1774||h!==887)throw Error('Unexpected part atlas');
   frames.set(part,{poses:[0,1].map(i=>bake(atlas,i*887,0,887,h,width,height))});
  }resolve(true);
 }catch{frames.delete(part);resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL(`../../assets/images/demon-${part}-reference-atlas.png`,import.meta.url).href;
});}
export const demonSpriteReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(Object.keys(specs).map(load)).then(results=>results.every(Boolean));
export function drawDemonSprite(c,e,time=0,{attack=null,staticPose=false,wall=false}={}){
 if(e.variant!=='demon'||!frames.has(e.part))return false;
 const part=e.part,entry=frames.get(part),active=!staticPose&&!!attack;
 let face=1;
 if(!staticPose&&part!=='core'){
  let p=motion.get(e);if(!p){p={x:e.x,face:1};motion.set(e,p);}const dx=e.x-p.x;if(Math.abs(dx)>.1)p.face=Math.sign(dx);p.x=e.x;
  face=active&&Number.isFinite(attack.aim)?(Math.cos(attack.aim)<0?-1:1):p.face;
 }
 const frame=part==='core'&&staticPose?entry.full:entry.poses[active&&entry.poses.length>1?1:0],feet=part==='core'?36:24;
 const bob=staticPose||e.frozen>0?0:Math.round(Math.sin(time*4)*1.5);
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;
 c.drawImage(frame,-Math.round(frame.width/2),feet-frame.height+bob);
 // Separate stone sill hides the upper-body crop only during the third phase.
 if(part==='core'&&wall&&!staticPose){c.fillStyle='#252a2b';c.fillRect(-127,35,254,12);for(let i=0;i<8;i++){c.fillStyle=i%2?'#4e5151':'#48504c';c.fillRect(-123+i*32,35,27,4);}}
 c.restore();return true;
}
