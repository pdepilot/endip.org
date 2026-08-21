export function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(str, n = 140) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n).trim() + "…" : str;
}

export function statusClass(status) {
  const map = {
    "Open for Applications": "badge-open",
    OPEN: "badge-open",
    Open: "badge-open",
    Upcoming: "badge-upcoming",
    "COMING SOON": "badge-upcoming",
    Ongoing: "badge-ongoing",
    ONGOING: "badge-ongoing",
    Completed: "badge-closed",
    COMPLETED: "badge-closed",
    "Applications Closed": "badge-closed",
    CLOSED: "badge-closed",
    Closed: "badge-closed",
    Draft: "badge-draft",
    Submitted: "badge-review",
    "Under Review": "badge-review",
    Shortlisted: "badge-waitlist",
    Interview: "badge-waitlist",
    Accepted: "badge-accepted",
    Rejected: "badge-rejected",
    Waitlisted: "badge-waitlist",
    Withdrawn: "badge-draft",
    Present: "badge-present",
    Absent: "badge-absent",
    Late: "badge-late",
    Excused: "badge-excused",
    Verified: "badge-verified",
    Pending: "badge-review",
    Featured: "badge-open",
  };
  return map[status] || "badge-draft";
}

export function badge(status) {
  return `<span class="badge ${statusClass(status)}">${status}</span>`;
}
