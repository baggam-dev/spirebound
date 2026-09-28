import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,dirname,relative,sep} from 'node:path';

test('every browser module dependency resolves inside src, including side-effect imports',async()=>{
 const root=resolve('src');
 for(const file of (await readdir(root,{recursive:true})).filter(file=>file.endsWith('.js'))){
  const location=resolve(root,file),source=await readFile(location,'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)){
   const specifier=match[1];assert.ok(specifier.startsWith('.'),`${file}: browser dependency must be relative`);
   const target=resolve(dirname(location),specifier),within=relative(root,target);
   assert.ok(within&&!within.startsWith('..'+sep),`${file}: dependency escapes src`);
   assert.ok((await stat(target)).isFile(),`${file}: missing ${specifier}`);
  }
 }
});
