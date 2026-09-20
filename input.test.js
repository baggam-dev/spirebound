import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput} from './input.js';

test('floating touch origin, second fingers, cancellation and rotation never leave movement stuck',()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 const win=new EventTarget(),doc=new EventTarget(),stick=new EventTarget();
 Object.assign(win,{matchMedia:()=>({matches:true})});
 Object.assign(stick,{firstElementChild:{style:{}},style:{setProperty(){}},classList:{add(){},remove(){}},getBoundingClientRect:()=>({left:0,top:100,width:300,height:200}),setPointerCapture(){},hasPointerCapture:()=>false});
 globalThis.window=win;globalThis.document=doc;
 const emit=(target,type,fields={})=>{const event=new Event(type,{cancelable:true});Object.assign(event,fields);target.dispatchEvent(event);};
 try{
  const input=createInput(stick,()=>{});input.setEnabled(true);
  emit(stick,'pointerdown',{pointerId:1,clientX:200,clientY:180});assert.deepEqual(input.movement(),{x:0,y:0});
  emit(stick,'pointermove',{pointerId:1,clientX:236,clientY:180});assert.equal(input.movement().x,1);
  emit(stick,'pointerdown',{pointerId:2,clientX:100,clientY:120});emit(stick,'pointerup',{pointerId:2});assert.equal(input.movement().x,1);
  emit(stick,'pointercancel',{pointerId:1});assert.deepEqual(input.movement(),{x:0,y:0});
  for(const reason of ['resize','blur']){emit(stick,'pointerdown',{pointerId:3,clientX:50,clientY:180});emit(stick,'pointermove',{pointerId:3,clientX:50,clientY:216});assert.equal(input.movement().y,1);emit(win,reason);assert.deepEqual(input.movement(),{x:0,y:0});}
  input.setEnabled(false);emit(stick,'pointerdown',{pointerId:4,clientX:50,clientY:180});emit(stick,'pointermove',{pointerId:4,clientX:90,clientY:180});assert.deepEqual(input.movement(),{x:0,y:0});
 }finally{globalThis.window=oldWindow;globalThis.document=oldDocument;}
});
