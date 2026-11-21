import {prepareGateDoors,actorFrames} from './entrance-scene.js';
import {ESCAPE_DURATION,escapeMotion} from './escape-state.js';
let preparation=null;
const load=name=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=new URL('../../assets/images/'+name,import.meta.url).href;});
export function prepareEscapeArt(){
 if(preparation)return preparation;
 preparation=Promise.all([load('escape-dawn-v2.png'),load('escape-threshold-v2.png'),prepareGateDoors(),load('entrance-hero-frontwalk-v3.png'),load('escape-hero-actions-v2.png'),load('escape-hero-rearwalk-v2.png')]).then(([background,threshold,gate,...images])=>{
  if(!background||!threshold||!gate||images.some(i=>!i))return null;
  const [front,actions,rear]=images.map(i=>actorFrames(i,{columns:2,count:4,anchor:384}));
  return front&&actions&&rear?{background,threshold,...gate,front,actions,rear}:null;
 }).catch(()=>null);
 const current=preparation;current.then(value=>{if(!value&&preparation===current)preparation=null;});return current;
}
export const escapeMarkup=()=>'<div class="escape-scene"><canvas class="escape-canvas" aria-hidden="true"></canvas><p id="escapeSubtitle" role="status" hidden>살아서 내려왔다.</p><button id="escapeSkip" type="button">건너뛰기 <span aria-hidden="true">▸</span></button></div>';
function doors(c,art,opening){
 const x=420,w=760,h=695,angle=opening*Math.PI/2,span=Math.max(1,w/2*Math.cos(angle)),depth=Math.sin(angle)*22;
 c.save();c.beginPath();c.rect(x,0,w,h);c.clip();
 for(let side=0;side<2;side++){const b=art.leaves[side];for(let i=0;i<28;i++){const u=i/28,v=(i+1)/28,sy=depth*(u+v)/2,dx=side?x+w-v*span:x+u*span,sx=side?b.x+(1-v)*b.w:b.x+u*b.w;c.drawImage(art.doors,sx,b.y,b.w/28,b.h,dx,sy,span/28+.8,h-2*sy);}}
 c.restore();
}
export function createEscapeRenderer(host,art,{reduced=false}={}){
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),box=host.getBoundingClientRect(),subtitle=host.querySelector('#escapeSubtitle');canvas.width=Math.max(1,Math.min(1600,Math.round(box.width)));canvas.height=Math.max(1,Math.min(900,Math.round(box.height)));
 return time=>{
  if(!canvas.isConnected)return;
  const t=Number.isFinite(time)?Math.max(0,Math.min(ESCAPE_DURATION,time)):0,p=escapeMotion(t,reduced);
  host.dataset.escapePhase=String(p.phase);host.dataset.escapeTime=t.toFixed(2);subtitle.hidden=!p.subtitle;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#08090e';c.fillRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/1600,canvas.height/900);c.setTransform(scale,0,0,scale,(canvas.width-1600*scale)/2,(canvas.height-900*scale)/2);c.imageSmoothingEnabled=false;
  c.save();c.beginPath();c.rect(0,0,1600,900);c.clip();c.drawImage(p.phase===1||p.phase===2?art.threshold:art.background,0,0,1600,900);
  if(p.phase===0){doors(c,art,p.opening);c.save();c.globalAlpha=1-p.opening;c.translate(800,350);c.strokeStyle='#cab4d8';c.lineWidth=3;c.beginPath();c.moveTo(0,-34);c.lineTo(22,0);c.lineTo(0,34);c.lineTo(-22,0);c.closePath();c.stroke();for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);c.fillStyle='#d9c5df';c.fillRect(35+p.opening*45,-1,10,2);c.restore();}c.restore();}
  const f=art[p.sheet][p.frame],s=p.height/f.referenceHeight,x=p.x+f.x*s,y=p.feet-f.height*s;
  c.save();c.fillStyle='#080a12';c.globalAlpha=.24;c.beginPath();c.ellipse(p.x,p.feet+2,p.height*.14,p.height*.018,0,0,Math.PI*2);c.fill();
  if(!reduced){c.save();c.translate(p.x,p.feet);c.transform(1,0,.18,-.12,0,0);c.globalAlpha=.16;c.drawImage(f.shadow,f.x*s,-f.height*s,f.shadow.width*s,f.shadow.height*s);c.restore();}
  c.globalAlpha=1;c.drawImage(f.body,x,y,f.body.width*s,f.body.height*s);c.restore();
  if(!reduced)for(let i=0;i<12;i++){const life=(t*.13+i*.173)%1;c.globalAlpha=(1-life)*.22;c.fillStyle='#e5c694';c.fillRect(410+i*70+Math.sin(t+i)*8,780-life*450,2,2);}c.globalAlpha=1;
  if(p.fade>0){c.fillStyle=`rgba(8,9,14,${p.fade})`;c.fillRect(0,0,1600,900);}c.restore();
 };
}
