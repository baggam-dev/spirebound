// Cutout animation of approved art, not new textures. No combat/save writes.
const history=new WeakMap();
export function locomotion(e,time=0,{staticPose=false,reduced=false,blocked=false,stride=24}={}){
 if(staticPose)return {moving:false,phase:0,wave:0,lift:0};
 let p=history.get(e);if(!p){p={x:e.x,y:e.y,time,phase:0,moving:false};history.set(e,p);}
 if(time!==p.time){
  const distance=Math.hypot(e.x-p.x,e.y-p.y);
  p.moving=!blocked&&!(e.frozen>0)&&distance>.025&&distance<36;
  if(p.moving)p.phase=(p.phase+distance*Math.PI*2/stride)%(Math.PI*2);
  p.x=e.x;p.y=e.y;p.time=time;
 }
 const moving=p.moving&&!blocked&&!(e.frozen>0)&&!reduced;
 return {moving,phase:p.phase,wave:moving?Math.sin(p.phase):0,lift:moving?Math.abs(Math.sin(p.phase*2)):0};
}

export function drawWalkingFrame(c,f,g,{feet=21,hip=7,weight=1}={}){
 const x=Math.round(f.x),y=Math.round(f.y),image=f.canvas;
 if(!g.moving){c.drawImage(image,x,y);return;}
 const split=Math.max(0,Math.min(image.height,Math.round(hip-y))),mid=Math.max(0,Math.min(image.width,Math.round(-x)));
 // Upper body stays coherent with its weapon; alternating lower strips bend
 // the legs continuously from a fixed hip rather than sliding the whole actor.
 const bob=-g.lift*.65*weight;
 if(split>0)c.drawImage(image,0,0,image.width,split, x,y+bob,image.width,split);
 for(const [sx,width,side] of [[0,mid,-1],[mid,image.width-mid,1]]){
  if(width<=0)continue;
  for(let sy=split;sy<image.height;sy+=2){
   const h=Math.min(2,image.height-sy),t=Math.max(0,Math.min(1,(y+sy-hip)/Math.max(1,feet-hip))),swing=g.wave*side;
   const dx=swing*2.4*weight*t,dy=-Math.max(0,swing)*2*weight*t+bob*(1-t);
   c.drawImage(image,sx,sy,width,h,Math.round(x+sx+dx),Math.round(y+sy+dy),width,h);
  }
 }
}

export function drawGlidingFrame(c,f,g,{feet=21,mode='float'}={}){
 if(!g.moving){c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));return;}
 c.save();c.translate(0,feet);
 if(mode==='ooze')c.scale(1+g.wave*.055,1-g.wave*.065);
 else if(mode==='crawl'){c.rotate(g.wave*.025);c.scale(1+g.wave*.018,1-g.wave*.025);}
 else c.translate(g.wave*.7,-g.lift*2);
 c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y-feet));c.restore();
}
