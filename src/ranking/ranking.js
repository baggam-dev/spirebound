import {RELEASE} from '../game/version.js';
export const RANKING_RULES='ranking-v1';
export const RANKING_SEASON='BETA-1';
export const EXPANDED_SEASON='ASCENT-3';
export const EXPANDED_RULES='ranking-v4';
export const LEGACY_EXPANDED_SEASON='ASCENT-1';
export const LEGACY_EXPANDED_RULES='ranking-v2';
export const PREVIOUS_EXPANDED_SEASON='ASCENT-2';
export const PREVIOUS_EXPANDED_RULES='ranking-v3';
export const EXPANDED_ARCHIVES=[{seasonId:LEGACY_EXPANDED_SEASON,rulesVersion:LEGACY_EXPANDED_RULES},{seasonId:PREVIOUS_EXPANDED_SEASON,rulesVersion:PREVIOUS_EXPANDED_RULES}];
export const rankingSeason=campaign=>campaign==='expanded'?EXPANDED_SEASON:RANKING_SEASON;
export function startRanking(s){
 s.ranking={rulesVersion:s.campaign==='expanded'?EXPANDED_RULES:RANKING_RULES,seasonId:rankingSeason(s.campaign),gameVersion:RELEASE,totalRooms:s.floors.flat().length,visited:['0:0'],defeated:[],nextEnemyId:0};
 return s;
}
export function trackRankingRoom(s){
 const q=s.ranking;if(!q||s.practice||s.status!=='playing')return;
 const key=s.floor+':'+s.room;if(!q.visited.includes(key))q.visited.push(key);
 for(const e of s.floors[s.floor][s.room].enemies)if(e.rankingId===undefined)e.rankingId=q.nextEnemyId++;
}
export function recordRankingDefeat(s,e){
 const q=s.ranking;if(!q||s.practice||e.summoned||(e.variant==='slime'&&(e.stage||0)>0))return;
 // A run-wide serial survives saves and distinguishes replacement waves with reused local IDs.
 if(e.rankingId===undefined)e.rankingId=q.nextEnemyId++;
 if(!q.defeated.includes(e.rankingId))q.defeated.push(e.rankingId);
}
export function calculateScore({elapsedMs,kills,visited,totalRooms}){
 if(![elapsedMs,kills,visited,totalRooms].every(Number.isSafeInteger)||elapsedMs<0||kills<0||visited<0||totalRooms<1||visited>totalRooms)throw Error('Invalid ranking metrics');
 const escape=10000,combat=Math.min(4000,kills*10),exploration=Math.floor(2000*visited/totalRooms),time=Math.max(0,6000-Math.floor(elapsedMs/1000)*2);
 return {escape,combat,exploration,time,total:escape+combat+exploration+time};
}
export function finishRanking(s){
 const q=s.ranking;if(!q||s.practice||s.status!=='won'||!s.key||s.floor!==0||s.campaign==='expanded'&&(!s.floors[9][1].used||s.floors[9][1].demonPending!==false))return null;
 if(!q.result){const metrics={elapsedMs:Math.round(s.elapsed*1000),kills:q.defeated.length,visited:q.visited.length,totalRooms:q.totalRooms};q.result={...metrics,...calculateScore(metrics)};}
 return q.result;
}
export function rankingSummary(s){
 const result=finishRanking(s);return result?{rulesVersion:s.ranking.rulesVersion,seasonId:s.ranking.seasonId,gameVersion:s.ranking.gameVersion,...result}:null;
}
export function validateRanking(s){
 const q=s.ranking;if(q===undefined)return true;
 const int=n=>Number.isSafeInteger(n)&&n>=0;
 const current=q?.rulesVersion===(s.campaign==='expanded'?EXPANDED_RULES:RANKING_RULES)&&q?.seasonId===rankingSeason(s.campaign);
 const legacy=s.campaign==='expanded'&&EXPANDED_ARCHIVES.some(a=>q?.rulesVersion===a.rulesVersion&&q?.seasonId===a.seasonId);
 if(!q||!(current||legacy)||typeof q.gameVersion!=='string'||q.gameVersion.length>64||q.totalRooms!==s.floors.flat().length||!int(q.nextEnemyId)||q.nextEnemyId>1000000)return false;
 if(!Array.isArray(q.visited)||q.visited.length<1||q.visited.length>q.totalRooms||new Set(q.visited).size!==q.visited.length)return false;
 const rooms=new Set(s.floors.flatMap((rooms,f)=>rooms.map((_,r)=>f+':'+r)));
 if(q.visited.some(k=>!rooms.has(k))||!Array.isArray(q.defeated)||q.defeated.length>10000||new Set(q.defeated).size!==q.defeated.length||q.defeated.some(id=>!int(id)||id>=q.nextEnemyId))return false;
 if(q.online!==undefined&&(!q.online||q.online.runId!==s.runId||!int(q.online.startedAt)))return false;
 const ids=[];for(const e of s.floors.flat().flatMap(r=>r.enemies))if(e.rankingId!==undefined){if(!int(e.rankingId)||e.rankingId>=q.nextEnemyId||q.defeated.includes(e.rankingId)&&e.hp>0)return false;ids.push(e.rankingId);}
 if(new Set(ids).size!==ids.length)return false;
 if(q.result!==undefined){const m=q.result;if(!m||s.status!=='won'||!s.key||s.floor!==0||s.practice||m.elapsedMs!==Math.round(s.elapsed*1000)||m.kills!==q.defeated.length||m.visited!==q.visited.length||m.totalRooms!==q.totalRooms)return false;try{const expected=calculateScore(m);if(Object.keys(expected).some(k=>m[k]!==expected[k]))return false;}catch{return false;}}
 return true;
}
export function rankingMarkup(s){
 if(s.practice||s.status!=='won')return '';
 const r=s.ranking?.result;
 if(!r)return '<p>이전 버전에서 시작한 도전으로 점수 집계 대상이 아닙니다.</p>';
 return `<section class="ranking-summary"><h3>탈출 점수 · ${r.total.toLocaleString('ko-KR')}점</h3><p>탈출 ${r.escape.toLocaleString('ko-KR')} · 처치 ${r.combat.toLocaleString('ko-KR')}<br>탐험 ${r.exploration.toLocaleString('ko-KR')} · 시간 ${r.time.toLocaleString('ko-KR')}</p><p>유효 처치 ${r.kills} · 방문 ${r.visited}/${r.totalRooms}방</p><small>${s.campaign==='expanded'&&s.ranking.seasonId!==EXPANDED_SEASON?'이전 시즌 도전은 로컬에서 이어갈 수 있지만 종료된 순위에 새로 등록할 수 없습니다.':s.ranking.online?'탈출 기록에 이름을 남겨 순위에 등록할 수 있습니다.':'로컬 도전 · 온라인 시작 정보가 없어 순위에 등록되지 않습니다.'}</small></section>`;
}
