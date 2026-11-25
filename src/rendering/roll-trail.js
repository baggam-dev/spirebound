// At most five iaido / three ordinary observed poses; never extrapolate behind a wall.
const states=new WeakMap();
export const resetRollTrail=run=>{if(run)states.delete(run);};
export function advanceRollTrail(run,room,dt){
 if(!run||!room||!(dt>0)||!Number.isFinite(dt))return;
 let v=states.get(run);if(!v||v.room!==room){v={room,age:0,last:-Infinity,poses:[]};states.set(run,v);}
 const step=Math.min(.1,dt);v.age+=step;v.poses=v.poses.filter(p=>(p.age+=step)<(p.roll.kind==='slash'?.24:.14));
 const q=run.roll,p=run.player;
 if(!q||!p||v.age-v.last<(q.kind==='slash'?.012:.035)||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
 const previous=v.poses.at(-1);if(previous&&Math.hypot(previous.player.x-p.x,previous.player.y-p.y)<2)return;
 v.last=v.age;v.poses.push({age:0,player:{x:p.x,y:p.y},roll:{x:q.x,y:q.y,kind:q.kind,elapsed:q.elapsed,duration:q.duration}});
 while(v.poses.length>(q.kind==='slash'?5:3))v.poses.shift();
}
export function drawRollTrail(c,run,drawPose,{reduced=false,room=null}={}){
 if(reduced)return false;const v=run&&states.get(run);if(!v?.poses.length||room&&v.room!==room)return false;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();const alpha=c.globalAlpha;
 for(const p of v.poses){const slash=p.roll.kind==='slash',life=slash?.24:.14;if(p.age<(slash?.008:.025))continue;c.globalAlpha=alpha*(slash?.46:.2)*(1-p.age/life)**(slash?1.3:2);drawPose(c,p);}
 c.restore();return true;
}
