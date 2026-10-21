// A completed run is already recorded. This token controls presentation only.
export const ESCAPE_DURATION=3,ESCAPE_WAIT=.8;
export function createEscapeState(){
 let token=null,lastRun=null;
 const matches=run=>!!token&&token.run===run&&run?.status==='won'&&!run.practice;
 return {
  queue(run,result){if(!result?.ok||!run?.runId||run.practice||run.status!=='won'||lastRun===run.runId)return false;lastRun=run.runId;token={run,status:'queued',elapsed:0};return true;},
  queued:run=>matches(run)&&token.status==='queued',
  active:run=>matches(run)&&token.status==='active',
  start(run){if(!matches(run)||token.status!=='queued')return false;token.status='active';token.elapsed=0;return true;},
  time:run=>matches(run)?token.elapsed:0,
  advance(run,dt){if(!matches(run))return true;if(Number.isFinite(dt)&&dt>0)token.elapsed+=Math.min(dt,.1);return token.elapsed>=(token.status==='queued'?ESCAPE_WAIT:ESCAPE_DURATION);},
  finish(run){if(!matches(run))return false;token=null;return true;},
  cancel(){token=null;}
 };
}
