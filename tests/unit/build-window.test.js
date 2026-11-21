import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from '../../src/game/engine.js';
import {buildEntries,buildWindowMarkup,createBuildView} from '../../src/ui/build-window.js';

test('reading every build tab preserves the saved run and separate view state',()=>{
 const s=newRun(85);s.player.precision=3;s.player.mainSkill='precision';s.player.evolutions={precision:'sniper'};s.player.utility='frostWave';s.player.relics=['windSeal'];s.player.essenceCounts={attack:3,ultimate:2};
 const view=createBuildView(),before=JSON.stringify(s);
 for(const tab of ['skills','relics','essences']){view.tab=tab;const entries=buildEntries(s,tab);assert.ok(entries.length);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);assert.ok(buildWindowMarkup(s,view).includes('role="tabpanel"'));}
 assert.equal(JSON.stringify(s),before);
 assert.ok(buildEntries(s,'skills').some(e=>e.id==='active:frostWave'));
 assert.ok(buildEntries(s,'skills').find(e=>e.id==='precision').description.includes('같은 적'));
});
test('essence contribution is compounded and never presented as a spendable balance',()=>{
 const s=newRun(85);s.player.essenceCounts={attack:3,ultimate:2};s.player.damage=500;
 const entries=buildEntries(s,'essences');assert.equal(entries.find(e=>e.id==='attack').description,'공격력 +9');
 assert.equal(entries.find(e=>e.id==='ultimate').description,'궁극기 쿨타임 19.0% 감소');
 const html=buildWindowMarkup(s,{...createBuildView(),tab:'essences'});assert.ok(html.includes('획득 즉시 적용됨'));assert.ok(!html.includes('교환'));
 const empty=newRun(85);assert.equal(buildEntries(empty,'relics').length,0);assert.ok(buildWindowMarkup(empty,{...createBuildView(),tab:'relics'}).includes('보유 유물이 없습니다.'));
});
