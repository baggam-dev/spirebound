import {drawImpactAccent} from './arrow-impact-visuals.js';

// Consume actual damage only. No combat RNG, saved fields or actor animation.
export function criticalFeedback(results=[],effects=[]){
 const selected=[],seen=new Set();
 for(const hit of results){
  if(selected.length<6&&hit.source==='hunterSeal'&&hit.applied&&hit.damage>0&&Number.isFinite(hit.x)&&Number.isFinite(hit.y)){selected.push({x:hit.x,y:hit.y-28,t:.3,duration:.3,color:'#d6bf8f',hunterSeal:true});continue;}
  if(!hit.applied||!hit.critical||!hit.newHit||!(hit.damage>0)||!Number.isFinite(hit.x)||!Number.isFinite(hit.y))continue;
  const key=hit.enemyId+':'+hit.attackId;if(seen.has(key))continue;seen.add(key);
  const weak=effects.find(f=>f.precisionBurst&&f.attackId===hit.attackId&&f.attackId!==null);
  if(weak){weak.criticalBurst=true;weak.enemyId=hit.enemyId;weak.text='약점 치명!';weak.color='#ffe6a1';continue;}
  if(selected.length>=6)continue;
  selected.push({x:hit.x,y:hit.y-28,t:.65,duration:.65,color:'#ffe6a1',text:'치명!',criticalBurst:true,enemyId:hit.enemyId,attackId:hit.attackId});
 }
 return selected;
}
export function limitCriticalFeedback(effects,max=12){
 let slots=max;const keep=new Set();
 for(let i=effects.length-1;i>=0;i--)if(effects[i].criticalBurst&&slots-->0)keep.add(i);
 return effects.filter((f,i)=>!f.criticalBurst||keep.has(i));
}
export function drawCriticalBurst(c,f,reduced=false){
 if(f.hunterSeal){drawImpactAccent(c,{x:f.x,y:f.y+28,age:.3-f.t,duration:.3,strength:0,reduced,color:'#d6bf8f'});return;}
 if(!f.criticalBurst)return;
 drawImpactAccent(c,{x:f.x,y:f.y+28,age:.65-f.t,angle:f.hitAngle??-.5,strength:2,reduced,color:'#fff0bc'});
}
