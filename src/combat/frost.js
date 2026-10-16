export const frostThreshold=level=>level===1?4:level===2?3:2;
export function applyFrost(p,e){if(!p.frost||e.hp<=0)return;const before=e.frostStacks||0;if(!(e.frozen>0)&&!(e.freezeImmune>0)){const next=before+1;e.frostStacks=Math.min(3,next);e.frostStackTime=p.frostBond?4:3;if(next>=frostThreshold(p.frost)){e.frozen=e.type==='boss'?.45:1.2;e.freezeImmune=e.frozen+2;e.frostStacks=3;if(p.frostBond>=3)e.thawBond=true;}}
 const n=Math.max(1,e.frostStacks||0),branch=p.evolutions?.frost;const move=[.15,.25,.35][n-1]+(branch==='deep'?.15:branch==='lasting'?-.1:0)+(p.frostBond>=2?.05:0),boss=e.type==='boss'?.5:1;e.slow=branch==='deep'?1:branch==='lasting'?4:2;e.slowFactor=1-Math.min(.6,Math.max(0,move))*boss;e.frostAttackFactor=1-[.1,.2,.3][n-1]*boss;
}
export function finishFrost(e,wasFrozen){if(wasFrozen&&!(e.frozen>0)&&e.thawBond){delete e.thawBond;e.slowFactor=Math.min(e.slow>0?e.slowFactor??1:1,e.type==='boss'?.925:.85);e.slow=Math.max(e.slow||0,1);}}
export function frostAttackRate(e){return e.slow>0?(e.frostAttackFactor??1):1;}
