import {utilitySkills,chooseUtility} from '../combat/utility.js';
import {utilityAvailable} from './skill-overhaul.js';
import {seededRandom} from '../game/random.js';

export function prepareUtilityDraft(s){
 if(s.practice||s.status!=='playing'||!utilityAvailable(s))return null;
 if(s.utilityDraft)return s.utilityDraft;
 if(s.player.utility)return null; // Never replace a legacy owned active.
 const pool=utilitySkills.filter(k=>k.id!=='focus'||s.player.max>1).map(k=>k.id);
 if(pool.length<3)return null;
 let seed=(Number(s.seed)||0)^0x6d2b79f5;
 for(const letter of String(s.runId||'legacy'))seed=Math.imul(seed^letter.charCodeAt(0),16777619);
 const random=seededRandom(seed>>>0),offers=[];
 while(offers.length<3)offers.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
 const winner=offers[Math.floor(random()*3)];
 s.utilityDraft={version:1,offers,winner,status:'prepared'};return s.utilityDraft;
}
export function revealUtilityDraft(s){
 const q=s.utilityDraft;if(s.practice||s.status!=='playing'||!q||!utilityAvailable(s))return false;
 if(q.status==='revealed')return true;
 if(q.status!=='prepared'||s.player.utility)return false;
 q.status='revealed';return true;
}
export function claimUtilityDraft(s){
 const q=s.utilityDraft;if(s.practice||s.status!=='playing'||!q||!utilityAvailable(s))return false;
 if(q.status==='claimed')return s.player.utility===q.winner; // Retrying a write cannot reset cooldowns.
 if(q.status!=='revealed'||s.player.utility||!q.offers.includes(q.winner))return false;
 if(!chooseUtility(s,q.winner,{reward:true}))return false;
 q.status='claimed';return true;
}
