import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from '../../src/game/engine.js';
import {recipePreview,recipePreviewMarkup} from '../../src/ui/recipe-preview.js';

test('recipe choice explains a newly completed effect without changing the build',()=>{
 const player=newRun(71).player;player.mainSkill='fire';player.fire=1;const before=JSON.stringify(player);
 const [offer]=recipePreview(player,'repeat');
 assert.deepEqual(offer,{name:'속성 연사',description:'뒤따르는 화살도 작은 화염 폭발 발동',complete:false,partner:'화염 화살'});
 assert.match(recipePreviewMarkup(player,'repeat'),/선택 시 조합 완성.*속성 연사.*작은 화염 폭발/s);
 assert.equal(JSON.stringify(player),before);
 player.repeat=1;
 assert.match(recipePreviewMarkup(player,'repeat'),/활성 조합.*속성 연사/s);
 assert.equal(recipePreviewMarkup(player,'haste'),'');
});

test('incompatible main build does not advertise an unavailable fire recipe',()=>{
 const player=newRun(12).player;player.mainSkill='precision';player.precision=1;player.repeat=1;
 assert.equal(recipePreviewMarkup(player,'fire'),'');
});
