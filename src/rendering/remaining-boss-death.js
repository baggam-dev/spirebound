import {drawSlimeSprite} from './slime-sprite.js';
import {drawFeedbackSprite} from './feedback-sprites.js';
import {drawDemonSprite} from './demon-sprite.js';
const snapshots=new WeakMap();
// Existing approved bitmaps only. No actor reference, AI, reward or collision.
export function drawRemainingBossDeath(c,f,{reduced=false}={}){
 if(!f.remainingBoss||f.split)return false;
 const age=Math.max(0,Math.min(1,1-f.t/f.duration)),slime=f.remainingBoss==='slime';
 let canvas=snapshots.get(f);
 if(!canvas){canvas=document.createElement('canvas');canvas.width=320;canvas.height=260;
 const ctx=canvas.getContext('2d');ctx.translate(160,150);
 const e={id:0,type:f.bodyType,variant:f.bodyVariant,part:f.bodyPart,gateTitle:f.bodyTitle,stage:f.bodyStage,scale:f.bodyScale,hp:1,max:1,x:0,y:0};
 const options={staticPose:true,reduced:true};
 const drawn=slime?drawSlimeSprite(ctx,e,0,{charge:0},options):['kald','vera'].includes(f.remainingBoss)?drawFeedbackSprite(ctx,e,0,{...options,local:true,face:f.face}):drawDemonSprite(ctx,e,0,options);
 if(!drawn)return false;
 snapshots.set(f,canvas);}
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.globalAlpha*=Math.min(1,(1-age)*1.8);c.translate(Math.round(f.x),Math.round(f.y));
 if(!reduced){c.translate(0,21);c.scale(1+age*(slime?.35:.08),1-age*(slime?.75:.35));c.translate(0,-21);}
 c.imageSmoothingEnabled=false;c.drawImage(canvas,-160,-150);c.restore();return true;
}
