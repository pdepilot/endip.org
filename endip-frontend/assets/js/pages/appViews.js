import { href } from "../utils/dom.js";
import { formatDate, formatDateTime } from "../utils/dates.js";
import { badge } from "../utils/formatting.js";
import { toast, bindTabs, confirmAction, esc, paginate, renderPagination, setBusy } from "../components/ui.js";
import { downloadCertificate, printCertificate } from "../utils/certificate.js";
import { authService } from "../services/authService.js";
import {
  programmeService,
  applicationService,
  courseService,
  assignmentService,
  attendanceService,
  certificateService,
  notificationService,
  businessService,
  eventService,
  articleService,
  impactService,
  storyService,
  partnerService,
  volunteerService,
  alumniService,
  hostService,
  placementService,
  mediaService,
  emailService,
  userService,
  roleService,
  auditService,
  settingsService,
  formBuilderService,
  profileService,
} from "../services/api.js";
import { SITE } from "../config/site.js";

function table(headers, rows) {
  if (!rows.length) return `<div class="empty-state"><h3>No records found</h3><p>Try a different search or add a new record.</p></div>`;
  return `<div class="table-wrap"><table class="data stack"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td data-label="${headers[i]}">${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function metrics(items) {
  return `<div class="grid-4">${items.map((i) => `<div class="stat-card"><div class="value">${i.v}</div><div class="label">${i.l}</div></div>`).join("")}</div>`;
}

function after(fn) {
  queueMicrotask(fn);
}

function param(name) {
  return new URLSearchParams(location.search).get(name);
}

export async function renderAppView(page) {
  const view = document.getElementById("app-view");
  if (!view) return;
  const map = {
    "p-dashboard": participantDashboard,
    "p-profile": participantProfile,
    "p-applications": myApplications,
    "p-application": applicationDetails,
    "p-programmes": myProgrammes,
    "p-programme": programmeHome,
    "p-courses": courses,
    "p-course": courseDetails,
    "p-assignments": assignments,
    "p-attendance": attendance,
    "p-certificates": certificates,
    "p-notifications": notifications,
    "p-opportunities": pOpportunities,
    "p-events": pEvents,
    "p-settings": accountSettings,
    "e-dashboard": entrepreneurDash,
    "e-profile": entrepreneurProfile,
    "e-business": entrepreneurBusiness,
    "e-business-edit": entrepreneurEdit,
    "e-programmes": pOpportunities,
    "e-opportunities": pOpportunities,
    "e-events": pEvents,
    "e-notifications": notifications,
    "e-settings": accountSettings,
    "a-dashboard": adminDash,
    "a-programmes": adminProgrammes,
    "a-programme-create": adminProgrammeForm,
    "a-programme": adminProgrammeDetail,
    "a-applications": adminApplications,
    "a-application": adminApplicationDetail,
    "a-participants": adminParticipants,
    "a-participant": adminParticipant,
    "a-courses": adminCourses,
    "a-attendance": adminAttendance,
    "a-course-create": adminCourseForm,
    "a-events": adminEvents,
    "a-event-create": adminEventForm,
    "a-businesses": adminBusinesses,
    "a-business": adminBusiness,
    "a-alumni": adminAlumni,
    "a-internships": adminInternships,
    "a-hosts": adminHosts,
    "a-certificates": adminCertificates,
    "a-partners": adminPartners,
    "a-volunteers": adminVolunteers,
    "a-stories": adminStories,
    "a-impact": adminImpact,
    "a-articles": adminArticles,
    "a-media": adminMedia,
    "a-email": adminEmail,
    "a-notifications": adminNotes,
    "a-users": adminUsers,
    "a-roles": adminRoles,
    "a-audit": adminAudit,
    "a-settings": adminSettings,
  };
  const fn = map[page];
  view.innerHTML = fn ? await fn() : `<div class="empty-state"><h3>Page not found</h3></div>`;
  bindTabs(view);
}

async function participantDashboard() {
  const u = authService.current();
  const apps = await applicationService.forUser(u.id);
  const coursesAll = await courseService.getAll();
  const course = coursesAll[0];
  const pct = course ? courseService.percent(u.id, course) : 0;
  const att = await attendanceService.forUser(u.id);
  const present = att.filter((a) => a.status === "Present").length;
  const notes = await notificationService.forUser(u.id);
  const accepted = apps.find((a) => a.status === "Accepted");
  const programmes = await programmeService.getAll();
  const current = programmes.find((p) => p.id === (accepted?.programmeId || u.programme));
  const profile = profileService.get(u.id);
  const complete = Math.round((["phone", "location", "skills"].filter((k) => profile[k]).length / 3) * 100);
  return `<h1>Welcome, ${esc(u.name.split(" ")[0])}</h1>
    ${metrics([
      { v: `${complete}%`, l: "Profile complete" },
      { v: apps[0]?.status || "—", l: "Latest application" },
      { v: `${pct}%`, l: "Course progress" },
      { v: att.length ? `${Math.round((present / att.length) * 100)}%` : "—", l: "Attendance" },
    ])}
    <div class="grid-2" style="margin-top:20px">
      <div class="card"><div class="card-body">
        <h3>Current programme</h3>
        <p>${current ? esc(current.title) : "No programme assigned yet."}</p>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <p><a href="${href("participant/programme-dashboard.html")}">Open programme home</a></p>
      </div></div>
      <div class="card"><div class="card-body">
        <h3>Notifications</h3>
        <p>${notes.filter((n) => !n.read).length} unread</p>
        <a class="btn btn-primary btn-sm" href="${href("participant/notifications.html")}">Open</a>
      </div></div>
    </div>`;
}

function participantProfile() {
  const u = authService.current();
  const p = profileService.get(u.id);
  after(() => {
    document.getElementById("save-profile")?.addEventListener("click", () => {
      profileService.save(u.id, {
        phone: document.getElementById("phone").value,
        location: document.getElementById("location").value,
        skills: document.getElementById("skills").value,
      });
      toast("Profile saved.");
    });
  });
  return `<h1>My profile</h1>
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Name</label><input value="${esc(u?.name || "")}" disabled></div>
      <div class="field"><label>Email</label><input value="${esc(u?.email || "")}" disabled></div>
      <div class="field"><label for="phone">Phone</label><input id="phone" value="${esc(p.phone || "")}"></div>
      <div class="field"><label for="location">Location</label><input id="location" value="${esc(p.location || "")}"></div>
      <div class="field" style="grid-column:1/-1"><label for="skills">Skills</label><input id="skills" value="${esc(p.skills || "")}"></div>
    </div>
    <div class="card-body"><button class="btn btn-primary" id="save-profile">Save</button></div></div>`;
}

async function myApplications() {
  const u = authService.current();
  const apps = await applicationService.forUser(u.id);
  const programmes = await programmeService.getAll();
  return `<div class="app-top"><h1>My applications</h1><a class="btn btn-primary" href="${href("programmes.html")}">Apply</a></div>${table(
    ["Reference", "Programme", "Date", "Status", ""],
    apps.map((a) => {
      const p = programmes.find((x) => x.id === a.programmeId);
      return [a.ref || a.id, p?.title || a.programmeId, formatDate(a.date), badge(a.status), `<a href="${href("participant/application-details.html")}?id=${a.id}">View</a>`];
    })
  )}`;
}

async function applicationDetails() {
  const u = authService.current();
  const a = await applicationService.getById(param("id"));
  if (!a || a.userId !== u.id) return `<div class="empty-state"><h3>Application not found</h3><p>This application is not available in your account.</p></div>`;
  const p = await programmeService.getById(a.programmeId);
  const canWithdraw = ["Draft", "Submitted", "Under Review", "Waitlisted"].includes(a.status);
  after(() => {
    document.getElementById("withdraw")?.addEventListener("click", async () => {
      if (!confirmAction("Withdraw this application?")) return;
      await applicationService.updateStatus(a.id, "Withdrawn");
      toast("Application withdrawn.");
      location.reload();
    });
  });
  return `<h1>${esc(p?.title || "Application")}</h1>
    <p>${badge(a.status)} · ${esc(a.ref || a.id)}</p>
    <h2>Timeline</h2>
    <div class="timeline">${(a.timeline || []).map((t) => `<div class="timeline-item"><strong>${esc(t.label)}</strong> · ${formatDate(t.at)}</div>`).join("")}</div>
    <h2>Submitted information</h2>
    <p>${Object.entries(a.answers || {}).map(([k, v]) => `<strong>${esc(k)}</strong>: ${esc(v)}`).join("<br>")}</p>
    <h2>Documents</h2>
    <p>${(a.documents || []).map((d) => esc(d.name)).join(", ") || "No documents attached."}</p>
    ${canWithdraw ? `<button class="btn btn-outline" id="withdraw">Withdraw application</button>` : ""}`;
}

async function myProgrammes() {
  const u = authService.current();
  const apps = (await applicationService.forUser(u.id)).filter((a) => ["Accepted", "Shortlisted", "Interview"].includes(a.status));
  const programmes = await programmeService.getAll();
  const items = programmes.filter((p) => apps.some((a) => a.programmeId === p.id) || p.id === u.programme);
  return `<h1>My programmes</h1>${
    items.length
      ? `<div class="grid-2">${items
          .map((p) => `<div class="card"><div class="card-body"><h3>${esc(p.title)}</h3><p>${badge("Enrolled")}</p><a href="${href("participant/programme-dashboard.html")}">Open</a></div></div>`)
          .join("")}</div>`
      : `<div class="empty-state"><h3>No programmes yet</h3><p>Accepted applications will appear here.</p></div>`
  }`;
}

async function programmeHome() {
  const u = authService.current();
  const course = (await courseService.getAll())[0];
  const pct = course ? courseService.percent(u.id, course) : 0;
  const open = (await assignmentService.getAll()).filter((a) => a.status === "Open").length;
  return `<h1>Programme home</h1>
    <div class="grid-3">
      <div class="stat-card"><div class="value">${pct}%</div><div class="label">Modules</div></div>
      <div class="stat-card"><div class="value">${open}</div><div class="label">Open assignments</div></div>
      <div class="stat-card"><div class="value">Assigned</div><div class="label">Support</div></div>
    </div>
    <p><a class="btn btn-primary" href="${href("participant/courses.html")}">Continue learning</a></p>`;
}

async function courses() {
  const u = authService.current();
  const list = await courseService.getAll();
  return `<h1>Courses</h1>${list
    .map((c) => {
      const pct = courseService.percent(u.id, c);
      return `<div class="card"><div class="card-body">
      <h3>${esc(c.title)}</h3>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <p>${pct}% complete</p>
      <a class="btn btn-primary btn-sm" href="${href("participant/course-details.html")}?id=${c.id}">Continue</a>
    </div></div>`;
    })
    .join("")}`;
}

async function courseDetails() {
  const u = authService.current();
  const id = param("id");
  const c = (await courseService.getAll()).find((x) => x.id === id) || (await courseService.getAll())[0];
  if (!c) return `<div class="empty-state"><h3>No courses available</h3><p>Courses appear here when you are enrolled.</p></div>`;
  const done = courseService.progressFor(u.id)[c.id] || {};
  after(() => {
    document.querySelectorAll("[data-lesson]").forEach((b) => {
      b.addEventListener("click", async () => {
        await courseService.toggleLesson(u.id, c.id, b.dataset.lesson);
        document.getElementById("app-view").innerHTML = await courseDetails();
        bindTabs(document.getElementById("app-view"));
        toast("Progress saved.");
      });
    });
    document.getElementById("quiz")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const choice = new FormData(e.target).get("q1");
      toast(choice === "ok" ? "Correct. Lesson marked complete." : "Review the material and try again.");
      if (choice === "ok") {
        await courseService.setLesson(u.id, c.id, "l4", true);
        document.getElementById("app-view").innerHTML = await courseDetails();
      }
    });
  });
  return `<h1>${esc(c.title)}</h1>
    ${c.modules
      .map(
        (m) => `<div class="card" style="margin-bottom:12px"><div class="card-body">
        <h3>${esc(m.title)}</h3>
        <ul>${m.lessons
          .map(
            (l) =>
              `<li>${esc(l.title)} · ${esc(l.type)} · ${l.minutes} min ${done[l.id] ? badge("Complete") : ""} <button class="btn btn-sm btn-outline" data-lesson="${l.id}">${done[l.id] ? "Undo" : "Mark complete"}</button></li>`
          )
          .join("")}</ul>
        <div class="card" style="background:var(--bg)"><div class="card-body">Lesson space — video and reading materials will attach from the media library.</div></div>
      </div></div>`
      )
      .join("")}
    <h2>Quiz</h2>
    <form class="card" id="quiz"><div class="card-body">
      <p>Which practice supports a professional placement?</p>
      <label class="radio"><input type="radio" name="q1" value="ok"> Arrive prepared and follow host guidance</label>
      <label class="radio"><input type="radio" name="q1" value="no"> Ignore supervisor feedback</label>
      <button class="btn btn-primary" type="submit">Submit quiz</button>
    </div></form>`;
}

async function assignments() {
  const u = authService.current();
  const items = (await assignmentService.getAll()).filter((a) => a.userId === u.id);
  const openId = param("id") || items[0]?.id;
  const current = items.find((a) => a.id === openId);
  after(() => {
    document.getElementById("submit-as")?.addEventListener("click", async () => {
      const comments = document.getElementById("as-comments").value;
      const file = document.getElementById("as-file").files[0];
      await assignmentService.submit(current.id, { comments, file: file?.name || "submission" });
      toast("Assignment submitted.");
      document.getElementById("app-view").innerHTML = await assignments();
    });
  });
  return `<h1>Assignments</h1>
    ${table(
      ["Title", "Due", "Status", ""],
      items.map((a) => [esc(a.title), formatDate(a.due), badge(a.status), `<a href="?id=${a.id}">Open</a>`])
    )}
    ${
      current
        ? `<div class="card" style="margin-top:16px"><div class="card-body">
      <h3>${esc(current.title)}</h3>
      <p>Deadline ${formatDate(current.due)}</p>
      <p>${esc(current.feedback || "Submit your work before the deadline.")}</p>
      <div class="field"><label for="as-file">File</label><input id="as-file" type="file"></div>
      <div class="field"><label for="as-comments">Comments</label><textarea id="as-comments"></textarea></div>
      <button class="btn btn-primary" id="submit-as">Submit</button>
    </div></div>`
        : ""
    }`;
}

async function attendance() {
  const u = authService.current();
  const items = await attendanceService.forUser(u.id);
  const pct = items.length ? Math.round((items.filter((i) => i.status === "Present").length / items.length) * 100) : 0;
  const marks = Object.fromEntries(items.map((i) => [i.date, i.status]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  return `<h1>Attendance</h1>
    <div class="stat-card" style="max-width:240px;margin-bottom:16px"><div class="value">${pct}%</div><div class="label">Present</div></div>
    <div class="cal-row">${days.map((d) => `<span class="cal-day" title="${d}">${d.slice(8)} ${marks[d] ? badge(marks[d]) : ""}</span>`).join("")}</div>
    ${table(
      ["Date", "Session", "Status"],
      items.map((i) => [formatDate(i.date), esc(i.session), badge(i.status)])
    )}`;
}

async function certificates() {
  const u = authService.current();
  const items = await certificateService.forUser(u.id);
  after(() => {
    document.querySelectorAll("[data-print]").forEach((b) => {
      b.addEventListener("click", () => {
        const cert = items.find((c) => c.id === b.dataset.print);
        if (!printCertificate(cert)) downloadCertificate(cert);
      });
    });
    document.querySelectorAll("[data-dl]").forEach((b) => {
      b.addEventListener("click", () => downloadCertificate(items.find((c) => c.id === b.dataset.dl)));
    });
  });
  return `<h1>Certificates</h1>${
    items.length
      ? items
          .map(
            (c) => `<div class="card"><div class="card-body">
        <h3>${esc(c.programme)}</h3>
        <p>No. ${esc(c.number)}<br>Completed ${formatDate(c.completed)}</p>
        <p>${badge(c.status)}</p>
        <div class="btn-group">
          <a class="btn btn-primary" href="${href("verify.html")}?n=${c.number}">Verify</a>
          <button class="btn btn-outline" data-print="${c.id}">Print</button>
          <button class="btn btn-outline" data-dl="${c.id}">Download</button>
        </div>
      </div></div>`
          )
          .join("")
      : `<div class="empty-state"><h3>No certificates yet</h3><p>Certificates appear here when issued.</p></div>`
  }`;
}

async function notifications() {
  const u = authService.current();
  const items = await notificationService.forUser(u.id);
  after(() => {
    document.getElementById("read-all")?.addEventListener("click", async () => {
      await notificationService.markAll(u.id);
      document.getElementById("app-view").innerHTML = await notifications();
    });
    document.querySelectorAll("[data-read]").forEach((b) => {
      b.addEventListener("click", async () => {
        await notificationService.markRead(b.dataset.read);
        document.getElementById("app-view").innerHTML = await notifications();
      });
    });
  });
  return `<div class="app-top"><h1>Notifications</h1><button class="btn btn-outline" id="read-all">Mark all read</button></div>
    ${
      items.length
        ? items
            .map(
              (n) => `<div class="card" style="margin-bottom:8px"><div class="card-body">
        <strong>${esc(n.title)}</strong> ${n.read ? "" : badge("Unread")}
        <p>${esc(n.body)}</p>
        ${n.read ? "" : `<button class="btn btn-sm btn-outline" data-read="${n.id}">Mark as read</button>`}
      </div></div>`
            )
            .join("")
        : `<div class="empty-state"><p>No notifications.</p></div>`
    }`;
}

function pOpportunities() {
  return `<h1>Opportunities</h1><p><a class="btn btn-primary" href="${href("opportunities.html")}">Open opportunity hub</a></p>`;
}

async function pEvents() {
  const events = (await eventService.getAll()).filter((e) => e.timeframe === "upcoming");
  return `<h1>Events</h1>${
    events.length
      ? events.map((e) => `<div class="card"><div class="card-body"><h3>${esc(e.title)}</h3><p>${formatDate(e.date)}</p><a href="${href("event-details.html")}?id=${e.slug}">Register</a></div></div>`).join("")
      : `<div class="empty-state"><p>No upcoming events.</p></div>`
  }`;
}

function accountSettings() {
  const u = authService.current();
  const p = profileService.get(u.id);
  after(() => {
    document.getElementById("save-set")?.addEventListener("click", () => {
      profileService.save(u.id, {
        notifyApps: document.getElementById("n-apps").checked,
        notifyEvents: document.getElementById("n-events").checked,
      });
      toast("Preferences saved.");
    });
  });
  return `<h1>Settings</h1><div class="card"><div class="card-body">
    <label class="check"><input id="n-apps" type="checkbox" ${p.notifyApps !== false ? "checked" : ""}> Email me about applications</label>
    <label class="check"><input id="n-events" type="checkbox" ${p.notifyEvents !== false ? "checked" : ""}> Notify me about events</label>
    <button class="btn btn-primary" id="save-set">Save</button>
  </div></div>`;
}

async function entrepreneurDash() {
  const u = authService.current();
  const all = await businessService.getAll();
  const mine = all.find((b) => b.ownerId === u.id);
  return `<h1>Dashboard</h1>
    ${metrics([
      { v: mine ? "100%" : "20%", l: "Profile completeness" },
      { v: mine?.status || "Not started", l: "Directory status" },
      { v: (await notificationService.forUser(u.id)).filter((n) => !n.read).length, l: "Unread" },
    ])}
    <p>${mine ? `${esc(mine.name)} is ${esc(mine.status)}.` : "Create your business profile to request a directory listing."}</p>
    <a class="btn btn-primary" href="${href("entrepreneur/business-edit.html")}">${mine ? "Edit business" : "Create business"}</a>`;
}

function entrepreneurProfile() {
  return participantProfile();
}

async function entrepreneurBusiness() {
  const u = authService.current();
  const mine = (await businessService.getAll()).find((b) => b.ownerId === u.id);
  if (!mine) return `<h1>Business</h1><div class="empty-state"><p>No business profile yet.</p><a class="btn btn-primary" href="${href("entrepreneur/business-edit.html")}">Create</a></div>`;
  return `<h1>${esc(mine.name)}</h1>
    <p>${badge(mine.status)} ${mine.verified ? badge("Verified") : ""}</p>
    <p>${esc(mine.description || "")}</p>
    <a class="btn btn-primary" href="${href("entrepreneur/business-edit.html")}">Edit profile</a>`;
}

async function entrepreneurEdit() {
  const u = authService.current();
  const mine = (await businessService.getAll()).find((b) => b.ownerId === u.id) || {};
  after(() => {
    document.getElementById("biz-save")?.addEventListener("click", async (e) => {
      const name = document.getElementById("bname").value.trim();
      if (!name) return toast("Enter a business name.");
      setBusy(e.currentTarget, true, "Submitting…");
      try {
        const payload = {
          ownerId: u.id,
          name,
          founder: u.name,
          sector: document.getElementById("bsector").value,
          location: document.getElementById("bloc").value,
          description: document.getElementById("bdesc").value,
          products: document.getElementById("bprod").value.split(",").map((s) => s.trim()).filter(Boolean),
          website: document.getElementById("bweb").value,
          status: "Pending",
          verified: false,
        };
        if (mine.id) await businessService.update(mine.id, payload);
        else await businessService.create(payload);
        toast("Business profile submitted for review.");
        location.href = href("entrepreneur/business.html");
      } catch {
        toast("Could not save the business profile.");
        setBusy(e.currentTarget, false);
      }
    });
  });
  return `<h1>Business profile</h1>
    <form class="card"><div class="card-body grid-2">
      <div class="field"><label for="bname">Business name</label><input id="bname" value="${esc(mine.name || "")}"></div>
      <div class="field"><label for="bsector">Sector</label><input id="bsector" value="${esc(mine.sector || "")}"></div>
      <div class="field"><label for="bloc">Location</label><input id="bloc" value="${esc(mine.location || "")}"></div>
      <div class="field"><label for="bweb">Website</label><input id="bweb" value="${esc(mine.website || "")}"></div>
      <div class="field" style="grid-column:1/-1"><label for="bdesc">Description</label><textarea id="bdesc">${esc(mine.description || "")}</textarea></div>
      <div class="field" style="grid-column:1/-1"><label for="bprod">Products / services</label><input id="bprod" value="${esc((mine.products || []).join(", "))}"></div>
    </div>
    <div class="card-body"><button class="btn btn-primary" type="button" id="biz-save">Save and submit</button></div></form>`;
}

async function adminDash() {
  const apps = await applicationService.getAll();
  const biz = await businessService.getAll();
  const events = await eventService.getAll();
  const users = await userService.getAll();
  const logs = await auditService.getAll();
  const pipeline = ["Submitted", "Under Review", "Shortlisted", "Accepted", "Rejected"];
  return `<h1>Administration</h1>
    ${metrics([
      { v: apps.length, l: "Applications" },
      { v: users.filter((u) => u.role === "Participant").length, l: "Participants" },
      { v: (await programmeService.getAll()).length, l: "Programmes" },
      { v: biz.length, l: "Businesses" },
    ])}
    <div class="grid-2" style="margin-top:20px">
      <div class="card"><div class="card-body">
        <h3>Application pipeline</h3>
        ${pipeline.map((s) => `<p>${s}: <strong>${apps.filter((a) => a.status === s).length}</strong></p>`).join("")}
      </div></div>
      <div class="card"><div class="card-body">
        <h3>Pending businesses</h3>
        <p>${biz.filter((b) => b.status === "Pending").length} awaiting approval</p>
        <p>Upcoming events: ${events.filter((e) => e.timeframe === "upcoming").length}</p>
      </div></div>
    </div>
    <h2>Recent activity</h2>
    ${table(
      ["When", "Action"],
      logs.slice(0, 6).map((l) => [formatDateTime(l.at), esc(l.action)])
    )}`;
}

async function adminProgrammes() {
  const items = await programmeService.getAll();
  after(() => {
    const draw = () => {
      const q = document.getElementById("pq")?.value.toLowerCase() || "";
      const st = document.getElementById("pst")?.value || "";
      const filtered = items.filter((p) => (!q || p.title.toLowerCase().includes(q)) && (!st || p.status === st));
      document.getElementById("prog-table").innerHTML = table(
        ["Title", "Status", "Deadline", ""],
        filtered.map((p) => [
          esc(p.title),
          badge(p.status),
          p.deadline ? formatDate(p.deadline) : "—",
          `<a href="${href("admin/programme-details.html")}?id=${p.id}">Open</a>
           <button class="btn btn-sm btn-outline" data-pub="${p.id}" data-status="${p.status === "OPEN" ? "CLOSED" : "OPEN"}">${p.status === "OPEN" ? "Unpublish" : "Publish"}</button>
           <button class="btn btn-sm btn-outline" data-arch="${p.id}">Archive</button>
           <button class="btn btn-sm btn-danger" data-del="${p.id}">Delete</button>`,
        ])
      );
      document.querySelectorAll("[data-pub]").forEach((b) => {
        b.addEventListener("click", async () => {
          await programmeService.update(b.dataset.pub, { status: b.dataset.status });
          toast("Programme updated.");
          document.getElementById("app-view").innerHTML = await adminProgrammes();
        });
      });
      document.querySelectorAll("[data-arch]").forEach((b) => {
        b.addEventListener("click", async () => {
          await programmeService.update(b.dataset.arch, { status: "CLOSED", archived: true });
          toast("Programme archived.");
          document.getElementById("app-view").innerHTML = await adminProgrammes();
        });
      });
      document.querySelectorAll("[data-del]").forEach((b) => {
        b.addEventListener("click", async () => {
          if (!confirmAction("Delete this programme?")) return;
          await programmeService.remove(b.dataset.del);
          toast("Programme deleted.");
          document.getElementById("app-view").innerHTML = await adminProgrammes();
        });
      });
    };
    document.getElementById("pq")?.addEventListener("input", draw);
    document.getElementById("pst")?.addEventListener("change", draw);
    draw();
  });
  return `<div class="app-top"><h1>Programmes</h1><a class="btn btn-primary" href="${href("admin/programme-create.html")}">Create</a></div>
    <div class="filter-bar">
      <div class="field"><label for="pq">Search</label><input id="pq" type="search"></div>
      <div class="field"><label for="pst">Status</label><select id="pst"><option value="">All</option><option>OPEN</option><option>COMING SOON</option><option>ONGOING</option><option>CLOSED</option><option>COMPLETED</option></select></div>
    </div>
    <div id="prog-table"></div>`;
}

function adminProgrammeForm() {
  after(async () => {
    initBuilder(document.getElementById("builder"), await formBuilderService.get());
    document.getElementById("prog-save")?.addEventListener("click", async () => {
      const title = document.getElementById("ptitle").value;
      if (!title.trim()) return toast("Enter a title.");
      await programmeService.create({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: document.getElementById("pcat").value,
        type: "Capacity development",
        cover: "cover-elearn",
        short: document.getElementById("pshort").value,
        description: document.getElementById("pshort").value,
        objectives: [],
        eligibility: "",
        whoCanApply: "",
        duration: "To be published",
        location: "Nigeria",
        delivery: "To be published",
        status: document.getElementById("pstatus").value,
        deadline: document.getElementById("pdead").value,
        featured: false,
        structure: [],
        outcomes: [],
        faqs: [],
      });
      toast("Programme saved.");
      location.href = href("admin/programmes.html");
    });
  });
  return `<h1>Create programme</h1>
    <form class="card"><div class="card-body grid-2">
      <div class="field"><label>Title</label><input id="ptitle"></div>
      <div class="field"><label>Status</label><select id="pstatus"><option>OPEN</option><option>COMING SOON</option><option>ONGOING</option><option>CLOSED</option><option>COMPLETED</option></select></div>
      <div class="field"><label>Category</label><input id="pcat" value="Training"></div>
      <div class="field"><label>Deadline</label><input id="pdead" type="date"></div>
      <div class="field" style="grid-column:1/-1"><label>Short description</label><textarea id="pshort"></textarea></div>
    </div><div class="card-body"><button class="btn btn-primary" type="button" id="prog-save">Save</button></div></form>
    <h2>Application form builder</h2>
    <div id="builder"></div>`;
}

async function adminProgrammeDetail() {
  const p = await programmeService.getById(param("id"));
  if (!p) return `<div class="empty-state"><h3>Programme not found</h3><p><a href="${href("admin/programmes.html")}">Back to programmes</a></p></div>`;
  const fields = await formBuilderService.get();
  after(() => {
    initBuilder(document.getElementById("builder-live"), fields);
    document.getElementById("psave")?.addEventListener("click", async (e) => {
      setBusy(e.currentTarget, true);
      try {
        await programmeService.update(p.id, {
          title: document.getElementById("etitle").value,
          status: document.getElementById("estatus").value,
          description: document.getElementById("edesc").value,
          short: document.getElementById("edesc").value,
          deadline: document.getElementById("edead").value,
        });
        toast("Programme saved.");
      } catch {
        toast("Save failed. Please try again.");
      } finally {
        setBusy(e.currentTarget, false);
      }
    });
  });
  return `<h1>Edit programme</h1>
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label for="etitle">Title</label><input id="etitle" value="${esc(p.title)}"></div>
      <div class="field"><label for="estatus">Status</label><select id="estatus">${["OPEN","COMING SOON","ONGOING","CLOSED","COMPLETED"].map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label for="edead">Deadline</label><input id="edead" type="date" value="${esc(p.deadline || "")}"></div>
      <div class="field" style="grid-column:1/-1"><label for="edesc">Description</label><textarea id="edesc">${esc(p.description || "")}</textarea></div>
    </div><div class="card-body"><button class="btn btn-primary" id="psave">Save</button></div></div>
    <h2>Form builder</h2>
    <div id="builder-live"></div>`;
}

function initBuilder(root, fields) {
  if (!root) return;
  const types = ["text", "textarea", "email", "phone", "date", "number", "select", "radio", "checkbox", "file", "heading", "paragraph"];
  const draw = (list) => {
    root.innerHTML =
      list
        .map(
          (f, i) => `<div class="card" style="margin-bottom:8px"><div class="card-body" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <span><strong>${esc(f.label)}</strong> · ${esc(f.type)} ${f.required ? "(required)" : ""}</span>
          <span class="btn-group">
            <button class="btn btn-sm btn-outline" data-up="${i}">Up</button>
            <button class="btn btn-sm btn-outline" data-down="${i}">Down</button>
            <button class="btn btn-sm btn-outline" data-edit="${i}">Edit</button>
            <button class="btn btn-sm btn-outline" data-dup="${i}">Duplicate</button>
            <button class="btn btn-sm btn-outline" data-req="${i}">${f.required ? "Optional" : "Required"}</button>
            <button class="btn btn-sm btn-danger" data-del="${i}">Delete</button>
          </span>
        </div></div>`
        )
        .join("") +
      `<div class="btn-group" style="flex-wrap:wrap">${types.map((t) => `<button class="btn btn-outline btn-sm" data-add="${t}">Add ${t}</button>`).join("")}
      <button class="btn btn-primary btn-sm" data-preview>Preview</button></div>
      <div id="builder-preview" hidden class="card" style="margin-top:12px"></div>`;
    root.querySelectorAll("[data-add]").forEach((b) =>
      b.addEventListener("click", () => {
        list.push({ id: "f" + Date.now(), type: b.dataset.add, label: b.dataset.add[0].toUpperCase() + b.dataset.add.slice(1), required: false });
        formBuilderService.save(list);
        draw(list);
      })
    );
    root.querySelector("[data-preview]")?.addEventListener("click", () => {
      const box = root.querySelector("#builder-preview");
      box.hidden = false;
      box.innerHTML = `<div class="card-body">${list
        .map((f) => {
          if (f.type === "heading") return `<h3>${esc(f.label)}</h3>`;
          if (f.type === "paragraph") return `<p>${esc(f.label)}</p>`;
          if (f.type === "textarea") return `<div class="field"><label>${esc(f.label)}</label><textarea ${f.required ? "required" : ""}></textarea></div>`;
          if (f.type === "select") return `<div class="field"><label>${esc(f.label)}</label><select><option>Option 1</option><option>Option 2</option></select></div>`;
          if (f.type === "radio") return `<fieldset class="field"><legend>${esc(f.label)}</legend><label class="radio"><input type="radio" name="${f.id}"> Option 1</label></fieldset>`;
          if (f.type === "checkbox") return `<label class="check"><input type="checkbox"> ${esc(f.label)}</label>`;
          if (f.type === "file") return `<div class="field"><label>${esc(f.label)}</label><input type="file"></div>`;
          return `<div class="field"><label>${esc(f.label)}</label><input type="${["email","phone","date","number"].includes(f.type) ? (f.type === "phone" ? "tel" : f.type) : "text"}" ${f.required ? "required" : ""}></div>`;
        })
        .join("")}</div>`;
    });
    root.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        if (!confirmAction("Remove this field?")) return;
        list.splice(Number(b.dataset.del), 1);
        formBuilderService.save(list);
        draw(list);
      })
    );
    root.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.edit);
        const label = window.prompt("Field label", list[i].label);
        if (label == null) return;
        list[i].label = label.trim() || list[i].label;
        formBuilderService.save(list);
        draw(list);
      })
    );
    root.querySelectorAll("[data-dup]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.dup);
        list.splice(i + 1, 0, { ...list[i], id: "f" + Date.now() });
        formBuilderService.save(list);
        draw(list);
      })
    );
    root.querySelectorAll("[data-req]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.req);
        list[i].required = !list[i].required;
        formBuilderService.save(list);
        draw(list);
      })
    );
    root.querySelectorAll("[data-up]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.up);
        if (i < 1) return;
        [list[i - 1], list[i]] = [list[i], list[i - 1]];
        formBuilderService.save(list);
        draw(list);
      })
    );
    root.querySelectorAll("[data-down]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = Number(b.dataset.down);
        if (i >= list.length - 1) return;
        [list[i + 1], list[i]] = [list[i], list[i + 1]];
        formBuilderService.save(list);
        draw(list);
      })
    );
  };
  draw(fields);
}

async function adminApplications() {
  const apps = await applicationService.getAll();
  const programmes = await programmeService.getAll();
  after(() => {
    const render = () => {
      const q = document.getElementById("aq")?.value.toLowerCase() || "";
      const st = document.getElementById("ast")?.value || "";
      const filtered = apps.filter((a) => (!q || (a.ref || a.id).toLowerCase().includes(q) || (a.answers?.fullName || "").toLowerCase().includes(q)) && (!st || a.status === st));
      document.getElementById("app-table").innerHTML = table(
        ["Reference", "Applicant", "Programme", "Status", ""],
        filtered.map((a) => [
          a.ref || a.id,
          esc(a.answers?.fullName || "—"),
          esc(programmes.find((p) => p.id === a.programmeId)?.title || a.programmeId),
          badge(a.status),
          `<a href="${href("admin/application-details.html")}?id=${a.id}">Review</a>`,
        ])
      );
    };
    document.getElementById("aq")?.addEventListener("input", render);
    document.getElementById("ast")?.addEventListener("change", render);
    render();
  });
  return `<h1>Applications</h1>
    <div class="filter-bar">
      <input id="aq" placeholder="Search">
      <select id="ast"><option value="">All statuses</option>${["Draft","Submitted","Under Review","Shortlisted","Interview","Accepted","Rejected","Waitlisted","Withdrawn"].map((s) => `<option>${s}</option>`).join("")}</select>
    </div>
    <div id="app-table"></div>`;
}

async function adminApplicationDetail() {
  const a = await applicationService.getById(param("id") || "app-1001");
  if (!a) return `<div class="empty-state">Application not found.</div>`;
  after(() => {
    document.getElementById("status-save")?.addEventListener("click", async () => {
      const status = document.getElementById("new-status").value;
      const note = document.getElementById("note").value;
      await applicationService.updateStatus(a.id, status, note);
      toast("Application updated.");
      location.reload();
    });
  });
  return `<h1>Review ${esc(a.ref || a.id)}</h1>
    <p>${badge(a.status)}</p>
    <h2>Answers</h2><p>${Object.entries(a.answers || {}).map(([k, v]) => `<strong>${esc(k)}</strong>: ${esc(v)}`).join("<br>")}</p>
    <h2>Documents</h2><p>${(a.documents || []).map((d) => esc(d.name)).join(", ") || "None"}</p>
    <h2>Timeline</h2><div class="timeline">${(a.timeline || []).map((t) => `<div class="timeline-item">${esc(t.label)} · ${formatDate(t.at)}</div>`).join("")}</div>
    <h2>Change status</h2>
    <select id="new-status">${["Draft","Submitted","Under Review","Shortlisted","Interview","Accepted","Rejected","Waitlisted","Withdrawn"].map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select>
    <div class="field"><label for="note">Internal note</label><textarea id="note"></textarea></div>
    <button class="btn btn-primary" id="status-save">Update</button>`;
}

async function adminParticipants() {
  const users = (await userService.getAll()).filter((u) => u.role === "Participant" || u.role === "Alumni");
  return `<h1>Participants</h1>${table(
    ["Name", "Email", "Programme", ""],
    users.map((u) => [esc(u.name), esc(u.email), u.programme || "—", `<a href="${href("admin/participant-details.html")}?id=${u.id}">Open</a>`])
  )}`;
}

async function adminParticipant() {
  const u = await userService.getById(param("id"));
  if (!u) return `<div class="empty-state"><h3>Participant not found</h3><p><a href="${href("admin/participants.html")}">Back to participants</a></p></div>`;
  const apps = await applicationService.forUser(u.id);
  after(() => {
    document.getElementById("assign")?.addEventListener("click", async () => {
      await userService.update(u.id, { programme: document.getElementById("assign-p").value });
      toast("Participant assigned.");
    });
  });
  const programmes = await programmeService.getAll();
  return `<h1>${esc(u.name)}</h1>
    <p>${esc(u.email)} · ${esc(u.role)}</p>
    <h2>Applications</h2>
    ${table(["Ref", "Status"], apps.map((a) => [a.ref || a.id, badge(a.status)]))}
    <h2>Assign programme</h2>
    <select id="assign-p">${programmes.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join("")}</select>
    <button class="btn btn-primary" id="assign">Assign</button>`;
}

async function adminCourses() {
  const items = await courseService.getAll();
  const assignments = await assignmentService.getAll();
  after(() => {
    document.querySelectorAll("[data-grade]").forEach((b) => {
      b.addEventListener("click", async () => {
        const score = window.prompt("Score (0–100)", "80");
        const feedback = window.prompt("Feedback", "Well done.");
        if (score == null) return;
        await assignmentService.grade(b.dataset.grade, score, feedback || "");
        toast("Assignment graded.");
        document.getElementById("app-view").innerHTML = await adminCourses();
      });
    });
  });
  return `<div class="app-top"><h1>Training</h1><a class="btn btn-primary" href="${href("admin/course-create.html")}">Create course</a></div>
    ${items.map((c) => `<div class="card"><div class="card-body"><h3>${esc(c.title)}</h3><p>${c.modules.length} modules</p></div></div>`).join("")}
    <h2>Assignments to grade</h2>
    ${table(["Title", "Status", ""], assignments.map((a) => [esc(a.title), badge(a.status), a.status === "Submitted" ? `<button class="btn btn-sm btn-primary" data-grade="${a.id}">Grade</button>` : "—"]))}`;
}

async function adminAttendance() {
  const items = await attendanceService.getAll();
  const users = (await userService.getAll()).filter((u) => u.role === "Participant");
  const marks = Object.fromEntries(items.map((i) => [i.date, i.status]));
  after(() => {
    document.getElementById("rec-att")?.addEventListener("click", async () => {
      const userId = document.getElementById("auser").value;
      const date = document.getElementById("adate").value;
      const session = document.getElementById("asess").value;
      if (!userId || !date || !session) return toast("Select a participant, date and session.");
      await attendanceService.record({
        userId,
        date,
        session,
        status: document.getElementById("astat").value,
      });
      toast("Attendance recorded.");
      document.getElementById("app-view").innerHTML = await adminAttendance();
    });
  });
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  return `<h1>Attendance</h1>
    <div class="cal-row">${days.map((d) => `<span class="cal-day" title="${d}">${d.slice(8)} ${marks[d] ? badge(marks[d]) : ""}</span>`).join("")}</div>
    ${table(["Date", "Session", "Status"], items.map((i) => [formatDate(i.date), esc(i.session), badge(i.status)]))}
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Participant</label><select id="auser">${users.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Date</label><input id="adate" type="date"></div>
      <div class="field"><label>Session</label><input id="asess"></div>
      <div class="field"><label>Status</label><select id="astat"><option>Present</option><option>Absent</option><option>Late</option><option>Excused</option></select></div>
    </div><div class="card-body"><button class="btn btn-primary" id="rec-att">Record session</button></div></div>`;
}

function adminCourseForm() {
  after(() => {
    document.getElementById("csave")?.addEventListener("click", async () => {
      await courseService.create({ title: document.getElementById("ctitle").value, modules: [{ id: "m1", title: document.getElementById("cmod").value, lessons: [] }] });
      toast("Course saved.");
      location.href = href("admin/courses.html");
    });
  });
  return `<h1>Create course</h1><div class="card"><div class="card-body">
    <div class="field"><label>Title</label><input id="ctitle"></div>
    <div class="field"><label>Module</label><input id="cmod" placeholder="Module title"></div>
    <button class="btn btn-primary" id="csave">Save</button>
  </div></div>`;
}

async function adminEvents() {
  const events = await eventService.getAll();
  after(() => {
    document.querySelectorAll("[data-ev]").forEach((b) => {
      b.addEventListener("click", async () => {
        await eventService.update(b.dataset.ev, { status: b.dataset.status });
        toast("Event updated.");
        document.getElementById("app-view").innerHTML = await adminEvents();
      });
    });
  });
  return `<div class="app-top"><h1>Events</h1><a class="btn btn-primary" href="${href("admin/event-create.html")}">Create event</a></div>
    ${table(
      ["Title", "Date", "Window", ""],
      events.map((e) => [
        esc(e.title),
        formatDate(e.date),
        e.timeframe,
        `<button class="btn btn-sm btn-outline" data-ev="${e.id}" data-status="${e.status === "Open" ? "Closed" : "Open"}">${e.status === "Open" ? "Unpublish" : "Publish"}</button>`,
      ])
    )}`;
}

function adminEventForm() {
  after(() => {
    document.getElementById("esave")?.addEventListener("click", async () => {
      const title = document.getElementById("etitle").value;
      await eventService.create({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        date: document.getElementById("edate").value,
        startTime: "09:00",
        endTime: "16:00",
        location: "Port Harcourt",
        status: "Open",
        description: document.getElementById("edesc").value,
        agenda: [],
        speakers: [],
        cover: "cover-elearn",
      });
      toast("Event saved.");
      location.href = href("admin/events.html");
    });
  });
  return `<h1>Create event</h1><div class="card"><div class="card-body grid-2">
    <div class="field"><label>Title</label><input id="etitle"></div>
    <div class="field"><label>Date</label><input id="edate" type="date"></div>
    <div class="field" style="grid-column:1/-1"><label>Description</label><textarea id="edesc"></textarea></div>
    <button class="btn btn-primary" type="button" id="esave">Save</button>
  </div></div>`;
}

async function adminBusinesses() {
  const items = await businessService.getAll();
  after(() => {
    document.querySelectorAll("[data-biz]").forEach((b) => {
      b.addEventListener("click", async () => {
        await businessService.updateStatus(b.dataset.biz, b.dataset.status);
        toast("Business status updated.");
        document.getElementById("app-view").innerHTML = await adminBusinesses();
      });
    });
    document.querySelectorAll("[data-feat]").forEach((b) => {
      b.addEventListener("click", async () => {
        const current = items.find((x) => x.id === b.dataset.feat);
        await businessService.feature(b.dataset.feat, !current?.featured);
        toast("Featured status updated.");
        document.getElementById("app-view").innerHTML = await adminBusinesses();
      });
    });
  });
  return `<h1>Businesses</h1>${
    items.length
      ? table(
          ["Name", "Status", "Actions"],
          items.map((b) => [
            `<a href="${href("admin/business-details.html")}?id=${b.id}">${esc(b.name)}</a>`,
            badge(b.status),
            `<button class="btn btn-sm btn-primary" data-biz="${b.id}" data-status="Published">Approve</button>
             <button class="btn btn-sm btn-outline" data-biz="${b.id}" data-status="Rejected">Reject</button>
             <button class="btn btn-sm btn-outline" data-feat="${b.id}">${b.featured ? "Unfeature" : "Feature"}</button>
             <button class="btn btn-sm btn-outline" data-biz="${b.id}" data-status="Unpublished">Unpublish</button>`,
          ])
        )
      : `<div class="empty-state"><h3>No businesses submitted</h3><p>Entrepreneur profiles appear here after submission.</p></div>`
  }`;
}

async function adminBusiness() {
  const b = await businessService.getById(param("id"));
  if (!b) return `<div class="empty-state">Business not found.</div>`;
  return `<h1>${esc(b.name)}</h1><p>${badge(b.status)}</p><p>${esc(b.description || "")}</p>`;
}

async function adminAlumni() {
  const rows = await alumniService.getAll();
  after(() => {
    document.getElementById("add-al")?.addEventListener("click", async () => {
      await alumniService.create({ name: document.getElementById("alname").value, programme: document.getElementById("alprog").value, cohort: document.getElementById("alcoh").value, visibility: "Limited" });
      toast("Alumni profile saved.");
      document.getElementById("app-view").innerHTML = await adminAlumni();
    });
  });
  return `<h1>Alumni</h1>${table(["Name", "Programme", "Cohort", "Visibility"], rows.map((a) => [esc(a.name), esc(a.programme), esc(a.cohort), a.visibility]))}
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Name</label><input id="alname"></div>
      <div class="field"><label>Programme</label><input id="alprog"></div>
      <div class="field"><label>Cohort</label><input id="alcoh"></div>
    </div><div class="card-body"><button class="btn btn-primary" id="add-al">Add alumni</button></div></div>`;
}

async function adminInternships() {
  const rows = await placementService.getAll();
  return `<h1>Internships</h1>${table(["Intern", "Host", "Supervisor", "Status"], rows.map((p) => [esc(p.intern), esc(p.host), esc(p.supervisor), badge(p.status)]))}`;
}

async function adminHosts() {
  const rows = await hostService.getAll();
  after(() => {
    document.getElementById("add-host")?.addEventListener("click", async () => {
      await hostService.create({ name: document.getElementById("hname").value, location: document.getElementById("hloc").value, status: "Pending" });
      toast("Host saved.");
      document.getElementById("app-view").innerHTML = await adminHosts();
    });
  });
  return `<h1>Host organisations</h1>${table(["Name", "Location", "Status"], rows.map((h) => [esc(h.name), esc(h.location), badge(h.status)]))}
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Name</label><input id="hname"></div>
      <div class="field"><label>Location</label><input id="hloc"></div>
    </div><div class="card-body"><button class="btn btn-primary" id="add-host">Add host</button></div></div>`;
}

async function adminCertificates() {
  const items = await certificateService.getAll();
  const users = await userService.getAll();
  const programmes = await programmeService.getAll();
  after(() => {
    document.getElementById("issue")?.addEventListener("click", async () => {
      const user = users.find((u) => u.id === document.getElementById("cuser").value);
      const programme = programmes.find((p) => p.id === document.getElementById("cprog").value);
      await certificateService.issue({ userId: user.id, holder: user.name, programme: programme.title });
      toast("Certificate issued.");
      document.getElementById("app-view").innerHTML = await adminCertificates();
    });
    document.querySelectorAll("[data-cdl]").forEach((b) => {
      b.addEventListener("click", () => downloadCertificate(items.find((c) => c.id === b.dataset.cdl)));
    });
  });
  return `<h1>Certificates</h1>${table(["Number", "Holder", "Programme", ""], items.map((c) => [c.number, esc(c.holder), esc(c.programme), `<button class="btn btn-sm btn-outline" data-cdl="${c.id}">Download</button>`]))}
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Participant</label><select id="cuser">${users.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Programme</label><select id="cprog">${programmes.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join("")}</select></div>
    </div><div class="card-body"><button class="btn btn-primary" id="issue">Issue certificate</button></div></div>`;
}

async function adminPartners() {
  const rows = await partnerService.getAll();
  after(() => {
    document.getElementById("add-p")?.addEventListener("click", async () => {
      await partnerService.create({ name: document.getElementById("pname").value, type: document.getElementById("ptype").value, status: "Published" });
      toast("Partner saved.");
      document.getElementById("app-view").innerHTML = await adminPartners();
    });
  });
  return `<h1>Partners</h1>
    <div class="alert alert-info">Only list organisations ENDIP has permission to name.</div>
    ${table(["Name", "Type", "Status"], rows.map((p) => [esc(p.name), esc(p.type), badge(p.status || "Published")]))}
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Name</label><input id="pname"></div>
      <div class="field"><label>Type</label><input id="ptype" value="Programme"></div>
    </div><div class="card-body"><button class="btn btn-primary" id="add-p">Add partner</button></div></div>`;
}

async function adminVolunteers() {
  const rows = await volunteerService.getAll();
  after(() => {
    document.querySelectorAll("[data-vs]").forEach((b) => {
      b.addEventListener("click", async () => {
        await volunteerService.update(b.dataset.vs, { status: b.dataset.status });
        toast("Volunteer status updated.");
        document.getElementById("app-view").innerHTML = await adminVolunteers();
      });
    });
  });
  return `<h1>Volunteers</h1>${
    rows.length
      ? table(
          ["Name", "Interest", "Status", ""],
          rows.map((v) => [esc(v.name), esc(v.interest || v.skills || "—"), badge(v.status), `<button class="btn btn-sm btn-outline" data-vs="${v.id}" data-status="Accepted">Accept</button>`])
        )
      : `<div class="empty-state"><p>No volunteer applications yet.</p></div>`
  }`;
}

async function adminStories() {
  const stories = await storyService.getAll();
  after(() => {
    document.getElementById("add-st")?.addEventListener("click", async () => {
      await storyService.create({
        title: document.getElementById("stitle").value,
        programme: document.getElementById("sprog").value,
        summary: document.getElementById("ssum").value,
        status: "Published",
        featured: false,
      });
      toast("Story saved.");
      document.getElementById("app-view").innerHTML = await adminStories();
    });
  });
  return `<h1>Success stories</h1>${stories.map((s) => `<div class="card"><div class="card-body"><h3>${esc(s.title)}</h3><p>${badge(s.status || "Draft")}</p></div></div>`).join("") || `<div class="empty-state"><p>No stories published.</p></div>`}
    <div class="card"><div class="card-body">
      <div class="field"><label>Title</label><input id="stitle"></div>
      <div class="field"><label>Programme</label><input id="sprog"></div>
      <div class="field"><label>Summary</label><textarea id="ssum"></textarea></div>
      <button class="btn btn-primary" id="add-st">Publish story</button>
    </div></div>`;
}

async function adminImpact() {
  return `<h1>Impact</h1>
    <p>Public figures are limited to verified 2030 targets.</p>
    <div class="grid-2">
      <div class="stat-card"><div class="value">10,000+</div><div class="label">Sustainable enterprises targeted</div></div>
      <div class="stat-card"><div class="value">30,000</div><div class="label">Jobs targeted by 2030</div></div>
    </div>
    <p><a class="btn btn-outline" href="${href("impact.html")}">View public page</a></p>`;
}

async function adminArticles() {
  const items = await articleService.getAll();
  after(() => {
    document.querySelectorAll("[data-art]").forEach((b) => {
      b.addEventListener("click", async () => {
        await articleService.update(b.dataset.art, { status: b.dataset.status });
        toast("Article updated.");
      });
    });
  });
  return `<h1>Articles</h1>${table(
    ["Title", "Date", "Category", ""],
    items.map((a) => [esc(a.title), formatDate(a.date), a.category, `<button class="btn btn-sm btn-outline" data-art="${a.id || a.slug}" data-status="Archived">Archive</button>`])
  )}`;
}

async function adminMedia() {
  let items = await mediaService.getAll();
  const draw = (list) => {
    const q = document.getElementById("mq")?.value.toLowerCase() || "";
    const filtered = list.filter((m) => !q || m.name.toLowerCase().includes(q));
    const grid = document.getElementById("media-grid");
    if (!grid) return;
    grid.innerHTML = filtered.length
      ? filtered
          .map(
            (m) => `<div class="card"><div class="card-media cover-elearn">${m.url ? `<img src="${m.url}" alt="${esc(m.name)}">` : `<div class="logo-mark">${esc(m.name)}</div>`}</div>
        <div class="card-body">${esc(m.name)}<div class="btn-group">
          <button class="btn btn-sm btn-outline" data-sel="${m.id}">Select</button>
          <button class="btn btn-sm btn-outline" data-ren="${m.id}">Rename</button>
          <button class="btn btn-sm btn-danger" data-mdel="${m.id}">Delete</button>
        </div></div></div>`
          )
          .join("")
      : `<div class="empty-state"><h3>No media found</h3><p>Upload an image to start the library.</p></div>`;
    grid.querySelectorAll("[data-mdel]").forEach((b) => {
      b.addEventListener("click", async () => {
        if (!confirmAction("Delete this file?")) return;
        await mediaService.remove(b.dataset.mdel);
        document.getElementById("app-view").innerHTML = await adminMedia();
      });
    });
    grid.querySelectorAll("[data-ren]").forEach((b) => {
      b.addEventListener("click", async () => {
        const current = list.find((m) => m.id === b.dataset.ren);
        const name = window.prompt("File name", current?.name);
        if (!name) return;
        await mediaService.update(b.dataset.ren, { name });
        document.getElementById("app-view").innerHTML = await adminMedia();
      });
    });
    grid.querySelectorAll("[data-sel]").forEach((b) => {
      b.addEventListener("click", () => {
        const current = list.find((m) => m.id === b.dataset.sel);
        writeSelectedMedia(current);
        toast(`Selected ${current.name}`);
      });
    });
  };
  after(() => {
    document.getElementById("mfile")?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      await mediaService.create({ name: file.name, type: file.type, url, folder: "Uploads" });
      toast("Media added.");
      document.getElementById("app-view").innerHTML = await adminMedia();
    });
    document.getElementById("mq")?.addEventListener("input", () => draw(items));
    draw(items);
  });
  return `<h1>Media library</h1>
    <div class="filter-bar">
      <div class="field"><label for="mq">Search</label><input id="mq" type="search"></div>
      <label class="btn btn-outline">Upload<input id="mfile" type="file" accept="image/*" hidden></label>
    </div>
    <div class="grid-4" id="media-grid"></div>`;
}

function writeSelectedMedia(item) {
  try {
    localStorage.setItem("endip_selected_media", JSON.stringify(item));
  } catch {
    /* ignore quota */
  }
}

async function adminEmail() {
  const tpls = await emailService.templates();
  const logs = await emailService.getLogs();
  after(() => {
    const applyTpl = () => {
      const tpl = tpls.find((t) => t.id === document.getElementById("etpl").value) || tpls[0];
      if (!tpl) return;
      document.getElementById("esub").value = tpl.subject;
      document.getElementById("ebody").value = tpl.body;
    };
    document.getElementById("etpl")?.addEventListener("change", applyTpl);
    document.getElementById("eprev")?.addEventListener("click", () => {
      document.getElementById("email-preview").innerHTML = `<h3>${esc(document.getElementById("esub").value)}</h3><p>${esc(document.getElementById("ebody").value)}</p>`;
    });
    document.getElementById("esave-tpl")?.addEventListener("click", async () => {
      await emailService.saveTemplate({
        id: document.getElementById("etpl").value,
        subject: document.getElementById("esub").value,
        body: document.getElementById("ebody").value,
      });
      toast("Template saved.");
    });
    document.getElementById("esend")?.addEventListener("click", async (e) => {
      setBusy(e.currentTarget, true, "Sending…");
      try {
        await emailService.send({
          template: tpls.find((t) => t.id === document.getElementById("etpl").value)?.name,
          audience: document.getElementById("eaud").value,
          subject: document.getElementById("esub").value,
          content: document.getElementById("ebody").value,
          attachment: document.getElementById("eatt").files[0]?.name,
          scheduledFor: document.getElementById("esched").value,
        });
        toast(document.getElementById("esched").value ? "Message scheduled." : "Message sent to the outbox.");
        document.getElementById("app-view").innerHTML = await adminEmail();
      } catch {
        toast("Could not send. Please try again.");
        setBusy(e.currentTarget, false);
      }
    });
    applyTpl();
  });
  return `<h1>Email centre</h1>
    <div class="split">
      <aside class="card"><div class="card-body">
        <h3>Templates</h3>
        <ul>${tpls.map((t) => `<li>${esc(t.name)}</li>`).join("")}</ul>
      </aside>
      <div class="card"><div class="card-body">
        <div class="field"><label>Template</label><select id="etpl">${tpls.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Audience</label><select id="eaud"><option>Applicants</option><option>Participants</option><option>Entrepreneurs</option></select></div>
        <div class="field"><label>Subject</label><input id="esub"></div>
        <div class="field"><label>Message</label><textarea id="ebody"></textarea></div>
        <div class="field"><label>Attachment</label><input id="eatt" type="file"></div>
        <div class="field"><label>Schedule</label><input id="esched" type="datetime-local"></div>
        <div class="btn-group">
          <button class="btn btn-outline" type="button" id="eprev">Preview</button>
          <button class="btn btn-outline" type="button" id="esave-tpl">Save template</button>
          <button class="btn btn-primary" type="button" id="esend">Send</button>
        </div>
        <div id="email-preview" class="card" style="margin-top:12px"></div>
      </div></div>
    </div>
    <h2>Sent and scheduled</h2>
    ${table(["When", "Subject", "Status"], logs.map((l) => [formatDateTime(l.at), esc(l.subject), badge(l.status)]))}`;
}

async function adminNotes() {
  const users = await userService.getAll();
  after(() => {
    document.getElementById("nqueue")?.addEventListener("click", async () => {
      await notificationService.create({ userId: document.getElementById("nuser").value, title: document.getElementById("ntitle").value, body: document.getElementById("nbody").value });
      toast("Notification queued.");
    });
  });
  return `<h1>Notifications</h1>
    <div class="field"><label>Recipient</label><select id="nuser">${users.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Title</label><input id="ntitle"></div>
    <div class="field"><label>Message</label><textarea id="nbody"></textarea></div>
    <button class="btn btn-primary" id="nqueue">Send</button>`;
}

async function adminUsers() {
  const users = await userService.getAll();
  after(() => {
    const render = () => {
      const q = document.getElementById("uq")?.value.toLowerCase() || "";
      const role = document.getElementById("urole")?.value || "";
      const filtered = users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) && (!role || u.role === role));
      document.getElementById("user-table").innerHTML = table(
        ["Name", "Email", "Role", "Status"],
        filtered.map((u) => [
          esc(u.name),
          esc(u.email),
          `<select data-role="${u.id}">${["Participant", "Entrepreneur", "Admin", "Reviewer", "Trainer", "Programme Manager", "Content Manager"].map((r) => `<option ${r === u.role ? "selected" : ""}>${r}</option>`).join("")}</select>`,
          `<select data-status="${u.id}"><option ${u.status !== "Inactive" ? "selected" : ""}>Active</option><option ${u.status === "Inactive" ? "selected" : ""}>Inactive</option></select>`,
        ])
      );
      document.querySelectorAll("[data-role]").forEach((s) => {
        s.addEventListener("change", async () => {
          await userService.update(s.dataset.role, { role: s.value });
          toast("Role updated.");
        });
      });
      document.querySelectorAll("[data-status]").forEach((s) => {
        s.addEventListener("change", async () => {
          await userService.update(s.dataset.status, { status: s.value });
          toast("Status updated.");
        });
      });
    };
    document.getElementById("uq")?.addEventListener("input", render);
    document.getElementById("urole")?.addEventListener("change", render);
    document.getElementById("uadd")?.addEventListener("click", async () => {
      const name = document.getElementById("uname").value.trim();
      const email = document.getElementById("uemail").value.trim();
      if (!name || !email) return toast("Enter a name and email.");
      await userService.create({ name, email, role: document.getElementById("unewrole").value });
      toast("User added.");
      document.getElementById("app-view").innerHTML = await adminUsers();
    });
    render();
  });
  return `<h1>Users</h1>
    <div class="filter-bar">
      <div class="field"><label for="uq">Search</label><input id="uq" type="search"></div>
      <div class="field"><label for="urole">Role</label><select id="urole"><option value="">All</option><option>Participant</option><option>Entrepreneur</option><option>Admin</option><option>Reviewer</option><option>Trainer</option></select></div>
    </div>
    <div id="user-table"></div>
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Name</label><input id="uname"></div>
      <div class="field"><label>Email</label><input id="uemail" type="email"></div>
      <div class="field"><label>Role</label><select id="unewrole"><option>Participant</option><option>Entrepreneur</option><option>Reviewer</option><option>Trainer</option></select></div>
    </div><div class="card-body"><button class="btn btn-primary" id="uadd">Add user</button></div></div>`;
}

async function adminRoles() {
  const roles = await roleService.getAll();
  return `<h1>Roles and permissions</h1>
    ${table(
      ["Role", "Programmes", "Applications", "Users"],
      roles.map((r) => [
        r,
        ["Super Admin", "Admin", "Programme Manager"].includes(r) ? "Yes" : "Limited",
        ["Super Admin", "Admin", "Reviewer", "Programme Manager"].includes(r) ? "Yes" : "No",
        ["Super Admin", "Admin"].includes(r) ? "Yes" : "No",
      ])
    )}`;
}

async function adminAudit() {
  const rows = await auditService.getAll();
  after(() => {
    const render = () => {
      const q = document.getElementById("lq")?.value.toLowerCase() || "";
      const filtered = rows.filter((l) => `${l.action} ${l.user} ${l.module}`.toLowerCase().includes(q));
      document.getElementById("log-table").innerHTML = table(
        ["Date", "User", "Action", "Module", "Record"],
        filtered.map((l) => [formatDateTime(l.at), esc(l.user), esc(l.action), esc(l.module), esc(l.record)])
      );
    };
    document.getElementById("lq")?.addEventListener("input", render);
    render();
  });
  return `<h1>Audit logs</h1><input id="lq" placeholder="Search"><div id="log-table"></div>`;
}

async function adminSettings() {
  const s = await settingsService.get();
  after(() => {
    document.getElementById("ssave")?.addEventListener("click", async () => {
      await settingsService.save({
        organisation: document.getElementById("sorg").value,
        email: document.getElementById("semail").value,
        phone: document.getElementById("sphone").value,
        seoTitle: document.getElementById("sseo").value,
      });
      toast("Settings saved.");
    });
  });
  return `<h1>Settings</h1>
    <div class="card"><div class="card-body grid-2">
      <div class="field"><label>Organisation</label><input id="sorg" value="${esc(s.organisation || SITE.name)}"></div>
      <div class="field"><label>Email</label><input id="semail" value="${esc(s.email || SITE.contact.email)}"></div>
      <div class="field"><label>Phone</label><input id="sphone" value="${esc(s.phone || SITE.contact.phones[0])}"></div>
      <div class="field"><label>SEO title default</label><input id="sseo" value="${esc(s.seoTitle || "ENDIP")}"></div>
    </div>
    <div class="card-body"><button class="btn btn-primary" id="ssave">Save</button></div></div>`;
}
