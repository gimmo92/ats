import { defineComponent, computed, ref } from "vue";
import {
  state,
  jobById,
  formatDate,
  relativeFromNow,
  pipelineStageById,
  stageBadgeStyle,
} from "../store.js";
import { Avatar } from "../components/Avatar.js";

export default defineComponent({
  name: "CandidatesPage",
  components: { Avatar },
  setup() {
    const search = ref("");
    const stageFilter = ref("");
    const jobFilter = ref("");
    const sourceFilter = ref("");
    const sortBy = ref("recent");

    const allSources = computed(() => {
      const set = new Set();
      state.candidates.forEach((c) => c.source && set.add(c.source));
      return Array.from(set);
    });

    const filtered = computed(() => {
      const q = search.value.trim().toLowerCase();
      let list = state.candidates.filter((c) => {
        if (stageFilter.value && c.stage !== stageFilter.value) return false;
        if (jobFilter.value && c.jobId !== jobFilter.value) return false;
        if (sourceFilter.value && c.source !== sourceFilter.value) return false;
        if (q) {
          const hay = [
            c.name,
            c.email,
            c.role,
            c.location,
            c.headline,
            ...(c.skills || []),
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      if (sortBy.value === "recent") {
        list = list.sort(
          (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
        );
      } else if (sortBy.value === "name") {
        list = list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list;
    });

    const stageLabel = (id) => pipelineStageById(id)?.label || id;

    return {
      search,
      stageFilter,
      jobFilter,
      sourceFilter,
      sortBy,
      filtered,
      state,
      stageLabel,
      stageBadgeStyle,
      jobById,
      relativeFromNow,
      formatDate,
      allSources,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Candidati</h1>
        <p class="page-subtitle">{{ filtered.length }} su {{ state.candidates.length }} candidati</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <router-link to="/candidates/new" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i> Nuovo candidato
        </router-link>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12 col-md-4">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="search" class="form-control" placeholder="Cerca per nome, email, skill..." />
            </div>
          </div>
          <div class="col-6 col-md-2">
            <select v-model="stageFilter" class="form-select">
              <option value="">Tutte le fasi</option>
              <option v-for="s in state.settings.pipelineStages" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
          <div class="col-6 col-md-3">
            <select v-model="jobFilter" class="form-select">
              <option value="">Tutte le posizioni</option>
              <option v-for="j in state.jobs" :key="j.id" :value="j.id">{{ j.title }}</option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <select v-model="sourceFilter" class="form-select">
              <option value="">Tutte le sorgenti</option>
              <option v-for="s in allSources" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="col-6 col-md-1">
            <select v-model="sortBy" class="form-select">
              <option value="recent">Recenti</option>
              <option value="name">Nome</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!filtered.length" class="card">
      <div class="card-body empty-state">
        <i class="bi bi-people"></i>
        <div class="fw-semibold">Nessun candidato trovato</div>
        <div class="small">Modifica i filtri o aggiungi un nuovo candidato.</div>
      </div>
    </div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-clean align-middle mb-0">
          <thead>
            <tr>
              <th>Candidato</th>
              <th>Ruolo / Posizione</th>
              <th>Fase</th>
              <th>Sorgente</th>
              <th>Skill</th>
              <th class="text-end">Applicato</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filtered"
              :key="c.id"
              @click="$router.push({ name: 'candidate-detail', params: { id: c.id } })"
            >
              <td>
                <div class="d-flex align-items-center gap-2">
                  <Avatar :name="c.name" :src="c.avatarUrl" />
                  <div>
                    <div class="fw-semibold">{{ c.name }}</div>
                    <div class="text-secondary small">{{ c.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="small fw-semibold">{{ c.role || '—' }}</div>
                <div class="text-secondary small">{{ jobById(c.jobId)?.title || '—' }}</div>
              </td>
              <td>
                <span class="badge stage-badge stage-badge-colored" :style="stageBadgeStyle(c.stage)">{{ stageLabel(c.stage) }}</span>
              </td>
              <td class="small">{{ c.source || '—' }}</td>
              <td>
                <span v-for="s in (c.skills || []).slice(0,3)" :key="s" class="skill-chip">{{ s }}</span>
                <span v-if="(c.skills || []).length > 3" class="skill-chip">+{{ c.skills.length - 3 }}</span>
              </td>
              <td class="text-end small text-secondary">
                <div>{{ formatDate(c.appliedAt) }}</div>
                <div style="font-size:.72rem">{{ relativeFromNow(c.appliedAt) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `,
});
