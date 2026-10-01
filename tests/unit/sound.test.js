import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundSystem,readSoundSettings,SETTINGS_KEY} from '../../src/ui/sound.js';

function memory(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
class FakeAudio{
 static instances=[];
 constructor(){this.currentTime=10;this.state='running';this.destination={};this.started=[];FakeAudio.instances.push(this);}
 createOscillator(){const owner=this;return {frequency:{value:0},connect(){},disconnect(){},start(time){owner.started.push(time);},stop(){}};}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
}

test('sound settings persist separately from run saves and reject malformed values',()=>{
 const storage=memory(),sound=createSoundSystem(storage,FakeAudio);
 assert.deepEqual(sound.settings,{muted:false,volume:.5,reducedEffects:false});
 sound.update({muted:true,volume:.7,reducedEffects:true});
 assert.deepEqual(readSoundSettings(storage),{muted:true,volume:.7,reducedEffects:true});
 assert.equal(storage.getItem(SETTINGS_KEY).includes('reducedEffects'),true);
 storage.setItem(SETTINGS_KEY,JSON.stringify({muted:'no',volume:10,reducedEffects:1}));
 assert.deepEqual(readSoundSettings(storage),{muted:false,volume:1,reducedEffects:false});
});

test('cues need a user gesture, obey mute and throttle repeated attacks',()=>{
 FakeAudio.instances.length=0;
 const sound=createSoundSystem(memory(),FakeAudio);
 assert.equal(sound.play('shot'),false);
 sound.unlock();const audio=FakeAudio.instances[0];
 assert.equal(sound.play('shot'),true);assert.ok(audio.started.length>0);
 assert.equal(sound.play('shot'),false);
 audio.currentTime+=.2;assert.equal(sound.play('shot'),true);
 sound.update({muted:true});assert.equal(sound.play('warning'),false);
 sound.update({muted:false,volume:0});assert.equal(sound.play('reward'),false);
 sound.update({volume:.5});assert.equal(sound.play('reward'),true);
});
