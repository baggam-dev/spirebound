// Display sizes only. Collision radii, room geometry and combat remain unchanged.
export const characterSizes=Object.freeze({hero:56,grunt:50,brute:64,warden:76});
export const gruntHealthOffset=()=>characterSizes.grunt-21+7;
export const bruteHealthOffset=()=>characterSizes.brute-24+10;
export const heroStunOffset=()=>characterSizes.hero-22+17;
