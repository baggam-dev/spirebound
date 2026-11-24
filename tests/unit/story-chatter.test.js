import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnemyChatter as createRawChatter} from '../../src/rendering/enemy-chatter.js';
import {ENEMY_CHATTER} from '../../src/ui/enemy-chatter-data.js';
import {storyTracesMarkup,enemyLoreMarkup} from '../../src/ui/story-lore.js';
import {returnEpilogueMarkup} from '../../src/ui/story-copy.js';

// Deterministic successful eligibility keeps existing timing/budget checks independent of chance.
const createEnemyChatter=run=>createRawChatter(run,{random:()=>.1});
const actor=(extra={})=>({type:'chaser',elite:'guardian',hp:100,x:220,y:340,...extra});
function fixture(enemies=[actor()]){return {seed:45,status:'playing',bossLayoutVersion:1,floor:0,room:0,key:false,player:{x:480,y:450},floors:[[{seen:true,enemies}]]};}
function canvas(){const lines=[];const ctx=new Proxy({measureText:s=>({width:s.length*14}),fillText:s=>lines.push(s)},{get:(o,k)=>k in o?o[k]:()=>{}});return {ctx,lines};}
function advance(chatter,seconds,options={}){for(let t=0;t<seconds-.001;t+=.1)chatter.tick(.1,options);}
function visible(chatter){const c=canvas();chatter.draw(c.ctx);return c.lines;}
function collect(chatter,seconds){const lines=new Set();for(let t=0;t<seconds-.001;t+=.1){chatter.tick(.1);for(const line of visible(chatter))lines.add(line);}return [...lines];}

test('incidental speech respects encounter budget without mutating the run and renews on return',()=>{
 const s=fixture(),before=JSON.stringify(s),c=createEnemyChatter(s);
 const ascent=collect(c,90);assert.equal(ascent.length,2);assert.ok(ascent.every(x=>ENEMY_CHATTER.guardian.includes(x)));assert.equal(JSON.stringify(s),before);
 s.key=true;s.floors[0][0].enemies=[actor({type:'pursuer',elite:null})];
 const descent=collect(c,60);assert.equal(descent.length,2);assert.ok(descent.every(x=>ENEMY_CHATTER.pursuer.includes(x)));
});
test('ordinary enemies, summons and practice never speak; trial champions use trial lines',()=>{
 for(const enemies of [[actor({elite:null})],[actor({summoned:true})]])assert.deepEqual(collect(createEnemyChatter(fixture(enemies)),40),[]);
 const s=fixture();s.practice={boss:'warden'};assert.deepEqual(collect(createEnemyChatter(s),40),[]);
 const trial=fixture([actor({trialChampion:true})]);trial.floors[0][0].trialState='active';
 const words=collect(createEnemyChatter(trial),30);assert.ok(words.length>0);assert.ok(words.every(x=>ENEMY_CHATTER.trial.includes(x)));
});
test('scripted dialogue and windups hide chatter but recovery allows it; removed actors disappear',()=>{
 const s=fixture(),e=s.floors[0][0].enemies[0],c=createEnemyChatter(s);
 advance(c,20,{scripted:true});assert.deepEqual(visible(c),[]);
 e.attackPhase='warning';advance(c,10);assert.deepEqual(visible(c),[]);
 e.attackPhase='recover';assert.ok(collect(c,8).length>0);
 s.floors[0][0].enemies=[];c.tick(.1);assert.deepEqual(visible(c),[]);
});
test('returning to the same room preserves the chatter budget and multiple actors alternate',()=>{
 const s=fixture([actor(),actor({elite:'volley',x:720})]),c=createEnemyChatter(s);
 const words=collect(c,65);assert.equal(words.length,2);assert.ok(words.some(x=>ENEMY_CHATTER.guardian.includes(x)));assert.ok(words.some(x=>ENEMY_CHATTER.volley.includes(x)));
 s.floors[0].push({enemies:[]});s.room=1;c.tick(.1);s.room=0;assert.deepEqual(collect(c,40),[]);
});
test('optional lore hides unseen floors and enemies, and legacy saves keep their original story',()=>{
 const s=fixture();s.floors.push([{seen:false,enemies:[]}]);s.bestiary={};
 assert.match(storyTracesMarkup(s),/1층/);assert.doesNotMatch(storyTracesMarkup(s),/2층|귀환/);assert.equal(enemyLoreMarkup(s,'king'),'');
 s.bestiary.king={kills:0};assert.match(enemyLoreMarkup(s,'king'),/관찰 기록/);
 s.bossLayoutVersion=0;assert.equal(storyTracesMarkup(s),'');assert.equal(enemyLoreMarkup(s,'king'),'');
});
test('epilogue follows the actual campaign and is absent on failed, practice and legacy runs',()=>{
 const s=fixture();s.status='won';s.campaign='classic';assert.match(returnEpilogueMarkup(s),/봉인의 잔해/);assert.doesNotMatch(returnEpilogueMarkup(s),/왕이 붙잡던/);
 s.campaign='expanded';assert.match(returnEpilogueMarkup(s),/왕이 붙잡던/);
 s.status='dead';assert.equal(returnEpilogueMarkup(s),'');s.status='won';s.practice={};assert.equal(returnEpilogueMarkup(s),'');delete s.practice;s.bossLayoutVersion=0;assert.equal(returnEpilogueMarkup(s),'');
});

test('elite chatter accepts below seventy percent and permanently rejects the boundary per encounter',()=>{
 const allowed=fixture();assert.ok(collect(createRawChatter(allowed,{random:()=>.699999}),40).length>0);
 const denied=fixture(),before=JSON.stringify(denied);let chance=.7;
 const c=createRawChatter(denied,{random:()=>chance});assert.deepEqual(collect(c,25),[]);
 chance=0;assert.deepEqual(collect(c,90),[]);
 denied.floors[0].push({enemies:[]});denied.room=1;c.tick(.1);denied.room=0;assert.deepEqual(collect(c,40),[]);
 denied.floors[0].pop();assert.equal(JSON.stringify(denied),before);
});
