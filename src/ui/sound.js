// Short synthesized cues. Preferences are local to this browser, not part of run saves.
export const SETTINGS_KEY='spirebound.settings.v1';
export const DEFAULT_SETTINGS=Object.freeze({muted:false,volume:.5,reducedEffects:false});
const CUES={
 gateOpen:{gap:1,notes:[[0,82,.3,'triangle',.018],[.14,67,.38,'triangle',.015]]},
 gateStep:{gap:.3,notes:[[0,110,.07,'triangle',.017],[.025,55,.09,'sine',.012]]},
 gateClose:{gap:1,notes:[[0,54,.28,'triangle',.055],[.025,89,.13,'sawtooth',.02],[.12,40,.34,'sine',.025]]},
 shot:{gap:.17,notes:[[0,360,.055,'triangle',.011],[.025,240,.055,'triangle',.008]]},
 hit:{gap:.09,group:'contact',priority:1,notes:[[0,210,.055,'triangle',.018,90],[.006,950,.024,'square',.004,520]]},
 criticalHit:{gap:.18,group:'contact',priority:3,notes:[[0,145,.075,'triangle',.023,65],[.004,1250,.035,'square',.005,680],[.025,880,.09,'sine',.009,660]]},
 slashHit:{gap:.17,group:'contact',priority:2,notes:[[0,230,.09,'sawtooth',.009,80],[.006,820,.035,'triangle',.015,300]]},
 rainCast:{gap:.5,group:'rain',priority:2,notes:[[0,165,.12,'triangle',.023,65],[.008,1100,.055,'triangle',.008,420]]},
 rainFall:{gap:.15,group:'rain',priority:1,notes:[[0,1000,.085,'sine',.008,350],[.012,640,.07,'triangle',.006,210]]},
 rainImpact:{gap:.17,group:'rain',priority:2,notes:[[0,155,.105,'triangle',.023,60],[.005,720,.034,'square',.005,260]]},
 rainFinal:{gap:.4,group:'rain',priority:3,notes:[[0,95,.15,'triangle',.026,42],[.005,750,.06,'square',.006,300],[.035,180,.12,'sine',.012,65]]},
 crossbowDeploy:{gap:.3,group:'mechanism',priority:1,notes:[[0,115,.12,'triangle',.018,80],[.045,480,.035,'square',.004,300]]},
 crossbowShot:{gap:.18,group:'crossbow',priority:2,notes:[[0,340,.09,'triangle',.019,100],[.004,1050,.03,'square',.005,450]]},
 crossbowReload:{gap:.25,group:'mechanism',priority:1,notes:[[0,430,.026,'triangle',.009],[.035,610,.03,'square',.003]]},
 crossbowRetract:{gap:.25,group:'mechanism',priority:1,notes:[[0,175,.12,'triangle',.014,70],[.045,360,.035,'square',.003,160]]},
 hurt:{gap:.35,notes:[[0,190,.16,'sawtooth',.025]]},
 boss:{gap:1.5,notes:[[0,130,.22,'triangle',.028],[.13,100,.27,'triangle',.025]]},
 reward:{gap:.35,notes:[[0,440,.11,'sine',.021],[.1,660,.16,'sine',.02]]},
 pickup:{gap:.09,notes:[[0,780,.045,'sine',.009],[.018,1040,.045,'sine',.006]]},
 xpElite:{gap:.4,notes:[[0,660,.08,'triangle',.012],[.045,990,.09,'sine',.009]]},
 xpBoss:{gap:.8,notes:[[0,196,.085,'triangle',.014],[.07,784,.12,'sine',.013],[.13,1174,.12,'sine',.008]]},
 growth:{gap:.45,notes:[[0,523,.09,'sine',.012],[.065,659,.1,'sine',.012],[.13,1046,.13,'sine',.011]]},
 warning:{gap:.3,notes:[[0,330,.12,'sine',.035],[.12,440,.12,'sine',.035]]}
};
export function readSoundSettings(storage){
 try{const value=JSON.parse(storage?.getItem(SETTINGS_KEY));if(!value||typeof value!=='object')return {...DEFAULT_SETTINGS};
  return {muted:typeof value.muted==='boolean'?value.muted:false,volume:Number.isFinite(value.volume)?Math.max(0,Math.min(1,value.volume)):.5,reducedEffects:typeof value.reducedEffects==='boolean'?value.reducedEffects:false};
 }catch{return {...DEFAULT_SETTINGS};}
}
export function createSoundSystem(storage,AudioCtor=globalThis.AudioContext||globalThis.webkitAudioContext){
 let settings=readSoundSettings(storage),context=null,master=null,buses=null,duckUntil=0;const last=new Map(),voices=new Set();
 const save=()=>{try{storage?.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}};
 const busOf=name=>['warning','hurt','boss'].includes(name)?'alert':name==='shot'||name==='hit'||CUES[name]?.group?'combat':'world';
 const kill=voice=>{try{voice.amp.gain.cancelScheduledValues?.(context.currentTime);voice.amp.gain.setValueAtTime(.0001,context.currentTime);voice.osc.stop(context.currentTime+.008);}catch{}voices.delete(voice);};
 const clear=filter=>{for(const voice of voices)if(filter(voice))kill(voice);};
 const setVolume=()=>{if(!master)return;const now=context.currentTime;master.gain.cancelScheduledValues?.(now);master.gain.setValueAtTime(settings.muted?0:settings.volume,now);};
 const duck=now=>{duckUntil=Math.max(duckUntil,now+.32);const gain=buses.combat.gain;gain.cancelScheduledValues?.(now);gain.setValueAtTime(Math.min(gain.value??1,1),now);gain.linearRampToValueAtTime(.28,now+.008);gain.setValueAtTime(.28,duckUntil);gain.linearRampToValueAtTime(1,duckUntil+.08);};
 return {
  get settings(){return {...settings};},
  update(patch){settings={...settings,...Object.fromEntries(Object.entries(patch).filter(([key])=>key in DEFAULT_SETTINGS))};settings={...DEFAULT_SETTINGS,...readSoundSettings({getItem:()=>JSON.stringify(settings)})};if(settings.muted||settings.volume===0)clear(()=>true);setVolume();save();return {...settings};},
  unlock(){if(settings.muted||settings.volume===0||!AudioCtor)return;try{
   context??=new AudioCtor();if(!master){master=context.createGain();master.connect(context.destination);buses={};for(const key of ['combat','world','alert']){const gain=context.createGain();gain.gain.setValueAtTime(1,context.currentTime);gain.connect(master);buses[key]=gain;}setVolume();}
   if(context.state==='suspended')context.resume().catch(()=>{});
  }catch{}},
  stopCombat(){clear(v=>v.bus==='combat'||v.bus==='alert');if(buses){buses.combat.gain.cancelScheduledValues?.(context.currentTime);buses.combat.gain.setValueAtTime(1,context.currentTime);}duckUntil=0;},
  stop(){clear(()=>true);last.clear();if(buses){buses.combat.gain.cancelScheduledValues?.(context.currentTime);buses.combat.gain.setValueAtTime(1,context.currentTime);}duckUntil=0;},
  play(name){const cue=CUES[name];if(!cue||settings.muted||settings.volume===0||!context||context.state!=='running')return false;
   const now=context.currentTime,reward=['reward','xpElite','xpBoss','growth'].includes(name),bus=busOf(name),group=cue.group,priority=cue.priority||1;
   if(now-(last.get(name)??-Infinity)<cue.gap||reward&&now-(last.get('rewardFeedback')??-Infinity)<.2||group&&now-(last.get('group:'+group)??-Infinity)<(group==='contact'?.075:.045)&&priority<=(last.get('priority:'+group)??0))return false;
   for(const voice of voices)if(voice.until<=now)voices.delete(voice);
   const limit=bus==='combat'?12:8,active=[...voices].filter(v=>v.bus===bus);
   let excess=active.length+cue.notes.length-limit;
   if(excess>0){const replace=active.filter(v=>v.priority<priority).sort((a,b)=>a.priority-b.priority||a.until-b.until);if(replace.length<excess)return false;for(const voice of replace.slice(0,excess))kill(voice);}
   const made=[];
   try{if(bus==='alert')duck(now);
    for(const [delay,hz,duration,wave,gain,toHz] of cue.notes){const start=now+delay,osc=context.createOscillator(),amp=context.createGain(),voice={osc,amp,bus,priority,until:start+duration+.01};made.push(voice);voices.add(voice);osc.type=wave;osc.frequency.value=hz;osc.frequency.setValueAtTime?.(hz,start);if(toHz)osc.frequency.exponentialRampToValueAtTime?.(toHz,start+duration);amp.gain.setValueAtTime(.0001,start);amp.gain.linearRampToValueAtTime(gain,start+Math.min(.008,duration/3));amp.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(amp);amp.connect(buses[bus]);osc.onended=()=>{voices.delete(voice);try{osc.disconnect();amp.disconnect();}catch{}};osc.start(start);osc.stop(voice.until);}
    last.set(name,now);if(group){last.set('group:'+group,now);last.set('priority:'+group,priority);}if(reward)last.set('rewardFeedback',now);return true;
   }catch{for(const voice of made)kill(voice);return false;}
  }
 };
}
