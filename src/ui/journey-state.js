// View-only transitions. The existing key/returnNoticePending fields own progress.
export const RETURN_REVEAL_SECONDS=1.5;
export const DESCENT_SECONDS=.8;
export const DESCENT_DARK_AT=.18;
export const DESCENT_REVEAL_AT=.58;
export function createJourneyState(){
 let token=null;
 const current=run=>token&&token.run===run&&run?.status==='playing'&&run.floor===token.floor&&run.room===token.room?token:null;
 return {
  current,
  beginReturn(run,{fresh=false,origin={x:480,y:175}}={}){
   if(token||!run?.key||!run.returnNoticePending||run.practice||run.status!=='playing')return false;
   token={run,floor:run.floor,room:run.room,kind:'return',elapsed:0,ready:true,fresh,origin:{x:origin.x,y:origin.y}};return true;
  },
  beginDescent(run,fromFloor){
   if(token||run?.status!=='playing'||run.practice||fromFloor-run.floor!==1)return false;
   token={run,floor:run.floor,room:run.room,kind:'descent',elapsed:0,ready:false};return true;
  },
  markReady(run,expected){const t=current(run);if(!t||t!==expected||t.kind!=='descent')return false;t.ready=true;return true;},
  advance(run,dt){
   const t=current(run);if(!t)return false;
   if(Number.isFinite(dt)&&dt>0){const limit=t.kind==='return'?RETURN_REVEAL_SECONDS:t.ready?DESCENT_SECONDS:DESCENT_DARK_AT;t.elapsed=Math.min(limit,t.elapsed+Math.min(dt,.1));}
   return t.elapsed>=(t.kind==='return'?RETURN_REVEAL_SECONDS:DESCENT_SECONDS);
  },
  finish(run,{skip=false}={}){
   const t=current(run);if(!t||(!(skip&&t.kind==='return')&&t.elapsed<(t.kind==='return'?RETURN_REVEAL_SECONDS:DESCENT_SECONDS)))return null;
   token=null;return t;
  },
  cancel(){token=null;}
 };
}
