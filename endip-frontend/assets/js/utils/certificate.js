import { SITE } from "../config/site.js";
import { formatDate } from "./dates.js";

export function certificateMarkup(cert) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate ${cert.number}</title>
  <style>
    body { font-family: Georgia, serif; background: #f4f1ea; color: #14324f; margin: 0; }
    .sheet { max-width: 900px; margin: 24px auto; background: #fff; border: 12px solid #0b4f9c; padding: 48px 56px; }
    .brand { letter-spacing: .2em; font-weight: 700; color: #0b4f9c; }
    h1 { font-size: 2.4rem; margin: 8px 0 24px; }
    .name { font-size: 2rem; border-bottom: 1px solid #ddd6c8; display: inline-block; padding: 0 24px 6px; }
    .meta { margin-top: 40px; display: flex; justify-content: space-between; gap: 24px; }
    .sign { border-top: 1px solid #14324f; width: 220px; padding-top: 8px; font-size: .85rem; }
    .verify { margin-top: 32px; font-size: .9rem; color: #5c574e; }
    @media print { body { background: #fff; } .sheet { border-width: 8px; margin: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <p class="brand">ENDIP</p>
    <p>Entrepreneurial Development Initiative</p>
    <h1>Certificate of Completion</h1>
    <p>This is to certify that</p>
    <p class="name">${cert.holder || cert.participant || ""}</p>
    <p>has completed</p>
    <h2>${cert.programme}</h2>
    <p>Completion date: ${formatDate(cert.completed)}</p>
    <div class="meta">
      <div class="sign">Programme lead</div>
      <div class="sign">ENDIP</div>
    </div>
    <p class="verify">Certificate number ${cert.number}<br>Verify at ${SITE.contact.websiteLabel || "endip.org"} / certificate verification</p>
  </div>
</body>
</html>`;
}

export function downloadCertificate(cert) {
  const blob = new Blob([certificateMarkup(cert)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cert.number}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printCertificate(cert) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(certificateMarkup(cert));
  w.document.close();
  w.focus();
  w.print();
  return true;
}
