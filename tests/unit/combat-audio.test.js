import test from 'node:test';
import assert from 'node:assert/strict';
import {combatHitCue,createCombatAudio} from '../../src/ui/combat-audio.js';
function setup(){const calls=[],audio=createCombatAudio({play:name=>{calls.push(name);return true;}}),run={player:{evolutions:{ultimate:'burst'}}},room={turrets:[]};return {calls,audio,run,room};}
test('contact audio selects the strongest real contact and ignores periodic health feedback',()=>{
 assert.equal(combatHitCue([{enemyFeedback:'hit'}]),null);assert.equal(combatHitCue([{arrowImpact:true}]),'hit');assert.equal(combatHitCue([{hitElement:'fire'},{slash:true}]),'slashHit');assert.equal(combatHitCue([{slash:true},{precisionBurst:true}]),'criticalHit');assert.equal(combatHitCue([],true),'slashHit');
});
test('rain cast includes the immediate landing, then five falls and five real remaining impacts without duplicates',()=>{
 const {calls,audio,run,room}=setup(),z={elapsed:0,pulses:1};room.arrowRain=z;audio.prepare(run,room);audio.cast(run,room);
 for(let i=1;i<=5;i++){z.elapsed=i*.3-.18;z.pulses=i;audio.update(run,room);audio.update(run,room);z.elapsed=i*.3;z.pulses=i+1;audio.update(run,room);audio.update(run,room);}
 assert.equal(calls.filter(c=>c==='rainCast').length,1);assert.equal(calls.filter(c=>c==='rainFall').length,5);assert.equal(calls.filter(c=>c==='rainImpact').length,4);assert.equal(calls.filter(c=>c==='rainFinal').length,1);
 const n=calls.length;z.elapsed=1.79;audio.update(run,room);delete room.arrowRain;audio.update(run,room);assert.equal(calls.length,n);
});
test('load, room change and reset seed existing clocks without replay; catch-up coalesces to the latest landing',()=>{
 const {calls,audio,run,room}=setup();room.arrowRain={elapsed:.7,pulses:3};room.turrets=[{clock:.6}];audio.update(run,room);audio.update(run,room);assert.deepEqual(calls,[]);
 const before=JSON.stringify({run,room});audio.update(run,room);assert.equal(JSON.stringify({run,room}),before);
 room.arrowRain.elapsed=1.5;room.arrowRain.pulses=6;audio.update(run,room);assert.deepEqual(calls,['rainFinal']);calls.length=0;audio.reset();audio.update(run,room);audio.update(run,room);assert.deepEqual(calls,[]);
 audio.update(run,{arrowRain:{elapsed:.9,pulses:4},turrets:[{clock:.6}]});assert.deepEqual(calls,[]);
});
test('turret shots and reloads follow real clocks, replacements retract once and final roll contacts survive roll deletion',()=>{
 const {calls,audio,run,room}=setup();run.player.evolutions.ultimate='turret';const a={clock:.4},b={clock:.4},t={clock:0};room.turrets=[a,b];audio.prepare(run,room);room.turrets=[b,t];audio.cast(run,room);assert.deepEqual(calls,['crossbowRetract','crossbowDeploy']);
 audio.update(run,room);assert.equal(calls.includes('crossbowShot'),false);t.clock=.6;audio.update(run,room);audio.update(run,room);t.clock=.17;audio.update(run,room);t.clock=0;audio.update(run,room);audio.update(run,room);
 assert.equal(calls.filter(c=>c==='crossbowShot').length,1);assert.equal(calls.filter(c=>c==='crossbowReload').length,1);
 room.turrets=[b];audio.update(run,room);audio.update(run,room);assert.equal(calls.filter(c=>c==='crossbowRetract').length,2);
 const q={kind:'slash',hit:[]};run.roll=q;audio.update(run,room);q.hit.push(1);audio.update(run,room);q.hit.push(2);delete run.roll;audio.update(run,room);audio.update(run,room);assert.equal(calls.filter(c=>c==='slashHit').length,2);
});
