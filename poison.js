import {drawGroundField} from './ground-visuals.js';
import {drawOrganicBody} from './pixel-world.js';
import {seededRandom} from './random.js';
import {emitShot} from './patterns.js';
import {openGuard} from './tactics.js';
import {moveBody,steering,safeSpawn,segmentBlocked} from './terrain.js';
import {attackProfile} from './balance.js';

export function allocateEnemyId(room){room.nextEnemyId=Math.max(room.nextEnemyId||0,...room.enemies.map(e=>e.id+1));return room.nextEnemyId++;}
export function slimeRadius(e){return (e.variant==='slime'?[38,28,20][e.stage||0]:e.type==='minislime'?11:19)*(e.scale??1);}
function puddles(e,p,room,count,boss){
 room.hazards??=[];
 for(let i=0;i<count;i++){
  const angle=(e.poisonTurn||0)*1.7+i*Math.PI*2/count,offset=count===1||(!boss&&i===0)?0:55;
  const target=boss?{x:Math.max(100,Math.min(860,p.x+Math.cos(angle)*offset)),y:Math.max(100,Math.min(440,p.y+Math.sin(angle)*offset))}:{x:Math.max(31,Math.min(929,p.x+Math.cos(angle)*offset)),y:Math.max(49,Math.min(491,p.y+Math.sin(angle)*offset))};
  // Flower lob targets the floor under the player, including the perimeter.
  // Body spawn clearance would incorrectly push this ground effect away from walls.
  if(boss)safeSpawn(target,room.obstacles,30);
  room.hazards.push({owner:e.id,kind:'puddle',x:target.x,y:target.y,fromX:e.x,fromY:e.y,r:boss?43:30,phase:'warning',time:boss?.85:1,flight:.65,duration:boss?3.5:2,damage:boss?12:9});
 }
}
export function updatePoisonEnemy(e,p,room,dt,bullets=[]){
 if(e.phase==='splitJump'){e.phaseTime=Math.max(0,e.phaseTime-dt);const t=1-e.phaseTime/1.1;e.x=e.launchX+(e.landX-e.launchX)*t;e.y=e.launchY+(e.landY-e.launchY)*t;if(e.phaseTime===0){e.phase=null;e.cd=.7;e.spawnGrace=.3;}return;}
 e.cd=(e.cd??1)-dt;
 const hazards=room.hazards??=[];
 if(e.type==='flower'){
  if(e.cd<=0&&!hazards.some(h=>h.owner===e.id)){
   puddles(e,p,room,e.escapeDepth?(e.escapeDepth>=3?3:2):1,false);
   e.poisonTurn=(e.poisonTurn||0)+1;e.cd=1.2*attackProfile(e).recovery;
  }return;
 }
 e.gasClock=Math.max(0,(e.gasClock??0)-dt);if(e.gasClock<=0){hazards.push({owner:e.id,kind:'aura',closeGas:true,x:e.x,y:e.y,r:90-(e.stage||0)*20,phase:'warning',time:.6,flight:0,duration:3.4,damage:9});e.gasClock=6;}
 if(e.cd<=0&&hazards.some(h=>h.owner===e.id&&h.kind==='aura'&&!h.closeGas&&h.phase!=='expired')){e.cd=.1;return;}
 const stage=e.stage||0;
 if(stage<2){e.slimeShotClock=Math.max(0,(e.slimeShotClock??(stage===0?2:3))-dt);if(e.slimeShotClock===0){const aim=Math.atan2(p.y-e.y,p.x-e.x),offsets=stage===0?[-.48,-.24,0,.24,.48]:[-.12,.12];for(const offset of offsets){emitShot(e,aim+offset,stage===0?180:165,bullets);Object.assign(bullets.at(-1),{damage:9,source:'독성 군체 일반탄'});}e.slimeShotClock=stage===0?2.8:4;}}

 if(e.cd>0){const a=steering(e,p,room.obstacles,slimeRadius(e));moveBody(e,Math.cos(a)*(22+stage*10)*1.2*(e.slow>0?e.slowFactor:1)*dt,Math.sin(a)*(22+stage*10)*1.2*(e.slow>0?e.slowFactor:1)*dt,room.obstacles,slimeRadius(e));e.x=Math.max(75,Math.min(885,e.x));e.y=Math.max(90,Math.min(450,e.y));return;}
 const turn=e.poisonTurn||0,pattern=turn%(stage<2?6:5);e.poisonTurn=turn+1;
 if(stage===0&&pattern===0)puddles(e,p,room,3,true);
 else if(pattern===0)hazards.push({owner:e.id,kind:'aura',x:e.x,y:e.y,r:110-stage*22,phase:'warning',time:1.1,flight:0,duration:3,damage:12});
 else if(pattern===1)puddles(e,p,room,stage===0?3:2,true);
 else if(pattern===(stage<2?3:2)){puddles(e,p,room,4,true);}
 else if(stage<2&&pattern===4){const aim=Math.atan2(p.y-e.y,p.x-e.x);for(let i=-2;i<=2;i++){emitShot(e,aim+i*.13,200,bullets);Object.assign(bullets.at(-1),{x:e.x+Math.cos(aim+i*.13)*(slimeRadius(e)+5),y:e.y+Math.sin(aim+i*.13)*(slimeRadius(e)+5),poisonShot:'needle',source:'독성 군체 독침'});}}
 else if(stage<2&&pattern===5){const aim=Math.atan2(p.y-e.y,p.x-e.x);for(let i=0;i<10;i++){emitShot(e,aim+i*Math.PI/5,90,bullets);Object.assign(bullets.at(-1),{x:e.x+Math.cos(aim+i*Math.PI/5)*(slimeRadius(e)+5),y:e.y+Math.sin(aim+i*Math.PI/5)*(slimeRadius(e)+5),poisonShot:'orb',source:'독성 군체 확산 독구슬'});}}
 else if(pattern===2&&room.enemies.filter(n=>n.type==='minislime').length<8){
  if(stage===0)puddles(e,p,room,3,true);
  for(let i=0;i<2;i++){
   if(room.enemies.filter(n=>n.type==='minislime').length>=8)break;
   const max=Math.max(1,Math.ceil(e.max/10)),child={id:allocateEnemyId(room),type:'minislime',x:Math.max(70,Math.min(890,e.x+(i?45:-45))),y:Math.min(460,e.y+40),hp:max,max,cd:1,tier:e.tier||5,balanceVersion:1,summoned:true,spawnGrace:.7};
   if(e.chestBoss){child.chestBoss=true;child.scale=e.scale;}safeSpawn(child,room.obstacles,11);room.enemies.push(child);
  }
 }
 room.hazards=hazards;e.cd=(stage===0?2.6:4+stage*.4)*.85;
}
export function splitSlime(e,room,player={x:480,y:270},random=seededRandom((e.id+1)*7717+(e.stage||0))){
 if(e.variant!=='slime'||e.stage>=2)return false;
 room.hazards=(room.hazards||[]).filter(h=>h.owner!==e.id||h.kind!=='aura');room.hazards.push({owner:e.id,kind:'puddle',x:e.x,y:e.y,fromX:e.x,fromY:e.y,r:65,phase:'warning',time:.6,flight:0,duration:4,damage:12});
 const landings=[];
 for(let i=0;i<2;i++){
  const max=Math.ceil(e.max/2),child={id:allocateEnemyId(room),type:'boss',variant:'slime',stage:(e.stage||0)+1,tier:e.tier||5,x:Math.max(75,Math.min(885,e.x+(i?36:-36))),y:Math.max(90,Math.min(450,e.y+(i?15:-15))),hp:max,max,cd:1.2+i*.8,poisonTurn:i,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18,spawnGrace:.8};
  if(e.chestBoss){child.chestBoss=true;child.scale=e.scale;}let landing;for(let attempt=0;attempt<80;attempt++){landing={x:100+random()*760,y:100+random()*350};safeSpawn(landing,room.obstacles,slimeRadius(child));if(Math.hypot(landing.x-player.x,landing.y-player.y)>=145&&landings.every(q=>Math.hypot(q.x-landing.x,q.y-landing.y)>=180))break;}landings.push(landing);Object.assign(child,{x:e.x,y:e.y,phase:'splitJump',phaseTime:1.1,launchX:e.x,launchY:e.y,landX:landing.x,landY:landing.y,spawnGrace:0});room.enemies.push(child);
 }return true;
}
export function updateHazards(room,dt,p,hurt){
 for(const h of room.hazards||[]){
  if(h.kind==='aura'){const owner=room.enemies.find(e=>e.id===h.owner&&e.hp>0);if(!owner){h.time=0;h.phase='expired';continue;}h.x=owner.x;h.y=owner.y;}
  if(h.phase==='warning'&&room.enemies.some(e=>e.id===h.owner&&e.frozen>0))continue;
  h.time-=dt;
  if(h.time<=0){if(h.phase==='warning'){h.phase=h.flight?'flight':'active';h.time=h.flight||h.duration;}else if(h.phase==='flight'){h.phase='active';h.time=h.duration;}else{if(h.kind==='aura'&&!h.closeGas){const owner=room.enemies.find(e=>e.id===h.owner&&e.hp>0);if(owner)openGuard(owner,1.2);}h.phase='expired';}}
 }
 room.hazards=(room.hazards||[]).filter(h=>h.phase!=='expired');
 // One poison pulse for the union of all zones, never one pulse per overlapping zone.
 room.poisonPulse=Math.max(0,(room.poisonPulse||0)-dt);
 const touching=room.hazards.filter(h=>h.phase==='active'&&Math.hypot(p.x-h.x,p.y-h.y)<h.r+10&&(h.kind!=='aura'||!segmentBlocked(h,p,room.obstacles)));
 if(touching.length&&room.poisonPulse<=0){hurt(Math.max(...touching.map(h=>h.damage)));room.poisonPulse=1;}
}
export function drawHazards(ctx,room,time=0){
 ctx.save();
 for(const h of room.hazards||[]){
  drawGroundField(ctx,h,h.phase==='active'?'hostile':'warning',time);
  if(h.phase==='flight'){const t=1-h.time/h.flight,x=h.fromX+(h.x-h.fromX)*t,y=h.fromY+(h.y-h.fromY)*t-Math.sin(t*Math.PI)*85;ctx.setLineDash([]);ctx.fillStyle='#e5bdff';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();}
 }ctx.restore();
}
export function drawPoisonEnemy(ctx,e,time=0,room={}){
 if(e.variant!=='slime'&&!['flower','minislime'].includes(e.type))return;
 ctx.save();if(e.phase==='splitJump'){ctx.strokeStyle='#e5ec9c';ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(e.landX,e.landY,slimeRadius(e)+15,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.translate(0,-Math.sin(Math.PI*(1-e.phaseTime/1.1))*90);}drawOrganicBody(ctx,e,slimeRadius(e),time,room);
 ctx.restore();
}

export function bossHealth(room){const bosses=room.enemies.filter(e=>e.type==='boss'&&!e.summoned);if(!bosses.length)return {current:0,max:0,ratio:0};const slime=bosses.some(e=>e.variant==='slime');const current=bosses.reduce((n,e)=>n+Math.max(0,e.hp)+(slime?(2-(e.stage||0))*e.max:0),0);const inferred=slime?Math.max(...bosses.map(e=>e.max*Math.pow(2,e.stage||0)*3)):bosses.reduce((n,e)=>n+e.max,0);room.bossTotalHp??=inferred;return {current,max:room.bossTotalHp,ratio:Math.max(0,Math.min(1,current/room.bossTotalHp))};}
