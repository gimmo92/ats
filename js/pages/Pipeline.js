import { defineComponent, computed, ref } from "vue";
import {
  state,
  STAGES,
  jobById,
  moveCandidateStage,
} from "../store.js";
import { Avatar } from "../components/Avatar.js";

export default defineComponent({
  name: "PipelinePage",
  components: { Avatar },
  setup() {
    const jobFilter = ref("");
    const search = ref("");
    const draggingId = ref(null);
    const dragOver = ref(null);

    const filteredCandidates = computed(() => {
      const q = search.value.trim().toLowerCase();
      return state.candidates.filter((c) => {
        if (jobFilter.value && c.jobId !== jobFilter.value) return false;
        if (q) {
          const hay = [c.name, c.email, c.role, ...(c.skills || [])]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    });

    const columns = computed(() =>
      STAGES.map((s) => ({
        ...s,
        candidates: filteredCandidates.value
          .filter((c) => c.stage === s.id)
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)),
      }))
    );

    function onDragStart(e, candidateId) {
      draggingId.value = candidateId;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", candidateId);
    }
    function onDragEnd() {
      draggingId.value = null;
      dragOver.value = null;
    }
    function onDragOver(e, stageId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      dragOver.value = stageId;
    }
    function onDragLeave(stageId) {
      if (dragOver.value === stageId) dragOver.value = null;
    }
    function onDrop(e, stageId) {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || draggingId.value;
      if (id) moveCandidateStage(id, stageId);
      draggingId.value = null;
      dragOver.value = null;
    }

    return {
      state,
      STAGES,
      jobById,
      jobFilter,
      search,
      columns,
      draggingId,
      dragOver,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragLeave,
      onDrop,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Pipeline</h1>
        <p class="page-subtitle">Trascina i candidati tra le fasi per aggiornare la pipeline</p>
      </div>
      <div class="d-flex gap-2">
        <select v-model="jobFilter" class="form-select" style="min-width: 220px;">
          <option value="">Tutte le posizioni</option>
          <option v-for="j in state.jobs" :key="j.id" :value="j.id">{{ j.title }}</option>
        </select>
        <div class="input-group" style="min-width: 220px;">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input v-model="search" class="form-control" placeholder="Cerca..." />
        </div>
      </div>
    </div>

    <div class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.id"
        class="kanban-column"
        :class="{ 'drag-over': dragOver === col.id }"
        @dragover="onDragOver($event, col.id)"
        @dragleave="onDragLeave(col.id)"
        @drop="onDrop($event, col.id)"
      >
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <span class="kanban-column-dot" :style="{ background: col.color }"></span>
            {{ col.label }}
          </div>
          <span class="badge text-bg-light border">{{ col.candidates.length }}</span>
        </div>
        <div class="kanban-cards">
          <router-link
            v-for="c in col.candidates"
            :key="c.id"
            :to="{ name: 'candidate-detail', params: { id: c.id } }"
            class="kanban-card text-decoration-none text-reset"
            :class="{ dragging: draggingId === c.id }"
            draggable="true"
            @dragstart="onDragStart($event, c.id)"
            @dragend="onDragEnd"
          >
            <div class="d-flex align-items-center gap-2">
              <Avatar :name="c.name" size="sm" />
              <div class="flex-grow-1">
                <div class="fw-semibold small">{{ c.name }}</div>
                <div class="text-secondary" style="font-size:.72rem">{{ c.role || '—' }}</div>
              </div>
              <a
                v-if="c.linkedinUrl"
                :href="c.linkedinUrl"
                target="_blank"
                rel="noopener"
                class="linkedin-icon"
                @click.stop
              >
                <i class="bi bi-linkedin"></i>
              </a>
            </div>
            <div class="kanban-card-meta mt-2">
              <i class="bi bi-briefcase me-1"></i>{{ jobById(c.jobId)?.title || '—' }}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <div>
                <span v-for="s in (c.skills || []).slice(0,2)" :key="s" class="skill-chip">{{ s }}</span>
              </div>
              <span v-if="c.rating" class="text-warning small">
                <i class="bi bi-star-fill"></i> {{ c.rating }}
              </span>
            </div>
          </router-link>
          <div v-if="!col.candidates.length" class="text-center text-secondary small py-3" style="opacity: .6;">
            Trascina qui
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
