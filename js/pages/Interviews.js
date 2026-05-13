import { defineComponent, computed, ref } from "vue";
import {
  state,
  candidateById,
  jobById,
  formatDateTime,
  relativeFromNow,
  updateInterview,
  deleteInterview,
  addInterview,
} from "../store.js";
import { Avatar } from "../components/Avatar.js";

export default defineComponent({
  name: "InterviewsPage",
  components: { Avatar },
  setup() {
    const tab = ref("upcoming");
    const filter = ref("");

    const filtered = computed(() => {
      const q = filter.value.trim().toLowerCase();
      const now = Date.now();
      let list = state.interviews.filter((i) => {
        const t = new Date(i.date).getTime();
        if (tab.value === "upcoming") {
          if (i.status === "completed" || i.status === "cancelled") return false;
          if (t < now - 60 * 60 * 1000) return false;
        }
        if (tab.value === "past") {
          if (i.status !== "completed" && t > now) return false;
        }
        if (q) {
          const cand = candidateById(i.candidateId);
          const job = jobById(i.jobId);
          const hay = [
            i.title,
            cand?.name,
            job?.title,
            i.type,
            (i.interviewers || []).join(" "),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      return list.sort((a, b) =>
        tab.value === "past"
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
      );
    });

    const groupedByDay = computed(() => {
      const groups = {};
      for (const i of filtered.value) {
        const key = new Date(i.date).toISOString().slice(0, 10);
        (groups[key] ||= []).push(i);
      }
      return Object.entries(groups).map(([day, items]) => ({
        day,
        label: new Date(day).toLocaleDateString("it-IT", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        items,
      }));
    });

    function markCompleted(i) {
      updateInterview(i.id, { status: "completed" });
    }
    function markCancelled(i) {
      updateInterview(i.id, { status: "cancelled" });
    }
    function remove(i) {
      if (confirm("Eliminare questo colloquio?")) deleteInterview(i.id);
    }

    // New interview modal
    const showModal = ref(false);
    const draft = ref(emptyDraft());

    function emptyDraft() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      return {
        candidateId: "",
        jobId: "",
        title: "",
        date: toLocalDateTimeInput(d),
        durationMin: 60,
        type: "Tecnica",
        mode: "Video",
        location: "Google Meet",
        interviewers: state.settings.user.name,
        notes: "",
      };
    }
    function openModal() {
      draft.value = emptyDraft();
      showModal.value = true;
    }
    function saveModal() {
      if (!draft.value.candidateId) return alert("Seleziona un candidato");
      const cand = candidateById(draft.value.candidateId);
      addInterview({
        candidateId: draft.value.candidateId,
        jobId: draft.value.jobId || cand?.jobId,
        title: draft.value.title || `Colloquio - ${cand?.name || ""}`,
        date: new Date(draft.value.date).toISOString(),
        durationMin: Number(draft.value.durationMin) || 60,
        type: draft.value.type,
        mode: draft.value.mode,
        location: draft.value.location,
        interviewers: (draft.value.interviewers || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: draft.value.notes,
        status: "scheduled",
      });
      showModal.value = false;
    }

    function toLocalDateTimeInput(d) {
      const pad = (n) => String(n).padStart(2, "0");
      return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    }

    function interviewBodyLines(i) {
      const cand = candidateById(i.candidateId);
      const job = jobById(i.jobId);
      const lines = [
        cand?.name ? `Candidato: ${cand.name}` : "",
        job?.title ? `Posizione: ${job.title}` : "",
        i.type ? `Tipo: ${i.type}` : "",
        i.mode ? `Modalità: ${i.mode}` : "",
        (i.interviewers || []).length
          ? `Intervistatori: ${i.interviewers.join(", ")}`
          : "",
        i.notes ? `Note:\n${i.notes}` : "",
      ].filter(Boolean);
      return lines.join("\n");
    }

    function googleCalendarUrl(i) {
      const start = new Date(i.date);
      const dur = Number(i.durationMin) > 0 ? Number(i.durationMin) : 60;
      const end = new Date(start.getTime() + dur * 60 * 1000);
      const pad = (n) => String(n).padStart(2, "0");
      const g = (d) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
          d.getUTCHours()
        )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
      const dates = `${g(start)}/${g(end)}`;
      const title = i.title || "Colloquio";
      const details = interviewBodyLines(i).slice(0, 6000);
      const location = (i.location || "").slice(0, 1000);
      const q = new URLSearchParams({
        action: "TEMPLATE",
        text: title,
        dates,
        details,
        location,
      });
      return `https://calendar.google.com/calendar/render?${q.toString()}`;
    }

    /** Apre Outlook Web per creare l’evento (calendario visibile anche in Teams). */
    function teamsCalendarUrl(i) {
      const start = new Date(i.date);
      const dur = Number(i.durationMin) > 0 ? Number(i.durationMin) : 60;
      const end = new Date(start.getTime() + dur * 60 * 1000);
      const pad = (n) => String(n).padStart(2, "0");
      const isoUtc = (d) =>
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(
          d.getUTCHours()
        )}:${pad(d.getUTCMinutes())}:00Z`;
      const title = i.title || "Colloquio";
      const body = interviewBodyLines(i).slice(0, 8000);
      const location = (i.location || "").slice(0, 1000);
      const q = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        subject: title,
        startdt: isoUtc(start),
        enddt: isoUtc(end),
        body,
        location,
      });
      return `https://outlook.office.com/calendar/0/deeplink/compose?${q.toString()}`;
    }

    return {
      tab,
      filter,
      filtered,
      groupedByDay,
      candidateById,
      jobById,
      formatDateTime,
      relativeFromNow,
      markCompleted,
      markCancelled,
      remove,
      showModal,
      draft,
      openModal,
      saveModal,
      state,
      googleCalendarUrl,
      teamsCalendarUrl,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Colloqui</h1>
        <p class="page-subtitle">{{ filtered.length }} colloqui</p>
      </div>
      <button class="btn btn-primary" @click="openModal">
        <i class="bi bi-plus-lg me-1"></i> Nuovo colloquio
      </button>
    </div>

    <div class="card mb-3">
      <div class="card-body d-flex flex-wrap gap-2 align-items-center">
        <ul class="nav nav-pills">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: tab === 'upcoming' }" href="#" @click.prevent="tab = 'upcoming'">In programma</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: tab === 'past' }" href="#" @click.prevent="tab = 'past'">Passati</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: tab === 'all' }" href="#" @click.prevent="tab = 'all'">Tutti</a>
          </li>
        </ul>
        <div class="ms-auto input-group" style="max-width: 320px;">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input v-model="filter" class="form-control" placeholder="Filtra..." />
        </div>
      </div>
    </div>

    <div v-if="!filtered.length" class="card">
      <div class="card-body empty-state">
        <i class="bi bi-calendar-x"></i>
        <div class="fw-semibold">Nessun colloquio</div>
      </div>
    </div>

    <div v-for="g in groupedByDay" :key="g.day" class="mb-3">
      <div class="text-secondary fw-semibold small text-uppercase mb-2">{{ g.label }}</div>
      <div class="d-flex flex-column gap-2">
        <div v-for="i in g.items" :key="i.id" class="card">
          <div class="card-body d-flex flex-wrap align-items-start gap-3">
            <div class="text-center" style="min-width: 80px;">
              <div class="fw-bold fs-5">{{ new Date(i.date).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }) }}</div>
              <div class="text-secondary small">{{ i.durationMin }} min</div>
              <div class="text-secondary" style="font-size:.72rem">{{ relativeFromNow(i.date) }}</div>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span class="fw-semibold">{{ i.title }}</span>
                <span class="badge text-bg-light border">{{ i.type }}</span>
                <span class="badge text-bg-light border"><i class="bi bi-camera-video me-1"></i>{{ i.mode }}</span>
                <span class="badge"
                  :class="i.status === 'completed' ? 'text-bg-success' : i.status === 'cancelled' ? 'text-bg-danger' : 'text-bg-info'">
                  {{ ({scheduled:'Programmato', completed:'Completato', cancelled:'Annullato'})[i.status] || i.status }}
                </span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <Avatar :name="candidateById(i.candidateId)?.name || '?'" size="sm" />
                <router-link :to="{ name: 'candidate-detail', params: { id: i.candidateId } }" class="fw-semibold">
                  {{ candidateById(i.candidateId)?.name || '—' }}
                </router-link>
                <span class="text-secondary small">·</span>
                <router-link v-if="i.jobId" :to="{ name: 'job-detail', params: { id: i.jobId } }" class="text-secondary small text-decoration-none">
                  {{ jobById(i.jobId)?.title }}
                </router-link>
              </div>
              <div v-if="i.location" class="small text-secondary"><i class="bi bi-geo-alt me-1"></i>{{ i.location }}</div>
              <div v-if="i.interviewers?.length" class="small text-secondary"><i class="bi bi-people me-1"></i>{{ i.interviewers.join(', ') }}</div>
              <div v-if="i.notes" class="small mt-1" style="white-space: pre-wrap">{{ i.notes }}</div>
              <div class="d-flex flex-wrap gap-2 mt-2">
                <a
                  :href="googleCalendarUrl(i)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-outline-secondary"
                >
                  <i class="bi bi-google me-1"></i> Google Calendar
                </a>
                <a
                  :href="teamsCalendarUrl(i)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-outline-secondary"
                >
                  <i class="bi bi-microsoft-teams me-1"></i> Teams
                </a>
              </div>
            </div>
            <div class="d-flex flex-column gap-1">
              <button v-if="i.status !== 'completed'" class="btn btn-sm btn-outline-success" @click="markCompleted(i)">
                <i class="bi bi-check2"></i> Completato
              </button>
              <button v-if="i.status === 'scheduled'" class="btn btn-sm btn-outline-warning" @click="markCancelled(i)">
                <i class="bi bi-x-circle"></i> Annulla
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="remove(i)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,.5)" @click.self="showModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuovo colloquio</h5>
            <button class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Candidato *</label>
                <select v-model="draft.candidateId" class="form-select">
                  <option value="">—</option>
                  <option v-for="c in state.candidates" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Posizione</label>
                <select v-model="draft.jobId" class="form-select">
                  <option value="">—</option>
                  <option v-for="j in state.jobs" :key="j.id" :value="j.id">{{ j.title }}</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Titolo</label>
                <input v-model="draft.title" class="form-control" />
              </div>
              <div class="col-md-7">
                <label class="form-label">Data e ora</label>
                <input v-model="draft.date" class="form-control" type="datetime-local" />
              </div>
              <div class="col-md-5">
                <label class="form-label">Durata (min)</label>
                <input v-model.number="draft.durationMin" class="form-control" type="number" min="15" step="15" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo</label>
                <select v-model="draft.type" class="form-select">
                  <option>Screening</option>
                  <option>Tecnica</option>
                  <option>Culturale</option>
                  <option>Case study</option>
                  <option>Final round</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Modalità</label>
                <select v-model="draft.mode" class="form-select">
                  <option>Video</option>
                  <option>On-site</option>
                  <option>Telefono</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Luogo / Link</label>
                <input v-model="draft.location" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Intervistatori (separati da virgola)</label>
                <input v-model="draft.interviewers" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">Note</label>
                <textarea v-model="draft.notes" rows="3" class="form-control"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" @click="showModal = false">Annulla</button>
            <button class="btn btn-primary" @click="saveModal">
              <i class="bi bi-calendar-check me-1"></i> Programma
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
