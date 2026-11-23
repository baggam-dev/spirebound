import test from 'node:test';
import assert from 'node:assert/strict';
import {bossRewardPending,createBossRewardReveal} from '../../src/ui/boss-reward-reveal.js';
function fixture(){
 const doc={activeElement:null,createElement:()=>node()};
 function node(panel=false){const classes=new Set(panel?['panel']:[]),attrs=new Map(),listeners=new Map();return {
  ownerDocument:doc,inert:false,isConnected:true,children:[],parent:null,
  classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)},
  get firstElementChild(){return this.children[0]||null;},
  getAttribute:k=>attrs.get(k)??null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),
  addEventListener:(k,fn)=>listeners.set(k,fn),fire:(k,e)=>listeners.get(k)?.(e),
  focus(){doc.activeElement=this;},append(child){this.children.push(child);child.parent=this;child.isConnected=true;},
  remove(){this.parent.children=this.parent.children.filter(n=>n!==this);this.isConnected=false;}
 };}
 const overlay=node(),dialog=node(true);overlay.append(dialog);dialog.focus();return {overlay,dialog,doc,node};
}
test('only fresh boss reward screens wait for the visual reveal boundary',()=>{
 for(const mode of ['level','main','evolution','utility','relic'])assert.equal(bossRewardPending(.5,mode),true);
 for(const mode of ['pause','lease-lost','result','title','journey-return'])assert.equal(bossRewardPending(.5,mode),false);
 for(const age of [undefined,NaN,-1,1.2,1.8])assert.equal(bossRewardPending(age,'level'),false);
});
test('reveal gate restores the original dialog without replacing its choices or focus',()=>{
 const {overlay,dialog,doc}=fixture(),reveal=createBossRewardReveal(overlay);
 dialog.setAttribute('aria-labelledby','unchanged');assert.equal(reveal.sync(.2,'level'),true);
 const skip=overlay.children[1];assert.equal(dialog.inert,true);assert.equal(dialog.getAttribute('aria-hidden'),'true');
 assert.equal(doc.activeElement,skip);reveal.sync(.6,'level');assert.equal(overlay.children[1],skip);
 assert.equal(reveal.sync(1.2,'level'),false);assert.equal(overlay.firstElementChild,dialog);assert.equal(dialog.inert,false);
 assert.equal(dialog.getAttribute('aria-hidden'),null);assert.equal(dialog.getAttribute('aria-labelledby'),'unchanged');assert.equal(doc.activeElement,dialog);
});
test('escape skips once and tab cannot enter the hidden reward choices',()=>{
 const {overlay,dialog}=fixture();let skips=0;const reveal=createBossRewardReveal(overlay,{onSkip:()=>{skips++;reveal.clear();}});
 reveal.sync(.2,'relic');const button=overlay.children[1];let stopped=0;
 const event=key=>({key,preventDefault(){},stopPropagation(){stopped++;}});
 button.fire('keydown',event('Tab'));assert.equal(reveal.active(),true);
 button.fire('keydown',event('Escape'));assert.equal(skips,1);assert.equal(stopped,2);assert.equal(dialog.inert,false);
});
test('lease loss and panel replacement remove pending styling without stealing new focus',()=>{
 const {overlay,dialog,doc,node}=fixture(),reveal=createBossRewardReveal(overlay);
 dialog.setAttribute('aria-hidden','false');reveal.sync(.1,'level');reveal.sync(.2,'lease-lost');
 assert.equal(dialog.getAttribute('aria-hidden'),'false');assert.equal(overlay.classList.contains('boss-reward-pending'),false);
 reveal.sync(.2,'level');const next=node(true);dialog.isConnected=false;overlay.children=[next];next.focus();reveal.sync(.3,'pause');
 assert.equal(doc.activeElement,next);assert.equal(dialog.inert,false);
});
