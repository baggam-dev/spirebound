import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFeedback} from '../../src/rendering/enemy-feedback.js';
import {arrowImpactEffect} from '../../src/rendering/arrow-impact-visuals.js';
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
