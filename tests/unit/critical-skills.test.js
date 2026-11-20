import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,advanceClock,currentRoom} from '../../src/game/engine.js';
import {skills,applySkill,levelChoices,migrateRun,hitEnemy} from '../../src/progression/progression.js';
import {allowedSkill,skillGrade} from '../../src/progression/skill-tree.js';
import {criticalSkills,tickCriticalSkills} from '../../src/progression/critical-skills.js';
import {criticalStats,applyPlayerDamage,createDamagePacket} from '../../src/combat/critical.js';
import {castRoll} from '../../src/combat/roll.js';
import {castUltimate,tickRain} from '../../src/combat/abilities.js';
import {weaponSnapshot} from '../../src/combat/weapon-projectiles.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {skillPreview} from '../../src/ui/skill-preview.js';
import {draftMarkup} from '../../src/ui/skill-draft.js';
import {skillIconMarkup} from '../../src/rendering/skill-icons.js';
import {drawCriticalSkillStates} from '../../src/rendering/critical-skill-states.js';

function scene(){const s=newRun(73),r=currentRoom(s);r.obstacles=[];r.enemies=[{id:0,x:500,y:300,hp:10000,max:10000,type:'chaser',cd:20,balanceVersion:1}];Object.assign(s.player,{level:12,mainSkill:'fire',fire:1});return {s,p:s.player,r,e:r.enemies[0]};}
function crit(s,e,options={}){s.critical.randomState=0;return applyPlayerDamage(s,e,100,options);}
test('six supports use existing rarity, gated acquisition and exact level caps',()=>{
 const {p}=scene();p.level=2;for(const k of criticalSkills)assert.equal(allowedSkill(p,k.id),false);
 p.level=3;assert.equal(applySkill(p,'keenEye'),true);assert.equal(applySkill(p,'fractureMark'),false);
 p.level=5;assert.equal(applySkill(p,'fractureMark'),true);assert.equal(applySkill(p,'evasiveFocus'),true);
 p.level=8;assert.equal(applySkill(p,'decisiveMoment'),false);applySkill(p,'keenEye');assert.equal(applySkill(p,'decisiveMoment'),true);assert.equal(applySkill(p,'decisiveMoment'),false);
 assert.equal(applySkill(p,'royalJudgment'),false);p.ultimate=1;assert.equal(applySkill(p,'royalJudgment'),true);
 for(const k of criticalSkills){assert.equal(skillGrade(k.id),k.grade);while(applySkill(p,k.id)){}assert.equal(p[k.id],k.max);}
});
test('chance and multiplier investment, decisive tradeoff, cap and summon snapshots agree',()=>{
 const {p}=scene();Object.assign(p,{keenEye:3,criticalTraining:3});assert.ok(Math.abs(criticalStats(p).chance-.17)<1e-9);assert.equal(criticalStats(p).multiplier,1.95);
 const w=weaponSnapshot(p);p.decisiveMoment=1;assert.ok(Math.abs(criticalStats(p).chance-.12)<1e-9);assert.equal(criticalStats(p).multiplier,2.4);
 p.keenEye=0;assert.ok(Math.abs(criticalStats(w).chance-.17)<1e-9);assert.equal(criticalStats(w).multiplier,1.95);
 p.critMultiplier=2.5;assert.equal(criticalStats(p).multiplier,2.5);
 const rows=skillPreview({...p,decisiveMoment:0},'decisiveMoment');assert.ok(rows.some(r=>r.label==='치명타 확률'));assert.ok(rows.every(r=>r.label!=='첫 적중 피해¹'));
});
test('fracture applies only to later attacks and never stacks or buffs its own components',()=>{
 const {s,p,e,r}=scene();p.critChance=.5;p.fractureMark=1;const packet=createDamagePacket();crit(s,e,{packet});
 const before=e.hp;applyPlayerDamage(s,e,100,{packet});assert.equal(before-e.hp,150);assert.equal(e.critMarkPower,.05);
 p.critChance=0;const hp=e.hp;applyPlayerDamage(s,e,100);assert.equal(hp-e.hp,105);tickCriticalSkills(s,r,2);assert.equal(e.critMarkTime,0);
 const after=e.hp;applyPlayerDamage(s,e,100);assert.equal(after-e.hp,100);
});
test('only successful rolls activate focus, pause freezes it and cooldown prevents refresh',()=>{
 const {s,p,r}=scene();p.evasiveFocus=2;s.dodge=1;assert.equal(castRoll(s,{x:1,y:0}),false);assert.equal(p.critFocusTime,undefined);
 s.dodge=0;assert.equal(castRoll(s,{x:1,y:0}),true);assert.equal(p.critFocusTime,3);assert.equal(s.roll.criticalProfile.critChance,.2);
 const w=weaponSnapshot(p);advanceClock(s,2,true);assert.equal(p.critFocusTime,3);advanceClock(s,2,false);assert.equal(p.critFocusTime,1);
 delete s.roll;s.dodge=0;castRoll(s,{x:1,y:0});assert.equal(p.critFocusTime,1);advanceClock(s,2,false);assert.equal(criticalStats(p).chance,.05);assert.equal(criticalStats(w).chance,.2);
 r.obstacles=[];
});
test('judgment counts throttled new critical contacts, excluding DOT, derived damage and empowered sources',()=>{
 const {s,p,e}=scene();p.critChance=.5;p.royalJudgment=1;const packet=createDamagePacket();crit(s,e,{packet});crit(s,e,{packet});crit(s,e);assert.equal(s.critical.royalCharges,1);
 s.elapsed=1;crit(s,e,{procDepth:1});assert.equal(s.critical.royalCharges,1);
 crit(s,e,{player:{critChance:.5,critMultiplier:1.5,judgmentEmpowered:true}});assert.equal(s.critical.royalCharges,1);
 crit(s,e);assert.equal(s.critical.royalCharges,2);
});
test('ready judgment survives failed cast and empowers the full rain without self-recharging',()=>{
 const {s,p,e,r}=scene();Object.assign(p,{royalJudgment:1,ultimate:1,critChance:0});p.evolutions={ultimate:'burst'};s.critical.royalCharges=8;s.skill=1;
 assert.equal(castUltimate(s),false);assert.equal(s.critical.royalCharges,8);s.skill=0;
 assert.equal(castUltimate(s),true);assert.equal(s.critical.royalCharges,0);assert.equal(r.arrowRain.damage,106.25);assert.equal(r.arrowRain.criticalProfile.judgmentEmpowered,true);
 r.arrowRain.criticalProfile.critChance=.5;s.critical.randomState=0;s.elapsed=2;tickRain(s,1.8);assert.equal(s.critical.royalCharges,0);assert.ok(e.hp<10000-106.25*6);
});
test('empowered crossbow snapshots retain bonus and block charging after future player growth',()=>{
 const {s,p,r,e}=scene();Object.assign(p,{royalJudgment:1,ultimate:1,keenEye:3});p.evolutions={ultimate:'turret'};s.critical.royalCharges=8;
 castUltimate(s);const w=r.turrets[0].build;assert.equal(w.damage,21.25);assert.equal(w.judgmentEmpowered,true);assert.ok(Math.abs(criticalStats(w).chance-.17)<1e-9);
 p.keenEye=0;assert.ok(Math.abs(criticalStats(w).chance-.17)<1e-9);assert.ok(parseSave(encodeSave(s)));
 w.critChance=.5;s.critical.randomState=0;s.elapsed=2;hitEnemy(w,e,r.enemies,[],1,true,r,w,{primary:false});assert.equal(s.critical.royalCharges,0);
 s.skill=0;s.critical.royalCharges=8;p.damage=10000;castUltimate(s);assert.equal(r.turrets.at(-1).build.damage,12500);assert.ok(parseSave(encodeSave(s)));
});
test('save restores marks focus and charge; malformed skill levels and proc state are rejected',()=>{
 const {s,p,e}=scene();Object.assign(p,{keenEye:1,fractureMark:1,royalJudgment:1,critChance:.5,critFocusTime:2,critFocusCooldown:7});crit(s,e);
 const loaded=parseSave(encodeSave(s));assert.equal(currentRoom(loaded).enemies[0].critMarkTime,2);assert.equal(loaded.player.critFocusTime,2);assert.equal(loaded.critical.royalCharges,1);
 for(const mutate of [v=>v.player.keenEye=4,v=>v.player.critFocusTime=4,v=>v.critical.royalCharges=9,v=>currentRoom(v).enemies[0].critMarkAttack=999]){const broken=structuredClone(s);mutate(broken);assert.throws(()=>encodeSave(broken));}
 const old=structuredClone(s);for(const k of criticalSkills)delete old.player[k.id];const random=old.critical.randomState;migrateRun(old);assert.equal(old.critical.randomState,random);assert.ok(criticalSkills.every(k=>old.player[k.id]===0));
});
test('draft retains main-linked reservation and new skills have distinct medallions and clear descriptions',()=>{
 const {s,p}=scene();p.keenEye=2;p.ultimate=1;s.pendingLevels=1;s.levelQueue=[12];const choices=levelChoices(s,()=>.999,true);assert.equal(choices.length,3);assert.ok(choices.some(k=>k.id==='fire'||k.main==='fire'));
 const newChoices=criticalSkills.map(k=>skills.find(n=>n.id===k.id));const icons=new Set();
 for(const k of newChoices){const html=skillIconMarkup(k.id);icons.add(html);assert.match(html,/data-critical-icon/);assert.ok(skillPreview(p,k.id).length||p[k.id]>=k.max);}
 assert.equal(icons.size,6);assert.match(draftMarkup(s,newChoices.slice(3)),/치명타 확률|치명타 연계/);
});
test('detached status drawing is deterministic and does not alter saved combat state',()=>{
 const {s,p,e,r}=scene();p.critFocusTime=2;p.royalJudgment=1;s.critical.royalCharges=8;e.critMarkTime=2;const before=JSON.stringify(s),calls=[];
 const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});drawCriticalSkillStates(c,s,r,true);assert.ok(calls.some(c=>c[0]==='stroke'));assert.ok(calls.some(c=>c[0]==='fill'));assert.equal(JSON.stringify(s),before);
});
