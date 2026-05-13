import { defineComponent, computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  state,
  candidateById,
  jobById,
  updateCandidate,
  deleteCandidate,
  moveCandidateStage,
  addInterview,
  formatDate,
  formatDateTime,
} from "../store.js";
import { Avatar } from "../components/Avatar.js";

export default defineComponent({
  name: "CandidateDetail",
  components: { Avatar },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const editing = ref(false);

    const candidate = computed(() => candidateById(route.params.id));

    const editModel = ref(null);
    function startEdit() {
      if (!candidate.value) return;
      editModel.value = JSON.parse(JSON.stringify(candidate.value));
      if (typeof editModel.value.skills === "object")
        editModel.value._skillsText = (editModel.value.skills || []).join(", ");
      editing.value = true;
    }
    function saveEdit() {
      const m = editModel.value;
      m.skills = (m._skillsText || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      delete m._skillsText;
      updateCandidate(candidate.value.id, m);
      editing.value = false;
    }
    function cancelEdit() {
      editing.value = false;
    }

    const newInterview = ref({
      title: "",
      date: "",
      durationMin: 60,
      type: "Tecnica",
      mode: "Video",
      location: "",
      interviewers: "",
      notes: "",
    });
    const showScheduleModal = ref(false);

    function openSchedule() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      newInterview.value = {
        title: `Colloquio - ${candidate.value?.name || ""}`,
        date: toLocalDateTimeInput(d),
        durationMin: 60,
        type: "Tecnica",
        mode: "Video",
        location: "Google Meet",
        interviewers: state.settings.user.name,
        notes: "",
      };
      showScheduleModal.value = true;
    }
    function saveSchedule() {
      const i = newInterview.value;
      addInterview({
        candidateId: candidate.value.id,
        jobId: candidate.value.jobId,
        title: i.title,
        date: new Date(i.date).toISOString(),
        durationMin: Number(i.durationMin) || 60,
        type: i.type,
        mode: i.mode,
        location: i.location,
        interviewers: (i.interviewers || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: i.notes,
        status: "scheduled",
      });
      const interviewStage = state.settings.pipelineStages.find(
        (s) => s.id === "interview"
      );
      if (
        interviewStage &&
        (candidate.value.stage === "applied" ||
          candidate.value.stage === "screening")
      ) {
        moveCandidateStage(candidate.value.id, "interview");
      }
      showScheduleModal.value = false;
    }

    const candidateInterviews = computed(() =>
      state.interviews
        .filter((i) => i.candidateId === route.params.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    );

    const candidateActivity = computed(() =>
      state.activity.filter((a) => a.candidateId === route.params.id)
    );

    function changeStage(stage) {
      moveCandidateStage(candidate.value.id, stage);
    }

    function onDelete() {
      if (
        confirm(
          `Eliminare il candidato ${candidate.value.name}? L'azione non è reversibile.`
        )
      ) {
        deleteCandidate(candidate.value.id);
        router.replace("/candidates");
      }
    }

    function setRating(n) {
      updateCandidate(candidate.value.id, { rating: n });
    }

    function toLocalDateTimeInput(d) {
      const pad = (n) => String(n).padStart(2, "0");
      return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    }

    return {
      candidate,
      jobById,
      editing,
      editModel,
      startEdit,
      saveEdit,
      cancelEdit,
      newInterview,
      showScheduleModal,
      openSchedule,
      saveSchedule,
      candidateInterviews,
      candidateActivity,
      changeStage,
      onDelete,
      setRating,
      formatDate,
      formatDateTime,
      state,
    };
  },
  template: `
  <div v-if="!candidate" class="empty-state">
    <i class="bi bi-person-x"></i>
    <div>Candidato non trovato</div>
    <router-link to="/candidates" class="btn btn-link">Torna alla lista</router-link>
  </div>
  <div v-else>
    <!-- Header -->
    <div class="page-header">
      <div class="d-flex align-items-center gap-3">
        <router-link to="/candidates" class="btn btn-light border">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <Avatar :name="candidate.name" :src="candidate.avatarUrl" size="lg" />
        <div>
          <h1 class="page-title mb-1">{{ candidate.name }}</h1>
          <div class="text-secondary">
            {{ candidate.headline || candidate.role || '—' }}
            <span v-if="candidate.location"> · <i class="bi bi-geo-alt"></i> {{ candidate.location }}</span>
          </div>
        </div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <a v-if="candidate.linkedinUrl" :href="candidate.linkedinUrl" target="_blank" rel="noopener" class="btn btn-outline-linkedin">
          <i class="bi bi-linkedin me-1"></i> Profilo LinkedIn
        </a>
        <button class="btn btn-outline-primary" @click="openSchedule">
          <i class="bi bi-calendar-plus me-1"></i> Programma colloquio
        </button>
        <button v-if="!editing" class="btn btn-primary" @click="startEdit">
          <i class="bi bi-pencil me-1"></i> Modifica
        </button>
        <button class="btn btn-outline-danger" @click="onDelete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>

    <!-- Edit form / view -->
    <div class="row g-3">
      <div class="col-12 col-xl-8">
        <!-- Stage selector -->
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-semibold me-2">Fase pipeline:</span>
              <button
                v-for="s in state.settings.pipelineStages"
                :key="s.id"
                class="btn btn-sm"
                :class="candidate.stage === s.id ? 'text-white border-0' : 'btn-light border'"
                :style="candidate.stage === s.id ? { backgroundColor: s.color, borderColor: s.color } : {}"
                @click="changeStage(s.id)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- View mode -->
        <div v-if="!editing" class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Informazioni</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <div class="text-secondary small">Email</div>
                <div><a v-if="candidate.email" :href="'mailto:' + candidate.email">{{ candidate.email }}</a><span v-else>—</span></div>
              </div>
              <div class="col-md-6">
                <div class="text-secondary small">Telefono</div>
                <div>{{ candidate.phone || '—' }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-secondary small">Ruolo</div>
                <div>{{ candidate.role || '—' }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-secondary small">Posizione</div>
                <div>
                  <router-link v-if="candidate.jobId" :to="{ name: 'job-detail', params: { id: candidate.jobId } }">
                    {{ jobById(candidate.jobId)?.title }}
                  </router-link>
                  <span v-else>—</span>
                </div>
              </div>
              <div class="col-md-6">
                <div class="text-secondary small">Sorgente</div>
                <div>{{ candidate.source || '—' }}</div>
              </div>
              <div class="col-md-6">
                <div class="text-secondary small">Applicazione</div>
                <div>{{ formatDate(candidate.appliedAt) }}</div>
              </div>
              <template v-if="candidate.educationLevel || candidate.university || candidate.faculty">
                <div class="col-md-4">
                  <div class="text-secondary small">Livello di istruzione</div>
                  <div>{{ candidate.educationLevel || '—' }}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-secondary small">Università</div>
                  <div>{{ candidate.university || '—' }}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-secondary small">Facoltà / Corso di studi</div>
                  <div>{{ candidate.faculty || '—' }}</div>
                </div>
              </template>
            </div>

            <hr />
            <div class="text-secondary small mb-2">Skill</div>
            <div v-if="candidate.skills?.length">
              <span v-for="s in candidate.skills" :key="s" class="skill-chip">{{ s }}</span>
            </div>
            <div v-else class="text-secondary small">Nessuna skill registrata</div>

            <hr v-if="candidate.notes" />
            <div v-if="candidate.notes">
              <div class="text-secondary small mb-1">Note</div>
              <div style="white-space: pre-wrap">{{ candidate.notes }}</div>
            </div>
          </div>
        </div>

        <!-- Esperienze -->
        <div v-if="!editing && candidate.experience?.length" class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Esperienza</h5>
            <div v-for="(e,idx) in candidate.experience" :key="idx" class="mb-3 pb-3" :class="{ 'border-bottom': idx < candidate.experience.length - 1 }">
              <div class="fw-semibold">{{ e.title }} <span class="text-secondary fw-normal">· {{ e.company }}</span></div>
              <div class="text-secondary small">{{ e.from }} — {{ e.to || 'oggi' }}</div>
              <div class="mt-1 small">{{ e.description }}</div>
            </div>
          </div>
        </div>

        <!-- Education -->
        <div v-if="!editing && candidate.education?.length" class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Formazione</h5>
            <div v-for="(e,idx) in candidate.education" :key="idx" class="mb-2">
              <div class="fw-semibold">{{ e.degree }}</div>
              <div class="text-secondary small">{{ e.school }} · {{ e.year }}</div>
            </div>
          </div>
        </div>

        <!-- Edit form -->
        <div v-if="editing" class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Modifica candidato</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Nome</label>
                <input v-model="editModel.name" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="editModel.email" class="form-control" type="email" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Telefono</label>
                <input v-model="editModel.phone" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">URL LinkedIn</label>
                <input v-model="editModel.linkedinUrl" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Ruolo</label>
                <input v-model="editModel.role" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Headline</label>
                <input v-model="editModel.headline" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Località</label>
                <input v-model="editModel.location" class="form-control" />
              </div>
              <div class="col-12">
                <hr class="my-1" />
                <div class="text-secondary small mb-2">Istruzione</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Livello di istruzione</label>
                <select v-model="editModel.educationLevel" class="form-select">
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
                <label class="form-label">Università</label>
                <input v-model="editModel.university" class="form-control" placeholder="es. Politecnico di Milano" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Facoltà / Corso di studi</label>
                <input v-model="editModel.faculty" class="form-control" placeholder="es. Ingegneria informatica" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Posizione</label>
                <select v-model="editModel.jobId" class="form-select">
                  <option :value="null">—</option>
                  <option v-for="j in state.jobs" :key="j.id" :value="j.id">{{ j.title }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Sorgente</label>
                <input v-model="editModel.source" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Skill (separate da virgola)</label>
                <input v-model="editModel._skillsText" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Note</label>
                <textarea v-model="editModel.notes" class="form-control" rows="3"></textarea>
              </div>
            </div>
            <div class="mt-3 d-flex justify-content-end gap-2">
              <button class="btn btn-light border" @click="cancelEdit">Annulla</button>
              <button class="btn btn-primary" @click="saveEdit">Salva</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar dx -->
      <div class="col-12 col-xl-4">
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-semibold">Valutazione</span>
            </div>
            <div>
              <i
                v-for="n in 5"
                :key="n"
                :class="['bi', 'fs-4', 'cursor-pointer', n <= (candidate.rating||0) ? 'bi-star-fill text-warning' : 'bi-star text-secondary']"
                style="cursor:pointer"
                @click="setRating(n)"
              ></i>
              <button v-if="candidate.rating" class="btn btn-sm btn-link" @click="setRating(0)">azzera</button>
            </div>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-semibold">Colloqui</span>
              <button class="btn btn-sm btn-outline-primary" @click="openSchedule">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div v-if="!candidateInterviews.length" class="empty-state py-2">
              <i class="bi bi-calendar"></i>
              <div class="small">Nessun colloquio</div>
            </div>
            <div v-else class="d-flex flex-column gap-2">
              <div v-for="i in candidateInterviews" :key="i.id" class="p-2 rounded" style="border:1px solid var(--bs-border-color)">
                <div class="fw-semibold small">{{ i.title }}</div>
                <div class="text-secondary" style="font-size:.78rem">
                  <i class="bi bi-calendar"></i> {{ formatDateTime(i.date) }} · {{ i.durationMin }} min
                </div>
                <div class="text-secondary" style="font-size:.78rem">
                  <i class="bi bi-tag"></i> {{ i.type }} · {{ i.mode }}
                </div>
                <div v-if="i.interviewers?.length" class="text-secondary" style="font-size:.78rem">
                  <i class="bi bi-people"></i> {{ i.interviewers.join(', ') }}
                </div>
                <span class="badge mt-1" :class="i.status === 'completed' ? 'text-bg-success' : 'text-bg-info'">
                  {{ i.status === 'completed' ? 'Completato' : 'Programmato' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="fw-semibold mb-3">Storico</div>
            <div v-if="!candidateActivity.length" class="text-secondary small">Nessuna attività</div>
            <div v-else class="timeline">
              <div v-for="a in candidateActivity" :key="a.id" class="timeline-item">
                <div class="small">{{ a.message }}</div>
                <div class="text-secondary" style="font-size:.72rem">{{ formatDateTime(a.at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal schedule -->
    <div v-if="showScheduleModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,.5)" @click.self="showScheduleModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Programma colloquio</h5>
            <button class="btn-close" @click="showScheduleModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Titolo</label>
                <input v-model="newInterview.title" class="form-control" />
              </div>
              <div class="col-md-7">
                <label class="form-label">Data e ora</label>
                <input v-model="newInterview.date" class="form-control" type="datetime-local" />
              </div>
              <div class="col-md-5">
                <label class="form-label">Durata (min)</label>
                <input v-model.number="newInterview.durationMin" class="form-control" type="number" min="15" step="15" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo</label>
                <select v-model="newInterview.type" class="form-select">
                  <option>Screening</option>
                  <option>Tecnica</option>
                  <option>Culturale</option>
                  <option>Case study</option>
                  <option>Final round</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Modalità</label>
                <select v-model="newInterview.mode" class="form-select">
                  <option>Video</option>
                  <option>On-site</option>
                  <option>Telefono</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Luogo / Link</label>
                <input v-model="newInterview.location" class="form-control" placeholder="es. Google Meet, sede Milano..." />
              </div>
              <div class="col-12">
                <label class="form-label">Intervistatori (separati da virgola)</label>
                <input v-model="newInterview.interviewers" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Note</label>
                <textarea v-model="newInterview.notes" class="form-control" rows="3"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" @click="showScheduleModal = false">Annulla</button>
            <button class="btn btn-primary" @click="saveSchedule">
              <i class="bi bi-calendar-check me-1"></i> Programma
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
