/** DEMO impact metrics for UI. 2030 targets are existing ENDIP public goals. */
export const IMPACT = {
  disclaimer:
    "Except for the published 2030 targets, numeric values below are prototype placeholders so the layout can be reviewed. They must be replaced with staff-verified figures before any public launch.",
  targets: [
    { id: "t1", value: "10,000+", label: "Sustainable enterprises targeted", note: "Published 2030 goal", verified: true },
    { id: "t2", value: "30,000", label: "Jobs targeted by 2030", note: "Published 2030 goal", verified: true },
  ],
  mock: [
    { id: "m1", value: "—", label: "People reached (to be verified)", note: "Hidden on a live site until verified", verified: false },
    { id: "m2", value: "DEMO", label: "Programme deliveries logged in prototype", note: "Demo dataset only", verified: false },
  ],
  geography: [
    { place: "Rivers State", note: "YSECP delivery published" },
    { place: "Edo State (Benin City)", note: "IDEAS and Skills for Digital Transition published" },
    { place: "Lagos State", note: "IBDP mentioned on homepage; details incomplete" },
  ],
  chart: [
    { label: "Enterprise", value: 32 },
    { label: "Internship", value: 24 },
    { label: "Skills", value: 21 },
    { label: "Financial literacy", value: 15 },
    { label: "Inclusion", value: 8 },
  ],
};

export const STORIES = [
  {
    id: "s1",
    title: "Story template — enterprise journey",
    person: "Name withheld pending consent",
    programme: "YSECP",
    location: "Port Harcourt",
    challenge: "Placeholder challenge text. Do not treat as a real testimony.",
    intervention: "Placeholder describing ENDIP-style enterprise support.",
    outcome: "Placeholder outcome. No unverified results are claimed.",
    quote: "A quote will appear here only when ENDIP publishes a consented story.",
    featured: true,
    demo: true,
  },
  {
    id: "s2",
    title: "Story template — internship pathway",
    person: "Name withheld pending consent",
    programme: "Advance Internship",
    location: "Nigeria",
    challenge: "Placeholder.",
    intervention: "Placeholder.",
    outcome: "Placeholder.",
    quote: "Consented quotes will replace this demo card.",
    featured: false,
    demo: true,
  },
];

export const PARTNERS = [
  {
    id: "p-placeholder",
    name: "Partner logos appear with permission",
    type: "Strategic",
    note: "Do not invent organisations. A published YSECP Rivers article names British Council and King’s Trust International in that programme context — confirm permission before displaying logos.",
    active: false,
    placeholder: true,
  },
];
