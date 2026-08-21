/** Demo users, applications, LMS, internships, notifications, audit. */

export const ROLES = [
  "Super Admin",
  "Admin",
  "Programme Manager",
  "Trainer",
  "Reviewer",
  "Internship Coordinator",
  "Content Manager",
  "Communication Manager",
  "Partner Manager",
  "Participant",
  "Alumni",
  "Entrepreneur",
  "Host Organisation",
  "Partner",
];

export const USERS = [
  {
    id: "u-admin",
    name: "ENDIP Admin (demo)",
    email: "admin@demo.endip",
    role: "Admin",
    password: "demo",
  },
  {
    id: "u-part",
    name: "Adaeze Participant (demo)",
    email: "participant@demo.endip",
    role: "Participant",
    password: "demo",
    programme: "advance-internship",
  },
  {
    id: "u-ent",
    name: "Chinedu Entrepreneur (demo)",
    email: "entrepreneur@demo.endip",
    role: "Entrepreneur",
    password: "demo",
    businessId: "b-002",
  },
];

export const APPLICATIONS = [
  {
    id: "app-1001",
    programmeId: "advance-internship",
    userId: "u-part",
    date: "2026-07-12",
    status: "Under Review",
    updated: "2026-08-02",
    answers: {
      fullName: "Adaeze Participant (demo)",
      email: "participant@demo.endip",
      phone: "+234 800 000 0000",
      motivation: "Demo application answers — not a real submission.",
    },
    documents: [{ name: "CV-demo.pdf", status: "Uploaded (demo)" }],
    notes: [{ at: "2026-08-02", by: "Reviewer (demo)", text: "Internal note placeholder." }],
    timeline: [
      { at: "2026-07-12", label: "Submitted" },
      { at: "2026-07-20", label: "Under Review" },
    ],
  },
  {
    id: "app-1002",
    programmeId: "ysecp",
    userId: "u-part",
    date: "2025-05-10",
    status: "Accepted",
    updated: "2025-05-28",
    answers: { fullName: "Adaeze Participant (demo)" },
    documents: [],
    notes: [],
    timeline: [
      { at: "2025-05-10", label: "Submitted" },
      { at: "2025-05-28", label: "Accepted" },
    ],
  },
  {
    id: "app-1003",
    programmeId: "feap",
    userId: "u-part",
    date: "2026-08-01",
    status: "Draft",
    updated: "2026-08-01",
    answers: {},
    documents: [],
    notes: [],
    timeline: [{ at: "2026-08-01", label: "Draft started" }],
  },
];

export const COURSES = [
  {
    id: "c-ready",
    title: "Workplace readiness",
    programmeId: "advance-internship",
    progress: 62,
    modules: [
      {
        id: "m1",
        title: "Professional conduct",
        lessons: [
          { id: "l1", title: "Showing up ready", type: "article", minutes: 12, complete: true },
          { id: "l2", title: "Working with a supervisor", type: "video", minutes: 8, complete: true },
        ],
      },
      {
        id: "m2",
        title: "Digital basics",
        lessons: [
          { id: "l3", title: "Documents and email", type: "article", minutes: 15, complete: false },
          { id: "l4", title: "Knowledge check", type: "quiz", minutes: 10, complete: false },
        ],
      },
    ],
  },
];

export const ASSIGNMENTS = [
  {
    id: "as-1",
    title: "Learning log — week 3",
    courseId: "c-ready",
    due: "2026-08-28",
    status: "Submitted",
    score: null,
    feedback: "Awaiting trainer review (demo).",
  },
  {
    id: "as-2",
    title: "Workplace observation notes",
    courseId: "c-ready",
    due: "2026-09-05",
    status: "Open",
    score: null,
    feedback: "",
  },
];

export const ATTENDANCE = [
  { id: 1, date: "2026-08-04", session: "Induction", status: "Present" },
  { id: 2, date: "2026-08-06", session: "Host briefing", status: "Present" },
  { id: 3, date: "2026-08-11", session: "Check-in", status: "Late" },
  { id: 4, date: "2026-08-13", session: "Skills clinic", status: "Excused" },
  { id: 5, date: "2026-08-18", session: "Placement day", status: "Absent" },
];

export const CERTIFICATES = [
  {
    id: "cert-demo-001",
    number: "ENDIP-DEMO-2025-0042",
    programme: "YSECP",
    holder: "Adaeze Participant (demo)",
    completed: "2025-08-01",
    status: "Issued (demo — not a legal certificate)",
  },
];

export const HOSTS = [
  {
    id: "h1",
    name: "Host organisation (placeholder)",
    location: "Port Harcourt",
    sector: "Services",
    status: "Approved (demo)",
    internships: 2,
  },
];

export const PLACEMENTS = [
  {
    id: "pl1",
    intern: "Adaeze Participant (demo)",
    host: "Host organisation (placeholder)",
    supervisor: "Supervisor name pending",
    period: "Oct 2026 – Oct 2027",
    status: "Matching (demo)",
  },
];

export const ALUMNI = [
  {
    id: "al1",
    name: "Alumni profile (demo)",
    programme: "YSECP",
    cohort: "Rivers 2025/26",
    year: 2026,
    location: "Port Harcourt",
    employment: "Not published",
    business: "Woji Craft Collective (demo)",
    visibility: "Limited",
  },
];

export const VOLUNTEERS = [
  {
    id: "v1",
    name: "Volunteer applicant (demo)",
    email: "volunteer@demo.endip",
    skills: "Facilitation",
    interest: "Training",
    status: "New",
  },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "Application received (demo)", body: "Your Advance Internship application is under review.", read: false, at: "2026-08-02T10:00:00Z" },
  { id: "n2", title: "Upcoming session", body: "Workplace readiness module continues this week.", read: true, at: "2026-08-10T08:00:00Z" },
  { id: "n3", title: "Certificate record", body: "A demo certificate is available in your portal.", read: false, at: "2026-08-12T12:00:00Z" },
];

export const AUDIT_LOGS = [
  { at: "2026-08-18T09:12:00Z", user: "Admin (demo)", action: "Programme updated", module: "Programmes", record: "advance-internship", ip: "0.0.0.0", status: "Demo" },
  { at: "2026-08-16T14:03:00Z", user: "Reviewer (demo)", action: "Application reviewed", module: "Applications", record: "app-1001", ip: "0.0.0.0", status: "Demo" },
  { at: "2026-08-12T11:20:00Z", user: "Admin (demo)", action: "Business approved", module: "Businesses", record: "b-002", ip: "0.0.0.0", status: "Demo" },
  { at: "2026-08-01T08:40:00Z", user: "Admin (demo)", action: "Certificate issued", module: "Certificates", record: "cert-demo-001", ip: "0.0.0.0", status: "Demo" },
];

export const EMAIL_TEMPLATES = [
  "Application Received",
  "Application Accepted",
  "Application Rejected",
  "Programme Reminder",
  "Event Confirmation",
  "Certificate Available",
  "Internship Placement",
  "Announcement",
  "Partner Enquiry",
  "Volunteer Confirmation",
];

export const FORM_FIELDS = [
  { id: "f1", type: "text", label: "Full name", required: true },
  { id: "f2", type: "email", label: "Email", required: true },
  { id: "f3", type: "phone", label: "Phone", required: true },
  { id: "f4", type: "textarea", label: "Why this programme?", required: true },
  { id: "f5", type: "file", label: "CV", required: true },
];
