import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {notifyHeroShot,clearHeroShots,heroShotRecoil,heroShotProjectile} from '../../src/rendering/pixel-world.js';
import {heroFrameIndex} from '../../src/rendering/hero-sprite.js';
test('actual primary and delayed repeat releases show separate hero release poses',()=>{
 const s=newRun(42),r=currentRoom(s);s.player.repeat=1;s.invulnerable=999;r.obstacles=[];
 r.enemies=[{id:1,type:'chaser',x:800,y:300,hp:10000,max:10000,frozen:999,cd:999}];
 const tick=dt=>{const result=stepRun(s,dt);if(result.events.includes('shot')||result.events.includes('repeatShot'))notifyHeroShot(s.player,s.elapsed);return result;};
 assert.ok(tick(.01).events.includes('shot'));assert.equal(heroFrameIndex({recoil:heroShotRecoil(s.player,s.elapsed)}),3);
 assert.equal(tick(.12).events.includes('repeatShot'),false);assert.equal(heroFrameIndex({recoil:heroShotRecoil(s.player,s.elapsed)}),0);
 assert.ok(tick(.04).events.includes('repeatShot'));assert.equal(heroFrameIndex({recoil:heroShotRecoil(s.player,s.elapsed)}),3);
 clearHeroShots(s.player);
});
test('release observation is view-only, stable on pause and absent after reset or load',()=>{
 const player=Object.freeze({x:480,y:300}),before=JSON.stringify(player);notifyHeroShot(player,2);
 assert.equal(heroShotRecoil(player,2),1);assert.equal(heroShotRecoil(player,2),1);assert.equal(heroShotRecoil(player,1.9),0);
 assert.equal(heroShotRecoil(JSON.parse(before),2),0);assert.equal(JSON.stringify(player),before);
 clearHeroShots(player);assert.equal(heroShotRecoil(player,2),0);
});
test('hero facing selects its own released arrow and ignores turrets, passives and delayed or seeking arrows',()=>{
 const own={vx:420,vy:0,life:3},run={projectiles:[own,{turretShot:true,life:3},{passive:'turret',life:3},{seeker:true,life:3},{delay:.1,life:3}]};
 assert.equal(heroShotProjectile(run),own);const repeat={vx:-420,vy:0,delay:0,life:2.99};run.projectiles.push(repeat);assert.equal(heroShotProjectile(run),repeat);
 assert.equal(heroShotProjectile({projectiles:[{enemy:true,life:3}]}),undefined);
});
