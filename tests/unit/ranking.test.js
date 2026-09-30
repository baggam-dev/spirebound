import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage,currentRoom,advanceClock} from '../../src/game/engine.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave,RunStore,safeHistory} from '../../src/persistence/storage.js';
import {calculateScore,trackRankingRoom,recordRankingDefeat,finishRanking,rankingMarkup,validateRanking,EXPANDED_SEASON,EXPANDED_RULES,EXPANDED_ARCHIVES} from '../../src/ranking/ranking.js';
const win=s=>{s.key=true;s.floor=0;s.room=0;s.status='won';return finishRanking(s);};
test('score examples, caps, second boundary and invalid metrics',()=>{
 for(const [elapsedMs,kills,visited,totalRooms,total] of [[1200000,180,60,80,16900],[1800000,300,80,80,17400],[3000000,450,80,80,16000]])assert.equal(calculateScore({elapsedMs,kills,visited,totalRooms}).total,total);
 const base={elapsedMs:999,kills:0,visited:1,totalRooms:3};assert.equal(calculateScore(base).time,6000);assert.equal(calculateScore({...base,elapsedMs:1000}).time,5998);assert.equal(calculateScore(base).exploration,666);
 for(const change of [{kills:-1},{elapsedMs:Infinity},{visited:4},{totalRooms:0},{elapsedMs:.5}])assert.throws(()=>calculateScore({...base,...change}));
});
test('actual entry counts once, map reveal does not count, pause excludes time',()=>{
 const s=newRun(1);s.floors.flat().forEach(r=>r.seen=true);assert.equal(s.ranking.visited.length,1);s.room=1;enterRoom(s);enterRoom(s);assert.equal(s.ranking.visited.length,2);advanceClock(s,5,true);assert.equal(s.elapsed,0);advanceClock(s,1.234,false);assert.equal(win(s).elapsedMs,1234);
});
test('death processing counts original slime once and excludes summoned and split children',()=>{
 const s=newRun(1);s.room=1;const r=currentRoom(s);r.enemies=[{id:0,type:'boss',variant:'slime',stage:0,hp:0,max:100,x:500,y:300,tier:5}];s.invulnerable=999;s.attack=999;
 stepRun(s,.001);assert.equal(s.ranking.defeated.length,1);assert.equal(r.enemies.length,2);
 for(const e of r.enemies)e.hp=0;stepRun(s,.001);assert.equal(s.ranking.defeated.length,1);
 recordRankingDefeat(s,{id:50,summoned:true});assert.equal(s.ranking.defeated.length,1);
});
test('save continuation preserves enemy identity and deduplicates defeat',()=>{
 const s=newRun(1);s.room=1;enterRoom(s);const e=currentRoom(s).enemies[0];e.hp=0;recordRankingDefeat(s,e);recordRankingDefeat(s,e);assert.equal(s.ranking.defeated.length,1);
 const loaded=parseSave(encodeSave(s));stepRun(loaded,.001);assert.equal(loaded.ranking.defeated.length,1);assert.deepEqual(loaded.ranking.visited,s.ranking.visited);
});
test('replacement descent wave with reused local IDs earns new distinct kills',()=>{
 const s=newRun(1);s.room=1;trackRankingRoom(s);const e=currentRoom(s).enemies[0];e.hp=0;recordRankingDefeat(s,e);const old=e.rankingId;enrage(s);trackRankingRoom(s);const next=currentRoom(s).enemies[0];assert.notEqual(next.rankingId,old);next.hp=0;recordRankingDefeat(s,next);assert.equal(s.ranking.defeated.length,2);
});
test('surviving enemies in preserved descent rooms keep their identity',()=>{
 const s=newRun(1);s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');trackRankingRoom(s);const e=currentRoom(s).enemies[0],id=e.rankingId;enrage(s);trackRankingRoom(s);assert.equal(e.rankingId,id);
});
test('legacy saves, practice, death and king kill alone cannot yield a score',()=>{
 const legacy=newRun(1);delete legacy.ranking;const loaded=parseSave(encodeSave(legacy));enterRoom(loaded);assert.equal(win(loaded),null);assert.match(rankingMarkup(loaded),/이전 버전/);
 for(const change of [{practice:{}},{status:'dead'},{status:'playing'},{key:false},{floor:7}]){const s=newRun(1);s.status='won';s.key=true;Object.assign(s,change);assert.equal(finishRanking(s),null);}
});
test('score snapshot and completion history persist once',()=>{
 const s=newRun(1);s.elapsed=1200;const result=win(s);assert.equal(finishRanking(s),result);assert.equal(validateRanking(s),true);
 const data=new Map(),memory={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},store=new RunStore(memory);
 assert.equal(store.complete(s,true).ok,true);assert.equal(store.complete(s,true).ok,true);const rows=safeHistory(memory);assert.equal(rows.length,1);assert.equal(rows[0].ranking.total,result.total);assert.match(rankingMarkup(s),/온라인 시작 정보가 없어/);
});
test('malformed ranking counters, identifiers and snapshots are rejected',()=>{
 for(const mutate of [s=>s.ranking.visited.push('99:0'),s=>s.ranking.visited.push('0:0'),s=>s.ranking.totalRooms++,s=>s.ranking.defeated.push(-1),s=>s.ranking.nextEnemyId=Infinity,s=>{win(s);s.ranking.result.total++;}]){const s=newRun(1);mutate(s);assert.equal(validateRanking(s),false);assert.throws(()=>encodeSave(s));}
});
test('new expanded season keeps both former runs loadable without joining the new ranking',()=>{
 const current=newRun(55,{campaign:'expanded'});
 assert.equal(current.ranking.seasonId,EXPANDED_SEASON);assert.equal(current.ranking.rulesVersion,EXPANDED_RULES);
 for(const archive of EXPANDED_ARCHIVES){
  const old=newRun(55,{campaign:'expanded'});old.ranking.seasonId=archive.seasonId;old.ranking.rulesVersion=archive.rulesVersion;
  old.ranking.online={runId:old.runId,startedAt:123};
  const loaded=parseSave(encodeSave(old));assert.equal(loaded.ranking.seasonId,archive.seasonId);
  assert.equal(validateRanking(loaded),true);
  loaded.ranking.rulesVersion=EXPANDED_RULES;assert.equal(validateRanking(loaded),false);
 }
});
