import { defineComponent, ref } from "vue";
import { state, resetData, exportData, importData } from "../store.js";

export default defineComponent({
  name: "SettingsPage",
  setup() {
    const importText = ref("");
    const exportText = ref("");
    const importError = ref("");
    const importSuccess = ref(false);

    function doExport() {
      exportText.value = exportData();
    }
    function doDownload() {
      const blob = new Blob([exportData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `talentflow-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    function doImport() {
      importError.value = "";
      importSuccess.value = false;
      try {
        importData(importText.value);
        importText.value = "";
        importSuccess.value = true;
      } catch (e) {
        importError.value = e.message;
      }
    }
    function doReset() {
      if (
        confirm(
          "Tutti i dati attuali andranno persi e verranno ripristinati i dati di esempio. Continuare?"
        )
      ) {
        resetData();
      }
    }

    return {
      state,
      importText,
      exportText,
      importError,
      importSuccess,
      doExport,
      doDownload,
      doImport,
      doReset,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Impostazioni</h1>
        <p class="page-subtitle">Configura azienda, utente e dati</p>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-xl-6">
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Azienda</h5>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Nome</label>
                <input v-model="state.settings.company.name" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Sito web</label>
                <input v-model="state.settings.company.website" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Settore</label>
                <input v-model="state.settings.company.industry" class="form-control" />
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Profilo utente</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome</label>
                <input v-model="state.settings.user.name" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="state.settings.user.email" type="email" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Ruolo</label>
                <input v-model="state.settings.user.role" class="form-control" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title"><i class="bi bi-linkedin linkedin-icon"></i> LinkedIn</h5>
            <div class="form-check form-switch mb-2">
              <input
                v-model="state.settings.linkedin.autoSync"
                class="form-check-input"
                type="checkbox"
                id="autoSync"
              />
              <label class="form-check-label" for="autoSync">
                Sincronizzazione automatica candidati
              </label>
            </div>
            <div class="text-secondary small mb-3">
              Se attivo, importa nuovi candidati e aggiorna le offerte pubblicate ogni giorno.
            </div>
            <router-link to="/linkedin" class="btn btn-outline-linkedin">
              Vai all'integrazione LinkedIn <i class="bi bi-arrow-right ms-1"></i>
            </router-link>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Backup & Ripristino</h5>
            <p class="small text-secondary">
              I dati sono salvati nel localStorage del browser. Esporta un backup JSON o importane uno esistente.
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-light border" @click="doExport">
                <i class="bi bi-clipboard me-1"></i> Mostra JSON
              </button>
              <button class="btn btn-primary" @click="doDownload">
                <i class="bi bi-download me-1"></i> Scarica backup
              </button>
              <button class="btn btn-outline-danger ms-auto" @click="doReset">
                <i class="bi bi-arrow-counterclockwise me-1"></i> Reset dati
              </button>
            </div>
            <textarea
              v-if="exportText"
              :value="exportText"
              readonly
              class="form-control mt-3 font-monospace small"
              rows="6"
            ></textarea>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Importa backup</h5>
            <textarea
              v-model="importText"
              class="form-control font-monospace small"
              rows="5"
              placeholder='{"jobs":[],"candidates":[],...}'
            ></textarea>
            <div v-if="importError" class="alert alert-danger small mt-2 mb-0 py-2">{{ importError }}</div>
            <div v-if="importSuccess" class="alert alert-success small mt-2 mb-0 py-2">Backup importato!</div>
            <button class="btn btn-primary mt-2" :disabled="!importText" @click="doImport">
              <i class="bi bi-upload me-1"></i> Importa
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
