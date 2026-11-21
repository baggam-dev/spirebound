// A completed run is already recorded. This token controls presentation only.
export const ESCAPE_DURATION=7,ESCAPE_WAIT=.8;
export const ESCAPE_CUES=Object.freeze([[.82,'gateStep'],[1.3,'gateStep'],[1.74,'gateStep'],[2.18,'gateStep'],[2.62,'gateStep'],[3.65,'escapeBreath'],[5.05,'gateStep'],[5.53,'gateStep'],[6.01,'gateStep'],[6.49,'gateStep']].map(Object.freeze));
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
function paced(time,duration,stride){const at=t=>{const n=t/stride;return Math.floor(n)+ease(((n%1)-.12)/.76);};return clamp(at(Math.min(time,duration))/at(duration));}
// Fixed scale within each camera shot; travel comes from planted-foot poses.
export function escapeMotion(time,reduced=false){
 const t=Number.isFinite(time)?Math.max(0,Math.min(ESCAPE_DURATION,time)):0;
 const phase=t<1.2?0:t<3?1:t<4.8?2:3,a=t-[0,1.2,3,4.8][phase];
 let sheet='rear',frame=0,feet=850,height=260;
 if(phase===0){feet-=24*ease((a-.7)/.5);frame=a<.7?0:Math.floor((a-.7)/.22)%4;}
 if(phase===1){sheet=a<1.6?'front':'actions';frame=a<1.6?Math.floor(a/.22)%4:0;feet=615+225*paced(a,1.6,.44);height=340;}
 if(phase===2){sheet='actions';frame=a<.3?0:a<.65?1:a<1.3?2:3;feet=840;height=340;}
 if(phase===3){frame=Math.floor(a/.24)%4;feet=845-120*paced(a,2.2,.48);}
 if(reduced)frame=phase===2?2:0;
 return {phase,sheet,frame,x:800,feet,height,opening:reduced?(t<.65?0:1):ease((t-.18)/.85),subtitle:t>=4.9&&t<6.85,fade:t<.12?1-t/.12:t>6.8?clamp((t-6.8)/.2):0};
}
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
