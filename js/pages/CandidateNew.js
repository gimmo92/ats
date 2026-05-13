import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import { state, addCandidate, readCandidateCv } from "../store.js";

const EXT_SESSION_IMPORT_KEY = "__TF_ATS_LI_IMPORT__";

/** Valori demo per istruzione quando si importa da LinkedIn (estensione). */
const EXTENSION_IMPORT_DUMMY_EDU = {
  educationLevel: "Laurea magistrale",
  university: "Politecnico di Milano",
  faculty: "Ingegneria Gestionale",
};

export default defineComponent({
  name: "CandidateNew",
  setup() {
    const router = useRouter();

    const openJobs = computed(() =>
      (state.jobs || []).filter((j) => j.status === "open")
    );

    const model = ref({
      firstName: "Gianmarco",
      lastName: "Basso",
      email: "",
      phone: "",
      role: "CEO & Co-founder",
      location: "Varese",
      headline: "Trasparenza Salariale resa semplice con l'IA",
      linkedinUrl: "https://www.linkedin.com/in/gianmarcobasso",
      educationLevel: "",
      university: "",
      faculty: "",
      jobId: null,
      source: "Manuale",
      stage: "applied",
      rating: 0,
      _skillsText:
        "Sistema di gestione delle risorse umane, People analytics, AI integration",
      notes: "",
      experience: [],
      education: [],
      cvFileName: null,
      cvDataUrl: null,
    });

    const cvError = ref("");
    const cvInput = ref(null);
    function splitFullName(full) {
      const t = String(full || "").trim();
      if (!t) return { firstName: "", lastName: "" };
      const i = t.indexOf(" ");
      if (i === -1) return { firstName: t, lastName: "" };
      return {
        firstName: t.slice(0, i).trim(),
        lastName: t.slice(i + 1).trim(),
      };
    }

    function isJunkSkillText(s) {
      const t = String(s || "").trim();
      if (!t || t.length > 80) return true;
      if (/conferme?\s+di\s+competenza/i.test(t)) return true;
      if (/\d+\s*(conferme?|endorsement|endorsements)\b/i.test(t)) return true;
      if (/^skill(s)?$/i.test(t)) return true;
      return false;
    }

    function applyExtensionImport(payload) {
      if (!payload || typeof payload !== "object") return;
      const skillsArr = Array.isArray(payload.skills)
        ? payload.skills.filter((x) => !isJunkSkillText(x))
        : [];
      const skillsText = skillsArr.filter(Boolean).join(", ");
      const headline = (payload.headline || "").trim();
      const currentRole = (payload.currentRole || "").trim();
      const roleFromPayload = (payload.role || "").trim();
      const role =
        currentRole ||
        roleFromPayload ||
        (headline ? headline.split(/\s+at\s+|\s+@\s+|\s+·\s+/i)[0].trim() : "");
      const fullName = (payload.name || "").trim();
      const fromPayloadNames = {
        firstName: (payload.firstName || "").trim(),
        lastName: (payload.lastName || "").trim(),
      };
      const fromSplit = splitFullName(fullName);
      const firstName =
        fromPayloadNames.firstName ||
        fromSplit.firstName ||
        model.value.firstName;
      const lastName =
        fromPayloadNames.lastName ||
        fromSplit.lastName ||
        model.value.lastName;
      const patch = {
        firstName,
        lastName,
        email: (payload.email || "").trim() || model.value.email,
        phone: (payload.phone || "").trim() || model.value.phone,
        role: role || model.value.role,
        location: (payload.location || "").trim() || model.value.location,
        headline: headline || model.value.headline,
        linkedinUrl: (payload.linkedinUrl || "").trim() || model.value.linkedinUrl,
        source: payload.source || "LinkedIn (Spark)",
        notes: (payload.notes != null ? String(payload.notes) : "").trim(),
        _skillsText: skillsText || model.value._skillsText,
        experience: Array.isArray(payload.experience)
          ? payload.experience
          : model.value.experience,
        education: Array.isArray(payload.education)
          ? payload.education
          : model.value.education,
        ...EXTENSION_IMPORT_DUMMY_EDU,
      };
      Object.assign(model.value, patch);
      model.value = { ...model.value };
    }

    function triggerCvUpload() {
      cvInput.value?.click();
    }

    async function onCvSelected(event) {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      cvError.value = "";
      try {
        const { cvDataUrl, cvFileName } = await readCandidateCv(file);
        model.value.cvDataUrl = cvDataUrl;
        model.value.cvFileName = cvFileName;
        model.value = { ...model.value };
      } catch (e) {
        cvError.value = e.message || String(e);
      }
    }

    function removeCv() {
      model.value.cvDataUrl = null;
      model.value.cvFileName = null;
      cvError.value = "";
      model.value = { ...model.value };
    }

    function tryConsumeSessionStorageImport() {
      try {
        const raw = sessionStorage.getItem(EXT_SESSION_IMPORT_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const payload = parsed?.payload ?? parsed;
        if (!payload || typeof payload !== "object") return;
        sessionStorage.removeItem(EXT_SESSION_IMPORT_KEY);
        applyExtensionImport(payload);
      } catch {
        try {
          sessionStorage.removeItem(EXT_SESSION_IMPORT_KEY);
        } catch {
          /* ignore */
        }
      }
    }

    function tryConsumeAllExtensionImports() {
      tryConsumeSessionStorageImport();
      tryConsumePendingExtensionImport();
    }

    function tryConsumePendingExtensionImport() {
      const w = typeof window !== "undefined" ? window : null;
      if (!w?.__TALENTFLOW_EXTENSION_IMPORT__) return;
      applyExtensionImport(w.__TALENTFLOW_EXTENSION_IMPORT__);
      delete w.__TALENTFLOW_EXTENSION_IMPORT__;
    }

    const onExtensionImport = (e) => {
      if (e?.detail) applyExtensionImport(e.detail);
      tryConsumeAllExtensionImports();
    };

    let pollId = null;

    onMounted(() => {
      tryConsumeAllExtensionImports();
      window.addEventListener("talentflow-extension-import", onExtensionImport);
      nextTick(() => tryConsumeAllExtensionImports());
      const delays = [200, 500, 900, 1500, 2500, 4000, 6000, 8500];
      delays.forEach((ms) => setTimeout(() => tryConsumeAllExtensionImports(), ms));
      let ticks = 0;
      pollId = setInterval(() => {
        tryConsumeAllExtensionImports();
        if (++ticks > 48) {
          clearInterval(pollId);
          pollId = null;
        }
      }, 250);
    });
    onBeforeUnmount(() => {
      window.removeEventListener("talentflow-extension-import", onExtensionImport);
      if (pollId != null) clearInterval(pollId);
    });

    function save() {
      const first = (model.value.firstName || "").trim();
      const last = (model.value.lastName || "").trim();
      if (!first || !last) {
        alert("Nome e cognome sono obbligatori");
        return;
      }
      const fullName = `${first} ${last}`.trim();
      const skills = (model.value._skillsText || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { _skillsText: _unused, firstName: _f, lastName: _l, ...rest } =
        model.value;
      const c = addCandidate({
        ...rest,
        name: fullName,
        skills,
        experience: model.value.experience || [],
        education: model.value.education || [],
      });
      router.replace({ name: "candidate-detail", params: { id: c.id } });
    }

    return {
      model,
      state,
      openJobs,
      save,
      cvError,
      cvInput,
      triggerCvUpload,
      onCvSelected,
      removeCv,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Nuovo candidato</h1>
        <p class="page-subtitle">Inserisci i dati del candidato</p>
      </div>
      <router-link to="/candidates" class="btn btn-light border">
        <i class="bi bi-x-lg"></i> Annulla
      </router-link>
    </div>

    <div class="row g-3">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Dati candidato</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome *</label>
                <input v-model="model.firstName" class="form-control" placeholder="Nome" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Cognome *</label>
                <input v-model="model.lastName" class="form-control" placeholder="Cognome" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="model.email" type="email" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Telefono</label>
                <input v-model="model.phone" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">URL LinkedIn</label>
                <input v-model="model.linkedinUrl" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Ruolo</label>
                <input v-model="model.role" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Headline</label>
                <input v-model="model.headline" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Località</label>
                <input v-model="model.location" class="form-control" />
              </div>
              <div class="col-12">
                <hr class="my-1" />
                <div class="text-secondary small mb-2">Istruzione</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Livello di istruzione</label>
                <select v-model="model.educationLevel" class="form-select">
                  <option value="">—</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Laurea triennale">Laurea triennale</option>
                  <option value="Laurea magistrale">Laurea magistrale</option>
                  <option value="Laurea magistrale a ciclo unico">Laurea magistrale a ciclo unico</option>
                  <option value="Master / II livello">Master / II livello</option>
                  <option value="Dottorato di ricerca">Dottorato di ricerca</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Università / Scuola</label>
                <input
                  v-model="model.university"
                  class="form-control"
                  placeholder="es. Politecnico di Milano, Liceo scientifico…"
                />
              </div>
              <div class="col-md-4">
                <label class="form-label">Facoltà / Corso di studi</label>
                <input
                  v-model="model.faculty"
                  class="form-control"
                  placeholder="es. Ingegneria informatica"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label">Offerta di lavoro aperta</label>
                <select v-model="model.jobId" class="form-select">
                  <option :value="null">Nessuna offerta collegata</option>
                  <option v-for="j in openJobs" :key="j.id" :value="j.id">{{ j.title }}</option>
                </select>
                <div v-if="!openJobs.length" class="form-text text-secondary">
                  Non ci sono posizioni con stato «aperto». Apri o crea una posizione da Job.
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Sorgente</label>
                <input v-model="model.source" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Skill (separate da virgola)</label>
                <input v-model="model._skillsText" class="form-control" placeholder="Vue.js, TypeScript, ..." />
              </div>
              <div class="col-12">
                <label class="form-label">Note</label>
                <textarea v-model="model.notes" rows="3" class="form-control"></textarea>
              </div>
              <div class="col-12">
                <hr class="my-1" />
                <label class="form-label">Curriculum vitae</label>
                <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <input
                    ref="cvInput"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    class="d-none"
                    @change="onCvSelected"
                  />
                  <button type="button" class="btn btn-light border" @click="triggerCvUpload">
                    <i class="bi bi-upload me-1"></i> Carica CV
                  </button>
                  <button
                    v-if="model.cvDataUrl"
                    type="button"
                    class="btn btn-outline-danger"
                    @click="removeCv"
                  >
                    Rimuovi
                  </button>
                  <a
                    v-if="model.cvDataUrl"
                    :href="model.cvDataUrl"
                    class="btn btn-outline-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i class="bi bi-box-arrow-up-right me-1"></i> Apri
                  </a>
                  <a
                    v-if="model.cvDataUrl"
                    :href="model.cvDataUrl"
                    class="btn btn-outline-primary"
                    :download="model.cvFileName || 'curriculum.pdf'"
                  >
                    <i class="bi bi-download me-1"></i> Scarica
                  </a>
                </div>
                <div v-if="model.cvFileName" class="small text-secondary text-break">{{ model.cvFileName }}</div>
                <div class="form-text">PDF o Word, max 2,5 MB. Il file viene salvato nel browser (localStorage).</div>
                <div v-if="cvError" class="alert alert-danger small py-2 mb-0 mt-1">{{ cvError }}</div>
              </div>
            </div>
            <div class="mt-3 d-flex justify-content-end gap-2">
              <router-link to="/candidates" class="btn btn-light border">Annulla</router-link>
              <button class="btn btn-primary" @click="save">
                <i class="bi bi-check2 me-1"></i> Salva candidato
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
