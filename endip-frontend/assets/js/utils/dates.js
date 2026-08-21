export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}

export function isUpcoming(iso) {
  return !isPast(iso);
}

export function todayISO() {
  return new Date().toISOString();
}
