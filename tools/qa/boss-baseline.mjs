// Deterministic comparison fixture. No browser, network, ranking submission or save writes.
import {createPractice} from '../../src/game/boss-practice.js';
import {currentRoom,newRun,enrage} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';

const dt=1/60;
function measureBoss(boss,main,seed,damageScale=1){
 const s=createPractice(boss,main,seed),r=currentRoom(s),p=s.player;
 p.damage*=damageScale;s.invulnerable=1e6;s.entryGrace=0;
 const events=[],patternCounts={},phaseTimes={},maxSeconds=boss==='demon'?180:120;
 let previousAttack=null,previousPhase=r.demon?.phase||r.enemies.find(e=>e.variant==='commander')?.commander?.phase||1,seconds=0,maxHoles=0,commanderWalk=0;
 for(let tick=0;tick<maxSeconds/dt;tick++){
  const c=r.enemies.find(e=>e.variant==='commander')?.commander;
  const commander=r.enemies.find(e=>e.variant==='commander'),oldCommander=commander&&{x:commander.x,y:commander.y};
  const was={volley:!!c?.volley,rain:!!c?.rain,blink:!!c?.blink,snipe:!!c?.snipe};
  const beforeDemonAttack=r.demon?.attack;
  const result=stepRun(s,dt);
  if(commander&&oldCommander){const moved=Math.hypot(commander.x-oldCommander.x,commander.y-oldCommander.y);if(moved<10)commanderWalk+=moved;}
  seconds=(tick+1)*dt;
  phaseTimes[previousPhase]=(phaseTimes[previousPhase]||0)+dt;
  if(c){
   for(const kind of ['volley','rain','blink','snipe'])if(!was[kind]&&c[kind]){patternCounts[kind]=(patternCounts[kind]||0)+1;events.push({t:+seconds.toFixed(2),kind});}
  }
  const d=r.demon;
  if(d){
   if(d.attack&&d.attack!==beforeDemonAttack&&d.attack!==previousAttack){patternCounts[d.attack.kind]=(patternCounts[d.attack.kind]||0)+1;events.push({t:+seconds.toFixed(2),kind:d.attack.kind});previousAttack=d.attack;}
   maxHoles=Math.max(maxHoles,r.obstacles.filter(o=>o.demonHole).length);
  }
  const phase=d?.phase||c?.phase||previousPhase;
  if(phase!==previousPhase){events.push({t:+seconds.toFixed(2),kind:`phase${phase}`});previousPhase=phase;previousAttack=null;}
  if(result.events.includes('practiceWon')||r.used||!r.enemies.some(e=>e.hp>0&&e.type==='boss'))break;
 }
 return {boss,main,seed,damageScale,seconds:+seconds.toFixed(2),cleared:!r.enemies.some(e=>e.hp>0&&e.type==='boss'),patterns:patternCounts,phaseSeconds:Object.fromEntries(Object.entries(phaseTimes).map(([k,v])=>[k,+v.toFixed(2)])),commanderWalk:+commanderWalk.toFixed(1),maxHoles,holesAtEnd:r.obstacles.filter(o=>o.demonHole).length,firstEvents:events.slice(0,16),proxy:'stationary invulnerable auto-fire; not a human playthrough'};
}
function probeFootprints(){
 const s=createPractice('demon','fire',66),r=currentRoom(s),p=s.player,d=r.demon;
 s.entryGrace=0;s.invulnerable=1e6;s.attack=1e6;
 const positions=[[360,300],[480,300],[600,300],[700,220]];p.x=positions[0][0];p.y=positions[0][1];
 let jumps=0,maxHoles=0,previousAttack=null;
 for(let tick=0;tick<60/dt;tick++){
  if(d.attack?.kind==='footJump'&&d.attack!==previousAttack){jumps++;previousAttack=d.attack;const next=positions[jumps%positions.length];p.x=next[0];p.y=next[1];}
  stepRun(s,dt);maxHoles=Math.max(maxHoles,r.obstacles.filter(o=>o.demonHole).length);
 }
 return {seconds:60,jumps,maxHoles,holesAtEnd:r.obstacles.filter(o=>o.demonHole).length,proxy:'invulnerable no-fire scripted dodge; not a human playthrough'};
}
function countEncounters(){
 const result={};
 for(let floor=5;floor<=8;floor++)result[floor+1]={ascent:{},return:{}};
 for(const seed of [11,29,47,83,131,197,251,307,401,503]){
  const s=newRun(seed,{campaign:'expanded'});
  for(let floor=5;floor<=8;floor++)for(const r of s.floors[floor])if(r.type==='normal')for(const e of r.enemies)result[floor+1].ascent[e.type]=(result[floor+1].ascent[e.type]||0)+1;
  enrage(s);
  for(let floor=5;floor<=8;floor++)for(const r of s.floors[floor])if(r.type==='normal')for(const e of r.enemies)result[floor+1].return[e.type]=(result[floor+1].return[e.type]||0)+1;
 }
 return result;
}
const bosses=[measureBoss('commander','fire',98),measureBoss('commander','fire',98,2),measureBoss('commander','frost',98),measureBoss('demon','fire',66),measureBoss('demon','fire',66,2)];
console.log(JSON.stringify({fixture:'2026-09-30',bosses,footprintProbe:probeFootprints(),encounters:countEncounters()},null,2));
