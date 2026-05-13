/**
 * Pagina leggera con Open Graph per crawler (LinkedIn, ecc.).
 * L'app usa hash routing: l'URL #/carriere/:id non viene inviato al server,
 * quindi la condivisione punta qui per titolo/descrizione corretti.
 *
 * Vercel: file in /api come serverless Node.
 */

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " ");
}

function safeJobId(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 120) return "";
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) return "";
  return s;
}

export default function handler(req, res) {
  const q = req.query || {};
  const jobId = safeJobId(Array.isArray(q.jobId) ? q.jobId[0] : q.jobId);
  const title = String(Array.isArray(q.title) ? q.title[0] : q.title || "")
    .trim()
    .slice(0, 200);
  const company = String(
    Array.isArray(q.company) ? q.company[0] : q.company || "Spark ATS"
  )
    .trim()
    .slice(0, 120);
  const description = String(
    Array.isArray(q.description) ? q.description[0] : q.description || ""
  )
    .trim()
    .slice(0, 600);
  const logoRaw = String(Array.isArray(q.logo) ? q.logo[0] : q.logo || "").trim();
  const logo =
    /^https:\/\/[^\s"<>]{8,2000}$/i.test(logoRaw) ||
    /^http:\/\/localhost[/\w.-]*$/i.test(logoRaw)
      ? logoRaw
      : "";

  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const base = host ? `${proto}://${host}` : "";
  const appPath = jobId ? `/#/carriere/${encodeURIComponent(jobId)}` : "/#/carriere";
  const redirectUrl = base ? `${base}${appPath}` : "/#/carriere";

  const ogTitle = title
    ? `${title} · ${company}`
    : `Posizione aperta · ${company}`;
  const ogDescription =
    description ||
    `Candidati per questa posizione su ${company}.`;

  const selfPath = "/api/share-job";
  const search = new URLSearchParams();
  if (jobId) search.set("jobId", jobId);
  if (title) search.set("title", title);
  if (company) search.set("company", company);
  if (description) search.set("description", description);
  if (logo) search.set("logo", logo);
  const selfUrl = base ? `${base}${selfPath}?${search.toString()}` : selfPath;

  const ogImageTag = logo
    ? `<meta property="og:image" content="${escapeAttr(logo)}" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>${escapeAttr(ogTitle)}</title>
<meta name="description" content="${escapeAttr(ogDescription)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeAttr(ogTitle)}" />
<meta property="og:description" content="${escapeAttr(ogDescription)}" />
<meta property="og:url" content="${escapeAttr(selfUrl)}" />
${ogImageTag}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />
<meta name="twitter:description" content="${escapeAttr(ogDescription)}" />
<meta http-equiv="refresh" content="0;url=${escapeAttr(redirectUrl)}" />
<link rel="canonical" href="${escapeAttr(selfUrl)}" />
</head>
<body>
<p><a href="${escapeAttr(redirectUrl)}">Apri la scheda posizione</a></p>
</body>
</html>`;

  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .setHeader("Cache-Control", "public, max-age=300, s-maxage=300")
    .send(html);
}
