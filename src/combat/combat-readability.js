import {characterSizes} from '../rendering/character-sizes.js';
// Rendering-only density control. Damage, bullets, hazards and hit directions stay intact.
export function combatEffectVisible(f,reduced=false){
 if(f.turretMuzzle)return false; // Drawn only with the turret structure pass.
 return !reduced||!!(f.xpPickup||f.hunterSeal||f.text||f.arrowImpact||f.hitElement||f.slash||f.playerBlast||f.groundBurst||
  f.enemyFeedback==='death'&&(f.crest||f.demonCore||f.warden||f.prism||f.remainingBoss&&!f.split||f.ordinary&&f.style!=='batExplosion'));
}
export function readableEffects(effects,compact=false,reduced=false){
 if(!compact&&!reduced)return effects;
 const cells=new Set(),keep=new Set(),tiers=[[],[],[],[],[]];let accents=0;
 for(let i=effects.length-1;i>=0;i--){const f=effects[i];
  if(!combatEffectVisible(f,reduced))continue;
  if(f.text||f.precisionBurst||f.precision||f.thunder||f.enemyFeedback==='death'||(!f.arrowImpact&&!f.hitElement&&!f.playerBlast&&!f.synergyEffect&&f.enemyFeedback!=='hit')){keep.add(f);continue;}
  tiers[f.playerBlast||f.synergyEffect?4:f.hitElement?(f.small?2:3):f.arrowImpact?1:0].push(f);
 }
 // A late ordinary hit must not consume the space needed by a real blast or
 // elemental contact. Newest-first within a tier; drawing order stays unchanged.
 for(let tier=4;tier>=0;tier--)for(const f of tiers[tier]){
  const family=f.playerBlast?'blast:'+f.playerBlast:f.synergyEffect?'synergy:'+f.synergyEffect:f.hitElement?'element:'+f.hitElement:f.arrowImpact?'arrow':'glint';
  const key=`${Math.floor(f.x/40)},${Math.floor(f.y/40)},${family}`;
  if(accents<16&&!cells.has(key)){cells.add(key);keep.add(f);accents++;}
 }
 return effects.filter(f=>keep.has(f));
}
export function drawCombatLabels(c,effects,compact=false){
 const labels=effects.filter(f=>f.text),essences=labels.filter(f=>f.essencePickup),placed=[];let row=0;
 c.save();c.textAlign='center';c.strokeStyle='#101016';c.lineWidth=4;
 // Reserve the fixed pickup stack before placing combat labels, even when
 // pickup effects occur later in the original drawing order.
 const pickupBoxes=compact?essences.map((f,i)=>{
  c.font='bold 15px Galmuri, monospace';
  const width=Math.min(884,c.measureText(f.text).width),margin=width/2+8,base=essences[0];
  return {x:Math.max(margin,Math.min(960-margin,base.x)),y:Math.max(62,Math.min(485,Math.max(80,Math.min(470-18*(essences.length-1),base.y+86))+i*18)),width,height:16};
 }):[];
 placed.push(...pickupBoxes);
 for(const f of labels){
  c.font=`bold ${compact?(f.essencePickup?15:18):20}px Galmuri, monospace`;
  let x=f.x,y=f.y-(1-f.t)*22-(f.hitSource?Math.max(0,characterSizes.hero-55):0);
  if(compact&&f.essencePickup){
   const reserved=pickupBoxes[row++];x=reserved.x;y=reserved.y;
  }
  if(compact){
   const width=Math.min(884,c.measureText(f.text).width),height=f.essencePickup?16:20,margin=width/2+8;
   x=Math.max(margin,Math.min(960-margin,x));y=Math.max(62,Math.min(485,y));
   if(!f.essencePickup){
    const base=y;
    // Search nearby rows, bounded to the arena; never move or age the effect.
    search:for(let step=0;step<=20;step++)for(const direction of step?[-1,1]:[0]){
     const candidate=base+step*22*direction;if(candidate<62||candidate>485)continue;
     if(placed.some(p=>Math.abs(p.x-x)<(p.width+width)/2+4&&Math.abs(p.y-candidate)<(p.height+height)/2+2))continue;
     y=candidate;break search;
    }
   }
   if(!f.essencePickup)placed.push({x,y,width,height});
  }
  c.fillStyle=f.color;c.strokeText(f.text,x,y);c.fillText(f.text,x,y);
 }
 c.restore();
}
