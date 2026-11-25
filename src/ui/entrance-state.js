// Presentation-only, memory-only token. Never mutates or serializes a run.
export const ENTRANCE_DURATION=8;
export const ENTRANCE_CUES=Object.freeze([[.12,'gateStep'],[.7,'gateStep'],[1.3,'gateStep'],[1.9,'gateStep'],[3.9,'gateStep'],[4.5,'gateStep'],[5.1,'gateStep'],[5.7,'gateStep'],[6.4,'gateOpen'],[7.2,'gateClose']].map(Object.freeze));
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
// Short stance holds separated by weight transfer; no camera zoom simulates walking.
function paced(time,duration,stride){const at=t=>{const n=t/stride;return Math.floor(n)+ease(((n%1)-.12)/.76);};return clamp(at(Math.min(time,duration))/at(duration));}
export function entranceMotion(time,reduced=false){
 const t=Math.max(0,Math.min(ENTRANCE_DURATION,Number.isFinite(time)?time:0));
 if(t<1.6){const p=paced(t,1.6,.48);return {phase:0,sheet:'walk',frame:reduced?0:Math.floor(t/.12)%8,x:650+150*p,feet:860-130*p,height:260,dark:0,door:0,visible:true};}
 if(t<3.2){const a=t-1.6;return {phase:1,sheet:'actions',frame:reduced?2:a<.3?0:a<.65?1:a<1.25?2:3,x:650,feet:815,height:360,dark:0,door:0,visible:true};}
 if(t<5){const a=t-3.2,p=paced(a,1.8,.36);return {phase:2,sheet:'front',frame:reduced?0:Math.floor(a/.18)%4,x:800,feet:670+620*p,height:300,dark:.12*p,door:0,visible:true};}
 return {phase:3,sheet:'front',frame:0,x:800,feet:1290,height:300,dark:0,door:t>=6.4?1:reduced?0:ease((t-5.08)/1.32),visible:false};
}
export function createEntranceState(){
 let token=null,lastRunId=null;
 const matches=run=>!!token&&run?.status==='playing'&&!run.practice&&token.runId===run.runId;
 return {
  queue(run){if(!run?.runId||run.status!=='playing'||run.practice||run.runId===lastRunId)return false;lastRunId=run.runId;token={runId:run.runId,status:'queued',elapsed:0};return true;},
  queued:run=>matches(run)&&token.status==='queued',
  active:run=>matches(run)&&token.status==='active',
  start(run){if(!matches(run)||token.status!=='queued')return false;token.status='active';return true;},
  time:run=>matches(run)?token.elapsed:0,
  advance(run,dt){if(!matches(run)||token.status!=='active')return false;if(Number.isFinite(dt)&&dt>0)token.elapsed=Math.min(ENTRANCE_DURATION,token.elapsed+Math.min(dt,.1));return token.elapsed>=ENTRANCE_DURATION;},
  finish(run){if(!matches(run))return false;token=null;return true;},
  suspend(){if(token)token.status='queued';},
  cancel(){token=null;}
 };
}
