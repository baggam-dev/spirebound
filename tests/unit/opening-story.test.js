import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY_SECONDS,STORY_PARAGRAPHS,storyFrame,storyScroll} from '../../src/ui/opening-story.js';
import {createEntranceState} from '../../src/ui/entrance-state.js';
import {nightMotion} from '../../src/ui/entrance-night.js';
test('story follows approved continuous scroll and paragraph cuts',()=>{assert.equal(STORY_SECONDS,28);assert.equal(STORY_PARAGRAPHS.length,4);assert.equal(storyFrame(0),0);assert.equal(storyFrame(10),1);assert.equal(storyFrame(15),2);assert.equal(storyFrame(20),3);assert.equal(storyScroll(0),320);assert.ok(storyScroll(28)<-500);assert.equal(storyScroll(40),storyScroll(28));});
test('suspending presentation retains its clock without touching combat state',()=>{const run={runId:'intro',status:'playing',elapsed:0},state=createEntranceState();state.queue(run);state.start(run);state.advance(run,.1);state.suspend();state.advance(run,1);assert.equal(state.time(run),.1);assert.ok(state.queued(run));state.start(run);state.advance(run,.1);assert.equal(state.time(run),.2);assert.equal(run.elapsed,0);state.finish(run);assert.equal(state.start(run),false);});
test('night reduced effects hold representative actor positions per shot',()=>{assert.deepEqual(nightMotion(.2,true),nightMotion(2,true));assert.equal(nightMotion(3,true).sheet,'pause');assert.deepEqual(nightMotion(4,true),nightMotion(6,true));assert.equal(nightMotion(4).sheet,'front');});
