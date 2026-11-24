// At most three actual, observed roll poses; never extrapolate behind a wall.
const states=new WeakMap();
export const resetRollTrail=run=>{if(run)states.delete(run);};
export function advanceRollTrail(run,room,dt){
 if(!run||!room||!(dt>0)||!Number.isFinite(dt))return;
 let v=states.get(run);if(!v||v.room!==room){v={room,age:0,last:-Infinity,poses:[]};states.set(run,v);}
 const step=Math.min(.1,dt);v.age+=step;v.poses=v.poses.filter(p=>(p.age+=step)<.14);
 const q=run.roll,p=run.player;
 if(!q||!p||v.age-v.last<.035||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
 const previous=v.poses.at(-1);if(previous&&Math.hypot(previous.player.x-p.x,previous.player.y-p.y)<2)return;
 v.last=v.age;v.poses.push({age:0,player:{x:p.x,y:p.y},roll:{x:q.x,y:q.y,kind:q.kind,elapsed:q.elapsed,duration:q.duration}});
 if(v.poses.length>3)v.poses.shift();
}
export function drawRollTrail(c,run,drawPose,{reduced=false,room=null}={}){
 if(reduced)return false;const v=run&&states.get(run);if(!v?.poses.length||room&&v.room!==room)return false;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();const alpha=c.globalAlpha;
 for(const p of v.poses){if(p.age<.025)continue;c.globalAlpha=alpha*.2*(1-p.age/.14)**2;drawPose(c,p);}
 c.restore();return true;
}
