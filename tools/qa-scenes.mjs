// Isolated browser fixtures. This process never serves on the player's port 5173.
import http from 'node:http';
import {createServer} from '../server.js';
const game=createServer(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
http.createServer((req,res)=>{
 if(req.url.startsWith('/qa')){
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
  const scene=new URL(req.url,'http://localhost').searchParams.get('scene');
  if(!['lightning28','growth26','gate25','key25','exit25','theme25','silhouettes24','telegraphs24','king24','king23','throne23','upper23','level21','turret21','rain21','bossClear','combo20','hud19','shrine19','feedback18','tutorial','trialReward','chestBoss','grades','tree','frozen','fire','toxin','trial','slime','split','flower','escape','prism','treasure','event','evolution','route','relic','journal','result'].includes(scene)){res.end('<h1>Isolated QA scenes</h1>'+['lightning28','growth26','gate25','key25','exit25','theme25','silhouettes24','telegraphs24','king24','king23','throne23','upper23','level21','turret21','rain21','bossClear','combo20','hud19','shrine19','feedback18','tutorial','trialReward','chestBoss','grades','tree','frozen','fire','toxin','trial','slime','split','flower','escape','prism','treasure','event','evolution','route','relic','journal','result'].map(s=>`<p><a href="/qa?scene=${s}">${s}</a></p>`).join(''));return;}
  res.end(`<script type="module">
  import {newRun,currentRoom,enrage,bossDefeated} from '/engine.js';import {encodeSave,SAVE_KEY} from '/storage.js';import {splitSlime} from '/poison.js';
  const s=newRun(917),scene=${JSON.stringify(scene)};s.floor=scene==='prism'?3:5;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');
  if(scene==='escape'){enrage(s);s.floor=0;s.room=0;}
  if(scene==='flower')s.room=s.floors[5].findIndex(r=>r.enemies.some(e=>e.type==='flower'));
  if(['treasure','event'].includes(scene)){s.floor=scene==='event'?2:0;s.room=s.floors[s.floor].findIndex(r=>r.type===scene);currentRoom(s).enemies=[];}
  if(['combo20','hud19','shrine19','feedback18','tutorial','trialReward','chestBoss','grades','tree','frozen','fire','toxin','trial'].includes(scene)){s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='event');currentRoom(s).enemies=[];}
  if(scene==='tutorial'){s.floor=0;s.room=1;}
  if(scene==='trialReward'){s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='event');Object.assign(currentRoom(s),{used:true,enemies:[],trialState:'reward'});}
  if(scene==='chestBoss'){s.floor=0;s.room=3;currentRoom(s).enemies=[];currentRoom(s).chestReward={id:'boss',boss:'prism'};}
  if(scene==='tree'){s.pendingLevels=1;}
  if(scene==='evolution')s.player.chain=3;
  if(scene==='route'){enrage(s);s.floor=0;s.floors[0].forEach(r=>r.seen=true);s.room=s.floors[0].findIndex(r=>r.type==='up');}
  if(scene==='relic'){s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');currentRoom(s).enemies=[];s.player.armor=2;s.player.fire=1;bossDefeated(s);}
  if(scene==='result'){s.floor=0;s.room=0;}
  if(scene==='growth26'){const {skills}=await import('/progression.js');s.floor=6;s.room=0;s.player.mainSkill='frost';for(const k of skills)s.player[k.id]=['fire','poison','chain'].includes(k.id)?0:k.max;s.player.evolutions={ultimate:'turret'};s.player.level=30;s.pendingLevels=1;s.levelQueue=[30];currentRoom(s).enemies=[];}
  const r=currentRoom(s);r.seen=true;s.player.x=480;s.player.y=360;s.player.max=10;s.player.hp=10;s.attack=999;s.invulnerable=999;
  if(['treasure','event','relic','trialReward','chestBoss'].includes(scene))s.player.y=115;
  if(scene==='result'){s.player.hp=1;s.invulnerable=0;s.projectiles=[{x:470,y:360,vx:300,vy:0,enemy:true,hit:[],life:2,source:'시험 사수 탄환'}];}
  if(scene==='bossClear'){r.enemies=[{id:0,type:'boss',variant:'slime',stage:2,x:650,y:300,hp:0,max:338,cd:999,tier:5,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18}];}
  if(scene==='split'){const e=r.enemies.shift();r.nextEnemyId=1;splitSlime(e,r);}
  r.enemies.forEach(e=>e.cd=0);
  if(scene==='trial'){const {chooseEvent}=await import('/adventures.js');chooseEvent(s,'trial');s.attack=999;}
  if(['fire','toxin'].includes(scene)){r.obstacles=[];s.attack=0;s.player.fire=scene==='fire'?3:0;s.player.poison=scene==='toxin'?3:0;s.player.evolutions={fire:'ember',poison:'ember'};r.enemies=Array.from({length:7},(_,i)=>({id:i,type:'archer',x:420+(i%3)*46,y:160+Math.floor(i/3)*50,hp:20000,max:20000,cd:999,balanceVersion:1}));}
  if(scene==='frozen'){r.obstacles=[];s.player.mainSkill='frost';s.player.evolutions={ultimate:'burst'};s.player.frost=2;s.player.repeat=1;s.player.homing=1;s.player.aura=1;s.attack=0;r.enemies=[{id:0,type:'archer',x:520,y:310,hp:20000,max:20000,cd:999,balanceVersion:1}];}
  if(scene==='grades'){s.player.mainSkill='frost';s.player.frost=1;s.pendingLevels=1;s.choices=['frost','split','homing'];r.enemies=[];}
  if(scene==='feedback18'){s.floor=0;s.room=0;const room=currentRoom(s);room.seen=true;room.obstacles=[];room.enemies=[{id:0,type:'brute',x:650,y:270,hp:9999,max:9999,escapeDepth:3,cd:999,balanceVersion:1},{id:1,type:'flower',x:740,y:370,hp:9999,max:9999,escapeDepth:3,cd:999,balanceVersion:1}];room.essences=['attack','speed','health','haste','ultimate'].map((id,i)=>({id,x:260+i*80,y:170}));s.player.aura=3;s.player.fire=3;s.player.mainSkill='fire';s.player.relics=['rain','blade','boots'];s.player.hp=7;s.player.max=12;s.invulnerable=0;s.attack=999;}
  if(scene==='combo20'){s.floor=0;s.room=s.floors[0].findIndex(r=>r.type==='fountain');Object.assign(currentRoom(s),{hasChest:true,chestUsed:false,used:false,enemies:[],obstacles:[],chestReward:{id:'attack3'}});s.player.x=600;s.player.y=115;s.player.hp=3;}
  if(scene==='hud19'){const {relics}=await import('/relics.js');s.floor=0;s.room=0;Object.assign(currentRoom(s),{seen:true,enemies:[],obstacles:[]});Object.assign(s.player,{essenceCounts:{attack:3,speed:2,health:1,haste:2,ultimate:3},max:12,hp:7,level:8,xp:180,mainSkill:'fire',fire:3,aura:3,split:2,power:1,haste:2,pierce:1,repeat:1,homing:1,relics:relics.map(k=>k.id),evolutions:{fire:'ember',ultimate:'burst'}});}
  if(scene==='shrine19'){const {enterShrine,prepareIncantations}=await import('/shrine.js');s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='shrine');enterShrine(s);currentRoom(s).enemies=[];prepareIncantations(s);currentRoom(s).incantations=['blood','silence'];currentRoom(s).seen=true;}
  if(['level21','turret21','rain21'].includes(scene)){s.floor=0;s.room=0;Object.assign(currentRoom(s),{seen:true,obstacles:[],enemies:[{id:0,type:'archer',x:690,y:270,hp:20000,max:20000,cd:999,balanceVersion:1},{id:1,type:'archer',x:760,y:340,hp:20000,max:20000,cd:999,balanceVersion:1}]});Object.assign(s.player,{level:5,mainSkill:'frost',frost:4,ultimate:scene==='level21'?0:1,relics:['sunFairy','snowFairy','stormFairy','orbitBlades','voidBell','afterimage'],evolutions:{frost:'lasting',...(scene==='level21'?{}:{ultimate:scene==='turret21'?'turret':'burst'})}});s.invulnerable=0;if(scene==='level21'){s.pendingLevels=1;s.levelQueue=[5];currentRoom(s).enemies=[];}else{const {castUltimate}=await import('/abilities.js');castUltimate(s);}}
  if(['king23','throne23','upper23'].includes(scene)){s.floor=scene==='upper23'?6:7;s.room=s.floors[s.floor].findIndex(r=>scene==='upper23'?r.gate:r.type==='boss');currentRoom(s).seen=true;s.player.y=260;if(scene==='king23'){const {challengeKing}=await import('/upper-floors.js');challengeKing(s);currentRoom(s).enemies[0].hp=1800;}s.attack=999;s.invulnerable=999;}
  if(['silhouettes24','telegraphs24','king24'].includes(scene)){const {challengeKing,upperTypes,startUpperAttack}=await import('/upper-floors.js');s.floor=7;s.room=s.floors[7].findIndex(r=>r.type==='boss');const room=currentRoom(s);room.seen=true;room.kingPending=false;room.obstacles=[];s.player.x=480;s.player.y=450;s.attack=999;s.invulnerable=999;if(scene==='king24'){room.kingPending=true;challengeKing(s);room.enemies[0].hp=4500;}else{room.enemies=upperTypes.map((type,i)=>({id:i,type,x:170+(i%4)*185,y:i<4?190:350,hp:1000,max:1000,cd:999,balanceVersion:1}));if(scene==='telegraphs24'){for(const [i,kind] of ['fan','ring','slash','dash'].entries()){const e=room.enemies[i];startUpperAttack(e,kind,{x:e.x+90,y:e.y+90},room);e.frozen=4;}}}}
  if(['lightning28','growth26','gate25','key25','exit25','theme25'].includes(scene)){s.attack=999;s.invulnerable=999;if(scene==='gate25'){const {enterRoom}=await import('/simulation.js');s.floor=6;s.room=s.floors[6].findIndex(r=>r.gate);s.player.x=480;s.player.y=410;enterRoom(s);}if(scene==='theme25'){s.floor=2;s.room=0;currentRoom(s).seen=true;}if(scene==='key25'){s.floor=7;s.room=s.floors[7].findIndex(r=>r.type==='boss');currentRoom(s).enemies=[];currentRoom(s).kingPending=false;bossDefeated(s);}if(scene==='exit25'){enrage(s);s.floor=0;s.room=0;s.player.x=480;s.player.y=115;currentRoom(s).enemies=[];currentRoom(s).seen=true;}}
  if(scene==='lightning28'){s.floor=2;s.room=0;const room=currentRoom(s);room.enemies=Array.from({length:5},(_,i)=>({id:i,type:'archer',x:250+i*100,y:250,hp:9999,max:9999,cd:999,balanceVersion:1}));room.obstacles=[];s.player.mainSkill='chain';s.player.chain=3;s.player.evolutions={chain:'web'};s.attack=999;}
  localStorage.removeItem(SAVE_KEY+'.ended');localStorage.setItem(SAVE_KEY,encodeSave(s));location.replace('/');
  </script>`);return;
 }
 game.emit('request',req,res);
}).listen(Number(process.env.QA_PORT||5193),'127.0.0.1',()=>console.log('QA only: http://localhost:'+(process.env.QA_PORT||5193)+'/qa'));

