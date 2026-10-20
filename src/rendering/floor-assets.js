import {environmentArtReady} from './environment-art.js';
import {environmentReferenceReady} from './environment-material.js';
import {loadGuardHallArt} from './guard-hall-art.js';
import {loadArchiveArt} from './archive-art.js';
import {loadPrismHallArt} from './prism-hall-art.js';
import {loadInfestedHallArt} from './infested-hall-art.js';
import {loadRoyalHallArt,loadInfernalHallArt} from './upper-hall-art.js';

const common=['hero-sprite','grunt-sprite','feedback-sprites','companion-roll-art','skill-icons','relic-icons','xp-shards','spectral-blade'];
const early=['chaser-walk','chaser-slash','archer-walk','charger-walk','scatter-walk','ricochet-walk','laser-walk','brute-walk'];
const upper=['astral-sniper-sprite','gravity-mage-sprite','star-knight-sprite','star-bearer-sprite','royal-guard-sprite','pulse-turret-sprite','rift-hunter-sprite','shadow-aura'];
const demon=['demon-sprite','demon-core-sprite','demon-presentation-art','demon-captain-sprite','demon-archer-sprite','demon-soldier-sprite','demon-bat-sprite','spike-nest-sprite','ambusher-sprite','ringcaster-sprite','strafer-sprite'];
const readyFloors=new Set(),pending=new Map();
export const floorAssetsLoaded=floor=>readyFloors.has(floor);
export const floorHallLoader=floor=>floor===1?loadGuardHallArt:floor===2?loadArchiveArt:floor===3?loadPrismHallArt:floor===4||floor===5?loadInfestedHallArt:floor===6||floor===7?loadRoyalHallArt:floor>=8?loadInfernalHallArt:null;
async function moduleReady(name){
 const module=await import(`./${name}.js`);
 const waits=Object.entries(module).filter(([key])=>key.endsWith('Ready')).map(([,value])=>value);
 if(!waits.length)throw Error('Missing readiness: '+name);
 const results=await Promise.all(waits);
 if(results.some(value=>value===false||Array.isArray(value)&&value.some(v=>v===false)))throw Error('Image unavailable: '+name);
}
export function prepareFloorAssets(floor){
 if(readyFloors.has(floor))return Promise.resolve();
 if(pending.has(floor))return pending.get(floor);
 const names=[...common,...early];
 if(floor===1)names.push('warden-sprite','warden-presentation-art','warden-room-art');
 if(floor>=3)names.push('flower-sprite','prism-sprite','slime-sprite','prism-presentation-art');
 if(floor>=6)names.push(...upper);
 if(floor>=7)names.push('mordo-phase1-sprite','mordo-phase2-sprite','mordo-phase3-sprite','mordo-presentation-art');
 if(floor>=8)names.push('commander-phase1-sprite','commander-phase2-sprite','velkar-presentation-art',...demon);
 const work=(async()=>{
  const base=await Promise.all([environmentArtReady,environmentReferenceReady]);
  if(base.some(v=>v===false))throw Error('Environment unavailable');
  const hall=floorHallLoader(floor);if(hall&&!await hall())throw Error('Floor unavailable');
  await Promise.all([...new Set(names)].map(moduleReady));readyFloors.add(floor);
 })();
 pending.set(floor,work);work.catch(()=>pending.delete(floor));return work;
}
