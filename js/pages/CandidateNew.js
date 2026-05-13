import { defineComponent, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { state, addCandidate } from "../store.js";
import { importProfileFromUrl } from "../linkedin.js";

export default defineComponent({
  name: "CandidateNew",
  setup() {
    const router = useRouter();
    const linkedinUrl = ref("");
    const importing = ref(false);
    const importError = ref("");

    const model = ref({
      name: "",
      email: "",
      phone: "",
      role: "",
      location: "",
      headline: "",
      linkedinUrl: "",
      jobId: null,
      source: "Manuale",
      stage: "applied",
      rating: 0,
      _skillsText: "",
      notes: "",
      experience: [],
      education: [],
    });

    function applyExtensionImport(payload) {
      if (!payload || typeof payload !== "object") return;
      const skillsArr = Array.isArray(payload.skills) ? payload.skills : [];
      const skillsText = skillsArr.filter(Boolean).join(", ");
      const headline = (payload.headline || "").trim();
      const currentRole = (payload.currentRole || "").trim();
      const roleFromPayload = (payload.role || "").trim();
      const role =
        currentRole ||
        roleFromPayload ||
        (headline ? headline.split(/\s+at\s+|\s+@\s+|\s+·\s+/i)[0].trim() : "");
      const patch = {
        name: (payload.name || "").trim() || model.value.name,
        email: (payload.email || "").trim() || model.value.email,
        phone: (payload.phone || "").trim() || model.value.phone,
        role: role || model.value.role,
        location: (payload.location || "").trim() || model.value.location,
        headline: headline || model.value.headline,
        linkedinUrl: (payload.linkedinUrl || "").trim() || model.value.linkedinUrl,
        source: payload.source || "LinkedIn (estensione)",
        notes: (payload.notes || "").trim() || model.value.notes,
        _skillsText: skillsText || model.value._skillsText,
        experience: Array.isArray(payload.experience)
          ? payload.experience
          : model.value.experience,
        education: Array.isArray(payload.education)
          ? payload.education
          : model.value.education,
      };
      Object.assign(model.value, patch);
    }

    function tryConsumePendingExtensionImport() {
      const w = typeof window !== "undefined" ? window : null;
      if (!w?.__TALENTFLOW_EXTENSION_IMPORT__) return;
      applyExtensionImport(w.__TALENTFLOW_EXTENSION_IMPORT__);
      delete w.__TALENTFLOW_EXTENSION_IMPORT__;
    }

    const onExtensionImport = (e) => {
      if (e?.detail) applyExtensionImport(e.detail);
    };

    onMounted(() => {
      tryConsumePendingExtensionImport();
      window.addEventListener("talentflow-extension-import", onExtensionImport);
      nextTick(() => tryConsumePendingExtensionImport());
      const delays = [300, 600, 1200, 2200, 4000];
      delays.forEach((ms) => setTimeout(() => tryConsumePendingExtensionImport(), ms));
    });
    onBeforeUnmount(() => {
      window.removeEventListener("talentflow-extension-import", onExtensionImport);
    });

    async function importFromLinkedIn() {
      importError.value = "";
      if (!linkedinUrl.value) {
        importError.value = "Inserisci un URL LinkedIn valido";
        return;
      }
      try {
        importing.value = true;
        const draft = await importProfileFromUrl(linkedinUrl.value);
        Object.assign(model.value, {
          name: draft.name,
          headline: draft.headline,
          linkedinUrl: draft.linkedinUrl,
          source: "LinkedIn",
          notes: draft.notes,
        });
      } catch (e) {
        importError.value = e.message;
      } finally {
        importing.value = false;
      }
    }

    function save() {
      if (!model.value.name) {
        alert("Il nome è obbligatorio");
        return;
      }
      const skills = (model.value._skillsText || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { _skillsText: _unused, ...rest } = model.value;
      const c = addCandidate({
        ...rest,
        skills,
        experience: model.value.experience || [],
        education: model.value.education || [],
      });
      router.replace({ name: "candidate-detail", params: { id: c.id } });
    }

    return {
      linkedinUrl,
      importing,
      importError,
      model,
      state,
      importFromLinkedIn,
      save,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Nuovo candidato</h1>
        <p class="page-subtitle">Aggiungi manualmente o importa da LinkedIn</p>
      </div>
      <router-link to="/candidates" class="btn btn-light border">
        <i class="bi bi-x-lg"></i> Annulla
      </router-link>
    </div>

    <div class="row g-3">
      <div class="col-12 col-xl-4">
        <div class="card">
          <div class="card-body">
            <div class="d-flex align-items-center gap-2 mb-3">
              <i class="bi bi-linkedin linkedin-icon fs-4"></i>
              <span class="fw-semibold">Importa da LinkedIn</span>
            </div>
            <p class="small text-secondary">
              Incolla l'URL pubblico di un profilo LinkedIn per pre-compilare il candidato.
            </p>
            <p class="small text-secondary border-top pt-2 mt-2 mb-2">
              <strong>Estensione Chrome:</strong> carica la cartella <code class="small">extension/</code> in
              chrome://extensions (Modalità sviluppatore → Carica estensione non pacchettizzata). Apri un profilo
              <code class="small">/in/…</code>, clicca l'icona dell'estensione e poi «Leggi profilo e apri nuovo candidato».
            </p>
            <input v-model="linkedinUrl" class="form-control mb-2" placeholder="https://www.linkedin.com/in/nome-cognome/" />
            <div v-if="importError" class="alert alert-danger small py-2">{{ importError }}</div>
            <button class="btn btn-linkedin w-100" :disabled="importing" @click="importFromLinkedIn">
              <span v-if="importing"><span class="spinner-border spinner-border-sm me-1"></span> Importando...</span>
              <span v-else><i class="bi bi-cloud-arrow-down me-1"></i> Importa profilo</span>
            </button>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-8">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Dati candidato</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome *</label>
                <input v-model="model.name" class="form-control" required />
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
              <div class="col-md-6">
                <label class="form-label">Posizione</label>
                <select v-model="model.jobId" class="form-select">
                  <option :value="null">—</option>
                  <option v-for="j in state.jobs" :key="j.id" :value="j.id">{{ j.title }}</option>
                </select>
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
