// Transient feedback is carried by render effects, not saved combat state.
export function drawHitFeedback(ctx,f){
 if(!f.hitSource)return;
 ctx.save();ctx.globalAlpha=Math.min(1,f.t*2);ctx.textAlign='center';ctx.font='bold 12px Galmuri, monospace';ctx.lineWidth=4;ctx.strokeStyle='#101016';ctx.fillStyle='#ffc6d0';
 const x=Math.max(120,Math.min(840,f.x)),y=Math.max(28,f.y-28);
 ctx.strokeText(f.hitSource,x,y);ctx.fillText(f.hitSource,x,y);
 if(Number.isFinite(f.hitAngle)){const a=f.hitAngle,px=f.x,py=f.y+35;ctx.strokeStyle='#ff879c';ctx.lineWidth=5;ctx.beginPath();ctx.arc(px,py,32,a-.45,a+.45);ctx.stroke();}
 ctx.restore();
}
