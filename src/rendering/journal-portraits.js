import {demonArcherSpriteReady,demonArcherSpriteState} from './demon-archer-sprite.js';
import {demonSoldierSpriteReady,demonSoldierSpriteState} from './demon-soldier-sprite.js';
import {spikeNestSpriteReady,spikeNestSpriteState} from './spike-nest-sprite.js';
import {demonBatSpriteReady,demonBatSpriteState} from './demon-bat-sprite.js';
import {demonCoreSpriteReady,demonCoreSpriteState} from './demon-core-sprite.js';
import {demonSpriteReady,demonSpriteState} from './demon-sprite.js';
import {commanderPhase2SpriteReady,commanderPhase2SpriteState} from './commander-phase2-sprite.js';
import {commanderPhase1SpriteReady,commanderPhase1SpriteState} from './commander-phase1-sprite.js';
import {mordoPhase3SpriteReady,mordoPhase3SpriteState} from './mordo-phase3-sprite.js';
import {mordoPhase2SpriteReady,mordoPhase2SpriteState} from './mordo-phase2-sprite.js';
import {mordoPhase1SpriteReady,mordoPhase1SpriteState} from './mordo-phase1-sprite.js';
import {riftHunterSpriteReady,riftHunterSpriteState} from './rift-hunter-sprite.js';
import {shadowAuraReady,shadowAuraState} from './shadow-aura.js';
import {pulseTurretSpriteReady,pulseTurretSpriteState} from './pulse-turret-sprite.js';
import {royalGuardSpriteReady,royalGuardSpriteState} from './royal-guard-sprite.js';
import {starBearerSpriteReady,starBearerSpriteState} from './star-bearer-sprite.js';
import {starKnightSpriteReady,starKnightSpriteState} from './star-knight-sprite.js';
import {wardenSpriteReady,wardenSpriteState} from './warden-sprite.js';
import {flowerSpriteReady,flowerSpriteState} from './flower-sprite.js';
import {prismSpriteReady,prismSpriteState} from './prism-sprite.js';
import {slimeSpriteReady,slimeSpriteState} from './slime-sprite.js';
import {astralSniperSpriteReady,astralSniperSpriteState} from './astral-sniper-sprite.js';
import {gravityMageSpriteReady,gravityMageSpriteState} from './gravity-mage-sprite.js';
import {drawPixelActor} from './pixel-world.js';
import {gruntSpriteReady,gruntSpriteState} from './grunt-sprite.js';
import {drawUpper} from './upper-visuals.js';
import {upperTypes} from '../combat/upper-floors.js';
import {drawCommander} from './commander-visuals.js';
import {drawDemon} from './demon-visuals.js';
import {drawInfernal,infernalTypes} from '../combat/infernal-enemies.js';
import {drawReturnEnemy} from '../combat/return-enemies.js';
import {drawEnemyDetails} from '../combat/brute.js';
import {drawPoisonEnemy} from '../combat/poison.js';
import {drawPrism} from '../combat/prism.js';
import {enemyGuide} from '../world/expedition.js';

const cache=new Map(),pendingRoots=new WeakSet();
// Render once, using the same bodies as combat. Never mutate the expedition.
function portrait(key,part){
 const id=key+':'+part+':'+(key==='demonArcher'?demonArcherSpriteState().ready:key==='demonSoldier'?demonSoldierSpriteState().ready:key==='spikeNest'?spikeNestSpriteState().ready:key==='demonBat'?demonBatSpriteState().ready:key==='demon'?demonSpriteState().parts.join(',')+':'+demonCoreSpriteState().ready+':'+shadowAuraState().ready:key==='commander'?commanderPhase1SpriteState().ready+':'+commanderPhase2SpriteState().ready+':'+shadowAuraState().ready:key==='king'?mordoPhase1SpriteState().ready+':'+mordoPhase2SpriteState().ready+':'+mordoPhase3SpriteState().ready+':'+shadowAuraState().ready:key==='riftHunter'?riftHunterSpriteState().ready+':'+shadowAuraState().ready:key==='pulseTurret'?pulseTurretSpriteState().ready:key==='royalGuard'?royalGuardSpriteState().ready:key==='starBearer'?starBearerSpriteState().ready:key==='starKnight'?starKnightSpriteState().ready:key==='gravityMage'?gravityMageSpriteState().ready:key==='astralSniper'?astralSniperSpriteState().ready:['slime','minislime'].includes(key)?slimeSpriteState().ready:key==='prism'?prismSpriteState().ready:key==='flower'?flowerSpriteState().ready:key==='warden'?wardenSpriteState().ready:gruntSpriteState().types.includes(key));if(cache.has(id))return cache.get(id);
 const source=document.createElement('canvas');source.width=384;source.height=384;
 const c=source.getContext('2d'),boss=['warden','prism','slime','king','commander','demon'].includes(key);
 const e={x:192,y:250,type:boss?'boss':key,hp:100,max:100,id:0,tier:0,part:part||'core'};
 if(boss&&key!=='warden')e.variant=key;
 if(key==='slime')e.stage=0;
 if(key==='king')e.hp=25; // The final form includes all identifying features.
 if(key==='commander')e.commander={phase:1};
 if(e.variant==='demon')drawDemon(c,e,0,false,true);
 else if(e.variant==='commander')drawCommander(c,e,0,false,true);
 else if(e.variant==='king'||upperTypes.includes(key))drawUpper(c,e,0,false,true);
 else if(infernalTypes.includes(key))drawInfernal(c,e,0,true,true);
 else if(key==='prism')drawPrism(c,e,[],[],0);
 else if(['slime','flower','minislime'].includes(key))drawPoisonEnemy(c,e);
 else if(key==='brute')drawEnemyDetails(c,e);
 else {drawPixelActor(c,e);drawReturnEnemy(c,e);}
 // Fit the visible body to the tile, including wings, horns and the large core.
 const pixels=c.getImageData(0,0,384,384).data;let left=384,top=384,right=0,bottom=0;
 for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(pixels[(y*384+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const result=document.createElement('canvas');result.width=160;result.height=160;
 if(left<=right){const w=right-left+1,h=bottom-top+1,scale=Math.min(144/w,144/h,2),ctx=result.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(source,left,top,w,h,Math.round((160-w*scale)/2),Math.round((160-h*scale)/2),Math.round(w*scale),Math.round(h*scale));}
 cache.set(id,result);return result;
}
export function renderJournalPortraits(root){
 if(!pendingRoots.has(root)){pendingRoots.add(root);Promise.all([demonArcherSpriteReady,demonSoldierSpriteReady,spikeNestSpriteReady,demonBatSpriteReady,demonCoreSpriteReady,demonSpriteReady,gruntSpriteReady,wardenSpriteReady,flowerSpriteReady,prismSpriteReady,slimeSpriteReady,commanderPhase1SpriteReady,commanderPhase2SpriteReady,mordoPhase1SpriteReady,mordoPhase2SpriteReady,mordoPhase3SpriteReady,riftHunterSpriteReady,shadowAuraReady,pulseTurretSpriteReady,royalGuardSpriteReady,starBearerSpriteReady,starKnightSpriteReady,astralSniperSpriteReady,gravityMageSpriteReady]).then(()=>{if(root.isConnected)renderJournalPortraits(root);});}
 for(const canvas of root.querySelectorAll('canvas[data-enemy]')){
  const key=canvas.dataset.enemy,part=canvas.dataset.part;
  if(!Object.hasOwn(enemyGuide,key)||part&&!['hand','foot','eye','nose','mouth','core'].includes(part))continue;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(portrait(key,part),0,0,canvas.width,canvas.height);
 }
}


