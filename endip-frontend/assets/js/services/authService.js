import { collection, read, write, uid, remove, ensureSeed } from "../store/db.js";
import { href, currentAppPath } from "../utils/dom.js";
import { recordAudit } from "../store/db.js";
import { fingerprint } from "../utils/hash.js";

ensureSeed();

function portalFor(role) {
  if (role === "Entrepreneur" || role === "Host Organisation") return href("entrepreneur/dashboard.html");
  if (
    [
      "Admin",
      "Super Admin",
      "Programme Manager",
      "Reviewer",
      "Trainer",
      "Internship Coordinator",
      "Content Manager",
      "Communication Manager",
      "Partner Manager",
    ].includes(role)
  ) {
    return href("admin/dashboard.html");
  }
  return href("participant/dashboard.html");
}

export const authService = {
  current() {
    return read("auth", null);
  },
  login(email, password) {
    const address = String(email || "").trim().toLowerCase();
    const users = collection("users").get();
    const user = users.find((u) => u.email.toLowerCase() === address);
    const creds = read("credentials", {});
    if (!user || creds[address] !== fingerprint(password)) {
      return { ok: false, error: "That email or password is not recognised." };
    }
    if (user.status === "Inactive") {
      return { ok: false, error: "This account is inactive. Contact ENDIP if you need access restored." };
    }
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    write("auth", session);
    recordAudit(session.name, "Signed in", "auth", session.id);
    return { ok: true, user: session };
  },
  register(payload) {
    const address = String(payload.email || "").trim().toLowerCase();
    const users = collection("users").get();
    if (users.some((u) => u.email.toLowerCase() === address)) {
      return { ok: false, error: "An account with this email already exists. Sign in instead." };
    }
    const user = {
      id: uid("u"),
      name: String(payload.name || "").trim(),
      email: address,
      role: payload.role || "Participant",
      status: "Active",
    };
    users.unshift(user);
    collection("users").set(users);
    const creds = read("credentials", {});
    creds[address] = fingerprint(passwordSafe(payload.password));
    write("credentials", creds);
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    write("auth", session);
    write("pending_email", { email: address, verified: false });
    return { ok: true, user: session };
  },
  requestReset(email) {
    write("reset_request", { email: String(email || "").trim().toLowerCase(), at: Date.now() });
    return { ok: true };
  },
  resetPassword(email, password) {
    const address = String(email || "").trim().toLowerCase();
    const creds = read("credentials", {});
    if (!creds[address]) return { ok: false, error: "No account was found for that email." };
    creds[address] = fingerprint(passwordSafe(password));
    write("credentials", creds);
    return { ok: true };
  },
  verifyEmail() {
    const pending = read("pending_email", null);
    if (pending) write("pending_email", { ...pending, verified: true });
    return { ok: true };
  },
  logout() {
    const user = this.current();
    if (user) recordAudit(user.name, "Signed out", "auth", user.id);
    remove("auth");
  },
  requireRole(roles, redirectHref) {
    const user = this.current();
    if (!user || (roles && !roles.includes(user.role) && user.role !== "Admin" && user.role !== "Super Admin")) {
      const next = encodeURIComponent(currentAppPath());
      window.location.href = next ? `${redirectHref}?next=${next}` : redirectHref;
      return null;
    }
    return user;
  },
  portalFor,
};

function passwordSafe(password) {
  return String(password || "");
}
