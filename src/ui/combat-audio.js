// Observe real simulation state only. No timers, RNG, run fields or saved audio state.
export function combatHitCue(effects=[],slashContact=false){
 if(effects.some(f=>f.precisionBurst))return 'criticalHit';
 if(slashContact||effects.some(f=>f.slash))return 'slashHit';
 return effects.some(f=>f.arrowImpact||f.hitElement)?'hit':null;
}
export function createCombatAudio(sound){
 let run=null,room=null,rain=null,turrets=new Map(),roll=null;
 const observeRain=z=>z?{ref:z,pulses:z.pulses,fallFor:z.elapsed>=z.pulses*.3-.18?z.pulses:-1}:null;
 const observeTurret=t=>({clock:t.clock,armed:t.clock>0});
 function attach(nextRun,nextRoom){
  if(run===nextRun&&room===nextRoom)return true;
  run=nextRun;room=nextRoom;rain=observeRain(room?.arrowRain);turrets=new Map((room?.turrets||[]).map(t=>[t,observeTurret(t)]));roll=run?.roll?{ref:run.roll,hits:run.roll.hit?.length||0}:null;return false;
 }
 const reset=()=>{run=null;room=null;rain=null;turrets=new Map();roll=null;};
 return {
  reset,
  prepare(nextRun,nextRoom){attach(nextRun,nextRoom);},
  cast(nextRun,nextRoom){
   const same=attach(nextRun,nextRoom);if(!run||!room)return;
   if(run.player.evolutions?.ultimate==='turret'){
    if(same&&[...turrets.keys()].some(t=>!room.turrets?.includes(t)))sound.play('crossbowRetract');
    sound.play('crossbowDeploy');turrets=new Map((room.turrets||[]).map(t=>[t,turrets.get(t)||observeTurret(t)]));
   }else if(room.arrowRain){sound.play('rainCast');rain={ref:room.arrowRain,pulses:room.arrowRain.pulses,fallFor:-1};}
  },
  update(nextRun,nextRoom,effects=[]){
   if(!nextRun||!nextRoom){reset();return;}if(!attach(nextRun,nextRoom))return;
   const q=run.roll||roll?.ref,oldHits=roll&&q===roll.ref?roll.hits:0,slash=q?.kind==='slash'&&(q.hit?.length||0)>oldHits;
   roll=run.roll?{ref:run.roll,hits:run.roll.hit?.length||0}:null;
   const hit=combatHitCue(effects,slash);if(hit)sound.play(hit);
   const z=room.arrowRain;
   if(!z)rain=null;
   else if(rain?.ref!==z)rain=observeRain(z); // Loaded/replaced state never replays past pulses.
   else{
    if(z.pulses>rain.pulses){sound.play(z.pulses>=6?'rainFinal':'rainImpact');rain.pulses=z.pulses;}
    if(z.pulses<6&&rain.fallFor!==z.pulses&&z.elapsed+1e-9>=z.pulses*.3-.18){sound.play('rainFall');rain.fallFor=z.pulses;}
   }
   const current=new Map();let removed=false;
   for(const t of room.turrets||[]){
    const before=turrets.get(t);if(!before)sound.play('crossbowDeploy');
    const old=before||{clock:0,armed:false},shot=t.clock>old.clock+1e-6;
    if(shot)sound.play('crossbowShot');
    else if(old.armed&&old.clock>.18&&t.clock<=.18&&t.clock>0)sound.play('crossbowReload');
    current.set(t,{clock:t.clock,armed:shot||old.armed&&t.clock>0});
   }
   for(const t of turrets.keys())if(!current.has(t))removed=true;
   if(removed)sound.play('crossbowRetract');turrets=current;
  }
 };
}
