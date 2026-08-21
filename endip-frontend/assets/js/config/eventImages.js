/**
 * Event card imagery — isolated for easy replacement.
 *
 * These remote Unsplash URLs are TEMPORARY development placeholders.
 * Replace each entry with ENDIP photography, for example:
 *   src: "assets/images/events/inclusive-by-design-project.jpg"
 * Do not use this file for other media or a new storage system.
 */
function unsplash(id) {
  const base = `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80`;
  return {
    src: `${base}&w=800`,
    srcset: `${base}&w=480 480w, ${base}&w=800 800w, ${base}&w=1200 1200w`,
    sizes: "(min-width: 980px) 33vw, 100vw",
  };
}

export const EVENT_IMAGES = {
  "inclusive-by-design-project": {
    ...unsplash("photo-1600880292203-757bb62b4baf"),
    alt: "A diverse professional team in discussion",
  },
  "future-entrepreneurs-open-day": {
    ...unsplash("photo-1552664730-d307ca884978"),
    alt: "Participants in a training workshop",
  },
  "global-money-week-25": {
    ...unsplash("photo-1454165804606-c3d57bc86b40"),
    alt: "People reviewing documents at a table",
  },
  "ysecp-rivers-final-pitch": {
    ...unsplash("photo-1517048676732-d65bc937f952"),
    alt: "A group meeting around a conference table",
  },
  "inter-school-debate": {
    ...unsplash("photo-1523240795612-9a054b0db644"),
    alt: "Students studying together",
  },
};
