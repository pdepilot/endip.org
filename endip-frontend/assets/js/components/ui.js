export function toast(message) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const n = document.createElement("div");
  n.className = "toast";
  n.setAttribute("role", "status");
  n.textContent = message;
  root.appendChild(n);
  setTimeout(() => n.remove(), 4200);
}

export function bindTabs(root = document) {
  root.querySelectorAll("[data-tabs]").forEach((wrap) => {
    const tabs = [...wrap.querySelectorAll(".tab")];
    const panels = [...wrap.querySelectorAll("[data-tab-panel]")];
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
        panels.forEach((p) => {
          p.hidden = p.dataset.tabPanel !== tab.dataset.tab;
        });
      });
    });
  });
}

export function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

export function bindModals() {
  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.openModal));
  });
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll(".modal-backdrop").forEach((b) => {
    b.addEventListener("click", (e) => {
      if (e.target === b) b.classList.remove("open");
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelector(".modal-backdrop.open")?.classList.remove("open");
  });
}

export function confirmAction(message) {
  return window.confirm(message);
}

export function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.disabled = true;
    button.textContent = label || "Saving…";
  } else {
    button.disabled = false;
    button.textContent = button.dataset.label || button.textContent;
  }
}

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function paginate(items, page = 1, per = 6) {
  const total = Math.max(1, Math.ceil(items.length / per));
  const current = Math.min(Math.max(1, page), total);
  return {
    current,
    total,
    slice: items.slice((current - 1) * per, current * per),
  };
}

export function renderPagination(el, { current, total }, onPage) {
  if (!el) return;
  el.innerHTML = Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    return `<button type="button" ${n === current ? 'aria-current="page"' : ""} data-page="${n}">${n}</button>`;
  }).join("");
  el.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => onPage(Number(b.dataset.page)));
  });
}
