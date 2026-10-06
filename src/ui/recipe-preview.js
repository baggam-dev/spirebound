import {recipes,skills} from '../progression/progression.js';
import {allowedSkill} from '../progression/skill-tree.js';

// Only surface recipes that the current build can complete or already uses.
export function recipePreview(player,skillId){
 return recipes.filter(recipe=>recipe.needs.includes(skillId)&&recipe.needs.every(id=>allowedSkill(player,id)))
  .filter(recipe=>recipe.needs.some(id=>id!==skillId&&(player[id]||0)>0))
  .map(recipe=>({name:recipe.name,description:recipe.description,
   complete:recipe.needs.every(id=>(player[id]||0)>0),
   partner:skills.find(skill=>skill.id===recipe.needs.find(id=>id!==skillId))?.name}));
}

export function recipePreviewMarkup(player,skillId){
 const entries=recipePreview(player,skillId);
 return entries.length?'<em>'+entries.map(recipe=>
  (recipe.complete?'활성 조합':'선택 시 조합 완성')+' · '+recipe.name+'<br>'+recipe.description
 ).join('<br>')+'</em>':'';
}
