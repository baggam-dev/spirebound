import {bossAtlas} from './boss-atlas.js';
import {remnantMotion} from './boss-motion.js';
const atlas=bossAtlas('sealed-remnant-parts-v1.png',[[110,84],[100,84],[120,76],[110,72],[120,76],[290,185]]);
export const remnantSpriteReady=atlas.ready.then(()=>true);
export const remnantSpriteState=atlas.state;
const parts=['hand','foot','eye','nose','mouth','core'];
export function drawRemnant(c,e,time=0,{attack=null,reduced=false,staticPose=false,room=null}={}){
 if(e.remnantVersion!==1||atlas.frames.length!==6)return false;
 const index=parts.indexOf(e.part),f=atlas.frames[index];if(!f)return false;
 const core=index===5,m=remnantMotion(e,room,attack,{reduced,staticPose}),progress=attack?Math.min(1,1-attack.time/1.1):0;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.imageSmoothingEnabled=false;
 if(core&&!staticPose){c.fillStyle='#505451';c.fillRect(-150,-5,300,24);c.strokeStyle='#242d2d';for(let i=0;i<8;i++)c.strokeRect(-150+i*38,-5,38,24);}
 // Atlas holds a neutral statue; motion belongs to the separate presentation layer.
 if(core){
  // Split the neutral bust at its elbows so a sweep moves an arm, not the wall
  // or the entire statue. Keep the upper torso and middle chest stationary.
  const w=f.width,h=f.height,cut=Math.floor(h*.52),sideW=Math.floor(w*.3),middle=w-2*sideW,top=-100;
  c.drawImage(f,0,0,w,cut,-w/2,top,w,cut);
  c.drawImage(f,sideW,cut,middle,h-cut,-w/2+sideW,top+cut,middle,h-cut);
  for(const side of [-1,1]){
   const sx=side<0?0:w-sideW,hinge=side<0?-w/2+sideW:w/2-sideW;
   const turn=m.arms[side<0?0:1];
   // Carry a short elbow overlap through the hinge so rotation cannot expose
   // the straight crop edge between the moving forearm and fixed upper arm.
   const overlap=18;
   c.save();c.translate(hinge,top+cut);c.rotate(turn);c.drawImage(f,sx,cut-overlap,sideW,h-cut+overlap,side<0?-sideW:0,-overlap,sideW,h-cut+overlap);c.restore();
  }
 }else if(e.part==='hand'||e.part==='foot'){
  c.translate(Math.cos(m.aim)*m.lunge,Math.sin(m.aim)*m.lunge);c.translate(0,22);c.rotate(m.tilt);c.scale(1+m.squash*.65,1-m.squash);c.drawImage(f,-f.width/2,-f.height-m.lift);
  c.translate(0,-22);
 }else{c.rotate(reduced||staticPose?0:attack?.06*progress:0);c.drawImage(f,-f.width/2,22-f.height);}
 if(!staticPose&&e.part==='mouth'&&attack?.kind==='mouthTongue'){
  c.strokeStyle='#c6a45f';c.lineWidth=7;c.setLineDash([9,4]);c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(attack.aim)*Math.min(100,progress*120),Math.sin(attack.aim)*Math.min(100,progress*120));c.stroke();
 }c.restore();return true;
}
export function drawRemnantDeath(c,f,options={}){
 if(!f.remnant)return false;c.save();const age=1-f.t/f.duration;c.globalAlpha*=1-age;c.translate(0,options.reduced?0:age*14);const ok=drawRemnant(c,{variant:'demon',remnantVersion:1,part:f.bodyPart,x:f.x,y:f.y},0,{...options,staticPose:true});c.restore();return ok;
}
