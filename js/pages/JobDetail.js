import { defineComponent, computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  state,
  jobById,
  updateJob,
  deleteJob,
  candidatesByJob,
  JOB_STATUSES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  STAGES,
  formatDate,
} from "../store.js";
import { postJobToLinkedIn, buildShareUrl } from "../linkedin.js";
import { Avatar } from "../components/Avatar.js";

export default defineComponent({
  name: "JobDetail",
  components: { Avatar },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const job = computed(() => jobById(route.params.id));
    const editing = ref(false);
    const editModel = ref(null);
    const posting = ref(false);
    const postingError = ref("");
    const postedUrl = ref("");

    function startEdit() {
      editModel.value = JSON.parse(JSON.stringify(job.value));
      editModel.value._reqText = (job.value.requirements || []).join("\n");
      editModel.value._benText = (job.value.benefits || []).join("\n");
      editModel.value._skillsText = (job.value.skills || []).join(", ");
      editing.value = true;
    }
    function saveEdit() {
      const m = editModel.value;
      m.requirements = (m._reqText || "").split("\n").map((s) => s.trim()).filter(Boolean);
      m.benefits = (m._benText || "").split("\n").map((s) => s.trim()).filter(Boolean);
      m.skills = (m._skillsText || "").split(",").map((s) => s.trim()).filter(Boolean);
      delete m._reqText; delete m._benText; delete m._skillsText;
      updateJob(job.value.id, m);
      editing.value = false;
    }
    function cancelEdit() {
      editing.value = false;
    }

    function onDelete() {
      if (confirm(`Eliminare la posizione "${job.value.title}"?`)) {
        deleteJob(job.value.id);
        router.replace("/jobs");
      }
    }

    async function postToLinkedIn() {
      postingError.value = "";
      postedUrl.value = "";
      try {
        posting.value = true;
        const res = await postJobToLinkedIn(job.value);
        postedUrl.value = res.url;
      } catch (e) {
        postingError.value = e.message;
      } finally {
        posting.value = false;
      }
    }

    const shareUrl = computed(() =>
      job.value ? buildShareUrl(job.value) : ""
    );

    const candidates = computed(() =>
      candidatesByJob(route.params.id).sort(
        (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
      )
    );

    const stageBreakdown = computed(() =>
      STAGES.map((s) => ({
        ...s,
        count: candidates.value.filter((c) => c.stage === s.id).length,
      }))
    );

    function statusLabel(id) {
      return JOB_STATUSES.find((s) => s.id === id)?.label || id;
    }
    function statusVariant(id) {
      return JOB_STATUSES.find((s) => s.id === id)?.variant || "secondary";
    }

    function setStatus(s) {
      updateJob(job.value.id, { status: s });
    }

    return {
      job,
      editing,
      editModel,
      startEdit,
      saveEdit,
      cancelEdit,
      onDelete,
      postToLinkedIn,
      posting,
      postingError,
      postedUrl,
      shareUrl,
      candidates,
      stageBreakdown,
      JOB_STATUSES,
      EMPLOYMENT_TYPES,
      WORK_MODES,
      STAGES,
      formatDate,
      statusLabel,
      statusVariant,
      setStatus,
      state,
    };
  },
  template: `
  <div v-if="!job" class="empty-state">
    <i class="bi bi-briefcase"></i>
    <div>Posizione non trovata</div>
  </div>
  <div v-else>
    <div class="page-header">
      <div class="d-flex align-items-center gap-3">
        <router-link to="/jobs" class="btn btn-light border">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <div>
          <h1 class="page-title mb-1">{{ job.title }}</h1>
          <div class="text-secondary">
            <i class="bi bi-building"></i> {{ job.department || '—' }} ·
            <i class="bi bi-geo-alt"></i> {{ job.location || '—' }} ·
            {{ job.workMode }} · {{ job.employmentType }}
          </div>
        </div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <div class="dropdown">
          <button class="btn btn-light border dropdown-toggle" data-bs-toggle="dropdown">
            <span class="badge me-1" :class="'text-bg-' + statusVariant(job.status)">{{ statusLabel(job.status) }}</span>
          </button>
          <ul class="dropdown-menu">
            <li v-for="s in JOB_STATUSES" :key="s.id">
              <a class="dropdown-item" href="#" @click.prevent="setStatus(s.id)">{{ s.label }}</a>
            </li>
          </ul>
        </div>
        <button v-if="!job.linkedinPosted" class="btn btn-linkedin" :disabled="posting" @click="postToLinkedIn">
          <span v-if="posting"><span class="spinner-border spinner-border-sm me-1"></span> Pubblicazione...</span>
          <span v-else><i class="bi bi-linkedin me-1"></i> Pubblica su LinkedIn</span>
        </button>
        <a v-else :href="shareUrl" target="_blank" rel="noopener" class="btn btn-outline-linkedin">
          <i class="bi bi-share me-1"></i> Condividi
        </a>
        <button v-if="!editing" class="btn btn-primary" @click="startEdit">
          <i class="bi bi-pencil me-1"></i> Modifica
        </button>
        <button class="btn btn-outline-danger" @click="onDelete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>

    <div v-if="postingError" class="alert alert-danger">{{ postingError }}</div>
    <div v-if="postedUrl" class="alert alert-success d-flex justify-content-between align-items-center">
      <span><i class="bi bi-check-circle me-1"></i> Job pubblicata su LinkedIn (mock)</span>
      <a :href="postedUrl" target="_blank" rel="noopener" class="btn btn-sm btn-outline-success">Apri post</a>
    </div>

    <div class="row g-3">
      <div class="col-12 col-xl-8">
        <!-- View mode -->
        <div v-if="!editing" class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Descrizione</h5>
            <p style="white-space: pre-wrap">{{ job.description || '—' }}</p>

            <hr />
            <div class="row g-3">
              <div class="col-md-4">
                <div class="text-secondary small">Range salariale</div>
                <div>
                  <span v-if="job.salaryMin || job.salaryMax">
                    {{ job.salaryMin?.toLocaleString('it-IT') || '—' }} – {{ job.salaryMax?.toLocaleString('it-IT') || '—' }} {{ job.currency }}
                  </span>
                  <span v-else>—</span>
                </div>
              </div>
              <div class="col-md-4">
                <div class="text-secondary small">Hiring manager</div>
                <div>{{ job.hiringManager || '—' }}</div>
              </div>
              <div class="col-md-4">
                <div class="text-secondary small">Creata il</div>
                <div>{{ formatDate(job.createdAt) }}</div>
              </div>
            </div>

            <hr />
            <div class="row g-3">
              <div class="col-md-6" v-if="job.requirements?.length">
                <div class="fw-semibold mb-2">Requisiti</div>
                <ul class="ps-3 mb-0">
                  <li v-for="r in job.requirements" :key="r">{{ r }}</li>
                </ul>
              </div>
              <div class="col-md-6" v-if="job.benefits?.length">
                <div class="fw-semibold mb-2">Benefit</div>
                <ul class="ps-3 mb-0">
                  <li v-for="b in job.benefits" :key="b">{{ b }}</li>
                </ul>
              </div>
            </div>

            <hr v-if="job.skills?.length" />
            <div v-if="job.skills?.length">
              <div class="text-secondary small mb-2">Skill richieste</div>
              <span v-for="s in job.skills" :key="s" class="skill-chip">{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- Edit -->
        <div v-if="editing" class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Modifica posizione</h5>
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Titolo</label>
                <input v-model="editModel.title" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Stato</label>
                <select v-model="editModel.status" class="form-select">
                  <option v-for="s in JOB_STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Dipartimento</label>
                <input v-model="editModel.department" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Hiring manager</label>
                <input v-model="editModel.hiringManager" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Località</label>
                <input v-model="editModel.location" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Modalità lavoro</label>
                <select v-model="editModel.workMode" class="form-select">
                  <option v-for="w in WORK_MODES" :key="w" :value="w">{{ w }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Tipo contratto</label>
                <select v-model="editModel.employmentType" class="form-select">
                  <option v-for="t in EMPLOYMENT_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">RAL min</label>
                <input v-model.number="editModel.salaryMin" type="number" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">RAL max</label>
                <input v-model.number="editModel.salaryMax" type="number" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Valuta</label>
                <input v-model="editModel.currency" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Descrizione</label>
                <textarea v-model="editModel.description" rows="4" class="form-control"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label">Requisiti (uno per riga)</label>
                <textarea v-model="editModel._reqText" rows="5" class="form-control"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label">Benefit (uno per riga)</label>
                <textarea v-model="editModel._benText" rows="5" class="form-control"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Skill (separate da virgola)</label>
                <input v-model="editModel._skillsText" class="form-control" />
              </div>
            </div>
            <div class="mt-3 d-flex justify-content-end gap-2">
              <button class="btn btn-light border" @click="cancelEdit">Annulla</button>
              <button class="btn btn-primary" @click="saveEdit">Salva</button>
            </div>
          </div>
        </div>

        <!-- Candidati -->
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="card-title mb-0">Candidati ({{ candidates.length }})</h5>
              <router-link to="/candidates/new" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-plus-lg me-1"></i> Aggiungi
              </router-link>
            </div>
            <div v-if="!candidates.length" class="empty-state">
              <i class="bi bi-people"></i>
              <div class="small">Nessun candidato per questa posizione</div>
            </div>
            <table v-else class="table table-clean align-middle mb-0">
              <thead><tr><th>Nome</th><th>Fase</th><th>Rating</th><th class="text-end">Applicato</th></tr></thead>
              <tbody>
                <tr
                  v-for="c in candidates"
                  :key="c.id"
                  @click="$router.push({ name: 'candidate-detail', params: { id: c.id } })"
                >
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <Avatar :name="c.name" size="sm" />
                      <div>
                        <div class="fw-semibold small">{{ c.name }}</div>
                        <div class="text-secondary" style="font-size:.72rem">{{ c.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge stage-badge" :class="'bg-stage-' + c.stage">
                      {{ STAGES.find(s => s.id === c.stage)?.label }}
                    </span>
                  </td>
                  <td>
                    <span v-if="c.rating">
                      <i v-for="n in 5" :key="n" :class="['bi', n <= c.rating ? 'bi-star-fill text-warning' : 'bi-star text-secondary']"></i>
                    </span>
                    <span v-else class="text-secondary small">—</span>
                  </td>
                  <td class="text-end small text-secondary">{{ formatDate(c.appliedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <div class="card mb-3">
          <div class="card-body">
            <div class="fw-semibold mb-3">Pipeline di questa posizione</div>
            <div class="d-flex flex-column gap-2">
              <div v-for="s in stageBreakdown" :key="s.id" class="d-flex align-items-center gap-2">
                <span class="kanban-column-dot" :style="{ background: s.color }"></span>
                <div class="flex-grow-1 small">{{ s.label }}</div>
                <span class="badge text-bg-light border">{{ s.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-linkedin linkedin-icon fs-5"></i>
              <span class="fw-semibold">LinkedIn</span>
            </div>
            <div v-if="job.linkedinPosted" class="small">
              <i class="bi bi-check-circle-fill text-success me-1"></i>
              Pubblicata su LinkedIn
              <div class="text-secondary mt-1">{{ formatDate(job.linkedinPostedAt || job.createdAt) }}</div>
              <a :href="shareUrl" target="_blank" class="btn btn-sm btn-outline-linkedin mt-2 w-100">
                <i class="bi bi-share me-1"></i> Condividi sul feed
              </a>
            </div>
            <div v-else>
              <p class="small text-secondary">Pubblica direttamente su LinkedIn per raggiungere più candidati.</p>
              <button class="btn btn-linkedin w-100" :disabled="posting" @click="postToLinkedIn">
                <i class="bi bi-linkedin me-1"></i> Pubblica
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
