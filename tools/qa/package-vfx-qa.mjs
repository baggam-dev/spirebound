import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href),out=process.argv[2],base=process.env.BASE_URL;
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{for(const reduced of [false,true]){const p=await browser.newPage({viewport:{width:1200,height:760}});p.on('pageerror',e=>errors.push(e.message));await p.route('**/vfx-preview',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));await p.goto(base+'/vfx-preview');
const result=await p.evaluate(async reduced=>{
 const {drawUtilityEffect,drawExpandedUtilityStates,utilityCastEffect}=await import('/src/rendering/utility-effects.js'),{drawTrialSeal}=await import('/src/rendering/trial-seal.js'),{drawEliteCrest}=await import('/src/rendering/elite-crest.js');
 document.body.innerHTML='<canvas width="1200" height="760"></canvas>';const canvas=document.querySelector('canvas'),c=canvas.getContext('2d');c.fillStyle='#181c2a';c.fillRect(0,0,1200,760);
 const ids=['focus','firstAid','guardian','frostWave','thunderSigil','galeVeil'];
 for(let i=0;i<6;i++){const x=190+i%3*400,y=175+Math.floor(i/3)*270,s={elapsed:2,player:{x,y,hp:4,focusTime:i===0?2:0},bloodTime:i===1?2:0,guardianTime:i===2?2:0,guardianCharges:1,galeTime:i===5?2:0,galeCharges:2};
 const before=JSON.stringify(s);c.save();c.beginPath();c.rect(x-180,y-140,360,250);c.clip();c.fillStyle='#8491a7';c.fillRect(x-9,y-34,18,30);
 drawExpandedUtilityStates(c,s,{reduced});const f=utilityCastEffect(s,ids[i]);f.t=f.duration*.72;drawUtilityEffect(c,f,{reduced,player:s.player});c.restore();
 if(JSON.stringify(s)!==before)throw Error('Render changed combat state');c.fillStyle='#ffffff';c.font='16px sans-serif';c.fillText(ids[i],x-60,y+90);
 }
 for(const [i,kind] of ['entry','clear'].entries())drawTrialSeal(c,{x:200+i*350,y:650,kind,elapsed:.35,duration:1},{reduced});
 drawEliteCrest(c,{x:950,y:650,crest:'trial',duration:.6,t:.35},{reduced});
 if(c.globalAlpha!==1||c.getTransform().a!==1)throw Error('Canvas state leaked');return {png:canvas.toDataURL(),immutable:true,reduced};
},reduced);await writeFile(join(out,`vfx-${reduced?'reduced':'normal'}.png`),Buffer.from(result.png.split(',')[1],'base64'));results.push({reduced,immutable:result.immutable});await p.close();}assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({results,errors},null,2));}finally{await browser.close();}
