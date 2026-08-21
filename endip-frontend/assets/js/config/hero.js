/**
 * Homepage hero imagery — isolated for easy replacement.
 *
 * These remote Unsplash URLs are TEMPORARY development placeholders.
 * Replace each entry with ENDIP photography, for example:
 *   src: "assets/images/hero/slide-01.jpg"
 * Do not use this file for other media or a new storage system.
 */
function unsplash(id) {
  const base = `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80`;
  return {
    src: `${base}&w=1600`,
    srcset: `${base}&w=800 800w, ${base}&w=1280 1280w, ${base}&w=1920 1920w`,
    sizes: "100vw",
  };
}

export const HERO_IMAGES = {
  mission: {
    ...unsplash("photo-1531482615713-2afd69097998"),
    position: "62% 35%",
  },
  enterprise: {
    ...unsplash("photo-1556761175-4b46a572b786"),
    position: "70% 40%",
  },
  skills: {
    ...unsplash("photo-1552664730-d307ca884978"),
    position: "50% 40%",
  },
  impact: {
    ...unsplash("photo-1521737711867-e3b97375f902"),
    position: "58% 32%",
  },
};
