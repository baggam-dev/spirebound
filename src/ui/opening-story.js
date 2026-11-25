import {createCachedPreparation} from '../rendering/asset-wait.js';
export const STORY_SECONDS=28;
export const STORY_PARAGRAPHS=[["왕국에는,", "밤이 끝나지 않는 탑이 있었다.", "", "문을 지난 이들은", "돌아오지 않았다."], ["돌아오지 않은 이들을 찾아", "원정대가 떠났다.", "", "그러나 그들마저", "소식을 끊었다."], ["당신은 그들의 마지막 흔적을", "추적하라는 명을 받은 정찰병이다.", "", "활 하나와 남겨진 표식을 따라,", "탑으로 향했다."], ["누가 아직 살아 있는지.", "무엇이 귀환을 막고 있는지.", "", "답은 저 문 너머에 있었다."]];
const switches=[9.3446191052,14.4909310762,19.4340991536];
export function storyFrame(time){return switches.filter(t=>time>=t).length;}
export function storyScroll(time){return 320-Math.max(0,Math.min(28,time))*29.535714285714285;}
export function storySeen(){try{return localStorage.getItem('spirebound.opening.v1')==='seen';}catch{return false;}}
export function rememberStory(){try{localStorage.setItem('spirebound.opening.v1','seen');}catch{}}
export const prepareStoryArt=createCachedPreparation(()=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth===2560&&image.naturalHeight===360?image:null);image.onerror=()=>resolve(null);image.src=new URL('../../assets/images/opening-story-v1.png',import.meta.url).href;}),{timeoutMs:8000});
export function storyMarkup(){return '<div class="entrance-scene opening-story"><canvas class="entrance-canvas" aria-hidden="true"></canvas><div class="story-accessible">'+STORY_PARAGRAPHS.map(lines=>'<p>'+lines.join('<br>')+'</p>').join('')+'</div><button id="storyPause" type="button">일시정지</button><button id="entranceSkip" type="button">서사 건너뛰기</button></div>';}
export function createStoryRenderer(host,image,{reduced=false}={}){
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),box=host.getBoundingClientRect();canvas.width=Math.max(1,Math.min(1600,Math.round(box.width)));canvas.height=Math.max(1,Math.min(900,Math.round(box.height)));
 return time=>{if(!canvas.isConnected)return;const scale=Math.min(canvas.width/640,canvas.height/360);c.setTransform(1,0,0,1,0,0);c.fillStyle='#080d16';c.fillRect(0,0,canvas.width,canvas.height);c.setTransform(scale,0,0,scale,(canvas.width-640*scale)/2,(canvas.height-360*scale)/2);c.imageSmoothingEnabled=false;
 const frame=storyFrame(time);if(image){c.drawImage(image,frame*640,0,640,360,0,0,640,360);if(!reduced){const next=switches.findIndex(t=>Math.abs(time-t)<.4);if(next>=0){c.drawImage(image,next*640,0,640,360,0,0,640,360);c.globalAlpha=Math.max(0,Math.min(1,(time-switches[next]+.4)/.8));c.drawImage(image,(next+1)*640,0,640,360,0,0,640,360);c.globalAlpha=1;}}}
 c.fillStyle='#080d1633';c.fillRect(0,0,640,360);const shade=c.createLinearGradient(0,0,500,0);shade.addColorStop(0,'#080d16d9');shade.addColorStop(1,'#080d1600');c.fillStyle=shade;c.fillRect(0,0,640,360);
 c.font='14px Galmuri11, sans-serif';c.textBaseline='top';c.lineWidth=2;c.strokeStyle='#080d16';c.fillStyle='#ebe1ca';let offset=0;
 for(let i=0;i<4;i++){for(let j=0;j<STORY_PARAGRAPHS[i].length;j++){const y=reduced?100+j*24:storyScroll(time)+offset+j*24;if(reduced&&i!==frame||y<25||y>318)continue;c.globalAlpha=reduced?1:Math.min(1,(y-25)/20,(318-y)/20);const text=STORY_PARAGRAPHS[i][j];c.strokeText(text,52,y);c.fillText(text,52,y);}offset+=STORY_PARAGRAPHS[i].length*24+32;}
 c.globalAlpha=1;if(!reduced&&time<.5){c.fillStyle=`rgba(8,13,22,${1-time/.5})`;c.fillRect(0,0,640,360);}host.dataset.storyFrame=String(frame);
 };
}
