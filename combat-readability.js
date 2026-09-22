// Rendering-only density control. Damage, bullets, hazards and hit directions stay intact.
export function readableEffects(effects,compact=false){
 if(!compact)return effects;
 const cells=new Set(),keep=new Set();let accents=0;
 for(let i=effects.length-1;i>=0;i--){const f=effects[i];
  if(!f.hitElement&&f.enemyFeedback!=='hit'){keep.add(f);continue;}
  const key=`${Math.floor(f.x/40)},${Math.floor(f.y/40)},${f.hitElement||'glint'}`;
  if(accents<16&&!cells.has(key)){cells.add(key);keep.add(f);accents++;}
 }
 return effects.filter(f=>keep.has(f));
}
export function drawCombatLabels(c,effects,compact=false){
 const labels=effects.filter(f=>f.text),essences=labels.filter(f=>f.essencePickup);let row=0;
 c.save();c.textAlign='center';c.strokeStyle='#101016';c.lineWidth=4;
 for(const f of labels){
  c.font=`bold ${compact?(f.essencePickup?15:18):20}px Galmuri, monospace`;
  let x=f.x,y=f.y-(1-f.t)*22;
  if(compact&&f.essencePickup){
   const base=essences[0];x=base.x;y=Math.max(80,Math.min(470-18*(essences.length-1),base.y+86))+row++*18;
  }
  if(compact){const margin=Math.min(450,c.measureText(f.text).width/2+8);x=Math.max(margin,Math.min(960-margin,x));y=Math.max(62,Math.min(485,y));}
  c.fillStyle=f.color;c.strokeText(f.text,x,y);c.fillText(f.text,x,y);
 }
 c.restore();
}
