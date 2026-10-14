const frames=[],colors=new Map();
export const shadowAuraState=()=>({ready:frames.length===4});
export const shadowAuraReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1261||atlas.naturalHeight!==1247){resolve(false);return;}
  const xs=[0,630,1261],ys=[0,623,1247];
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const c=canvas.getContext('2d');c.drawImage(atlas,xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row],0,0,96,96);frames.push(canvas);
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/shadow-aura-atlas.png',import.meta.url).href;
});
function tinted(color){
 if(!/^#[0-9a-f]{6}$/i.test(color))color='#684393';
 if(colors.has(color))return colors.get(color);
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),peak=Math.max(1,...rgb);
 const result=frames.map(source=>{const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const c=canvas.getContext('2d');c.drawImage(source,0,0);const pixels=c.getImageData(0,0,96,96),d=pixels.data;
  // Preserve the original darkness and alpha; recolor the lighter smoke.
  for(let i=0;i<d.length;i+=4){const light=Math.max(d[i],d[i+1],d[i+2]);for(let j=0;j<3;j++)d[i+j]=Math.round(light*(.2+.8*rgb[j]/peak));}c.putImageData(pixels,0,0);return canvas;
 });if(colors.size>=8)colors.delete(colors.keys().next().value);colors.set(color,result);return result;
}
export function drawShadowAura(c,e,time=0,{color='#684393',opacity=.22,width=66,height=60,speed=1,intensity=1,reduced=false,staticPose=false}={}){
 if(frames.length!==4)return false;
 const still=reduced||staticPose||e.frozen>0,phase=still?0:((time*Math.max(0,speed)/2.1+(e.id||0)*.173)%1+1)%1*4,index=Math.floor(phase),blend=phase-index,images=tinted(color),sway=still?0:Math.sin(time*1.7+(e.id||0))*1.1;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.beginPath();c.rect(-width/2-3,-height-4,width+6,height+14);c.clip();const alpha=Math.max(0,Math.min(.45,opacity*intensity))*(reduced?.6:1),prior=c.globalAlpha;
 c.globalAlpha=prior*alpha*(1-blend);c.drawImage(images[index],-width/2+sway,10-height,width,height);
 if(blend>0){c.globalAlpha=prior*alpha*blend;c.drawImage(images[(index+1)%4],-width/2+sway,10-height,width,height);}c.restore();return true;
}
