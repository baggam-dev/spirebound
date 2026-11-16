import {ENTRANCE_DURATION,entranceMotion} from './entrance-state.js';
let preparation=null,gatePreparation=null;
const load=name=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=new URL('../../assets/images/'+name,import.meta.url).href;});
function leafBounds(image,side){
 const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const d=g.getImageData(0,0,c.width,c.height).data,start=Math.floor(side*c.width/2),end=Math.floor((side+1)*c.width/2);let left=end,right=start,top=c.height,bottom=-1;
 for(let y=0;y<c.height;y++)for(let x=start;x<end;x++)if(d[(y*c.width+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return bottom<top?null:{x:left,y:top,w:right-left+1,h:bottom-top+1};
}
export function prepareGateDoors(){
 if(!gatePreparation)gatePreparation=load('entrance-doors-v1.png').then(doors=>{if(!doors)return null;const leaves=[leafBounds(doors,0),leafBounds(doors,1)];return leaves.every(Boolean)?{doors,leaves}:null;}).catch(()=>null);
 const current=gatePreparation;current.then(value=>{if(!value&&gatePreparation===current)gatePreparation=null;});return current;
}
function actorFrames(image){
 if(image.naturalWidth!==1536||image.naturalHeight!==1024)return null;
 const frames=[];
 for(let i=0;i<8;i++){
  const cell=document.createElement('canvas');cell.width=384;cell.height=512;const g=cell.getContext('2d',{willReadFrequently:true});g.drawImage(image,i%4*384,Math.floor(i/4)*512,384,512,0,0,384,512);
  const pixels=g.getImageData(0,0,384,512);let left=384,right=-1,top=512,bottom=-1;
  for(let y=0;y<512;y++)for(let x=0;x<384;x++){const n=(y*384+x)*4;if(pixels.data[n+3]<24){pixels.data[n+3]=0;continue;}left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)return null;g.putImageData(pixels,0,0);
  const body=document.createElement('canvas');body.width=right-left+1;body.height=bottom-top+1;body.getContext('2d').drawImage(cell,left,top,body.width,body.height,0,0,body.width,body.height);
  const shadow=document.createElement('canvas');shadow.width=body.width;shadow.height=body.height;const sc=shadow.getContext('2d');sc.drawImage(body,0,0);sc.globalCompositeOperation='source-in';sc.fillStyle='#0b0c16';sc.fillRect(0,0,shadow.width,shadow.height);
  frames.push({body,shadow,x:left-200,height:bottom-top+1});
 }return frames;
}
export function prepareEntranceArt(){
 if(preparation)return preparation;
 const work=(async()=>{const [plates,gate,walkImage,actionImage]=await Promise.all([load('entrance-plates-v1.png'),prepareGateDoors(),load('entrance-hero-walk-v2.png'),load('entrance-hero-actions-v2.png')]);if(!plates||!gate||!walkImage||!actionImage)return null;const walk=actorFrames(walkImage),actions=actorFrames(actionImage),ratio=plates.naturalWidth/(plates.naturalHeight/2);return walk&&actions&&ratio>1.6&&ratio<1.9?{plates,...gate,walk,actions}:null;})();
 preparation=new Promise(resolve=>{const timer=setTimeout(()=>resolve(null),15000);work.then(value=>{clearTimeout(timer);resolve(value);},()=>{clearTimeout(timer);resolve(null);});});
 const current=preparation;current.then(value=>{if(!value&&preparation===current)preparation=null;});return current;
}
export const entranceMarkup=()=>'<div class="entrance-scene"><canvas class="entrance-canvas" aria-hidden="true"></canvas><p id="entranceSubtitle" role="status" hidden>돌아갈 길은 닫혔다.</p><button id="entranceSkip" type="button">건너뛰기 <span aria-hidden="true">▸</span></button></div>';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
function exteriorLife(c,t,phase,reduced){
 const clock=reduced?0:t,anchors=phase===0?[[547,454],[1042,454]]:[[448,405],[1136,405]];
 for(const [i,[x,y]] of anchors.entries()){
  const pulse=1+Math.sin(clock*9+i*2)*.09,glow=c.createRadialGradient(x,y,1,x,y,55*pulse);glow.addColorStop(0,'#ffb15525');glow.addColorStop(1,'#ed802000');c.fillStyle=glow;c.fillRect(x-60,y-60,120,120);
  for(let k=0;k<4;k++){const height=(9+Math.sin(clock*11+k*3+i)*3)*pulse;c.fillStyle=k%2?'#ffcf79':'#cf7534';c.fillRect(x-6+k*3,y-height,3,height);}
  if(!reduced)for(let k=0;k<3;k++){const life=(clock*.5+k*.31+i*.17)%1;c.save();c.globalAlpha=(1-life)*.5;c.fillStyle='#e9b878';c.fillRect(x+life*12+Math.sin(clock+k)*3,y-12-life*40,2,2);c.restore();}
 }
 if(!reduced)for(let i=0;i<3;i++){c.save();c.translate((i*610+clock*16)%1900-150,690+i*42);c.scale(1,.06);const fog=c.createRadialGradient(0,0,0,0,0,300);fog.addColorStop(0,'#b1b0be12');fog.addColorStop(1,'#b1b0be00');c.fillStyle=fog;c.fillRect(-300,-300,600,600);c.restore();}
}
// A door leaf keeps its hinge fixed; narrow strips approximate its perspective.
function hingedDoors(c,art,q){
 const x=632,y=15,w=336,h=706,angle=(1-q)*Math.PI/2,span=Math.max(1,w/2*Math.cos(angle)),depth=Math.sin(angle)*22;
 c.save();c.beginPath();c.moveTo(x,99);c.lineTo(800,y);c.lineTo(x+w,99);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();c.clip();
 for(let side=0;side<2;side++){const b=art.leaves[side];for(let i=0;i<28;i++){const u=i/28,v=(i+1)/28,sy=depth*(u+v)/2,dx=side?x+w-v*span:x+u*span,sx=side?b.x+(1-v)*b.w:b.x+u*b.w;c.drawImage(art.doors,sx,b.y,b.w/28,b.h,dx,y+sy,span/28+.8,h-2*sy);}}
 c.restore();
}
export function createEntranceRenderer(host,art,{reduced=false}={}){
 const canvas=host.querySelector('.entrance-canvas'),c=canvas.getContext('2d'),subtitle=host.querySelector('#entranceSubtitle'),box=host.getBoundingClientRect();canvas.width=Math.max(1,Math.min(1600,Math.round(box.width)));canvas.height=Math.max(1,Math.min(900,Math.round(box.height)));
 const W=1600,H=900;
 function hero(p){const f=art[p.sheet][p.frame],s=p.height/420,x=p.x+f.x*s,y=p.feet-f.height*s;
  c.save();c.globalAlpha=.25;c.fillStyle='#050710';c.beginPath();c.ellipse(p.x,p.feet+2,p.height*.14,p.height*.018,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
  c.drawImage(f.body,x,y,f.body.width*s,f.body.height*s);if(p.dark>0){c.globalAlpha=p.dark;c.drawImage(f.shadow,x,y,f.shadow.width*s,f.shadow.height*s);}c.restore();
 }
 return time=>{
  if(!canvas.isConnected)return;
  const t=Math.max(0,Math.min(ENTRANCE_DURATION,time)),p=entranceMotion(t,reduced),half=art.plates.naturalHeight/2;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#08090e';c.fillRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/W,canvas.height/H);c.setTransform(scale,0,0,scale,(canvas.width-W*scale)/2,(canvas.height-H*scale)/2);c.imageSmoothingEnabled=false;
  host.dataset.entrancePhase=String(p.phase);host.dataset.entranceFrame=String(p.frame);subtitle.hidden=t<4.9;
  c.save();c.beginPath();c.rect(0,0,W,H);c.clip();
  if(p.phase===0){c.drawImage(art.plates,0,0,art.plates.naturalWidth,half,0,0,W,H);exteriorLife(c,t,0,reduced);hero(p);}
  else if(p.phase===1){c.drawImage(art.plates,art.plates.naturalWidth*.14,half*.18,art.plates.naturalWidth*.72,half*.72,0,0,W,H);exteriorLife(c,t,1,reduced);hero(p);}
  else{
   c.drawImage(art.plates,0,half,art.plates.naturalWidth,half,0,0,W,H);
   if(p.door<1){const beam=(1-p.door)*155;c.save();c.globalAlpha=(1-p.door)*.25;c.fillStyle='#c7b9dc';c.beginPath();c.moveTo(800-beam/2,720);c.lineTo(800+beam/2,720);c.lineTo(800+beam*1.6,H);c.lineTo(800-beam*1.6,H);c.closePath();c.fill();c.restore();}
   hingedDoors(c,art,p.door);hero(p);
   if(!reduced&&t>=5.2){const age=clamp((t-5.2)/.4);c.save();c.globalAlpha=(1-age)*.35;c.fillStyle='#b2a691';for(let i=0;i<12;i++)c.fillRect(640+i*28+Math.sin(i)*4,95+age*80,2,3);c.restore();}
  }
  c.restore();const fade=t<.14?1-t/.14:t>5.6?(t-5.6)/.2:0;if(fade>0){c.fillStyle=`rgba(8,9,14,${clamp(fade)})`;c.fillRect(0,0,W,H);}
 };
}
