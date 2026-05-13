import { defineComponent } from "vue";

export default defineComponent({
  name: "NotFound",
  template: `
    <div class="empty-state py-5">
      <i class="bi bi-compass"></i>
      <h2 class="fw-bold">Pagina non trovata</h2>
      <p>La rotta richiesta non esiste.</p>
      <router-link to="/jobs" class="btn btn-primary">
        <i class="bi bi-briefcase me-1"></i> Torna alle posizioni
      </router-link>
    </div>
  `,
});
