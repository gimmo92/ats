import { defineComponent } from "vue";

export default defineComponent({
  name: "NotFound",
  template: `
    <div class="empty-state py-5">
      <i class="bi bi-compass"></i>
      <h2 class="fw-bold">Pagina non trovata</h2>
      <p>La rotta richiesta non esiste.</p>
      <router-link to="/" class="btn btn-primary">
        <i class="bi bi-house me-1"></i> Torna alla dashboard
      </router-link>
    </div>
  `,
});
