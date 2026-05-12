import { defineComponent, computed, onMounted, ref, onBeforeUnmount, watch } from "vue";
import {
  state,
  stats,
  STAGES,
  candidateById,
  jobById,
  formatDate,
  formatDateTime,
  relativeFromNow,
} from "../store.js";
import { Avatar } from "../components/Avatar.js";

export default defineComponent({
  name: "DashboardPage",
  components: { Avatar },
  setup() {
    const pipelineCanvas = ref(null);
    const sourceCanvas = ref(null);
    const trendCanvas = ref(null);
    let charts = [];

    const upcomingInterviews = computed(() =>
      [...state.interviews]
        .filter((i) => i.status === "scheduled" && new Date(i.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
    );

    const recentActivity = computed(() => state.activity.slice(0, 8));
    const recentCandidates = computed(() =>
      [...state.candidates]
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
        .slice(0, 5)
    );

    const pipelineCounts = computed(() =>
      STAGES.map(
        (s) => state.candidates.filter((c) => c.stage === s.id).length
      )
    );

    const sourceData = computed(() => {
      const map = {};
      state.candidates.forEach((c) => {
        const k = c.source || "Altro";
        map[k] = (map[k] || 0) + 1;
      });
      return map;
    });

    const last30DaysData = computed(() => {
      const labels = [];
      const data = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(
          d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })
        );
        const start = d.getTime();
        const end = start + 24 * 3600 * 1000;
        const count = state.candidates.filter((c) => {
          const t = new Date(c.appliedAt).getTime();
          return t >= start && t < end;
        }).length;
        data.push(count);
      }
      return { labels, data };
    });

    function isDark() {
      return document.documentElement.getAttribute("data-bs-theme") === "dark";
    }

    function gridColor() {
      return isDark() ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)";
    }

    function buildCharts() {
      destroyCharts();
      const fontColor = isDark() ? "#cbd5e1" : "#475569";
      Chart.defaults.color = fontColor;
      Chart.defaults.font.family =
        "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

      // Pipeline
      if (pipelineCanvas.value) {
        charts.push(
          new Chart(pipelineCanvas.value, {
            type: "bar",
            data: {
              labels: STAGES.map((s) => s.label),
              datasets: [
                {
                  data: pipelineCounts.value,
                  backgroundColor: STAGES.map((s) => s.color),
                  borderRadius: 8,
                  barThickness: 28,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: gridColor() }, ticks: { precision: 0 } },
              },
            },
          })
        );
      }

      // Source
      if (sourceCanvas.value) {
        const labels = Object.keys(sourceData.value);
        const data = Object.values(sourceData.value);
        charts.push(
          new Chart(sourceCanvas.value, {
            type: "doughnut",
            data: {
              labels,
              datasets: [
                {
                  data,
                  backgroundColor: [
                    "#0a66c2",
                    "#6366f1",
                    "#06b6d4",
                    "#10b981",
                    "#f59e0b",
                    "#ec4899",
                  ],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "65%",
              plugins: {
                legend: { position: "bottom" },
              },
            },
          })
        );
      }

      // Trend
      if (trendCanvas.value) {
        const ld = last30DaysData.value;
        const ctx = trendCanvas.value.getContext("2d");
        const grad = ctx.createLinearGradient(0, 0, 0, 200);
        grad.addColorStop(0, "rgba(99,102,241,.35)");
        grad.addColorStop(1, "rgba(99,102,241,0)");
        charts.push(
          new Chart(trendCanvas.value, {
            type: "line",
            data: {
              labels: ld.labels,
              datasets: [
                {
                  data: ld.data,
                  borderColor: "#6366f1",
                  backgroundColor: grad,
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  borderWidth: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
                y: { grid: { color: gridColor() }, ticks: { precision: 0 } },
              },
            },
          })
        );
      }
    }

    function destroyCharts() {
      charts.forEach((c) => c.destroy());
      charts = [];
    }

    onMounted(() => {
      buildCharts();
    });
    onBeforeUnmount(destroyCharts);

    watch(
      () => state.settings.theme,
      () => buildCharts()
    );
    watch(
      [pipelineCounts, sourceData, last30DaysData],
      () => buildCharts(),
      { deep: true }
    );

    return {
      stats,
      upcomingInterviews,
      recentActivity,
      recentCandidates,
      pipelineCanvas,
      sourceCanvas,
      trendCanvas,
      formatDate,
      formatDateTime,
      relativeFromNow,
      candidateById,
      jobById,
      state,
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

    <!-- KPI Cards -->
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


    <!-- Grafici -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-8">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div class="fw-semibold">Trend candidature</div>
                <div class="text-secondary small">Ultimi 30 giorni</div>
              </div>
            </div>
            <div style="height: 240px">
              <canvas ref="trendCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-4">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-3">Sorgenti</div>
            <div style="height: 240px">
              <canvas ref="sourceCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-xl-7">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div class="fw-semibold">Pipeline</div>
                <div class="text-secondary small">Distribuzione per fase</div>
              </div>
              <router-link to="/pipeline" class="btn btn-sm btn-light border">
                Apri pipeline <i class="bi bi-arrow-right ms-1"></i>
              </router-link>
            </div>
            <div style="height: 240px">
              <canvas ref="pipelineCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-5">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="fw-semibold">Prossimi colloqui</div>
              <router-link to="/interviews" class="btn btn-sm btn-light border">
                Tutti <i class="bi bi-arrow-right ms-1"></i>
              </router-link>
            </div>
            <div v-if="!upcomingInterviews.length" class="empty-state">
              <i class="bi bi-calendar-x"></i>
              <div>Nessun colloquio in programma</div>
            </div>
            <div v-else class="d-flex flex-column gap-2">
              <router-link
                v-for="i in upcomingInterviews"
                :key="i.id"
                :to="{ name: 'candidate-detail', params: { id: i.candidateId } }"
                class="d-flex align-items-center gap-2 p-2 rounded text-decoration-none"
                style="border:1px solid var(--bs-border-color); color: inherit;"
              >
                <Avatar :name="candidateById(i.candidateId)?.name || '?'" size="sm" />
                <div class="flex-grow-1">
                  <div class="fw-semibold small">{{ candidateById(i.candidateId)?.name || '—' }}</div>
                  <div class="text-secondary" style="font-size:.78rem">
                    {{ i.title }} · {{ jobById(i.jobId)?.title }}
                  </div>
                </div>
                <div class="text-end small">
                  <div class="fw-semibold">{{ formatDateTime(i.date) }}</div>
                  <div class="text-secondary" style="font-size:.72rem">{{ relativeFromNow(i.date) }}</div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mt-1">
      <div class="col-12 col-xl-7">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="fw-semibold">Candidati recenti</div>
              <router-link to="/candidates" class="btn btn-sm btn-light border">
                Tutti <i class="bi bi-arrow-right ms-1"></i>
              </router-link>
            </div>
            <div v-if="!recentCandidates.length" class="empty-state">
              <i class="bi bi-people"></i>
              <div>Nessun candidato</div>
            </div>
            <table v-else class="table table-clean align-middle mb-0">
              <thead><tr><th>Nome</th><th>Ruolo</th><th>Fase</th><th>Applicato</th></tr></thead>
              <tbody>
                <tr
                  v-for="c in recentCandidates"
                  :key="c.id"
                  @click="$router.push({ name: 'candidate-detail', params: { id: c.id } })"
                >
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <Avatar :name="c.name" size="sm" />
                      <div>
                        <div class="fw-semibold small">{{ c.name }}</div>
                        <div class="text-secondary" style="font-size:.72rem">{{ c.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="small">{{ c.role || '—' }}</td>
                  <td>
                    <span class="badge stage-badge" :class="'bg-stage-' + c.stage">
                      {{ ({applied:'Candidatura',screening:'Screening',interview:'Colloquio',offer:'Offerta',hired:'Assunto',rejected:'Rifiutato'})[c.stage] }}
                    </span>
                  </td>
                  <td class="small text-secondary">{{ relativeFromNow(c.appliedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-5">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-3">Attività recente</div>
            <div v-if="!recentActivity.length" class="empty-state">
              <i class="bi bi-activity"></i>
              <div>Nessuna attività</div>
            </div>
            <div v-else class="timeline">
              <div v-for="a in recentActivity" :key="a.id" class="timeline-item">
                <div class="small">{{ a.message }}</div>
                <div class="text-secondary" style="font-size:.72rem">{{ formatDateTime(a.at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
