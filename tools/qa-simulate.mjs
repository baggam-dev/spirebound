import {writeFileSync,mkdirSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {newRun,currentRoom} from '../engine.js';
import {stepRun,enterRoom} from '../simulation.js';
import {applySkill} from '../progression.js';
import {castUltimate,ultimateUnlocked} from '../abilities.js';
import {safeSpawn} from '../terrain.js';
import {encodeSave,parseSave} from '../storage.js';
const started=performance.now(),rows=[];
function bot(s){
 const p=s.player,enemies=currentRoom(s).enemies.filter(e=>e.hp>0),nearest=enemies.slice().sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 let x=0,y=0;if(nearest){const dx=p.x-nearest.x,dy=p.y-nearest.y,d=Math.hypot(dx,dy)||1;const approach=d>300?-1:d<180?1:0;x=dx/d*approach-dy/d*.8;y=dy/d*approach+dx/d*.8;}
 for(const b of s.projectiles||[])if(b.enemy){const dx=p.x-(b.x+b.vx*.15),dy=p.y-(b.y+b.vy*.15),d=Math.hypot(dx,dy);if(d<85){x+=dx/(d||1)*2;y+=dy/(d||1)*2;}}
 for(const e of enemies){if(e.phase==='windup'||e.attackPhase==='warning'&&e.pattern==='slam'){const dx=p.x-(e.landX??e.targetX),dy=p.y-(e.landY??e.targetY),d=Math.hypot(dx,dy);if(d<120){x+=dx/(d||1)*3;y+=dy/(d||1)*3;}}
  if(e.phase==='aim'||e.prismPhase==='warning'){const a=e.aim;if(a!==undefined){const lateral=(p.x-e.x)*-Math.sin(a)+(p.y-e.y)*Math.cos(a),sign=lateral>=0?1:-1;x+=-Math.sin(a)*sign;y+=Math.cos(a)*sign;}}
 }
 if(p.x<130)x+=2;if(p.x>830)x-=2;if(p.y<120)y+=2;if(p.y>425)y-=2;return {x,y};
}
for(let seed=1;seed<=6;seed++)for(let floor=0;floor<4;floor++)for(const strategy of ['stand','kite']){
 const s=newRun(seed);s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='normal'&&r.enemies.length);s.player.x=480;s.player.y=300;safeSpawn(s.player,currentRoom(s).obstacles,14);
 const picks=['split','pierce','fire','frost','haste','chain','split','haste'];for(let i=0;i<floor*2;i++)applySkill(s.player,picks[i]);s.player.damage=17+floor*6;s.player.max=s.player.hp=5+floor;s.player.level=1+floor*2;
 enterRoom(s);const count=currentRoom(s).enemies.length;let savedChecks=0;
 for(let i=0;i<3600&&s.player.hp>0&&currentRoom(s).enemies.length;i++){
  if(strategy==='kite'&&s.player.hp<=2&&s.player.potions){s.player.potions--;s.player.hp=Math.min(s.player.max,s.player.hp+2);}
  if(strategy==='kite'&&ultimateUnlocked(s.player)&&s.skill<=0)castUltimate(s);
  stepRun(s,1/60,strategy==='kite'?bot(s):{x:0,y:0});
  // This experiment freezes the chosen build rather than emulating level-up choices.
  s.pendingLevels=0;
  if(s.player.hp>0&&i%120===0){parseSave(encodeSave(s));savedChecks++;}
 }
 rows.push({seed,floor:floor+1,strategy,enemies:count,cleared:!currentRoom(s).enemies.length,survived:s.player.hp>0,seconds:Number(s.elapsed.toFixed(2)),hp:s.player.hp,kills:s.kills,savedChecks});
}
const summary=rows.reduce((out,row)=>{const key=`${row.floor}F-${row.strategy}`,group=out[key]??={trials:0,clears:0,survivors:0,seconds:0};group.trials++;group.clears+=Number(row.cleared);group.survivors+=Number(row.survived);group.seconds+=row.seconds;return out;},{});
for(const group of Object.values(summary))group.averageSeconds=Number((group.seconds/group.trials).toFixed(2));
mkdirSync('docs',{recursive:true});writeFileSync('docs/qa-simulation.json',JSON.stringify({purpose:'Deterministic isolated-room smoke tests. Not human playtesting or a difficulty recommendation.',limitations:['No navigation or full-run resource economy','Bot sees positions and has instantaneous decisions','Build fixed per floor; no level-up choices during encounter','60-second timeout is not a defeat'],runtimeSeconds:(performance.now()-started)/1000,summary,rows},null,2));console.log(JSON.stringify(summary,null,2));
