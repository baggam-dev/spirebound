const kinds=['hand','footJump','footDash','eyeRay','eyeOrb','noseTrail','mouthPull','mouthPush','mouthTongue','coreBurst'];
const parts=['hand','foot','eye','nose','mouth','core'];
export function validateDemonPressure(r,s,check,number){
 const d=r.demon;if(d?.pressureVersion===undefined)return;
 check(d.pressureVersion===1&&s.generationVersion>=32);
 check(Array.isArray(d.attacks)&&d.attacks.length<=2&&new Set(d.attacks.map(a=>a.owner)).size===d.attacks.length);
 for(const a of d.attacks){check(kinds.includes(a.kind)&&parts.includes(a.owner)&&number(a.time,0,1.1)&&number(a.x,0,960)&&number(a.y,0,540)&&number(a.tx,0,960)&&number(a.ty,0,540)&&number(a.aim,-Math.PI,Math.PI));if(a.finger!==undefined)check(a.kind==='hand'&&Number.isInteger(a.finger)&&number(a.finger,0,4));}
 check(d.partClocks&&typeof d.partClocks==='object'&&!Array.isArray(d.partClocks));for(const [k,v] of Object.entries(d.partClocks))check(parts.includes(k)&&number(v,0,3));
 check(number(d.specialClock,0,3)&&number(d.summonClock,0,6));
 if(d.special)check(['flame','ice','zeus'].includes(d.special.kind)&&number(d.special.x,35,925)&&number(d.special.y,50,490)&&d.special.radius===60&&number(d.special.time,0,3));
 if(d.flash)check(['flame','ice','zeus'].includes(d.flash.kind)&&number(d.flash.x,35,925)&&number(d.flash.y,50,490)&&d.flash.radius===60&&number(d.flash.time,0,.6));
 check(Array.isArray(d.fields)&&d.fields.length<=2);for(const f of d.fields)check(number(f.x,35,925)&&number(f.y,50,490)&&f.radius===86&&number(f.time,0,3));
 for(const e of r.enemies){if(e.demonShield!==undefined)check(e.variant==='demon'&&e.part==='foot'&&typeof e.demonShield==='boolean'&&number(e.demonShieldClock,0,5));if(e.demonAuraClock!==undefined)check(e.variant==='demon'&&['hand','nose'].includes(e.part)&&number(e.demonAuraClock,0,.8));}
}
