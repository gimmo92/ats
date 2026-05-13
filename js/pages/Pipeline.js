import { defineComponent, computed, ref } from "vue";
import {
  state,
  jobById,
  moveCandidateStage,
  addPipelineStage,
  removePipelineStage,
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

    const showAddStageModal = ref(false);
    const newStageLabel = ref("");
    const newStageColor = ref("#6366f1");
    const stageFormError = ref("");

    const showRemoveStageModal = ref(false);
    const removeStageId = ref("");
    const removeMoveToId = ref("");
    const removeStageError = ref("");

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
      state.settings.pipelineStages.map((s) => ({
        ...s,
        candidates: filteredCandidates.value
          .filter((c) => c.stage === s.id)
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)),
      }))
    );

    function openAddStage() {
      stageFormError.value = "";
      newStageLabel.value = "";
      newStageColor.value = "#6366f1";
      showAddStageModal.value = true;
    }

    function confirmAddStage() {
      stageFormError.value = "";
      try {
        addPipelineStage({
          label: newStageLabel.value,
          color: newStageColor.value,
        });
        showAddStageModal.value = false;
      } catch (e) {
        stageFormError.value = e.message || "Errore";
      }
    }

    function openRemoveStage(stageId) {
      removeStageError.value = "";
      removeStageId.value = stageId;
      const fallback = state.settings.pipelineStages.find(
        (s) => s.id !== stageId
      );
      removeMoveToId.value = fallback?.id || "";
      showRemoveStageModal.value = true;
    }

    function confirmRemoveStage() {
      removeStageError.value = "";
      try {
        removePipelineStage(removeStageId.value, removeMoveToId.value);
        showRemoveStageModal.value = false;
      } catch (e) {
        removeStageError.value = e.message || "Errore";
      }
    }

    const removeStageOptions = computed(() =>
      state.settings.pipelineStages.filter((s) => s.id !== removeStageId.value)
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
      showAddStageModal,
      newStageLabel,
      newStageColor,
      stageFormError,
      openAddStage,
      confirmAddStage,
      showRemoveStageModal,
      removeMoveToId,
      removeStageError,
      openRemoveStage,
      confirmRemoveStage,
      removeStageOptions,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Pipeline</h1>
        <p class="page-subtitle">Trascina i candidati tra le fasi per aggiornare la pipeline</p>
      </div>
      <div class="d-flex gap-2 flex-wrap align-items-center">
        <button type="button" class="btn btn-outline-primary" @click="openAddStage">
          <i class="bi bi-plus-lg me-1"></i> Nuova fase
        </button>
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

    <div class="kanban-board" :style="{ '--kanban-cols': columns.length }">
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
          <div class="d-flex align-items-center gap-1">
            <span class="badge text-bg-light border">{{ col.candidates.length }}</span>
            <button
              v-if="!col.locked"
              type="button"
              class="btn btn-sm btn-link text-danger p-0 ms-1"
              title="Elimina fase"
              @click="openRemoveStage(col.id)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
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
            <div v-if="c.rating" class="d-flex justify-content-end mt-1">
              <span class="text-warning small">
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

    <div v-if="showAddStageModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,.5)" @click.self="showAddStageModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuova fase</h5>
            <button type="button" class="btn-close" aria-label="Chiudi" @click="showAddStageModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="stageFormError" class="alert alert-danger py-2 small">{{ stageFormError }}</div>
            <div class="mb-3">
              <label class="form-label">Nome</label>
              <input v-model="newStageLabel" class="form-control" placeholder="es. Assessment" maxlength="80" />
            </div>
            <div class="mb-0">
              <label class="form-label">Colore</label>
              <input v-model="newStageColor" type="color" class="form-control form-control-color w-100" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light border" @click="showAddStageModal = false">Annulla</button>
            <button type="button" class="btn btn-primary" @click="confirmAddStage">Crea</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRemoveStageModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,.5)" @click.self="showRemoveStageModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Elimina fase</h5>
            <button type="button" class="btn-close" aria-label="Chiudi" @click="showRemoveStageModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="removeStageError" class="alert alert-danger py-2 small">{{ removeStageError }}</div>
            <p class="small mb-3">I candidati in questa colonna verranno spostati nella fase selezionata.</p>
            <label class="form-label">Sposta candidati in</label>
            <select v-model="removeMoveToId" class="form-select">
              <option v-for="s in removeStageOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light border" @click="showRemoveStageModal = false">Annulla</button>
            <button type="button" class="btn btn-danger" :disabled="!removeMoveToId" @click="confirmRemoveStage">Elimina fase</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
