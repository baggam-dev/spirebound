import {hitEnemy,skills} from './progression.js';
import {attackInterval,relicStat} from './relics.js';
import {auraProfile} from './skill-tree.js';
import {frostThreshold} from './frost.js';
import {lightningSpec} from './lightning.js';
import {applyGrowth} from './growth.js';

// Measure a cloned build against a full-health, unarmored target 100 units away.
// This reuses combat formulas, including relics, curses and selected evolutions.
export function previewStats(player){
 const p=structuredClone(player);p.x=0;p.y=0;
 const target={id:0,type:'chaser',x:100,y:0,hp:100000,max:100000};
 const effects=hitEnemy(p,target,[target],[],1,true,{fireZones:[]});
 return {hit:100000-target.hp,rate:1/attackInterval(p),radius:effects.find(e=>e.instant)?.r||0,
  poison:target.poisonStacks?.[0]?.dps||0,burn:target.burnStacks?.[0]?.dps||0,
  aura:p.aura?auraProfile(p.aura).dps*(1+relicStat(p,'auraDamage')):0,
  auraRadius:p.aura?auraProfile(p.aura).radius*(1+relicStat(p,'auraRange')):0};
}
export function skillPreview(player,id){
 const next=structuredClone(player),skill=skills.find(k=>k.id===id);
 if(id.startsWith('growth')){if(!applyGrowth(next,id))return [];}
 else{if(!skill||(next[id]||0)>=skill.max)return [];next[id]=(next[id]||0)+1;}
 const a=previewStats(player),b=previewStats(next),rows=[];
 const row=(label,before,after,unit='',digits=1)=>rows.push({label,before:typeof before==='number'?before.toFixed(digits)+unit:before,after:typeof after==='number'?after.toFixed(digits)+unit:after});
 if(Math.abs(a.hit-b.hit)>.001)row('첫 적중 피해¹',a.hit,b.hit);
 if(Math.abs(a.rate-b.rate)>.001)row('초당 사격',a.rate,b.rate,'회',2);
 if(id==='fire'){row('폭발 반경',a.radius,b.radius,'',0);if(b.burn!==a.burn)row('화상 1중첩 / 초',a.burn,b.burn);if(next.fire===3)row('3중첩 화상 처치','장판 없음','화염 장판 생성');}
 if(id==='poison'){row('독 1중첩 / 초',a.poison,b.poison);row('독가스 반경',player.poison?30+12*player.poison:0,30+12*next.poison,'',0);if(next.poison===3)row('독 처치','폭발 없음','독 폭발 해금');}
 if(id==='frost'){row('빙결까지 적중',player.frost?frostThreshold(player.frost):'없음',frostThreshold(next.frost),'회',0);row('빙결 적 사망 파편',player.frost?(player.frost>=4?12:6):0,next.frost>=4?12:6,'발',0);}
 if(id==='chain'){row('전이 대상 최대',player.chain?lightningSpec(player).count:0,lightningSpec(next).count,'체',0);row('3초마다 천둥',player.chain||0,next.chain,'체',0);}
 if(id==='aura'){row('오라 초당 피해',a.aura,b.aura);row('오라 반경',a.auraRadius,b.auraRadius,'',0);if(next.aura===3)row('오라 보호막','없음',(60-relicStat(next,'auraShield'))+'초마다 1회 방어');}
 if(id==='split')row('동시 화살',1+(player.split||0),1+next.split,'발',0);
 if(id==='pierce')row('추가 관통',player.evolutions?.pierce==='impact'?0:(player.pierce||0)+(player.evolutions?.pierce==='depth'?2:0),next.evolutions?.pierce==='impact'?0:next.pierce+(next.evolutions?.pierce==='depth'?2:0),'체',0);
 if(id==='repeat')row('추가 연속탄','없음','0.16초 후 60% 피해 1발');
 if(id==='homing')row('유도 화살',player.homing||0,next.homing,'발',0);
 if(id==='ultimate')row('궁극기','미습득','선택 후 화살비 / 석궁 결정');
 if(id==='growthHealth')row('최대 체력',player.max,next.max,'♥',0);
 return rows;
}
export function skillPreviewMarkup(player,id){const rows=skillPreview(player,id);return rows.length?'<span class="skill-preview">'+rows.map(r=>'<span>'+r.label+'<strong>'+r.before+' → '+r.after+'</strong></span>').join('')+(rows.some(r=>r.label.includes('¹'))?'<small>¹ 거리 100 · 체력 가득 찬 일반 적 기준. 첫 적중 합계, 지속·전이 피해 제외.</small>':'')+'</span>':'';}
