import { defineComponent, watch, onMounted } from "vue";
import { state } from "../store.js";

export const AppShell = defineComponent({
  name: "AppShell",
  setup() {
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

    return {};
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
