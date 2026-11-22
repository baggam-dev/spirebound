// Presentation tuning only. Large HP loss is not a critical hit.
const profiles={chaser:{duration:.10},archer:{duration:.12},brute:{duration:.14}};
export const hasEnemyHitArt=e=>Object.hasOwn(profiles,e?.type);
export function enemyHitProfile(e,hit={}){
 const critical=hit.applied===true&&hit.newHit===true&&hit.critical===true;
 return {duration:profiles[e.type]?.duration??.10,heavy:critical,direction:Number.isFinite(hit.hitDirection)?Math.sign(hit.hitDirection):0};
}
export function freshEnemyContact(e,results=[]){
 const hits=results.filter(h=>h.enemyId===e.id&&h.applied&&h.damage>0);
 if(!hits.length)return {}; // Legacy/instant-effect path: quiet neutral reaction.
 const fresh=hits.filter(h=>h.newHit&&h.procDepth===0);
 if(!fresh.length)return null;
 // Prefer the meaningful direct hit; never derive a direction from player position.
 return fresh.find(h=>h.source==='arrow'&&h.critical)||fresh.find(h=>h.source==='arrow')||fresh.find(h=>h.critical)||fresh[0];
}
