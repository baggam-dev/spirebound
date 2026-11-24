// Presentation only. Never adds recovery time to movement, shots or immunity.
const states=new WeakMap();
const duration=.18;
export const resetHeroLanding=run=>{if(run)states.delete(run);};
export function advanceHeroLanding(run,room,beforeRoll,dt,{moving=false,shot=false,hit=false,casting=false}={}){
 if(!run||!room||!(dt>0)||!Number.isFinite(dt))return;
 let v=states.get(run);
 if(!v||v.room!==room){v={room,observed:null,landing:null};states.set(run,v);}
 if(v.landing){v.landing.age+=dt;if(v.landing.age>=duration)v.landing=null;}
 // Only a roll seen active on a preceding update can produce a landing.
 // Includes a roll stopped by a wall; never extrapolates beyond its actual end.
 if(!run.roll&&beforeRoll&&v.observed===beforeRoll&&beforeRoll.kind!=='slash'){
  v.landing={age:0,x:run.player.x,y:run.player.y};
 }
 v.observed=run.roll||null;
 if(moving||shot||hit||casting||run.roll||run.status!=='playing'||run.player.hp<=0||run.player.actionStun>0)v.landing=null;
}
export function heroLandingFrame(run,room,{blocked=false,reduced=false}={}){
 const v=run&&states.get(run),p=run?.player,l=v?.landing;
 if(!l||v.room!==room)return null;
 if(blocked||run.roll||run.status!=='playing'||p.hp<=0||p.actionStun>0||Math.hypot(p.x-l.x,p.y-l.y)>.5){v.landing=null;return null;}
 const frame=Math.min(5,Math.floor(l.age/duration*6));
 return reduced?Math.min(5,Math.floor(frame/2)*2+1):frame;
}
