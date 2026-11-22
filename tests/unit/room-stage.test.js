import test from 'node:test';
import assert from 'node:assert/strict';
import {roomSurfaceSize,createRoomStage} from '../../src/rendering/room-stage.js';

test('landscape surface follows viewport aspect while preserving the entire common frame',()=>{
 for(const [w,h] of [[844,390],[1280,720],[700,500]]){
  const size=roomSurfaceSize(w,h,true);assert.ok(size.width>=960&&size.height>=540);
  assert.ok(Math.abs(size.width/size.height-w/h)<.002);
 }
 assert.deepEqual(roomSurfaceSize(844,390,false),{width:960,height:540});
 assert.deepEqual(roomSurfaceSize(Infinity,0,true),{width:960,height:540});
});
test('stage composes independent world and UI surfaces and captures logical snapshots',()=>{
 function surface(){const calls=[],c={globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'',save(){},restore(){},setTransform(...v){calls.push(['transform',...v]);},clearRect(){},fillRect(){calls.push(['clear',this.fillStyle]);},drawImage(source){calls.push(['image',source]);}};return {width:0,height:0,calls,getContext:()=>c};}
 const target=surface(),layers=[],stage=createRoomStage(target,{makeCanvas:()=>{const layer=surface();layers.push(layer);return layer;},observe:false});
 stage.begin();stage.present();assert.equal(target.width,960);assert.equal(target.height,540);
 assert.deepEqual(target.calls.filter(c=>c[0]==='image').map(c=>c[1]),layers);
 const snapshot=surface();stage.capture(snapshot);assert.equal(snapshot.width,960);assert.equal(snapshot.height,540);
 assert.deepEqual(snapshot.calls.filter(c=>c[0]==='image').map(c=>c[1]),layers);stage.dispose();
});
