import { SITE } from "../config/site.js";
import { href } from "../utils/dom.js";
import { formatDate } from "../utils/dates.js";
import { badge, truncate } from "../utils/formatting.js";
import { required, email as emailRule, phone as phoneRule, applyErrors } from "../utils/validation.js";
import { toast, paginate, renderPagination, esc } from "../components/ui.js";
import { initHeroCarousel } from "../components/heroCarousel.js";
import { PROGRAMME_IMAGES } from "../config/programmeImages.js";
import { EVENT_IMAGES } from "../config/eventImages.js";
import { authService } from "../services/authService.js";
import {
  programmeService,
  eventService,
  businessService,
  articleService,
  impactService,
  storyService,
  partnerService,
  enquiryService,
  volunteerService,
  applicationService,
  certificateService,
} from "../services/api.js";

function param(name) {
  return new URLSearchParams(location.search).get(name);
}

function cover(cls, title, image) {
  if (image?.src) {
    const srcset = image.srcset ? ` srcset="${esc(image.srcset)}"` : "";
    const sizes = image.sizes ? ` sizes="${esc(image.sizes)}"` : "";
    return `<div class="card-media"><img src="${esc(image.src)}"${srcset}${sizes} alt="${esc(image.alt || title)}" width="640" height="360" loading="lazy"></div>`;
  }
  return `<div class="card-media ${cls}"><div class="logo-mark">${esc(title)}</div></div>`;
}

function canApply(p) {
  return p.status === "OPEN";
}

export async function initPublicPage(page) {
  if (page === "home") return initHome();
  if (page === "programmes") return initProgrammes();
  if (page === "programme-details") return initProgrammeDetails();
  if (page === "apply") return initApply();
  if (page === "apply-confirm") return initApplyConfirm();
  if (page === "events") return initEvents();
  if (page === "event-details") return initEventDetails();
  if (page === "event-registered") return initEventRegistered();
  if (page === "businesses") return initBusinesses();
  if (page === "business-details") return initBusinessDetails();
  if (page === "news") return initNews();
  if (page === "article") return initArticle();
  if (page === "impact") return initImpact();
  if (page === "stories") return initStories();
  if (page === "story") return initStory();
  if (page === "opportunities") return initOpportunities();
  if (page === "contact") return initEnquiry("contact");
  if (page === "volunteer") return initVolunteer();
  if (page === "partner") return initEnquiry("partnership");
  if (page === "partners") return initPartners();
  if (page === "verify") return initVerify();
}

async function initHome() {
  initHeroCarousel();
  const wrap = document.getElementById("home-programmes");
  if (wrap) {
    const programmes = (await programmeService.getAll()).filter((p) => p.featured);
    wrap.innerHTML = programmes.map(programmeCard).join("");
  }
  const events = document.getElementById("home-events");
  if (events) {
    const upcoming = (await eventService.getAll()).filter((e) => e.timeframe === "upcoming").slice(0, 3);
    events.innerHTML = upcoming.length
      ? upcoming.map((e) => eventCard(e, true)).join("")
      : `<div class="empty-state"><h3>No upcoming events listed</h3><p>Check back as ENDIP publishes new sessions.</p></div>`;
  }
  const news = document.getElementById("home-news");
  if (news) {
    const articles = (await articleService.getAll()).slice(0, 3);
    news.innerHTML = articles.map((a) => `<article class="card"><div class="card-body"><p class="kicker">${esc(a.category)}</p><h3>${esc(a.title)}</h3><p>${esc(truncate(a.excerpt, 110))}</p><a href="${href("article.html")}?id=${a.slug}">Read</a></div></article>`).join("");
  }
}

function eventCard(e, compact = false) {
  const media = cover(e.cover || "cover-elearn", e.title, EVENT_IMAGES[e.slug]);
  if (compact) {
    return `<article class="card event-card">
      ${media}
      <div class="card-body">
        <p class="kicker">${formatDate(e.date)}</p>
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.location)}</p>
        <a href="${href("event-details.html")}?id=${e.slug}">View event</a>
      </div>
    </article>`;
  }
  return `<article class="card event-card">
    ${media}
    <div class="card-body">
      ${badge(e.timeframe === "past" ? "COMPLETED" : e.status || "OPEN")}
      <h3>${esc(e.title)}</h3>
      <div class="meta-row"><span>${formatDate(e.date)}</span><span>${esc(e.startTime)}–${esc(e.endTime)}</span><span>${esc(e.location)}</span></div>
      <a class="btn btn-primary btn-sm" href="${href("event-details.html")}?id=${e.slug}">${e.timeframe === "past" ? "View" : "Register"}</a>
    </div>
  </article>`;
}

function programmeCard(p) {
  return `<article class="card programme-card">
    ${cover(p.cover, p.title, PROGRAMME_IMAGES[p.slug])}
    <div class="card-body">
      ${badge(p.status)}
      <p class="kicker">${esc(p.category)}</p>
      <h3>${esc(p.title)}</h3>
      <p>${esc(truncate(p.short, 120))}</p>
      <div class="meta-row"><span>${esc(p.duration)}</span><span>${esc(p.location)}</span><span>Deadline: ${p.deadline ? formatDate(p.deadline) : "Not published"}</span></div>
      <div class="btn-group">
        <a class="btn btn-primary btn-sm" href="${href("programme-details.html")}?id=${p.slug}">View programme</a>
        ${canApply(p) ? `<a class="btn btn-accent btn-sm" href="${href("apply.html")}?programme=${p.slug}">Apply now</a>` : ""}
      </div>
    </div>
  </article>`;
}

async function initProgrammes() {
  const root = document.getElementById("programme-results");
  if (!root) return;
  const all = await programmeService.getAll();
  let page = 1;
  const render = () => {
    const q = document.getElementById("q")?.value.toLowerCase() || "";
    const cat = document.getElementById("category")?.value || "";
    const loc = document.getElementById("location")?.value || "";
    const st = document.getElementById("status")?.value || "";
    const type = document.getElementById("type")?.value || "";
    const sort = document.getElementById("sort")?.value || "featured";
    const items = all.filter((p) => {
      return (
        (!q || `${p.title} ${p.short}`.toLowerCase().includes(q)) &&
        (!cat || p.category === cat) &&
        (!loc || p.location.toLowerCase().includes(loc.toLowerCase())) &&
        (!st || p.status === st) &&
        (!type || p.type === type)
      );
    });
    items.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "deadline") return String(a.deadline || "9999").localeCompare(String(b.deadline || "9999"));
      if (sort === "status") return a.status.localeCompare(b.status);
      return Number(b.featured) - Number(a.featured);
    });
    const paged = paginate(items, page, 6);
    page = paged.current;
    root.innerHTML = items.length
      ? `<div class="grid-3">${paged.slice.map(programmeCard).join("")}</div><div class="pagination" id="prog-pages"></div>`
      : `<div class="empty-state"><h3>No programmes match these filters</h3><p>Try clearing search or filters.</p></div>`;
    renderPagination(document.getElementById("prog-pages"), paged, (n) => {
      page = n;
      render();
    });
  };
  ["q", "category", "location", "status", "type", "sort"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      page = 1;
      render();
    });
    document.getElementById(id)?.addEventListener("change", () => {
      page = 1;
      render();
    });
  });
  render();
}

async function initProgrammeDetails() {
  const p = await programmeService.getById(param("id"));
  const root = document.getElementById("programme-detail");
  if (!root) return;
  if (!p) {
    root.innerHTML = `<div class="empty-state"><h3>Programme not found</h3><p><a href="${href("programmes.html")}">Back to programmes</a></p></div>`;
    return;
  }
  const related = (await programmeService.getAll()).filter((x) => x.id !== p.id && x.category === p.category).slice(0, 3);
  root.innerHTML = `
    <div class="page-hero"><div class="container">
      <div class="breadcrumbs"><a href="${href("index.html")}">Home</a> / <a href="${href("programmes.html")}">Programmes</a> / ${esc(p.title)}</div>
      <p class="kicker">${esc(p.category)} · ${esc(p.type)}</p>
      <h1>${esc(p.title)}</h1>
      <p class="lede">${esc(p.short)}</p>
      <div class="btn-group">
        ${canApply(p) ? `<a class="btn btn-accent" href="${href("apply.html")}?programme=${p.slug}">Apply now</a>` : `<span class="btn btn-outline">Applications ${p.status.toLowerCase()}</span>`}
        <a class="btn btn-outline" href="${href("contact.html")}">Ask a question</a>
      </div>
    </div></div>
    <section class="section"><div class="container split">
      <div>
        <h2>Overview</h2><p>${esc(p.description)}</p>
        <h2>Objectives</h2><ul>${p.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
        <h2>Target audience</h2><p>${esc(p.whoCanApply)}</p>
        <h2>Eligibility</h2><p>${esc(p.eligibility)}</p>
        <h2>Programme structure</h2><ol>${p.structure.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        ${p.structure?.length ? `<h2>Modules</h2><ul>${p.structure.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
        <h2>Requirements</h2><p>Applicants should complete the online form, provide accurate contact details, and upload requested documents before the published deadline.</p>
        ${p.faqs.length ? `<h2>Frequently asked questions</h2>${p.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}` : ""}
        ${related.length ? `<h2>Related programmes</h2><div class="grid-2">${related.map(programmeCard).join("")}</div>` : ""}
      </div>
      <aside class="card sticky-card"><div class="card-body">
        <p>${badge(p.status)}</p>
        <p><strong>Duration</strong><br>${esc(p.duration)}</p>
        <p><strong>Location</strong><br>${esc(p.location)}</p>
        <p><strong>Delivery</strong><br>${esc(p.delivery)}</p>
        <p><strong>Application deadline</strong><br>${p.deadline ? formatDate(p.deadline) : "Not published"}</p>
        ${canApply(p) ? `<a class="btn btn-accent btn-block" href="${href("apply.html")}?programme=${p.slug}">Start application</a>` : ""}
      </aside>
    </div></section>`;
}

async function initApply() {
  const root = document.getElementById("apply-root");
  if (!root) return;
  const user = authService.current();
  const slug = param("programme");
  if (!user) {
    const next = encodeURIComponent(`apply.html?programme=${slug || ""}`);
    window.location.href = href(`auth/login.html?next=${next}`);
    return;
  }
  const programme = slug ? await programmeService.getById(slug) : null;
  if (!programme) {
    root.innerHTML = `<div class="empty-state"><h3>Choose a programme</h3><p><a href="${href("programmes.html")}">Browse programmes</a></p></div>`;
    return;
  }
  if (!canApply(programme)) {
    root.innerHTML = `<div class="empty-state"><h3>Applications are not open</h3><p>This programme is currently ${esc(programme.status)}.</p></div>`;
    return;
  }
  const existing = (await applicationService.forUser(user.id)).find((a) => a.programmeId === programme.id && !["Withdrawn", "Rejected"].includes(a.status));
  if (existing && existing.status !== "Draft") {
    root.innerHTML = `<div class="alert alert-info"><h3>You already have an application</h3><p>Reference ${esc(existing.ref)} is ${esc(existing.status)}.</p><a class="btn btn-primary" href="${href("participant/application-details.html")}?id=${existing.id}">View application</a></div>`;
    return;
  }
  const draft = existing || {
    userId: user.id,
    programmeId: programme.id,
    status: "Draft",
    step: 0,
    answers: { fullName: user.name, email: user.email },
    documents: [],
  };
  const steps = ["Personal information", "Education and background", "Programme questions", "Documents", "Review"];
  let step = draft.step || 0;
  let answers = { ...draft.answers };
  let documents = [...(draft.documents || [])];

  const persist = async (status = "Draft") => {
    const saved = await applicationService.saveDraft({
      ...draft,
      id: draft.id,
      userId: user.id,
      programmeId: programme.id,
      status,
      step,
      answers,
      documents,
    });
    draft.id = saved.id;
    draft.ref = saved.ref;
    return saved;
  };

  const draw = () => {
    root.innerHTML = `<div class="page-hero"><div class="container">
      <p class="kicker">${esc(programme.title)}</p>
      <h1>Application</h1>
      <ol class="steps">${steps.map((s, i) => `<li class="${i === step ? "current" : ""} ${i < step ? "done" : ""}">${esc(s)}</li>`).join("")}</ol>
    </div></div>
    <section class="section"><div class="container" style="max-width:720px">
      <form class="card" id="apply-form"><div class="card-body">${stepFields()}</div>
      <div class="card-body btn-group">
        ${step > 0 ? `<button class="btn btn-outline" type="button" id="prev">Previous</button>` : ""}
        <button class="btn btn-outline" type="button" id="draft">Save draft</button>
        <button class="btn btn-primary" type="submit">${step === steps.length - 1 ? "Submit application" : "Next"}</button>
      </div></form>
    </div></section>`;
    document.getElementById("prev")?.addEventListener("click", () => {
      collect();
      step -= 1;
      draw();
    });
    document.getElementById("draft")?.addEventListener("click", async () => {
      collect();
      await persist();
      toast("Draft saved. You can return and continue later.");
    });
    document.getElementById("apply-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!collect(true)) return;
      if (step < steps.length - 1) {
        step += 1;
        await persist();
        draw();
        return;
      }
      const saved = await persist();
      const submitted = await applicationService.submit(saved.id);
      window.location.href = href(`apply-confirm.html?ref=${encodeURIComponent(submitted.ref)}`);
    });
  };

  function collect(validate = false) {
    const form = document.getElementById("apply-form");
    const fd = new FormData(form);
    ["fullName", "email", "phone", "location", "education", "employment", "motivation", "availability"].forEach((k) => {
      if (fd.has(k)) answers[k] = String(fd.get(k));
    });
    if (fd.get("documentName")) documents = [{ name: String(fd.get("documentName")) }];
    if (!validate) return true;
    const errors = {};
    if (step === 0) {
      if (required(answers.fullName, "Full name")) errors.fullName = required(answers.fullName, "Full name");
      if (emailRule(answers.email)) errors.email = emailRule(answers.email);
      if (phoneRule(answers.phone)) errors.phone = phoneRule(answers.phone);
    }
    if (step === 1 && required(answers.education, "Education")) errors.education = required(answers.education, "Education");
    if (step === 2 && required(answers.motivation, "Motivation")) errors.motivation = required(answers.motivation, "Motivation");
    if (step === 3 && !documents.length) errors.documentName = "Add at least one document name.";
    return applyErrors(form, errors);
  }

  function stepFields() {
    if (step === 0) {
      return field("fullName", "Full name", answers.fullName) + field("email", "Email", answers.email, "email") + field("phone", "Phone", answers.phone, "tel") + field("location", "Location", answers.location);
    }
    if (step === 1) {
      return area("education", "Education", answers.education) + area("employment", "Professional background", answers.employment);
    }
    if (step === 2) {
      return area("motivation", `Why ${programme.title}?`, answers.motivation) + field("availability", "Availability", answers.availability);
    }
    if (step === 3) {
      return `<div class="field"><label for="documentName">Document (file name)</label><input id="documentName" name="documentName" value="${esc(documents[0]?.name || "")}" placeholder="CV.pdf"><p class="hint">Files stay on this device until storage is connected.</p></div>`;
    }
    return `<h3>Review</h3>
      <p><strong>Name</strong> ${esc(answers.fullName)}<br><strong>Email</strong> ${esc(answers.email)}<br><strong>Phone</strong> ${esc(answers.phone)}</p>
      <p><strong>Education</strong> ${esc(answers.education)}</p>
      <p><strong>Motivation</strong> ${esc(answers.motivation)}</p>
      <p><strong>Documents</strong> ${esc(documents.map((d) => d.name).join(", ") || "None")}</p>`;
  }

  function field(name, label, value = "", type = "text") {
    return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value || "")}"></div>`;
  }
  function area(name, label, value = "") {
    return `<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}">${esc(value || "")}</textarea></div>`;
  }

  draw();
}

function initApplyConfirm() {
  const ref = param("ref") || "";
  const root = document.getElementById("apply-confirm");
  if (!root) return;
  root.innerHTML = `<div class="page-hero"><div class="container">
    <h1>Application submitted</h1>
    <p class="lede">Your application has been received. Keep this reference for your records.</p>
    <p class="stat-card" style="display:inline-block"><strong>${esc(ref)}</strong></p>
    <p><a class="btn btn-primary" href="${href("participant/applications.html")}">View my applications</a></p>
  </div></div>`;
}

async function initEvents() {
  const events = await eventService.getAll();
  const up = document.getElementById("upcoming-events");
  const past = document.getElementById("past-events");
  if (up) {
    const items = events.filter((e) => e.timeframe === "upcoming");
    up.innerHTML = items.length ? items.map((e) => eventCard(e)).join("") : `<div class="empty-state"><h3>No upcoming events</h3><p>New events will appear here when published.</p></div>`;
  }
  if (past) past.innerHTML = events.filter((e) => e.timeframe === "past").map((e) => eventCard(e)).join("") || `<div class="empty-state"><p>No past events are listed yet.</p></div>`;
}

async function initEventDetails() {
  const e = await eventService.getById(param("id"));
  const root = document.getElementById("event-detail");
  if (!root) return;
  if (!e) {
    root.innerHTML = `<div class="empty-state">Event not found.</div>`;
    return;
  }
  const past = e.timeframe === "past";
  const user = authService.current();
  root.innerHTML = `<div class="page-hero"><div class="container">
    <div class="breadcrumbs"><a href="${href("events.html")}">Events</a> / ${esc(e.title)}</div>
    ${badge(past ? "COMPLETED" : e.status || "OPEN")}
    <h1>${esc(e.title)}</h1>
    <p class="lede">${formatDate(e.date)} · ${esc(e.startTime)}–${esc(e.endTime)} · ${esc(e.location)}</p>
  </div></div>
  <section class="section"><div class="container split">
    <div>
      <h2>About this event</h2><p>${esc(e.description)}</p>
      ${e.agenda?.length ? `<h2>Agenda</h2><ul>${e.agenda.map((a) => `<li><strong>${esc(a.time)}</strong> ${esc(a.item)}</li>`).join("")}</ul>` : ""}
      <h2>Speakers</h2>
      ${e.speakers?.length ? e.speakers.map((s) => `<p><strong>${esc(s.name)}</strong> — ${esc(s.role)}</p>`).join("") : "<p>Speaker names will appear when ENDIP publishes them.</p>"}
    </div>
    <aside class="card"><div class="card-body">
      ${past ? `<div class="alert alert-info">This event has ended and is shown as an archive record.</div>` : `
        <h3>Register</h3>
        <form id="event-reg">
          <div class="field"><label for="er-name">Name</label><input id="er-name" name="name" value="${esc(user?.name || "")}" required></div>
          <div class="field"><label for="er-email">Email</label><input id="er-email" name="email" type="email" value="${esc(user?.email || "")}" required></div>
          <div class="field"><label for="er-org">Organisation</label><input id="er-org" name="org"></div>
          <button class="btn btn-primary btn-block" type="submit">Register</button>
        </form>`}
    </div></aside>
  </div></section>`;
  document.getElementById("event-reg")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const errors = {};
    const n = required(fd.get("name"), "Name");
    const em = emailRule(fd.get("email"));
    if (n) errors.name = n;
    if (em) errors.email = em;
    if (!applyErrors(ev.target, errors)) return;
    const rec = await eventService.register(e.id, { name: fd.get("name"), email: fd.get("email"), org: fd.get("org"), userId: user?.id });
    window.location.href = href(`event-registered.html?ref=${encodeURIComponent(rec.ref)}&event=${e.slug}`);
  });
}

async function initEventRegistered() {
  const root = document.getElementById("event-registered");
  if (!root) return;
  const event = await eventService.getById(param("event"));
  root.innerHTML = `<div class="page-hero"><div class="container">
    <h1>Registration confirmed</h1>
    <p class="lede">${event ? esc(event.title) : "Event"} · ${formatDate(event?.date)}</p>
    <p>Your registration reference is <strong>${esc(param("ref") || "")}</strong>.</p>
    <a class="btn btn-primary" href="${href("events.html")}">Back to events</a>
  </div></div>`;
}

async function initBusinesses() {
  const root = document.getElementById("business-results");
  if (!root) return;
  const all = await businessService.getPublic();
  let page = 1;
  const render = () => {
    const q = document.getElementById("bq")?.value.toLowerCase() || "";
    const sector = document.getElementById("sector")?.value || "";
    const loc = document.getElementById("bloc")?.value.toLowerCase() || "";
    const verified = document.getElementById("verified")?.checked;
    const featured = document.getElementById("featured")?.checked;
    const sort = document.getElementById("bsort")?.value || "name";
    const items = all.filter((b) => (!q || `${b.name} ${b.short || ""} ${b.founder || ""}`.toLowerCase().includes(q)) && (!sector || b.sector === sector) && (!loc || String(b.location || "").toLowerCase().includes(loc)) && (!verified || b.verified) && (!featured || b.featured));
    items.sort((a, b) => (sort === "sector" ? a.sector.localeCompare(b.sector) : a.name.localeCompare(b.name)));
    const paged = paginate(items, page, 6);
    root.innerHTML = items.length
      ? `<div class="grid-3">${paged.slice
          .map(
            (b) => `<article class="card">
          <div class="card-media cover-sedp"><div class="logo-mark">${esc(b.name)}</div></div>
          <div class="card-body">
            ${b.verified ? badge("Verified") : badge("Listed")}
            <h3>${esc(b.name)}</h3>
            <p>${esc(b.founder || "")} · ${esc(b.sector)} · ${esc(b.location || "")}</p>
            <p>${esc(b.short || b.description || "")}</p>
            <a class="btn btn-primary btn-sm" href="${href("business-details.html")}?id=${b.id}">View profile</a>
          </div></article>`
          )
          .join("")}</div><div class="pagination" id="biz-pages"></div>`
      : `<div class="empty-state"><h3>No businesses have been published yet</h3><p>Approved businesses from the ENDIP network will appear in this directory.</p></div>`;
    renderPagination(document.getElementById("biz-pages"), paged, (n) => {
      page = n;
      render();
    });
  };
  ["bq", "sector", "bloc", "verified", "featured", "bsort"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
    document.getElementById(id)?.addEventListener("change", render);
  });
  render();
}

async function initBusinessDetails() {
  const b = await businessService.getById(param("id"));
  const root = document.getElementById("business-detail");
  if (!root) return;
  if (!b || b.status !== "Published") {
    root.innerHTML = `<div class="empty-state">This business is not published.</div>`;
    return;
  }
  root.innerHTML = `<div class="page-hero"><div class="container">
    ${b.verified ? badge("Verified") : ""}
    <h1>${esc(b.name)}</h1>
    <p class="lede">${esc(b.founder || "")} · ${esc(b.sector)} · ${esc(b.location || "")}</p>
  </div></div>
  <section class="section"><div class="container split">
    <div>
      <h2>About</h2><p>${esc(b.description)}</p>
      <h2>Products and services</h2>${b.products?.length ? `<ul>${b.products.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : "<p>Not published.</p>"}
    </div>
    <aside class="card"><div class="card-body">
      <p><strong>Programme</strong><br>${esc(b.programme || "—")}</p>
      <p><strong>Year joined</strong><br>${esc(b.yearJoined || "—")}</p>
      ${b.website ? `<p><a href="${esc(b.website)}">Website</a></p>` : ""}
    </aside>
  </div></section>`;
}

async function initNews() {
  const root = document.getElementById("news-results");
  if (!root) return;
  const all = await articleService.getAll();
  const render = () => {
    const cat = document.getElementById("ncat")?.value || "";
    const q = document.getElementById("nq")?.value.toLowerCase() || "";
    const items = all.filter((a) => (!cat || a.category === cat) && (!q || a.title.toLowerCase().includes(q)));
    root.innerHTML = items.length
      ? `<div class="grid-2">${items
          .map(
            (a) => `<article class="card"><div class="card-body">
        <p class="kicker">${esc(a.category)} · ${formatDate(a.date)}</p>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
        <a href="${href("article.html")}?id=${a.slug}">Read more</a>
      </div></article>`
          )
          .join("")}</div>`
      : `<div class="empty-state"><h3>No articles match</h3></div>`;
  };
  document.getElementById("ncat")?.addEventListener("change", render);
  document.getElementById("nq")?.addEventListener("input", render);
  render();
}

async function initArticle() {
  const a = await articleService.getById(param("id"));
  const root = document.getElementById("article-detail");
  if (!root) return;
  if (!a) {
    root.innerHTML = `<div class="empty-state">Article not found.</div>`;
    return;
  }
  const related = (await articleService.getAll()).filter((x) => x.slug !== a.slug).slice(0, 3);
  root.innerHTML = `<div class="page-hero"><div class="container">
    <div class="breadcrumbs"><a href="${href("news.html")}">News</a> / ${esc(a.category)}</div>
    <h1>${esc(a.title)}</h1>
    <p class="lede">${formatDate(a.date)}</p>
  </div></div>
  <section class="section"><div class="container" style="max-width:760px">
    ${a.body.map((p) => `<p>${esc(p)}</p>`).join("")}
    <p><button class="btn btn-outline" type="button" id="share">Copy link</button></p>
    ${related.length ? `<h2>Related</h2>${related.map((r) => `<p><a href="${href("article.html")}?id=${r.slug}">${esc(r.title)}</a></p>`).join("")}` : ""}
  </div></section>`;
  document.getElementById("share")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Link copied.");
    } catch {
      toast("Copy the address from the browser bar to share this article.");
    }
  });
}

async function initImpact() {
  const stats = document.getElementById("impact-stats");
  if (stats) {
    stats.innerHTML = [
      { value: SITE.targets.enterprises, label: SITE.targets.enterprisesLabel },
      { value: SITE.targets.jobs, label: SITE.targets.jobsLabel },
    ]
      .map((s) => `<div class="stat-card"><div class="value">${s.value}</div><div class="label">${s.label}</div></div>`)
      .join("");
  }
}

async function initStories() {
  const root = document.getElementById("story-results");
  const stories = (await storyService.getAll()).filter((s) => s.status === "Published");
  if (!root) return;
  const render = () => {
    const prog = document.getElementById("sprog")?.value || "";
    const items = stories.filter((s) => !prog || s.programme === prog);
    root.innerHTML = items.length
      ? items
          .map(
            (s) => `<article class="card"><div class="card-body">
        ${s.featured ? badge("Featured") : ""}
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.programme || "")} · ${esc(s.location || "")}</p>
        <p>${esc(truncate(s.summary || s.outcome || "", 160))}</p>
        <a class="btn btn-primary btn-sm" href="${href("story.html")}?id=${s.id}">Read story</a>
      </div></article>`
          )
          .join("")
      : `<div class="empty-state"><h3>Stories will appear here when published</h3><p>ENDIP publishes consented accounts only. This space is ready for those stories.</p></div>`;
  };
  document.getElementById("sprog")?.addEventListener("change", render);
  render();
}

async function initStory() {
  const s = await storyService.getById(param("id"));
  const root = document.getElementById("story-detail");
  if (!root) return;
  if (!s || s.status !== "Published") {
    root.innerHTML = `<div class="empty-state">Story not found.</div>`;
    return;
  }
  const related = (await storyService.getAll()).filter((x) => x.id !== s.id && x.status === "Published").slice(0, 3);
  root.innerHTML = `<div class="page-hero"><div class="container"><h1>${esc(s.title)}</h1><p class="lede">${esc(s.programme || "")}</p></div></div>
    <section class="section"><div class="container" style="max-width:760px">
      <p>${esc(s.summary || s.outcome || "")}</p>
      ${related.length ? `<h2>Related stories</h2>${related.map((r) => `<p><a href="${href("story.html")}?id=${r.id}">${esc(r.title)}</a></p>`).join("")}` : ""}
    </div></section>`;
}

async function initOpportunities() {
  const root = document.getElementById("opp-results");
  if (!root) return;
  const programmes = await programmeService.getAll();
  const events = await eventService.getAll();
  const items = [
    ...programmes.map((p) => ({
      type: p.category === "Internship" ? "Internships" : p.category === "Entrepreneurship" ? "Entrepreneurship" : "Programmes",
      title: p.title,
      meta: p.status,
      href: href(`programme-details.html?id=${p.slug}`),
    })),
    ...events.filter((e) => e.timeframe === "upcoming").map((e) => ({ type: "Events", title: e.title, meta: formatDate(e.date), href: href(`event-details.html?id=${e.slug}`) })),
    { type: "Volunteering", title: "Volunteer with ENDIP", meta: "Open", href: href("volunteer.html") },
    { type: "Training", title: "E-Learning and Training", meta: "OPEN", href: href("programme-details.html?id=e-learning-and-training") },
  ];
  const render = () => {
    const t = document.getElementById("otype")?.value || "";
    const q = document.getElementById("oq")?.value.toLowerCase() || "";
    const list = items.filter((i) => (!t || i.type === t) && (!q || i.title.toLowerCase().includes(q)));
    root.innerHTML = list.length
      ? `<div class="grid-2">${list
          .map((i) => `<article class="card"><div class="card-body"><p class="kicker">${esc(i.type)}</p><h3>${esc(i.title)}</h3><p>${esc(i.meta)}</p><a class="btn btn-primary btn-sm" href="${i.href}">View</a></div></article>`)
          .join("")}</div>`
      : `<div class="empty-state"><h3>No opportunities match</h3></div>`;
  };
  document.getElementById("otype")?.addEventListener("change", render);
  document.getElementById("oq")?.addEventListener("input", render);
  render();
}

async function initPartners() {
  const root = document.getElementById("partner-grid");
  if (!root) return;
  const partners = (await partnerService.getAll()).filter((p) => p.status === "Published");
  root.innerHTML = partners.length
    ? partners.map((p) => `<article class="card"><div class="card-body"><h3>${esc(p.name)}</h3><p>${esc(p.type || "")}</p></div></article>`).join("")
    : `<div class="empty-state"><h3>Partners will be listed here</h3><p>ENDIP does not display logos without permission. A published YSECP Rivers article names British Council and King’s Trust International in that programme context.</p><a class="btn btn-primary" href="${href("partner-with-us.html")}">Partner with ENDIP</a></div>`;
}

function initEnquiry(kind) {
  const form = document.querySelector("[data-enquiry-form], [data-demo-form]");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const errors = {};
    if (form.querySelector("[name=name]") && required(fd.get("name"), "Name")) errors.name = required(fd.get("name"), "Name");
    if (form.querySelector("[name=email]") && emailRule(fd.get("email"))) errors.email = emailRule(fd.get("email"));
    if (form.querySelector("[name=phone]") && fd.get("phone") && phoneRule(fd.get("phone"))) errors.phone = phoneRule(fd.get("phone"));
    if (form.querySelector("[name=message]") && required(fd.get("message"), "Message")) errors.message = required(fd.get("message"), "Message");
    if (!applyErrors(form, errors)) return;
    await enquiryService.create({
      kind,
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      type: fd.get("type") || fd.get("topic") || fd.get("interest"),
      organisation: fd.get("org"),
      message: fd.get("message"),
      status: "Received",
    });
    form.hidden = true;
    document.querySelector(".form-success")?.classList.add("show");
    toast("Thank you. Your enquiry has been received.");
  });
}

function initVolunteer() {
  const form = document.querySelector("[data-enquiry-form], [data-demo-form]");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const errors = {};
    if (required(fd.get("name"), "Name")) errors.name = required(fd.get("name"), "Name");
    if (emailRule(fd.get("email"))) errors.email = emailRule(fd.get("email"));
    if (form.querySelector("[name=message]") && required(fd.get("message") || fd.get("motivation"), "Motivation")) {
      errors.message = required(fd.get("message") || fd.get("motivation"), "Motivation");
    }
    if (!applyErrors(form, errors)) return;
    await volunteerService.create({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      skills: fd.get("skills"),
      interest: fd.get("interest") || fd.get("area"),
      availability: fd.get("availability"),
      experience: fd.get("experience"),
      motivation: fd.get("message") || fd.get("motivation"),
      status: "Submitted",
    });
    form.hidden = true;
    document.querySelector(".form-success")?.classList.add("show");
    toast("Volunteer application received.");
  });
}

async function initVerify() {
  const box = document.getElementById("verify-box");
  if (!box) return;
  const n = param("n") || "";
  const draw = async (number) => {
    if (!number) {
      box.innerHTML = `<form id="verify-form"><div class="field"><label for="n">Certificate number</label><input id="n" name="n" required></div><button class="btn btn-primary" type="submit">Verify</button></form>`;
      document.getElementById("verify-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const number = String(new FormData(e.target).get("n") || "").trim();
        if (!number) return;
        location.search = `?n=${encodeURIComponent(number)}`;
      });
      return;
    }
    const cert = await certificateService.getByNumber(number);
    if (cert) {
      box.innerHTML = `<div class="alert alert-success">Certificate is valid</div>
        <p><strong>Number</strong> ${esc(cert.number)}</p>
        <p><strong>Participant</strong> ${esc(cert.holder)}</p>
        <p><strong>Programme</strong> ${esc(cert.programme)}</p>
        <p><strong>Completion</strong> ${formatDate(cert.completed)}</p>
        <p><strong>Status</strong> ${esc(cert.status)}</p>`;
    } else {
      box.innerHTML = `<div class="alert alert-danger">No certificate matches that number.</div>
        <p><a href="${href("verify.html")}">Try another number</a></p>`;
    }
  };
  draw(n);
}
