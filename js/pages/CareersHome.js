import { defineComponent, computed, ref } from "vue";
import {
  careersJobs,
  careersPageSettings,
  formatDate,
  isCareersPageEnabled,
  state,
} from "../store.js";

export default defineComponent({
  name: "CareersHome",
  setup() {
    const search = ref("");
    const departmentFilter = ref("");
    const workModeFilter = ref("");
    const company = computed(() => state.settings.company || {});
    const careers = computed(() => careersPageSettings());
    const jobs = computed(() => careersJobs());
    const heroStyle = computed(() => {
      if (!company.value.bannerUrl) return null;
      return {
        backgroundImage: `linear-gradient(135deg, rgba(6, 61, 120, 0.88) 0%, rgba(8, 79, 156, 0.78) 48%, rgba(10, 108, 210, 0.72) 100%), url("${company.value.bannerUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    });

    const departments = computed(() => {
      const set = new Set();
      jobs.value.forEach((job) => job.department && set.add(job.department));
      return Array.from(set).sort();
    });

    const filtered = computed(() => {
      const query = search.value.trim().toLowerCase();
      return jobs.value.filter((job) => {
        if (departmentFilter.value && job.department !== departmentFilter.value) {
          return false;
        }
        if (workModeFilter.value && job.workMode !== workModeFilter.value) {
          return false;
        }
        if (!query) return true;
        const haystack = [
          job.title,
          job.location,
          job.department,
          job.employmentType,
          ...(job.skills || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    });

    function formatSalary(job) {
      if (!careers.value.showSalary) return null;
      if (!job.salaryMin && !job.salaryMax) return null;
      const min = job.salaryMin?.toLocaleString("it-IT") || "—";
      const max = job.salaryMax?.toLocaleString("it-IT") || "—";
      return `${min} – ${max} ${job.currency || "EUR"}`;
    }

    return {
      careers,
      company,
      departments,
      filtered,
      formatDate,
      formatSalary,
      heroStyle,
      isCareersPageEnabled,
      search,
      departmentFilter,
      workModeFilter,
    };
  },
  template: `
  <div>
    <section
      class="career-hero"
      :class="{ 'career-hero--branded': company.bannerUrl }"
      :style="heroStyle"
    >
      <div class="career-hero-inner">
        <div class="career-hero-copy">
          <span class="career-eyebrow">{{ company.industry || 'Opportunità di lavoro' }}</span>
          <h1 class="career-hero-title">{{ careers.headline }}</h1>
          <p class="career-hero-text">{{ careers.subheadline }}</p>
          <div class="career-hero-actions">
            <a href="#posizioni-aperte" class="btn btn-light btn-lg">
              Vedi le posizioni aperte
            </a>
          </div>
        </div>
        <div class="career-hero-panel">
          <div class="career-hero-stat">
            <span class="career-hero-stat-value">{{ filtered.length }}</span>
            <span class="career-hero-stat-label">posizioni aperte</span>
          </div>
          <div class="career-hero-stat">
            <span class="career-hero-stat-value">{{ departments.length }}</span>
            <span class="career-hero-stat-label">team attivi</span>
          </div>
          <div class="career-hero-stat">
            <span class="career-hero-stat-value">{{ company.name || 'TalentFlow' }}</span>
            <span class="career-hero-stat-label">azienda</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="!isCareersPageEnabled()" class="career-section">
      <div class="career-empty card">
        <div class="card-body">
          <i class="bi bi-pause-circle"></i>
          <h2 class="h4 mb-2">Pagina carriere non disponibile</h2>
          <p class="mb-0 text-secondary">
            Le candidature online sono temporaneamente sospese. Torna a trovarci presto.
          </p>
        </div>
      </div>
    </section>

    <template v-else>
      <section class="career-section career-culture">
        <div class="row g-4 align-items-start">
          <div class="col-12 col-lg-7">
            <span class="career-eyebrow">Cultura</span>
            <h2 class="career-section-title">{{ careers.cultureTitle }}</h2>
            <p class="career-section-text mb-0">{{ careers.cultureText }}</p>
          </div>
          <div class="col-12 col-lg-5">
            <div class="career-perks card h-100">
              <div class="card-body">
                <div class="fw-semibold mb-3">Cosa offriamo</div>
                <ul class="career-perks-list mb-0">
                  <li v-for="perk in careers.perks" :key="perk">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>{{ perk }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="posizioni-aperte" class="career-section">
        <div class="career-section-header">
          <div>
            <span class="career-eyebrow">Opportunità</span>
            <h2 class="career-section-title mb-1">Posizioni aperte</h2>
            <p class="career-section-text mb-0">
              {{ filtered.length }} posizioni disponibili per candidature online.
            </p>
          </div>
        </div>

        <div class="card career-filters mb-4">
          <div class="card-body">
            <div class="row g-2">
              <div class="col-12 col-lg-5">
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input
                    v-model="search"
                    class="form-control"
                    placeholder="Cerca per ruolo, città o skill..."
                  />
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <select v-model="departmentFilter" class="form-select">
                  <option value="">Tutti i dipartimenti</option>
                  <option v-for="department in departments" :key="department" :value="department">
                    {{ department }}
                  </option>
                </select>
              </div>
              <div class="col-6 col-lg-4">
                <select v-model="workModeFilter" class="form-select">
                  <option value="">Tutte le modalità</option>
                  <option value="In sede">In sede</option>
                  <option value="Ibrido">Ibrido</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!filtered.length" class="career-empty card">
          <div class="card-body">
            <i class="bi bi-briefcase"></i>
            <h3 class="h5 mb-2">Nessuna posizione trovata</h3>
            <p class="mb-0 text-secondary">
              Prova a modificare i filtri oppure torna più tardi per nuove opportunità.
            </p>
          </div>
        </div>

        <div v-else class="row g-3">
          <div v-for="job in filtered" :key="job.id" class="col-12 col-md-6">
            <router-link
              :to="{ name: 'career-job-detail', params: { id: job.id } }"
              class="career-job-card card h-100 text-decoration-none text-reset"
            >
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
                  <span class="career-job-department">{{ job.department || 'Team' }}</span>
                  <span class="career-job-date">Pubblicata {{ formatDate(job.createdAt) }}</span>
                </div>
                <h3 class="career-job-title">{{ job.title }}</h3>
                <div class="career-job-meta">
                  <span><i class="bi bi-geo-alt"></i> {{ job.location || 'Da definire' }}</span>
                  <span><i class="bi bi-laptop"></i> {{ job.workMode }}</span>
                  <span><i class="bi bi-clock"></i> {{ job.employmentType }}</span>
                </div>
                <p class="career-job-summary">{{ job.description }}</p>
                <div class="mb-3">
                  <span
                    v-for="skill in (job.skills || []).slice(0, 4)"
                    :key="skill"
                    class="skill-chip"
                  >
                    {{ skill }}
                  </span>
                </div>
                <div class="mt-auto d-flex justify-content-between align-items-center">
                  <span v-if="formatSalary(job)" class="career-job-salary">
                    <i class="bi bi-cash-coin me-1"></i>{{ formatSalary(job) }}
                  </span>
                  <span v-else class="career-job-salary text-secondary">Retribuzione su richiesta</span>
                  <span class="career-job-cta">
                    Candidati <i class="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </section>
    </template>
  </div>
  `,
});
