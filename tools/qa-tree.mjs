import {newRun,currentRoom} from '../engine.js';
import {stepRun} from '../simulation.js';
import {encodeSave,parseSave,RELEASE} from '../storage.js';
import {mainSkills} from '../skill-tree.js';
import {writeFileSync} from 'node:fs';
const results=[];
for(const mainSkill of mainSkills){
 let s=newRun(914),r=currentRoom(s);r.obstacles=[];r.enemies=Array.from({length:32},(_,id)=>({id,type:'archer',x:530+id%4*38,y:140+Math.floor(id/4)*35,hp:100000,max:100000,cd:999,balanceVersion:1}));
 Object.assign(s.player,{mainSkill,[mainSkill]:3,split:4,pierce:3,haste:5,power:5,repeat:1,aura:3,homing:1});s.invulnerable=999;
 let peakZones=0,peakBullets=0;const start=performance.now();
 for(let i=0;i<3600;i++){stepRun(s,1/60);peakZones=Math.max(peakZones,currentRoom(s).fireZones?.length||0);peakBullets=Math.max(peakBullets,s.projectiles.length);if(i%1200===1199)s=parseSave(encodeSave(s));}
 results.push({mainSkill,simulatedSeconds:60,wallMilliseconds:Math.round(performance.now()-start),peakZones,peakBullets,damageDealt:s.metrics.damageDealt,saveResumeChecks:3});
}
const report={release:RELEASE,results,limitations:'Node CPU only: 32 passive high-HP targets, invulnerable player, maximum support build. Not human balance or browser FPS validation.'};writeFileSync(new URL('../docs/qa-tree.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
