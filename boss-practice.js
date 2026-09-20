import {newRun,currentRoom} from './engine.js';
import {skills,applySkill} from './progression.js';
import {mainSkills} from './skill-tree.js';
import {evolutions,pendingEvolution,chooseEvolution} from './evolutions.js';
import {relics,grantRelic,weightedRelic} from './relics.js';
import {essences,collectEssences} from './essences.js';
import {seededRandom} from './random.js';
import {challengeKing} from './upper-floors.js';
export const practiceBosses=[{id:'warden',floor:1,name:'2층 수호자'},{id:'prism',floor:3,name:'4층 프리즘'},{id:'slime',floor:5,name:'6층 슬라임 군체'},{id:'gate',floor:6,name:'왕 문지기 · 칼드와 베라'},{id:'king',floor:7,name:'모르도'}];
export function createPractice(bossId,main,seed=Math.floor(Math.random()*4294967296)){
 const boss=practiceBosses.find(b=>b.id===bossId);if(!boss||!mainSkills.includes(main))throw Error('잘못된 테스트 설정');
 const s=newRun(seed),p=s.player,random=seededRandom(seed^0x46a513);s.practice={boss:bossId,main,seed};s.floor=boss.floor;s.room=s.floors[s.floor].findIndex(r=>bossId==='gate'?r.gate:r.type==='boss');
 const r=currentRoom(s);p.x=480;p.y=430;p.level=10;for(let i=0;i<3;i++)applySkill(p,main);
 for(let i=0;i<7;i++){const pool=skills.filter(k=>k.tree==='support'&&(p[k.id]||0)<k.max);let roll=random()*pool.reduce((n,k)=>n+k.weight,0),chosen=pool.at(-1);for(const k of pool){roll-=k.weight;if(roll<0){chosen=k;break;}}applySkill(p,chosen.id);}
 let key;while((key=pendingEvolution(p)))chooseEvolution(p,key,evolutions[key][Math.floor(random()*evolutions[key].length)].id);
 const pool=[...relics],count=3+Math.floor(random()*3);for(let i=0;i<count;i++){const relic=weightedRelic(pool,random);grantRelic(p,relic.id);pool.splice(pool.indexOf(relic),1);}
 const essenceCount=3+Math.floor(random()*3);r.essences=Array.from({length:essenceCount},()=>({id:essences[Math.floor(random()*essences.length)].id,x:p.x,y:p.y}));collectEssences(s,{...r,obstacles:[]});r.essences=[];p.hp=p.max;p.potions=3;p.food=0;s.pendingLevels=0;s.levelQueue=[];s.tutorialComplete=true;r.seen=true;
 if(bossId==='king')challengeKing(s);s.entryGrace=1;return s;
}
export function practiceCleared(s){return !!s.practice&&!currentRoom(s).enemies.some(e=>e.hp>0&&!e.summoned);}
