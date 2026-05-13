import { reactive, watch, computed } from "vue";

/* ============================================================
   Costanti
   ============================================================ */
export const DEFAULT_PIPELINE_STAGES = [
  { id: "applied", label: "Candidatura", color: "#94a3b8", locked: true },
  { id: "screening", label: "Screening", color: "#f59e0b", locked: false },
  { id: "interview", label: "Colloquio", color: "#3b82f6", locked: false },
  { id: "offer", label: "Offerta", color: "#8b5cf6", locked: false },
  { id: "hired", label: "Assunto", color: "#10b981", locked: true },
  { id: "rejected", label: "Rifiutato", color: "#ef4444", locked: true },
];

/** @deprecated Usa state.settings.pipelineStages o getPipelineStages() */
export const STAGES = DEFAULT_PIPELINE_STAGES;

function clonePipelineStages() {
  return DEFAULT_PIPELINE_STAGES.map((s) => ({ ...s }));
}

export const JOB_STATUSES = [
  { id: "open", label: "Aperta", variant: "success" },
  { id: "paused", label: "In pausa", variant: "warning" },
  { id: "closed", label: "Chiusa", variant: "secondary" },
];

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contratto",
  "Stage",
  "Freelance",
];

export const WORK_MODES = ["In sede", "Ibrido", "Remoto"];

export const CAREERS_SOURCE = "Sito carriera";

const STORAGE_KEY = "talentflow-ats-v1";

export function defaultCareersPageSettings() {
  return {
    enabled: true,
    redirectUrl: "",
    headline: "Unisciti al nostro team",
    subheadline:
      "Scopri le opportunità aperte e candidati in pochi minuti. Valorizziamo talento, crescita e impatto reale.",
    showSalary: true,
    cultureTitle: "Perché lavorare con noi",
    cultureText:
      "Team multidisciplinare, cultura data-driven e spazio per sperimentare. Offriamo flessibilità, formazione continua e un ambiente inclusivo.",
    perks: [
      "Smart working e flessibilità",
      "Budget formazione annuale",
      "Welfare aziendale",
      "Team internazionale",
    ],
  };
}

/* ============================================================
   Util
   ============================================================ */
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(iso, opts = {}) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function careersRedirectUrl() {
  const raw = (careersPageSettings().redirectUrl || "").trim();
  return raw || null;
}

export function careerPageUrl(jobId = "") {
  const redirectUrl = careersRedirectUrl();
  if (redirectUrl) return redirectUrl;

  const base = `${window.location.origin}${window.location.pathname}`;
  return jobId
    ? `${base}#/carriere/${encodeURIComponent(jobId)}`
    : `${base}#/carriere`;
}

export const COMPANY_IMAGE_LIMITS = {
  logo: { maxBytes: 1024 * 1024, label: "Logo" },
  banner: { maxBytes: 2 * 1024 * 1024, label: "Banner" },
};

export function readCompanyImage(file, kind = "logo") {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Seleziona un file immagine valido."));
      return;
    }

    const limit = COMPANY_IMAGE_LIMITS[kind]?.maxBytes || 2 * 1024 * 1024;
    if (file.size > limit) {
      const maxMb = (limit / (1024 * 1024)).toFixed(1);
      reject(
        new Error(
          `Il file supera la dimensione massima consentita (${maxMb} MB).`
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error("Impossibile leggere il file selezionato."));
    reader.readAsDataURL(file);
  });
}

export function relativeFromNow(iso) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  const future = diff > 0;
  let value, unit;
  if (abs < hour) {
    value = Math.round(abs / min);
    unit = "min";
  } else if (abs < day) {
    value = Math.round(abs / hour);
    unit = "h";
  } else {
    value = Math.round(abs / day);
    unit = "g";
  }
  return future ? `tra ${value}${unit}` : `${value}${unit} fa`;
}

/* ============================================================
   Seed data realistico
   ============================================================ */
function seed() {
  const jobs = [
    {
      id: "job_fe_senior",
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Milano",
      workMode: "Ibrido",
      employmentType: "Full-time",
      salaryMin: 50000,
      salaryMax: 70000,
      currency: "EUR",
      status: "open",
      description:
        "Cerchiamo uno Senior Frontend Engineer con esperienza in Vue.js o React per guidare lo sviluppo della nostra piattaforma SaaS.",
      requirements: [
        "5+ anni di esperienza in frontend development",
        "Padronanza di Vue.js 3 / React",
        "TypeScript",
        "Esperienza con design systems",
        "Conoscenza di tooling moderno (Vite, Webpack)",
      ],
      benefits: [
        "Stock options",
        "Smart working ibrido",
        "Budget formazione 2.000€",
        "Buoni pasto",
      ],
      skills: ["Vue.js", "TypeScript", "CSS", "Vite", "Testing"],
      createdAt: daysAgo(18),
      linkedinPosted: true,
      linkedinPostId: "li_post_demo_1",
      careersPublished: true,
      hiringManager: "Laura Bianchi",
    },
    {
      id: "job_be_node",
      title: "Backend Engineer Node.js",
      department: "Engineering",
      location: "Roma",
      workMode: "Remoto",
      employmentType: "Full-time",
      salaryMin: 45000,
      salaryMax: 60000,
      currency: "EUR",
      status: "open",
      description:
        "Backend engineer per microservizi Node.js, GraphQL e PostgreSQL su AWS.",
      requirements: [
        "3+ anni con Node.js",
        "GraphQL e REST API",
        "PostgreSQL, Redis",
        "Docker, Kubernetes",
        "AWS / GCP",
      ],
      benefits: ["Full remote", "Welfare aziendale", "MacBook Pro"],
      skills: ["Node.js", "GraphQL", "PostgreSQL", "AWS", "Docker"],
      createdAt: daysAgo(12),
      linkedinPosted: true,
      careersPublished: true,
      hiringManager: "Marco Rossi",
    },
    {
      id: "job_pm",
      title: "Product Manager",
      department: "Product",
      location: "Milano",
      workMode: "Ibrido",
      employmentType: "Full-time",
      salaryMin: 55000,
      salaryMax: 75000,
      currency: "EUR",
      status: "open",
      description:
        "PM per la nostra business unit Enterprise. Owner di roadmap e KPI di prodotto.",
      requirements: [
        "4+ anni come PM B2B SaaS",
        "Esperienza in discovery",
        "Data-driven, SQL base",
        "Inglese fluente",
      ],
      benefits: ["Carriera internazionale", "MBPP", "Coaching"],
      skills: ["Product Management", "B2B SaaS", "Roadmap", "SQL"],
      createdAt: daysAgo(7),
      linkedinPosted: false,
      careersPublished: true,
      hiringManager: "Chiara Verdi",
    },
    {
      id: "job_designer",
      title: "Senior UX/UI Designer",
      department: "Design",
      location: "Torino",
      workMode: "Ibrido",
      employmentType: "Full-time",
      salaryMin: 42000,
      salaryMax: 58000,
      currency: "EUR",
      status: "paused",
      description: "Designer per evolvere il nostro design system.",
      requirements: ["Figma expert", "Design system", "Prototyping"],
      benefits: ["Wellness budget", "Conferenze internazionali"],
      skills: ["Figma", "Design Systems", "User Research"],
      createdAt: daysAgo(25),
      linkedinPosted: true,
      careersPublished: false,
      hiringManager: "Laura Bianchi",
    },
    {
      id: "job_devops",
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Bologna",
      workMode: "Remoto",
      employmentType: "Full-time",
      salaryMin: 48000,
      salaryMax: 65000,
      currency: "EUR",
      status: "open",
      description: "DevOps engineer per infrastruttura cloud-native.",
      requirements: ["Kubernetes", "Terraform", "AWS", "CI/CD"],
      benefits: ["Full remote", "Bonus performance"],
      skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Linux"],
      createdAt: daysAgo(4),
      linkedinPosted: false,
      careersPublished: true,
      hiringManager: "Marco Rossi",
    },
  ];

  const candidates = [
    candidate({
      name: "Giulia Romano",
      email: "giulia.romano@example.com",
      phone: "+39 333 1112233",
      role: "Senior Frontend Engineer",
      location: "Milano",
      headline: "Senior Frontend Engineer @ FintechCo",
      linkedinUrl: "https://www.linkedin.com/in/giuliaromano",
      skills: ["Vue.js", "TypeScript", "CSS", "Vite", "Cypress"],
      experience: [
        {
          title: "Senior Frontend Engineer",
          company: "FintechCo",
          from: "2022-01",
          to: null,
          description: "Lead del refactor architetturale a Vue 3 + Vite.",
        },
        {
          title: "Frontend Engineer",
          company: "WebStudio",
          from: "2018-06",
          to: "2021-12",
          description: "Sviluppo SPA in Vue 2 e React.",
        },
      ],
      education: [
        {
          school: "Politecnico di Milano",
          degree: "MSc Computer Engineering",
          year: "2018",
        },
      ],
      stage: "interview",
      jobId: "job_fe_senior",
      rating: 5,
      source: "LinkedIn",
      tags: ["top-talent"],
      appliedAt: daysAgo(10),
      educationLevel: "Laurea magistrale",
      university: "Politecnico di Milano",
      faculty: "Ingegneria informatica",
    }),
    candidate({
      name: "Andrea Conti",
      email: "andrea.conti@example.com",
      phone: "+39 339 8765432",
      role: "Frontend Engineer",
      location: "Remote (Napoli)",
      headline: "Frontend Engineer | Vue & React",
      linkedinUrl: "https://www.linkedin.com/in/andreaconti",
      skills: ["Vue.js", "React", "JavaScript", "Tailwind"],
      experience: [
        {
          title: "Frontend Engineer",
          company: "AgencyOne",
          from: "2020-03",
          to: null,
          description: "Sviluppo applicazioni e-commerce.",
        },
      ],
      education: [
        {
          school: "Università Federico II",
          degree: "BSc Informatica",
          year: "2020",
        },
      ],
      stage: "screening",
      jobId: "job_fe_senior",
      rating: 4,
      source: "LinkedIn",
      tags: [],
      appliedAt: daysAgo(6),
      educationLevel: "Laurea triennale",
      university: "Università degli Studi di Napoli Federico II",
      faculty: "Informatica",
    }),
    candidate({
      name: "Sara Esposito",
      email: "sara.esposito@example.com",
      phone: "+39 320 1239876",
      role: "Backend Engineer",
      location: "Roma",
      headline: "Node.js Backend Engineer | GraphQL",
      linkedinUrl: "https://www.linkedin.com/in/saraesposito",
      skills: ["Node.js", "GraphQL", "PostgreSQL", "AWS", "TypeScript"],
      experience: [
        {
          title: "Backend Engineer",
          company: "SaaSHub",
          from: "2021-09",
          to: null,
          description: "Microservizi Node + GraphQL su AWS.",
        },
      ],
      education: [
        { school: "Sapienza", degree: "MSc Ingegneria Informatica", year: "2021" },
      ],
      stage: "offer",
      jobId: "job_be_node",
      rating: 5,
      source: "Referral",
      tags: ["referral"],
      appliedAt: daysAgo(20),
      educationLevel: "Laurea magistrale",
      university: "Sapienza Università di Roma",
      faculty: "Ingegneria informatica",
    }),
    candidate({
      name: "Luca Ferrari",
      email: "luca.ferrari@example.com",
      phone: "+39 348 5556677",
      role: "Backend Engineer",
      location: "Milano",
      headline: "Software Engineer @ TechCorp",
      linkedinUrl: "https://www.linkedin.com/in/lucaferrari",
      skills: ["Node.js", "Java", "PostgreSQL", "Kafka"],
      experience: [
        {
          title: "Software Engineer",
          company: "TechCorp",
          from: "2019-05",
          to: null,
          description: "Servizi backend per piattaforma logistica.",
        },
      ],
      education: [
        { school: "Politecnico di Torino", degree: "MSc CS", year: "2019" },
      ],
      stage: "applied",
      jobId: "job_be_node",
      rating: 3,
      source: "LinkedIn",
      tags: [],
      appliedAt: daysAgo(2),
      educationLevel: "Laurea magistrale",
      university: "Politecnico di Torino",
      faculty: "Informatica",
    }),
    candidate({
      name: "Marta Greco",
      email: "marta.greco@example.com",
      phone: "+39 327 7654321",
      role: "Product Manager",
      location: "Milano",
      headline: "Senior PM @ B2BSaaS",
      linkedinUrl: "https://www.linkedin.com/in/martagreco",
      skills: ["Product Management", "Roadmap", "SQL", "B2B"],
      experience: [
        {
          title: "Senior PM",
          company: "B2BSaaS",
          from: "2020-01",
          to: null,
          description: "Owner della BU Enterprise.",
        },
      ],
      education: [
        { school: "Bocconi", degree: "MSc Management", year: "2017" },
      ],
      stage: "interview",
      jobId: "job_pm",
      rating: 4,
      source: "LinkedIn",
      tags: [],
      appliedAt: daysAgo(8),
      educationLevel: "Laurea magistrale",
      university: "Università Bocconi",
      faculty: "Management",
    }),
    candidate({
      name: "Davide Marini",
      email: "davide.marini@example.com",
      phone: "+39 333 4445566",
      role: "DevOps Engineer",
      location: "Bologna",
      headline: "Cloud Engineer @ CloudNative",
      linkedinUrl: "https://www.linkedin.com/in/davidemarini",
      skills: ["Kubernetes", "Terraform", "AWS", "Linux", "CI/CD"],
      experience: [
        {
          title: "Cloud Engineer",
          company: "CloudNative",
          from: "2021-02",
          to: null,
          description: "Infrastruttura su AWS, GitOps con ArgoCD.",
        },
      ],
      education: [
        { school: "Università di Bologna", degree: "MSc CS", year: "2020" },
      ],
      stage: "screening",
      jobId: "job_devops",
      rating: 4,
      source: "Sito carriera",
      tags: [],
      appliedAt: daysAgo(3),
      educationLevel: "Laurea magistrale",
      university: "Università di Bologna",
      faculty: "Informatica",
    }),
    candidate({
      name: "Elena Russo",
      email: "elena.russo@example.com",
      phone: "+39 320 9988776",
      role: "UX Designer",
      location: "Torino",
      headline: "Senior UX Designer | Design Systems",
      linkedinUrl: "https://www.linkedin.com/in/elenarusso",
      skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
      experience: [
        {
          title: "Senior UX Designer",
          company: "DesignLab",
          from: "2019-11",
          to: null,
          description: "Owner del design system aziendale.",
        },
      ],
      education: [
        { school: "IED Milano", degree: "Design", year: "2017" },
      ],
      stage: "hired",
      jobId: "job_designer",
      rating: 5,
      source: "LinkedIn",
      tags: ["hired"],
      appliedAt: daysAgo(45),
      educationLevel: "Laurea triennale",
      university: "IED Milano",
      faculty: "Design",
    }),
    candidate({
      name: "Matteo Bruno",
      email: "matteo.bruno@example.com",
      phone: "+39 339 1100220",
      role: "Frontend Engineer",
      location: "Padova",
      headline: "Frontend Developer | React",
      linkedinUrl: "https://www.linkedin.com/in/matteobruno",
      skills: ["React", "Next.js", "JavaScript", "GraphQL"],
      experience: [
        {
          title: "Frontend Developer",
          company: "ShopPro",
          from: "2022-04",
          to: null,
          description: "Storefront e-commerce headless.",
        },
      ],
      education: [
        { school: "Università di Padova", degree: "BSc Informatica", year: "2022" },
      ],
      stage: "rejected",
      jobId: "job_fe_senior",
      rating: 2,
      source: "LinkedIn",
      tags: [],
      appliedAt: daysAgo(28),
      rejectedReason: "Esperienza non sufficiente per il livello senior.",
      educationLevel: "Laurea triennale",
      university: "Università di Padova",
      faculty: "Informatica",
    }),
    candidate({
      name: "Francesca De Luca",
      email: "francesca.deluca@example.com",
      phone: "+39 333 8877665",
      role: "Backend Engineer",
      location: "Milano",
      headline: "Software Engineer @ Fintech",
      linkedinUrl: "https://www.linkedin.com/in/francescadeluca",
      skills: ["Node.js", "TypeScript", "PostgreSQL", "Redis"],
      experience: [
        {
          title: "Software Engineer",
          company: "Fintech",
          from: "2020-09",
          to: null,
          description: "Servizi di pagamento real-time.",
        },
      ],
      education: [
        { school: "Politecnico di Milano", degree: "MSc CS", year: "2020" },
      ],
      stage: "applied",
      jobId: "job_be_node",
      rating: 4,
      source: "LinkedIn",
      tags: [],
      appliedAt: daysAgo(1),
      educationLevel: "Laurea magistrale",
      university: "Politecnico di Milano",
      faculty: "Informatica",
    }),
  ];

  const interviews = [
    {
      id: uid("itw"),
      candidateId: candidates[0].id,
      jobId: "job_fe_senior",
      title: "Tech Interview - Vue 3 deep dive",
      date: daysFromNow(2, 14, 30),
      durationMin: 60,
      type: "Tecnica",
      mode: "Video",
      location: "Google Meet",
      interviewers: ["Laura Bianchi", "Marco Rossi"],
      notes: "Approfondire reactivity API, Composition API e Pinia.",
      status: "scheduled",
    },
    {
      id: uid("itw"),
      candidateId: candidates[2].id,
      jobId: "job_be_node",
      title: "Final round - Cultural fit",
      date: daysFromNow(1, 10, 0),
      durationMin: 45,
      type: "Culturale",
      mode: "Video",
      location: "Zoom",
      interviewers: ["Chiara Verdi"],
      notes: "Allineamento valori e aspettative crescita.",
      status: "scheduled",
    },
    {
      id: uid("itw"),
      candidateId: candidates[4].id,
      jobId: "job_pm",
      title: "Case study - Roadmap Q3",
      date: daysFromNow(4, 11, 0),
      durationMin: 90,
      type: "Case study",
      mode: "On-site",
      location: "Sede Milano - Sala Vega",
      interviewers: ["Chiara Verdi", "Laura Bianchi"],
      notes: "Esercizio prioritization framework.",
      status: "scheduled",
    },
    {
      id: uid("itw"),
      candidateId: candidates[1].id,
      jobId: "job_fe_senior",
      title: "HR Screening",
      date: daysFromNow(-1, 9, 30),
      durationMin: 30,
      type: "Screening",
      mode: "Video",
      location: "Google Meet",
      interviewers: ["Sofia HR"],
      notes: "Match motivazionale ottimo.",
      status: "completed",
    },
  ];

  const activity = [
    {
      id: uid("act"),
      type: "stage_change",
      candidateId: candidates[0].id,
      message: "Giulia Romano spostata in Colloquio",
      at: daysAgo(1),
    },
    {
      id: uid("act"),
      type: "linkedin_import",
      candidateId: candidates[1].id,
      message: "Andrea Conti importato da LinkedIn",
      at: daysAgo(6),
    },
    {
      id: uid("act"),
      type: "job_posted",
      jobId: "job_fe_senior",
      message: "Job 'Senior Frontend Engineer' pubblicata su LinkedIn",
      at: daysAgo(18),
    },
    {
      id: uid("act"),
      type: "hired",
      candidateId: candidates[6].id,
      message: "Elena Russo assunta come Senior UX Designer",
      at: daysAgo(15),
    },
  ];

  const settings = {
    company: {
      name: "Spark ATS",
      website: "https://spark.example.com",
      industry: "SaaS",
      logoUrl: null,
      bannerUrl: null,
    },
    user: {
      name: "Recruiter Demo",
      email: "demo@spark.example.com",
      role: "Lead Recruiter",
    },
    linkedin: {
      connected: false,
      profileName: null,
      profilePicture: null,
      clientId: "",
      autoSync: true,
    },
    theme: "light",
    careersPage: defaultCareersPageSettings(),
    pipelineStages: clonePipelineStages(),
  };

  return { jobs, candidates, interviews, activity, settings };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function candidate(partial) {
  return {
    id: uid("cand"),
    name: "",
    email: "",
    phone: "",
    role: "",
    location: "",
    headline: "",
    linkedinUrl: "",
    avatarUrl: null,
    skills: [],
    experience: [],
    education: [],
    stage: "applied",
    jobId: null,
    rating: 0,
    source: "Manuale",
    tags: [],
    notes: "",
    appliedAt: nowIso(),
    rejectedReason: "",
    educationLevel: "",
    university: "",
    faculty: "",
    ...partial,
  };
}

/* ============================================================
   State globale
   ============================================================ */
function normalizeState(parsed) {
  if (!parsed.settings) parsed.settings = {};
  if (!parsed.settings.company) parsed.settings.company = {};
  if (parsed.settings.company.logoUrl === undefined) {
    parsed.settings.company.logoUrl = null;
  }
  if (parsed.settings.company.bannerUrl === undefined) {
    parsed.settings.company.bannerUrl = null;
  }
  if (!parsed.settings.careersPage) {
    parsed.settings.careersPage = defaultCareersPageSettings();
  } else {
    parsed.settings.careersPage = {
      ...defaultCareersPageSettings(),
      ...parsed.settings.careersPage,
    };
  }
  if (!parsed.settings.pipelineStages?.length) {
    parsed.settings.pipelineStages = clonePipelineStages();
  } else {
    parsed.settings.pipelineStages = parsed.settings.pipelineStages.map(
      (s) => {
        const d = DEFAULT_PIPELINE_STAGES.find((x) => x.id === s.id);
        return {
          id: String(s.id || "").trim() || uid("stg"),
          label: String((s.label ?? d?.label) || "Fase").trim() || "Fase",
          color: s.color || d?.color || "#64748b",
          locked: d ? !!d.locked : false,
        };
      }
    );
  }
  const validStageIds = new Set(
    parsed.settings.pipelineStages.map((s) => s.id)
  );
  parsed.candidates.forEach((c) => {
    if (!validStageIds.has(c.stage)) c.stage = "applied";
    if (c.educationLevel == null) c.educationLevel = "";
    if (c.university == null) c.university = "";
    if (c.faculty == null) c.faculty = "";
  });
  parsed.jobs.forEach((job) => {
    if (job.careersPublished === undefined) {
      job.careersPublished = job.status === "open";
    }
  });
  return parsed;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.candidates && parsed.jobs) {
        return normalizeState(parsed);
      }
    }
  } catch (e) {
    console.warn("Errore caricamento stato, uso seed:", e);
  }
  return seed();
}

export const state = reactive(loadState());

let saveTimer = null;
watch(
  state,
  () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Errore salvataggio:", e);
      }
    }, 200);
  },
  { deep: true }
);

/* ============================================================
   Selectors / azioni
   ============================================================ */
export const stats = computed(() => {
  const totalCandidates = state.candidates.length;
  const openJobs = state.jobs.filter((j) => j.status === "open").length;
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const month = 30 * 24 * 3600 * 1000;

  const interviewsThisWeek = state.interviews.filter((i) => {
    const t = new Date(i.date).getTime();
    return t >= now - week && t <= now + week && i.status !== "cancelled";
  }).length;

  const hiredThisMonth = state.candidates.filter(
    (c) =>
      c.stage === "hired" &&
      new Date(c.appliedAt).getTime() >= now - month
  ).length;

  const inPipeline = state.candidates.filter(
    (c) => c.stage !== "hired" && c.stage !== "rejected"
  ).length;

  return {
    totalCandidates,
    openJobs,
    interviewsThisWeek,
    hiredThisMonth,
    inPipeline,
  };
});

export function jobById(id) {
  return state.jobs.find((j) => j.id === id) || null;
}

export function careersPageSettings() {
  return state.settings.careersPage || defaultCareersPageSettings();
}

export function isCareersPageEnabled() {
  return careersPageSettings().enabled !== false;
}

export function isJobPublishedOnCareers(job) {
  if (!job) return false;
  return job.status === "open" && job.careersPublished !== false;
}

export function careersJobs() {
  if (!isCareersPageEnabled()) return [];
  return state.jobs
    .filter((job) => isJobPublishedOnCareers(job))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function careerJobById(id) {
  const job = jobById(id);
  return isJobPublishedOnCareers(job) ? job : null;
}
export function candidateById(id) {
  return state.candidates.find((c) => c.id === id) || null;
}
export function candidatesByJob(jobId) {
  return state.candidates.filter((c) => c.jobId === jobId);
}
export function candidatesByStage(stage) {
  return state.candidates.filter((c) => c.stage === stage);
}

export function addCandidate(payload) {
  const c = candidate({ ...payload, id: uid("cand"), appliedAt: nowIso() });
  state.candidates.unshift(c);
  logActivity({
    type: "candidate_added",
    candidateId: c.id,
    message: `Candidato ${c.name} aggiunto`,
  });
  return c;
}

export function applyFromCareersPage(payload) {
  const job = careerJobById(payload.jobId);
  if (!job) throw new Error("Posizione non disponibile per candidature");

  const skills = (payload.skills || [])
    .map((skill) => skill.trim())
    .filter(Boolean);
  const notes = [payload.coverLetter, payload.notes]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join("\n\n");

  const candidate = addCandidate({
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
    role: job.title,
    location: payload.location || job.location || "",
    headline: payload.headline || "",
    linkedinUrl: payload.linkedinUrl || "",
    jobId: job.id,
    source: CAREERS_SOURCE,
    stage: "applied",
    skills,
    notes,
  });

  logActivity({
    type: "careers_application",
    candidateId: candidate.id,
    jobId: job.id,
    message: `${candidate.name} si è candidato/a a '${job.title}' dal sito carriere`,
  });

  return candidate;
}

export function updateCandidate(id, patch) {
  const c = candidateById(id);
  if (!c) return null;
  Object.assign(c, patch);
  return c;
}

export function deleteCandidate(id) {
  const idx = state.candidates.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const c = state.candidates[idx];
  state.candidates.splice(idx, 1);
  state.interviews = state.interviews.filter((i) => i.candidateId !== id);
  logActivity({
    type: "candidate_deleted",
    message: `Candidato ${c.name} eliminato`,
  });
}

export function pipelineStageById(id) {
  return state.settings.pipelineStages?.find((s) => s.id === id) || null;
}

export function stageBadgeStyle(stageId) {
  const s = pipelineStageById(stageId);
  const bg = s?.color || "#64748b";
  return { backgroundColor: bg, color: "#fff" };
}

export function addPipelineStage({ label, color }) {
  const trimmed = (label || "").trim();
  if (!trimmed) throw new Error("Inserisci un nome per la fase.");
  const st = {
    id: uid("stg"),
    label: trimmed,
    color: (color || "").trim() || "#6366f1",
    locked: false,
  };
  state.settings.pipelineStages.push(st);
  logActivity({
    type: "system",
    message: `Nuova fase pipeline: ${st.label}`,
  });
  return st;
}

export function removePipelineStage(stageId, moveToId) {
  const stages = state.settings.pipelineStages;
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx === -1) throw new Error("Fase non trovata.");
  const st = stages[idx];
  if (st.locked) throw new Error("Questa fase non può essere eliminata.");
  const target = stages.find((s) => s.id === moveToId);
  if (!target || target.id === stageId) {
    throw new Error("Seleziona una fase di destinazione valida.");
  }
  state.candidates.forEach((c) => {
    if (c.stage === stageId) c.stage = moveToId;
  });
  stages.splice(idx, 1);
  logActivity({
    type: "system",
    message: `Fase "${st.label}" rimossa; candidati spostati in "${target.label}"`,
  });
}

export function moveCandidateStage(id, newStage) {
  const c = candidateById(id);
  if (!c || c.stage === newStage) return;
  const old = c.stage;
  c.stage = newStage;
  const stageLabel =
    pipelineStageById(newStage)?.label || newStage;
  logActivity({
    type: "stage_change",
    candidateId: id,
    message: `${c.name}: ${
      pipelineStageById(old)?.label || old
    } → ${stageLabel}`,
  });
  if (newStage === "hired") {
    logActivity({
      type: "hired",
      candidateId: id,
      message: `${c.name} assunto/a!`,
    });
  }
}

export function addJob(payload) {
  const j = {
    id: uid("job"),
    title: "",
    department: "",
    location: "",
    workMode: "Ibrido",
    employmentType: "Full-time",
    salaryMin: null,
    salaryMax: null,
    currency: "EUR",
    status: "open",
    description: "",
    requirements: [],
    benefits: [],
    skills: [],
    createdAt: nowIso(),
    linkedinPosted: false,
    careersPublished: true,
    hiringManager: "",
    ...payload,
  };
  state.jobs.unshift(j);
  logActivity({
    type: "job_created",
    jobId: j.id,
    message: `Job '${j.title}' creata`,
  });
  return j;
}

export function updateJob(id, patch) {
  const j = jobById(id);
  if (!j) return null;
  Object.assign(j, patch);
  return j;
}

export function deleteJob(id) {
  const idx = state.jobs.findIndex((j) => j.id === id);
  if (idx === -1) return;
  const j = state.jobs[idx];
  state.jobs.splice(idx, 1);
  state.candidates.forEach((c) => {
    if (c.jobId === id) c.jobId = null;
  });
  logActivity({
    type: "job_deleted",
    message: `Job '${j.title}' eliminata`,
  });
}

export function addInterview(payload) {
  const i = {
    id: uid("itw"),
    candidateId: null,
    jobId: null,
    title: "",
    date: nowIso(),
    durationMin: 60,
    type: "Tecnica",
    mode: "Video",
    location: "",
    interviewers: [],
    notes: "",
    status: "scheduled",
    ...payload,
  };
  state.interviews.push(i);
  const cand = candidateById(i.candidateId);
  logActivity({
    type: "interview_scheduled",
    candidateId: i.candidateId,
    message: `Colloquio programmato${cand ? ` con ${cand.name}` : ""}`,
  });
  return i;
}

export function updateInterview(id, patch) {
  const i = state.interviews.find((x) => x.id === id);
  if (!i) return null;
  Object.assign(i, patch);
  return i;
}

export function deleteInterview(id) {
  const idx = state.interviews.findIndex((x) => x.id === id);
  if (idx === -1) return;
  state.interviews.splice(idx, 1);
}

export function logActivity(entry) {
  state.activity.unshift({
    id: uid("act"),
    at: nowIso(),
    ...entry,
  });
  if (state.activity.length > 200) state.activity.length = 200;
}

export function resetData() {
  const fresh = seed();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
  logActivity({ type: "system", message: "Dati ripristinati a seed iniziale" });
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}

export function importData(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  if (!parsed.candidates || !parsed.jobs)
    throw new Error("Formato non valido");
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, normalizeState(parsed));
}
