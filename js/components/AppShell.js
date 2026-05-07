import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { state, stats } from "../store.js";
import { Avatar } from "./Avatar.js";

export const AppShell = defineComponent({
  name: "AppShell",
  components: { Avatar },
  setup() {
    const sidebarOpen = ref(false);
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

    const toggleTheme = () => {
      const next = state.settings.theme === "light" ? "dark" : "light";
      state.settings.theme = next;
      document.documentElement.setAttribute("data-bs-theme", next);
    };

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

    const counts = computed(() => ({
      candidates: state.candidates.length,
      jobs: state.jobs.filter((j) => j.status === "open").length,
      interviews: stats.value.interviewsThisWeek,
      pipeline: stats.value.inPipeline,
    }));

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
      sidebarOpen,
      search,
      showResults,
      toggleTheme,
      counts,
      searchResults,
      onResultClick,
      state,
    };
  },
  template: `
  <div class="app-shell">
    <!-- Backdrop mobile -->
    <div
      v-if="sidebarOpen"
      class="sidebar-backdrop d-lg-none"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside class="app-sidebar" :class="{ show: sidebarOpen }">
      <div class="brand">
        <div class="brand-logo">TF</div>
        <div>
          <div class="brand-name">TalentFlow</div>
          <div class="brand-tag">ATS · Recruiting</div>
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-section-title">Workspace</div>
        <router-link to="/" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-speedometer2"></i> Dashboard
        </router-link>
        <router-link to="/pipeline" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-kanban"></i> Pipeline
          <span class="badge text-bg-secondary">{{ counts.pipeline }}</span>
        </router-link>
        <router-link to="/candidates" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-people"></i> Candidati
          <span class="badge text-bg-secondary">{{ counts.candidates }}</span>
        </router-link>
        <router-link to="/jobs" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-briefcase"></i> Posizioni
          <span class="badge text-bg-success">{{ counts.jobs }}</span>
        </router-link>
        <router-link to="/interviews" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-calendar-event"></i> Colloqui
          <span class="badge text-bg-info">{{ counts.interviews }}</span>
        </router-link>
        <router-link to="/reports" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-graph-up"></i> Report
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-section-title">Integrazioni</div>
        <router-link to="/linkedin" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-linkedin linkedin-icon"></i> LinkedIn
          <span
            v-if="state.settings.linkedin.connected"
            class="badge text-bg-success"
          >
            ON
          </span>
          <span v-else class="badge text-bg-secondary">OFF</span>
        </router-link>
        <router-link to="/settings" class="nav-item-link" @click="sidebarOpen = false">
          <i class="bi bi-gear"></i> Impostazioni
        </router-link>
      </div>

      <div class="sidebar-footer">
        <div class="d-flex align-items-center gap-2">
          <Avatar :name="state.settings.user.name" size="sm" />
          <div class="flex-grow-1 small">
            <div class="fw-semibold">{{ state.settings.user.name }}</div>
            <div class="text-secondary" style="font-size:.75rem">{{ state.settings.user.role }}</div>
          </div>
          <button class="btn btn-sm btn-light border" @click="toggleTheme" :title="state.settings.theme === 'light' ? 'Modalità scura' : 'Modalità chiara'">
            <i :class="state.settings.theme === 'light' ? 'bi bi-moon' : 'bi bi-sun'"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="app-main">
      <!-- Topbar -->
      <header class="app-topbar">
        <button
          class="btn btn-light border d-lg-none"
          @click="sidebarOpen = !sidebarOpen"
        >
          <i class="bi bi-list"></i>
        </button>

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

        <div class="ms-auto d-flex align-items-center gap-2">
          <router-link to="/candidates/new" class="btn btn-primary d-none d-md-inline-flex">
            <i class="bi bi-plus-lg me-1"></i> Nuovo candidato
          </router-link>
          <router-link to="/jobs/new" class="btn btn-outline-primary d-none d-md-inline-flex">
            <i class="bi bi-plus-lg me-1"></i> Nuova posizione
          </router-link>

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
  </div>
  `,
});
