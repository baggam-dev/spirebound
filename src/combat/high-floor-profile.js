export const highFloorKinds={starKnight:'guard',royalGuard:'thrust',astralSniper:'twoShot',gravityMage:'gravity',starBearer:'resonate',pulseTurret:'cross',riftHunter:'rift',demonSoldier:'soldier',demonCaptain:'captain'};
export const highFloorEnemy=e=>!!highFloorKinds[e.type]&&e.type!=='boss'&&!e.gateTitle;
export const highShapes={guard:{range:100,half:1.05,damage:9},thrust:{range:135,width:10,damage:9},butt:{range:46,half:1.2,damage:9},rift:{range:82,half:.9,damage:9},soldier:{range:58,half:1.05,damage:9},captain:{range:70,half:1.15,damage:12}};
export const highStages={guard:['advance','windup','strike','recover'],thrust:['windup','strike','recover'],butt:['windup','strike','recover'],twoShot:['windup','windup2','recover'],gravity:['windup','channel','recover'],resonate:['windup','channel','recover'],cross:['windup','windup2','recover'],rift:['windup','windup2','strike','return','recover'],soldier:['windup','strike','recover'],captain:['windup','dash','windup2','strike','recover']};
export const highWarning=e=>e.hp>0&&e.highAttack&&e.highAttack.stage!=='recover';
const heavyKinds=new Set(['gravity','cross','rift','captain']);
const heavy=a=>heavyKinds.has(a.kind)&&(a.kind!=='captain'||!a.close);
export const highRecovery={gravity:.8,cross:.9,rift:.9,captain:1};
// Derive coordination from saved attack clocks: no separate room timer or RNG.
// Existing attacks always finish; only a new generic high-floor attack waits.
export function highAttackStartAllowed(e,p,room){
 const candidate={kind:highFloorKinds[e.type],close:Math.hypot(e.x-p.x,e.y-p.y)<90};
 for(const n of room.enemies){
  const a=n.highAttack;
  if(n===e||!highFloorEnemy(n)||n.hp<=0||n.frozen>0||n.opening>0||!a||!heavy(a))continue;
  if(a.stage==='recover'){
   if(a.duration-a.time<.2-1e-8)return false;
  }else if(heavy(candidate))return false;
 }
 return true;
}
