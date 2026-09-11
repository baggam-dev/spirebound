import {openGuard} from './tactics.js';
import {moveBody,steering,safeSpawn,segmentBlocked} from './terrain.js';
import {attackProfile} from './balance.js';

export function allocateEnemyId(room){room.nextEnemyId=Math.max(room.nextEnemyId||0,...room.enemies.map(e=>e.id+1));return room.nextEnemyId++;}
export function slimeRadius(e){return (e.variant==='slime'?[38,28,20][e.stage||0]:e.type==='minislime'?11:19)*(e.scale??1);}
function puddles(e,p,room,count,boss){
 room.hazards??=[];
 for(let i=0;i<count;i++){
  const angle=(e.poisonTurn||0)*1.7+i*Math.PI*2/count,offset=count===1?0:55;
  const target={x:Math.max(100,Math.min(860,p.x+Math.cos(angle)*offset)),y:Math.max(100,Math.min(440,p.y+Math.sin(angle)*offset))};
  safeSpawn(target,room.obstacles,30);
  room.hazards.push({owner:e.id,kind:'puddle',x:target.x,y:target.y,fromX:e.x,fromY:e.y,r:boss?43:30,phase:'warning',time:boss?.85:1,flight:.65,duration:boss?3.5:2,damage:boss?12:9});
 }
}
export function updatePoisonEnemy(e,p,room,dt){
 e.cd=(e.cd??1)-dt;
 const hazards=room.hazards??=[];
 if(e.type==='flower'){
  if(e.cd<=0&&!hazards.some(h=>h.owner===e.id)){
   puddles(e,p,room,e.escapeDepth?(e.escapeDepth>=3?3:2):1,false);
   e.poisonTurn=(e.poisonTurn||0)+1;e.cd=1.2*attackProfile(e).recovery;
  }return;
 }
 if(e.cd<=0&&hazards.some(h=>h.owner===e.id&&h.kind==='aura'&&h.phase!=='expired')){e.cd=.1;return;}
 const stage=e.stage||0;
 if(e.cd>0){const a=steering(e,p,room.obstacles,slimeRadius(e));moveBody(e,Math.cos(a)*(22+stage*10)*(e.slow>0?e.slowFactor:1)*dt,Math.sin(a)*(22+stage*10)*(e.slow>0?e.slowFactor:1)*dt,room.obstacles,slimeRadius(e));e.x=Math.max(75,Math.min(885,e.x));e.y=Math.max(90,Math.min(450,e.y));return;}
 const turn=e.poisonTurn||0,pattern=turn%(stage<2?3:2);e.poisonTurn=turn+1;
 if(pattern===0)hazards.push({owner:e.id,kind:'aura',x:e.x,y:e.y,r:110-stage*22,phase:'warning',time:1.1,flight:0,duration:3,damage:12});
 else if(pattern===1)puddles(e,p,room,stage===0?3:2,true);
 else if(room.enemies.filter(n=>n.type==='minislime').length<8){
  for(let i=0;i<2;i++){
   if(room.enemies.filter(n=>n.type==='minislime').length>=8)break;
   const max=Math.max(1,Math.ceil(e.max/10)),child={id:allocateEnemyId(room),type:'minislime',x:Math.max(70,Math.min(890,e.x+(i?45:-45))),y:Math.min(460,e.y+40),hp:max,max,cd:1,tier:e.tier||5,balanceVersion:1,summoned:true,spawnGrace:.7};
   if(e.chestBoss){child.chestBoss=true;child.scale=e.scale;}safeSpawn(child,room.obstacles,11);room.enemies.push(child);
  }
 }
 room.hazards=hazards;e.cd=stage===0?3.4:4+stage*.4;
}
export function splitSlime(e,room){
 if(e.variant!=='slime'||e.stage>=2)return false;
 room.hazards=(room.hazards||[]).filter(h=>h.owner!==e.id||h.kind!=='aura');
 for(let i=0;i<2;i++){
  const max=Math.ceil(e.max/2),child={id:allocateEnemyId(room),type:'boss',variant:'slime',stage:(e.stage||0)+1,tier:e.tier||5,x:Math.max(75,Math.min(885,e.x+(i?36:-36))),y:Math.max(90,Math.min(450,e.y+(i?15:-15))),hp:max,max,cd:1.2+i*.8,poisonTurn:i,balanceVersion:1,bossHealthVersion:1,spawnGrace:.8};
  if(e.chestBoss){child.chestBoss=true;child.scale=e.scale;}safeSpawn(child,room.obstacles,slimeRadius(child));room.enemies.push(child);
 }return true;
}
export function updateHazards(room,dt,p,hurt){
 for(const h of room.hazards||[]){
  if(h.kind==='aura'){const owner=room.enemies.find(e=>e.id===h.owner&&e.hp>0);if(!owner){h.time=0;h.phase='expired';continue;}h.x=owner.x;h.y=owner.y;}
  if(h.phase==='warning'&&room.enemies.some(e=>e.id===h.owner&&e.frozen>0))continue;
  h.time-=dt;
  if(h.time<=0){if(h.phase==='warning'){h.phase=h.flight?'flight':'active';h.time=h.flight||h.duration;}else if(h.phase==='flight'){h.phase='active';h.time=h.duration;}else{if(h.kind==='aura'){const owner=room.enemies.find(e=>e.id===h.owner&&e.hp>0);if(owner)openGuard(owner,1.2);}h.phase='expired';}}
 }
 room.hazards=(room.hazards||[]).filter(h=>h.phase!=='expired');
 // One poison pulse for the union of all zones, never one pulse per overlapping zone.
 room.poisonPulse=Math.max(0,(room.poisonPulse||0)-dt);
 const touching=room.hazards.filter(h=>h.phase==='active'&&Math.hypot(p.x-h.x,p.y-h.y)<h.r+10&&(h.kind!=='aura'||!segmentBlocked(h,p,room.obstacles)));
 if(touching.length&&room.poisonPulse<=0){hurt(Math.max(...touching.map(h=>h.damage)));room.poisonPulse=1;}
}
export function drawHazards(ctx,room){
 ctx.save();
 for(const h of room.hazards||[]){
  ctx.strokeStyle='#bddd78';ctx.fillStyle=h.phase==='active'?'#85b84766':'#bddc6b16';ctx.lineWidth=2;ctx.setLineDash(h.phase==='active'?[]:[6,5]);ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(h.phase==='flight'){const t=1-h.time/h.flight,x=h.fromX+(h.x-h.fromX)*t,y=h.fromY+(h.y-h.fromY)*t-Math.sin(t*Math.PI)*85;ctx.setLineDash([]);ctx.fillStyle='#d0e984';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();}
 }ctx.restore();
}
export function drawPoisonEnemy(ctx,e){
 if(e.variant!=='slime'&&!['flower','minislime'].includes(e.type))return;
 ctx.save();const r=slimeRadius(e);ctx.fillStyle=e.type==='flower'?'#72994b':'#83b85f';
 if(e.type==='flower'){ctx.fillRect(e.x-4,e.y-3,8,25);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*12,e.y-9+Math.sin(a)*12,10,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#dec884';ctx.beginPath();ctx.arc(e.x,e.y-9,7,0,Math.PI*2);ctx.fill();}
 else{ctx.beginPath();ctx.ellipse(e.x,e.y,r,r*.72,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#203524';ctx.fillRect(e.x-r*.4,e.y-5,5,5);ctx.fillRect(e.x+r*.25,e.y-5,5,5);}
 ctx.restore();
}
