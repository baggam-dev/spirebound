import {runRandom} from './random.js';
import {relicStat} from './relics.js';
import {segmentBlocked} from './terrain.js';
export const essences=[
 {id:'attack',name:'공격력 정수',color:'#ff595e',label:'공격력 +3'},
 {id:'speed',name:'이동속도 정수',color:'#55aaff',label:'이동속도 +5%'},
 {id:'health',name:'체력의 정수',color:'#ff96ce',label:'최대 체력 +1'},
 {id:'haste',name:'공격속도 정수',color:'#6aee8b',label:'공격속도 +5%'},
 {id:'ultimate',name:'궁극기 정수',color:'#d4a1ff',label:'궁극기 쿨타임 10% 감소'}
];
export const essenceInfo=id=>essences.find(e=>e.id===id);
export function dropEssences(s,room,e,random=()=>runRandom(s)){
 if(e.summoned)return;
 const multiplier=s.key?2:1,items=room.essences??=[];
 const count=e.type==='boss'?1+Number(random()<.1*multiplier):Number(random()<(e.trialChampion?.1:e.elite?.05:.005)*multiplier);
 for(let i=0;i<count;i++)items.push({id:essences[Math.min(4,Math.floor(random()*5))].id,x:e.x+(i?14:0),y:e.y});
}
export function collectEssences(s,room){const collected=[];room.essences=(room.essences||[]).filter(e=>{const p=s.player;if(Math.hypot(e.x-p.x,e.y-p.y)>30+relicStat(p,'pickup')||segmentBlocked(p,e,room.obstacles,1))return true;if(e.id==='attack')p.damage+=3;if(e.id==='speed')p.bonusMove=(p.bonusMove||0)+.05;if(e.id==='health'){p.max++;p.hp++;}if(e.id==='haste')p.bonusAttack=(p.bonusAttack||0)+.05;if(e.id==='ultimate')p.ultimateEssences=(p.ultimateEssences||0)+1;const counts=p.essenceCounts??={};counts[e.id]=(counts[e.id]||0)+1;collected.push(e);return false;});return collected;}
export function drawEssences(ctx,room,time){ctx.save();ctx.textAlign='center';ctx.font='11px sans-serif';for(const e of room.essences||[]){const info=essenceInfo(e.id),y=e.y+Math.sin(time*3)*3;ctx.fillStyle=info.color;ctx.shadowColor=info.color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(e.x,y-10);ctx.lineTo(e.x+7,y);ctx.lineTo(e.x,y+10);ctx.lineTo(e.x-7,y);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillText(info.name,e.x,y-17);}ctx.restore();}
