const PREFIX = "endip_demo_";

export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  return value;
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}
