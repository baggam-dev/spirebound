import {prismShielded} from './enemy-defense.js';
import {PRISM_SUMMON} from './combat-tuning.js';
export function prismStatus(boss,enemies){const count=enemies.filter(e=>e.hp>0&&e.summoned&&e.summoner===boss.id).length;return {shielded:prismShielded(boss,enemies),count,remaining:Math.max(0,boss.summonClock??PRISM_SUMMON.first),full:count>=3};}
export function shieldStatuses(s){const rows=[];if(s.player.armor>0)rows.push({name:'장비',remaining:Math.max(0,s.shield||0)});if(s.player.aura>=3)rows.push({name:'오라',remaining:Math.max(0,s.auraShield||0)});return rows.map(r=>({...r,ready:r.remaining===0,label:r.name+' · '+(r.remaining>0?Math.ceil(r.remaining)+'초 충전':'준비 · 1회 방어')}));}
export function shieldStatusMarkup(s){return shieldStatuses(s).map(r=>'<span class="shield-state '+(r.ready?'ready':'charging')+'">'+r.label+'</span>').join('');}
