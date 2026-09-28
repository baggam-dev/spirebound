import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import net from 'node:net';
import assert from 'node:assert/strict';
import {createServer} from '../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const python=process.env.PYTHON||join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const output=process.argv[2];await mkdir(output,{recursive:true});const temp=await mkdtemp(join(tmpdir(),'spirebound-online-qa-')),database=join(temp,'ranking.sqlite3');
const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const apiPort=probe.address().port;await new Promise(r=>probe.close(r));
const server=createServer(resolve('.'),apiPort);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const config=join(temp,'config.json');await writeFile(config,JSON.stringify({season:'BETA-1',open:true,versions:['0.31.0-prebeta'],origins:[base],blockedNames:['admin','운영자']}));
const backend=spawn(python,['-B','api/ranking_api.py','--database',database,'--config',config,'--port',String(apiPort)],{stdio:'pipe'});let backendErrors='';backend.stderr.on('data',data=>backendErrors+=data);
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 let ready=false;for(let i=0;i<40;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,backendErrors);
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.evaluate(()=>{const r=document.querySelector('.title-content').getBoundingClientRect();if(r.bottom>innerHeight||r.right>innerWidth)throw Error('Title overflow');});await page.locator('#rank').click();await page.locator('#rankBack').click();
  await page.locator('#start').click();await page.waitForFunction(()=>!!localStorage.getItem('spirebound.run.v1'));
  await page.reload();const runId=await page.evaluate(async()=>{const {parseSave,encodeSave,SAVE_KEY}=await import('/storage.js'),{objectPoint}=await import('/object-positions.js');const s=parseSave(localStorage.getItem(SAVE_KEY));if(!s.ranking.online)throw Error('No online registration');s.key=true;s.elapsed=1200;s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;s.ranking.visited=Array.from({length:8},(_,i)=>i+':0');s.ranking.defeated=Array.from({length:180},(_,i)=>i);s.ranking.nextEnemyId=180;Object.assign(s.player,objectPoint(s.floors[0][0]));localStorage.setItem(SAVE_KEY,encodeSave(s));return s.runId;});
  const shifted=spawnSync(python,['-B','-c',"import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute('UPDATE runs SET started_ms=started_ms-1800000 WHERE id=?',(sys.argv[2],)); db.commit(); db.close()",database,runId],{encoding:'utf8'});assert.equal(shifted.status,0,shifted.stderr);
  await page.reload();await page.locator('#continue').click();await page.locator('#interact').click();await page.locator('#rankRegister').click();await page.locator('#rankName').fill('Admin1');await page.locator('#rankSubmit').click();await page.getByText('사용할 수 없는 이름입니다.',{exact:false}).waitFor();
  await page.locator('#rankName').fill('모험가_'+width);
  // Drop an already accepted response: reload and retry must return the same receipt.
  let dropped=false;await page.route('**/api/records',async route=>{if(!dropped){dropped=true;await route.fetch();await route.abort('failed');}else await route.continue();});
  await page.locator('#rankSubmit').click();await page.getByText('서버에 연결하지 못했습니다.',{exact:false}).waitFor();await page.reload();await page.locator('#rank').click();await page.locator('[data-draft="0"]').click();assert.equal(await page.locator('#rankName').inputValue(),'모험가_'+width);await page.locator('#rankSubmit').click();await page.getByText('등록 완료 ·',{exact:false}).waitFor();
  await page.screenshot({path:join(output,`registered-${width}.png`)});await page.locator('#rankViewBoard').click();await page.locator('.rank-mine').first().waitFor();await page.screenshot({path:join(output,`rank-${width}.png`)});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.locator('.rank-personal').getByText('모험가_'+width,{exact:false}).count(),1);await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.route('**/api/session',route=>route.abort('failed'));await page.locator('#start').click();await page.locator('#rankStartLocal').waitFor();await page.locator('#rankStartLocal').click();await page.waitForFunction(()=>!!localStorage.getItem('spirebound.run.v1'));assert.equal(await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).ranking.online),undefined);
 await page.reload();await page.route('**/api/rankings?*',route=>route.abort('failed'));await page.locator('#rank').click();await page.locator('#rankBoard[role="alert"]').waitFor();await page.locator('#rankBack').click();await page.locator('.title-art').waitFor();await context.close();
 const longContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),longPage=await longContext.newPage();longPage.on('pageerror',e=>errors.push(e.message));await longPage.goto(base);
 await longPage.route('**/api/rankings?*',route=>route.fulfill({json:{seasonId:'BETA-1',open:true,mine:null,entries:Array.from({length:100},(_,i)=>({rank:i+1,recordId:String(i),nickname:i===0?'<img src=x onerror=alert(1)>':'가나다라마바사아자차카타',score:20000-i,elapsedMs:1200000,mainSkill:'fire'}))}}));await longPage.locator('#rank').click();await longPage.locator('.rank-row').last().scrollIntoViewIfNeeded();assert.equal(await longPage.locator('.rank-row').count(),100);assert.equal(await longPage.locator('#rankBoard img').count(),0);assert.equal(await longPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await longContext.close();
 console.log(JSON.stringify({viewports:3,scenarios:['registration','nickname rejection','lost response','reload retry','my rank','offline start','query failure'],errors}));assert.equal(errors.length,0);
}finally{await browser.close();backend.kill();await new Promise(r=>server.close(r));}
