// Actual applied damage -> bounded view-only sums. Never parse effect text or
// deduplicate DoT snapshots: every queued application is a distinct real amount.
const states=new WeakMap(),WINDOW=.16,LIFE=.65,LIMIT=24;
export const resetDamageNumbers=run=>{if(run)states.delete(run);};
export function formatDamageNumber(amount){
 if(!Number.isFinite(amount)||amount<=0)return '0';
 if(amount<.1)return '<0.1';
 if(amount>=1e6)return (Math.round(amount/1e5)/10)+'M';
 if(amount>=1e4)return (Math.round(amount/100)/10)+'K';
 return String(amount<10?Math.round(amount*10)/10:Math.round(amount));
}
export function advanceDamageNumbers(run,room,dt,results=[]){
 if(!run||!room||!Number.isFinite(dt)||dt<=0)return;
 let v=states.get(run);if(!v||v.room!==room){v={room,time:0,groups:[]};states.set(run,v);}
 v.time+=Math.min(.1,dt);v.groups=v.groups.filter(g=>v.time-g.born<LIFE);
 for(const h of results){
  if(!h?.applied||!Number.isFinite(h.damage)||h.damage<=0||h.enemyId===null||h.enemyId===undefined||!Number.isFinite(h.x)||!Number.isFinite(h.y))continue;
  let crit=Number.isFinite(h.criticalDamage)?Math.max(0,Math.min(h.damage,h.criticalDamage)):h.critical?h.damage:0;
  if(crit>0&&h.damage-crit<=Number.EPSILON*Math.max(1,h.damage)*8)crit=h.damage;
  for(const [critical,amount] of [[false,h.damage-crit],[true,crit]]){
   if(!(amount>0))continue;
   let g=v.groups.findLast(g=>g.enemyId===h.enemyId&&g.critical===critical&&v.time-g.born<WINDOW);
   if(!g){g={enemyId:h.enemyId,critical,amount:0,born:v.time,x:h.x,y:h.y-36};v.groups.push(g);}
   g.amount+=amount;g.x=h.x;g.y=h.y-36;
  }
 }
 while(v.groups.length>LIMIT){const normal=v.groups.findIndex(g=>!g.critical);v.groups.splice(normal<0?0:normal,1);}
}
export function damageNumberLabels(run,{compact=false,reduced=false,room=null}={}){
 const v=run&&states.get(run);if(!v||room&&v.room!==room)return [];
 const budget=reduced?4:compact?5:8;
 return [...v.groups].sort((a,b)=>Number(b.critical)-Number(a.critical)||b.born-a.born||b.amount-a.amount).slice(0,budget).map(g=>({
  damageNumber:true,enemyId:g.enemyId,critical:g.critical,amount:g.amount,x:g.x,y:g.y,
  t:Math.max(0,1-(v.time-g.born)/LIFE),text:formatDamageNumber(g.amount)+(g.critical?'!':''),color:g.critical?'#ffe3a0':'#e2dbce'
 }));
}
export function combatLabelsWithDamage(effects,numbers){
 const covered=new Set(numbers.filter(n=>n.critical).map(n=>n.enemyId));
 // Only the redundant generic critical WORD is hidden. Its contact art/audio,
 // weakness text, pickups and player hurt labels retain their existing paths.
 return [...effects.filter(f=>!f.criticalBurst||f.precisionBurst||!covered.has(f.enemyId)),...numbers];
}
