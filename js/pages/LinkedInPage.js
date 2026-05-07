import { defineComponent, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { state, addCandidate, formatDate } from "../store.js";
import {
  connectDemo,
  disconnect,
  startOAuth,
  searchProfiles,
  importProfileFromUrl,
  buildAuthorizeUrl,
  LINKEDIN_SCOPES,
} from "../linkedin.js";

export default defineComponent({
  name: "LinkedInPage",
  setup() {
    const router = useRouter();
    const connecting = ref(false);
    const error = ref("");

    const query = ref("");
    const filterLocation = ref("");
    const filterSkill = ref("");
    const results = ref([]);
    const searching = ref(false);

    // Import via URL
    const url = ref("");
    const urlImporting = ref(false);
    const urlError = ref("");
    const urlSuccess = ref(null);

    async function doConnectDemo() {
      error.value = "";
      try {
        connecting.value = true;
        await connectDemo({ name: state.settings.user.name || "Recruiter Demo" });
      } catch (e) {
        error.value = e.message;
      } finally {
        connecting.value = false;
      }
    }
    function doConnectOAuth() {
      try {
        startOAuth({ clientId: state.settings.linkedin.clientId });
      } catch (e) {
        error.value = e.message;
      }
    }
    async function doSearch() {
      error.value = "";
      try {
        searching.value = true;
        results.value = await searchProfiles(query.value, {
          location: filterLocation.value,
          skill: filterSkill.value,
        });
      } finally {
        searching.value = false;
      }
    }

    async function importProfile(p) {
      const cand = addCandidate({
        name: p.name,
        headline: p.headline,
        location: p.location,
        skills: p.skills,
        linkedinUrl: p.linkedinUrl,
        source: "LinkedIn",
        notes: "Importato dalla ricerca profili LinkedIn.",
      });
      router.push({ name: "candidate-detail", params: { id: cand.id } });
    }

    async function importFromUrl() {
      urlError.value = "";
      urlSuccess.value = null;
      if (!url.value) {
        urlError.value = "Inserisci un URL";
        return;
      }
      try {
        urlImporting.value = true;
        const draft = await importProfileFromUrl(url.value);
        const cand = addCandidate(draft);
        urlSuccess.value = cand;
        url.value = "";
      } catch (e) {
        urlError.value = e.message;
      } finally {
        urlImporting.value = false;
      }
    }

    const authorizeUrl = computed(() =>
      buildAuthorizeUrl({
        clientId: state.settings.linkedin.clientId || "DEMO_CLIENT_ID",
      })
    );

    const redirectUri = `${window.location.origin}/linkedin/callback`;

    return {
      state,
      redirectUri,
      connecting,
      error,
      doConnectDemo,
      doConnectOAuth,
      disconnect,
      query,
      filterLocation,
      filterSkill,
      results,
      searching,
      doSearch,
      url,
      urlImporting,
      urlError,
      urlSuccess,
      importFromUrl,
      importProfile,
      authorizeUrl,
      LINKEDIN_SCOPES,
      formatDate,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <i class="bi bi-linkedin linkedin-icon"></i> Integrazione LinkedIn
        </h1>
        <p class="page-subtitle">Connetti, cerca e importa candidati da LinkedIn</p>
      </div>
    </div>

    <!-- Stato connessione -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div class="kpi-icon" :style="state.settings.linkedin.connected ? 'background: rgba(16,185,129,.12); color:#10b981' : 'background: rgba(148,163,184,.15); color:#94a3b8'">
            <i :class="state.settings.linkedin.connected ? 'bi bi-check-circle-fill' : 'bi bi-link-45deg'"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-semibold fs-5">
              <span v-if="state.settings.linkedin.connected">
                Connesso come {{ state.settings.linkedin.profileName }}
                <span class="badge text-bg-light border ms-1">{{ state.settings.linkedin.mode || 'OAuth' }}</span>
              </span>
              <span v-else>LinkedIn non connesso</span>
            </div>
            <div class="text-secondary small" v-if="state.settings.linkedin.connected">
              Connesso il {{ formatDate(state.settings.linkedin.connectedAt) }} · Auto-sync: {{ state.settings.linkedin.autoSync ? 'attivo' : 'disattivato' }}
            </div>
            <div class="text-secondary small" v-else>
              Effettua il login per importare candidati e pubblicare offerte.
            </div>
          </div>
          <div class="d-flex gap-2">
            <button v-if="!state.settings.linkedin.connected" class="btn btn-linkedin" :disabled="connecting" @click="doConnectDemo">
              <span v-if="connecting"><span class="spinner-border spinner-border-sm me-1"></span>Connessione...</span>
              <span v-else><i class="bi bi-linkedin me-1"></i> Connetti (Demo)</span>
            </button>
            <button v-if="!state.settings.linkedin.connected" class="btn btn-outline-linkedin" @click="doConnectOAuth">
              OAuth reale
            </button>
            <button v-else class="btn btn-outline-danger" @click="disconnect">
              <i class="bi bi-box-arrow-right me-1"></i> Disconnetti
            </button>
          </div>
        </div>
        <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>
      </div>
    </div>

    <!-- Info OAuth -->
    <div class="card mb-3">
      <div class="card-body">
        <details>
          <summary class="fw-semibold" style="cursor:pointer;">Configurazione OAuth reale</summary>
          <div class="mt-3 small">
            <p>
              Per usare l'integrazione reale, registra un'app su
              <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener">LinkedIn Developers</a>,
              imposta come redirect URI <code>{{ redirectUri }}</code>
              e abilita gli scope: <code>{{ LINKEDIN_SCOPES.join(', ') }}</code>.
            </p>
            <p>
              Lo scambio <em>code → access_token</em> deve avvenire server-side
              (richiede il <code>client_secret</code>). Configura un endpoint
              <code>/api/linkedin/token</code> sul tuo backend.
            </p>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label">Client ID LinkedIn</label>
                <input v-model="state.settings.linkedin.clientId" class="form-control form-control-sm" placeholder="es. 86abcd123..." />
              </div>
              <div class="col-md-6 d-flex align-items-end">
                <a :href="authorizeUrl" target="_blank" class="btn btn-sm btn-outline-linkedin w-100">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Apri URL di autorizzazione
                </a>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- Import via URL -->
    <div class="row g-3">
      <div class="col-12 col-xl-5">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-2"><i class="bi bi-cloud-arrow-down me-1"></i> Importa profilo via URL</div>
            <p class="small text-secondary">
              Incolla l'URL pubblico di un profilo LinkedIn per crearne automaticamente una bozza nel tuo ATS.
            </p>
            <div class="input-group mb-2">
              <span class="input-group-text"><i class="bi bi-linkedin linkedin-icon"></i></span>
              <input v-model="url" class="form-control" placeholder="https://www.linkedin.com/in/nome-cognome/" @keyup.enter="importFromUrl" />
            </div>
            <button class="btn btn-linkedin w-100" :disabled="urlImporting" @click="importFromUrl">
              <span v-if="urlImporting"><span class="spinner-border spinner-border-sm me-1"></span> Importazione...</span>
              <span v-else><i class="bi bi-download me-1"></i> Importa</span>
            </button>
            <div v-if="urlError" class="alert alert-danger small mt-2 mb-0 py-2">{{ urlError }}</div>
            <div v-if="urlSuccess" class="alert alert-success small mt-2 mb-0 py-2 d-flex justify-content-between align-items-center">
              <span><i class="bi bi-check-circle me-1"></i> {{ urlSuccess.name }} importato</span>
              <router-link :to="{ name: 'candidate-detail', params: { id: urlSuccess.id } }" class="btn btn-sm btn-outline-success">Apri</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Search profili -->
      <div class="col-12 col-xl-7">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-2"><i class="bi bi-search me-1"></i> Cerca profili</div>
            <p class="small text-secondary">
              Ricerca tra i profili indicizzati (demo). In produzione collegata a People Search API.
            </p>
            <div class="row g-2 mb-2">
              <div class="col-md-5">
                <input v-model="query" class="form-control" placeholder="Es. frontend, vue, kubernetes..." @keyup.enter="doSearch" />
              </div>
              <div class="col-md-3">
                <input v-model="filterLocation" class="form-control" placeholder="Località" />
              </div>
              <div class="col-md-3">
                <input v-model="filterSkill" class="form-control" placeholder="Skill" />
              </div>
              <div class="col-md-1 d-grid">
                <button class="btn btn-primary" :disabled="searching" @click="doSearch">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>

            <div v-if="searching" class="text-center py-3">
              <div class="spinner-border spinner-border-sm"></div>
            </div>
            <div v-else-if="!results.length" class="empty-state py-3">
              <i class="bi bi-search"></i>
              <div class="small">Avvia una ricerca per trovare profili</div>
            </div>
            <div v-else class="d-flex flex-column gap-2">
              <div v-for="p in results" :key="p.linkedinUrl" class="p-2 rounded d-flex align-items-center gap-2" style="border:1px solid var(--bs-border-color)">
                <i class="bi bi-linkedin linkedin-icon fs-5"></i>
                <div class="flex-grow-1">
                  <div class="fw-semibold small">{{ p.name }}</div>
                  <div class="text-secondary" style="font-size:.78rem">{{ p.headline }} · {{ p.location }}</div>
                  <div class="mt-1">
                    <span v-for="s in p.skills.slice(0,4)" :key="s" class="skill-chip">{{ s }}</span>
                  </div>
                </div>
                <a :href="p.linkedinUrl" target="_blank" class="btn btn-sm btn-light border" rel="noopener" title="Apri profilo">
                  <i class="bi bi-box-arrow-up-right"></i>
                </a>
                <button class="btn btn-sm btn-linkedin" @click="importProfile(p)">
                  <i class="bi bi-plus-lg"></i> Importa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
