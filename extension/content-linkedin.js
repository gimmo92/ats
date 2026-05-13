/**
 * Estrazione best-effort dal DOM LinkedIn + meta tag / JSON-LD (UI cambia spesso).
 */
function text(el) {
  return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
}

function metaContent(prop) {
  const el =
    document.querySelector(`meta[property="${prop}"]`) ||
    document.querySelector(`meta[name="${prop}"]`);
  return (el?.getAttribute("content") || "").replace(/\s+/g, " ").trim();
}

function parseOgTitle(raw) {
  if (!raw) return { name: "", headline: "" };
  const core = raw.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const m = core.match(/^(.+?)\s+[\-–—]\s+(.+)$/);
  if (m) return { name: m[1].trim(), headline: m[2].trim() };
  return { name: "", headline: core };
}

function extractJsonLdPerson() {
  let jobTitle = "";
  let addressLocality = "";
  let description = "";
  const skills = [];

  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    let data;
    try {
      data = JSON.parse(script.textContent || "null");
    } catch {
      return;
    }
    const list = Array.isArray(data) ? data : [data];
    list.forEach((node) => {
      if (!node || typeof node !== "object") return;
      const types = ([]).concat(node["@type"] || []);
      const isPerson =
        types.includes("Person") ||
        node["@type"] === "Person" ||
        (typeof node["@type"] === "string" && /person/i.test(node["@type"]));
      if (!isPerson) return;
      if (node.jobTitle && !jobTitle) jobTitle = String(node.jobTitle).trim();
      if (node.description && !description) {
        description = String(node.description).trim().slice(0, 400);
      }
      const a = node.address;
      if (a && typeof a === "object" && !addressLocality) {
        addressLocality = [a.addressLocality, a.addressRegion, a.addressCountry]
          .filter(Boolean)
          .join(", ");
      }
      const ks = node.knowsAbout;
      if (Array.isArray(ks)) {
        ks.forEach((k) => {
          if (typeof k === "string" && k.length < 80) skills.push(k.trim());
        });
      }
    });
  });

  return { jobTitle, addressLocality, description, skills };
}

function isJunkLine(t) {
  if (!t || t.length > 360) return true;
  if (/^follow$|^connect$|^messag|^message$/i.test(t)) return true;
  if (/connections?|connessioni|followers?|follower/i.test(t) && t.length < 48)
    return true;
  if (/informazioni di contatto|contact info|mutual/i.test(t)) return true;
  if (/^see more|^mostra tutt|^show all/i.test(t)) return true;
  return false;
}

function findHeadlineFromDom(main, name) {
  const anonym = document.querySelector(
    '[data-anonymize="headline"], [data-anonymize="title"]'
  );
  if (anonym) {
    const t = text(anonym);
    if (t && t !== name && !isJunkLine(t)) return t;
  }

  const h1 =
    main?.querySelector("h1.inline, h1.text-heading-xlarge, main h1") ||
    document.querySelector("h1.text-heading-xlarge, main section h1, h1.break-words");
  if (!h1) {
    const anyMedium = main?.querySelectorAll(".text-body-medium, .text-body-large");
    for (const el of anyMedium || []) {
      if (el.closest("#experience, #education, #skills, #licenses")) continue;
      const t = text(el);
      if (t && t !== name && !isJunkLine(t)) return t;
    }
    return "";
  }

  let node = h1.parentElement;
  for (let depth = 0; depth < 12 && node; depth++) {
    const meds = node.querySelectorAll(".text-body-medium, .text-body-large");
    for (const el of meds) {
      if (el.closest("#experience, #education, #skills, #licenses")) continue;
      const t = text(el);
      if (!t || t === name || isJunkLine(t)) continue;
      return t;
    }
    node = node.parentElement;
  }

  for (const el of main?.querySelectorAll(".text-body-medium.break-words, .text-body-large") || []) {
    if (el.closest("#experience, #education, #skills")) continue;
    const t = text(el);
    if (t && t !== name && !isJunkLine(t)) return t;
  }
  return "";
}

function findLocationFromDom(main, name, headline) {
  const sel =
    "span.text-body-small, div.text-body-small.inline, .text-body-small.inline.t-black--light, .text-body-small.t-black--light";
  const candidates = main?.querySelectorAll(sel) || document.querySelectorAll(sel);
  for (const el of candidates) {
    if (el.closest("#experience, #education, #skills")) continue;
    const t = text(el);
    if (!t || t.length > 140) continue;
    if (t === name || t === headline) continue;
    if (/connection|connessioni|follower|mutual|informazioni di contatto/i.test(t))
      continue;
    if (/@|http:\/\//i.test(t)) continue;
    return t;
  }
  return "";
}

function findExperienceSection() {
  const byId = document.querySelector("#experience")?.closest("section");
  if (byId) return byId;
  const byScroll = document
    .querySelector("#scroll-to-experience, [id*='experience' i]")
    ?.closest("section");
  if (byScroll) return byScroll;

  const needles = [
    "experience",
    "esperienza",
    "esperienze",
    "work experience",
    "esperienza lavorativa",
  ];
  for (const h of document.querySelectorAll("h2, h2 span, p.text-heading-large")) {
    const t = text(h).toLowerCase();
    if (!needles.some((n) => t === n || t.startsWith(n + " ") || t.includes(n)))
      continue;
    const sec =
      h.closest("section") ||
      h.closest(".artdeco-card") ||
      h.closest('[class*="profile-card"]');
    if (sec) return sec;
  }
  return null;
}

function titleFromExperienceLi(li) {
  const vh = li.querySelector(".visually-hidden");
  if (vh) {
    const t = text(vh);
    if (t && t.length > 1 && t.length < 280 && !/^view\b/i.test(t)) return t;
  }
  const sels = [
    ".hoverable-link-text span[aria-hidden='true']",
    ".mr1.t-bold span[aria-hidden='true']",
    ".t-bold span[aria-hidden='true']",
    "div.hoverable-link-text span",
    ".t-bold span",
    "span.t-14.t-bold span[aria-hidden='true']",
  ];
  for (const s of sels) {
    const t = text(li.querySelector(s));
    if (t) return t;
  }
  return "";
}

function captionFromExperienceLi(li) {
  return text(li.querySelector(".pvs-entity__caption-wrapper")) || "";
}

function extractCurrentRoleFromExperience(expSection) {
  if (!expSection) return "";
  const items = expSection.querySelectorAll(
    "li.artdeco-list__item, li.pvs-list__paged-list-item, div.pvs-list__paged-list-item"
  );
  const list = Array.from(items).slice(0, 18);

  for (const li of list) {
    const cap = captionFromExperienceLi(li);
    const isCurrent =
      /\b(Present|Current|Adesso|Oggi|In corso)\b/i.test(cap) ||
      /–\s*Present/i.test(cap) ||
      /\d{4}\s*[-–]\s*Present/i.test(cap);
    const title = titleFromExperienceLi(li);
    if (title && isCurrent) return title;
  }
  for (const li of list) {
    const title = titleFromExperienceLi(li);
    if (title) return title;
  }
  return "";
}

function collectSkills(main) {
  const skills = [];
  const seen = new Set();
  const add = (raw) => {
    const s = raw.replace(/\s+/g, " ").trim();
    if (!s || s.length < 2 || s.length > 80) return;
    const low = s.toLowerCase();
    if (seen.has(low)) return;
    if (/^(show all|mostra|endorse|endorsement|skill)\b/i.test(s) && s.length < 28)
      return;
    seen.add(low);
    skills.push(s);
  };

  const roots = [main, document.body].filter(Boolean);
  for (const root of roots) {
    root.querySelectorAll('a[href*="/skills/"], a[href*="skill_"]').forEach((a) => {
      if (a.closest(".global-nav")) return;
      const inner =
        a.querySelector("span[aria-hidden='true']") ||
        a.querySelector(".hoverable-link-text span") ||
        a;
      add(text(inner));
    });
    root.querySelectorAll('[data-field="skill_card_skill"]').forEach((el) => {
      const inner =
        el.querySelector("span[aria-hidden='true']") ||
        el.querySelector(".hoverable-link-text span") ||
        el;
      add(text(inner));
    });
  }

  const skillSection =
    document.querySelector("#skills")?.closest("section") ||
    document.querySelector('[data-section="skills"]')?.closest("section");
  if (skillSection) {
    skillSection
      .querySelectorAll("span[aria-hidden='true'], .hoverable-link-text span")
      .forEach((el) => {
        const t = text(el);
        if (t && t.length < 80) add(t);
      });
  }

  if (skills.length > 45) skills.length = 45;
  return skills;
}

function locationHintFromOgDescription(desc, headline) {
  if (!desc || desc.length > 600) return "";
  const parts = desc.split("·").map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (p === headline) continue;
    if (p.length > 2 && p.length < 120 && !/@|https?:/i.test(p)) {
      if (!/linkedin|connection|follower/i.test(p)) return p;
    }
  }
  const firstLine = desc.split(/\n|\. /)[0]?.trim() || "";
  if (
    firstLine.length > 2 &&
    firstLine.length < 120 &&
    firstLine !== headline &&
    !/@|https?:/i.test(firstLine)
  )
    return firstLine;
  return "";
}

function scrapeProfile() {
  const url = window.location.href.split("?")[0].split("#")[0];
  if (!/\/in\/[^/]+/i.test(url)) {
    return { ok: false, error: "Apri una pagina profilo (/in/username)" };
  }

  const canon = url.match(/^(https?:\/\/[^/]+\/in\/[^/]+)/i);
  const profileUrl = canon ? canon[1] : url;

  const main = document.querySelector("main") || document.body;

  const ogTitle = metaContent("og:title") || metaContent("twitter:title");
  const ogDesc = metaContent("og:description") || metaContent("description");
  const ogParsed = parseOgTitle(ogTitle);
  const ld = extractJsonLdPerson();

  let name = "";
  const h1 = main.querySelector(
    "h1.text-heading-xlarge, h1.inline, main h1, h1.break-words"
  );
  if (h1) name = text(h1);

  if (!name && ogParsed.name) name = ogParsed.name;

  let headline =
    findHeadlineFromDom(main, name) ||
    ogParsed.headline ||
    ld.description ||
    "";
  headline = headline.trim();

  if (!headline && ogDesc && ogDesc.length < 400) {
    headline = ogDesc.split(/\n|\. /)[0]?.trim() || "";
  }

  let location =
    findLocationFromDom(main, name, headline) ||
    ld.addressLocality ||
    locationHintFromOgDescription(ogDesc, headline) ||
    "";

  const expSection = findExperienceSection();
  let currentRole =
    extractCurrentRoleFromExperience(expSection) || ld.jobTitle || "";
  currentRole = currentRole.trim();

  const role =
    currentRole ||
    headline.split(/\s+at\s+|\s+@\s+|\s+·\s+/i)[0]?.trim() ||
    headline ||
    "";

  let skills = collectSkills(main);
  if (ld.skills?.length) {
    const merged = [...ld.skills, ...skills];
    skills = [];
    const seen = new Set();
    merged.forEach((s) => {
      const t = String(s).trim();
      if (!t || t.length > 80) return;
      const low = t.toLowerCase();
      if (seen.has(low)) return;
      seen.add(low);
      skills.push(t);
    });
    if (skills.length > 45) skills.length = 45;
  }

  const experience = [];
  const expItems =
    expSection?.querySelectorAll(
      "li.artdeco-list__item, li.pvs-list__paged-list-item, div.pvs-list__paged-list-item"
    ) || [];
  expItems.forEach((li, idx) => {
    if (idx > 12) return;
    const titleEl = li.querySelector(
      ".hoverable-link-text, .mr1.t-bold span[aria-hidden='true'], .t-bold span"
    );
    const companyEl = li.querySelector(".t-14.t-normal span, .pv-entity__secondary-title");
    const rangeEl = li.querySelector(".pvs-entity__caption-wrapper, .pv-entity__bullet-item-v2");
    const descEl = li.querySelector(".inline-show-more-text, .pv-shared-text-with-see-more");
    const title = text(titleEl) || titleFromExperienceLi(li);
    const company = text(companyEl);
    if (!title && !company) return;
    experience.push({
      title: title || "",
      company: company || "",
      from: text(rangeEl).split("·")[0]?.trim() || "",
      to: null,
      description: text(descEl) || "",
    });
  });

  const education = [];
  const eduSection = document.querySelector("#education")?.closest("section");
  const eduItems = eduSection?.querySelectorAll("li.artdeco-list__item") || [];
  eduItems.forEach((li, idx) => {
    if (idx > 8) return;
    const school = text(li.querySelector(".hoverable-link-text span, .t-bold span"));
    const degree = text(li.querySelector(".t-14.t-normal span"));
    if (!school) return;
    education.push({
      school,
      degree: degree || "",
      year: "",
    });
  });

  if (!name) {
    const m = url.match(/\/in\/([^/]+)/);
    if (m) {
      name = decodeURIComponent(m[1])
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return {
    ok: true,
    payload: {
      name: name || "Candidato LinkedIn",
      headline,
      location,
      linkedinUrl: profileUrl,
      email: "",
      phone: "",
      currentRole,
      role,
      skills,
      experience,
      education,
      source: "LinkedIn (estensione)",
      notes: `Importato dall'estensione TalentFlow il ${new Date().toLocaleString("it-IT")}. Verificare i dati e il consenso del candidato.`,
    },
  };
}

if (!globalThis.__TF_LINKEDIN_IMPORT_INIT__) {
  globalThis.__TF_LINKEDIN_IMPORT_INIT__ = true;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === "SCRAPE_PROFILE") {
      sendResponse(scrapeProfile());
      return true;
    }
    return false;
  });
}
