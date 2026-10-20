import {titleArt} from './title-scene.js';
let preparation=null;
const load=name=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=new URL('../../assets/images/'+name,import.meta.url).href;});
function leafBounds(image,side){
 const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const d=g.getImageData(0,0,c.width,c.height).data,start=Math.floor(side*c.width/2),end=Math.floor((side+1)*c.width/2);let left=end,right=start,top=c.height,bottom=-1;
 for(let y=0;y<c.height;y++)for(let x=start;x<end;x++)if(d[(y*c.width+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return bottom<top?null:{x:left,y:top,w:right-left+1,h:bottom-top+1};
}
export function prepareEntranceArt(){
 if(preparation)return preparation;
 const work=(async()=>{const [plates,doors,background,hero]=await Promise.all([load('entrance-plates-v1.png'),load('entrance-doors-v1.png'),titleArt.background.decode().then(()=>true,()=>false),titleArt.hero.decode().then(()=>true,()=>false)]);if(!plates||!doors||!background||!hero)return null;const ratio=plates.naturalWidth/(plates.naturalHeight/2),leaves=[leafBounds(doors,0),leafBounds(doors,1)];return ratio>1.6&&ratio<1.9&&leaves.every(Boolean)?{plates,doors,leaves,background:titleArt.background,hero:titleArt.hero}:null;})();
 preparation=new Promise(resolve=>{const timer=setTimeout(()=>resolve(null),15000);work.then(value=>{clearTimeout(timer);resolve(value);},()=>{clearTimeout(timer);resolve(null);});});
 const current=preparation;current.then(value=>{if(!value&&preparation===current)preparation=null;});return current;
}
export const entranceMarkup=()=>'<div class="entrance-scene"><canvas class="entrance-canvas" aria-hidden="true"></canvas><p id="entranceSubtitle" role="status" hidden>돌아갈 길은 닫혔다.</p><button id="entranceSkip" type="button">건너뛰기 <span aria-hidden="true">▸</span></button></div>';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export function createEntranceRenderer(host,art,{reduced=false}={}){
 const canvas=host.querySelector('.entrance-canvas'),c=canvas.getContext('2d'),subtitle=host.querySelector('#entranceSubtitle'),box=host.getBoundingClientRect();canvas.width=Math.max(1,Math.min(1600,Math.round(box.width)));canvas.height=Math.max(1,Math.min(900,Math.round(box.height)));
 const W=1600,H=900;
 const hero=(x,feet,h,t,alpha=1)=>{const cell=art.hero.naturalWidth/3,frame=reduced?0:[0,1,2,1][Math.floor(t/.32)%4];c.save();c.globalAlpha=alpha;c.drawImage(art.hero,frame*cell,0,cell,art.hero.naturalHeight,x-h/2,feet-h,h,h);c.restore();};
 return time=>{
  if(!canvas.isConnected)return;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#08090e';c.fillRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/W,canvas.height/H);c.setTransform(scale,0,0,scale,(canvas.width-W*scale)/2,(canvas.height-H*scale)/2);c.imageSmoothingEnabled=false;
  const phase=time<1?0:time<2.4?1:2;host.dataset.entrancePhase=String(phase);subtitle.hidden=time<1.4;
  c.save();
  if(phase===0){const z=reduced?1:1+.012*ease(time);c.translate(W*.65,H*.7);c.scale(z,z);c.translate(-W*.65,-H*.7);c.drawImage(art.background,0,0,W,H);hero(887,892,295,time);}
  else if(phase===1){c.drawImage(art.plates,0,0,art.plates.naturalWidth,art.plates.naturalHeight/2,0,0,W,H);const q=ease((time-1)/1.4),bob=reduced?0:Math.sin(q*Math.PI*4)*4;hero(W*.5,H*(.97-.23*q)+bob,H*(.31-.12*q),time,1-ease((q-.8)/.2));}
  else{
   c.drawImage(art.plates,0,art.plates.naturalHeight/2,art.plates.naturalWidth,art.plates.naturalHeight/2,0,0,W,H);
   const q=reduced?(time<3?0:1):ease((time-2.4)/.76),slide=(1-q)*W*.026,x=W*.395,y=H*.017,w=W*.208,h=H*.785;
   c.save();c.beginPath();c.moveTo(x,H*.11);c.lineTo(W*.5,y);c.lineTo(x+w,H*.11);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();c.clip();
   for(let i=0;i<2;i++){const b=art.leaves[i];c.drawImage(art.doors,b.x,b.y,b.w,b.h,x+i*w/2+(i?slide:-slide),y,w/2+.5,h);}c.restore();
   if(q<1){c.save();c.globalAlpha=(1-q)*.34;c.fillStyle='#c5c7e7';const beam=Math.max(1,slide*1.5);c.beginPath();c.moveTo(W*.5-beam/2,H*.8);c.lineTo(W*.5+beam/2,H*.8);c.lineTo(W*.5+beam*2,H);c.lineTo(W*.5-beam*2,H);c.fill();c.restore();}
   if(!reduced&&time>3.1){c.save();c.fillStyle='#b2a691';for(let i=0;i<16;i++){const age=clamp((time-3.1)*2-i*.016);c.globalAlpha=(1-age)*.42;c.fillRect(W*(.405+i*.012)+Math.sin(i)*5,H*.1+age*H*.28,2,3);}c.restore();}
  }
  c.restore();const fade=time<.12?1-time/.12:time>3.4?(time-3.4)/.2:0;if(fade>0){c.fillStyle=`rgba(8,9,14,${clamp(fade)})`;c.fillRect(0,0,W,H);}
 };
}
