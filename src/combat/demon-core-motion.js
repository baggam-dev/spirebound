import {DEMON_SWEEP,isDemonSweep,demonSweepSide} from './demon-sweep.js';
export const CORE_MOTION=Object.freeze({strike:DEMON_SWEEP.strike,recover:DEMON_SWEEP.recover,duration:DEMON_SWEEP.strike+DEMON_SWEEP.recover});
export const coreMotionKinds=Object.freeze(['hand','footJump','footDash','eyeRay','eyeOrb','noseTrail','mouthPull','mouthPush','mouthTongue','coreBurst']);
export function demonCorePose({attack=null,coreFlash=null,sweepFlash=null,enhanced=false,staticPose=false}={}){
 if(staticPose||!attack&&!coreFlash&&!sweepFlash)return {kind:null,stage:0,side:1,progress:0,elapsed:0,target:null};
 const a=attack||sweepFlash||coreFlash,elapsed=attack?0:Math.max(0,Math.min(CORE_MOTION.duration,CORE_MOTION.duration-a.time));
 const fallback=isDemonSweep(a.kind)?DEMON_SWEEP.windup:enhanced?(a.kind==='footJump'?.75:a.kind==='eyeRay'?.65:.42):(['footJump','eyeRay'].includes(a.kind)?1.1:.85);
 return {kind:a.kind,stage:attack?1:a.time>CORE_MOTION.recover?2:3,side:isDemonSweep(a.kind)?demonSweepSide(a.kind):1,progress:attack?Math.max(0,Math.min(1,1-a.time/(a.windup||fallback))):0,elapsed,target:{x:a.tx,y:a.ty}};
}
