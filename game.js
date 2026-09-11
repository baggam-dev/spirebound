import {drawOpenings} from './tactics.js';
import {mainSkills,chooseMain,allowedSkill,auraProfile,skillGrade,gradeLabels} from './skill-tree.js';
import {relicInfo,claimRelic,dodgeCooldown} from './relics.js';
import {evolutions,pendingEvolution,chooseEvolution,evolutionSummary} from './evolutions.js';
import {eventOptions,canChooseEvent,chooseEvent} from './adventures.js';
import {returnRoutes} from './routes.js';
import {drawElements} from './elements.js';
import {drawElites} from './elites.js';
import {drawHazards,drawPoisonEnemy} from './poison.js';
import {stepRun,enterRoom,ensureMetrics} from './simulation.js';
import {RunStore,RELEASE} from './storage.js';
import {createInput} from './input.js';
import {SessionLease} from './session.js';
import {helpMarkup,historyMarkup,journalMarkup,escapeHtml,diagnostic,downloadJSON} from './ui.js';
import {CHARGE_DURATION,chargeProfile} from './balance.js';
import {shieldCooldown} from './survival.js';
import {heartContainer,healthDisplay} from './health.js';
import {drawPrism} from './prism.js';
import {drawPattern} from './patterns.js';
import {drawRanged} from './ranged.js';
import {DODGE_COOLDOWN,ultimateUnlocked,castUltimate} from './abilities.js';
import {drawEnemyDetails} from './brute.js';
import {moveBody,drawObstacles,drawMinimap} from './terrain.js';
import {openChest,prepareChest,prepareTrialLoot,claimTrialLoot,lootLabel} from './loot.js';
import {xpRequired,skills,recipes,combinations,skillChoices,applySkill,rerollSkills} from './progression.js';
import {newRun,currentRoom,neighbor,travel,useShrine,canEscape,timeString} from './engine.js';
import {runRandom} from './random.js';

const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
const store=new RunStore(storage);
let launching=false;
let s=null,paused=true,mode='title',fx=[],bullets=[],last=performance.now(),accumulator=0,saveTick=0,toastTime=0,saveFailed=false;
const room=()=>currentRoom(s),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const input=createInput($('stick'),dispatch);
const lease=new SessionLease(storage,()=>{paused=true;input.setEnabled(false);panel('<h2>다른 탭에서 진행 중</h2><p>이 탭은 저장 덮어쓰기를 막기 위해 멈췄습니다.</p><button id="goTitle">입구로</button>');button('goTitle',title);});
function toast(message){$('notice').textContent=message;toastTime=4;}
function save(){if(!s||s.status!=='playing')return false;lease.heartbeat();if(!lease.active)return false;const result=store.write(s);saveFailed=!result.ok;$('saveStatus').textContent=result.ok?'진행 저장됨':'저장 실패';if(!result.ok)toast(result.error);return result.ok;}
function panel(html){$('overlay').innerHTML=`<div class="panel" role="dialog" aria-modal="true">${html}</div>`;}
function button(id,fn){$(id)?.addEventListener('click',fn);}
function stop(nextMode){paused=true;mode=nextMode;input.setEnabled(false);accumulator=0;}
function resetTransient(){fx=[];bullets=s?.projectiles||[];saveTick=0;accumulator=0;last=performance.now();}
function title(){
 stop('title');lease.release();s=null;resetTransient();$('route').hidden=true;$('skill').hidden=true;$('interact').hidden=true;
 $('floor').textContent='잊힌 탑의 입구';$('phase').textContent='THE FORSAKEN SPIRE';$('health').textContent='♥♥♥♥♥ · ◇◇◇◇◇';$('level').textContent='LV 1';$('timer').textContent='00:00';$('objective').textContent='탑에 들어가 탈출 열쇠를 찾으세요.';
 const loaded=store.read(),exists=!!loaded.run;
 panel(`<small>A JOURNEY UP. A FIGHT BACK.</small><h2>SPIREBOUND</h2><p>왕실 정찰병 · 6층 왕복 · ${RELEASE}</p><p>열쇠를 빼앗고 살아 돌아오세요.<br>기본 공격은 자동, 궁극기는 성장 후 해금됩니다.</p>${exists?`<p>저장된 도전: ${loaded.run.floor+1}/${loaded.run.floors.length}층 · ${timeString(loaded.run.elapsed)}${loaded.recovered?' · 백업 복구 가능':''}</p><button class="primary" id="continue">이어하기</button>`:''}${loaded.error?`<p role="alert">${escapeHtml(loaded.error)}</p>`:''}<button ${exists?'':'class="primary"'} id="start">새 도전 →</button><div><button id="guide">조작 안내</button><button id="records">도전 기록</button></div>`);
 button('start',()=>{if(exists){stop('confirm');panel('<h2>새 도전 시작</h2><p>현재 이어하기 저장을 새 도전으로 교체합니다.</p><button id="confirmStart">새 도전 시작</button><button id="cancelStart">돌아가기</button>');button('confirmStart',start);button('cancelStart',title);}else start();});
 button('continue',continueRun);button('guide',()=>showInfo('help'));button('records',()=>showInfo('history'));
}
async function start(seed){if(launching)return;launching=true;try{if(!await lease.acquire()){toast('다른 탭에서 도전 중입니다. 그 탭을 종료한 뒤 다시 시도하세요.');return;}s=newRun(Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:undefined);ensureMetrics(s);resetTransient();enterRoom(s);resume();save();toast('출구가 봉쇄되었습니다. 문을 찾아 탐험하세요.');}finally{launching=false;}}
async function continueRun(){if(launching)return;launching=true;try{
 if(!await lease.acquire()){toast('다른 탭에서 도전 중입니다. 그 탭을 종료한 뒤 다시 시도하세요.');return;}
 const loaded=store.read();if(!loaded.run){lease.release();title();toast(loaded.error||'이어갈 도전이 없습니다.');return;}
 s=loaded.run;ensureMetrics(s);resetTransient();resume();if(loaded.recovered)toast('마지막 정상 백업에서 복구했습니다.');save();}finally{launching=false;}
}
function resume(){if(!s||s.status!=='playing'||!lease.active)return;if(!s.player.mainSkill&&(s.pendingLevels||mainSkills.some(id=>s.player[id]>0))){mainPanel();return;}if(pendingEvolution(s.player)){evolutionPanel();return;}if(s.pendingHeal){s.player.hp=Math.min(s.player.max,s.player.hp+1);s.pendingHeal=false;}mode='play';paused=false;$('overlay').innerHTML='';input.setEnabled(true);accumulator=0;last=performance.now();if(s.pendingLevels)levelUp();}
function pause(reason=''){if(!s||s.status!=='playing'||['title','result','level'].includes(mode))return;stop('pause');const ok=save();panel(`<small>TAKE A BREATH</small><h2>잠시 쉬어가기</h2><p>${reason||'게임과 기록 시간이 멈췄습니다.'}<br>${ok?'진행 상황이 저장되었습니다.':'저장하지 못했습니다. 진단 기록을 내려받아 보관할 수 있습니다.'}</p><button class="primary" id="resume">계속 탐험</button><button id="quit">저장 후 입구로</button><button id="guide">조작 안내</button><button id="journal">원정 기록 · 도감</button><button id="export">진단 기록 받기</button>`);button('resume',resume);button('quit',()=>{if(save())title();});button('guide',()=>showInfo('help'));button('export',exportReport);button('journal',journalPanel);}
function showInfo(kind){const during=!!s&&s.status==='playing';if(mode==='level')return;stop('info');if(during)save();panel(kind==='history'?historyMarkup(storage):helpMarkup());button('closeInfo',()=>during?pause():title());}
function exportReport(){downloadJSON('spirebound-report.json',diagnostic(s,saveFailed?'저장 오류 있음':''));}
function bag(){if(!s||s.status!=='playing'||mode==='level')return;stop('bag');save();const p=s.player;
 panel(`<small>ROYAL SCOUT / INVENTORY</small><h2>여행자의 가방</h2><div class="guide"><p>무기 · ${p.weapon?'강화 장궁':'정찰병의 활'} / 공격력 ${p.damage}<br>유물 · ${relicInfo(p.relic)?.name||'없음'}${p.relic?' / '+relicInfo(p.relic).description:''}<br>방어구 · ${p.armor?'보호막 재충전 '+shieldCooldown(p)+'초':'보호막 없음'}<br>바람의 인장 · ${p.unique?'12회 처치당 1하트 ('+(p.leechKills||0)+'/12)':'없음'}</p><p>메인 · ${skills.find(k=>k.id===p.mainSkill)?.name||'미선택'}<br>익힌 기술 · ${skills.filter(k=>p[k.id]>0).map(k=>k.name+' '+p[k.id]).join(' / ')||'없음'}<br>선택 분기 · ${evolutionSummary(p)}<br>활성 조합 · ${combinations(p).map(c=>c.name).join(' / ')||'없음'}<br>궁극기 · ${ultimateUnlocked(p)?'해금됨':'스킬 '+skills.reduce((n,k)=>n+(p[k.id]||0),0)+'/5회 선택'}</p><p>물약 ${p.potions}개 · 음식 ${p.food}개<br>${s.pendingHeal?'음식 회복이 예약되었습니다. 재개할 때 1하트 회복합니다.':'음식은 안전한 방에서 사용합니다.'}</p></div><button id="eat" ${room().enemies.length||!p.food||s.pendingHeal||p.hp>=p.max?'disabled':''}>음식 먹기 · 1하트</button><button id="journal">원정 기록 · 도감</button><button class="primary" id="closeBag">탐험 재개</button>`);
 button('journal',journalPanel);button('eat',()=>{p.food--;s.pendingHeal=true;save();bag();});button('closeBag',()=>{resume();save();});
}
function levelUp(){
 if(!s.player.mainSkill){mainPanel();return;}
 stop('level');let choices=s.choices?.map(id=>skills.find(k=>k.id===id)).filter(k=>k&&allowedSkill(s.player,k.id)&&(s.player[k.id]||0)<k.max);
 if(!choices?.length)choices=skillChoices(s.player,()=>runRandom(s));s.choices=choices.map(k=>k.id);save();
 if(!choices.length){s.player.hp=Math.min(s.player.max,s.player.hp+1);s.pendingLevels--;s.choices=null;resume();return;}
 panel('<small>CHOOSE YOUR PATH</small><h2>새로운 깨달음</h2><p>기술을 5번 선택하면 궁극기가 해금됩니다. 같은 기술 강화도 포함합니다.</p><div class="cards">'+choices.map((k,i)=>'<button class="skill-'+k.grade+'" id="u'+i+'"><b>'+ '['+gradeLabels[k.grade]+'] '+k.name+' '+((s.player[k.id]||0)+1)+' / '+k.max+'</b><span>'+k.description+'</span><em>'+recipes.filter(r=>r.needs.includes(k.id)&&r.needs.every(id=>allowedSkill(s.player,id))).map(r=>r.name+' · '+r.needs.map(id=>skills.find(a=>a.id===id).name).join(' + ')).join('<br>')+'</em></button>').join('')+'</div><button id="reroll" '+((s.rerolls??1)>0?'':'disabled')+'>후보 새로고침 · '+(s.rerolls??1)+'회</button>');
 button('reroll',()=>{if(rerollSkills(s)){save();levelUp();}});
 choices.forEach((k,i)=>button('u'+i,()=>{const was=ultimateUnlocked(s.player),previous=combinations(s.player).map(c=>c.name);if(!applySkill(s.player,k.id))return;const unlocked=combinations(s.player).filter(c=>!previous.includes(c.name));if(unlocked.length)toast('조합 완성 · '+unlocked.map(c=>c.name).join(' / '));if(!was&&ultimateUnlocked(s.player)){s.skill=0;toast('궁극기 화살비 해금 · F');}s.pendingLevels--;s.choices=null;resume();save();}));
}
let endResult={ok:true};
function finish(won){if(s.status!=='playing')return;s.status=won?'won':'dead';stop('result');endResult=store.complete(s,won);lease.release();resultPanel();}
function resultPanel(){const won=s.status==='won';stop('result');panel(`<small>${won?'THE WAY HOME':'THE SPIRE REMEMBERS'}</small><h2>${won?'탑에서 탈출했습니다':'도전이 끝났습니다'}</h2><p>${timeString(s.elapsed)} · LV ${s.player.level} · 처치 ${s.kills}<br>${s.floor+1}층 · 열쇠 ${s.key?'획득':'미획득'}<br>유물 · ${relicInfo(s.player.relic)?.name||'없음'}<br>받은 피해 ${s.metrics?.damageTaken||0}하트 · 보호막 방어 ${s.metrics?.shields||0}회<br>${s.lastHit?'마지막 피격 · '+escapeHtml(s.lastHit.source):'피격 기록 없음'}</p><p>${endResult.ok?'개인 기록을 저장했습니다.':escapeHtml(endResult.error)}</p><button class="primary" id="again">입구로 돌아가기</button><button id="journal">원정 기록 · 도감</button>${s.generationVersion===17?'<button id="retrySeed">같은 지도에서 새 도전</button>':''}<button id="export">진단 기록 받기</button>`);button('again',title);const retrySeed=s.seed;button('retrySeed',()=>start(retrySeed));button('journal',journalPanel);button('export',exportReport);}

function potion(){if(paused||!s.player.potions||s.player.hp>=s.player.max)return;s.player.potions--;s.player.hp=Math.min(s.player.max,s.player.hp+2);ensureMetrics(s).potionsUsed++;toast('회복 물약 · 2하트 회복');save();}
function dodge(){if(paused||s.dodge>0)return;s.dodge=dodgeCooldown(s.player);s.invulnerable=.45;const v=input.direction();moveBody(s.player,v.x*105,v.y*105,room().obstacles);s.player.x=Math.max(50,Math.min(910,s.player.x));s.player.y=Math.max(65,Math.min(475,s.player.y));ensureMetrics(s).dodgesUsed++;fx.push({x:s.player.x,y:s.player.y,r:40,t:.35,color:'#d5eed4'});}
function skill(){if(paused||!castUltimate(s))return;ensureMetrics(s).ultimatesUsed++;room().enemies.forEach(e=>fx.push({x:e.x,y:e.y,r:60,t:.6,color:'#e6c57b'}));toast('궁극기 · 화살비');}
function interaction(){
 if(!s||s.status!=='playing')return null;const r=room();if(distance(s.player,{x:480,y:115})>78)return null;
 if(r.type==='fountain'&&!r.used)return [s.player.hp>=s.player.max?'샘물 · 체력이 가득합니다':'샘물로 회복',()=>{if(s.player.hp>=s.player.max)return;r.used=true;s.player.hp=Math.min(s.player.max,s.player.hp+3);toast('샘물이 말랐습니다. 3하트 회복');}];
 if(r.type==='treasure'&&!r.used&&!r.enemies.length)return ['보물 상자 열기',()=>{prepareChest(s);save();if(openChest(s)){save();toast(lootLabel(room().lastLoot));resume();}}];
 if(r.type==='event'&&!r.enemies.length&&(!r.used||r.trialState==='reward'))return [r.trialState==='reward'?'시련 보상 선택':'수상한 제단 · 위험과 보상',()=>r.trialState==='reward'?rewardPanel(true):eventPanel()];
 if(r.type==='boss'&&r.used&&!r.enemies.length&&r.relicOffers&&!r.relicClaimed)return ['유물함 · 선택 또는 지나가기',relicPanel];
 if((r.type==='up'||r.type==='boss'&&r.used)&&s.floor<s.floors.length-1)return [(s.floor+2)+'층으로 올라가기',()=>changeFloor(s.floor+1)];
 if(r.type==='down')return [s.floor+'층으로 내려가기',()=>changeFloor(s.floor-1)];
 if(r.type==='shrine'&&!r.used)return ['고대신의 신전 · 장비 강화',shrine];
 if(canEscape(s))return ['열쇠로 탈출하기',()=>finish(true)];
 if(r.type==='exit')return ['출구 봉쇄 · 열쇠 필요',()=>toast('최상층 수호자가 열쇠를 지키고 있습니다.')];return null;
}
function shrine(){stop('shrine');save();panel('<small>ANCIENT SANCTUARY</small><h2>고대신의 축복</h2><p>한 번만 강화할 수 있습니다. 선택 중 시간은 멈춥니다.</p><button id="blessWeapon">무기 · 공격력 +5</button><button id="blessArmor">보호막 강화 / 1하트 회복</button><button id="leaveShrine">나중에</button>');button('blessWeapon',()=>{useShrine(s,'weapon');resume();save();});button('blessArmor',()=>{useShrine(s,'armor');resume();save();});button('leaveShrine',resume);}
function interact(){if(paused)return;interaction()?.[1]();save();}
function changeFloor(f){if(travel(s,f-s.floor)){enterRoom(s);fx=[];bullets=s.projectiles;save();}}
function update(dt){if(!s||paused)return;const result=stepRun(s,dt,input.movement());bullets=s.projectiles;fx.push(...result.effects);fx=fx.filter(f=>(f.t-=dt)>0);
 if(result.events.includes('dead')){finish(false);return;}
 const messages={eliteReward:'정예 처치 · 물약 1개 획득',trialReward:'시련 완료 · 제단에서 보상을 선택하세요.',shield:'보호막이 공격을 막았습니다.',potion:'회복 물약 획득',key:'열쇠 획득! 1층 출구로 귀환하세요.',stairs:'중간 보스 격파! 위층 계단이 열렸습니다.'};for(const event of result.events)if(messages[event])toast(messages[event]);
 if(result.events.includes('level'))levelUp();saveTick+=dt;if(saveTick>=2||result.events.some(e=>['room','stairs','key'].includes(e))){saveTick=0;save();}
}

function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(t,x,y,c='#c8d3bd',size=12){ctx.fillStyle=c;ctx.font=`${size}px monospace`;ctx.textAlign='center';ctx.fillText(t,x,y);}
function sprite(x,y,type){ctx.save();ctx.translate(Math.round(x),Math.round(y));rect(-13,13,27,7,'#0006');if(type==='player'){rect(-10,-9,20,24,'#58785e');rect(-8,-21,16,15,'#aac0a0');rect(-6,-15,12,9,'#d5b48b');rect(-11,12,8,9,'#8f9e78');rect(4,12,8,9,'#8f9e78');rect(13,-10,4,30,'#c0a471');rect(17,-6,3,22,'#775f43');rect(-8,-23,16,5,'#446c56');}else if(type==='boss'){rect(-27,-24,54,51,'#706875');rect(-21,-37,42,29,'#928782');rect(-30,-45,10,24,'#bca57e');rect(20,-45,10,24,'#bca57e');rect(-14,-24,9,5,'#ff836c');rect(6,-24,9,5,'#ff836c');rect(-12,2,24,13,'#ab7358');rect(-36,0,9,35,'#bfa784');}else{let c=s?.key?'#b75553':type==='archer'?'#a08fbd':type==='charger'?'#b2976f':type==='scatter'?'#ce8e70':'#839985';rect(-11,-12,22,27,c);rect(-8,-20,16,15,c);rect(-6,-13,4,4,'#eddda9');rect(3,-13,4,4,'#eddda9');rect(-12,13,8,7,'#48574c');rect(4,13,8,7,'#48574c');}ctx.restore();}
function draw(){ctx.clearRect(0,0,960,540);rect(0,0,960,540,'#11191b');for(let y=40;y<510;y+=30)for(let x=25;x<940;x+=35){let n=((x*17+y*31)%19);rect(x,y,34,29,n<5?'#283231':n<12?'#252e2d':'#222c2b');if(n<3)rect(x+4,y+20,12,2,'#354039');}for(let x=0;x<960;x+=48){rect(x,0,46,30,'#3c4742');rect(x+2,31,43,13,'#202927');rect(x,508,46,32,'#3c4742');}for(let y=35;y<510;y+=40){rect(0,y,25,38,'#3e4943');rect(935,y,25,38,'#3e4943');}for(const x of [85,875])for(const y of [82,455]){rect(x-8,y,16,20,'#515b4d');rect(x-4,y-12,8,15,'#cf9854');rect(x-2,y-17,5,12,'#f0cc7c');}
 if(!s){sprite(480,285,'player');return;}const r=room();for(let d=0;d<4;d++)if(neighbor(s,d)>=0){let x=d===1?931:d===3?0:440,y=d===0?0:d===2?505:235;rect(x,y,d%2?29:80,d%2?70:35,'#101b1b');if((r.type==='boss'||r.tutorial&&!s.key)&&r.enemies.length)rect(x,y,d%2?20:80,d%2?70:20,'#895c46');}
 if(['up','down','exit','fountain','treasure','shrine','event'].includes(r.type)||r.type==='boss'&&r.used&&s.floor<s.floors.length-1){rect(453,85,54,43,'#151f21');if(r.type==='event'){rect(465,90,30,32,r.used?'#625666':'#a184b6');text(r.trialState==='reward'?'시련 보상':r.used?'계약한 제단':'위험과 보상',480,76);}else if(r.type==='shrine'){rect(465,88,30,38,r.used?'#50545a':'#9a88bb');text(r.used?'사용한 신전':'고대신의 신전',480,76);}else if(r.type==='fountain'){rect(456,100,48,25,'#667c76');rect(462,98,36,18,r.used?'#34423e':'#68b4ac');text(r.used?'메마른 샘':'요정의 샘물',480,76);}else if(r.type==='treasure'){rect(463,95,34,24,r.used?'#4f4b36':'#b69854');rect(478,99,5,9,'#ead18d');text(r.used?'빈 상자':'보물 상자',480,76);}else{for(let i=0;i<5;i++)rect(457+i*3,89+i*7,46-i*6,4,'#8a9380');text(r.relicOffers&&!r.relicClaimed?'유물함':r.type==='exit'?(s.key?'탈출구':'봉쇄된 출구'):r.type==='down'?'↓ '+s.floor+'층':'↑ '+(s.floor+2)+'층',480,76);}}
 drawObstacles(ctx,r.obstacles);
 if(r.allyZone){ctx.fillStyle='#dec77233';ctx.strokeStyle='#f2dc9b';ctx.beginPath();ctx.arc(r.allyZone.x,r.allyZone.y,r.allyZone.r,0,Math.PI*2);ctx.fill();ctx.stroke();}
 drawElites(ctx,r);drawHazards(ctx,r);drawElements(ctx,r);drawOpenings(ctx,r);if(s.player.aura){ctx.strokeStyle='#b3dba855';ctx.beginPath();ctx.arc(s.player.x,s.player.y,auraProfile(s.player.aura).radius,0,Math.PI*2);ctx.stroke();}
 r.enemies.forEach(e=>{if(e.chargeAngle!==undefined&&e.cd>=chargeProfile(e).duration){ctx.strokeStyle='#e2b16e';ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.chargeAngle)*120,e.y+Math.sin(e.chargeAngle)*120);ctx.stroke();ctx.setLineDash([]);}if(e.type==='ricochet'&&e.cd<.65){ctx.strokeStyle='#dd9973';ctx.beginPath();ctx.arc(e.x,e.y,e.type==='boss'?43:26,0,Math.PI*2);ctx.stroke();}if(e.type!=='brute'&&e.type!=='flower'&&e.type!=='minislime'&&e.variant!=='slime'){ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.scale??1,e.scale??1);ctx.translate(-e.x,-e.y);sprite(e.x,e.y,e.type);ctx.restore();}drawEnemyDetails(ctx,e);drawPoisonEnemy(ctx,e);if(e.variant==='prism')drawPrism(ctx,e,r.obstacles);drawPattern(ctx,e);drawRanged(ctx,e,r.obstacles);if(e.burn>0)rect(e.x-17,e.y-8,4,10,'#ed9a55');if(e.slow>0)rect(e.x+14,e.y-8,4,10,'#91d0e3');rect(e.x-15,e.y-30,30,3,'#131b1b');rect(e.x-15,e.y-30,30*Math.max(0,e.hp/e.max),3,s.key?'#d7766b':'#a7ad7b');});if(s.invulnerable<=0||Math.floor(s.invulnerable*20)%2===0)sprite(s.player.x,s.player.y,'player');bullets.filter(b=>!(b.delay>0)).forEach(b=>rect(b.x-3,b.y-2,b.enemy?7:10,4,b.ricochet?'#74e1dd':b.enemy?'#e88373':b.element==='fire'?'#ff9948':b.element==='poison'?'#85ec79':b.element==='frost'?'#b4ecff':b.element==='chain'?'#bbacff':s.player.split&&s.player.pierce?'#8fe0cd':'#e6d392'));fx.forEach(f=>{ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();if(f.toX!==undefined){ctx.moveTo(f.x,f.y);ctx.lineTo(f.toX,f.toY);}else ctx.arc(f.x,f.y,f.r*(1-f.t),0,Math.PI*2);ctx.stroke();});
 drawMinimap(ctx,s.floors[s.floor],r,s.key?returnRoutes(s)[s.routePreference||'short']:[]);$('route').hidden=!s.key||s.status!=='playing';if(s.key){ctx.strokeStyle='#b74c4866';ctx.lineWidth=8;ctx.strokeRect(4,4,952,532);}const boss=r.enemies.find(e=>e.type==='boss');if(boss){rect(280,27,400,7,'#182120');rect(280,27,400*(boss.variant==='slime'?r.enemies.filter(e=>e.type==='boss').reduce((n,e)=>n+Math.max(0,e.hp)+(2-(e.stage||0))*e.max,0)/2700:boss.hp/boss.max),7,'#b67864');text(boss.variant==='slime'?'독성 군체 · 남은 분열체 '+r.enemies.filter(e=>e.type==='boss').length:boss.variant==='prism'?'프리즘의 수호자':'녹슨 탑의 파수꾼',480,20,'#d6bfa1',11);}
 $('potion').disabled=paused||!s.player.potions||s.player.hp>=s.player.max;$('health').setAttribute('aria-label',`체력 ${s.player.hp}/${s.player.max}하트`);$('floor').textContent=`${s.floor+1}층 · ${['잊힌 돌의 전당','파수꾼의 회랑','고대신의 서고','프리즘의 왕좌','독화의 온실','군체의 심장'][s.floor]}`;$('phase').textContent=s.key?'THE FRENZY / 광폭 '+(s.floors.length-s.floor)+'단계':'THE ASCENT / 탐험';$('health').textContent=healthDisplay(s.player)+(s.player.armor>0?(s.shield>0?' · ◈ '+Math.ceil(s.shield)+'초':' · ◈ 준비'):'');$('level').textContent=`LV ${s.player.level} · XP ${s.player.xp}/${xpRequired(s.player.level)}`;$('timer').textContent=timeString(s.elapsed);$('objective').textContent=r.tutorial&&!s.key&&r.enemies.length?'첫 전투 · 추격자 4마리를 처치하고 첫 기술을 선택하세요.':s.key?'같은 길을 따라 1층 출구로 귀환하세요.':r.relicOffers&&!r.relicClaimed?'유물을 선택하거나 유물함을 지나가세요.':s.floor===s.floors.length-1?'최상층 보스를 처치하고 열쇠를 획득하세요.':s.floor%2?(s.floors[s.floor].some(r=>r.type==='boss'&&r.used)?'열린 계단을 찾아 위층으로 올라가세요.':'보스를 처치하고 위층 계단을 여세요.'):'위층 계단을 탐색하세요.';$('potion').textContent=`물약 ${s.player.potions} · Q`;$('skill').hidden=mode==='title'||!ultimateUnlocked(s.player);$('skill').disabled=s.skill>0;$('dodge').disabled=s.dodge>0;$('skill').textContent=s.skill>0?`화살비 ${s.skill.toFixed(1)}s`:'화살비 · F';$('dodge').textContent=s.dodge>0?`회피 ${s.dodge.toFixed(1)}s`:'회피 · SPACE';let i=interaction();$('interact').hidden=!i||paused;if(i)$('interact').textContent=i[0]+' · E';
}

function dispatch(action){
 if(action==='pause'){if(['pause','bag','shrine'].includes(mode))resume();else pause();return;}
 if(action==='help'){showInfo('help');return;}
 if(action==='bag'){if(mode==='bag')resume();else bag();return;}
 if(paused||!s)return;({potion,skill,dodge,interact})[action]?.();
}
for(const id of ['bag','pause','potion','skill','dodge','interact'])button(id,()=>dispatch(id));
button('help',()=>showInfo('help'));
function backgroundPause(){if(!s||s.status!=='playing')return;if(!paused)pause('다른 화면으로 전환되어 자동으로 멈췄습니다.');else save();input.reset();}
window.addEventListener('blur',backgroundPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)backgroundPause();});
window.addEventListener('pagehide',()=>{save();lease.release();});
window.addEventListener('pageshow',e=>{if(e.persisted){stop('pause');title();}});
window.addEventListener('resize',()=>{if(!paused)pause('화면 크기가 변경되어 멈췄습니다.');});
setInterval(()=>lease.heartbeat(),3000);
window.addEventListener('error',()=>{if(s&&s.status==='playing'){stop('error');save();panel('<h2>문제가 발생했습니다</h2><p>진행을 멈췄습니다. 진단 기록을 받은 뒤 새로고침해 이어갈 수 있습니다.</p><button id="export">진단 기록 받기</button>');button('export',exportReport);}});
function frame(now){const elapsed=(now-last)/1000;last=now;
 if(toastTime>0){toastTime-=Math.min(elapsed,.25);if(toastTime<=0)$('notice').textContent='';}
 if(!paused){if(elapsed>1){pause('화면 응답이 지연되어 자동으로 멈췄습니다.');}else{accumulator+=elapsed;while(accumulator>=1/60&&!paused){update(1/60);accumulator=Math.max(0,accumulator-1/60);}}}
 draw();requestAnimationFrame(frame);
}
title();requestAnimationFrame(frame);

function evolutionPanel(){const key=pendingEvolution(s.player);if(!key)return;stop('evolution');save();panel('<small>EVOLUTION</small><h2>'+ (skills.find(k=>k.id===key)?.name||'화살비')+' · 분기 선택</h2><p>이번 도전 동안 한 가지 방식을 선택합니다. 추가 스킬 포인트는 소모하지 않습니다.</p><div class="cards">'+evolutions[key].map((e,i)=>'<button class="skill-'+skillGrade(key)+'" id="evolve'+i+'"><b>'+e.name+'</b><span>'+e.description+'</span></button>').join('')+'</div>');evolutions[key].forEach((e,i)=>button('evolve'+i,()=>{if(chooseEvolution(s.player,key,e.id)){save();resume();}}));}
function rewardPanel(){const offers=prepareTrialLoot(s);stop('reward');save();panel('<small>TRIAL REWARD</small><h2>시련 완료</h2><p>무작위 긍정 보상 세 가지 중 하나를 선택하세요.</p><div class="cards">'+offers.map((r,i)=>'<button id="reward'+i+'"><b>'+lootLabel(r)+'</b><span>선택 즉시 지급</span></button>').join('')+'</div><button id="laterReward">나중에 선택</button>');offers.forEach((r,i)=>button('reward'+i,()=>{if(claimTrialLoot(s,i)){save();resume();}}));button('laterReward',resume);}
function eventPanel(){stop('event');save();panel('<small>RISK AND REWARD</small><h2>수상한 제단</h2><p>대가와 보상을 확인하세요. 한 번만 계약할 수 있습니다.</p><div class="cards">'+eventOptions.map((e,i)=>'<button id="event'+i+'" '+(canChooseEvent(s,e.id)?'':'disabled')+'><b>'+e.name+'</b><span>'+e.description+'</span></button>').join('')+'</div><button id="leaveEvent">그냥 지나간다</button>');eventOptions.forEach((e,i)=>button('event'+i,()=>{if(chooseEvent(s,e.id)){save();resume();}}));button('leaveEvent',resume);}
function routePanel(){if(!s?.key||s.status!=='playing')return;stop('route');save();const paths=returnRoutes(s),rs=s.floors[s.floor];panel('<small>RETURN ROUTES</small><h2>귀환 경로</h2><p>방문한 방만 계산합니다. 붉은 방은 위험, 초록 방은 적이 적은 우회로입니다.<br>미사용 샘물은 ~ 기호로 확인하세요. 이동은 직접 조작합니다.</p>'+['short','safe'].map((k,i)=>'<button id="path'+i+'" '+(paths[k].length?'':'disabled')+'><b>'+(k==='short'?'최단 경로':'위험 회피 경로')+'</b><br>'+(paths[k].length?Math.max(0,paths[k].length-1)+'번 이동 · 위험 방 '+paths[k].filter(n=>rs[n].returnRisk==='high').length+'개':'탐색한 방만으로 연결되지 않음')+'</button>').join('')+'<button id="leaveRoute">돌아가기</button>');['short','safe'].forEach((k,i)=>button('path'+i,()=>{s.routePreference=k;save();resume();}));button('leaveRoute',resume);}
button('route',routePanel);

function relicPanel(){const r=room();stop('relic');save();panel('<small>ONE RELIC SLOT</small><h2>수호자의 유물함</h2><p>동시에 하나만 장착합니다. 새 유물을 고르면 현재 유물을 교체합니다.<br>현재: '+(relicInfo(s.player.relic)?.name||'없음')+'</p><div class="cards">'+r.relicOffers.map((id,i)=>'<button id="relic'+i+'"><b>'+relicInfo(id).name+'</b><span>'+relicInfo(id).description+'</span></button>').join('')+'</div><button id="skipRelic">현재 상태 유지 · 유물함 지나가기</button>');r.relicOffers.forEach((id,i)=>button('relic'+i,()=>{if(claimRelic(s,id)){save();resume();}}));button('skipRelic',()=>{if(claimRelic(s,'skip')){save();resume();}});}
function journalPanel(){if(!s||mode==='level')return;stop('journal');if(s.status==='playing')save();panel(journalMarkup(s));button('closeJournal',()=>s.status==='playing'?pause():resultPanel());}

function mainPanel(){stop('main');save();panel('<small>MAIN TREE · 이번 도전에서 하나만 선택</small><h2>주력 속성을 선택하세요</h2><p>선택한 메인과 보조 기술만 성장합니다. 기존 다른 속성 투자분은 기술 선택 횟수로 돌려드립니다.</p><div class="cards main-cards">'+mainSkills.map(id=>{const k=skills.find(k=>k.id===id);return '<button class="skill-main" id="main-'+id+'"><b>'+k.name+'</b><span>'+k.description+'</span></button>';}).join('')+'</div>');mainSkills.forEach(id=>button('main-'+id,()=>{if(chooseMain(s,id)){save();resume();}}));}
