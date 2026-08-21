import { currentPage, href, safeAppPath } from "./utils/dom.js";
import { mountDemoBanner, mountPublicChrome, mountAppChrome } from "./layouts/chrome.js";
import { bindModals, bindTabs } from "./components/ui.js";
import { initPublicPage } from "./pages/public.js";
import { initScrollReveal } from "./components/scrollReveal.js";
import { renderAppView } from "./pages/appViews.js";
import { authService } from "./services/authService.js";
import { required, email as emailRule, applyErrors } from "./utils/validation.js";

function setMeta() {
  if (!document.title.includes("ENDIP") && !document.title.includes("Entrepreneurial")) {
    document.title = `${document.title} | ENDIP`;
  }
}

async function boot() {
  mountDemoBanner();
  setMeta();
  const layout = document.documentElement.dataset.layout || "public";
  const page = currentPage();

  if (layout === "public" || layout === "auth") {
    mountPublicChrome();
    bindTabs();
    bindModals();
    if (layout === "public") {
      await initPublicPage(page);
      initScrollReveal();
    }
    if (layout === "auth") initAuth(page);
    return;
  }

  const roleMap = {
    participant: ["Participant", "Alumni", "Admin", "Super Admin"],
    entrepreneur: ["Entrepreneur", "Admin", "Super Admin"],
    admin: ["Admin", "Super Admin", "Programme Manager", "Reviewer", "Trainer", "Internship Coordinator", "Content Manager", "Communication Manager", "Partner Manager"],
  };
  const allowed = roleMap[layout];
  if (allowed) {
    const user = authService.requireRole(allowed, href("auth/login.html"));
    if (!user) return;
  }
  mountAppChrome(layout);
  await renderAppView(page);
}

function initAuth(page) {
  const form = document.querySelector("[data-auth-form]");
  const err = document.getElementById("auth-error");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (page === "login") {
      const res = authService.login(fd.get("email"), fd.get("password"));
      if (!res.ok) {
        if (err) err.textContent = res.error;
        return;
      }
      const next = safeAppPath(new URLSearchParams(location.search).get("next"));
      if (next) {
        window.location.href = href(next);
        return;
      }
      window.location.href = authService.portalFor(res.user.role);
      return;
    }
    if (page === "register") {
      const errors = {};
      if (required(fd.get("name"), "Name")) errors.name = required(fd.get("name"), "Name");
      if (emailRule(fd.get("email"))) errors.email = emailRule(fd.get("email"));
      if (String(fd.get("password") || "").length < 8) errors.password = "Use at least 8 characters.";
      if (!applyErrors(form, errors)) return;
      const res = authService.register({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role") || "Participant",
      });
      if (!res.ok) {
        if (err) err.textContent = res.error;
        return;
      }
      window.location.href = href("auth/verify-email.html");
      return;
    }
    if (page === "forgot") {
      authService.requestReset(fd.get("email"));
      document.getElementById("auth-ok")?.classList.add("show");
    }
    if (page === "reset") {
      const res = authService.resetPassword(fd.get("email"), fd.get("password"));
      if (!res.ok) {
        if (err) err.textContent = res.error;
        return;
      }
      document.getElementById("auth-ok")?.classList.add("show");
    }
    if (page === "verify-email") {
      authService.verifyEmail();
    }
  });
  if (page === "verify-email") {
    document.getElementById("verify-now")?.addEventListener("click", () => {
      authService.verifyEmail();
      window.location.href = authService.portalFor(authService.current()?.role || "Participant");
    });
  }
}

boot().catch(() => {
  const host = document.getElementById("app-view") || document.getElementById("main");
  if (host) {
    host.innerHTML = `<div class="empty-state"><h3>This page could not be loaded</h3><p>Please refresh and try again.</p></div>`;
  }
});
