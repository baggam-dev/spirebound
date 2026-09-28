import test from 'node:test';
import assert from 'node:assert/strict';
import {RankingClient,SUBMISSIONS_KEY,normalizeNickname} from '../../src/ranking/ranking-client.js';
import {newRun} from '../../src/game/engine.js';
import {finishRanking} from '../../src/ranking/ranking.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {rankRow} from '../../src/ranking/ranking-ui.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
const response=data=>({ok:true,json:async()=>data});
function winner(){const s=newRun(1);s.key=true;s.status='won';s.player.mainSkill='fire';s.ranking.online={runId:s.runId,startedAt:100};finishRanking(s);return s;}
test('online start issues session before run and survives save continuation',async()=>{
 const calls=[],s=newRun(1),client=new RankingClient(memory(),async(path,options)=>{calls.push([path,options]);return response(path.endsWith('session')?{active:true}:{runId:s.runId,seasonId:s.ranking.seasonId,startedAt:123});});
 await client.start(s);assert.deepEqual(calls.map(c=>c[0]),['/api/session','/api/runs']);assert.equal(calls[0][1].credentials,'same-origin');assert.deepEqual(JSON.parse(calls[1][1].body).roomCounts,s.floors.map(r=>r.length));assert.deepEqual(parseSave(encodeSave(s)).ranking.online,s.ranking.online);
});
test('offline, legacy and practice results cannot create online drafts',()=>{
 const client=new RankingClient(memory());for(const mutate of [s=>delete s.ranking.online,s=>delete s.ranking,s=>s.practice={},s=>s.status='dead']){const s=winner();mutate(s);assert.equal(client.draft(s),null);}
});
test('submission intent persists before network failure and reload can retry',async()=>{
 const storage=memory(),s=winner(),client=new RankingClient(storage,async()=>{assert.equal(JSON.parse(storage.getItem(SUBMISSIONS_KEY))[0].nickname,'모험가');throw Error('offline');});
 const item=client.draft(s);await assert.rejects(client.submit(item,'모험가'),{code:'network'});
 const reloaded=new RankingClient(storage,async()=>response({runId:s.runId,status:'accepted',nickname:'모험가',score:{total:16000}})),recovered=reloaded.list()[0];
 assert.equal(recovered.nickname,'모험가');await reloaded.submit(recovered,recovered.nickname);assert.equal(new RankingClient(storage).list()[0].receipt.status,'accepted');
});
test('double submit makes one request and receipts never resubmit',async()=>{
 let calls=0,resolve;const s=winner(),client=new RankingClient(memory(),()=>{calls++;return new Promise(r=>resolve=r);}),item=client.draft(s);
 const first=client.submit(item,'이름'),second=client.submit(item,'다른이름');assert.equal(first,second);resolve(response({runId:s.runId,status:'held',nickname:'이름',score:{total:16000}}));await first;await client.submit(item,'새이름');assert.equal(calls,1);
});
test('storage failures preserve an in-memory draft and visibly report persistence failure',()=>{
 const client=new RankingClient({getItem(){throw Error('blocked');},setItem(){throw Error('full');}});const item=client.draft(winner());assert.equal(client.storageOK,false);assert.equal(client.list()[0],item);
});
test('name normalization and rendered nickname escaping',()=>{
 assert.equal(normalizeNickname('  가나  '),'가나');for(const name of ['a','a b','<img>','😀😀','1234567890123'])assert.throws(()=>normalizeNickname(name));
 const html=rankRow({rank:1,nickname:'<img src=x onerror=alert(1)>',score:15000,elapsedMs:1200000,mainSkill:'fire'});assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));
});
test('timeout aborts request and does not grant online eligibility',async()=>{
 const client=new RankingClient(memory(),(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout')))),5),s=newRun(1);await assert.rejects(client.start(s),{code:'network'});assert.equal(s.ranking.online,undefined);
});
