import {bossAtlas} from './boss-atlas.js';
const atlas=bossAtlas('sealed-remnant-parts-v1.png',[[110,84],[100,84],[120,76],[110,72],[120,76],[290,185]]);
export const remnantSpriteReady=atlas.ready.then(()=>true);
export const remnantSpriteState=atlas.state;
const parts=['hand','foot','eye','nose','mouth','core'];
export function drawRemnant(c,e,time=0,{attack=null,reduced=false,staticPose=false,room=null}={}){
 if(e.remnantVersion!==1||atlas.frames.length!==6)return false;
 const index=parts.indexOf(e.part),f=atlas.frames[index];if(!f)return false;
 const core=index===5,d=room?.demon,strike=core&&(d?.sweepFlash||d?.coreFlash),progress=attack?Math.min(1,1-attack.time/1.1):0;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.imageSmoothingEnabled=false;
 if(core&&!staticPose){c.fillStyle='#505451';c.fillRect(-150,-5,300,24);c.strokeStyle='#242d2d';for(let i=0;i<8;i++)c.strokeRect(-150+i*38,-5,38,24);}
 // Atlas holds a neutral statue; motion belongs to the separate presentation layer.
 const tilt=reduced||staticPose?0:attack?(e.part==='hand'?-.10:core?-.035:.06)*progress:strike ? .06 : 0;
 const lift=!reduced&&!staticPose&&e.part==='foot'&&attack?.kind==='footJump'?progress*22:0;
 if(core){
  // Split the neutral bust at its elbows so a sweep moves an arm, not the wall
  // or the entire statue. Keep the upper torso and middle chest stationary.
  const w=f.width,h=f.height,cut=Math.floor(h*.52),sideW=Math.floor(w*.3),middle=w-2*sideW,top=-100;
  c.drawImage(f,0,0,w,cut,-w/2,top,w,cut);
  c.drawImage(f,sideW,cut,middle,h-cut,-w/2+sideW,top+cut,middle,h-cut);
  const kind=attack?.kind||d?.sweepFlash?.kind||d?.coreFlash?.kind;
  for(const side of [-1,1]){
   const sx=side<0?0:w-sideW,hinge=side<0?-w/2+sideW:w/2-sideW;
   const sweeping=kind===(side<0?'coreSweepLeft':'coreSweepRight');
   const turn=reduced||staticPose?0:sweeping?(attack?-side*progress*.22:side*.48):attack?.kind==='hand'?-side*progress*.10:0;
   c.save();c.translate(hinge,top+cut);c.rotate(turn);c.drawImage(f,sx,cut,sideW,h-cut,side<0?-sideW:0,0,sideW,h-cut);c.restore();
  }
 }else{c.rotate(tilt);c.drawImage(f,-f.width/2,22-f.height-lift);}
 if(!staticPose&&e.part==='mouth'&&attack?.kind==='mouthTongue'){
  c.strokeStyle='#c6a45f';c.lineWidth=7;c.setLineDash([9,4]);c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(attack.aim)*Math.min(100,progress*120),Math.sin(attack.aim)*Math.min(100,progress*120));c.stroke();
 }c.restore();return true;
}
export function drawRemnantDeath(c,f,options={}){
 if(!f.remnant)return false;c.save();const age=1-f.t/f.duration;c.globalAlpha*=1-age;c.translate(0,options.reduced?0:age*14);const ok=drawRemnant(c,{variant:'demon',remnantVersion:1,part:f.bodyPart,x:f.x,y:f.y},0,{...options,staticPose:true});c.restore();return ok;
}
