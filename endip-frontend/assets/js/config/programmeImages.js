/**
 * Programme card imagery — isolated for easy replacement.
 *
 * These remote Unsplash URLs are TEMPORARY development placeholders.
 * Replace each entry with ENDIP photography, for example:
 *   src: "assets/images/programmes/advance-internship.jpg"
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

export const PROGRAMME_IMAGES = {
  "advance-internship": {
    ...unsplash("photo-1521737711867-e3b97375f902"),
    alt: "Professionals collaborating in a workplace",
  },
  "future-entrepreneurs-academy": {
    ...unsplash("photo-1556761175-4b46a572b786"),
    alt: "Young people in a business discussion",
  },
  "sustainable-enterprise-development": {
    ...unsplash("photo-1542744173-8e7e53415bb0"),
    alt: "Team working together on a business plan",
  },
  "financial-literacy-for-schools": {
    ...unsplash("photo-1509062522246-3755977927d7"),
    alt: "Learners in a classroom session",
  },
  "e-learning-and-training": {
    ...unsplash("photo-1516321318423-f06f85e504b3"),
    alt: "Person learning with a laptop",
  },
  "skills-development": {
    ...unsplash("photo-1581091226825-a6a2a5aee158"),
    alt: "Practical skills training session",
  },
  "waste-and-recycling": {
    ...unsplash("photo-1604187351574-c75ca79f5807"),
    alt: "Sorted materials ready for recycling",
  },
  "youth-sustainable-enterprise-challenge": {
    ...unsplash("photo-1551836022-d5d88e9218df"),
    alt: "A presenter speaking to a small audience",
  },
  "ideas-programme": {
    ...unsplash("photo-1531482615713-2afd69097998"),
    alt: "Participants collaborating around a table",
  },
};
