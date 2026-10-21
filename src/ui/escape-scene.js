import {titleArt} from './title-scene.js';
import {prepareGateDoors} from './entrance-scene.js';
let preparation=null;
export function prepareEscapeArt(){
 if(preparation)return preparation;
 preparation=Promise.all([new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=new URL('../../assets/images/escape-dawn-v1.png',import.meta.url).href;}),prepareGateDoors(),titleArt.hero.decode().then(()=>true,()=>false)])
  .then(([background,gate,hero])=>background&&gate&&hero?{background,...gate,hero:titleArt.hero}:null).catch(()=>null);
 const current=preparation;current.then(value=>{if(!value&&preparation===current)preparation=null;});return current;
}
export const escapeMarkup=()=>'<div class="escape-scene"><canvas class="escape-canvas" aria-hidden="true"></canvas><p id="escapeSubtitle" role="status" hidden>살아서 내려왔다.</p><button id="escapeSkip" type="button">건너뛰기 <span aria-hidden="true">▸</span></button></div>';
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function createEscapeRenderer(host,art,{reduced=false}={}){
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),box=host.getBoundingClientRect(),subtitle=host.querySelector('#escapeSubtitle');canvas.width=Math.max(1,Math.min(1600,Math.round(box.width)));canvas.height=Math.max(1,Math.min(900,Math.round(box.height)));
 return time=>{
  if(!canvas.isConnected)return;
  host.dataset.escapePhase=String(time<.8?0:time<2.4?1:2);host.dataset.escapeTime=time.toFixed(2);subtitle.hidden=time<2.4;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#08090e';c.fillRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/1600,canvas.height/900);c.setTransform(scale,0,0,scale,(canvas.width-1600*scale)/2,(canvas.height-900*scale)/2);c.imageSmoothingEnabled=false;
  c.save();c.beginPath();c.rect(0,0,1600,900);c.clip();c.drawImage(art.background,0,0,1600,900);
  const opening=reduced?(time<.4?0:1):ease(time/.8);c.fillStyle=`rgba(8,9,14,${(1-opening)*.45})`;c.fillRect(0,0,1600,900);
  c.save();c.beginPath();c.rect(420,0,760,695);c.clip();for(let i=0;i<2;i++){const b=art.leaves[i];c.drawImage(art.doors,b.x,b.y,b.w,b.h,420+i*380+(i?1:-1)*opening*390,-40,381,735);}c.restore();
  if(opening>0&&opening<1){const beam=c.createLinearGradient(800,450,800,900);beam.addColorStop(0,'#ffefb477');beam.addColorStop(1,'#ffefb400');c.fillStyle=beam;c.beginPath();c.moveTo(800-opening*130,100);c.lineTo(800+opening*130,100);c.lineTo(1250,900);c.lineTo(350,900);c.fill();}
  if(time<.8){c.save();c.translate(800,425);c.globalAlpha=1-opening;c.strokeStyle='#e2c892';c.lineWidth=3;c.beginPath();c.moveTo(0,-30);c.lineTo(20,0);c.lineTo(0,30);c.lineTo(-20,0);c.closePath();c.stroke();for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);c.fillStyle='#dec58b';c.fillRect(30+opening*90,-2,12,4);c.restore();}c.restore();}
  const q=ease((time-.8)/1.6),h=280-70*q,feet=865-135*q+(reduced?0:Math.sin(q*Math.PI*6)*2),cell=art.hero.naturalWidth/3,frame=reduced?0:[0,1,2,1][Math.floor(time/.28)%4];
  c.save();c.globalAlpha=.25;c.fillStyle='#0a0b0c';c.beginPath();c.ellipse(770+30*q,feet-8,h*.18,h*.045,0,0,Math.PI*2);c.fill();c.restore();c.drawImage(art.hero,frame*cell,0,cell,art.hero.naturalHeight,770+30*q-h/2,feet-h,h,h);
  if(!reduced)for(let i=0;i<22;i++){const life=(time*.32+i*.173)%1;c.globalAlpha=(1-life)*.5;c.fillStyle=i%3?'#e7c383':'#b8c9b5';c.fillRect(470+i*31+Math.sin(time+i)*9,730-life*510,2,3);}c.globalAlpha=1;
  const fade=time<.12?1-time/.12:time>2.85?(time-2.85)/.15:0;if(fade>0){c.fillStyle=`rgba(8,9,14,${clamp(fade)})`;c.fillRect(0,0,1600,900);}c.restore();
 };
}
