/** Lightweight fingerprint for local credentials. Replace with server hashing when Laravel ships. */
export function fingerprint(value) {
  let h = 2166136261;
  const input = `endip.v1:${value}`;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
