import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
import {castUltimate} from '../../src/combat/abilities.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
const rows=[];
for(const seed of [11,31,47])for(const branch of ['burst','turret'])for(const critical of [false,true]){
 const s=newRun(seed);s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='normal'&&!r.supportEncounter&&!r.sealEngine);s.tutorialComplete=true;
 const r=currentRoom(s);r.obstacles=[];r.enemies=[{id:0,type:'chaser',x:650,y:270,hp:100000,max:100000,cd:99,frozen:4.9,balanceVersion:1}];delete r.specialEncounter;
 Object.assign(s.player,{x:480,y:270,ultimate:1,evolutions:{ultimate:branch},critChance:critical?.5:0,critMultiplier:critical?2.5:1.5});enterRoom(s);s.attack=999;s.invulnerable=999;const before=r.enemies[0].hp;assert.ok(castUltimate(s));
 for(let frame=0;frame<15*60;frame++){r.enemies[0].frozen=4.9;stepRun(s,1/60);}const damage=before-r.enemies[0].hp;assert.ok(damage>0&&Number.isFinite(damage));
 assert.ok(parseSave(encodeSave(s)),'save '+branch);rows.push({seed,branch,critical,damage,criticalHits:s.critical.criticalHits});
}
for(const seed of [11,31,47]){const rain=rows.find(r=>r.seed===seed&&r.branch==='burst'&&!r.critical);assert.equal(rain.damage,510,'six nerfed rain pulses');for(const branch of ['burst','turret'])assert.ok(rows.find(r=>r.seed===seed&&r.branch===branch&&r.critical).damage>=rows.find(r=>r.seed===seed&&r.branch===branch&&!r.critical).damage);}
// Unmodified player stats; smoke gameplay with movement and periodic save validation.
const smoke=[];for(const seed of [11,31,47]){const s=newRun(seed);s.tutorialComplete=true;s.room=1;enterRoom(s);let frames=0;for(;frames<1800&&s.player.hp>0;frames++){stepRun(s,1/60,{x:Math.cos(frames/110),y:Math.sin(frames/110)});if(frames%300===0)assert.ok(parseSave(encodeSave(s)),'ordinary gameplay save');}smoke.push({seed,seconds:frames/60,hp:s.player.hp,kills:s.kills,level:s.player.level});}
const report={controlledStationaryTarget:true,autoAttacksDisabled:true,normalHumanDifficultyNotMeasured:true,rows,smoke};await writeFile(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report));
