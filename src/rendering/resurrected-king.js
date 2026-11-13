import {bossAtlas} from './boss-atlas.js';
import {locomotion,drawWalkingFrame} from './locomotion.js';
import {mordoPresentationPose} from './mordo-presentation-state.js';
import {kingWeaponMotion} from './boss-motion.js';
const atlas=bossAtlas('king-resurrection-poses-v1.png',[[145,104],[145,123],[165,106],[130,128],[145,104],[145,104]]);
export const resurrectedKingReady=atlas.ready.then(()=>true);
export const resurrectedKingState=atlas.state;
export const revivedKing=e=>e?.variant==='king'&&e.resurrectionVersion===1&&e.hp/e.max<=.3&&(e.kingStage===undefined||e.kingStage===3);
export function drawResurrectedKing(c,e,attack,time=0,{reduced=false,staticPose=false,pose=null}={}){
 if(!revivedKing(e)||atlas.frames.length!==6)return false;
 const hit=mordoPresentationPose(e,{reduced,staticPose});
 const motion=kingWeaponMotion(e,{reduced,staticPose}),forced=pose==='death'?5:pose==='hit'||hit?4:null;
 const aim=e.darkAttack?.aim??e.darkFlash?.aim??e.facing??0,face=Math.cos(aim)<0?-1:1;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;
 c.translate(0,29);c.rotate(forced===null?motion.lean:0);c.translate(0,-29);
 const gait=locomotion(e,time,{staticPose,reduced,blocked:forced!==null||motion.blocked||e.frozen>0,stride:28});
 // These are distinct painted silhouettes. Alpha blending duplicates the face
 // and halberd; use one clear key pose while weight shifts remain continuous.
 const index=forced??(motion.mix<.5?motion.from:motion.to),f=atlas.frames[index];
 drawWalkingFrame(c,{canvas:f,x:-f.width/2,y:29-f.height},gait,{feet:29,hip:14,weight:.65});
 c.restore();return true;
}
export function drawResurrectedDeath(c,f,options={}){
 if(!f.resurrection||f.kingPhase!==3)return false;
 c.save();c.globalAlpha*=Math.min(1,f.t/f.duration*2);const ok=drawResurrectedKing(c,{variant:'king',resurrectionVersion:1,hp:1,max:10,x:f.x,y:f.y,facing:f.face<0?Math.PI:0},{stage:'idle'},0,{...options,staticPose:true,pose:'death'});c.restore();return ok;
}
