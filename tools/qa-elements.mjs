import {newRun,currentRoom} from '../engine.js';
import {stepRun} from '../simulation.js';
import {encodeSave,parseSave,RELEASE} from '../storage.js';
import {writeFileSync} from 'node:fs';
let s=newRun(913);const r=currentRoom(s);r.obstacles=[];
r.enemies=Array.from({length:32},(_,id)=>({id,type:'archer',x:530+id%4*38,y:140+Math.floor(id/4)*35,hp:100000,max:100000,cd:999,balanceVersion:1}));
Object.assign(s.player,{fire:3,poison:3,split:4,pierce:3,haste:5});s.invulnerable=999;
let peakZones=0,peakStacks=0;const started=performance.now();
for(let i=0;i<7200;i++){stepRun(s,1/60);peakZones=Math.max(peakZones,currentRoom(s).fireZones?.length||0);peakStacks=Math.max(peakStacks,...currentRoom(s).enemies.map(e=>e.poisonStacks?.length||0));if(i%1200===1199)s=parseSave(encodeSave(s));}
const report={release:RELEASE,simulatedSeconds:120,wallMilliseconds:Math.round(performance.now()-started),enemies:32,peakZones,peakStacks,damageDealt:s.metrics.damageDealt,saveResumeChecks:6,limitations:'Node CPU smoke test with invulnerable player, high-HP passive targets and all elemental/arrow skills maxed. Not browser FPS or human balance validation.'};
writeFileSync(new URL('../docs/qa-elements.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
