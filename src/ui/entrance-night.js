import {createCachedPreparation} from '../rendering/asset-wait.js';
const load=name=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=new URL('../../assets/images/'+name+'.png',import.meta.url).href;});
export const prepareNightEntrance=createCachedPreparation(async()=>{const [background,rear,pause,front,...fire]=await Promise.all(['entrance-night-background-v1','entrance-night-rear-v1','entrance-night-pause-v1','entrance-night-front-v1',...Array.from({length:4},(_,i)=>'title-night-fire-'+i)].map(load));return background&&rear&&pause&&front?{background,rear,pause,front,fire}:null;});
const clamp=n=>Math.max(0,Math.min(1,n));
export function nightMotion(t,reduced=false){
 if(t<2.4){const q=reduced ? .5 : clamp(t/2.4);return {phase:0,sheet:'rear',frame:reduced?0:Math.floor(t/.1)%8,x:267+52*q,feet:345-38*q,height:102-8*q};}
 if(t<3.8){const a=t-2.4;return {phase:1,sheet:'pause',frame:reduced?2:a<.25?0:a<.55?1:a<1.05?2:3,x:292,feet:338,height:120};}
 const q=reduced ? .35 : clamp((t-3.8)/2.4);return {phase:2,sheet:'front',frame:reduced?0:Math.floor((t-3.8)/.1)%8,x:320,feet:306+173*q,height:103+35*q};
}
export function createNightEntranceRenderer(host,art,{reduced=false}={}){
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),subtitle=host.querySelector('#entranceSubtitle'),box=host.getBoundingClientRect();canvas.width=Math.max(1,Math.min(1600,Math.round(box.width)));canvas.height=Math.max(1,Math.min(900,Math.round(box.height)));
 return t=>{if(!canvas.isConnected)return;const p=nightMotion(t,reduced),scale=Math.min(canvas.width/640,canvas.height/360);c.setTransform(1,0,0,1,0,0);c.fillStyle='#080d16';c.fillRect(0,0,canvas.width,canvas.height);c.setTransform(scale,0,0,scale,(canvas.width-640*scale)/2,(canvas.height-360*scale)/2);c.imageSmoothingEnabled=false;c.drawImage(art.background,p.phase*640,0,640,360,0,0,640,360);
 // Fixed hinges; source is the approved closed panel, clipped to the arch.
 const closed=reduced?(t>=7.2?1:0):clamp((t-6.4)/.8);if(p.phase===2&&closed>0){c.save();c.beginPath();c.moveTo(235,80);c.quadraticCurveTo(240,30,320,20);c.quadraticCurveTo(400,30,405,80);c.lineTo(405,271);c.lineTo(235,271);c.closePath();c.clip();const span=85*Math.sin(closed*Math.PI/2);for(let side=0;side<2;side++)for(let i=0;i<28;i++){const u=i/28,v=(i+1)/28,dx=side?405-v*span:235+u*span,sx=side?405-v*85:235+u*85;c.drawImage(art.background,1920+sx,20,85/28,251,dx,20,span/28+.5,251);}c.restore();}
 if(t<6.4){const size=p.height*128/96;c.save();c.globalAlpha=.24;c.fillStyle='#02050a';c.beginPath();c.ellipse(p.x,p.feet,p.height*.14,2,0,0,Math.PI*2);c.fill();c.globalAlpha=1;c.drawImage(art[p.sheet],p.frame*128,0,128,128,p.x-size/2,p.feet-size*120/128,size,size);c.restore();}
 const anchors=p.phase===0?[[239,195],[396,195]]:p.phase===1?[[153,184],[603,263]]:[[48,173],[151,190],[489,190],[588,173]],fire=art.fire[reduced?0:Math.floor(t*10)%4];if(fire)for(const [x,y] of anchors){const size=p.phase===1?31:26;c.drawImage(fire,x-size/2,y-size,size,size);if(!reduced){const a=(t*.6+x)%1;c.globalAlpha=(1-a)*.6;c.fillStyle='#eabe73';c.fillRect(x+a*6,y-size-a*15,1,1);c.globalAlpha=1;}}
 subtitle.textContent=t>=7.2?'돌아갈 길은 닫혔다.':'돌아오지 않은 이들의 흔적을 따라.';subtitle.hidden=!(t>.2&&t<2.3||t>=7.2);host.dataset.entrancePhase=String(p.phase);host.dataset.entranceFrame=String(p.frame);
 const fade=t<.2?1-t/.2:t>7.7?(t-7.7)/.3:0;if(fade>0){c.fillStyle=`rgba(8,13,22,${clamp(fade)})`;c.fillRect(0,0,640,360);}
 };
}
