import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const output=process.argv[2];await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/backdrop-preview',route=>route.fulfill({contentType:'text/html',body:'<body style="margin:0"><canvas></canvas></body>'}));await page.goto('http://localhost:5174/backdrop-preview');
 const result=[];
 for(const [width,height] of [[1280,800],[844,390],[390,844],[667,375]]){const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174');await page.locator('#bossPractice').click();await page.locator('#practiceBoss').selectOption('king');await page.locator('#rollPractice').click();await page.locator('#launchPractice').click();await page.waitForTimeout(500);result.push(await page.evaluate(()=>{const n=document.querySelector('#notice'),arena=document.querySelector('#game').getBoundingClientRect(),stats=document.querySelector('#statReadout');n.textContent='방 클리어 · 물약 획득 2개 · 정수 획득 1개 · 바닥 정수 3개 · 유물 선택 가능';const box=n.getBoundingClientRect(),style=getComputedStyle(n),statStyle=getComputedStyle(stats);if(box.top<arena.top+arena.height*.6||box.bottom>arena.bottom||statStyle.textAlign!=='right'||style.pointerEvents!=='none')throw Error('HUD alignment failed');return {width:innerWidth,noticeTop:(box.top-arena.top)/arena.height,background:style.backgroundColor,statsRight:stats.getBoundingClientRect().right,expectedRight:arena.right-arena.width*22/960};}));await page.screenshot({path:join(output,`${width}x${height}.png`)});await context.close();}
 console.log(JSON.stringify({result,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
