import {createPractice} from '../../src/game/boss-practice.js';
import {currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';

function measure(boss,main,seed){
 const s=createPractice(boss,main,seed),r=currentRoom(s);s.invulnerable=1e6;s.entryGrace=0;
 const limit=boss==='demon'?240:180;let seconds=limit;
 for(let tick=0;tick<limit*60;tick++){stepRun(s,1/60);if(!r.enemies.some(e=>e.hp>0&&e.type==='boss')){seconds=(tick+1)/60;break;}}
 return {boss,main,seed,seconds:+seconds.toFixed(2),cleared:seconds<limit,branch:s.player.evolutions?.precision||null,damage:Math.round(s.metrics?.damageDealt||0)};
}
console.log(JSON.stringify([measure('commander','fire',98),measure('commander','precision',98),measure('demon','fire',66),measure('demon','precision',66)],null,2));
