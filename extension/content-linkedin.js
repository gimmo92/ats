/**
 * Estrazione best-effort dal DOM LinkedIn (soggetto a cambiamenti UI).
 */
function text(el) {
  return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
}

function scrapeProfile() {
  const url = window.location.href.split("?")[0].split("#")[0];
  if (!/\/in\/[^/]+/i.test(url)) {
    return { ok: false, error: "Apri una pagina profilo (/in/username)" };
  }

  const canon = url.match(/^(https?:\/\/[^/]+\/in\/[^/]+)/i);
  const profileUrl = canon ? canon[1] : url;

  let name = "";
  const h1 = document.querySelector(
    "h1.text-heading-xlarge, main h1.inline, main section h1, h1.break-words"
  );
  if (h1) name = text(h1);

  let headline = "";
  const headCandidates = document.querySelectorAll(
    ".pv-text-details__left-panel .text-body-medium, main .text-body-medium.break-words, div.text-body-medium"
  );
  for (const el of headCandidates) {
    const t = text(el);
    if (t && t !== name && t.length < 280) {
      headline = t;
      break;
    }
  }

  let location = "";
  const locEl = document.querySelector(
    ".pv-text-details__left-panel span.text-body-small, .text-body-small.inline"
  );
  if (locEl) {
    const t = text(locEl);
    if (t && !t.includes("Informazioni di contatto")) location = t;
  }

  const skills = [];
  document
    .querySelectorAll(
      "#skills ~ * a[href*='/skills/'], section[data-section='skills'] span, .pvs-list__container--one-column .mr1.hoverable-link-text"
    )
    .forEach((el) => {
      const t = text(el);
      if (t && t.length < 80 && !skills.includes(t)) skills.push(t);
    });
  if (skills.length > 25) skills.length = 25;

  const experience = [];
  const expSection = document.querySelector("#experience")?.closest("section");
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
      role: headline || "",
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
