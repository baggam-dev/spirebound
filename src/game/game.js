import {drawStoneWalls,outerWalls} from '../rendering/stone-walls.js';
import {RankingClient,rankingError} from '../ranking/ranking-client.js';
import {createRankingUI} from '../ranking/ranking-ui.js';
import {finishRanking,rankingMarkup} from '../ranking/ranking.js';
import {returnStairsLocked,returnSealText,drawReturnSeal} from '../world/return-seals.js';
import {startFinalEscape,finalEscapeRequired,FINAL_ESCAPE_DURATION} from '../world/final-escape.js';
import {drawFinalEscape} from '../rendering/final-escape.js';
import {objectPoint} from '../world/object-positions.js';
import {drawAuraField,drawBurst,drawSoftField} from '../rendering/ground-visuals.js';
import {readableEffects,drawCombatLabels} from '../combat/combat-readability.js';
import {emitInteraction,drawInteractionEffects} from '../rendering/interaction-visuals.js';
import {bossPose} from '../rendering/boss-poses.js';
import {enemyHitEffects,mergeEnemyFeedback,drawEnemyFeedback} from '../rendering/enemy-feedback.js';
import {drawUltimateGround} from '../rendering/ultimate-visuals.js';
import {drawElementHit,limitElementHits} from '../rendering/element-hit-visuals.js';
import {drawDoorFrame,drawPixelActor,drawWorldDetails,drawObjectDetails,drawProjectile,drawImpact,drawSpellDetails} from '../rendering/pixel-world.js';
import {bindCombatAction} from '../ui/touch-actions.js';
import {relicPreviewMarkup} from '../ui/relic-preview.js';
import {prismStatus} from '../combat/combat-status.js';
import {skillPreviewMarkup} from '../ui/skill-preview.js';
import {drawHitFeedback} from '../rendering/hit-feedback.js';
import {deathSummaryMarkup,resultOverviewMarkup,resultBuildMarkup} from '../ui/ui.js';
import {essenceInfo} from '../progression/essences.js';
import '../ui/mobile-ui.js';
import {createPractice,practiceBosses,practiceCleared} from './boss-practice.js';
import {drawThunder} from '../combat/lightning.js';
import {applyLevelReward} from '../progression/progression.js';
import {drawFloorMood,drawRoomStory,returnStoryMarkup,escapeStoryMarkup,floorNames} from '../rendering/atmosphere.js';
import {createSoundSystem} from '../ui/sound.js';
import {drawUpper,drawUpperGround,drawUpperLinks,upperTypes,challengeKing,kingPhase} from '../combat/upper-floors.js';
import {challengeCommander,commanderPhase} from '../combat/commander.js';
import {drawCommander,drawCommanderGround} from '../rendering/commander-visuals.js';
import {challengeDemon,demonPartName} from '../combat/demon.js';
import {drawDemon,drawDemonGround} from '../rendering/demon-visuals.js';
import {PRISM_SUMMON} from '../combat/combat-tuning.js';
import {drawPassives} from '../progression/passives.js';
import {fountainPoint,useFountain} from '../world/fountain.js';
import {createHUD} from '../ui/hud.js';
import {iconSVG} from '../rendering/pixel-icons.js';
import {incantationInfo,prepareIncantations,shrineLocked,enterShrine} from '../world/shrine.js';
import {drawReturnEnemy} from '../combat/return-enemies.js';
import {drawInfernal,drawInfernalGround,infernalTypes} from '../combat/infernal-enemies.js';
import {bossHealth} from '../combat/poison.js';
import {drawOpenings} from '../combat/tactics.js';
import {mainSkills,chooseMain,allowedSkill,auraProfile,skillGrade,gradeLabels} from '../progression/skill-tree.js';
import {drawEssences} from '../progression/essences.js';
import {relicInfo,claimRelic,relicStat,relicSummary,ownedRelics} from '../progression/relics.js';
import {evolutions,pendingEvolution,chooseEvolution,evolutionSummary} from '../progression/evolutions.js';
import {eventOptions,canChooseEvent,chooseEvent} from '../world/adventures.js';
import {returnRoutes} from '../world/routes.js';
import {drawElements} from '../combat/elements.js';
import {drawElites} from '../combat/elites.js';
import {drawHazards,drawPoisonEnemy} from '../combat/poison.js';
import {stepRun,enterRoom,ensureMetrics} from './simulation.js';
import {RunStore,RELEASE} from '../persistence/storage.js';
import {createInput} from '../ui/input.js';
import {SessionLease} from '../persistence/session.js';
import {helpMarkup,historyMarkup,journalMarkup,escapeHtml,diagnostic,downloadJSON} from '../ui/ui.js';
import {CHARGE_DURATION,chargeProfile} from '../combat/balance.js';
import {shieldCooldown} from '../combat/survival.js';
import {heartContainer,healthDisplay} from '../combat/health.js';
import {drawPrism} from '../combat/prism.js';
import {drawPattern} from '../combat/patterns.js';
import {drawRanged} from '../combat/ranged.js';
import {usePotion,ultimateUnlocked,castUltimate,castBlink} from '../combat/abilities.js';
import {drawEnemyDetails} from '../combat/brute.js';
import {moveBody,drawObstacles,drawMinimap} from '../world/terrain.js';
import {openChest,prepareChest,prepareTrialLoot,claimTrialLoot,lootLabel} from '../progression/loot.js';
import {xpRequired,skills,recipes,combinations,skillChoices,applySkill,rerollSkills,levelChoices,consumeLevelChoice} from '../progression/progression.js';
import {newRun,currentRoom,neighbor,travel,useShrine,canEscape,timeString,roomLocked} from './engine.js';
import {runRandom} from './random.js';
import {utilitySkills,chooseUtility,castUtility} from '../combat/utility.js';

const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
const store=new RunStore(storage),rankClient=new RankingClient(storage);
const rankUI=createRankingUI({client:rankClient,panel,stop});
const sound=createSoundSystem(storage);
document.documentElement.classList.toggle('calm-effects',sound.settings.reducedEffects);
document.addEventListener('pointerdown',()=>sound.unlock(),{once:true});document.addEventListener('keydown',()=>sound.unlock(),{once:true});
const updateHUD=createHUD();
let launching=false;
let practiceDraft=null;
let s=null,paused=true,mode='title',fx=[],bullets=[],last=performance.now(),accumulator=0,saveTick=0,toastTime=0,saveFailed=false;
const room=()=>currentRoom(s),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const touchControls=window.matchMedia('(pointer:coarse)');
const input=createInput($('stick'),dispatch);
const lease=new SessionLease(storage,()=>{paused=true;input.setEnabled(false);panel('<h2>다른 탭에서 진행 중</h2><p>이 탭은 저장 덮어쓰기를 막기 위해 멈췄습니다.</p><button id="goTitle">입구로</button>');button('goTitle',title);});
function toast(message){$('notice').textContent=message;toastTime=4;}
function save(){if(!s||s.status!=='playing')return false;if(s.practice){$('saveStatus').textContent='보스 테스트 · 일반 저장 유지';return true;}lease.heartbeat();if(!lease.active)return false;const result=store.write(s);saveFailed=!result.ok;$('saveStatus').textContent=result.ok?'진행 저장됨':'저장 실패';if(!result.ok)toast(result.error);return result.ok;}
function panel(html){$('overlay').innerHTML=`<div class="panel" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;$('overlay').firstElementChild.focus();}
const modalFocusables='button:not([disabled]):not([hidden]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
$('overlay').addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  const back=['settingsBack','closeInfo','cancelStart','rankBack','closeJournal','closeBag','leaveRoute','practiceBack','choosePractice','endPractice'].map($).find(item=>item?.getClientRects().length);
  if(back){event.preventDefault();event.stopPropagation();back.click();return;}
 }
 if(event.key!=='Tab')return;const dialog=$('overlay').firstElementChild;if(!dialog)return;
 const items=[...dialog.querySelectorAll(modalFocusables)].filter(item=>item.getClientRects().length>0);if(!items.length){event.preventDefault();dialog.focus();return;}
 if(event.shiftKey&&(document.activeElement===items[0]||document.activeElement===dialog)){event.preventDefault();items.at(-1).focus();}
 else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}
});
function button(id,fn){$(id)?.addEventListener('click',fn);}
function stop(nextMode){paused=true;mode=nextMode;input.setEnabled(false);accumulator=0;}
function resetTransient(){fx=[];bullets=s?.projectiles||[];saveTick=0;accumulator=0;last=performance.now();}
function title(){
 stop('title');lease.release();s=null;resetTransient();$('route').hidden=true;$('skill').hidden=true;$('utility').hidden=true;$('interact').hidden=true;
 $('floor').textContent='잊힌 탑의 입구';$('phase').textContent='THE FORSAKEN SPIRE';$('health').textContent='♥♥♥♥♥';$('level').textContent='LV 1';$('timer').textContent='00:00';$('objective').textContent='탑에 들어가 탈출 열쇠를 찾으세요.';
 const loaded=store.read(),exists=!!loaded.run;
 panel(`<img class="title-art" src="assets/images/title-art.png" alt="SPIREBOUND · 거대한 탑 입구 앞의 모험가"><h2 class="title-accessible">SPIREBOUND</h2><div class="title-content"><p class="title-lore">탑에 들어간 이들은 돌아오지 않았다.<br>탑의 꼭대기에는 탈출의 열쇠가 숨겨져 있다.<br>왕을 쓰러뜨려도 여정은 끝나지 않는다.<br><strong>살아서 내려와라.</strong></p><div class="title-actions"><p class="title-hint">이동하며 자동 공격 · 진행 상황은 이 브라우저에 저장됩니다.</p>${exists?`<p>저장된 도전: ${loaded.run.floor+1}/${loaded.run.floors.length}층 · ${timeString(loaded.run.elapsed)}${loaded.recovered?' · 백업 복구 가능':''}</p><button class="primary" id="continue">이어하기</button>`:''}${loaded.error?`<p role="alert">${escapeHtml(loaded.error)} 원본을 보관하려면 아래에서 백업을 받으세요.</p><button id="dataRecovery">기록 백업·가져오기</button>`:''}<button ${exists?'':'class="primary"'} id="start">새 도전 →</button></div><div class="title-secondary"><button id="rank">RANK</button><button id="guide">조작 안내</button><button id="records">도전 기록</button><button id="bossPractice">보스 테스트</button><button id="titleSettings">소리·화면 설정</button></div></div>`);
 button('start',()=>campaignMenu(exists));
 button('rank',()=>rankUI.board(title));button('bossPractice',practiceMenu);button('continue',continueRun);button('guide',()=>showInfo('help'));button('records',()=>showInfo('history'));button('dataRecovery',()=>location.assign('upgrade.html'));button('titleSettings',settingsPanel);
}
function campaignMenu(replacing=false){stop('campaign');panel(`<h2>새 도전 선택</h2>${replacing?'<p>현재 이어하기 저장을 새 도전으로 교체합니다.</p>':''}<p>기본 8층 · BETA-4 / 확장 10층 · ASCENT-6</p><button class="primary" id="startClassic">기본 8층 시작</button><button id="startExpanded">확장 10층 시작</button><button id="cancelStart">돌아가기</button>`);button('startClassic',()=>start(undefined,'classic'));button('startExpanded',()=>start(undefined,'expanded'));button('cancelStart',title);}
function start(seed,campaign='classic'){if(launching)return;beginRun(newRun(Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:undefined,{campaign}),true);}
async function beginRun(candidate,online){
 if(launching)return;launching=true;stop('rank-start');s=null;
 panel('<h2>새 도전 준비</h2><p id="rankStartStatus">'+(online?'온라인 랭킹에 도전을 연결하는 중…':'로컬 도전을 준비하는 중…')+'</p><button id="rankStartCancel">돌아가기</button>');
 const marker=$('rankStartStatus');button('rankStartCancel',title);
 try{
  if(!await lease.acquire()){title();toast('다른 탭에서 도전 중입니다. 그 탭을 종료한 뒤 다시 시도하세요.');return;}
  if(!marker.isConnected){lease.release();return;}
  if(online)await rankClient.start(candidate);else delete candidate.ranking.online;
  if(!marker.isConnected){lease.release();return;}
  s=candidate;ensureMetrics(s);resetTransient();enterRoom(s);if(document.hidden)pause('다시 화면으로 돌아온 뒤 시작하세요.');else resume();save();toast(online?'랭킹 도전 시작 · 탈출 후 이름을 남길 수 있습니다.':'로컬 도전 시작 · 온라인 랭킹에는 등록되지 않습니다.');
 }catch(error){
  lease.release();if(!marker.isConnected)return;
 panel('<h2>랭킹 연결 실패</h2><p>'+escapeHtml(rankingError(error))+'</p><p>로컬로 시작해도 플레이와 개인 기록은 저장되지만, 이번 도전은 온라인 순위에 등록되지 않습니다.</p><button class="primary" id="rankStartRetry">다시 연결</button><button id="rankStartLocal">로컬로 시작</button><button id="rankStartCancel">돌아가기</button>');
  button('rankStartRetry',()=>beginRun(candidate,true));button('rankStartLocal',()=>beginRun(candidate,false));button('rankStartCancel',title);
 }finally{launching=false;}
}
async function continueRun(){if(launching)return;launching=true;try{
 if(!await lease.acquire()){toast('다른 탭에서 도전 중입니다. 그 탭을 종료한 뒤 다시 시도하세요.');return;}
 const loaded=store.read();if(!loaded.run){lease.release();title();toast(loaded.error||'이어갈 도전이 없습니다.');return;}
 s=loaded.run;enterShrine(s);ensureMetrics(s);resetTransient();resume();if(loaded.recovered)toast('마지막 정상 백업에서 복구했습니다.');save();}finally{launching=false;}
}
function escapeNotice(){stop('return');save();const ending=s.campaign==='expanded'?'대악마를 쓰러뜨리고 마지막 열쇠를 되찾았습니다.':'왕은 쓰러졌지만, 탑의 저주는 풀리지 않았습니다.';panel('<div class="escape-reveal">'+returnStoryMarkup(s.floors.length>=8)+'<small>THE WAY HOME</small><h2>1층 탈출 열쇠 획득</h2><p>'+ending+'<br>탑의 몬스터들이 광폭화했습니다.<br><strong>이제 아래층으로 내려가 1층 입구에서 탈출하세요.</strong><br>하강 시 미방문 방은 전멸해야 출구가 열립니다. 방문한 방도 30% 확률로 열쇠수호자가 문을 잠급니다. 내려가는 계단은 방의 적을 전멸해야 열립니다.</p><button class="primary" id="beginReturn">1층으로 귀환 시작 ↓</button></div>');button('beginReturn',()=>{s.returnNoticePending=false;save();resume();});}
function resume(){if(!s||s.status!=='playing'||!s.practice&&!lease.active)return;if(s.returnNoticePending){escapeNotice();return;}if(shrineLocked(room())){shrine();return;}if(!s.player.mainSkill&&(s.pendingLevels||mainSkills.some(id=>s.player[id]>0))){mainPanel();return;}if(pendingEvolution(s.player)){evolutionPanel();return;}if(!s.practice&&s.player.level>=4&&!s.player.utility){utilityPanel();return;}if(s.pendingHeal){s.player.hp=Math.min(s.player.max,s.player.hp+1);s.pendingHeal=false;}mode='play';paused=false;$('overlay').innerHTML='';canvas.focus();input.setEnabled(true);accumulator=0;last=performance.now();if(s.pendingLevels)levelUp();}
function pause(reason=''){if(!s||s.status!=='playing'||['title','result','level'].includes(mode))return;stop('pause');const ok=save();if(s.practice){practicePause();return;}panel(`<small>TAKE A BREATH</small><h2>잠시 쉬어가기</h2><p>${reason||'게임과 기록 시간이 멈췄습니다.'}<br>${ok?'진행 상황이 저장되었습니다.':'저장하지 못했습니다. 진단 기록을 내려받아 보관할 수 있습니다.'}</p><button class="primary" id="resume">계속 탐험</button><button id="quit">저장 후 입구로</button><button id="guide">조작 안내</button><button id="pauseSettings">소리·화면 설정</button><button id="journal">원정 기록 · 도감</button><button id="export">진단 기록 받기</button>`);button('resume',resume);button('quit',()=>{if(save())title();});button('guide',()=>showInfo('help'));button('pauseSettings',settingsPanel);button('export',exportReport);button('journal',journalPanel);}
function settingsPanel(){
 if(mode==='play')pause();if(!['title','pause','result'].includes(mode)){toast('설정은 입구나 일시정지에서 열 수 있습니다.');return;}
 const from=mode,settings=sound.settings;stop('settings');
 panel(`<small>ACCESSIBILITY</small><h2>소리·화면 설정</h2><p>이 브라우저에 저장됩니다. 위험 예고의 색과 모양은 항상 표시됩니다.</p><div class="settings-controls"><button id="soundMute" aria-pressed="${settings.muted}">${settings.muted?'효과음 끔':'효과음 켬'}</button><label for="soundVolume">효과음 크기 <output id="soundValue">${Math.round(settings.volume*100)}%</output></label><input id="soundVolume" type="range" min="0" max="100" step="10" value="${Math.round(settings.volume*100)}"><label class="settings-check"><input id="calmEffects" type="checkbox" ${settings.reducedEffects?'checked':''}> 장식성 화면 효과 줄이기</label></div><button class="primary" id="settingsBack">돌아가기</button>`);
 button('soundMute',()=>{const next=sound.update({muted:!sound.settings.muted});$('soundMute').textContent=next.muted?'효과음 끔':'효과음 켬';$('soundMute').setAttribute('aria-pressed',String(next.muted));if(!next.muted){sound.unlock();sound.play('reward');}});
 $('soundVolume').addEventListener('input',()=>{const next=sound.update({volume:Number($('soundVolume').value)/100});$('soundValue').value=Math.round(next.volume*100)+'%';});
 $('calmEffects').addEventListener('change',()=>{const next=sound.update({reducedEffects:$('calmEffects').checked});document.documentElement.classList.toggle('calm-effects',next.reducedEffects);});
 button('settingsBack',()=>from==='title'?title():from==='result'?resultPanel():pause());
}
function showInfo(kind){if(mode==='rank-start')return;const during=!!s&&s.status==='playing';if(mode==='level')return;stop('info');if(during)save();panel(kind==='history'?historyMarkup(storage):helpMarkup());button('closeInfo',()=>during?pause():title());if(kind==='history')button('dataBackup',()=>location.assign('upgrade.html'));}
function exportReport(){downloadJSON('spirebound-report.json',diagnostic(s,saveFailed?'저장 오류 있음':''));}
function bag(){if(!s||s.status!=='playing'||mode==='level')return;stop('bag');save();const p=s.player;
 panel(`<small>ROYAL SCOUT / INVENTORY</small><h2>여행자의 가방</h2><div class="guide"><p>무기 · ${p.weapon?'강화 장궁':'정찰병의 활'} / 공격력 ${p.damage}<br>유물 · ${ownedRelics(p).map(id=>relicInfo(id).name+' — '+relicInfo(id).description).join('<br>')||'없음'}<br>방어구 · ${p.armor?'보호막 재충전 '+shieldCooldown(p)+'초':'보호막 없음'}<br>바람의 인장 · ${ownedRelics(p).includes('windSeal')?'20회 처치당 1하트 ('+(p.leechKills||0)+'/20)':'없음'}</p><p>메인 · ${skills.find(k=>k.id===p.mainSkill)?.name||'미선택'}<br>익힌 기술 · ${skills.filter(k=>p[k.id]>0).map(k=>k.name+' '+p[k.id]).join(' / ')||'없음'}<br>선택 분기 · ${evolutionSummary(p)}<br>활성 조합 · ${combinations(p).map(c=>c.name).join(' / ')||'없음'}<br>궁극기 · ${ultimateUnlocked(p)?'해금됨':'미습득 · 5레벨부터 레벨업 선택지에 등장'}</p><p>물약 ${p.potions}개 · 음식 ${p.food}개<br>${s.pendingHeal?'음식 회복이 예약되었습니다. 재개할 때 1하트 회복합니다.':'음식은 안전한 방에서 사용합니다.'}</p></div><button id="eat" ${room().enemies.length||!p.food||s.pendingHeal||p.hp>=p.max?'disabled':''}>음식 먹기 · 1하트</button><button id="journal">원정 기록 · 도감</button><button class="primary" id="closeBag">탐험 재개</button>`);
 button('journal',journalPanel);button('eat',()=>{p.food--;s.pendingHeal=true;save();bag();});button('closeBag',()=>{resume();save();});
}
function levelUp(){
 if(!s.player.mainSkill){mainPanel();return;}
 stop('level');const choices=levelChoices(s,()=>runRandom(s));save();
 if(!choices.length){s.player.hp=Math.min(s.player.max,s.player.hp+1);consumeLevelChoice(s);emitInteraction(s,'level',room(),{level:s.player.level});resume();return;}
 panel('<small>CHOOSE YOUR PATH</small><h2>새로운 깨달음</h2><p>'+ (choices[0]?.growth?'기술 강화를 마쳤습니다. 이번 도전의 기본 능력을 추가로 성장시키세요.':'궁극기는 5·10레벨 미습득 시 확정 후보, 그 외 5레벨 이후 30% 확률로 등장합니다.')+'</p><div class="cards">'+choices.map((k,i)=>'<button class="skill-'+k.grade+'" id="u'+i+'">'+iconSVG(k.icon||k.id)+'<b>'+ '['+(k.growth?'추가 성장':gradeLabels[k.grade])+'] '+k.name+(k.growth?'':' '+((s.player[k.id]||0)+1)+' / '+k.max)+'</b><span>'+k.description+'</span>'+skillPreviewMarkup(s.player,k.id)+'<em>'+recipes.filter(r=>r.needs.includes(k.id)&&r.needs.every(id=>allowedSkill(s.player,id))).map(r=>r.name+' · '+r.needs.map(id=>skills.find(a=>a.id===id).name).join(' + ')).join('<br>')+'</em></button>').join('')+'</div><button id="reroll" '+((s.rerolls??1)>0&&!choices.every(k=>k.growth)?'':'disabled')+'>후보 새로고침 · '+(s.rerolls??1)+'회</button>');
 button('reroll',()=>{if(rerollSkills(s)){save();levelUp();}});
 choices.forEach((k,i)=>button('u'+i,()=>{const was=ultimateUnlocked(s.player),previous=combinations(s.player).map(c=>c.name);if(!applyLevelReward(s,k.id))return;if(k.id==='ultimate')s.skill=0;const unlocked=combinations(s.player).filter(c=>!previous.includes(c.name));if(unlocked.length)toast('조합 완성 · '+unlocked.map(c=>c.name).join(' / '));if(!was&&ultimateUnlocked(s.player)){s.skill=0;toast('궁극기 화살비 해금 · F');}consumeLevelChoice(s);emitInteraction(s,'level',room(),{level:s.player.level});resume();save();}));
}
let endResult={ok:true};
function finish(won){if(s.practice){s.status=won?'won':'dead';practiceResult();return;}if(s.status!=='playing')return;s.status=won?'won':'dead';stop('result');finishRanking(s);rankClient.draft(s);endResult=store.complete(s,won);lease.release();resultPanel();}
function resultPanel(){
 if(s?.practice){practiceResult();return;}
 const won=s.status==='won',rankDraft=rankClient.draft(s);stop('result');
 panel(`<div class="result-screen ${won?'result-win':'result-loss'}">${resultOverviewMarkup(s,won?escapeStoryMarkup():'')}${rankingMarkup(s)}${rankDraft?'<button class="primary result-rank" id="rankRegister">'+(rankDraft.receipt?'등록 결과 보기':'이름 남기기 · 랭킹 등록')+'</button>':''}${won?'':deathSummaryMarkup(s)}<p class="result-save">${endResult.ok?'개인 기록을 저장했습니다.':escapeHtml(endResult.error)}</p><div class="result-actions"><button class="primary" id="again">입구로 돌아가기</button><button id="journal">원정 기록 · 도감</button>${s.generationVersion>=17?'<button id="retrySeed">같은 지도에서 새 도전</button>':''}<button id="export">진단 기록 받기</button></div>${resultBuildMarkup(s)}</div>`);
 button('rankRegister',()=>rankUI.submission(rankDraft,resultPanel));button('again',title);const retrySeed=s.seed,retryCampaign=s.campaign||'classic';button('retrySeed',()=>start(retrySeed,retryCampaign));button('journal',journalPanel);button('export',exportReport);
}

function potion(){if(paused)return;ensureMetrics(s);if(!usePotion(s))return;sound.play('reward');toast('회복 물약 · '+(1+relicStat(s.player,'potion'))+'하트 회복');save();}
function dodge(){if(paused||s.dodge>0)return;if(!castBlink(s,input.direction())){toast('이 방향은 막혀 있습니다. 다른 방향으로 이동 후 점멸하세요.');return;}ensureMetrics(s).dodgesUsed++;fx.push({x:s.player.x,y:s.player.y,r:40,t:.35,color:'#d5eed4'});}
function skill(){if(paused)return;const before=new Map(room().enemies.map(e=>[e,e.hp]));if(!castUltimate(s))return;sound.play('boss');fx=mergeEnemyFeedback(fx,enemyHitEffects(before,room().enemies));ensureMetrics(s).ultimatesUsed++;toast(s.player.evolutions?.ultimate==='turret'?'궁극기 · 자동 저격 석궁':'궁극기 · 화살비');}
function utility(){if(paused)return;const id=castUtility(s);if(!id){toast('유틸 기술을 지금 사용할 수 없습니다.');return;}const name=utilitySkills.find(k=>k.id===id).name;toast('유틸 · '+name);fx.push({x:s.player.x,y:s.player.y-20,r:36,t:.4,color:id==='focus'?'#f4d590':id==='guardian'?'#a9d9eb':'#9cdfae'});save();}
function interaction(){
 if(s?.practice)return null;
 if(!s||s.status!=='playing')return null;const r=room();
 if(r.hasChest&&!r.chestUsed&&!r.enemies.length&&distance(s.player,objectPoint(r,true))<=65)return ['보물 상자 열기',()=>{prepareChest(s);save();if(openChest(s)){emitInteraction(s,'chest',r,{...objectPoint(r,!!r.hasChest),trap:['elites','boss'].includes(r.lastLoot?.id)});save();toast(lootLabel(room().lastLoot));resume();}}];
 if(r.type==='down'&&r.fountainReady&&distance(s.player,fountainPoint(r))<=70)return [s.player.hp>=s.player.max?'샘물 · 체력이 가득합니다':'샘물 · '+Math.min(3,s.player.max-s.player.hp)+'하트 회복 · 사용 후 소모',()=>{const amount=Math.min(3,s.player.max-s.player.hp);if(!useFountain(s))return;emitInteraction(s,'fountain',r,fountainPoint(r));save();toast('샘물 사용 · '+amount+'하트 회복');}];
 if(distance(s.player,objectPoint(r))>78)return null;
 if(r.demonPending)return ['대악마에게 도전',()=>{if(challengeDemon(s)){save();toast('왕을 조종하던 대악마가 모습을 드러냅니다.');}}];
 if(r.commanderPending)return ['악마 군단장에게 도전',()=>{if(challengeCommander(s)){save();toast('악마 군단장이 얼음 활을 듭니다.');}}];
 if(r.kingPending)return ['타락한 왕에게 도전',()=>{if(challengeKing(s)){save();toast('타락한 왕, 모르드가 왕좌에서 일어납니다.');}}];
 if(r.type==='fountain'&&!r.used&&!r.enemies.length)return [s.player.hp>=s.player.max?'샘물 · 체력이 가득합니다':'샘물 · '+Math.min(3,s.player.max-s.player.hp)+'하트 회복 · 사용 후 소모',()=>{const amount=Math.min(3,s.player.max-s.player.hp);if(!useFountain(s))return;emitInteraction(s,'fountain',r,objectPoint(r));save();toast('샘물 사용 · '+amount+'하트 회복');}];
 if(r.type==='treasure'&&!r.used&&!r.enemies.length)return ['보물 상자 열기',()=>{prepareChest(s);save();if(openChest(s)){emitInteraction(s,'chest',r,{...objectPoint(r,!!r.hasChest),trap:['elites','boss'].includes(r.lastLoot?.id)});save();toast(lootLabel(room().lastLoot));resume();}}];
 if(r.type==='event'&&!r.enemies.length&&(!r.used||r.trialState==='reward'))return [r.trialState==='reward'?'시련 보상 선택':'수상한 제단 · 위험과 보상',()=>r.trialState==='reward'?rewardPanel(true):eventPanel()];
 if(r.used&&!r.enemies.length&&r.relicOffers&&!r.relicClaimed)return ['유물함 · 선택 또는 지나가기',relicPanel];
 if(r.type==='up'&&s.campaign==='expanded'&&s.floor===8&&!s.floors[8].some(room=>room.type==='boss'&&room.commanderPending===false&&room.used))return ['군단장 처치 후 계단 개방',()=>toast('9층 군단장을 먼저 처치해야 합니다.')];
 if(!roomLocked(s)&&(r.type==='up'||r.type==='boss'&&r.used)&&s.floor<s.floors.length-1)return [(s.floor+2)+'층으로 올라가기',()=>changeFloor(s.floor+1)];
 if(r.type==='down'&&!roomLocked(s)&&(!s.key||!returnStairsLocked(r)))return [s.floor+'층으로 내려가기',()=>changeFloor(s.floor-1)];
 if(r.type==='shrine'&&!r.used&&!r.enemies.length)return ['신전의 축복·저주 · 반드시 하나 선택',shrine];
 if(r.type==='exit'&&s.key&&finalEscapeRequired(s)&&!r.finalEscape)return [r.enemies.some(e=>e.hp>0)?'남은 추격자를 처치하세요':'열쇠로 마지막 봉인 깨기',()=>{if(startFinalEscape(s,r)){save();toast('마지막 봉인이 무너집니다 · 36초를 버티세요.');}}];
 if(canEscape(s))return [finalEscapeRequired(s)?'열린 탈출구로 나가기':'열쇠로 탈출하기',()=>finish(true)];
 if(r.type==='exit'&&r.finalEscape)return null;
 if(r.type==='exit')return ['출구 봉쇄 · 열쇠 필요',()=>toast('최상층 수호자가 열쇠를 지키고 있습니다.')];return null;
}
function shrine(){if(!prepareIncantations(s))return;stop('shrine');save();const r=room();panel('<small>ANCIENT INCANTATION</small><h2>신전의 축복·저주</h2><p>입장 시 축복·저주 중 하나를 반드시 선택합니다. 선택하는 동안 전투는 멈춥니다.<br>선택 후 정예 전투가 시작됩니다. 효과는 이번 도전 동안 유지됩니다.<br>저주 2개 20% · 축복/저주 50% · 축복 2개 30%</p><div class="cards">'+r.incantations.map((id,i)=>{const k=incantationInfo(id);return '<button id="hex'+i+'" class="incantation '+(k.good?'blessing':'curse')+'">'+iconSVG(k.good?'sun':'poison')+'<b>'+k.name+'</b><span>'+(k.good?'축복':'저주')+' · '+k.description+'</span></button>';}).join('')+'</div>');r.incantations.forEach((id,i)=>button('hex'+i,()=>{if(useShrine(s,i)){save();resume();}}));}

function interact(){if(paused)return;interaction()?.[1]();save();}
function changeFloor(f){const direction=f-s.floor;if(travel(s,direction)){enterRoom(s);emitInteraction(s,'stairs',room(),{x:s.player.x,y:s.player.y,direction});fx=[];bullets=s.projectiles;save();}}
function heavyWarningKey(){const a=room().enemies.find(e=>e.variant==='king')?.darkAttack;return a&&(a.kind==='judgment'||a.finisher)?a.kind+':'+a.step:'';}
function update(dt){if(!s||paused)return;const beforeRoom=room();const beforeWarning=heavyWarningKey();const result=stepRun(s,dt,input.movement());bullets=s.projectiles;for(const effect of result.effects)if(effect.essencePickup)emitInteraction(s,'essence',room(),{x:effect.fromX,y:effect.fromY,color:effect.color});if(heavyWarningKey()&&heavyWarningKey()!==beforeWarning)sound.play('warning');if(result.events.includes('shot'))sound.play('shot');if(result.effects.some(f=>f.enemyFeedback==='hit'))sound.play('hit');if(result.effects.some(f=>f.hitSource))sound.play('hurt');if(result.events.some(e=>['demonPhase','finalWave'].includes(e)))sound.play('boss');if(result.events.some(e=>['roomClear','key','gateReward','trialReward','finalReady'].includes(e)))sound.play('reward');if(result.events.includes('room'))fx=[];fx=mergeEnemyFeedback(fx,result.effects);fx=limitElementHits(fx.filter(f=>(f.t-=dt)>0));
 if(s.practice){s.player.xp=0;s.pendingLevels=0;s.levelQueue=[];if(practiceCleared(s)&&!result.events.includes('dead')){finish(true);return;}}
 if(result.events.includes('dead')){finish(false);return;}
 const messages={demonPhase:room().demon?.phase===2?'대악마가 눈·코·입으로 갈라집니다.':'상단 벽이 무너지고 대악마 본체가 나타납니다.',returnUnlock:'봉인 해제 · 다시 이동할 수 있습니다.',gateReward:'정예 관문 돌파 · 계단에서 유물을 선택하세요.',eliteReward:'정예 처치 · 물약 1개 획득',trialReward:'시련 완료 · 제단에서 보상을 선택하세요.',shield:'보호막이 공격을 막았습니다.',potion:'회복 물약 획득',key:'열쇠 획득! 1층 출구로 귀환하세요.',finalWave:'악마 잔영이 출구를 습격합니다!',finalReady:'마지막 봉인 파괴 · 지금 탈출하세요!',stairs:'중간 보스 격파! 위층 계단이 열렸습니다.'};for(const event of result.events)if(messages[event])toast(messages[event]);
 if(result.events.includes('roomClear')){const r=room();emitInteraction(s,'roomClear',r,{unlocked:beforeRoom===r&&!s.key&&!roomLocked(s,r),doors:[0,1,2,3].map(d=>neighbor(s,d)>=0)});toast('방 클리어 · 물약 획득 '+(r.battlePotions||0)+'개 · 정수 획득 '+(r.collectedEssences||0)+'개 · 바닥 정수 '+(r.essences?.length||0)+'개'+(r.relicOffers&&!r.relicClaimed?' · 유물 선택 가능':''));}
 if(result.events.includes('key')){escapeNotice();return;}
 if(result.events.includes('incantation'))shrine();else if(result.events.includes('level'))levelUp();saveTick+=dt;if(saveTick>=2||result.events.some(e=>['room','stairs','key','demonPhase'].includes(e))){saveTick=0;save();}
}

function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(t,x,y,c='#c8d3bd',size=12){ctx.fillStyle=c;ctx.font=`${size}px Galmuri, monospace`;ctx.textAlign='center';ctx.fillText(t,x,y);}
function sprite(x,y,type,entity=null){drawPixelActor(ctx,entity||{x,y,type},s?.elapsed||0,s);}
function draw(){updateHUD(s);ctx.clearRect(0,0,960,540);rect(0,0,960,540,'#11191b');const infernal=s?.floor>=8,deep=s?.floor>=9;for(let y=40;y<510;y+=30)for(let x=25;x<940;x+=35){let n=((x*17+y*31)%19);rect(x,y,34,29,infernal?(deep?(n<5?'#2d2832':n<12?'#29252e':'#24222b'):(n<5?'#342c2d':n<12?'#302829':'#2a2528')):(n<5?'#283231':n<12?'#252e2d':'#222c2b'));if(n<3)rect(x+4,y+20,12,2,infernal?(deep?'#56404c':'#654039'):'#354039');}drawStoneWalls(ctx,outerWalls,s?.floor||0);for(const x of [85,875])for(const y of [82,455]){rect(x-8,y,16,20,'#515b4d');rect(x-4,y-12,8,15,'#cf9854');rect(x-2,y-17,5,12,'#f0cc7c');}
 if(!s){sprite(480,285,'player');return;}const r=room();drawFloorMood(ctx,s,r);drawWorldDetails(ctx,s,r);if(r.type==='boss'&&r.used&&s.floor===7){rect(463,95,34,24,'#b69854');text('왕관의 유물함',480,76,'#ead18d');}if(r.demonPending){drawDemon(ctx,{x:480,y:140,variant:'demon',part:'core'},s.elapsed);text('대악마 · E 키로 도전',480,200,'#e4b7df');}if(r.commanderPending){drawCommander(ctx,{x:480,y:112,variant:'commander',commander:{phase:1}},s.elapsed);text('군단장 · E 키로 도전',480,175,'#c6e9f4');}if(r.kingPending){rect(438,62,84,90,'#554254');rect(450,70,60,60,'#7b3554');drawUpper(ctx,{x:480,y:112,type:'boss',variant:'king',hp:7200,max:7200});text('왕좌 · E 키로 도전',480,180,'#dbb9ee');}for(let d=0;d<4;d++)if(neighbor(s,d)>=0){let x=d===1?931:d===3?0:440,y=d===0?0:d===2?505:235;rect(x,y,d%2?29:80,d%2?70:35,'#101b1b');if(roomLocked(s,r))rect(x,y,d%2?20:80,d%2?70:20,'#895c46');drawDoorFrame(ctx,x,y,d%2,roomLocked(s,r));}
 if(s.floors.length===6&&s.floor===5&&r.type==='boss'){for(let i=0;i<5;i++){rect(454+i*4,89+i*7,44-i*6,4,'#666b69');}rect(471,88,9,33,'#18201f');rect(486,109,14,8,'#18201f');rect(448,125,8,5,'#777a70');rect(499,122,6,8,'#777a70');text('7층 · 무너진 계단',480,76,'#96998f');if(r.relicOffers&&!r.relicClaimed){rect(463,148,34,24,'#b69854');text('보스 유물함',480,190,'#ead18d');}}
 if(r.hasChest){ctx.save();const chestPosition=objectPoint(r,true);ctx.translate(chestPosition.x-600,chestPosition.y-115);rect(583,95,34,24,r.chestUsed?'#4f4b36':'#b69854');rect(598,99,5,9,'#ead18d');text(r.chestUsed?'빈 상자':'보물 상자',600,76);ctx.restore();}
 if(s.key&&returnSealText(r))text(returnSealText(r),480,42,'#e5bb89',12);
 if(!s.key&&r.enemies.length&&r.type!=='boss')text('출구 봉쇄 · 남은 적 '+r.enemies.filter(e=>e.hp>0).length,480,42,'#e59d91',12);
 ctx.save();const objectPosition=objectPoint(r);ctx.translate(objectPosition.x-480,objectPosition.y-115);
 if(['up','down','exit','fountain','treasure','shrine','event'].includes(r.type)||r.type==='boss'&&r.used&&s.floor<s.floors.length-1){rect(453,85,54,43,'#151f21');if(r.type==='event'){rect(465,90,30,32,r.used?'#625666':'#a184b6');text(r.trialState==='reward'?'시련 보상':r.used?'계약한 제단':'위험과 보상',480,76);}else if(r.type==='shrine'){rect(465,88,30,38,r.used?'#50545a':'#9a88bb');text(r.used?'선택 완료 · '+(incantationInfo(r.incantationChoice)?.name||'신전의 축복·저주'):'신전의 축복·저주 · 입장 시 선택',480,76);}else if(r.type==='fountain'){rect(456,100,48,25,'#667c76');rect(462,98,36,18,r.used?'#34423e':'#68b4ac');text(r.used?'메마른 샘':'요정의 샘물',480,76);}else if(r.type==='treasure'){rect(463,95,34,24,r.used?'#4f4b36':'#b69854');rect(478,99,5,9,'#ead18d');text(r.used?'빈 상자':'보물 상자',480,76);}else{for(let i=0;i<5;i++)rect(457+i*3,89+i*7,46-i*6,4,'#8a9380');text(r.relicOffers&&!r.relicClaimed?'유물함':r.type==='exit'?(s.key?'탈출구':'봉쇄된 출구'):r.type==='down'?(s.key&&returnStairsLocked(r)?'봉인된 하강 계단':'↓ '+s.floor+'층'):r.gate&&!r.used?'봉인된 8층 계단':'↑ '+(s.floor+2)+'층',480,76);}}
 ctx.restore();
 if(typeof r.fountainReady==='boolean'){const point=fountainPoint(r);rect(point.x-27,point.y-10,54,27,'#151f21');rect(point.x-23,point.y-7,46,20,'#667c76');rect(point.x-18,point.y-8,36,17,r.fountainReady?'#68b4ac':'#34423e');text(r.fountainReady?'결전 전 샘물':'메마른 샘',point.x,point.y-38,'#b7d5cf');}
 for(let d=0;d<4;d++){const n=neighbor(s,d);if(n>=0&&s.floors[s.floor][n].type==='shrine'&&!s.floors[s.floor][n].used)text('축복·저주 · 입장 시 선택',d===1?860:d===3?100:480,d===0?62:d===2?491:235,'#e4a4db',11);}
 drawObstacles(ctx,r.obstacles,s.floor);drawDemonGround(ctx,r,s.elapsed);drawObjectDetails(ctx,s,r);drawFinalEscape(ctx,r,s.elapsed);drawInteractionEffects(ctx,s,r);if(s.key)drawReturnSeal(ctx,r);
 if(r.allyZone){drawSoftField(ctx,r.allyZone.x,r.allyZone.y,r.allyZone.r,'#f2dc9b',.4);}
 drawUltimateGround(ctx,r);drawEssences(ctx,r,s.elapsed);drawElites(ctx,r);drawHazards(ctx,r,s.elapsed);drawElements(ctx,r,s.elapsed);drawOpenings(ctx,r);if(s.player.aura)drawAuraField(ctx,s.player,auraProfile(s.player.aura).radius*(1+relicStat(s.player,'auraRange')),s.elapsed,s.player.aura>=3&&!(s.auraShield>0));
 drawUpperLinks(ctx,r,s.elapsed);for(const e of r.enemies){drawUpperGround(ctx,e,s.elapsed);drawCommanderGround(ctx,e,s.elapsed);drawInfernalGround(ctx,e);}
 r.enemies.forEach(e=>{if(e.chargeAngle!==undefined&&e.cd>=chargeProfile(e).duration){ctx.strokeStyle='#e2b16e88';ctx.lineWidth=1;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.chargeAngle)*120,e.y+Math.sin(e.chargeAngle)*120);ctx.stroke();ctx.setLineDash([]);}if(e.type==='ricochet'&&e.cd<.65){ctx.strokeStyle='#dd9973';drawSoftField(ctx,e.x,e.y,e.type==='boss'?43:26,'#dd9973',.4);}if(e.variant!=='king'&&e.variant!=='commander'&&e.variant!=='demon'&&!upperTypes.includes(e.type)&&!infernalTypes.includes(e.type)&&e.variant!=='prism'&&e.type!=='brute'&&e.type!=='flower'&&e.type!=='minislime'&&e.variant!=='slime'){ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.scale??1,e.scale??1);ctx.translate(-e.x,-e.y);sprite(e.x,e.y,e.type,e);ctx.restore();}drawUpper(ctx,e,s.elapsed);drawCommander(ctx,e,s.elapsed);drawDemon(ctx,e,s.elapsed);drawReturnEnemy(ctx,e);drawInfernal(ctx,e);if(e.type==='brute')drawEnemyDetails(ctx,s.key?{...e,escapeDepth:e.escapeDepth||1}:e);drawPoisonEnemy(ctx,s.key?{...e,escapeDepth:e.escapeDepth||1}:e,s.elapsed,r);if(e.variant==='prism')drawPrism(ctx,s.key?{...e,escapeDepth:1}:e,r.obstacles,r.enemies,s.elapsed);drawPattern(ctx,e);drawRanged(ctx,s.key?{...e,escapeDepth:e.escapeDepth||1}:e,r.obstacles);if(e.burn>0)rect(e.x-17,e.y-8,4,10,'#ed9a55');if(e.slow>0)rect(e.x+14,e.y-8,4,10,'#91d0e3');const healthY=e.y-(e.variant==='king'?83:e.type==='boss'?52:36)-(e.attackPhase==='leap'?bossPose(e).lift:0);rect(e.x-15,healthY,30,3,'#131b1b');rect(e.x-15,healthY,30*Math.max(0,e.hp/e.max),3,s.key?'#d7766b':'#a7ad7b');});if(s.player.focusTime>0)drawSoftField(ctx,s.player.x,s.player.y,30,'#f3d18a',.22);if(s.guardianTime>0&&s.guardianCharges>0)drawSoftField(ctx,s.player.x,s.player.y,34,'#a9d8eb',.28);if(sound.settings.reducedEffects||s.invulnerable<=0||Math.floor(s.invulnerable*20)%2===0)sprite(s.player.x,s.player.y,'player');bullets.forEach(b=>drawProjectile(ctx,b,s.elapsed,s.player));drawPassives(ctx,s);const compactEffects=touchControls.matches;readableEffects(fx,compactEffects).forEach(f=>{if(sound.settings.reducedEffects&&!f.text)return;if(drawBurst(ctx,f))return;if(drawEnemyFeedback(ctx,f))return;if(drawElementHit(ctx,f))return;drawImpact(ctx,f);if(f.thunder){drawThunder(ctx,f);return;}if(f.text){drawHitFeedback(ctx,f);return;}ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();if(f.slash){ctx.moveTo(f.x-16,f.y+14);ctx.lineTo(f.x+16,f.y-14);ctx.moveTo(f.x+8,f.y-16);ctx.lineTo(f.x+18,f.y-18);}else if(f.toX!==undefined){ctx.moveTo(f.x,f.y);ctx.lineTo(f.toX,f.toY);}else {drawSoftField(ctx,f.x,f.y,f.instant?f.r:f.r*(1-f.t),f.color,.5);return;}ctx.stroke();});drawCombatLabels(ctx,fx,compactEffects);
 for(const e of r.enemies)if(e.precisionHits>0&&e.precisionTime>0)text('◆'.repeat(e.precisionHits),e.x,e.y-(e.type==='boss'?63:46),'#f3d999',9);drawSpellDetails(ctx,r,s.elapsed);drawRoomStory(ctx,s,r);drawMinimap(ctx,s.floors[s.floor],r,s.key?returnRoutes(s)[s.routePreference||'short']:[],mapped=>[0,1,2,3].map(d=>neighbor(s,d,s.floors[s.floor].indexOf(mapped))>=0));$('route').hidden=!s.key||s.status!=='playing';if(s.key){ctx.strokeStyle='#b74c4866';ctx.lineWidth=8;ctx.strokeRect(4,4,952,532);}const boss=r.enemies.find(e=>e.type==='boss');if(boss?.variant==='prism'){const status=prismStatus(boss,r.enemies),left=status.remaining,count=status.count;rect(350,43,260,5,'#252532');rect(350,43,260*Math.max(0,1-left/PRISM_SUMMON.interval),5,'#c6a1ef');text(count>=3?'소환 대기 · 정예 3/3':'정예 소환 '+left.toFixed(1)+'초 · '+count+'/3',480,61,'#d8b8ee',10);text(status.shielded?'보호막 활성 · 받는 피해 ⅓ · 수호자 처치 필요':'보호막 해제 · 정상 피해',480,77,status.shielded?'#e4b6ff':'#bce7b5',11);}if(boss){rect(280,27,400,7,'#182120');rect(280,27,400*bossHealth(r).ratio,7,'#b67864');if(boss.variant==='demon'){text('대악마 · '+r.demon.phase+' / 3단계 · '+demonPartName(boss.part),480,48,'#e9bddd',10);}if(boss.variant==='commander'){rect(480,25,2,11,'#c3ecf4');text(commanderPhase(boss)===2?'2페이즈 · 삼갈래 연사':'1페이즈 · 두갈래 연사',480,48,'#c5eaf5',10);}if(boss.variant==='king'){for(const ratio of [.65,.3]){rect(280+400*ratio,25,2,11,'#eed6f7');text(Math.round(ratio*100)+'%',280+400*ratio,46,'#eed6f7',10);}if(boss.guardPortal)text('망령 소환 중',480,64,'#dfbdff');}text(boss.variant==='demon'?'대악마의 신체 · '+r.demon.phase+'단계':boss.variant==='commander'?'악마 군단장 · 빙결 궁수':boss.variant==='king'?'타락한 왕, 모르드 · '+['','검은 왕','타락한 왕','왕관 속 마왕'][kingPhase(boss)]:boss.variant==='slime'?'독성 군체 · 남은 분열체 '+r.enemies.filter(e=>e.type==='boss').length:boss.variant==='prism'?'프리즘의 수호자':'녹슨 탑의 파수꾼',480,20,'#d6bfa1',11);}
 $('potion').disabled=paused||s.potionCooldown>0||!s.player.potions||s.player.hp>=s.player.max;$('health').setAttribute('aria-label',`체력 ${s.player.hp}/${s.player.max}하트`);$('floor').textContent=`${s.floor+1}층 · ${floorNames[s.floor]}`;$('phase').textContent=s.practice?'BOSS PRACTICE / 보스 테스트':s.status==='won'?'THE ESCAPE / 탈출 완료':s.status==='dead'?'THE END / 도전 종료':s.key?(r.type==='exit'&&r.finalEscape&&!r.finalEscape.ready?'THE ESCAPE / 마지막 봉인':'THE FRENZY / 광폭 '+(s.floors.length-s.floor)+'단계'):'THE ASCENT / 탐험';$('health').textContent=healthDisplay(s.player)+(s.player.armor>0?(s.shield>0?' · ◈ '+Math.ceil(s.shield)+'초':' · ◈ 준비'):'');$('level').textContent=`LV ${s.player.level} · XP ${s.player.xp}/${xpRequired(s.player.level)}`;$('timer').textContent=timeString(s.elapsed);$('objective').textContent=s.practice?(s.status==='playing'?'선택한 보스를 처치하세요 · ESC로 같은 빌드 재도전':'다시 도전하거나 다른 보스를 선택하세요.'):s.status==='won'?'탑의 봉인을 넘어 살아 돌아왔습니다.':s.status==='dead'?'원정 기록에서 빌드와 피격 원인을 확인하세요.':r.gate&&!r.used&&!s.key?'두 문지기를 처치하고 왕좌의 봉인을 해제하세요.':r.tutorial&&!s.key&&r.enemies.length?'첫 전투 · 추격자 4마리를 처치하고 첫 기술을 선택하세요.':s.key?(returnSealText(r)||(r.type==='exit'&&finalEscapeRequired(s)?(r.finalEscape?(r.finalEscape.ready?'봉인이 파괴됐습니다 · 출구에서 탈출하세요.':'봉인 개방까지 '+Math.ceil(FINAL_ESCAPE_DURATION-r.finalEscape.elapsed)+'초 버티세요.'):'열쇠로 마지막 봉인을 깨세요.'):'봉인 해제 · 1층 출구로 귀환하세요.')):r.relicOffers&&!r.relicClaimed?'유물을 선택하거나 유물함을 지나가세요.':s.floor===s.floors.length-1?'최상층 보스를 처치하고 열쇠를 획득하세요.':s.floor%2?(s.floors[s.floor].some(r=>r.type==='boss'&&r.used)?'열린 계단을 찾아 위층으로 올라가세요.':'보스를 처치하고 위층 계단을 여세요.'):'위층 계단을 탐색하세요.';$('potion').textContent=s.potionCooldown>0?`물약 ${s.potionCooldown.toFixed(1)}초`:`물약 ${s.player.potions}${touchControls.matches?'': ' · Q'}`;$('skill').hidden=mode==='title'||!ultimateUnlocked(s.player);$('skill').disabled=s.skill>0;$('dodge').disabled=s.dodge>0;$('skill').textContent=s.skill>0?`${s.player.evolutions?.ultimate==='turret'?'석궁':'화살비'} ${s.skill.toFixed(1)}s`:((s.player.evolutions?.ultimate==='turret'?'석궁':'화살비')+(touchControls.matches?'':' · F'));$('dodge').textContent=s.dodge>0?`점멸 ${s.dodge.toFixed(1)}s`:(touchControls.matches?'점멸':'점멸 · SPACE');let i=interaction();$('interact').hidden=!i||paused;if(i)$('interact').textContent=i[0]+(touchControls.matches?'':' · E');
 $('utility').hidden=!s.player.utility;$('utility').disabled=paused||s.utilityCooldown>0||s.player.utility==='firstAid'&&(s.player.hp>=s.player.max||s.utilityHealedFloors?.includes(s.floor)||r.enemies.some(e=>e.hp>0&&distance(e,s.player)<140));const utilityName=utilitySkills.find(k=>k.id===s.player.utility)?.name||'유틸';$('utility').textContent=s.utilityCooldown>0?`${utilityName} ${s.utilityCooldown.toFixed(1)}s`:`${utilityName}${touchControls.matches?'':' · G'}`;
}

function dispatch(action){
 if(mode==='rank-start')return;
 if(action==='pause'){if(['pause','bag','shrine'].includes(mode))resume();else pause();return;}
 if(action==='help'){showInfo('help');return;}
 if(action==='bag'){if(mode==='bag')resume();else bag();return;}
 if(paused||!s)return;({potion,skill,utility,dodge,interact})[action]?.();
}
for(const id of ['bag','pause'])button(id,()=>dispatch(id));
for(const id of ['potion','skill','utility','dodge','interact'])bindCombatAction($(id),()=>dispatch(id));
button('help',()=>showInfo('help'));
button('settings',settingsPanel);
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

function evolutionPanel(){const key=pendingEvolution(s.player);if(!key)return;stop('evolution');save();panel('<small>EVOLUTION</small><h2>'+ (skills.find(k=>k.id===key)?.name||'화살비')+' · 분기 선택</h2><p>이번 도전 동안 한 가지 방식을 선택합니다. 추가 스킬 포인트는 소모하지 않습니다.</p><div class="cards">'+evolutions[key].map((e,i)=>'<button class="skill-'+skillGrade(key)+'" id="evolve'+i+'">'+iconSVG(key)+'<b>'+e.name+'</b><span>'+e.description+'</span></button>').join('')+'</div>');evolutions[key].forEach((e,i)=>button('evolve'+i,()=>{if(chooseEvolution(s.player,key,e.id)){save();resume();}}));}
function utilityPanel(){stop('utility');save();panel('<small>UTILITY · LEVEL 4</small><h2>유틸 기술 선택</h2><p>이번 도전에서 사용할 액티브 한 가지를 선택하세요. G 키 또는 오른쪽 버튼으로 사용합니다.</p><div class="cards">'+utilitySkills.map((k,i)=>'<button id="utilityChoice'+i+'">'+iconSVG(k.id)+'<b>'+k.name+'</b><span>'+k.description+'</span></button>').join('')+'</div>');utilitySkills.forEach((k,i)=>button('utilityChoice'+i,()=>{if(chooseUtility(s,k.id)){save();resume();}}));}
function rewardPanel(){const offers=prepareTrialLoot(s);stop('reward');save();panel('<small>TRIAL REWARD</small><h2>시련 완료</h2><p>무작위 긍정 보상 세 가지 중 하나를 선택하세요.</p><div class="cards">'+offers.map((r,i)=>'<button id="reward'+i+'"><b>'+lootLabel(r)+'</b><span>선택 즉시 지급</span></button>').join('')+'</div><button id="laterReward">나중에 선택</button>');offers.forEach((r,i)=>button('reward'+i,()=>{if(claimTrialLoot(s,i)){save();resume();}}));button('laterReward',resume);}
function eventPanel(){stop('event');save();panel('<small>RISK AND REWARD</small><h2>수상한 제단</h2><p>대가와 보상을 확인하세요. 한 번만 계약할 수 있습니다.</p><div class="cards">'+eventOptions.map((e,i)=>'<button id="event'+i+'" '+(canChooseEvent(s,e.id)?'':'disabled')+'><b>'+e.name+'</b><span>'+e.description+'</span></button>').join('')+'</div><button id="leaveEvent">그냥 지나간다</button>');eventOptions.forEach((e,i)=>button('event'+i,()=>{if(e.id==='supply'){supplyPanel();return;}if(chooseEvent(s,e.id)){save();resume();}}));button('leaveEvent',resume);}
function routePanel(){if(!s?.key||s.status!=='playing')return;stop('route');save();const paths=returnRoutes(s),rs=s.floors[s.floor];panel('<small>RETURN ROUTES</small><h2>귀환 경로</h2><p>방문한 방만 계산합니다. 붉은 방은 위험, 초록 방은 적이 적은 우회로입니다.<br>미사용 샘물은 ~ 기호로 확인하세요. 이동은 직접 조작합니다.</p>'+['short','safe'].map((k,i)=>'<button id="path'+i+'" '+(paths[k].length?'':'disabled')+'><b>'+(k==='short'?'최단 경로':'위험 회피 경로')+'</b><br>'+(paths[k].length?Math.max(0,paths[k].length-1)+'번 이동 · 위험 방 '+paths[k].filter(n=>rs[n].returnRisk==='high').length+'개':'탐색한 방만으로 연결되지 않음')+'</button>').join('')+'<button id="leaveRoute">돌아가기</button>');['short','safe'].forEach((k,i)=>button('path'+i,()=>{s.routePreference=k;save();resume();}));button('leaveRoute',resume);}
button('route',routePanel);

function relicPanel(){const r=room();stop('relic');save();panel('<small>RELIC COLLECTION</small><h2>수호자의 유물함</h2><p>획득한 유물은 모두 누적 적용됩니다. 하나를 선택하세요.<br>현재: '+(relicSummary(s.player))+'</p><div class="cards">'+r.relicOffers.map((id,i)=>'<button id="relic'+i+'">'+iconSVG(id)+'<b>'+relicInfo(id).name+'</b><span>'+relicInfo(id).description+'</span>'+relicPreviewMarkup(s.player,id)+'</button>').join('')+'</div><button id="skipRelic">유물함 지나가기</button>');r.relicOffers.forEach((id,i)=>button('relic'+i,()=>{if(claimRelic(s,id)){save();resume();}}));button('skipRelic',()=>{if(claimRelic(s,'skip')){save();resume();}});}
function journalPanel(){if(!s||mode==='level')return;stop('journal');if(s.status==='playing')save();panel(journalMarkup(s));button('closeJournal',()=>s.status==='playing'?pause():resultPanel());}

function mainPanel(){stop('main');save();panel('<small>MAIN TREE · 이번 도전에서 하나만 선택</small><h2>주력 사격을 선택하세요</h2><p>선택한 메인과 보조 기술만 성장합니다. 기존 다른 속성 투자분은 기술 선택 횟수로 돌려드립니다.</p><div class="cards main-cards">'+mainSkills.map(id=>{const k=skills.find(k=>k.id===id);return '<button class="skill-main" id="main-'+id+'">'+iconSVG(id)+'<b>'+k.name+'</b><span>'+k.description+'</span></button>';}).join('')+'</div>');mainSkills.forEach(id=>button('main-'+id,()=>{if(chooseMain(s,id)){save();resume();}}));}


function practiceMenu(){stop('practice');panel('<small>BOSS PRACTICE</small><h2>보스 테스트</h2><p>10레벨 · 메인 3레벨 + 보조 랜덤 7포인트<br>유물 3~5개 · 정수 3~5개 · 물약 3개<br>일반 도전 저장과 기록은 유지됩니다. 테스트는 새로고침 시 종료됩니다.</p><label>보스 <select id="practiceBoss">'+practiceBosses.map(b=>'<option value="'+b.id+'">'+b.name+'</option>').join('')+'</select></label><br><label>메인 기술 <select id="practiceMain">'+mainSkills.map(id=>'<option value="'+id+'">'+skills.find(k=>k.id===id).name+'</option>').join('')+'</select></label><br><button id="rollPractice">빌드 생성</button><button id="practiceBack">입구로</button>');button('rollPractice',()=>practicePreview($('practiceBoss').value,$('practiceMain').value));button('practiceBack',title);}
function practicePreview(boss,main){practiceDraft=createPractice(boss,main);stop('practice');const p=practiceDraft.player;panel('<small>TEST BUILD</small><h2>'+practiceBosses.find(b=>b.id===boss).name+'</h2><div class="guide"><p>'+skills.filter(k=>p[k.id]).map(k=>k.name+' '+p[k.id]).join(' · ')+'</p><p>분기 · '+evolutionSummary(p)+'</p><p>유물 · '+ownedRelics(p).map(id=>relicInfo(id).name).join(' · ')+'</p><p>정수 · '+Object.entries(p.essenceCounts||{}).map(([id,n])=>essenceInfo(id).name+' ×'+n).join(' · ')+'</p><p>체력 '+p.max+' · 기본 공격력 '+p.damage+'</p></div><button id="launchPractice">전투 시작</button><button id="rerollPractice">빌드 다시 뽑기</button><button id="choosePractice">보스 다시 선택</button>');button('launchPractice',()=>launchPractice(practiceDraft));button('rerollPractice',()=>practicePreview(boss,main));button('choosePractice',practiceMenu);}
function launchPractice(run){s=run;ensureMetrics(s);resetTransient();enterRoom(s);resume();save();toast('보스 테스트 시작 · ESC로 재도전 가능');}
function practicePause(){const cfg=s.practice;panel('<h2>보스 테스트 일시정지</h2><p>일반 도전 저장은 유지됩니다.</p><button id="resumePractice">계속 전투</button><button id="retryPractice">같은 빌드 재도전</button><button id="newPractice">새 빌드 뽑기</button><button id="endPractice">입구로</button>');button('resumePractice',resume);button('retryPractice',()=>launchPractice(createPractice(cfg.boss,cfg.main,cfg.seed)));button('newPractice',()=>practicePreview(cfg.boss,cfg.main));button('endPractice',title);}
function practiceResult(){stop('result');const cfg=s.practice;panel('<small>BOSS PRACTICE</small><h2>'+ (s.status==='won'?'보스 격파!':'테스트 종료')+'</h2><p>'+timeString(s.elapsed)+' · 받은 피해 '+(s.metrics?.damageTaken||0)+'하트</p>'+(s.status==='dead'?deathSummaryMarkup(s):'')+'<button id="retryPractice">같은 빌드 재도전</button><button id="newPractice">새 빌드 뽑기</button><button id="choosePractice">보스 다시 선택</button><button id="endPractice">입구로</button>');button('retryPractice',()=>launchPractice(createPractice(cfg.boss,cfg.main,cfg.seed)));button('newPractice',()=>practicePreview(cfg.boss,cfg.main));button('choosePractice',practiceMenu);button('endPractice',title);}

function supplyPanel(){
 const ids=ownedRelics(s.player).filter(id=>id!=='windSeal');
 panel('<small>RELIC EXCHANGE</small><h2>바람의 인장 교환</h2><p>교환할 유물 하나를 선택하세요. 선택한 유물과 그 효과를 잃습니다.<br>바람의 인장: 20처치마다 1하트 회복</p><div class="cards">'+ids.map((id,i)=>'<button id="tradeRelic'+i+'">'+iconSVG(id)+'<b>'+relicInfo(id).name+'</b><span>'+relicInfo(id).description+' → 바람의 인장으로 교환</span>'+relicPreviewMarkup(s.player,'windSeal',id)+'</button>').join('')+'</div><button id="cancelTrade">취소</button>');
 ids.forEach((id,i)=>button('tradeRelic'+i,()=>{if(chooseEvent(s,'supply',id)){save();resume();}}));button('cancelTrade',eventPanel);
}
