import {createRoomCamera,withRoomCamera} from './room-camera.js';
// Existing painters keep logical coordinates. Only the final surface is device-shaped.
export function roomSurfaceSize(width,height,wide){
 if(!wide||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return {width:960,height:540};
 const scale=Math.min(width/960,height/540);
 return {width:Math.max(960,Math.round(width/scale)),height:Math.max(540,Math.round(height/scale))};
}
export function createRoomStage(canvas,{makeCanvas=()=>document.createElement('canvas'),observe=true}={}){
 const world=makeCanvas(),hud=makeCanvas();world.width=hud.width=960;world.height=hud.height=540;
 const worldContext=world.getContext('2d'),hudContext=hud.getContext('2d'),display=canvas.getContext('2d');
 let box={width:960,height:540};
 const observer=observe&&typeof ResizeObserver!=='undefined'?new ResizeObserver(entries=>{const rect=entries[0]?.contentRect;if(rect?.width>0&&rect?.height>0)box={width:rect.width,height:rect.height};}):null;
 observer?.observe(canvas);
 const reset=c=>{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,960,540);};
 return {
  worldContext,hudContext,
  begin(){reset(worldContext);reset(hudContext);},
  capture(target){const c=target.getContext('2d');target.width=960;target.height=540;c.drawImage(world,0,0);c.drawImage(hud,0,0);},
  present({wide=false}={}){
   const size=roomSurfaceSize(box.width,box.height,wide);
   if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;
   const camera=createRoomCamera(size.width,size.height);
   withRoomCamera(display,camera,c=>{c.imageSmoothingEnabled=false;c.drawImage(world,0,0);});
   // UI has its own fixed common frame, independent of future room footprints.
   const ui=createRoomCamera(size.width,size.height);
   display.save();try{display.setTransform(ui.scale,0,0,ui.scale,ui.x,ui.y);display.globalAlpha=1;display.globalCompositeOperation='source-over';display.imageSmoothingEnabled=false;display.drawImage(hud,0,0);}finally{display.restore();}
  },
  dispose(){observer?.disconnect();}
 };
}
