import {criticalRelicIds} from '../progression/critical-relics.js';
const motifs={
 hawkCharm:'<path d="M31 8Q18 6 19 17L24 24" fill="none" stroke="#8f7154" stroke-width="3"/><path d="M18 15Q8 22 17 42L24 37L30 20Z" fill="#aebfc1" stroke="#647d85"/><path d="M18 20L20 40M14 25L22 30M16 33L23 35" stroke="#eee9d8"/><circle cx="35" cy="35" r="13" fill="#a79265" stroke="#463d32" stroke-width="3"/><circle cx="35" cy="35" r="9" fill="#4f7782"/><path d="M31 30Q35 25 39 30L32 36Z" fill="#d5e7df" opacity=".8"/><path d="M35 48V54" stroke="#a79265" stroke-width="3"/>',
 crackedCrown:'<path d="M12 22L22 28L31 17L40 28L51 21L47 43H17Z" fill="#b59a67" stroke="#46372b" stroke-width="3"/><path d="M17 40H47V48H17Z" fill="#8f744d"/><path d="M29 18L34 29L29 34L36 42L32 49" stroke="#231f26" stroke-width="3" fill="none"/><path d="M22 33L25 36L22 39L19 36Z" fill="#8f3d4d"/><path d="M41 32L45 36L41 40L37 36Z" fill="#8f3d4d"/><path d="M17 44H27M38 44H46" stroke="#eadbb3" stroke-width="2"/>',
 hunterSeal:'<ellipse cx="32" cy="42" rx="16" ry="12" fill="none" stroke="#8e7760" stroke-width="7"/><path d="M19 13H45L50 26L42 39H22L14 26Z" fill="#adb5b5" stroke="#566675" stroke-width="3"/><path d="M24 17H40L43 26L38 34H26L21 26Z" fill="#334a55"/><path d="M26 22L38 30M38 22L26 30M32 17V35" stroke="#d9c48c" stroke-width="2"/><path d="M20 14H44M16 24L20 33" stroke="#f1ede0"/>',
 resolveEmblem:'<path d="M16 16L32 10L48 16V34Q46 47 32 55Q18 47 16 34Z" fill="#dbd6c0" stroke="#807758" stroke-width="3"/><path d="M22 20L32 16L42 20V33Q40 42 32 48Q24 42 22 33Z" fill="#526a72"/><path d="M25 27Q28 22 32 28Q37 22 40 27Q42 33 32 40Q23 34 25 27Z" fill="#b7c9c2"/><path d="M29 26L32 30L36 25" fill="none" stroke="#f4e7ba" stroke-width="2"/>'
};
export function criticalRelicIcon(id){
 if(!criticalRelicIds.includes(id))return null;
 return `<svg class="pixel-icon" data-relic-icon="${id}" viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${motifs[id]}</svg>`;
}
