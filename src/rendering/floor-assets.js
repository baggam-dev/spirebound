import {floorAssetPlan,portraitAssetPlan,activateAssetPlan} from './asset-packs.js';
import {feedbackSpritesReadyFor} from './feedback-sprites.js';
import {environmentArtReady} from './environment-art.js';
import {environmentReferenceReady} from './environment-material.js';
import {loadGuardHallArt} from './guard-hall-art.js';
import {loadArchiveArt} from './archive-art.js';
import {loadPrismHallArt} from './prism-hall-art.js';
import {loadInfestedHallArt} from './infested-hall-art.js';
import {loadRoyalHallArt,loadInfernalHallArt} from './upper-hall-art.js';

const readyHalls=new Set(),readyModules=new Set(),readyFeedback=new Set(),pending=new Map();
export const floorAssetsLoaded=(floor,options)=>{const p=floorAssetPlan(floor,options);return readyHalls.has(floor)&&p.modules.every(m=>readyModules.has(m))&&p.feedback.every(g=>readyFeedback.has(g));};
export const floorHallLoader=floor=>floor===1?loadGuardHallArt:floor===2?loadArchiveArt:floor===3?loadPrismHallArt:floor===4||floor===5?loadInfestedHallArt:floor===6||floor===7?loadRoyalHallArt:floor>=8?loadInfernalHallArt:null;
async function moduleReady(name){
 const module=await import(`./${name}.js`);
 const waits=Object.entries(module).filter(([key])=>key.endsWith('Ready')).map(([,value])=>value);
 if(!waits.length)throw Error('Missing readiness: '+name);
 const results=await Promise.all(waits);
 if(results.some(value=>value===false||Array.isArray(value)&&value.some(v=>v===false)))throw Error('Image unavailable: '+name);
}
export function prepareFloorAssets(floor,options={}){
 if(floorAssetsLoaded(floor,options))return Promise.resolve();
 const plan=floorAssetPlan(floor,options),key=floor+':'+[...plan.modules].sort().join(',')+':'+[...plan.feedback].sort().join(',');
 if(pending.has(key))return pending.get(key);
 activateAssetPlan(plan);
 const work=(async()=>{
  const base=await Promise.all([environmentArtReady,environmentReferenceReady]);
  if(base.some(v=>v===false))throw Error('Environment unavailable');
  const hall=floorHallLoader(floor);if(hall&&!await hall())throw Error('Floor unavailable');
  await Promise.all([...plan.modules.map(moduleReady),feedbackSpritesReadyFor(plan.feedback).then(ok=>{if(!ok)throw Error('Feedback unavailable');})]);readyHalls.add(floor);for(const m of plan.modules)readyModules.add(m);for(const g of plan.feedback)readyFeedback.add(g);
 })();
 pending.set(key,work);work.catch(()=>pending.delete(key));return work;
}

const portraits=new Map();
export function preparePortraitAssets(key){
 if(portraits.has(key))return portraits.get(key);
 const plan=portraitAssetPlan(key);activateAssetPlan(plan);
 const work=Promise.all([...plan.modules.map(moduleReady),feedbackSpritesReadyFor(plan.feedback).then(ok=>{if(!ok)throw Error('Portrait unavailable');})]).then(()=>{for(const m of plan.modules)readyModules.add(m);for(const g of plan.feedback)readyFeedback.add(g);});portraits.set(key,work);work.catch(()=>portraits.delete(key));return work;
}
