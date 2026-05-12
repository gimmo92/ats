import { defineComponent, computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  applyFromCareersPage,
  careerJobById,
  careersPageSettings,
  formatDate,
  isCareersPageEnabled,
} from "../store.js";

export default defineComponent({
  name: "CareerJobDetail",
  setup() {
    const route = useRoute();
    const careers = computed(() => careersPageSettings());
    const job = computed(() => careerJobById(route.params.id));
    const submitted = ref(false);
    const submitError = ref("");
    const submitting = ref(false);

    const model = ref({
      name: "",
      email: "",
      phone: "",
      location: "",
      headline: "",
      linkedinUrl: "",
      coverLetter: "",
      _skillsText: "",
    });

    function formatSalary(currentJob) {
      if (!careers.value.showSalary) return null;
      if (!currentJob?.salaryMin && !currentJob?.salaryMax) return null;
      const min = currentJob.salaryMin?.toLocaleString("it-IT") || "—";
      const max = currentJob.salaryMax?.toLocaleString("it-IT") || "—";
      return `${min} – ${max} ${currentJob.currency || "EUR"}`;
    }

    async function submitApplication() {
      submitError.value = "";
      if (!model.value.name.trim()) {
        submitError.value = "Inserisci il tuo nome completo.";
        return;
      }
      if (!model.value.email.trim()) {
        submitError.value = "Inserisci un indirizzo email valido.";
        return;
      }

      try {
        submitting.value = true;
        applyFromCareersPage({
          jobId: job.value.id,
          name: model.value.name.trim(),
          email: model.value.email.trim(),
          phone: model.value.phone.trim(),
          location: model.value.location.trim(),
          headline: model.value.headline.trim(),
          linkedinUrl: model.value.linkedinUrl.trim(),
          coverLetter: model.value.coverLetter.trim(),
          skills: (model.value._skillsText || "")
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        });
        submitted.value = true;
      } catch (error) {
        submitError.value = error.message || "Impossibile inviare la candidatura.";
      } finally {
        submitting.value = false;
      }
    }

    return {
      careers,
      formatDate,
      formatSalary,
      isCareersPageEnabled,
      job,
      model,
      submitApplication,
      submitted,
      submitError,
      submitting,
    };
  },
  template: `
  <div>
    <div v-if="!isCareersPageEnabled()" class="career-empty card">
      <div class="card-body">
        <i class="bi bi-pause-circle"></i>
        <h1 class="h4 mb-2">Pagina carriere non disponibile</h1>
        <p class="mb-3 text-secondary">
          Le candidature online sono temporaneamente sospese.
        </p>
        <router-link to="/carriere" class="btn btn-primary">Torna alle carriere</router-link>
      </div>
    </div>

    <div v-else-if="!job" class="career-empty card">
      <div class="card-body">
        <i class="bi bi-briefcase"></i>
        <h1 class="h4 mb-2">Posizione non trovata</h1>
        <p class="mb-3 text-secondary">
          L'offerta non è più disponibile o non è pubblicata sul sito carriere.
        </p>
        <router-link to="/carriere" class="btn btn-primary">Vedi tutte le posizioni</router-link>
      </div>
    </div>

    <div v-else>
      <section class="career-detail-hero">
        <div class="career-detail-hero-inner">
          <router-link to="/carriere" class="career-back-link">
            <i class="bi bi-arrow-left"></i> Tutte le posizioni
          </router-link>
          <span class="career-eyebrow">{{ job.department || 'Team' }}</span>
          <h1 class="career-detail-title">{{ job.title }}</h1>
          <div class="career-job-meta career-detail-meta">
            <span><i class="bi bi-geo-alt"></i> {{ job.location || 'Da definire' }}</span>
            <span><i class="bi bi-laptop"></i> {{ job.workMode }}</span>
            <span><i class="bi bi-clock"></i> {{ job.employmentType }}</span>
            <span><i class="bi bi-calendar3"></i> Pubblicata {{ formatDate(job.createdAt) }}</span>
          </div>
          <p v-if="formatSalary(job)" class="career-detail-salary mb-0">
            <i class="bi bi-cash-coin me-1"></i>{{ formatSalary(job) }}
          </p>
        </div>
      </section>

      <section class="career-section">
        <div class="row g-4">
          <div class="col-12 col-xl-7">
            <div class="card mb-4">
              <div class="card-body">
                <h2 class="h5 mb-3">Descrizione del ruolo</h2>
                <p class="career-section-text mb-0" style="white-space: pre-wrap">{{ job.description }}</p>
              </div>
            </div>

            <div v-if="job.requirements?.length" class="card mb-4">
              <div class="card-body">
                <h2 class="h5 mb-3">Requisiti</h2>
                <ul class="career-list mb-0">
                  <li v-for="requirement in job.requirements" :key="requirement">{{ requirement }}</li>
                </ul>
              </div>
            </div>

            <div v-if="job.benefits?.length" class="card mb-4">
              <div class="card-body">
                <h2 class="h5 mb-3">Benefit</h2>
                <ul class="career-list mb-0">
                  <li v-for="benefit in job.benefits" :key="benefit">{{ benefit }}</li>
                </ul>
              </div>
            </div>

            <div v-if="job.skills?.length" class="card">
              <div class="card-body">
                <h2 class="h5 mb-3">Skill richieste</h2>
                <span v-for="skill in job.skills" :key="skill" class="skill-chip">{{ skill }}</span>
              </div>
            </div>
          </div>

          <div class="col-12 col-xl-5">
            <div class="career-apply-card card">
              <div class="card-body">
                <div v-if="submitted" class="career-apply-success">
                  <i class="bi bi-check-circle-fill"></i>
                  <h2 class="h5 mb-2">Candidatura inviata</h2>
                  <p class="mb-3 text-secondary">
                    Grazie per aver inviato la candidatura per {{ job.title }}.
                    Il team HR la esaminerà e ti ricontatterà se il profilo è in linea con la posizione.
                  </p>
                  <router-link to="/carriere" class="btn btn-primary w-100">
                    Torna alle posizioni aperte
                  </router-link>
                </div>

                <form v-else @submit.prevent="submitApplication">
                  <h2 class="h5 mb-1">Candidati ora</h2>
                  <p class="text-secondary small mb-4">
                    Compila il modulo: la candidatura arriverà direttamente nel tuo ATS.
                  </p>

                  <div v-if="submitError" class="alert alert-danger py-2 small">{{ submitError }}</div>

                  <div class="mb-3">
                    <label class="form-label">Nome e cognome *</label>
                    <input v-model="model.name" class="form-control" required />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email *</label>
                    <input v-model="model.email" type="email" class="form-control" required />
                  </div>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Telefono</label>
                      <input v-model="model.phone" class="form-control" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Città</label>
                      <input v-model="model.location" class="form-control" />
                    </div>
                  </div>
                  <div class="mb-3 mt-3">
                    <label class="form-label">Titolo professionale</label>
                    <input v-model="model.headline" class="form-control" />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Profilo LinkedIn</label>
                    <input v-model="model.linkedinUrl" class="form-control" placeholder="https://www.linkedin.com/in/..." />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Skill principali</label>
                    <input
                      v-model="model._skillsText"
                      class="form-control"
                      placeholder="Vue.js, TypeScript, Design Systems"
                    />
                  </div>
                  <div class="mb-4">
                    <label class="form-label">Lettera di presentazione</label>
                    <textarea
                      v-model="model.coverLetter"
                      rows="5"
                      class="form-control"
                      placeholder="Raccontaci perché vuoi unirti al team e cosa ti motiva per questo ruolo."
                    ></textarea>
                  </div>

                  <button class="btn btn-primary w-100" :disabled="submitting">
                    <span v-if="submitting">
                      <span class="spinner-border spinner-border-sm me-1"></span>
                      Invio in corso...
                    </span>
                    <span v-else>
                      Invia candidatura
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
  `,
});
