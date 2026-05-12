import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { state } from "../store.js";

export const AppShell = defineComponent({
  name: "AppShell",
  setup() {
    const search = ref("");
    const showResults = ref(false);

    function onDocClick(e) {
      const target = e.target;
      if (target && target.closest && !target.closest(".global-search")) {
        showResults.value = false;
      }
    }
    onMounted(() => document.addEventListener("click", onDocClick));
    onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

    onMounted(() => {
      document.documentElement.setAttribute(
        "data-bs-theme",
        state.settings.theme || "light"
      );
    });
    watch(
      () => state.settings.theme,
      (v) => document.documentElement.setAttribute("data-bs-theme", v)
    );

    const searchResults = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return [];
      const cands = state.candidates
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.email || "").toLowerCase().includes(q) ||
            (c.role || "").toLowerCase().includes(q) ||
            (c.skills || []).some((s) => s.toLowerCase().includes(q))
        )
        .slice(0, 6)
        .map((c) => ({
          type: "candidate",
          id: c.id,
          title: c.name,
          subtitle: c.role || c.headline,
          to: { name: "candidate-detail", params: { id: c.id } },
        }));
      const jobs = state.jobs
        .filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            (j.department || "").toLowerCase().includes(q) ||
            (j.location || "").toLowerCase().includes(q)
        )
        .slice(0, 4)
        .map((j) => ({
          type: "job",
          id: j.id,
          title: j.title,
          subtitle: `${j.department || ""} · ${j.location || ""}`,
          to: { name: "job-detail", params: { id: j.id } },
        }));
      return [...cands, ...jobs];
    });

    const onResultClick = () => {
      search.value = "";
      showResults.value = false;
    };

    return {
      search,
      showResults,
      searchResults,
      onResultClick,
      state,
    };
  },
  template: `
  <div class="app-shell">
    <header class="app-header">
      <nav class="app-nav-tabs" aria-label="Navigazione principale">
        <router-link to="/" class="nav-tab">
          <i class="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/pipeline" class="nav-tab">
          <i class="bi bi-kanban"></i>
          <span>Pipeline</span>
        </router-link>
        <router-link to="/candidates" class="nav-tab">
          <i class="bi bi-people"></i>
          <span>Candidati</span>
        </router-link>
        <router-link to="/jobs" class="nav-tab">
          <i class="bi bi-briefcase"></i>
          <span>Posizioni</span>
        </router-link>
        <router-link to="/interviews" class="nav-tab">
          <i class="bi bi-calendar-event"></i>
          <span>Colloqui</span>
        </router-link>
        <router-link to="/reports" class="nav-tab">
          <i class="bi bi-graph-up"></i>
          <span>Report</span>
        </router-link>
        <router-link to="/settings" class="nav-tab">
          <i class="bi bi-gear"></i>
          <span>Impostazioni</span>
        </router-link>
      </nav>

      <div class="app-topbar">
        <div class="global-search" @click.stop>
          <i class="bi bi-search"></i>
          <input
            type="text"
            class="form-control"
            placeholder="Cerca candidati, posizioni, skill..."
            v-model="search"
            @focus="showResults = true"
          />
          <div
            v-if="showResults && searchResults.length"
            class="search-results"
          >
            <router-link
              v-for="r in searchResults"
              :key="r.type + r.id"
              :to="r.to"
              class="search-result-item"
              @click="onResultClick"
            >
              <i :class="r.type === 'candidate' ? 'bi bi-person-circle' : 'bi bi-briefcase'"></i>
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ r.title }}</div>
                <div class="text-secondary small">{{ r.subtitle }}</div>
              </div>
              <span class="badge text-bg-light">{{ r.type === 'candidate' ? 'Candidato' : 'Posizione' }}</span>
            </router-link>
          </div>
        </div>

        <div class="dropdown">
          <button
            class="btn btn-light border position-relative"
            data-bs-toggle="dropdown"
          >
            <i class="bi bi-bell"></i>
            <span
              v-if="state.activity.length"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style="font-size: .6rem"
            >
              {{ Math.min(state.activity.length, 9) }}
            </span>
          </button>
          <div class="dropdown-menu dropdown-menu-end p-0" style="width: 320px; max-height: 400px; overflow-y: auto;">
            <div class="px-3 py-2 border-bottom fw-semibold">Attività recente</div>
            <div v-if="!state.activity.length" class="empty-state py-3">
              <i class="bi bi-bell-slash"></i>
              <div>Nessuna notifica</div>
            </div>
            <div
              v-for="a in state.activity.slice(0,15)"
              :key="a.id"
              class="px-3 py-2 border-bottom small"
            >
              <div>{{ a.message }}</div>
              <div class="text-secondary" style="font-size:.72rem">{{ new Date(a.at).toLocaleString('it-IT') }}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="app-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
  `,
});
