import {
  state,
  logActivity,
  careerPageUrl,
  careersRedirectUrl,
} from "./store.js";

/** Logo Open Graph per anteprima condivisione LinkedIn (posizioni). */
export const SPARK_LINKEDIN_SHARE_LOGO_URL =
  "https://tryspark.co/wp-content/uploads/2023/01/logo-spark-psd-1.png";

/* ============================================================
   Modulo integrazione LinkedIn
   ------------------------------------------------------------
   Questo modulo gestisce:
   - OAuth 2.0 "Sign in with LinkedIn (OpenID Connect)"
     L'URL di autorizzazione è costruito secondo le specifiche di
     LinkedIn Developers. Lo scambio code -> access_token DEVE
     avvenire server-side (richiede client_secret) tramite il proxy
     /api/linkedin/token. In assenza di un backend, viene usata
     una modalità DEMO che simula la connessione.
   - Import profilo candidato:
        * tramite URL pubblico LinkedIn (estrae username e crea
          una bozza di candidato — i dati anagrafici reali
          vanno completati manualmente o via API ufficiali con
          le autorizzazioni corrette).
        * tramite Volunteer Experience API / Profile API quando
          il token è disponibile (placeholder).
   - Pubblicazione di un Job: in produzione si usa l'endpoint
     /v2/jobs (Talent Solutions) o gli Share API. Qui simuliamo
     con un mock e generiamo un URL post.
   ============================================================ */

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_SCOPES = ["openid", "profile", "email", "w_member_social"];

/**
 * Costruisce l'URL OAuth per "Sign in with LinkedIn".
 * Da utilizzare come window.location se si dispone di clientId reale.
 */
export function buildAuthorizeUrl({ clientId, redirectUri, state: csrf } = {}) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId || "DEMO_CLIENT_ID",
    redirect_uri:
      redirectUri || `${window.location.origin}/linkedin/callback`,
    scope: LINKEDIN_SCOPES.join(" "),
    state: csrf || cryptoRandom(),
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

function cryptoRandom() {
  const arr = new Uint8Array(16);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Connessione DEMO: in assenza di un backend OAuth, l'utente può
 * connettere un profilo simulato per provare l'app end-to-end.
 * In produzione: sostituire con il flow OAuth completo.
 */
export async function connectDemo({ name = "Recruiter Demo" } = {}) {
  await fakeDelay(900);
  state.settings.linkedin = {
    ...state.settings.linkedin,
    connected: true,
    profileName: name,
    profilePicture: null,
    connectedAt: new Date().toISOString(),
    mode: "demo",
  };
  logActivity({
    type: "linkedin_connect",
    message: `Connesso a LinkedIn come ${name} (demo)`,
  });
  return state.settings.linkedin;
}

export function disconnect() {
  state.settings.linkedin = {
    ...state.settings.linkedin,
    connected: false,
    profileName: null,
    profilePicture: null,
    connectedAt: null,
    mode: null,
  };
  logActivity({
    type: "linkedin_disconnect",
    message: "Account LinkedIn disconnesso",
  });
}

/**
 * Inizia il flow OAuth REALE. Richiede backend configurato.
 * Per default reindirizza alla pagina di authorize di LinkedIn.
 */
export function startOAuth({ clientId } = {}) {
  if (!clientId) {
    throw new Error(
      "Configurare il Client ID LinkedIn nelle Impostazioni per usare l'OAuth reale."
    );
  }
  const url = buildAuthorizeUrl({ clientId });
  // In produzione: aprire una popup e gestire il callback. Qui apriamo nuova tab.
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Estrae lo username pubblico da un URL LinkedIn.
 * Esempio: https://www.linkedin.com/in/giuliaromano/ -> giuliaromano
 */
export function parseLinkedInUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/linkedin\.com$/i.test(u.hostname.replace(/^www\./, ""))) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("in");
    if (idx >= 0 && parts[idx + 1]) {
      return decodeURIComponent(parts[idx + 1]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Importa un profilo da un URL pubblico LinkedIn.
 * In assenza di permessi API ufficiali, costruiamo una bozza
 * intelligente partendo dallo username e dai dati passati.
 * Restituisce un oggetto pronto per addCandidate().
 */
export async function importProfileFromUrl(url, hint = {}) {
  const username = parseLinkedInUrl(url);
  if (!username) {
    throw new Error(
      "URL LinkedIn non valido. Esempio atteso: https://www.linkedin.com/in/nome-cognome/"
    );
  }
  await fakeDelay(700);

  const guessedName =
    hint.name ||
    username
      .replace(/[-_.]+/g, " ")
      .replace(/\d+$/g, "")
      .trim()
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

  return {
    name: guessedName || "Nuovo candidato",
    email: hint.email || "",
    phone: hint.phone || "",
    role: hint.role || "",
    location: hint.location || "",
    headline: hint.headline || "",
    linkedinUrl: url,
    skills: hint.skills || [],
    experience: hint.experience || [],
    education: hint.education || [],
    source: "LinkedIn",
    notes: "",
  };
}

/**
 * Lista di profili "consigliati" simulati (la API reale di LinkedIn
 * Talent Recruiter espone /v2/peopleSearch con i giusti permessi).
 * Utile come UX di ricerca candidati direttamente dall'app.
 */
const SUGGESTED_PROFILES = [
  {
    name: "Federico Marchetti",
    headline: "Senior Frontend Engineer | Vue.js advocate",
    location: "Milano",
    skills: ["Vue.js", "TypeScript", "Pinia", "Vite", "Cypress"],
    linkedinUrl: "https://www.linkedin.com/in/federico-marchetti-vue/",
  },
  {
    name: "Alessia Donati",
    headline: "Backend Engineer | Node.js & PostgreSQL",
    location: "Roma",
    skills: ["Node.js", "PostgreSQL", "GraphQL", "AWS"],
    linkedinUrl: "https://www.linkedin.com/in/alessia-donati-node/",
  },
  {
    name: "Riccardo Pellegrini",
    headline: "Full-stack Engineer | React + Node",
    location: "Bologna",
    skills: ["React", "Node.js", "TypeScript", "Docker"],
    linkedinUrl: "https://www.linkedin.com/in/riccardo-pellegrini/",
  },
  {
    name: "Camilla Riva",
    headline: "Senior Product Manager | B2B SaaS",
    location: "Milano",
    skills: ["Product Management", "Roadmap", "JTBD", "Analytics"],
    linkedinUrl: "https://www.linkedin.com/in/camilla-riva/",
  },
  {
    name: "Tommaso Galli",
    headline: "DevOps Engineer | Kubernetes & Terraform",
    location: "Torino",
    skills: ["Kubernetes", "Terraform", "AWS", "GitOps"],
    linkedinUrl: "https://www.linkedin.com/in/tommaso-galli/",
  },
  {
    name: "Beatrice Lombardi",
    headline: "Senior UX Designer | Design Systems",
    location: "Milano",
    skills: ["Figma", "Design Systems", "Accessibility", "User Research"],
    linkedinUrl: "https://www.linkedin.com/in/beatrice-lombardi/",
  },
  {
    name: "Stefano Caruso",
    headline: "Mobile Engineer | Flutter & React Native",
    location: "Catania",
    skills: ["Flutter", "React Native", "iOS", "Android"],
    linkedinUrl: "https://www.linkedin.com/in/stefano-caruso/",
  },
  {
    name: "Veronica Sala",
    headline: "Data Engineer | Spark, Airflow",
    location: "Remote",
    skills: ["Python", "Spark", "Airflow", "Snowflake", "dbt"],
    linkedinUrl: "https://www.linkedin.com/in/veronica-sala/",
  },
];

export async function searchProfiles(query = "", filters = {}) {
  await fakeDelay(450);
  const q = query.trim().toLowerCase();
  return SUGGESTED_PROFILES.filter((p) => {
    if (!q) return true;
    const hay = [
      p.name,
      p.headline,
      p.location,
      ...(p.skills || []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }).filter((p) => {
    if (filters.location && !p.location.toLowerCase().includes(filters.location.toLowerCase()))
      return false;
    if (
      filters.skill &&
      !p.skills.some((s) => s.toLowerCase().includes(filters.skill.toLowerCase()))
    )
      return false;
    return true;
  });
}

/**
 * Pubblica un job su LinkedIn (mock).
 * In produzione: POST a /v2/simpleJobPostings (Talent Solutions)
 * o uso degli Share API per post sul feed dell'azienda.
 */
export async function postJobToLinkedIn(job) {
  if (!state.settings.linkedin.connected) {
    throw new Error("Devi connettere LinkedIn dalle Impostazioni.");
  }
  await fakeDelay(900);
  const postId = `li_post_${Date.now().toString(36)}`;
  job.linkedinPosted = true;
  job.linkedinPostId = postId;
  job.linkedinPostedAt = new Date().toISOString();
  logActivity({
    type: "job_posted",
    jobId: job.id,
    message: `Job '${job.title}' pubblicata su LinkedIn`,
  });
  return {
    postId,
    url: `https://www.linkedin.com/jobs/view/${postId}`,
  };
}

/**
 * Genera l'URL di condivisione LinkedIn (composer / share) per la posizione.
 * Con hash routing (#/carriere/:id) i crawler vedono solo index.html: usiamo
 * /api/share-job (Vercel) con query string per Open Graph con dati reali.
 * Se è configurato un redirect carriere esterno, si condivide quell'URL.
 */
export function buildShareUrl(job) {
  if (!job) return "";
  const externalCareers = careersRedirectUrl();
  if (externalCareers) {
    const pageUrl = careerPageUrl(job.id);
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      pageUrl
    )}`;
  }
  if (typeof window === "undefined") return "";

  const company =
    (state.settings?.company?.name || "Spark ATS").trim() || "Spark ATS";
  const params = new URLSearchParams();
  params.set("jobId", String(job.id || "").trim());
  params.set("title", String(job.title || "Posizione aperta").trim().slice(0, 200));
  params.set("company", company.slice(0, 120));

  const metaBits = [
    job.location,
    job.workMode,
    job.employmentType,
    job.department,
  ]
    .filter(Boolean)
    .join(" · ");
  const body = String(job.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
  const description = [metaBits, body].filter(Boolean).join(" — ").slice(0, 560);
  params.set("description", description);
  params.set("logo", SPARK_LINKEDIN_SHARE_LOGO_URL);

  const base = window.location.origin;
  const ogPage = `${base}/api/share-job?${params.toString()}`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    ogPage
  )}`;
}

function fakeDelay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
