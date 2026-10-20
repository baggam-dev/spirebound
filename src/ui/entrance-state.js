// Presentation-only, memory-only token. Never mutates or serializes a run.
export const ENTRANCE_DURATION=3.6;
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
