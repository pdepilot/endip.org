export function asset(path) {
  const base = document.documentElement.dataset.base || ".";
  return `${base}/assets/${path}`;
}

export function href(path) {
  const base = document.documentElement.dataset.base || ".";
  const [file, query] = String(path || "").split("?");
  const joined = `${base}/${file}`.replace(/\/{2,}/g, "/");
  return query ? `${joined}?${query}` : joined;
}

/** Allow only in-app relative destinations for post-login redirects. */
export function safeAppPath(raw) {
  if (!raw) return "";
  let value = String(raw);
  try {
    value = decodeURIComponent(value);
  } catch {
    return "";
  }
  value = value.replace(/\\/g, "/").trim();
  if (!value || /^(https?:|javascript:|data:)/i.test(value) || value.startsWith("//") || value.includes("..")) {
    return "";
  }
  const markers = ["/participant/", "/entrepreneur/", "/admin/", "/auth/"];
  for (const marker of markers) {
    const i = value.lastIndexOf(marker);
    if (i !== -1) value = value.slice(i + 1);
  }
  value = value.replace(/^\//, "");
  const file = value.split("?")[0];
  if (!/^(index|about|programmes|programme-details|opportunities|events|event-details|event-registered|impact|success-stories|partners|businesses|business-details|news|article|contact|volunteer|partner-with-us|verify|apply|apply-confirm|story|auth\/|participant\/|entrepreneur\/|admin\/)/i.test(file)) {
    return "";
  }
  return value;
}

export function currentAppPath() {
  return safeAppPath(location.pathname + location.search);
}

export function currentPage() {
  return document.documentElement.dataset.page || "";
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
