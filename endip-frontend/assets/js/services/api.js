import { collection, read, write, uid, nowDate, nowIso, recordAudit, notify, ensureSeed } from "../store/db.js";
import { isPast } from "../utils/dates.js";

ensureSeed();

function actor() {
  try {
    return read("auth", null)?.name || "System";
  } catch {
    return "System";
  }
}

function delay(data) {
  return Promise.resolve(typeof structuredClone === "function" ? structuredClone(data) : JSON.parse(JSON.stringify(data)));
}

function crud(name, idField = "id") {
  const col = () => collection(name);
  return {
    getAll: () => delay(col().get()),
    getById: async (id) => col().get().find((x) => x[idField] === id || x.slug === id),
    create: async (data) => {
      const item = { ...data, [idField]: data[idField] || uid(name.slice(0, 3)) };
      const all = col().get();
      all.unshift(item);
      col().set(all);
      recordAudit(actor(), "Created", name, item[idField]);
      return item;
    },
    update: async (id, patch) => {
      const all = col().get();
      const next = all.map((x) => (x[idField] === id || x.slug === id ? { ...x, ...patch } : x));
      col().set(next);
      recordAudit(actor(), "Updated", name, id);
      return next.find((x) => x[idField] === id || x.slug === id);
    },
    remove: async (id) => {
      col().set(col().get().filter((x) => x[idField] !== id && x.slug !== id));
      recordAudit(actor(), "Deleted", name, id);
    },
  };
}

export const programmeService = {
  ...crud("programmes"),
  async getById(id) {
    return collection("programmes").get().find((p) => p.id === id || p.slug === id);
  },
};

export const eventService = {
  ...crud("events"),
  async getAll() {
    return collection("events")
      .get()
      .map((e) => ({ ...e, timeframe: isPast(`${e.date}T23:59:59`) ? "past" : "upcoming" }));
  },
  async getById(id) {
    const all = await this.getAll();
    return all.find((e) => e.id === id || e.slug === id);
  },
  async register(eventId, payload) {
    const regs = read("event_regs", []);
    const item = { id: uid("reg"), ref: `ENDIP-EVT-${String(regs.length + 1).padStart(4, "0")}`, eventId, ...payload, at: nowIso() };
    regs.unshift(item);
    write("event_regs", regs);
    recordAudit(payload.name || actor(), "Event registration", "events", eventId);
    return item;
  },
  registrations: (eventId) => delay(read("event_regs", []).filter((r) => !eventId || r.eventId === eventId)),
};

export const businessService = {
  ...crud("businesses"),
  async getPublic() {
    return collection("businesses").get().filter((b) => b.status === "Published");
  },
  async approve(id) {
    const b = await this.update(id, { status: "Published", verified: true });
    if (b?.ownerId) notify(b.ownerId, "Business published", `${b.name} is now listed in the Business Network.`);
    return b;
  },
  async reject(id) {
    const b = await this.update(id, { status: "Rejected" });
    if (b?.ownerId) notify(b.ownerId, "Business not published", `${b.name} was not approved for the public directory.`);
    return b;
  },
  async feature(id, featured) {
    return this.update(id, { featured });
  },
  async unpublish(id) {
    return this.update(id, { status: "Unpublished" });
  },
  async updateStatus(id, status) {
    if (status === "Published") return this.approve(id);
    if (status === "Rejected") return this.reject(id);
    return this.update(id, { status });
  },
};

export const articleService = crud("articles");
export const storyService = crud("stories");
export const partnerService = crud("partners");
export const volunteerService = crud("volunteers");
export const alumniService = crud("alumni");
export const hostService = crud("hosts");
export const placementService = crud("placements");
export const mediaService = crud("media");
export const enquiryService = crud("enquiries");

export const applicationService = {
  ...crud("applications"),
  async forUser(userId) {
    return collection("applications").get().filter((a) => a.userId === userId);
  },
  async draftFor(userId, programmeId) {
    return collection("applications")
      .get()
      .find((a) => a.userId === userId && a.programmeId === programmeId && a.status === "Draft");
  },
  async saveDraft(data) {
    const all = collection("applications").get();
    const existing = all.find((a) => a.userId === data.userId && a.programmeId === data.programmeId && a.status === "Draft");
    if (existing) {
      return this.update(existing.id, { ...data, updated: nowDate() });
    }
    return this.create({
      ref: `ENDIP-APP-${uid("").slice(-6).toUpperCase()}`,
      status: "Draft",
      date: nowDate(),
      updated: nowDate(),
      documents: [],
      notes: [],
      timeline: [{ at: nowDate(), label: "Draft started" }],
      ...data,
    });
  },
  async submit(id) {
    const app = await this.update(id, {
      status: "Submitted",
      updated: nowDate(),
      timeline: [...((await this.getById(id))?.timeline || []), { at: nowDate(), label: "Submitted" }],
    });
    if (app?.userId) notify(app.userId, "Application received", `Application ${app.ref} has been submitted.`);
    return app;
  },
  async updateStatus(id, status, note) {
    const app = await this.getById(id);
    if (!app) return null;
    const next = await this.update(id, {
      status,
      updated: nowDate(),
      notes: note ? [...(app.notes || []), { at: nowDate(), by: actor(), text: note }] : app.notes,
      timeline: [...(app.timeline || []), { at: nowDate(), label: status }],
    });
    if (next?.userId) notify(next.userId, "Application update", `Your application ${next.ref} is now ${status}.`);
    return next;
  },
};

export const courseService = {
  getAll: () => delay(collection("courses").get()),
  getById: async (id) => collection("courses").get().find((c) => c.id === id),
  create: async (data) => {
    const all = collection("courses").get();
    const item = { id: uid("c"), progress: 0, modules: [], ...data };
    all.unshift(item);
    collection("courses").set(all);
    return item;
  },
  progressFor(userId) {
    return read("progress", {})[userId] || {};
  },
  async toggleLesson(userId, courseId, lessonId) {
    const progress = read("progress", {});
    progress[userId] = progress[userId] || {};
    progress[userId][courseId] = progress[userId][courseId] || {};
    progress[userId][courseId][lessonId] = !progress[userId][courseId][lessonId];
    write("progress", progress);
    return progress[userId][courseId];
  },
  async setLesson(userId, courseId, lessonId, complete = true) {
    const progress = read("progress", {});
    progress[userId] = progress[userId] || {};
    progress[userId][courseId] = progress[userId][courseId] || {};
    progress[userId][courseId][lessonId] = complete;
    write("progress", progress);
    return progress[userId][courseId];
  },
  percent(userId, course) {
    const lessons = course.modules.flatMap((m) => m.lessons);
    if (!lessons.length) return 0;
    const done = this.progressFor(userId)[course.id] || {};
    return Math.round((lessons.filter((l) => done[l.id]).length / lessons.length) * 100);
  },
};

export const assignmentService = {
  getAll: () => delay(collection("assignments").get()),
  async submit(id, payload) {
    const all = collection("assignments").get();
    const next = all.map((a) => (a.id === id ? { ...a, status: "Submitted", submission: payload, submittedAt: nowIso() } : a));
    collection("assignments").set(next);
    return next.find((a) => a.id === id);
  },
  async grade(id, score, feedback) {
    const all = collection("assignments").get();
    const next = all.map((a) => (a.id === id ? { ...a, score, feedback, status: "Graded" } : a));
    collection("assignments").set(next);
    return next.find((a) => a.id === id);
  },
};

export const attendanceService = {
  getAll: () => delay(collection("attendance").get()),
  forUser: (userId) => delay(collection("attendance").get().filter((a) => a.userId === userId)),
  async record(entry) {
    const all = collection("attendance").get();
    all.unshift({ id: uid("att"), ...entry });
    collection("attendance").set(all);
    return entry;
  },
};

export const certificateService = {
  getAll: () => delay(collection("certificates").get()),
  forUser: (userId) => delay(collection("certificates").get().filter((c) => c.userId === userId)),
  getByNumber: async (number) => {
    const needle = String(number || "").trim().toUpperCase();
    return collection("certificates").get().find((c) => String(c.number || "").toUpperCase() === needle);
  },
  async issue(data) {
    const all = collection("certificates").get();
    const item = {
      id: uid("cert"),
      number: `ENDIP-${new Date().getFullYear()}-${String(all.length + 1).padStart(4, "0")}`,
      completed: nowDate(),
      status: "Issued",
      ...data,
    };
    all.unshift(item);
    collection("certificates").set(all);
    if (item.userId) notify(item.userId, "Certificate available", `Certificate ${item.number} is ready.`);
    recordAudit(actor(), "Certificate issued", "certificates", item.number);
    return item;
  },
};

export const notificationService = {
  getAll: () => delay(read("notifications", [])),
  async forUser(userId) {
    return read("notifications", []).filter((n) => n.userId === userId);
  },
  async markRead(id) {
    const all = read("notifications", []).map((n) => (n.id === id ? { ...n, read: true } : n));
    write("notifications", all);
    return all;
  },
  async markAll(userId) {
    const all = read("notifications", []).map((n) => (n.userId === userId ? { ...n, read: true } : n));
    write("notifications", all);
    return all;
  },
  async create(payload) {
    notify(payload.userId, payload.title, payload.body);
  },
};

export const impactService = {
  get: () => delay(read("impact")),
  stories: () => delay(collection("stories").get()),
  partners: () => delay(collection("partners").get()),
  save: (data) => delay(write("impact", data)),
};

const DEFAULT_TEMPLATES = [
  { id: "t-received", name: "Application Received", subject: "We received your application", body: "Thank you. Your application is being reviewed." },
  { id: "t-accepted", name: "Application Accepted", subject: "Your ENDIP application was accepted", body: "Congratulations. Your application has been accepted." },
  { id: "t-rejected", name: "Application Rejected", subject: "Update on your ENDIP application", body: "Thank you for applying. We are unable to offer a place at this time." },
  { id: "t-reminder", name: "Programme Reminder", subject: "Programme reminder", body: "This is a reminder about your upcoming ENDIP programme activity." },
  { id: "t-event", name: "Event Registration", subject: "Event registration confirmed", body: "Your event registration has been recorded." },
  { id: "t-cert", name: "Certificate Available", subject: "Your certificate is ready", body: "A certificate is now available in your portal." },
  { id: "t-intern", name: "Internship Placement", subject: "Internship placement update", body: "There is an update on your internship placement." },
  { id: "t-announce", name: "Announcement", subject: "ENDIP announcement", body: "Please read this update from ENDIP." },
  { id: "t-vol", name: "Volunteer Confirmation", subject: "Volunteer application received", body: "Thank you for offering to volunteer with ENDIP." },
  { id: "t-partner", name: "Partnership Enquiry", subject: "Partnership enquiry received", body: "Thank you for your interest in partnering with ENDIP." },
];

function emailTemplates() {
  const stored = read("email_templates", null);
  if (Array.isArray(stored) && stored.length) return stored;
  return write("email_templates", DEFAULT_TEMPLATES);
}

export const emailService = {
  templates: () => delay(emailTemplates()),
  async saveTemplate(tpl) {
    const all = emailTemplates();
    let next;
    if (tpl.id) {
      next = all.map((t) => (t.id === tpl.id ? { ...t, ...tpl } : t));
    } else {
      next = [{ id: uid("t"), ...tpl }, ...all];
    }
    write("email_templates", next);
    return next;
  },
  getLogs: () => delay(read("emails", [])),
  async send(payload) {
    const logs = read("emails", []);
    const item = {
      id: uid("em"),
      ...payload,
      status: payload.scheduledFor ? "Scheduled" : "Sent",
      at: nowIso(),
    };
    logs.unshift(item);
    write("emails", logs);
    recordAudit(actor(), item.status === "Scheduled" ? "Email scheduled" : "Email sent", "email", item.id);
    return item;
  },
};

export const internshipService = placementService;

export const userService = {
  getAll: () => delay(collection("users").get()),
  getById: async (id) => collection("users").get().find((u) => u.id === id),
  async create(data) {
    const all = collection("users").get();
    const item = { id: uid("u"), status: "Active", ...data };
    all.unshift(item);
    collection("users").set(all);
    recordAudit(actor(), "User created", "users", item.id);
    return item;
  },
  async update(id, patch) {
    const all = collection("users").get().map((u) => (u.id === id ? { ...u, ...patch } : u));
    collection("users").set(all);
    recordAudit(actor(), "User updated", "users", id);
    return all.find((u) => u.id === id);
  },
};

export const roleService = {
  getAll: () => delay(read("roles", [])),
};

export const auditService = {
  getAll: () => delay(read("audit", [])),
};

export const settingsService = {
  get: () => delay(read("settings", {})),
  save: (data) => delay(write("settings", data)),
};

export const formBuilderService = {
  get: () => delay(read("form_fields", [])),
  save: (fields) => delay(write("form_fields", fields)),
};

export const participantService = {
  courses: () => courseService.getAll(),
  assignments: () => assignmentService.getAll(),
  attendance: () => attendanceService.getAll(),
  certificates: () => certificateService.getAll(),
};

export const adminService = {
  users: () => userService.getAll(),
  roles: () => roleService.getAll(),
  alumni: () => alumniService.getAll(),
  hosts: () => hostService.getAll(),
  placements: () => placementService.getAll(),
  volunteers: () => volunteerService.getAll(),
  audit: () => auditService.getAll(),
  templates: () => emailService.templates(),
  formFields: () => formBuilderService.get(),
  saveFormFields: (fields) => formBuilderService.save(fields),
};

export const profileService = {
  get(userId) {
    return read("profiles", {})[userId] || {};
  },
  save(userId, data) {
    const all = read("profiles", {});
    all[userId] = { ...all[userId], ...data };
    write("profiles", all);
    return all[userId];
  },
};
