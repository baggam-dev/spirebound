import {RANKING_SEASON} from './ranking.js';
export const SUBMISSIONS_KEY='spirebound.rank-submissions.v1';
const messages={network:'서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.',session_required:'도전을 시작한 브라우저 정보가 없습니다. 쿠키가 지워졌다면 이 기록은 등록할 수 없습니다.',run_not_found:'온라인 시작 정보가 없는 도전입니다.',season_closed:'종료된 시즌입니다. 개인 기록은 유지됩니다.',unsupported_version:'게임 버전이 변경되었습니다. 새로고침 후 새 도전을 시작하세요.',unsupported_rules:'점수 규칙이 변경되었습니다. 새로고침해 주세요.',version_mismatch:'도전의 버전 정보가 서버와 다릅니다.',rate_limited:'요청이 많습니다. 잠시 후 다시 시도하세요.',invalid_nickname:'한글·영문·숫자·밑줄로 2~12자를 입력하세요.',nickname_unavailable:'사용할 수 없는 이름입니다. 다른 이름을 입력하세요.',origin_rejected:'현재 접속 주소에서는 등록할 수 없습니다. 게임의 공식 주소로 접속해 주세요.',impossible_time:'도전 시간 정보를 확인하지 못했습니다.',not_eligible:'탈출에 성공한 일반 도전만 등록할 수 있습니다.',storage_unavailable:'서버 저장이 지연되고 있습니다. 잠시 후 다시 시도하세요.'};
export function rankingError(error){return messages[error?.code]||'기록을 처리하지 못했습니다. 잠시 후 다시 시도하세요.';}
function failure(code){return Object.assign(new Error(code),{code});}
export function normalizeNickname(value){const name=value.trim().normalize('NFC');if(!/^[가-힣A-Za-z0-9_]{2,12}$/.test(name))throw failure('invalid_nickname');return name;}
export class RankingClient{
 constructor(storage,fetcher=globalThis.fetch.bind(globalThis),timeout=6000){this.storage=storage;this.fetcher=fetcher;this.timeout=timeout;this.memory=[];this.storageOK=true;this.pending=new Map();}
 async request(path,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeout);
  try{const response=await this.fetcher('/api/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});let data;try{data=await response.json();}catch{throw failure('network');}if(!response.ok)throw failure(data.error||'network');return data;}
  catch(error){throw error?.code?error:failure('network');}finally{clearTimeout(timer);}
 }
 async start(s){
  await this.request('session',{});
  const q=s.ranking,data=await this.request('runs',{runId:s.runId,seed:s.seed,roomCounts:s.floors.map(r=>r.length),rulesVersion:q.rulesVersion,gameVersion:q.gameVersion,seasonId:q.seasonId});
  if(data.runId!==s.runId||data.seasonId!==q.seasonId||!Number.isSafeInteger(data.startedAt))throw failure('network');
  q.online={runId:data.runId,startedAt:data.startedAt};return q.online;
 }
 list(){
  try{const raw=this.storage.getItem(SUBMISSIONS_KEY);const stored=raw&&raw.length<4000000?JSON.parse(raw):[];if(Array.isArray(stored))for(const item of stored)if(item&&typeof item.runId==='string'&&item.payload?.runId===item.runId&&!this.memory.some(r=>r.runId===item.runId))this.memory.push(item);}catch{this.storageOK=false;}
  return this.memory.slice().reverse();
 }
 persist(item){
  this.list();const index=this.memory.findIndex(r=>r.runId===item.runId);if(index>=0)this.memory[index]=item;else this.memory.push(item);this.memory=this.memory.slice(-30);
  try{this.storage.setItem(SUBMISSIONS_KEY,JSON.stringify(this.memory));this.storageOK=true;}catch{this.storageOK=false;}return item;
 }
 draft(s){
  const q=s.ranking;if(s.practice||s.status!=='won'||!q?.result||q.online?.runId!==s.runId)return null;
  const existing=this.list().find(r=>r.runId===s.runId);if(existing)return existing;
  return this.persist({runId:s.runId,createdAt:Date.now(),nickname:'',payload:{runId:s.runId,outcome:'escaped',kingDefeated:!!s.key,finalDemonDefeated:s.campaign==='expanded'&&s.floors[9][1].used&&s.floors[9][1].demonPending===false,floor:s.floor,practice:false,rulesVersion:q.rulesVersion,seasonId:q.seasonId,gameVersion:q.gameVersion,elapsedMs:q.result.elapsedMs,visited:[...q.visited],defeated:[...q.defeated],mainSkill:s.player.mainSkill},score:q.result.total});
 }
 submit(item,name){
  if(this.pending.has(item.runId))return this.pending.get(item.runId);
  const work=(async()=>{if(item.receipt)return item.receipt;item.nickname=normalizeNickname(name);this.persist(item);const receipt=await this.request('records',{...item.payload,nickname:item.nickname});if(receipt.runId!==item.runId||!['accepted','held'].includes(receipt.status)||!Number.isSafeInteger(receipt.score?.total))throw failure('network');item.receipt=receipt;this.persist(item);return receipt;})();
  this.pending.set(item.runId,work);work.then(()=>this.pending.delete(item.runId),()=>this.pending.delete(item.runId));return work;
 }
 leaderboard(season=RANKING_SEASON){return this.request('rankings?season='+encodeURIComponent(season));}
}
