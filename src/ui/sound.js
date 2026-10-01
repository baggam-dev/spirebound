// Short synthesized cues. Preferences are local to this browser, not part of run saves.
export const SETTINGS_KEY='spirebound.settings.v1';
export const DEFAULT_SETTINGS=Object.freeze({muted:false,volume:.5,reducedEffects:false});
const CUES={
 shot:{gap:.17,notes:[[0,360,.055,'triangle',.011],[.025,240,.055,'triangle',.008]]},
 hit:{gap:.14,notes:[[0,510,.07,'triangle',.018]]},
 hurt:{gap:.35,notes:[[0,190,.16,'sawtooth',.025]]},
 boss:{gap:1.5,notes:[[0,130,.22,'triangle',.028],[.13,100,.27,'triangle',.025]]},
 reward:{gap:.35,notes:[[0,440,.11,'sine',.021],[.1,660,.16,'sine',.02]]},
 warning:{gap:.3,notes:[[0,330,.12,'sine',.035],[.12,440,.12,'sine',.035]]}
};
export function readSoundSettings(storage){
 try{const value=JSON.parse(storage?.getItem(SETTINGS_KEY));if(!value||typeof value!=='object')return {...DEFAULT_SETTINGS};
  return {muted:typeof value.muted==='boolean'?value.muted:false,volume:Number.isFinite(value.volume)?Math.max(0,Math.min(1,value.volume)):.5,reducedEffects:typeof value.reducedEffects==='boolean'?value.reducedEffects:false};
 }catch{return {...DEFAULT_SETTINGS};}
}
export function createSoundSystem(storage,AudioCtor=globalThis.AudioContext||globalThis.webkitAudioContext){
 let settings=readSoundSettings(storage),context=null;const last=new Map();
 const save=()=>{try{storage?.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}};
 return {
  get settings(){return {...settings};},
  update(patch){settings={...settings,...Object.fromEntries(Object.entries(patch).filter(([key])=>key in DEFAULT_SETTINGS))};settings={...DEFAULT_SETTINGS,...readSoundSettings({getItem:()=>JSON.stringify(settings)})};save();return {...settings};},
  unlock(){if(settings.muted||settings.volume===0||!AudioCtor)return;try{context??=new AudioCtor();if(context.state==='suspended')context.resume().catch(()=>{});}catch{}},
  play(name){const cue=CUES[name];if(!cue||settings.muted||settings.volume===0||!context||context.state!=='running')return false;
   const now=context.currentTime;if(now-(last.get(name)??-Infinity)<cue.gap)return false;
   try{for(const [delay,hz,duration,wave,gain] of cue.notes){const start=now+delay,osc=context.createOscillator(),amp=context.createGain();osc.type=wave;osc.frequency.value=hz;amp.gain.setValueAtTime(.0001,start);amp.gain.linearRampToValueAtTime(gain*settings.volume,start+.012);amp.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(amp);amp.connect(context.destination);osc.start(start);osc.stop(start+duration+.01);osc.onended=()=>{osc.disconnect();amp.disconnect();};}last.set(name,now);return true;}catch{return false;}
  }
 };
}
