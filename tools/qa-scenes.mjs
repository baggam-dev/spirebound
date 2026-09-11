// Isolated browser fixtures. This process never serves on the player's port 5173.
import http from 'node:http';
import {createServer} from '../server.js';
const game=createServer(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
http.createServer((req,res)=>{
 if(req.url.startsWith('/qa')){
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
  const scene=new URL(req.url,'http://localhost').searchParams.get('scene');
  if(!['tutorial','trialReward','chestBoss','grades','tree','frozen','fire','toxin','trial','slime','split','flower','escape','prism','treasure','event','evolution','route','relic','journal','result'].includes(scene)){res.end('<h1>Isolated QA scenes</h1>'+['tutorial','trialReward','chestBoss','grades','tree','frozen','fire','toxin','trial','slime','split','flower','escape','prism','treasure','event','evolution','route','relic','journal','result'].map(s=>`<p><a href="/qa?scene=${s}">${s}</a></p>`).join(''));return;}
  res.end(`<script type="module">
  import {newRun,currentRoom,enrage,bossDefeated} from '/engine.js';import {encodeSave,SAVE_KEY} from '/storage.js';import {splitSlime} from '/poison.js';
  const s=newRun(917),scene=${JSON.stringify(scene)};s.floor=scene==='prism'?3:5;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');
  if(scene==='escape'){enrage(s);s.floor=0;s.room=0;}
  if(scene==='flower')s.room=s.floors[5].findIndex(r=>r.enemies.some(e=>e.type==='flower'));
  if(['treasure','event'].includes(scene)){s.floor=scene==='event'?2:0;s.room=s.floors[s.floor].findIndex(r=>r.type===scene);currentRoom(s).enemies=[];}
  if(['tutorial','trialReward','chestBoss','grades','tree','frozen','fire','toxin','trial'].includes(scene)){s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='event');currentRoom(s).enemies=[];}
  if(scene==='tutorial'){s.floor=0;s.room=1;}
  if(scene==='trialReward'){s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='event');Object.assign(currentRoom(s),{used:true,enemies:[],trialState:'reward'});}
  if(scene==='chestBoss'){s.floor=0;s.room=3;currentRoom(s).enemies=[];currentRoom(s).chestReward={id:'boss',boss:'prism'};}
  if(scene==='tree'){s.pendingLevels=1;}
  if(scene==='evolution')s.player.chain=3;
  if(scene==='route'){enrage(s);s.floor=0;s.floors[0].forEach(r=>r.seen=true);s.room=s.floors[0].findIndex(r=>r.type==='up');}
  if(scene==='relic'){s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');currentRoom(s).enemies=[];s.player.armor=2;s.player.fire=1;bossDefeated(s);}
  if(scene==='result'){s.floor=0;s.room=0;}
  const r=currentRoom(s);r.seen=true;s.player.x=480;s.player.y=360;s.player.max=10;s.player.hp=10;s.attack=999;s.invulnerable=999;
  if(['treasure','event','relic','trialReward','chestBoss'].includes(scene))s.player.y=115;
  if(scene==='result'){s.player.hp=1;s.invulnerable=0;s.projectiles=[{x:470,y:360,vx:300,vy:0,enemy:true,hit:[],life:2,source:'시험 사수 탄환'}];}
  if(scene==='split'){const e=r.enemies.shift();r.nextEnemyId=1;splitSlime(e,r);}
  r.enemies.forEach(e=>e.cd=0);
  if(scene==='trial'){const {chooseEvent}=await import('/adventures.js');chooseEvent(s,'trial');s.attack=999;}
  if(['fire','toxin'].includes(scene)){r.obstacles=[];s.attack=0;s.player.fire=scene==='fire'?3:0;s.player.poison=scene==='toxin'?3:0;s.player.evolutions={fire:'ember',poison:'ember'};r.enemies=Array.from({length:7},(_,i)=>({id:i,type:'archer',x:420+(i%3)*46,y:160+Math.floor(i/3)*50,hp:20000,max:20000,cd:999,balanceVersion:1}));}
  if(scene==='frozen'){r.obstacles=[];s.player.mainSkill='frost';s.player.evolutions={ultimate:'burst'};s.player.frost=2;s.player.repeat=1;s.player.homing=1;s.player.aura=1;s.attack=0;r.enemies=[{id:0,type:'archer',x:520,y:310,hp:20000,max:20000,cd:999,balanceVersion:1}];}
  if(scene==='grades'){s.player.mainSkill='frost';s.player.frost=1;s.pendingLevels=1;s.choices=['frost','split','homing'];r.enemies=[];}
  localStorage.removeItem(SAVE_KEY+'.ended');localStorage.setItem(SAVE_KEY,encodeSave(s));location.replace('/');
  </script>`);return;
 }
 game.emit('request',req,res);
}).listen(5193,'127.0.0.1',()=>console.log('QA only: http://localhost:5193/qa'));

