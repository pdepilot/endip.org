import { DEMO as SEED } from "../data/index.js";
import { fingerprint } from "../utils/hash.js";

const SCHEMA = "4";
const SCHEMA_KEY = "endip_schema";

function parse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function read(key, fallback = null) {
  return parse(localStorage.getItem("endip_" + key), fallback);
}

export function write(key, value) {
  localStorage.setItem("endip_" + key, JSON.stringify(value));
  return value;
}

export function remove(key) {
  localStorage.removeItem("endip_" + key);
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
  return new Date().toISOString();
}

function seedUsers() {
  return [
    { id: "u-admin", name: "ENDIP Operations", email: "operations@endip.org", role: "Admin", status: "Active" },
    { id: "u-part", name: "Adaeze Okafor", email: "adaeze.okafor@gmail.com", role: "Participant", status: "Active", programme: "advance-internship" },
    { id: "u-ent", name: "Chinedu Okoro", email: "chinedu.okoro@gmail.com", role: "Entrepreneur", status: "Active" },
  ];
}

function seedCredentials() {
  const mark = fingerprint("Endip2026");
  return {
    "operations@endip.org": mark,
    "adaeze.okafor@gmail.com": mark,
    "chinedu.okoro@gmail.com": mark,
  };
}

function seedApplications() {
  return [
    {
      id: "app-1001",
      ref: "ENDIP-APP-1001",
      programmeId: "advance-internship",
      userId: "u-part",
      date: "2026-07-12",
      status: "Under Review",
      updated: "2026-08-02",
      answers: {
        fullName: "Adaeze Okafor",
        email: "adaeze.okafor@gmail.com",
        phone: "+234 803 000 1122",
        education: "B.Sc. Business Administration",
        employment: "NYSC completed",
        motivation: "I want structured workplace experience through ENDIP’s internship pathway.",
      },
      documents: [{ name: "CV.pdf" }],
      notes: [],
      timeline: [
        { at: "2026-07-12", label: "Submitted" },
        { at: "2026-07-20", label: "Under Review" },
      ],
    },
    {
      id: "app-1002",
      ref: "ENDIP-APP-1002",
      programmeId: "ysecp",
      userId: "u-part",
      date: "2025-05-10",
      status: "Accepted",
      updated: "2025-05-28",
      answers: { fullName: "Adaeze Okafor", email: "adaeze.okafor@gmail.com" },
      documents: [],
      notes: [],
      timeline: [
        { at: "2025-05-10", label: "Submitted" },
        { at: "2025-05-28", label: "Accepted" },
      ],
    },
  ];
}

export function ensureSeed() {
  if (localStorage.getItem(SCHEMA_KEY) === SCHEMA) return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith("endip_demo_") || k.startsWith("endip_"))
    .forEach((k) => localStorage.removeItem(k));

  write("programmes", SEED.programmes);
  write("events", SEED.events);
  write("event_regs", []);
  write("businesses", []);
  write("articles", SEED.articles);
  write("applications", seedApplications());
  write("courses", SEED.courses);
  write("progress", { "u-part": { "c-ready": { l1: true, l2: true } } });
  write("assignments", SEED.assignments.map((a) => ({ ...a, userId: "u-part", feedback: a.status === "Submitted" ? "Awaiting trainer review." : "" })));
  write("attendance", SEED.attendance.map((a) => ({ ...a, userId: "u-part" })));
  write("certificates", [
    {
      id: "cert-1001",
      number: "ENDIP-2025-0001",
      userId: "u-part",
      holder: "Adaeze Okafor",
      programme: "Youth Skills for Employment and Civic Participation",
      completed: "2025-08-01",
      status: "Issued",
    },
  ]);
  write("notifications", [
    { id: "n1", userId: "u-part", title: "Application received", body: "Your Advance Internship application is under review.", read: false, at: "2026-08-02T10:00:00Z" },
    { id: "n2", userId: "u-part", title: "Upcoming session", body: "Workplace readiness continues this week.", read: true, at: "2026-08-10T08:00:00Z" },
    { id: "n3", userId: "u-part", title: "Certificate available", body: "Certificate ENDIP-2025-0001 is ready in your portal.", read: false, at: "2026-08-12T12:00:00Z" },
  ]);
  write("users", seedUsers());
  write("credentials", seedCredentials());
  write("profiles", {});
  write("enquiries", []);
  write("volunteers", []);
  write("partners", []);
  write("stories", []);
  write("alumni", []);
  write("hosts", [
    { id: "h1", name: "Host organisation", location: "Port Harcourt", sector: "Services", status: "Pending", internships: 0 },
  ]);
  write("placements", [
    { id: "pl1", intern: "Adaeze Okafor", internId: "u-part", host: "Host organisation", supervisor: "To be assigned", period: "Oct 2026 – Oct 2027", status: "Matching" },
  ]);
  write("media", []);
  write("emails", []);
  write("audit", [
    { at: "2026-08-18T09:12:00Z", user: "ENDIP Operations", action: "Programme published", module: "Programmes", record: "advance-internship", ip: "local", status: "Recorded" },
    { at: "2026-08-16T14:03:00Z", user: "ENDIP Operations", action: "Application reviewed", module: "Applications", record: "app-1001", ip: "local", status: "Recorded" },
  ]);
  write("form_fields", SEED.formFields);
  write("impact", SEED.impact);
  write("settings", {
    organisation: "Entrepreneurial Development Initiative",
    email: "endiporg@gmail.com",
    phone: "+234 906 403 0896",
    seoTitle: "ENDIP",
  });
  write("roles", SEED.roles);
  localStorage.setItem(SCHEMA_KEY, SCHEMA);
}

export function collection(name) {
  ensureSeed();
  return {
    get: () => read(name, []),
    set: (value) => write(name, value),
  };
}

export function recordAudit(user, action, module, record) {
  const logs = read("audit", []);
  logs.unshift({ at: nowIso(), user: user || "System", action, module, record, ip: "local", status: "Recorded" });
  write("audit", logs.slice(0, 200));
}

export function notify(userId, title, body) {
  const items = read("notifications", []);
  items.unshift({ id: uid("n"), userId, title, body, read: false, at: nowIso() });
  write("notifications", items);
}

export function resetState() {
  localStorage.removeItem(SCHEMA_KEY);
  ensureSeed();
}

if (typeof window !== "undefined") {
  window.endipDev = {
    resetState,
    seedData: resetState,
    clearStorage() {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("endip_"))
        .forEach((k) => localStorage.removeItem(k));
    },
  };
}
