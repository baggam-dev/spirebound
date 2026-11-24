// Explicit deployment verification: GET-only, isolated Edge, no score submissions.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=process.argv[2];if(!out)throw Error('Evidence directory required');await mkdir(out,{recursive:true});
const base=process.env.PUBLIC_URL||'https://168.107.21.43',pw=process.env.PLAYWRIGHT_PATH||join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium}=await import(pathToFileURL(join(pw,'index.mjs')).href),browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const context=await browser.newContext(),files=execFileSync('git',['diff','--name-only','012f972','HEAD','--','src','styles','assets','index.html'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
 for(const file of files){const response=await context.request.get(base+'/'+file,{timeout:60000});assert.equal(response.status(),200,file);assert.ok((await response.body()).equals(await readFile(file)),file+' differs from release');}
 const health=await context.request.get(base+'/api/health');assert.equal(health.status(),200);
 for(const viewport of [{width:1280,height:720},{width:844,height:390}]){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport);await page.route('**/api/**',route=>route.request().method()==='POST'?route.abort():route.continue());await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('#rank').waitFor({timeout:120000});await page.waitForFunction(()=>{const img=document.querySelector('.title-logo img');return img?.complete&&img.naturalWidth>0;},{},{timeout:120000});await page.waitForLoadState('networkidle',{timeout:120000});await page.evaluate(async()=>{globalThis.__publicGate=(await import('/src/ui/title-scene.js')).titleArt.gate;});await page.waitForFunction(()=>__publicGate.complete&&__publicGate.naturalWidth>0,null,{timeout:120000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);assert.match(await page.locator('.edition').innerText(),/0\.64/);await page.screenshot({path:join(out,'title-'+viewport.width+'.png')});await page.close();}
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,version:'0.64.0-prebeta',matchedRuntimeFiles:files.length,files,health:await health.json(),errors},null,2));console.log(JSON.stringify({matchedRuntimeFiles:files.length,errors}));await context.close();
}finally{await browser.close();}
