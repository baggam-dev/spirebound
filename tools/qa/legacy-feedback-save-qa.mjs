// Local historical source fixture; no remote access and no player data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
const source=execFileSync('git',['show','d6b1fa5:src/game/engine.js'],{encoding:'utf8'}).replace(/from '([^']+)'/g,(_,file)=>`from '${pathToFileURL(resolve('src/game',file)).href}'`);
const {newRun}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const reports=[];
for(const campaign of ['classic','expanded'])for(const seed of [1,42,177]){
 const legacy=newRun(seed,{campaign}),before=legacy.floors.map(rs=>rs.map(r=>[r.x,r.y,r.type]));assert.equal(legacy.generationVersion,34);assert.ok(legacy.floors[0].length>=7);const restored=parseSave(encodeSave(legacy));assert.deepEqual(restored.floors.map(rs=>rs.map(r=>[r.x,r.y,r.type])),before);reports.push({seed,campaign,earlyRooms:restored.floors.slice(0,2).map(rs=>rs.length),mapPreserved:true});
}
console.log(JSON.stringify({historicalCommit:'d6b1fa5',reports}));
