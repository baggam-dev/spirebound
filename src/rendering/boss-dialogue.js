import {BOSS_LINES} from '../ui/boss-dialogue-data.js';
import {kingPhase} from '../combat/upper-floors.js';
import {commanderPhase} from '../combat/commander.js';
import {wardenHealthOffset} from './warden-sprite.js';
import {demonHealthOffset} from './demon-sprite.js';
import {bossPose} from './boss-poses.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function kind(e){
 if(!e||e.summoned)return null;
 if(e.gateTitle)return e.type==='starKnight'?'kald':e.type==='astralSniper'?'vera':null;
 if(e.type!=='boss')return null;
 if(e.variant==='demon')return e.part==='core'?'demon':null;
 return !e.variant||e.variant==='warden'?'warden':Object.hasOwn(BOSS_LINES,e.variant)?e.variant:null;
}
const phase=e=>e.variant==='king'?kingPhase(e):e.variant==='commander'?commanderPhase(e):1;
function anchor(e){
 const scale=e.scale??1;
 const offset=e.variant==='demon'?demonHealthOffset(e):e.variant==='king'?83:e.variant==='commander'?70:kind(e)==='warden'?wardenHealthOffset()*scale:e.variant==='slime'?Math.max(52,([76,56,40][e.stage||0]*832/1330-21)*1.3*scale+9):e.variant==='prism'?12+350*84/675*scale+5:e.gateTitle?64:52;
 const lift=e.attackPhase==='leap'?bossPose(e).lift:0;
 return {x:e.x,y:e.y-offset-7-lift};
}
const roomOf=run=>run.floors[run.floor][run.room];
const eligible=(run,r)=>!run.practice&&!run.key&&(r.type==='boss'||r.gate);

// Only bounded event IDs are saved. Actors, speech clocks, queues and anchors are transient.
export function createBossDialogue(run,{loaded=false}={}){
 let queue=[],currentRoom=null,dirty=false;
 const seen=new Set(run.bossDialogueSeen||[]);
 const roomIds=new WeakMap();run.floors.forEach((floor,f)=>floor.forEach((r,i)=>roomIds.set(r,`${f}:${i}`)));
 const id=(r,k,event)=>`${roomIds.get(r)}:${k}:${event}`;
 function remember(key){if(seen.has(key)||seen.size>=128)return false;seen.add(key);run.bossDialogueSeen=[...seen];dirty=true;return true;}
 // Loading a seen encounter never replays its introduction or old phase lines.
 if(loaded)for(const floor of run.floors)for(const r of floor)if(r.seen&&eligible(run,r))for(const e of r.enemies||[]){
  const k=kind(e);if(!k||e.hp<=0)continue;if(!(r.wardenArrival>0))remember(id(r,k,'intro'));
  for(let n=2;n<=phase(e);n++)remember(id(r,k,'phase'+n));
 }
 function add(r,e,event,{lines=null}={}){
  const k=kind(e);if(!k||!remember(id(r,k,event)))return;
  const words=lines||BOSS_LINES[k][event];if(!words)return;
  queue.push({room:r,actor:event==='death'?null:e,point:anchor(e),lines:words,age:0});
  if(queue.length>6)queue.splice(0,queue.length-6);
 }
 function observe(){
  const r=roomOf(run);if(r!==currentRoom){queue=[];currentRoom=r;}
  if(!eligible(run,r))return;
  // Awakening has its own short combat gate; ordinary speech never stops input.
  for(const e of r.enemies||[]){const k=kind(e);if(k&&e.hp>0&&!(r.wardenArrival>0))add(r,e,'intro');}
 }
 return {
  observe,
  get blocking(){return false;},
  get lines(){return queue[0]?.lines||[];},
  flushDirty(){const changed=dirty;dirty=false;return changed;},
  next(){queue.shift();},
  skip(){queue=[];},
  // Skills can kill between simulation ticks; retain those actors until death effects arrive.
  capture(){const r=roomOf(run);return {room:r,enemies:(r.enemies||[]).filter(e=>kind(e)).map(e=>({...e,dialoguePhase:phase(e)}))};},
  after(before,result){
   observe();const r=roomOf(run);if(before.room!==r||!eligible(run,r)||result.events.includes('dead'))return;
   queue=queue.filter(q=>!q.actor||q.actor.hp>0);
   const alive=(r.enemies||[]).filter(e=>e.hp>0),deaths=new Set(result.effects.filter(f=>f.enemyFeedback==='death').map(f=>f.enemyId));
   for(const old of before.enemies){
    const k=kind(old),e=alive.find(e=>e.id===old.id&&kind(e)===k);
    if(e&&phase(e)>old.dialoguePhase)for(let n=old.dialoguePhase+1;n<=phase(e);n++)add(r,e,'phase'+n);
    if(!deaths.has(old.id))continue;
    // Splits are not the death of the collective; wait for the last boss fragment.
    if(k==='slime'&&alive.some(e=>kind(e)==='slime'))continue;
    let lines=BOSS_LINES[k].death;
    if(k==='kald'&&!alive.some(e=>kind(e)==='vera'))lines=null;
    if(k==='vera')lines=alive.some(e=>kind(e)==='kald')?BOSS_LINES.vera.death:BOSS_LINES.vera.last;
    if(lines)add(r,old,'death',{lines});
   }
  },
  tick(dt){
   const q=queue[0];if(!q)return;q.age+=dt;
   if(q.age>=3.6)queue.shift();
  },
  draw(ctx,{compact=false}={}){
   const q=queue[0];if(!q||q.room!==roomOf(run))return;
   if(q.actor&&q.actor.hp>0)q.point=anchor(q.actor);
   drawBubble(ctx,q,run.player,compact);
  }
 };
}

function drawBubble(ctx,q,player,compact){
 const size=compact?16:14,pad=10,lineHeight=size+5,head=q.point;
 ctx.save();ctx.font=`${size}px Galmuri, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
 const w=Math.min(330,Math.ceil(Math.max(...q.lines.map(s=>ctx.measureText(s).width)))+pad*2),h=q.lines.length*lineHeight+pad*2;
 const candidates=[{x:head.x-w/2,y:head.y-h-12},{x:head.x-w-25,y:Math.max(100,head.y-h/2)},{x:head.x+25,y:Math.max(100,head.y-h/2)}];
 const fits=b=>b.x>=14&&b.x+w<=946&&b.y>=96&&b.y+h<=480&&!(b.x+w>650&&b.y<260)&&!(player.x>b.x-22&&player.x<b.x+w+22&&player.y>b.y-15&&player.y<b.y+h+60);
 const b=candidates.find(fits)||{x:clamp(head.x-w/2,16,Math.max(16,645-w)),y:clamp(head.y-h-12,100,460-h)};
 const tip={x:clamp(head.x,16,944),y:clamp(head.y,96,480)},from={x:clamp(tip.x,b.x+8,b.x+w-8),y:tip.y>=b.y+h?b.y+h:tip.y<=b.y?b.y:clamp(tip.y,b.y+6,b.y+h-6)};
 ctx.fillStyle='#101217f5';ctx.strokeStyle='#a4a29a';ctx.lineWidth=1;
 // Short tail, clipped to the safe band; never connect through the top boss HUD.
 if(Math.hypot(tip.x-from.x,tip.y-from.y)<60){ctx.beginPath();ctx.moveTo(from.x-4,from.y);ctx.lineTo(tip.x,tip.y);ctx.lineTo(from.x+4,from.y);ctx.closePath();ctx.fill();ctx.stroke();}
 ctx.fillRect(Math.round(b.x),Math.round(b.y),w,h);ctx.strokeRect(Math.round(b.x)+.5,Math.round(b.y)+.5,w-1,h-1);
 ctx.fillStyle='#eee7d6';q.lines.forEach((line,i)=>ctx.fillText(line,b.x+w/2,b.y+pad+lineHeight*(i+.5),w-pad*2));ctx.restore();
}
