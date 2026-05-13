import { defineComponent } from "vue";
import { stats } from "../store.js";

export default defineComponent({
  name: "DashboardPage",
  setup() {
    return {
      stats,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Panoramica del recruiting · {{ new Date().toLocaleDateString('it-IT', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) }}</p>
      </div>
      <div class="d-flex gap-2">
        <router-link to="/candidates/new" class="btn btn-primary">
          <i class="bi bi-plus-lg me-1"></i> Nuovo candidato
        </router-link>
        <router-link to="/jobs/new" class="btn btn-outline-primary">
          <i class="bi bi-briefcase me-1"></i> Nuova posizione
        </router-link>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card kpi-card h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="kpi-icon" style="background: rgba(99,102,241,.12); color:#6366f1">
              <i class="bi bi-people-fill"></i>
            </div>
            <div>
              <div class="text-secondary small">Candidati totali</div>
              <div class="fs-3 fw-bold">{{ stats.totalCandidates }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card kpi-card h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="kpi-icon" style="background: rgba(16,185,129,.12); color:#10b981">
              <i class="bi bi-briefcase-fill"></i>
            </div>
            <div>
              <div class="text-secondary small">Posizioni aperte</div>
              <div class="fs-3 fw-bold">{{ stats.openJobs }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card kpi-card h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="kpi-icon" style="background: rgba(59,130,246,.12); color:#3b82f6">
              <i class="bi bi-calendar-event-fill"></i>
            </div>
            <div>
              <div class="text-secondary small">Colloqui (questa settimana)</div>
              <div class="fs-3 fw-bold">{{ stats.interviewsThisWeek }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card kpi-card h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="kpi-icon" style="background: rgba(245,158,11,.12); color:#f59e0b">
              <i class="bi bi-trophy-fill"></i>
            </div>
            <div>
              <div class="text-secondary small">Assunzioni ultimo mese</div>
              <div class="fs-3 fw-bold">{{ stats.hiredThisMonth }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
