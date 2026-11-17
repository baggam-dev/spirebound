import {assetProgress} from './asset-requests.js';
// Timing out stops the caller waiting, not the browser's image decode. Preserve
// late success for a later request, but never replace a newer attempt's result.
export function createCachedPreparation(load,{timeoutMs=15000,schedule=setTimeout,cancel=clearTimeout}={}){
 let ready=null,pending=null,generation=0;
 return ()=>{
  if(ready)return Promise.resolve(ready);if(pending)return pending;
  const version=++generation;let resolve,finished=false;
  const result=new Promise(done=>{resolve=done;});pending=result;
  const finish=value=>{if(finished)return;finished=true;cancel(timer);if(pending===result)pending=null;resolve(value);};
  const timer=schedule(()=>finish(null),timeoutMs);
  Promise.resolve().then(load).then(value=>{if(value&&version===generation)ready=value;finish(value||null);},()=>finish(null));
  return result;
 };
}
// A large saved upper floor may legitimately take longer than a fixed deadline.
// Keep waiting while files finish, but bound both a stalled connection and total work.
export function waitForAssets(work,{progress=assetProgress,idleMs=60000,maxMs=300000,now=Date.now,schedule=setInterval,cancel=clearInterval}={}){
 const start=now();let changed=start,last=progress(),finished=false,timer;
 return new Promise((resolve,reject)=>{
  const finish=(fn,value)=>{if(finished)return;finished=true;cancel(timer);fn(value);};
  timer=schedule(()=>{
   const time=now(),next=progress();if(next!==last){last=next;changed=time;}
   if(time-start>=maxMs)finish(reject,Error('Asset preparation limit'));
   else if(time-changed>=idleMs)finish(reject,Error('Asset transfer stalled'));
  },1000);
  Promise.resolve(work).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
