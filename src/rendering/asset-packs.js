import {assetFiles} from './asset-manifest.js';
import {activateAssetFiles} from './asset-requests.js';
const common=['hero-sprite','grunt-sprite','companion-roll-art','skill-icons','relic-icons','xp-shards','spectral-blade'];
const early=['chaser-walk','chaser-slash','archer-walk','charger-walk','scatter-walk','ricochet-walk','laser-walk','brute-walk'];
const warden=['warden-sprite','warden-motion','warden-walk','warden-recover','warden-presentation-art'];
const upper=['astral-sniper-sprite','gravity-mage-sprite','star-knight-sprite','star-bearer-sprite','royal-guard-sprite','pulse-turret-sprite','rift-hunter-sprite','shadow-aura'];
const infernal=['demon-captain-sprite','demon-archer-sprite','demon-soldier-sprite','demon-bat-sprite','spike-nest-sprite','ambusher-sprite','ringcaster-sprite','strafer-sprite'];
const halls=[null,'guard-hall-atlas-v1.png','archive-atlas-v1.png','prism-hall-atlas-v1.png','infested-hall-atlas-v1.png','infested-hall-atlas-v1.png','royal-hall-atlas-v1.png','royal-hall-atlas-v1.png','infernal-hall-atlas-v1.png','infernal-hall-atlas-v1.png'];
export function floorAssetPlan(floor){
 if(!Number.isInteger(floor)||floor<0||floor>9)throw Error('Invalid asset floor');
 const modules=[...common,...early],feedback=['named-brute'];
 if(floor===1)modules.push(...warden,'warden-room-art');
 if(floor>=3)modules.push('flower-sprite','prism-sprite','slime-sprite','prism-presentation-art');
 if(floor>=6){modules.push(...upper);feedback.push('upper');}
 if(floor===7){modules.push('mordo-phase1-sprite','mordo-phase2-sprite','mordo-phase3-sprite','mordo-presentation-art');feedback.push('bosses');}
 if(floor>=8){modules.push('commander-phase1-sprite','commander-phase2-sprite','velkar-presentation-art',...infernal);feedback.push('demons','bosses');}
 if(floor===9)modules.push('demon-sprite','demon-core-sprite','demon-presentation-art');
 return {modules:[...new Set(modules)],feedback,extra:['environment-hall-atlas-v1.png','environment-stone-reference-v1.png',halls[floor]].filter(Boolean)};
}
export function portraitAssetPlan(key){
 if(key==='warden')return {modules:warden,feedback:[],extra:[]};
 if(['kald','vera','brute'].includes(key))return {modules:[],feedback:['named-brute'],extra:[]};
 if(key==='king')return {modules:['mordo-phase3-sprite','shadow-aura'],feedback:['bosses'],extra:[]};
 if(key==='commander')return {modules:['commander-phase1-sprite','shadow-aura'],feedback:['bosses'],extra:[]};
 if(key==='demon')return {modules:['demon-sprite','demon-core-sprite','demon-presentation-art','shadow-aura'],feedback:[],extra:[]};
 const module=({'astralSniper':'astral-sniper-sprite',gravityMage:'gravity-mage-sprite',starKnight:'star-knight-sprite',starBearer:'star-bearer-sprite',royalGuard:'royal-guard-sprite',pulseTurret:'pulse-turret-sprite',riftHunter:'rift-hunter-sprite',minislime:'slime-sprite',demonSoldier:'demon-soldier-sprite',demonArcher:'demon-archer-sprite',demonCaptain:'demon-captain-sprite',demonBat:'demon-bat-sprite',spikeNest:'spike-nest-sprite'})[key]||(['flower','prism','slime','ambusher','ringcaster','strafer'].includes(key)?key+'-sprite':'grunt-sprite');
 return {modules:[module,...(key==='riftHunter'?['shadow-aura']:[])],feedback:[],extra:[]};
}
export function assetPlanFiles(plan){
 return [...new Set([...plan.modules.flatMap(name=>{if(!assetFiles[name])throw Error('Unknown asset module '+name);return assetFiles[name];}),...plan.feedback.map(name=>'feedback-'+name+'-v1.png'),...(plan.extra||[])])];
}
export const activateAssetPlan=plan=>activateAssetFiles(assetPlanFiles(plan));
