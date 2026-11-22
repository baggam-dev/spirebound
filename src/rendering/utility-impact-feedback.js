// Read only fresh simulation packets. Never inspect saved buffs to replay a hit.
const supported=new Set(['frostWave','thunderSigil']);
const actual=hit=>hit.applied===true&&hit.newHit===true&&hit.damage>0;
export function utilityImpactFeedback(results=[],effects=[]){
 const seen=new Set(),cells=new Set(),out=[];
 const hits=results.filter(h=>supported.has(h.source)&&actual(h)&&!h.critical&&Number.isFinite(h.x)&&Number.isFinite(h.y)).sort((a,b)=>b.damage-a.damage);
 for(const hit of hits){
  const key=hit.source+':'+hit.attackId+':'+hit.enemyId,cell=Math.floor(hit.x/32)+':'+Math.floor(hit.y/32);
  if(seen.has(key)||cells.has(cell))continue;seen.add(key);cells.add(cell);
  const center=effects.find(f=>f.utilityFx===hit.source),frost=hit.source==='frostWave';
  out.push({utilityFx:frost?'frostContact':'sigilContact',utilityContact:true,contactPower:hit.damage,x:hit.x,y:hit.y-14,angle:frost&&center?Math.atan2(hit.y-center.y,hit.x-center.x):-Math.PI/2,t:.18,duration:.18});
  if(out.length>=4)break;
 }return out;
}
export function utilityImpactCues(results=[],effects=[]){
 const out=[];
 if(results.some(h=>h.source==='frostWave'&&actual(h)))out.push('utilityFrostHit');
 // Preserve the established thunder landing sound even when the target moved away.
 if(effects.some(f=>f.utilityFx==='thunderSigil'))out.push('utilityThunderHit');
 if(effects.some(f=>f.utilityFx==='galeBreak'))out.push('utilityGaleBreak');
 return out;
}
