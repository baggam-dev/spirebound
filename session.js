// Web Locks avoid simultaneous writers in modern browsers. A storage lease is a fallback,
// not an anti-cheat mechanism, and expires if the owning tab crashes.
export class SessionLease{
 constructor(storage,onLost,locks=globalThis.navigator?.locks,key='spirebound.active-tab'){this.storage=storage;this.onLost=onLost;this.locks=locks;this.key=key;this.id=globalThis.crypto?.randomUUID?.()||String(Math.random());this.active=false;}
 async acquire(){
  if(this.active)return true;
  if(this.locks){return new Promise(resolve=>{this.locks.request(this.key,{ifAvailable:true},async lock=>{if(!lock){resolve(false);return;}this.active=true;resolve(true);await new Promise(release=>this.releaseLock=release);}).catch(()=>resolve(false));});}
  try{const old=JSON.parse(this.storage.getItem(this.key)||'null');if(old&&old.owner!==this.id&&old.until>Date.now())return false;this.storage.setItem(this.key,JSON.stringify({owner:this.id,until:Date.now()+15000}));this.active=true;return true;}catch{this.active=true;return true;}
 }
 heartbeat(){if(!this.active||this.locks)return;try{const old=JSON.parse(this.storage.getItem(this.key)||'null');if(old?.owner!==this.id){this.active=false;this.onLost();return;}this.storage.setItem(this.key,JSON.stringify({owner:this.id,until:Date.now()+15000}));}catch{}}
 release(){if(this.releaseLock){this.releaseLock();this.releaseLock=null;}else if(this.active)try{const old=JSON.parse(this.storage.getItem(this.key)||'null');if(old?.owner===this.id)this.storage.removeItem(this.key);}catch{}this.active=false;}
}
