import { defineComponent, ref, computed } from "vue";
import { state, resetData, exportData, importData } from "../store.js";

export default defineComponent({
  name: "SettingsPage",
  setup() {
    const importText = ref("");
    const exportText = ref("");
    const importError = ref("");
    const importSuccess = ref(false);

    const careersPerksText = computed({
      get() {
        return (state.settings.careersPage?.perks || []).join("\n");
      },
      set(value) {
        state.settings.careersPage.perks = (value || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
      },
    });

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
      careersPerksText,
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

        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Sito carriere</h5>
            <p class="small text-secondary">
              Configura la pagina pubblica dove i candidati consultano le posizioni aperte e inviano candidature.
            </p>
            <div class="form-check form-switch mb-3">
              <input
                v-model="state.settings.careersPage.enabled"
                class="form-check-input"
                type="checkbox"
                id="careersEnabled"
              />
              <label class="form-check-label" for="careersEnabled">
                Pagina carriere attiva
              </label>
            </div>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Titolo hero</label>
                <input v-model="state.settings.careersPage.headline" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Sottotitolo</label>
                <textarea
                  v-model="state.settings.careersPage.subheadline"
                  rows="3"
                  class="form-control"
                ></textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Titolo cultura</label>
                <input v-model="state.settings.careersPage.cultureTitle" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Testo cultura</label>
                <textarea
                  v-model="state.settings.careersPage.cultureText"
                  rows="4"
                  class="form-control"
                ></textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Benefit in evidenza (uno per riga)</label>
                <textarea
                  v-model="careersPerksText"
                  rows="4"
                  class="form-control"
                ></textarea>
              </div>
              <div class="col-12">
                <div class="form-check form-switch">
                  <input
                    v-model="state.settings.careersPage.showSalary"
                    class="form-check-input"
                    type="checkbox"
                    id="careersShowSalary"
                  />
                  <label class="form-check-label" for="careersShowSalary">
                    Mostra range salariale sul sito carriere
                  </label>
                </div>
              </div>
            </div>
            <router-link to="/carriere" class="btn btn-outline-primary mt-3">
              <i class="bi bi-box-arrow-up-right me-1"></i> Anteprima sito carriere
            </router-link>
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
