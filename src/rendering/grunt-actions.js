// Only the renderer owns this short history. It never enters saves or changes AI.
let history=new WeakMap();
export const clearGruntActions=()=>{history=new WeakMap();};
const face=(aim,fallback)=>Number.isFinite(aim)?Math.cos(aim)<0?-1:1:fallback||1;
export function gruntActionPose(e,time,{reduced=false,fallbackFace=1}={}){
 if(!['chaser','archer'].includes(e.type))return null;
 if(!Number.isFinite(time)||e.hp<=0||e.frozen>0||e.opening>0||e.highAttack||e.meleeAttack){history.delete(e);return null;}
 let v=history.get(e);
 if(!v||time<v.time||time-v.time>.4||Math.hypot(e.x-v.x,e.y-v.y)>80){v={time,x:e.x,y:e.y,striking:false,phase:null,shot:e.shot||0,shotAt:-Infinity,settleAt:-Infinity};history.set(e,v);}
 if(time!==v.time){
  if(e.type==='chaser'&&v.striking&&!(e.chaserStrike>0)&&!(e.chaserWindup>0))v.settleAt=time;
  if(e.type==='archer'&&e.attackPhase==='firing'&&(e.shot||0)>0&&(v.phase!=='firing'||(e.shot||0)>v.shot))v.shotAt=time;
  if(e.type==='archer'&&v.phase==='firing'&&e.attackPhase==='recover'){v.settleAt=time;v.shotAt=time;}
  v.time=time;v.x=e.x;v.y=e.y;
 }
 v.striking=e.chaserStrike>0;v.phase=e.attackPhase;v.shot=e.shot||0;
 let pose=null;
 if(e.type==='chaser'){
  if(e.chaserWindup>0)pose={stage:'prepare',index:1,x:-1,lean:-.022,face:face(e.chaserAim,fallbackFace)};
  else if(e.chaserStrike>0)pose={stage:'strike',index:1,x:2,lean:.035,face:face(e.chaserAim,fallbackFace)};
  else if(time-v.settleAt<.14){const q=1-(time-v.settleAt)/.14;pose={stage:'settle',index:0,x:q,lean:.018*q,face:face(e.chaserAim,fallbackFace)};}
 }else{
  if(e.attackPhase==='warning'){const progress=1-Math.max(0,Math.min(1,(e.attackTime||0)/(e.warningDuration||.7)));pose={stage:'draw',index:1,x:-.6*progress,lean:-.018*progress,face:face(e.patternAim,fallbackFace)};}
  else if(e.attackPhase==='firing'){
   const q=Math.max(0,1-(time-v.shotAt)/.12);pose={stage:'release',index:1,x:-1.8*q,lean:-.026*q,face:face(e.patternAim,fallbackFace)};
  }else if(e.attackPhase==='recover'&&time-v.settleAt<.24){const q=1-(time-v.settleAt)/.24;pose={stage:'lower',index:time-v.settleAt<.09?1:0,x:-q,lean:-.016*q,face:face(e.patternAim,fallbackFace)};}
 }
 if(pose&&reduced)return {...pose,x:0,lean:0};return pose;
}
export function applyGruntAction(c,pose){
 if(!pose)return;c.translate(pose.x,21);c.rotate(pose.lean);c.translate(0,-21);
}
