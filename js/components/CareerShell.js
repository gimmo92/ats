import { defineComponent, computed } from "vue";
import { state, careersPageSettings } from "../store.js";

export const CareerShell = defineComponent({
  name: "CareerShell",
  setup() {
    const company = computed(() => state.settings.company || {});
    const careers = computed(() => careersPageSettings());

    return {
      company,
      careers,
    };
  },
  template: `
  <div class="career-shell">
    <header class="career-header">
      <div class="career-header-inner">
        <router-link to="/carriere" class="career-brand">
          <span class="career-brand-mark">{{ (company.name || 'TalentFlow').slice(0, 1) }}</span>
          <span>
            <span class="career-brand-name">{{ company.name || 'TalentFlow' }}</span>
            <span class="career-brand-tag">Carriere</span>
          </span>
        </router-link>
        <nav class="career-nav" aria-label="Navigazione carriere">
          <router-link to="/carriere" class="career-nav-link">Posizioni aperte</router-link>
          <a
            v-if="company.website"
            :href="company.website"
            target="_blank"
            rel="noopener"
            class="career-nav-link"
          >
            Sito aziendale
          </a>
          <router-link to="/" class="btn btn-sm btn-light border">
            Area recruiter
          </router-link>
        </nav>
      </div>
    </header>

    <main class="career-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="career-footer">
      <div class="career-footer-inner">
        <div>
          <div class="career-footer-title">{{ company.name || 'TalentFlow' }}</div>
          <p class="career-footer-copy mb-0">
            {{ careers.subheadline }}
          </p>
        </div>
        <div class="career-footer-links">
          <router-link to="/carriere">Posizioni aperte</router-link>
          <router-link to="/">Area recruiter</router-link>
        </div>
      </div>
    </footer>
  </div>
  `,
});
