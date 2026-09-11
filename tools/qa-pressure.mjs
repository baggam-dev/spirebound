import {RELEASE} from '../storage.js';
import {newRun,currentRoom,enrage} from '../engine.js';
import {stepRun} from '../simulation.js';
import {encodeSave,parseSave} from '../storage.js';
import {writeFileSync} from 'node:fs';
const results=[];
for(const scene of ['warden','prism','slime','escape']){
 let s=newRun(917);s.floor=scene==='warden'?1:scene==='prism'?3:5;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');
 if(scene==='escape'){enrage(s);s.floor=0;s.room=s.floors[0].findIndex(r=>r.enemies.some(e=>e.type==='scatter'));if(s.room<0)s.room=0;}
 currentRoom(s).seen=true;s.player.x=480;s.player.y=360;s.attack=999;s.invulnerable=999;
 let peakBullets=0,peakHazards=0,peakEnemies=0,slowest=0;const start=performance.now();
 for(let i=0;i<7200;i++){
  const t=performance.now();stepRun(s,1/60);slowest=Math.max(slowest,performance.now()-t);
  peakBullets=Math.max(peakBullets,s.projectiles.length);peakHazards=Math.max(peakHazards,currentRoom(s).hazards?.length||0);peakEnemies=Math.max(peakEnemies,currentRoom(s).enemies.length);
  if(i%1200===1199)s=parseSave(encodeSave(s));
 }
 results.push({scene,simulatedSeconds:120,wallMilliseconds:Math.round(performance.now()-start),slowestStepMilliseconds:+slowest.toFixed(2),peakBullets,peakHazards,peakEnemies});
}
const report={release:RELEASE,generatedAt:new Date().toISOString(),limitations:'Node CPU simulation only, standing invulnerable player with attacks disabled. This is a correctness/pressure smoke test, not browser FPS or human balance validation.',results};
writeFileSync(new URL('../docs/qa-pressure.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
