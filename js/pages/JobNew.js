import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import {
  addJob,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  JOB_STATUSES,
} from "../store.js";

export default defineComponent({
  name: "JobNew",
  setup() {
    const router = useRouter();
    const model = ref({
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
      hiringManager: "",
      _reqText: "",
      _benText: "",
      _skillsText: "",
    });

    function save() {
      if (!model.value.title) {
        alert("Il titolo è obbligatorio");
        return;
      }
      const m = model.value;
      const job = addJob({
        title: m.title,
        department: m.department,
        location: m.location,
        workMode: m.workMode,
        employmentType: m.employmentType,
        salaryMin: m.salaryMin || null,
        salaryMax: m.salaryMax || null,
        currency: m.currency,
        status: m.status,
        description: m.description,
        hiringManager: m.hiringManager,
        requirements: m._reqText.split("\n").map((s) => s.trim()).filter(Boolean),
        benefits: m._benText.split("\n").map((s) => s.trim()).filter(Boolean),
        skills: m._skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      });
      router.replace({ name: "job-detail", params: { id: job.id } });
    }

    return { model, EMPLOYMENT_TYPES, WORK_MODES, JOB_STATUSES, save };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Nuova posizione</h1>
        <p class="page-subtitle">Crea una nuova job opening</p>
      </div>
      <router-link to="/jobs" class="btn btn-light border">
        <i class="bi bi-x-lg"></i> Annulla
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-8">
            <label class="form-label">Titolo *</label>
            <input v-model="model.title" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Stato</label>
            <select v-model="model.status" class="form-select">
              <option v-for="s in JOB_STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Dipartimento</label>
            <input v-model="model.department" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Hiring manager</label>
            <input v-model="model.hiringManager" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Località</label>
            <input v-model="model.location" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Modalità lavoro</label>
            <select v-model="model.workMode" class="form-select">
              <option v-for="w in WORK_MODES" :key="w" :value="w">{{ w }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Tipo contratto</label>
            <select v-model="model.employmentType" class="form-select">
              <option v-for="t in EMPLOYMENT_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">RAL min</label>
            <input v-model.number="model.salaryMin" type="number" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">RAL max</label>
            <input v-model.number="model.salaryMax" type="number" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Valuta</label>
            <input v-model="model.currency" class="form-control" />
          </div>
          <div class="col-12">
            <label class="form-label">Descrizione</label>
            <textarea v-model="model.description" rows="4" class="form-control"></textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Requisiti (uno per riga)</label>
            <textarea v-model="model._reqText" rows="5" class="form-control"></textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Benefit (uno per riga)</label>
            <textarea v-model="model._benText" rows="5" class="form-control"></textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Skill (separate da virgola)</label>
            <input v-model="model._skillsText" class="form-control" placeholder="Vue.js, TypeScript, ..." />
          </div>
        </div>
        <div class="mt-3 d-flex justify-content-end gap-2">
          <router-link to="/jobs" class="btn btn-light border">Annulla</router-link>
          <button class="btn btn-primary" @click="save">
            <i class="bi bi-check2 me-1"></i> Crea posizione
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
});
