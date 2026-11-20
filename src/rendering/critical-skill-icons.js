import {criticalSkillInfo} from '../progression/critical-skills.js';

// Authored SVG medallions extend the existing icon system and approved motifs.
const motifs={
 keenEye:'<path d="M15 32Q32 14 49 32Q32 50 15 32Z" fill="#788e91"/><ellipse cx="32" cy="32" rx="7" ry="10" fill="#18272d"/><path d="M30 25L33 23L35 29L32 32Z" fill="#fff4cf"/>',
 criticalTraining:'<path d="M22 47L36 20L44 17L43 27L28 49Z" fill="#cad5d2"/><path d="M36 20L39 26L28 44" fill="none" stroke="#fff4cf"/><path d="M19 46L28 49L24 54L17 50Z" fill="#97724c"/>',
 fractureMark:'<circle cx="32" cy="32" r="16" fill="none" stroke="#9dbbd4" stroke-width="3"/><path d="M32 12V21M32 43V52M12 32H21M43 32H52M28 22L36 29L29 35L36 43" fill="none" stroke="#f4e2ba" stroke-width="3"/>',
 evasiveFocus:'<path d="M27 15H39L36 35L48 39L47 47H24L20 40Z" fill="#91a7bb"/><path d="M28 19H36L33 34" fill="none" stroke="#dbe7e7" stroke-width="3"/><path d="M12 27H22M10 35H19M13 43H19" stroke="#eee4b8" stroke-width="3"/>',
 decisiveMoment:'<path d="M22 17H42L50 30L32 51L14 30Z" fill="#9586ae" stroke="#d9c496" stroke-width="2"/><path d="M22 17L26 30L32 51L38 30L42 17M14 30H50M26 30L32 17L38 30" fill="none" stroke="#e8e1ed" stroke-width="1.5"/>',
 royalJudgment:'<path d="M20 20L26 26L32 17L38 26L44 20L41 32H23Z" fill="#d5b679"/><path d="M29 34H35L34 47H30Z" fill="#e6dfce"/><path d="M23 39H41M32 47V53" stroke="#bdab8f" stroke-width="3"/><path d="M17 46L22 41M47 46L42 41" stroke="#9586ae" stroke-width="2"/>'
};
export function criticalSkillIcon(id){
 const skill=criticalSkillInfo(id);if(!skill)return null;
 const rim=skill.grade==='unique'?'#c4a875':skill.grade==='rare'?'#9cafc0':'#7f8d8c';
 return `<svg class="pixel-icon" data-critical-icon="${id}" viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M16 3H48L61 16V48L48 61H16L3 48V16Z" fill="#18262e" stroke="${rim}" stroke-width="3"/><path d="M18 8H46L56 18V46L46 56H18L8 46V18Z" fill="#293641" stroke="#5c6261"/><path d="M17 5H47M59 17V47" stroke="#eee2b0" opacity=".55"/>${motifs[id]}${skill.grade==='unique'?'<path d="M6 29L10 32L6 35M58 29L54 32L58 35" fill="#c4a875"/>':skill.grade==='rare'?'<path d="M6 29L10 32L6 35" fill="#b8c7d9"/>':''}</svg>`;
}
