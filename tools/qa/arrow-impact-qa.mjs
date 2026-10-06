import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2];
if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile,label] of [[1280,800,false,'pc'],[844,390,true,'mobile']]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  const probe=await page.evaluate(async()=>{
   const {drawArrowImpact}=await import('/src/rendering/arrow-impact-visuals.js');
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d');
   const effect={arrowImpact:true,x:300,y:270,angle:0,precision:false,t:.15,duration:.2};
   const handled=drawArrowImpact(c,effect);
   const lit=(x,y,w,h)=>{const pixels=c.getImageData(x,y,w,h).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])count++;return count;};
   const result={handled,contact:lit(285,250,40,40),outside:lit(400,250,30,40)};
   const gallery=document.createElement('canvas');gallery.id='gallery';gallery.width=600;gallery.height=230;
   const g=gallery.getContext('2d');g.fillStyle='#202b2b';g.fillRect(0,0,600,230);
   for(let row=0;row<2;row++)for(let column=0;column<3;column++){
    const x=100+column*200,y=65+row*105;
    g.fillStyle='#50605a';g.fillRect(x-25,y+20,50,2);
    drawArrowImpact(g,{arrowImpact:true,x,y,angle:0,precision:!!row,t:[.18,.12,.06][column],duration:.2});
    g.font='12px monospace';g.fillStyle='#d5d9ca';g.fillText(`${row?'precision':'plain'} ${column+1}`,x-52,y+45);
   }
   gallery.style.cssText='position:fixed;left:0;top:0;z-index:9999;width:600px;height:230px';document.body.append(gallery);
   return result;
  });
  assert.equal(probe.handled,true);assert.ok(probe.contact>20);assert.equal(probe.outside,0);
  if(output)await page.locator('#gallery').screenshot({path:join(output,`arrow-impact-${label}.png`)});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:2,contactPixels:true,offTargetPixels:0,pageErrors:0}));
}finally{await browser.close();}
