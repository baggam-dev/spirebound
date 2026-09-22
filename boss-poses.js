const clamp=n=>Math.max(0,Math.min(1,n));
// Poses read the existing attack state; they never advance or delay combat.
export function bossPose(e,room={}){
 const p={stage:'idle',charge:0,release:0,bodyY:0,lift:0,weapon:0};
 if(e.darkFlash?.time>0){return {...p,stage:'strike',release:clamp(e.darkFlash.time/.18),weapon:(e.darkFlash.aim||0)+Math.PI/2+.65*(1-e.darkFlash.time/.18)};}
 if(e.kneel>0||e.opening>0)return {...p,stage:'recover',bodyY:e.kneel>0?0:3,weapon:e.kneel>0?Math.PI:.3};
 if(e.darkAttack){const a=e.darkAttack;if(a.moving)return {...p,stage:'strike',release:1,bodyY:-2,weapon:(a.aim||0)+Math.PI/2};
  const duration=a.kind==='slash'?.5:a.kind==='judgment'||a.finisher?1.1:e.type==='astralSniper'?.6:e.variant==='king'&&e.hp/e.max<=.65?.65:.85,charge=clamp(1-a.time/duration);
  return {...p,stage:'windup',charge,bodyY:Math.round(charge*2),weapon:a.kind==='mark'&&a.finisher?Math.PI:(a.aim||0)+Math.PI/2-1.25-charge*.25};
 }
 if(e.variant==='prism'){
  if(e.prismPhase==='warning')return {...p,stage:'windup',charge:clamp(1-e.prismTime/1.3)};
  if(['beam','salvo'].includes(e.prismPhase))return {...p,stage:'strike',release:e.prismPhase==='beam'?clamp(e.prismTime/.45):clamp(e.prismTime/.3)};
  if(e.prismPhase==='recover')return {...p,stage:'recover',bodyY:3};
 }
 if(e.variant==='slime'){
  if(e.phase==='splitJump')return {...p,stage:'air',charge:Math.sin(Math.PI*clamp(1-e.phaseTime/1.1))};
  const hazards=(room.hazards||[]).filter(h=>h.owner===e.id&&h.phase!=='expired'),warning=hazards.findLast(h=>h.phase==='warning');
  if(warning)return {...p,stage:'windup',charge:clamp(1-warning.time/(warning.closeGas?.6:warning.kind==='aura'?1.1:.85))};
  const flight=hazards.findLast(h=>h.phase==='flight');if(flight)return {...p,stage:'strike',release:clamp(flight.time/(flight.flight||.65))};
  const interval=(e.stage||0)===0?2.8:4;if(e.slimeShotClock>interval-.16)return {...p,stage:'strike',release:clamp((e.slimeShotClock-interval+.16)/.16)};
  if(e.slimeShotClock>0&&e.slimeShotClock<.25)return {...p,stage:'windup',charge:1-e.slimeShotClock/.25};
  if(hazards.some(h=>h.kind==='aura'&&h.phase==='active'))return {...p,stage:'channel',charge:.5};
 }
 if(e.type==='boss'&&!e.variant){
  if(e.attackPhase==='warning'){const charge=clamp(1-e.attackTime/(e.pattern==='slam'?1.1:.65));return {...p,stage:'windup',charge,bodyY:Math.round(charge*3),weapon:-.5-charge*.9};}
  if(e.attackPhase==='leap')return {...p,stage:'air',lift:Math.sin(Math.PI*clamp(1-e.attackTime/.5))*42,weapon:-1.5};
  if(e.attackPhase==='firing')return {...p,stage:'strike',release:1,weapon:.45};
  if(e.attackPhase==='recover')return {...p,stage:'recover',bodyY:4,weapon:.7};
 }
 return p;
}
export function drawWeaponStreak(c,x,y,angle,strength){if(!(strength>0))return;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=strength*.5;c.strokeStyle='#e6c6f3';c.lineWidth=2;
 for(let i=0;i<3;i++){c.beginPath();c.moveTo(-5-i*4,-8);c.lineTo(-8-i*5,-28+i*3);c.stroke();}c.restore();}
