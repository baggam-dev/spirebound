import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundSystem} from '../../src/ui/sound.js';
class Param{
 constructor(){this.value=1;this.events=[];}
 setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);}
 linearRampToValueAtTime(v,t){this.value=v;this.events.push(['linear',v,t]);}
 exponentialRampToValueAtTime(v,t){this.value=v;this.events.push(['exp',v,t]);}
 cancelScheduledValues(t){this.events.push(['cancel',t]);}
}
class Audio{
 static last;
 constructor(){Audio.last=this;this.currentTime=10;this.state='running';this.destination={};this.gains=[];this.oscs=[];}
 createGain(){const g={gain:new Param(),connect(to){this.to=to;},disconnect(){}};this.gains.push(g);return g;}
 createOscillator(){const o={frequency:new Param(),stops:[],connect(to){this.to=to;},disconnect(){},start(t){this.startAt=t;},stop(t){this.stops.push(t);}};this.oscs.push(o);return o;}
}
function setup(){const sound=createSoundSystem({getItem:()=>null,setItem(){}},Audio);sound.unlock();return {sound,a:Audio.last};}
test('distinct contact weights can supersede weaker sounds and danger ducks only the combat bus',()=>{
 const {sound,a}=setup();assert.equal(sound.play('hit'),true);assert.equal(sound.play('slashHit'),true);assert.equal(sound.play('criticalHit'),true);assert.equal(sound.play('hit'),false);assert.equal(sound.play('criticalHit'),false);
 const frequencies=a.oscs.map(o=>o.frequency.events.find(e=>e[0]==='set')?.[1]);assert.ok(frequencies.includes(210)&&frequencies.includes(230)&&frequencies.includes(145));
 assert.equal(sound.play('warning'),true);assert.ok(a.gains[1].gain.events.some(e=>e[0]==='linear'&&e[1]===.28));assert.equal(a.oscs.at(-1).to.to,a.gains[3]);assert.equal(a.oscs[0].to.to,a.gains[1]);assert.equal(sound.play('pickup'),true);assert.equal(a.oscs.at(-1).to.to,a.gains[2]);
 sound.update({muted:true});assert.equal(a.gains[0].gain.value,0);assert.equal(sound.play('rainCast'),false);sound.update({muted:false,volume:.25});assert.equal(a.gains[0].gain.value,.25);a.currentTime++;assert.equal(sound.play('hit'),true);
});
test('combat polyphony is bounded while a strong impact can replace weaker voices and warnings retain reserved capacity',()=>{
 const {sound,a}=setup();for(const name of ['hit','rainCast','crossbowDeploy','crossbowShot','shot','slashHit'])assert.equal(sound.play(name),true,name);
 assert.equal(sound.play('criticalHit'),true);const active=()=>a.oscs.filter(o=>o.stops.at(-1)>a.currentTime+.009);assert.ok(active().filter(o=>o.to.to===a.gains[1]).length<=12);assert.equal(sound.play('warning'),true);assert.ok(active().some(o=>o.to.to===a.gains[3]));
 a.currentTime+=.4;assert.equal(sound.play('hit'),true);
});
test('pause cancels current and future combat/alert notes but preserves UI cues; reset cancels everything',()=>{
 const {sound,a}=setup();sound.play('crossbowReload');sound.play('warning');sound.play('reward');sound.stopCombat();
 const combat=a.oscs.filter(o=>o.to.to===a.gains[1]||o.to.to===a.gains[3]),world=a.oscs.filter(o=>o.to.to===a.gains[2]);assert.ok(combat.some(o=>o.startAt>a.currentTime));assert.ok(combat.every(o=>o.stops.at(-1)<=a.currentTime+.008));assert.ok(world.every(o=>o.stops.at(-1)>a.currentTime+.008));
 sound.stop();assert.ok(a.oscs.every(o=>o.stops.at(-1)<=a.currentTime+.008));assert.equal(sound.play('reward'),true);sound.update({volume:0});assert.equal(sound.play('crossbowShot'),false);
});
