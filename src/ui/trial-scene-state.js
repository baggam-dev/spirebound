// Presentation-only: the saved room's trialState remains the sole progress owner.
export const TRIAL_SCENE_DURATION=Object.freeze({entry:1.1,clear:.9});
export function createTrialSceneState(){
 let token=null;const seen=new WeakMap();
 const current=run=>token&&token.run===run&&run?.status==='playing'&&!run.practice&&run.floor===token.floor&&run.room===token.room&&run.floors[run.floor][run.room]===token.target&&token.target.trialState===(token.kind==='entry'?'active':'reward')?token:null;
 return {
  current,
  begin(run,kind,center){
   if(token||run?.status!=='playing'||run.practice||!Object.hasOwn(TRIAL_SCENE_DURATION,kind))return false;
   const target=run.floors[run.floor][run.room];if(target.trialState!==(kind==='entry'?'active':'reward'))return false;
   const events=seen.get(target)||new Set();if(events.has(kind))return false;events.add(kind);seen.set(target,events);
   token={run,target,kind,floor:run.floor,room:run.room,elapsed:0,duration:TRIAL_SCENE_DURATION[kind],x:center.x,y:center.y};return true;
  },
  advance(run,dt){const t=current(run);if(!t)return true;if(Number.isFinite(dt)&&dt>0)t.elapsed=Math.min(t.duration,t.elapsed+Math.min(dt,.1));return t.elapsed>=t.duration;},
  finish(run,{skip=false}={}){const t=current(run);if(!t||t.elapsed<(skip ? .15 : t.duration))return false;token=null;return true;},
  cancel(){token=null;}
 };
}
