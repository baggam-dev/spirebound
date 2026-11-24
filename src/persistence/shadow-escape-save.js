import {SHADOW_ESCAPE_DURATION,SHADOW_WAVE_TIMES,SHADOW_BOSSES,shadowHealthMax} from '../world/shadow-escape.js';
// Called only after legacy save validation; preserve damage and never revive a corpse.
export function migrateShadowEscapeHealth(s){
 for(const rooms of s.floors)for(const r of rooms)for(const e of r.enemies){
  if(e.shadowBoss!==1||e.shadowHealthVersion===2||!['warden','prism'].includes(e.variant||'warden'))continue;
  const max=shadowHealthMax(s,e.variant||'warden'),ratio=Math.max(0,Math.min(1,e.hp/e.max));
  e.hp=e.hp<=0?0:Math.min(max,Math.ceil(max*ratio));e.max=max;e.shadowRootMax=max;e.shadowHealthVersion=2;
 }
}
export function validateShadowEscape(s,check,number){
 if(s.finalEscapeVersion!==undefined)check(s.finalEscapeVersion===2);
 for(const [floor,rooms] of s.floors.entries())for(const r of rooms){
  const state=r.finalEscape,actors=r.enemies.filter(e=>e.shadowBoss!==undefined||e.shadowEscort!==undefined);
  if(state?.shadowVersion===undefined){check(actors.length===0);continue;}
  check(s.finalEscapeVersion===2&&state.shadowVersion===1&&floor===0&&r.type==='exit'&&s.key&&state.pressureVersion===undefined&&state.pending===undefined);
  check(number(state.elapsed,0,SHADOW_ESCAPE_DURATION)&&Number.isInteger(state.wave)&&state.wave===SHADOW_WAVE_TIMES.filter(t=>state.elapsed>=t).length&&typeof state.ready==='boolean'&&state.ready===(state.elapsed===SHADOW_ESCAPE_DURATION));
  check(actors.length<=16&&actors.filter(e=>e.shadowEscort).length<=state.wave*2);const counts={};
  for(const e of actors){
   check(e.summoned===true);
   if(e.shadowEscort!==undefined){check(e.shadowEscort===true&&e.shadowBoss===undefined&&e.type!=='boss'&&e.type!=='demonBat');continue;}
   check(e.shadowHealthVersion===undefined||e.shadowHealthVersion===2);
   const kind=e.variant||'warden',wave=SHADOW_BOSSES.indexOf(kind),root=shadowHealthMax(s,kind,e.shadowHealthVersion??1);check(e.shadowBoss===1&&e.type==='boss'&&wave>=0&&wave<state.wave&&e.shadowRootMax===root&&e.shadowEscort===undefined);
   counts[kind]=(counts[kind]||0)+1;check(counts[kind]<=(kind==='slime'?2:1));
   if(kind==='slime')check([0,1].includes(e.shadowSplit)&&e.stage===e.shadowSplit&&e.max===(e.shadowSplit?Math.ceil(root/2):root));else check(e.max===root);
   if(kind==='commander')check(e.commander?.phase===1&&e.commander.transition===0);
   if(kind==='king')check(e.kingStage===3&&e.kingOverhaulVersion===1&&e.resurrectionVersion===1&&!(e.kingTransition>0)&&!e.guardPortal);
  }
 }
}
