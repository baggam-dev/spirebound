import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href),out=process.argv[2];await mkdir(out,{recursive:true});
const base='https://168.107.21.43',old='http://168.107.21.43';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable,HttpsFirstModeV2']}),errors=[],results=[];
try{for(const existing of [false,true]){
 const cx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),source=await cx.newPage();source.setDefaultTimeout(90000);source.on('pageerror',e=>errors.push(e.message));
 if(existing){await source.goto(base+'/upgrade.html');await source.evaluate(()=>localStorage.setItem('spirebound.run.v1','secure run'));}
 const raw=await cx.request.get(old+'/',{maxRedirects:0});assert.equal(raw.status(),200);assert.match(await raw.text(),/id="transfer"/);
 await source.goto(old+'/');
 const diagnostic=await source.evaluate(()=>({url:location.href,title:document.title,transfer:!!document.querySelector('#transfer'),hidden:document.querySelector('#transfer')?.hidden,body:document.body.innerText.slice(0,300)}));console.log(JSON.stringify({existing,diagnostic}));
 await writeFile(join(out,`diagnostic-${existing}.json`),JSON.stringify(diagnostic,null,2));await source.screenshot({path:join(out,`source-${existing}.png`)});
 await source.locator('#transfer').waitFor();
 await source.evaluate(()=>{localStorage.setItem('spirebound.run.v1','old run');localStorage.setItem('spirebound.run.v1.backup','old backup');localStorage.setItem('spirebound.history','[]');localStorage.setItem('spirebound.active-tab','must not transfer');});
 const popup=source.waitForEvent('popup');await source.locator('#transfer').click();const target=await popup;target.on('pageerror',e=>errors.push(e.message));await source.getByText('옮기기가 완료되었습니다.',{exact:false}).waitFor();
 assert.equal(await target.evaluate(()=>localStorage.getItem('spirebound.run.v1')),existing?'secure run':'old run');assert.equal(await target.evaluate(()=>localStorage.getItem('spirebound.active-tab')),null);assert.equal(await source.evaluate(()=>localStorage.getItem('spirebound.run.v1')),'old run');assert.equal(await target.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('spirebound.http-backup.'))),true);
 results.push({existing,originalPreserved:true,securePreserved:true,backup:true});await cx.close();
 }assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
