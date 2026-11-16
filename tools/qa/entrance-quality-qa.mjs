// Real renderer/asset inspection; isolated host, not gameplay balance evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:5173',errors=[],reports=[];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']});
try{
 for(const width of [1280,844])for(const reduced of [false,true]){
  const height=width===1280?720:390,cx=await browser.newContext({viewport:{width,height},isMobile:width===844,hasTouch:width===844,recordVideo:reduced?undefined:{dir:join(out,'video'),size:{width,height}}}),p=await cx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/__entrance-quality',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#08090e"><div id="host" style="width:100vw;height:100vh;position:relative"><canvas class="entrance-canvas" style="width:100%;height:100%;display:block"></canvas><p id="entranceSubtitle" hidden style="position:absolute;bottom:3%;width:100%;text-align:center;color:#eee">돌아갈 길은 닫혔다.</p></div></body>'}));
  await p.goto(base+'/__entrance-quality');
  const assets=await p.evaluate(async reduced=>{
   const {prepareEntranceArt,createEntranceRenderer}=await import('/src/ui/entrance-scene.js'),art=await prepareEntranceArt();if(!art)throw Error('entrance assets failed');
   globalThis.renderEntrance=createEntranceRenderer(document.getElementById('host'),art,{reduced});
   const body=art.walk.map(f=>f.body.toDataURL());return {walk:art.walk.length,actions:art.actions.length,uniqueWalk:new Set(body).size,clearEdges:art.walk.every(f=>f.body.getContext('2d').getImageData(0,0,1,1).data[3]===0)};
  },reduced);assert.equal(assets.walk,8);assert.equal(assets.actions,8);assert.equal(assets.uniqueWalk,8);
  const gallery=await p.evaluate(()=>{
   const samples=[.3,.78,1.44,2.04,2.44,3.22,3.92,4.58,5.25],canvas=document.createElement('canvas');canvas.width=1440;canvas.height=870;const c=canvas.getContext('2d'),source=document.querySelector('.entrance-canvas'),frames=[];
   for(const [i,t] of samples.entries()){renderEntrance(t);const x=i%3*480,y=Math.floor(i/3)*290;c.drawImage(source,x,y,480,270);c.fillStyle='#e5d6b8';c.font='13px monospace';c.fillText(t.toFixed(2)+'s',x+10,y+285);frames.push({time:t,phase:document.getElementById('host').dataset.entrancePhase,frame:document.getElementById('host').dataset.entranceFrame});}
   renderEntrance(2.44);const frozen=source.toDataURL();renderEntrance(2.44);if(source.toDataURL()!==frozen)throw Error('pause changed pixels');return {image:canvas.toDataURL().split(',')[1],frames,pauseStable:true};
  });await writeFile(join(out,`timeline-${width}-${reduced}.png`),Buffer.from(gallery.image,'base64'));
  let animation=null;
  if(!reduced)animation=await p.evaluate(()=>new Promise(resolve=>{const start=performance.now(),walk=new Set();function frame(now){const t=Math.min(5.8,(now-start)/1000);renderEntrance(t);const h=document.getElementById('host');if(h.dataset.entrancePhase==='0')walk.add(h.dataset.entranceFrame);if(t>=5.8)resolve({duration:t,visibleWalkFrames:walk.size});else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
  const video=p.video();await cx.close();if(video)await copyFile(await video.path(),join(out,`entrance-${width}.webm`));
  reports.push({width,reduced,assets,frames:gallery.frames,pauseStable:gallery.pauseStable,animation});
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,errors,isolatedRenderer:true,actualDevice:false},null,2));console.log(JSON.stringify({cases:reports.length,errors}));
}finally{await browser.close();}
