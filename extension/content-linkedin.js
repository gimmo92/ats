/**
 * Estrazione best-effort dal DOM LinkedIn (soggetto a cambiamenti UI).
 */
function text(el) {
  return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
}

function isJunkLine(t) {
  if (!t || t.length > 360) return true;
  if (/^follow$|^connect$|^messag|^message$/i.test(t)) return true;
  if (/connections?|connessioni|followers?|follower/i.test(t) && t.length < 40)
    return true;
  if (/informazioni di contatto|contact info|mutual/i.test(t)) return true;
  if (/^see more|^mostra tutt|^show all/i.test(t)) return true;
  return false;
}

function findHeadline(main, name) {
  const h1 =
    main?.querySelector("h1.inline, h1.text-heading-xlarge, main h1") ||
    document.querySelector("h1.text-heading-xlarge, main section h1, h1.break-words");
  if (!h1) return "";
  let node = h1.parentElement;
  for (let depth = 0; depth < 10 && node; depth++) {
    const meds = node.querySelectorAll(".text-body-medium");
    for (const el of meds) {
      if (el.closest("#experience, #education, #skills, #licenses")) continue;
      const t = text(el);
      if (!t || t === name || isJunkLine(t)) continue;
      return t;
    }
    node = node.parentElement;
  }
  const fallback = main?.querySelectorAll(".text-body-medium.break-words") || [];
  for (const el of fallback) {
    if (el.closest("#experience, #education, #skills")) continue;
    const t = text(el);
    if (t && t !== name && !isJunkLine(t)) return t;
  }
  return "";
}

function findLocation(main, name, headline) {
  const sel =
    "span.text-body-small, div.text-body-small.inline, .text-body-small.inline.t-black--light";
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

function extractCurrentRoleFromExperience() {
  const expSection =
    document.querySelector("#experience")?.closest("section") ||
    document.querySelector('[data-section="experience"]')?.closest("section");
  if (!expSection) return "";
  const items = expSection.querySelectorAll("li.artdeco-list__item");
  const list = Array.from(items).slice(0, 15);

  function titleFromLi(li) {
    const sels = [
      ".hoverable-link-text span[aria-hidden='true']",
      ".mr1.t-bold span[aria-hidden='true']",
      ".t-bold span[aria-hidden='true']",
      "div.hoverable-link-text span",
      ".t-bold span",
    ];
    for (const s of sels) {
      const t = text(li.querySelector(s));
      if (t) return t;
    }
    return "";
  }

  function caption(li) {
    return text(li.querySelector(".pvs-entity__caption-wrapper")) || "";
  }

  for (const li of list) {
    const cap = caption(li);
    const isCurrent =
      /\b(Present|Current|Adesso|Oggi|In corso)\b/i.test(cap) ||
      /–\s*Present/i.test(cap) ||
      /\d{4}\s*[-–]\s*Present/i.test(cap);
    const title = titleFromLi(li);
    if (title && isCurrent) return title;
  }

  for (const li of list) {
    const title = titleFromLi(li);
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
    if (/^(show all|mostra|endorse|endorsement|skill)/i.test(s) && s.length < 25)
      return;
    seen.add(low);
    skills.push(s);
  };

  const roots = [main, document.body].filter(Boolean);
  for (const root of roots) {
    root.querySelectorAll('a[href*="/skills/"]').forEach((a) => {
      if (a.closest(".global-nav")) return;
      const inner =
        a.querySelector("span[aria-hidden='true']") ||
        a.querySelector(".hoverable-link-text span") ||
        a;
      add(text(inner));
    });
  }

  const skillSection =
    document.querySelector("#skills")?.closest("section") ||
    document.querySelector('[data-section="skills"]')?.closest("section");
  if (skillSection) {
    skillSection.querySelectorAll("span[aria-hidden='true'], .hoverable-link-text span").forEach((el) => {
      const t = text(el);
      if (t && t.length < 80) add(t);
    });
  }

  if (skills.length > 40) skills.length = 40;
  return skills;
}

function scrapeProfile() {
  const url = window.location.href.split("?")[0].split("#")[0];
  if (!/\/in\/[^/]+/i.test(url)) {
    return { ok: false, error: "Apri una pagina profilo (/in/username)" };
  }

  const canon = url.match(/^(https?:\/\/[^/]+\/in\/[^/]+)/i);
  const profileUrl = canon ? canon[1] : url;

  const main = document.querySelector("main") || document.body;

  let name = "";
  const h1 = main.querySelector(
    "h1.text-heading-xlarge, h1.inline, main h1, h1.break-words"
  );
  if (h1) name = text(h1);

  const headline = findHeadline(main, name);
  const location = findLocation(main, name, headline);
  const currentRole = extractCurrentRoleFromExperience();
  const role = currentRole || headline || "";

  const skills = collectSkills(main);

  const experience = [];
  const expSection =
    document.querySelector("#experience")?.closest("section") ||
    document.querySelector('[data-section="experience"]')?.closest("section");
  const expItems = expSection?.querySelectorAll("li.artdeco-list__item") || [];
  expItems.forEach((li, idx) => {
    if (idx > 12) return;
    const titleEl = li.querySelector(
      ".hoverable-link-text, .mr1.t-bold span[aria-hidden='true'], .t-bold span"
    );
    const companyEl = li.querySelector(".t-14.t-normal span, .pv-entity__secondary-title");
    const rangeEl = li.querySelector(".pvs-entity__caption-wrapper, .pv-entity__bullet-item-v2");
    const descEl = li.querySelector(".inline-show-more-text, .pv-shared-text-with-see-more");
    const title = text(titleEl);
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
