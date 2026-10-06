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
   const {enemyHitEffects,drawEnemyFeedback,drawBossHealthLoss}=await import('/src/rendering/enemy-feedback.js');
   const canvas=document.createElement('canvas');canvas.id='health-loss-gallery';canvas.width=780;canvas.height=300;
   const c=canvas.getContext('2d');c.fillStyle='#243130';c.fillRect(0,0,960,300);
   const ordinary={id:1,type:'archer',x:175,y:190,hp:75,max:100};
   const boss={id:2,type:'boss',x:480,y:190,hp:900,max:1000};
   const effects=enemyHitEffects(new Map([[ordinary,100],[boss,1000]]),[ordinary,boss]);
   for(const [enemy,effect] of [[ordinary,effects[0]],[boss,effects[1]]]){
    c.fillStyle='#7a9382';c.fillRect(enemy.x-10,enemy.y-18,20,34);
    c.fillStyle='#111b1a';c.fillRect(enemy.x-15,enemy.y+effect.healthOffset,30,3);
    c.fillStyle='#9bb17d';c.fillRect(enemy.x-15,enemy.y+effect.healthOffset,30*effect.afterRatio,3);
    drawEnemyFeedback(c,{...effect,t:.18});
   }
   c.fillStyle='#111b1a';c.fillRect(280,27,400,7);c.fillStyle='#b67864';c.fillRect(280,27,360,7);
   drawBossHealthLoss(c,effects,boss);
   c.font='14px monospace';c.fillStyle='#d4d9c8';c.fillText('ORDINARY 100 → 75',75,253);c.fillText('FIRST BOSS 1000 → 900',385,253);
   canvas.style.cssText='position:fixed;left:0;top:0;z-index:9999;width:780px;height:300px';document.body.append(canvas);
   const p=c.getImageData(640,27,4,7).data;
   return {effects:effects.length,localChip:effects[0].beforeRatio>effects[0].afterRatio,globalChip:p[0]>170&&p[1]>160};
  });
  assert.deepEqual(probe,{effects:2,localChip:true,globalChip:true});
  if(output)await page.locator('#health-loss-gallery').screenshot({path:join(output,`health-loss-${label}.png`)});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:2,healthLossVisible:true,pageErrors:0}));
}finally{await browser.close();}
