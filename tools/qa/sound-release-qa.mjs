import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const playwright=process.env.PLAYWRIGHT_PATH||join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium}=await import(pathToFileURL(join(playwright,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const hook=`\nconst originalAudioPlay=sound.play;globalThis.__cueLog=[];sound.play=function(name){const ok=originalAudioPlay.call(sound,name);__cueLog.push({name,ok,elapsed:s?.elapsed});return ok;};globalThis.__audioQA={state:()=>s,mode:()=>mode,settings:()=>sound.settings,set:v=>sound.update(v),play:n=>sound.play(n),pause:()=>pause(),resume:()=>resume(),cast:()=>skill(),async load(run){await lease.acquire();renderTitleScene=null;s=run;resetTransient();enterRoom(s);await prepareFloorAssets(s.floor,floorAssetOptions(s));resume();}};`;
// Mute the output device, not the audio graph. Native graph/state and offline samples remain inspectable.
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']}),errors=[],reports=[];let scores=0,active;
try{
 const context=await browser.newContext(),p=await context.newPage();await p.goto(base,{waitUntil:'domcontentloaded'});
 const offline=await p.evaluate(async()=>{
  const {createSoundSystem}=await import('/src/ui/sound.js'),rate=48000;
  async function render(events,{duration=.65,volume=1,silentAlert=false}={}){
   const real=new OfflineAudioContext(1,Math.ceil(duration*rate),rate),gains=[];let now=0;
   // A virtual scheduling clock lets the real native graph be filled before offline rendering.
   class Adapter{constructor(){return {get currentTime(){return now;},state:'running',destination:real.destination,createGain(){const g=real.createGain();gains.push(g);return g;},createOscillator:()=>real.createOscillator()};}}
   const sound=createSoundSystem({getItem:()=>null,setItem(){}},Adapter);sound.unlock();sound.update({volume});if(silentAlert)gains[3].disconnect();
   const accepted=[];for(const e of events){now=e.at;if(e.name)accepted.push([e.name,sound.play(e.name)]);if(e.stop)sound.stopCombat();if(e.mute)sound.update({muted:true});}
   const buffer=await real.startRendering();return {samples:buffer.getChannelData(0),accepted};
  }
  const stats=(samples,start=0,end=samples.length)=>{let peak=0,sum=0,crossings=0;for(let i=start;i<end;i++){const v=samples[i];if(!Number.isFinite(v))throw Error('non-finite PCM');peak=Math.max(peak,Math.abs(v));sum+=v*v;if(i>start&&Math.sign(v)!==Math.sign(samples[i-1]))crossings++;}return {peak,rms:Math.sqrt(sum/Math.max(1,end-start)),crossings};};
  const cues=['hit','criticalHit','slashHit','rainCast','rainFall','rainImpact','rainFinal','crossbowDeploy','crossbowShot','crossbowReload','crossbowRetract','warning'],single=[];
  for(const name of cues){const r=await render([{at:.05,name}]),s=stats(r.samples);if(!(s.peak>1e-4&&s.peak<.4&&s.rms>1e-5))throw Error('bad PCM '+name);single.push({name,...s});}
  const demo=await render(cues.map((name,i)=>({at:.1+i*.45,name})),{duration:5.8,volume:.5});
  const plain=await render([{at:.05,name:'rainFinal'}],{silentAlert:true}),duck=await render([{at:.05,name:'rainFinal'},{at:.06,name:'warning'}],{silentAlert:true});
  const plainTail=stats(plain.samples,.08*rate,.15*rate),duckTail=stats(duck.samples,.08*rate,.15*rate);if(!(duckTail.rms<plainTail.rms*.4))throw Error('native duck failed');
  const stopped=await render([{at:.05,name:'rainFinal'},{at:.08,stop:true}]),muted=await render([{at:.05,name:'rainFinal'},{at:.08,mute:true}]);if(stats(stopped.samples,.11*rate).peak>1e-7||stats(muted.samples,.11*rate).peak>1e-7)throw Error('native tail leaked');
  const mix=await render(['hit','rainCast','crossbowDeploy','crossbowShot','shot','slashHit','criticalHit','warning','pickup'].map(name=>({at:.05,name})));const mixed=stats(mix.samples);if(mixed.peak>=.4)throw Error('mix clips');
  const samples=demo.samples,bytes=new Uint8Array(44+samples.length*2),view=new DataView(bytes.buffer),ascii=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};ascii(0,'RIFF');view.setUint32(4,bytes.length-8,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return {single,mixed,duckRatio:duckTail.rms/plainTail.rms,stopTail:stats(stopped.samples,.11*rate).peak,muteTail:stats(muted.samples,.11*rate).peak,wav:btoa(binary)};
 });await writeFile(join(out,'effects-demo.wav'),Buffer.from(offline.wav,'base64'));delete offline.wav;await writeFile(join(out,'offline.json'),JSON.stringify(offline,null,2));await context.close();
 for(const width of [1280,844]){
  const cx=await browser.newContext({viewport:{width,height:width===1280?800:390},isMobile:width<1000,hasTouch:width<1000}),p=await cx.newPage();active=p;p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
  await cx.addInitScript(()=>{const Native=window.AudioContext||window.webkitAudioContext;window.__notes=[];window.AudioContext=new Proxy(Native,{construct(Target,args){const c=Reflect.construct(Target,args);window.__liveAudio=c;const make=c.createOscillator.bind(c);c.createOscillator=()=>{const o=make(),voice={starts:[],stops:[]};window.__notes.push(voice);const start=o.start.bind(o),stop=o.stop.bind(o);o.start=t=>{voice.starts.push(t);return start(t);};o.stop=t=>{voice.stops.push(t);return stop(t);};return o;};return c;}});});
  await p.route('**/src/game/game.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+hook});});await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!globalThis.__audioQA);assert.equal(await p.evaluate(()=>!!window.__liveAudio),false);
  await p.keyboard.press('Shift');await p.waitForFunction(()=>window.__liveAudio?.state==='running');
  await p.evaluate(async()=>{const {newRun,currentRoom}=await import('/src/game/engine.js');const s=newRun(42);s.tutorialComplete=true;s.invulnerable=999;s.player.mainSkill='precision';s.player.precision=1;s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};const r=currentRoom(s);r.tutorial=false;r.seen=true;r.obstacles=[];r.enemies=[{id:0,type:'chaser',x:600,y:300,hp:10000,max:10000,cd:999,speed:0,balanceVersion:1}];await __audioQA.load(s);});
  await p.waitForFunction(()=>__audioQA.mode()==='play');await p.waitForFunction(()=>__cueLog.some(e=>e.name==='hit'&&e.ok));await p.waitForFunction(()=>__cueLog.some(e=>e.name==='criticalHit'&&e.ok));
  await p.evaluate(()=>{__cueLog.length=0;__audioQA.state().attack=999;__audioQA.cast();});await p.waitForFunction(()=>__cueLog.some(e=>e.name==='rainFinal'&&e.ok));
  const rain=await p.evaluate(()=>__cueLog.filter(e=>e.name.startsWith('rain')));assert.equal(rain.filter(e=>e.name==='rainCast'&&e.ok).length,1);assert.equal(rain.filter(e=>e.name==='rainImpact'&&e.ok).length,4);assert.equal(rain.filter(e=>e.name==='rainFall'&&e.ok).length,5);assert.equal(rain.filter(e=>e.name==='rainFinal'&&e.ok).length,1);
  await p.evaluate(()=>{const s=__audioQA.state();s.skill=0;s.player.evolutions.ultimate='turret';__cueLog.length=0;__audioQA.cast();});await p.waitForFunction(()=>__cueLog.some(e=>e.name==='crossbowShot'&&e.ok));await p.waitForFunction(()=>__cueLog.some(e=>e.name==='crossbowReload'&&e.ok));
  await p.evaluate(()=>__audioQA.pause());const pause=await p.evaluate(()=>({now:__liveAudio.currentTime,requests:__notes.length,lastStops:__notes.map(n=>n.stops.at(-1))}));assert.ok(pause.lastStops.every(t=>t<=pause.now+.015));await p.waitForTimeout(180);assert.equal(await p.evaluate(()=>__notes.length),pause.requests);
  await p.evaluate(()=>__audioQA.set({muted:true}));assert.equal(await p.evaluate(()=>__audioQA.play('criticalHit')),false);await p.evaluate(()=>__audioQA.set({muted:false,volume:0}));assert.equal(await p.evaluate(()=>__audioQA.play('warning')),false);
  // Re-create the browser at zero volume: a trusted slider gesture must unlock later.
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#titleSettings').click();assert.equal(await p.evaluate(()=>!!window.__liveAudio),false);await p.locator('#soundVolume').focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>window.__liveAudio?.state==='running');assert.ok(await p.evaluate(()=>__audioQA.settings().volume>0));
  await p.screenshot({path:join(out,`settings-${width}.png`)});reports.push({width,gestureUnlock:true,realHits:true,rain,realTurretShotReload:true,pauseCancels:true,muteAndZero:true,zeroSliderUnlock:true});await cx.close();
 }
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,offline,reports,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({offlineCues:offline.single.length,mixedPeak:offline.mixed.peak,duckRatio:offline.duckRatio,liveCases:reports.length,errors,scoreSubmissions:scores}));
}catch(error){if(active&&!active.isClosed()){await active.screenshot({path:join(out,'failure.png')});await writeFile(join(out,'failure.json'),JSON.stringify({error:error.stack,mode:await active.evaluate(()=>globalThis.__audioQA?.mode()),cues:await active.evaluate(()=>globalThis.__cueLog),errors},null,2));}throw error;}finally{await browser.close();}
