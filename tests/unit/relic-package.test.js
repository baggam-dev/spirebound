import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {relics,grantRelic,removeRelic,offerRelics,claimRelic,directRelicFactor,utilityCooldown,hasRelic} from '../../src/progression/relics.js';
import {reactToRelicHit} from '../../src/combat/relic-effects.js';
import {castUtility} from '../../src/combat/utility.js';
import {tickPassives} from '../../src/progression/passives.js';
import {tickFairyKing} from '../../src/combat/fairy-king.js';
import {relicIconIds} from '../../src/rendering/relic-icons.js';
import {relicMarkup} from '../../src/ui/hud.js';
import {relicSelectionMarkup,createRelicBanner} from '../../src/ui/relic-ui.js';
import {relicPreview} from '../../src/ui/relic-preview.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
function setup(){const s=newRun(31),r=currentRoom(s);s.tutorialComplete=true;s.entryGrace=0;s.attack=999;s.invulnerable=0;r.obstacles=[];r.enemies=[];return {s,r,p:s.player};}
const target=(x=530,y=300)=>({id:0,type:'archer',x,y,hp:100,max:100,cd:999,tier:0});

test('37 relic IDs share one icon mapping; new rarity keeps existing uniques and excludes fairy offers',()=>{
 assert.equal(relics.length,37);assert.deepEqual(new Set(relicIconIds),new Set(relics.map(r=>r.id)));assert.equal(relics.filter(r=>r.grade==='rare').length,1);assert.equal(relics.filter(r=>r.grade==='unique').length,6);
 const {s,r,p}=setup();for(const id of relics.map(r=>r.id).filter(id=>id!=='phoenixReliquary'&&!id.endsWith('Fairy')))grantRelic(p,id);
 offerRelics(s,r);assert.deepEqual(r.relicOffers,['phoenixReliquary']);r.used=true;assert.equal(claimRelic(s,'phoenixReliquary'),true);assert.equal(claimRelic(s,'phoenixReliquary'),false);
 assert.doesNotThrow(()=>encodeSave(s));
});

test('whetstone affects full-HP arrow direct hits only, not non-arrow effects or injured targets',()=>{
 const {p}=setup(),e=target();const before=directRelicFactor(p,e,true);grantRelic(p,'openingWhetstone');assert.equal(directRelicFactor(p,e,true),before*1.2);assert.equal(directRelicFactor(p,e),before);e.hp--;assert.equal(directRelicFactor(p,e,true),before);
});

test('thorn retaliation respects walls, airborne targets and cooldown without spending the phoenix',()=>{
 const {s,r,p}=setup();grantRelic(p,'thornBuckle');grantRelic(p,'phoenixReliquary');p.x=480;p.y=300;r.enemies=[target(510),{...target(450),id:1},{...target(480,330),id:2,phase:'air'}];r.obstacles=[{x:490,y:250,w:10,h:100,type:'wall'}];p.hp=3;
 reactToRelicHit(s,r);assert.equal(r.enemies[0].hp,100);assert.ok(r.enemies[1].hp<100);assert.equal(r.enemies[2].hp,100);const hp=r.enemies[1].hp;reactToRelicHit(s,r);assert.equal(r.enemies[1].hp,hp);assert.equal(s.phoenixSpent,undefined);assert.equal(s.thornCooldown,2);
});

test('lethal contact revives before death, records actual HP loss, persists spend across trade and reload',()=>{
 const {s,r,p}=setup();grantRelic(p,'phoenixReliquary');p.x=480;p.y=300;p.hp=1;r.enemies=[target(480)];const result=stepRun(s,.01);
 assert.ok(result.events.includes('phoenixRevived'));assert.equal(result.events.includes('dead'),false);assert.equal(p.hp,2);assert.equal(s.invulnerable,1.5);assert.equal(s.metrics.damageTaken,1);
 const copy=parseSave(encodeSave(s));assert.equal(copy.phoenixSpent,true);removeRelic(copy.player,'phoenixReliquary');grantRelic(copy.player,'phoenixReliquary');copy.player.hp=0;assert.equal(reactToRelicHit(copy,currentRoom(copy)),false);assert.equal(copy.player.hp,0);
});

test('ritual knot reduces all three utility cooldowns without changing costs, durations or current cooldown',()=>{
 for(const [id,seconds] of [['focus',25],['firstAid',30],['guardian',25]]){const {s,p}=setup();p.utility=id;s.utilityCooldown=0;grantRelic(p,'ritualKnot');assert.equal(utilityCooldown(p),seconds*.85);const before=p.hp;assert.equal(castUtility(s),id);assert.equal(s.utilityCooldown,seconds*.85);if(id==='focus'){assert.equal(p.hp,before-1);assert.equal(p.focusTime,7);}if(id==='guardian')assert.equal(s.guardianTime,10);}
 const {s,p}=setup();s.utilityCooldown=12;grantRelic(p,'ritualKnot');assert.equal(s.utilityCooldown,12);
});

test('fairy whistle multiplies projectiles and king beam once without granting companions',()=>{
 const run=boost=>{const q=setup();q.p.x=480;q.p.y=300;q.r.enemies=[target(600)];q.p.sunFairy=1;q.s.passiveClocks={sunFairy:0};if(boost)grantRelic(q.p,'fairyWhistle');tickPassives(q.s,.01);return q;};
 const a=run(false),b=run(true);assert.ok(Math.abs(b.s.projectiles[0].passiveDamage/a.s.projectiles[0].passiveDamage-1.2)<1e-9);
 for(const q of [a,b]){q.p.fairyKing=1;q.s.fairyKingClock=0;tickFairyKing(q.s,q.r,.01);}assert.ok(Math.abs(b.r.fairyBeam.power/a.r.fairyBeam.power-1.2)<1e-9);
 const {s,p}=setup();grantRelic(p,'fairyWhistle');tickPassives(s,.01);assert.equal(s.projectiles.length,0);assert.equal(p.fairyKing,0);
});

test('HUD caps visible slots with accurate overflow, keeps key and spent state, preview preserves source',()=>{
 const {s,r,p}=setup();for(const id of relics.map(r=>r.id))grantRelic(p,id);const html=relicMarkup(p,true,8,true);assert.equal((html.match(/data-relic-detail=/g)||[]).length,8);assert.ok(html.includes('+31'));assert.ok(html.includes('탈출 열쇠'));assert.ok(relicMarkup({...p,relics:['phoenixReliquary']},false,8,true).includes('소모됨'));
 r.relicOffers=['magnet','ritualKnot','phoenixReliquary'];const before=JSON.stringify(p);const ui=relicSelectionMarkup(s,r);assert.ok(ui.includes('relic0'));assert.ok(ui.includes('skipRelic'));assert.ok(ui.includes('레어'));assert.equal(JSON.stringify(p),before);
 const q=setup(),rows=relicPreview(q.p,'magnet').rows;assert.ok(rows.some(row=>row.label==='XP 흡인 반경'&&row.before===55&&row.after===125));assert.ok(rows.some(row=>row.label==='정수 획득 반경'&&row.before===30&&row.after===100));
});

test('new save flags validate and banner is transient, paused, room-bound and never replayed',()=>{
 const {s,r}=setup();s.phoenixSpent='yes';assert.throws(()=>encodeSave(s));s.phoenixSpent=true;s.thornCooldown=3;assert.throws(()=>encodeSave(s));s.thornCooldown=2;assert.doesNotThrow(()=>encodeSave(s));
 const node={hidden:true,innerHTML:'',classList:{toggle(){}}},banner=createRelicBanner(node);banner.update(s,r,false,false);assert.equal(node.hidden,true);banner.show(s,r,'magnet');banner.update(s,r,false,false);assert.equal(node.hidden,false);banner.update(s,r,true,false);assert.equal(node.hidden,true);banner.update(s,{},false,false);assert.equal(node.hidden,true);banner.update(s,r,false,false);assert.equal(node.hidden,true);
});
