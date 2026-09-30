// Only the player's primary arrow advances the mark. Split, repeat, turret and seeker shots do not multiply it.
export function precisionMultiplier(p,e){
 const stacks=e.precisionHits||0,threshold=p.evolutions?.precision==='sniper'?2:3;
 let factor=1.55+(p.precision-1)*.3;
 if(stacks>=threshold-1)factor*=p.evolutions?.precision==='sniper'?2.1:p.precision>=2?2:1.8;
 else if(stacks)factor*=1+(p.weakpoint||0)*.1;
 if(e.hp/e.max<=.35)factor*=1+(p.finisher||0)*.15+(p.evolutions?.precision==='execution'?.35:0);
 return factor;
}
export function recordPrecisionHit(p,e){
 const threshold=p.evolutions?.precision==='sniper'?2:3;
 e.precisionHits=((e.precisionHits||0)+1)%threshold;
 e.precisionTime=4;
}
export function tickPrecision(e,dt){if(e.precisionTime===undefined)return;e.precisionTime=Math.max(0,e.precisionTime-dt);if(!e.precisionTime)e.precisionHits=0;}
