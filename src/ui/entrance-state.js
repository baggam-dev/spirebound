// Presentation-only, memory-only token. Never mutates or serializes a run.
export const ENTRANCE_DURATION=5.8;
export const ENTRANCE_CUES=Object.freeze([[.12,'gateStep'],[.6,'gateStep'],[1.08,'gateStep'],[3.08,'gateStep'],[3.56,'gateStep'],[3.98,'gateStep'],[4.15,'gateOpen'],[4.4,'gateStep'],[5.2,'gateClose']].map(Object.freeze));
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function entranceMotion(time,reduced=false){
 const t=Math.max(0,Math.min(ENTRANCE_DURATION,Number.isFinite(time)?time:0));
 if(t<1.6){const p=t/1.6;return {phase:0,sheet:'walk',frame:reduced?0:Math.floor(t/.12)%8,x:650+150*p,feet:860-130*p,height:260,dark:0,door:0};}
 if(t<3.5){const a=t-1.6,walking=a>=1.45,p=clamp((a-1.45)/.45);return {phase:1,sheet:walking?'walk':'actions',frame:walking?(reduced?0:Math.floor((a-1.45)/.12)%8):a<.25?0:a<.65?1:a<1.15?2:a<1.35?0:3,x:800,feet:790-90*p,height:360,dark:p*.65,door:0};}
 const a=t-3.5,p=clamp(a/1.05);return {phase:2,sheet:'actions',frame:4+(reduced||a>=1.05?0:Math.floor(a/.14)%4),x:800,feet:650+180*p,height:300,dark:ease((a-.25)/1.2)*.94,door:reduced?(t>=5.2?1:0):ease((t-4.15)/1.05)};
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
  cancel(){token=null;}
 };
}
