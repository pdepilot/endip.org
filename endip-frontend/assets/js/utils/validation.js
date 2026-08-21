export function required(value, label) {
  if (!String(value || "").trim()) return `${label} is required.`;
  return "";
}

export function email(value) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""))) {
    return "Enter a valid email address.";
  }
  return "";
}

export function phone(value) {
  if (!/^[0-9+\s()-]{8,}$/.test(String(value || ""))) {
    return "Enter a valid phone number.";
  }
  return "";
}

export function applyErrors(form, errors) {
  form.querySelectorAll(".field-error").forEach((n) => n.remove());
  form.querySelectorAll(".field.error").forEach((n) => n.classList.remove("error"));
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.querySelector(`[name="${name}"]`)?.closest(".field");
    if (!field) return;
    field.classList.add("error");
    const p = document.createElement("p");
    p.className = "field-error";
    p.textContent = message;
    field.appendChild(p);
  });
  return Object.keys(errors).length === 0;
}
