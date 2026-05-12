import { defineComponent, computed, ref } from "vue";
import {
  state,
  JOB_STATUSES,
  candidatesByJob,
  careerPageUrl,
  formatDate,
} from "../store.js";

export default defineComponent({
  name: "JobsPage",
  setup() {
    const search = ref("");
    const statusFilter = ref("");
    const departmentFilter = ref("");

    const departments = computed(() => {
      const set = new Set();
      state.jobs.forEach((j) => j.department && set.add(j.department));
      return Array.from(set);
    });

    const filtered = computed(() => {
      const q = search.value.trim().toLowerCase();
      return state.jobs
        .filter((j) => {
          if (statusFilter.value && j.status !== statusFilter.value)
            return false;
          if (
            departmentFilter.value &&
            j.department !== departmentFilter.value
          )
            return false;
          if (q) {
            const hay = [j.title, j.location, j.department, ...(j.skills || [])]
              .join(" ")
              .toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    function statusVariant(id) {
      return JOB_STATUSES.find((s) => s.id === id)?.variant || "secondary";
    }
    function statusLabel(id) {
      return JOB_STATUSES.find((s) => s.id === id)?.label || id;
    }

    return {
      search,
      statusFilter,
      departmentFilter,
      departments,
      filtered,
      JOB_STATUSES,
      candidatesByJob,
      statusVariant,
      statusLabel,
      formatDate,
      careerPageUrl,
      state,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Posizioni aperte</h1>
        <p class="page-subtitle">{{ filtered.length }} posizioni</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <router-link to="/jobs/new" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i> Nuova posizione
        </router-link>
        <a
          :href="careerPageUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-light border"
        >
          <i class="bi bi-window-sidebar me-1"></i> Sito carriere
        </a>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="search" class="form-control" placeholder="Cerca per titolo, skill, città..." />
            </div>
          </div>
          <div class="col-6 col-md-3">
            <select v-model="statusFilter" class="form-select">
              <option value="">Tutti gli stati</option>
              <option v-for="s in JOB_STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
          <div class="col-6 col-md-4">
            <select v-model="departmentFilter" class="form-select">
              <option value="">Tutti i dipartimenti</option>
              <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!filtered.length" class="card">
      <div class="card-body empty-state">
        <i class="bi bi-briefcase"></i>
        <div class="fw-semibold">Nessuna posizione trovata</div>
      </div>
    </div>

    <div v-else class="row g-3">
      <div v-for="j in filtered" :key="j.id" class="col-12 col-md-6 col-xl-4">
        <router-link :to="{ name: 'job-detail', params: { id: j.id } }" class="card h-100 text-decoration-none text-reset">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge" :class="'text-bg-' + statusVariant(j.status)">{{ statusLabel(j.status) }}</span>
              <span v-if="j.linkedinPosted" class="badge text-bg-light border">
                <i class="bi bi-linkedin linkedin-icon"></i> Pubblicata
              </span>
            </div>
            <h5 class="card-title mb-1">{{ j.title }}</h5>
            <div class="text-secondary small mb-2">
              <i class="bi bi-building me-1"></i>{{ j.department || '—' }} ·
              <i class="bi bi-geo-alt"></i> {{ j.location || '—' }} ·
              {{ j.workMode }}
            </div>
            <div class="small mb-2">
              <i class="bi bi-cash-coin me-1"></i>
              <span v-if="j.salaryMin || j.salaryMax">
                {{ j.salaryMin?.toLocaleString('it-IT') || '—' }} – {{ j.salaryMax?.toLocaleString('it-IT') || '—' }} {{ j.currency }}
              </span>
              <span v-else>—</span>
            </div>
            <div class="mb-2">
              <span v-for="s in (j.skills || []).slice(0, 4)" :key="s" class="skill-chip">{{ s }}</span>
            </div>
            <div class="mt-auto d-flex justify-content-between align-items-center small">
              <span class="text-secondary">Creata {{ formatDate(j.createdAt) }}</span>
              <span class="badge text-bg-light border">
                <i class="bi bi-people me-1"></i> {{ candidatesByJob(j.id).length }} candidati
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
  `,
});
