import {relicStat,hexFactor,directRelicFactor} from './relics.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {runRandom} from './random.js';
export function lightningSpec(p){const level=Math.min(3,p.chain||0),branch=p.evolutions?.chain;return {direct:branch==='surge'?.75:[0,.15,.25,.35][level],first:branch==='surge'?1.2:[0,.45,.55,.65][level],decay:branch==='web'?.9:.8,count:branch==='surge'?1:level+(branch==='web'?2:0)};}
// Receives the same scaled attack/element power as the other arrow elements.
export function lightningImpact(p,target,enemies){const spec=lightningSpec(p),power=p.damage*(1+relicStat(p,'element')),effects=[];
 target.hp-=power*spec.direct*enemyDamageFactor(target,p);
 let origin=target;const visited=new Set([target]);
 for(let i=0;i<spec.count;i++){const next=enemies.filter(n=>n.hp>0&&!['air','splitJump'].includes(n.phase)&&n.attackPhase!=='leap'&&!visited.has(n)&&Math.hypot(n.x-origin.x,n.y-origin.y)<(p.haste?180:140)).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];if(!next)break;next.hp-=power*spec.first*Math.pow(spec.decay,i)*enemyDamageFactor(next,origin);effects.push({x:origin.x,y:origin.y,toX:next.x,toY:next.y,t:.2,color:'#a5c9ff'});visited.add(next);origin=next;}return effects;
}
export function thunderDamage(p,e){const scale=hexFactor(p,'damage')*(1+.12*(p.power||0)+relicStat(p,'damage'));return (p.damage*scale+(p.split&&p.pierce?3:0))*(p.evolutions?.pierce==='depth'?.85:p.evolutions?.pierce==='impact'?1.25:1)*(p.evolutions?.haste==='tempo'?.85:1)*directRelicFactor(p,e)*enemyDamageFactor(e,p);}
export function tickThunder(s,dt){if(!s.player.chain)return [];s.thunderClock=Math.max(0,(s.thunderClock??3)-dt);if(s.thunderClock>1e-9)return [];s.thunderClock=3;
 const r=s.floors[s.floor][s.room],pool=r.enemies.filter(e=>e.hp>0&&e.x>=25&&e.x<=935&&e.y>=45&&e.y<=500&&!['air','splitJump'].includes(e.phase)&&e.attackPhase!=='leap'&&!(e.spawnGrace>0)&&!(e.kingTransition>0)),effects=[];bindDefenses(r.enemies);
 for(let i=0;i<Math.min(3,s.player.chain)&&pool.length;i++){const e=pool.splice(Math.floor(runRandom(s)*pool.length),1)[0],before=e.hp;e.hp-=thunderDamage(s.player,e);if(e.hp<=0)e.passiveKilled=true;if(s.metrics)s.metrics.damageDealt+=before-Math.max(0,e.hp);effects.push({x:e.x,y:e.y,t:.35,thunder:true,color:'#fff18a'});}return effects;
}
export function drawThunder(ctx,f){ctx.save();ctx.globalAlpha=Math.min(1,f.t/.15);ctx.strokeStyle='#91ddff';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(f.x-5,Math.max(45,f.y-95));ctx.lineTo(f.x+10,f.y-58);ctx.lineTo(f.x-9,f.y-42);ctx.lineTo(f.x,f.y);ctx.stroke();ctx.strokeStyle='#fff18a';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#c8f3ff';ctx.beginPath();ctx.arc(f.x,f.y,20*(1-f.t/.5),0,Math.PI*2);ctx.stroke();ctx.restore();}
