import { SITE } from "../config/site.js";
import { href, asset, currentPage } from "../utils/dom.js";
import { authService } from "../services/authService.js";

const PUBLIC_NAV = [
  { href: "index.html", label: "Home", page: "home" },
  {
    label: "About",
    children: [
      { href: "about.html", label: "Who we are", page: "about" },
      { href: "partners.html", label: "Partners", page: "partners" },
      { href: "contact.html", label: "Contact", page: "contact" },
    ],
  },
  {
    label: "Programmes",
    children: [
      { href: "programmes.html", label: "All programmes", page: "programmes" },
      { href: "opportunities.html", label: "Opportunities", page: "opportunities" },
    ],
  },
  { href: "events.html", label: "Events", page: "events" },
  {
    label: "Impact",
    children: [
      { href: "impact.html", label: "Our impact", page: "impact" },
      { href: "success-stories.html", label: "Success stories", page: "stories" },
    ],
  },
  { href: "businesses.html", label: "Business Network", page: "businesses" },
  { href: "news.html", label: "News", page: "news" },
  {
    label: "Get involved",
    children: [
      { href: "volunteer.html", label: "Volunteer", page: "volunteer" },
      { href: "partner-with-us.html", label: "Partner with us", page: "partner" },
      { href: "verify.html", label: "Verify certificate", page: "verify" },
    ],
  },
];

function navItem(item) {
  const page = currentPage();
  if (item.children) {
    return `<div class="has-sub">
      <a href="${href(item.children[0].href)}">${item.label}</a>
      <div class="subnav">${item.children
        .map((c) => `<a href="${href(c.href)}" ${c.page === page ? 'aria-current="page"' : ""}>${c.label}</a>`)
        .join("")}</div>
    </div>`;
  }
  return `<a href="${href(item.href)}" ${item.page === page ? 'aria-current="page"' : ""}>${item.label}</a>`;
}

export function mountDemoBanner() {
  const host = document.getElementById("demo-banner");
  if (host) host.remove();
}

export function mountPublicChrome() {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  const layout = document.documentElement.dataset.layout || "public";
  const user = authService.current();
  const account = user
    ? `<a class="btn btn-outline btn-sm nav-cta" href="${authService.portalFor(user.role)}">${user.name.split(" ")[0]}</a>`
    : `<a class="btn btn-outline btn-sm nav-cta" href="${href("auth/login.html")}">Sign in</a>`;
  if (header) {
    header.className = layout === "public" ? "site-header site-header--auto" : "site-header";
    header.innerHTML = `<div class="container site-header-inner">
      <a class="brand" href="${href("index.html")}">
        <img src="${asset("images/end-logo.png")}" alt="ENDIP">
        <span class="brand-name">ENDIP<small>Entrepreneurial Development Initiative</small></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      <nav id="primary-nav" class="nav" aria-label="Primary">
        ${PUBLIC_NAV.map(navItem).join("")}
        ${account}
        <a class="btn btn-accent btn-sm" href="${href("programmes.html")}">Apply now</a>
      </nav>
    </div>`;
    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".nav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      if (open) {
        header.classList.add("is-visible");
        header.setAttribute("aria-hidden", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle?.setAttribute("aria-expanded", "false");
        toggle?.focus();
      }
    });
    if (layout === "public") bindHeaderOnScroll(header, nav);
  }
  if (footer) {
    footer.className = layout === "public" ? "site-footer site-footer--signature js-reveal" : "site-footer";
    footer.innerHTML = layout === "public" ? publicFooter() : compactFooter();
  }
}

function bindHeaderOnScroll(header, nav) {
  const threshold = 48;
  let ticking = false;

  function update() {
    const menuOpen = nav?.classList.contains("open");
    const show = menuOpen || window.scrollY > threshold;
    header.classList.toggle("is-visible", show);
    header.setAttribute("aria-hidden", show ? "false" : "true");
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });
  header.addEventListener("focusin", () => header.classList.add("is-visible"));
  update();
}

function link(path, label) {
  return `<a class="ft-link" href="${href(path)}">${label}<span aria-hidden="true">↗</span></a>`;
}

function socialLink(url, label, path) {
  if (!url) return "";
  return `<a class="ft-social" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${path}</svg>
  </a>`;
}

function publicFooter() {
  const year = new Date().getFullYear();
  const social = SITE.social;
  return `
    <div class="ft-stage">
      <div class="container">
        <div class="ft-mast">
          <div class="ft-identity">
            <p class="ft-eyebrow">Entrepreneurial Development Initiative</p>
            <a class="ft-wordmark" href="${href("index.html")}">
              <img src="${asset("images/end-logo.png")}" alt="" aria-hidden="true">
              <span>ENDIP</span>
            </a>
            <p class="ft-lead">${SITE.positioning}</p>
          </div>
          <a class="ft-orbit" href="${href("programmes.html")}">
            <span class="ft-orbit-ring" aria-hidden="true"></span>
            <span class="ft-orbit-tick" aria-hidden="true"></span>
            <span class="ft-orbit-core">
              <small>Your next opportunity</small>
              <strong>Starts here</strong>
            </span>
          </a>
        </div>

        <p class="ft-statement">
          <span>People with skills</span>
          <span>build the world.</span>
        </p>
        <p class="ft-closing">Building sustainable enterprises. Creating opportunities. Empowering people.</p>

        <nav class="ft-index" aria-label="Footer">
          <div class="ft-cluster">
            <h2>Explore ENDIP</h2>
            ${link("index.html", "Home")}
            ${link("about.html", "About")}
            ${link("events.html", "Events")}
            ${link("news.html", "News")}
          </div>
          <div class="ft-cluster">
            <h2>Programmes</h2>
            ${link("programmes.html", "All programmes")}
            ${link("opportunities.html", "Opportunities")}
            ${link("impact.html", "Impact")}
            ${link("success-stories.html", "Success stories")}
          </div>
          <div class="ft-cluster">
            <h2>Enterprise</h2>
            ${link("businesses.html", "Business Network")}
            ${link("partner-with-us.html", "Partner with ENDIP")}
            ${link("volunteer.html", "Volunteer")}
            ${link("programmes.html", "Apply")}
          </div>
          <div class="ft-cluster">
            <h2>Resources</h2>
            ${link("about.html", "Who we are")}
            ${link("partners.html", "Partners")}
            ${link("contact.html", "Contact")}
            ${link("verify.html", "Verify a certificate")}
          </div>
        </nav>

        <div class="ft-presence">
          <div class="ft-where">
            <strong>${SITE.contact.office}</strong>
            <p>${SITE.contact.address}</p>
            <p>${SITE.contact.phones.map((n) => `<a href="tel:${n.replace(/\s/g, "")}">${n}</a>`).join(" · ")}</p>
            <p><a href="mailto:${SITE.contact.email}">${SITE.contact.email}</a></p>
          </div>
          <div class="ft-connect">
            ${socialLink(social.facebook, "ENDIP on Facebook", '<path fill="currentColor" d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3.2L17 12h-4V9c0-.6.4-1 1-1z"/>')}
            ${socialLink(social.linkedin, "ENDIP on LinkedIn", '<path fill="currentColor" d="M6.5 9H3v12h3.5V9zM4.8 3C3.5 3 2.5 4 2.5 5.2S3.5 7.5 4.8 7.5 7 6.5 7 5.2 6 3 4.8 3zM21 21h-3.5v-6.2c0-1.9-.7-3.1-2.4-3.1-1.3 0-2 .9-2.3 1.7-.1.3-.1.7-.1 1.1V21H9.2s.1-10.7 0-12H12.7v1.9c.5-.8 1.4-2 3.5-2 2.6 0 4.8 1.7 4.8 5.3V21z"/>')}
            ${socialLink(social.youtube, "ENDIP on YouTube", '<path fill="currentColor" d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.6 4 12 4 12 4h0s-4.6 0-7.7.2c-.5.1-1.5.1-2.4 1C1.2 5.9 1 7.5 1 7.5S.8 9.4.8 11.3v1.4c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 7.5.2 7.5.2s4.6 0 7.7-.2c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.2-3.8-.2-3.8zM9.8 14.8V8.7l6.2 3.1-6.2 3z"/>')}
          </div>
        </div>

        <div class="ft-colophon">
          <span>© ${year} ${SITE.name}</span>
          <span>${SITE.tagline}</span>
        </div>
      </div>
    </div>`;
}

function compactFooter() {
  return `<div class="container">
      <div class="footer-grid">
        <div>
          <h3>ENDIP</h3>
          <p>${SITE.goal2030}</p>
        </div>
        <div>
          <h3>Explore</h3>
          <p><a href="${href("programmes.html")}">Programmes</a></p>
          <p><a href="${href("opportunities.html")}">Opportunities</a></p>
          <p><a href="${href("businesses.html")}">Business Network</a></p>
          <p><a href="${href("impact.html")}">Impact</a></p>
        </div>
        <div>
          <h3>Get involved</h3>
          <p><a href="${href("volunteer.html")}">Volunteer</a></p>
          <p><a href="${href("partner-with-us.html")}">Partner with us</a></p>
          <p><a href="${href("contact.html")}">Contact</a></p>
          <p><a href="${href("verify.html")}">Verify a certificate</a></p>
        </div>
        <div>
          <h3>Contact</h3>
          <p>${SITE.contact.office}<br>${SITE.contact.address}</p>
          <p>${SITE.contact.phones.join("<br>")}</p>
          <p><a href="mailto:${SITE.contact.email}">${SITE.contact.email}</a></p>
        </div>
      </div>
      <div class="footer-meta">
        <span>© ${new Date().getFullYear()} Entrepreneurial Development Initiative</span>
        <span>People with Skills Build the World</span>
      </div>
    </div>`;
}

const MENUS = {
  participant: [
    { label: "Overview", items: [
      ["Dashboard", "participant/dashboard.html", "p-dashboard"],
      ["My profile", "participant/profile.html", "p-profile"],
      ["Notifications", "participant/notifications.html", "p-notifications"],
      ["Settings", "participant/settings.html", "p-settings"],
    ]},
    { label: "Learning", items: [
      ["Applications", "participant/applications.html", "p-applications"],
      ["My programmes", "participant/programmes.html", "p-programmes"],
      ["Programme home", "participant/programme-dashboard.html", "p-programme"],
      ["Courses", "participant/courses.html", "p-courses"],
      ["Assignments", "participant/assignments.html", "p-assignments"],
      ["Attendance", "participant/attendance.html", "p-attendance"],
      ["Certificates", "participant/certificates.html", "p-certificates"],
    ]},
    { label: "Community", items: [
      ["Events", "participant/events.html", "p-events"],
      ["Opportunities", "participant/opportunities.html", "p-opportunities"],
    ]},
  ],
  entrepreneur: [
    { label: "Overview", items: [
      ["Dashboard", "entrepreneur/dashboard.html", "e-dashboard"],
      ["Profile", "entrepreneur/profile.html", "e-profile"],
      ["Business", "entrepreneur/business.html", "e-business"],
      ["Edit business", "entrepreneur/business-edit.html", "e-business-edit"],
    ]},
    { label: "Network", items: [
      ["Programmes", "entrepreneur/programmes.html", "e-programmes"],
      ["Opportunities", "entrepreneur/opportunities.html", "e-opportunities"],
      ["Events", "entrepreneur/events.html", "e-events"],
      ["Notifications", "entrepreneur/notifications.html", "e-notifications"],
      ["Settings", "entrepreneur/settings.html", "e-settings"],
    ]},
  ],
  admin: [
    { label: "Operate", items: [
      ["Dashboard", "admin/dashboard.html", "a-dashboard"],
      ["Programmes", "admin/programmes.html", "a-programmes"],
      ["Applications", "admin/applications.html", "a-applications"],
      ["Participants", "admin/participants.html", "a-participants"],
      ["Training", "admin/courses.html", "a-courses"],
      ["Attendance", "admin/attendance.html", "a-attendance"],
      ["Certificates", "admin/certificates.html", "a-certificates"],
    ]},
    { label: "Internships", items: [
      ["Internships", "admin/internships.html", "a-internships"],
      ["Host organisations", "admin/host-organisations.html", "a-hosts"],
    ]},
    { label: "Network", items: [
      ["Businesses", "admin/businesses.html", "a-businesses"],
      ["Alumni", "admin/alumni.html", "a-alumni"],
      ["Events", "admin/events.html", "a-events"],
      ["Partners", "admin/partners.html", "a-partners"],
      ["Volunteers", "admin/volunteers.html", "a-volunteers"],
    ]},
    { label: "Content", items: [
      ["Success stories", "admin/success-stories.html", "a-stories"],
      ["Impact", "admin/impact.html", "a-impact"],
      ["Articles", "admin/articles.html", "a-articles"],
      ["Media", "admin/media.html", "a-media"],
      ["Email centre", "admin/email-centre.html", "a-email"],
      ["Notifications", "admin/notifications.html", "a-notifications"],
    ]},
    { label: "System", items: [
      ["Users", "admin/users.html", "a-users"],
      ["Roles", "admin/roles.html", "a-roles"],
      ["Audit logs", "admin/audit-logs.html", "a-audit"],
      ["Settings", "admin/settings.html", "a-settings"],
    ]},
  ],
};

export function mountAppChrome(kind) {
  const user = authService.current();
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  const page = currentPage();
  const groups = MENUS[kind] || [];
  shell.innerHTML = `
    <aside class="app-sidebar" id="app-sidebar">
      <a class="brand" href="${href("index.html")}" style="margin: 4px 8px 18px; color:#fff;">
        <img src="${asset("images/end-logo.png")}" alt="ENDIP" style="height:32px">
      </a>
      ${groups
        .map(
          (g) =>
            `<div class="side-label">${g.label}</div>` +
            g.items
              .map(([label, url, id]) => `<a href="${href(url)}" ${id === page ? 'aria-current="page"' : ""}>${label}</a>`)
              .join("")
        )
        .join("")}
      <div class="side-label">Account</div>
      <a href="${href("index.html")}" id="logout-link">Log out</a>
    </aside>
    <div class="app-main">
      <div class="app-top">
        <button class="btn btn-outline btn-sm sidebar-toggle" type="button">Menu</button>
        <div>
          <div class="kicker">${kind}</div>
          <strong>${user?.name || "Account"}</strong>
        </div>
        <a class="btn btn-ghost btn-sm" href="${href("index.html")}">Public site</a>
      </div>
      <div id="app-view"></div>
    </div>`;
  shell.querySelector(".sidebar-toggle")?.addEventListener("click", () => {
    document.getElementById("app-sidebar")?.classList.toggle("open");
  });
  shell.querySelector("#logout-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    authService.logout();
    window.location.href = href("auth/login.html");
  });
}
