import {preparePortraitAssets} from './floor-assets.js';
import {veraSpriteState} from './vera-sprite.js';
import {drawFeedbackSprite,feedbackSpriteState} from './feedback-sprites.js';
import {drawAmbusherSprite,ambusherSpriteState} from './ambusher-sprite.js';
import {drawRingcasterSprite,ringcasterSpriteState} from './ringcaster-sprite.js';
import {drawStraferSprite,straferSpriteState} from './strafer-sprite.js';
import {demonCaptainSpriteState} from './demon-captain-sprite.js';
import {demonArcherSpriteState} from './demon-archer-sprite.js';
import {demonSoldierSpriteState} from './demon-soldier-sprite.js';
import {spikeNestSpriteState} from './spike-nest-sprite.js';
import {demonBatSpriteState} from './demon-bat-sprite.js';
import {demonCoreSpriteState} from './demon-core-sprite.js';
import {demonSpriteState} from './demon-sprite.js';
import {commanderPhase2SpriteState} from './commander-phase2-sprite.js';
import {commanderPhase1SpriteState} from './commander-phase1-sprite.js';
import {mordoPhase3SpriteState} from './mordo-phase3-sprite.js';
import {mordoPhase2SpriteState} from './mordo-phase2-sprite.js';
import {mordoPhase1SpriteState} from './mordo-phase1-sprite.js';
import {riftHunterSpriteState} from './rift-hunter-sprite.js';
import {shadowAuraState} from './shadow-aura.js';
import {pulseTurretSpriteState} from './pulse-turret-sprite.js';
import {royalGuardSpriteState} from './royal-guard-sprite.js';
import {starBearerSpriteState} from './star-bearer-sprite.js';
import {starKnightSpriteState} from './star-knight-sprite.js';
import {wardenSpriteState} from './warden-sprite.js';
import {flowerSpriteState} from './flower-sprite.js';
import {prismSpriteState} from './prism-sprite.js';
import {slimeSpriteState} from './slime-sprite.js';
import {astralSniperSpriteState} from './astral-sniper-sprite.js';
import {gravityMageSpriteState} from './gravity-mage-sprite.js';
import {drawPixelActor} from './pixel-world.js';
import {gruntSpriteState} from './grunt-sprite.js';
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

const cache=new Map(),requested=new WeakSet(),completed=new WeakSet(),observers=new WeakMap();
// Render once, using the same bodies as combat. Never mutate the expedition.
function portrait(key,part){
 const id=key+':'+part+':'+feedbackSpriteState().keys.join(',')+':'+(key==='vera'?veraSpriteState().ready:key==='ambusher'?ambusherSpriteState().ready:key==='ringcaster'?ringcasterSpriteState().ready:key==='strafer'?straferSpriteState().ready:key==='demonCaptain'?demonCaptainSpriteState().ready:key==='demonArcher'?demonArcherSpriteState().ready:key==='demonSoldier'?demonSoldierSpriteState().ready:key==='spikeNest'?spikeNestSpriteState().ready:key==='demonBat'?demonBatSpriteState().ready:key==='demon'?demonSpriteState().parts.join(',')+':'+demonCoreSpriteState().ready+':'+shadowAuraState().ready:key==='commander'?commanderPhase1SpriteState().ready+':'+commanderPhase2SpriteState().ready+':'+shadowAuraState().ready:key==='king'?mordoPhase1SpriteState().ready+':'+mordoPhase2SpriteState().ready+':'+mordoPhase3SpriteState().ready+':'+shadowAuraState().ready:key==='riftHunter'?riftHunterSpriteState().ready+':'+shadowAuraState().ready:key==='pulseTurret'?pulseTurretSpriteState().ready:key==='royalGuard'?royalGuardSpriteState().ready:key==='starBearer'?starBearerSpriteState().ready:key==='starKnight'?starKnightSpriteState().ready:key==='gravityMage'?gravityMageSpriteState().ready:key==='astralSniper'?astralSniperSpriteState().ready:['slime','minislime'].includes(key)?slimeSpriteState().ready:key==='prism'?prismSpriteState().ready:key==='flower'?flowerSpriteState().ready:key==='warden'?wardenSpriteState().ready:gruntSpriteState().types.includes(key));if(cache.has(id))return cache.get(id);
 const source=document.createElement('canvas');source.width=384;source.height=384;
 const c=source.getContext('2d'),boss=['warden','prism','slime','king','commander','demon'].includes(key);
 const e={x:192,y:250,type:boss?'boss':key,hp:100,max:100,id:0,tier:0,part:part||'core'};
 if(boss&&key!=='warden')e.variant=key;
 if(key==='kald'){e.type='starKnight';e.gateTitle='왕의 방패, 칼드';}if(key==='vera'){e.type='astralSniper';e.gateTitle='별의 눈, 베라';}
 if(key==='slime')e.stage=0;
 if(key==='king')e.hp=25; // The final form includes all identifying features.
 if(key==='commander')e.commander={phase:1};
 if(['kald','vera'].includes(key)&&drawFeedbackSprite(c,e,0,{staticPose:true,reduced:true})){}else if(e.variant==='demon')drawDemon(c,e,0,false,true);
 else if(e.variant==='commander')drawCommander(c,e,0,false,true);
 else if(e.variant==='king'||e.gateTitle||upperTypes.includes(key))drawUpper(c,e,0,false,true);
 else if(infernalTypes.includes(key))drawInfernal(c,e,0,true,true);
 else if(key==='prism')drawPrism(c,e,[],[],0,{staticPose:true,reduced:true});
 else if(['slime','flower','minislime'].includes(key))drawPoisonEnemy(c,e,0,{}, {staticPose:true,reduced:true});
 else if(key==='brute')drawEnemyDetails(c,e);
 else if(key==='ambusher'){if(!drawAmbusherSprite(c,e,0,true,true)){drawPixelActor(c,e);drawReturnEnemy(c,e);}}else if(key==='ringcaster'){if(!drawRingcasterSprite(c,e,true)){drawPixelActor(c,e);drawReturnEnemy(c,e);}}else if(key==='strafer'){if(!drawStraferSprite(c,e,0,true,true)){drawPixelActor(c,e);drawReturnEnemy(c,e);}}else {drawPixelActor(c,e);drawReturnEnemy(c,e);}
 // Fit the visible body to the tile, including wings, horns and the large core.
 const pixels=c.getImageData(0,0,384,384).data;let left=384,top=384,right=0,bottom=0;
 for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(pixels[(y*384+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const result=document.createElement('canvas');result.width=160;result.height=160;
 if(left<=right){const w=right-left+1,h=bottom-top+1,scale=Math.min(144/w,144/h,2),ctx=result.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(source,left,top,w,h,Math.round((160-w*scale)/2),Math.round((160-h*scale)/2),Math.round(w*scale),Math.round(h*scale));}
 cache.set(id,result);return result;
}
function paintPortrait(canvas){
 const key=canvas.dataset.enemy,part=canvas.dataset.part;
 if(!Object.hasOwn(enemyGuide,key)||part&&!['hand','foot','eye','nose','mouth','core'].includes(part))return;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(portrait(key,part),0,0,canvas.width,canvas.height);
}
function requestPortrait(canvas){
 if(requested.has(canvas))return;requested.add(canvas);
 canvas.setAttribute('aria-busy','true');
 preparePortraitAssets(canvas.dataset.enemy).then(()=>{completed.add(canvas);canvas.setAttribute('aria-busy','false');canvas.dataset.portraitState='ready';if(canvas.isConnected)paintPortrait(canvas);}).catch(()=>{requested.delete(canvas);canvas.setAttribute('aria-busy','false');if(canvas.isConnected){paintPortraitStatus(canvas,'그림을 불러오지 못했습니다');canvas.dataset.portraitState='error';}});
}
function paintPortraitStatus(canvas,message='그림 준비 중…'){
 canvas.dataset.portraitState='loading';const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#a9aca3';c.font=`${Math.max(10,Math.round(canvas.width/18))}px Galmuri, monospace`;c.textAlign='center';c.fillText(message,canvas.width/2,canvas.height/2,canvas.width-12);
}
export function renderJournalPortraits(root){
 let observer=observers.get(root);
 if(!observer&&typeof IntersectionObserver!=='undefined'){
  observer=new IntersectionObserver(entries=>{if(!root.isConnected){observer.disconnect();return;}for(const entry of entries)if(entry.isIntersecting){requestPortrait(entry.target);observer.unobserve(entry.target);}},{rootMargin:'60px'});observers.set(root,observer);
 }
 for(const canvas of root.querySelectorAll('canvas[data-enemy]')){
  if(completed.has(canvas))paintPortrait(canvas);else paintPortraitStatus(canvas);
  if(canvas.closest('.bestiary-stage')||!observer)requestPortrait(canvas);else observer.observe(canvas);
 }
}
