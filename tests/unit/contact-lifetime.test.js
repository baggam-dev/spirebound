import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFeedback,mergeEnemyFeedback} from '../../src/rendering/enemy-feedback.js';
import {arrowImpactEffect} from '../../src/rendering/arrow-impact-visuals.js';
test('repeat hits update the health-loss range without restarting an existing feedback flash',()=>{
 const previous=Object.freeze({enemyFeedback:'hit',enemyId:1,boss:true,beforeRatio:1,afterRatio:.9,t:.12,duration:.28,x:100,y:100}),fresh=Object.freeze({...previous,beforeRatio:.9,afterRatio:.7,t:.28,x:110});
 const output=mergeEnemyFeedback(Object.freeze([previous]),Object.freeze([fresh]));assert.equal(output.length,1);assert.equal(output[0].beforeRatio,1);assert.equal(output[0].afterRatio,.7);assert.equal(output[0].t,.12);assert.equal(output[0].x,100);assert.equal(previous.afterRatio,.9);assert.equal(fresh.t,.28);
});
test('same-step repeated hits coalesce to the latest health and death still takes precedence',()=>{
 const first={enemyFeedback:'hit',enemyId:1,beforeRatio:1,afterRatio:.8,t:.28,duration:.28},second={...first,beforeRatio:.8,afterRatio:.6};
 const merged=mergeEnemyFeedback([],[first,second]);assert.equal(merged.length,1);assert.equal(merged[0].afterRatio,.6);assert.equal(first.afterRatio,.8);
 const death={enemyFeedback:'death',enemyId:1,t:1};assert.deepEqual(mergeEnemyFeedback(merged,[second,death]),[death]);
 const healedHit={...second,beforeRatio:.95,afterRatio:.85};assert.equal(mergeEnemyFeedback(merged,[healedHit])[0].afterRatio,.85);
});
test('new arrow and slash contacts retain their full first-step impact lifetime',()=>{
 const arrow=arrowImpactEffect({vx:300,vy:0},{x:100,y:200}),slash={slash:true,t:.14},old={text:'old',t:.2};
 const fx=advanceFeedback([old],[arrow,slash],1/60);
 assert.equal(arrow.t,arrow.duration);assert.equal(slash.t,.14);assert.ok(Math.abs(old.t-(.2-1/60))<1e-10);
 assert.ok(fx.includes(arrow)&&fx.includes(slash));
});
test('an expired hit cannot suppress a new contact while a death still replaces its victim hit',()=>{
 const old={enemyFeedback:'hit',enemyId:1,t:.01},fresh={enemyFeedback:'hit',enemyId:1,t:.28};
 assert.deepEqual(advanceFeedback([old],[fresh],1/60),[fresh]);
 const death={enemyFeedback:'death',enemyId:1,t:1.1};assert.deepEqual(advanceFeedback([fresh],[death],1/60),[death]);assert.equal(death.t,1.1);
});
test('catch-up simulation steps age a contact only after its creation step and remove it on expiry',()=>{
 const contact={arrowImpact:true,t:.2};let effects=advanceFeedback([],[contact],1/60);
 for(let i=0;i<3;i++)effects=advanceFeedback(effects,[],1/60);
 assert.ok(Math.abs(contact.t-.15)<1e-10);assert.equal(effects.length,1);
 for(let i=0;i<10;i++)effects=advanceFeedback(effects,[],1/60);
 assert.equal(effects.length,0);
});
