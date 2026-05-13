import { defineComponent, computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { state, jobById } from "../store.js";

export default defineComponent({
  name: "ReportsPage",
  setup() {
    const funnelCanvas = ref(null);
    const monthlyCanvas = ref(null);
    const jobCanvas = ref(null);
    const sourceCanvas = ref(null);
    let charts = [];

    const totalCandidates = computed(() => state.candidates.length);
    const hired = computed(
      () => state.candidates.filter((c) => c.stage === "hired").length
    );
    const rejected = computed(
      () => state.candidates.filter((c) => c.stage === "rejected").length
    );
    const conversionRate = computed(() =>
      totalCandidates.value
        ? Math.round((hired.value / totalCandidates.value) * 1000) / 10
        : 0
    );
    const avgTimeToHire = computed(() => {
      const hires = state.candidates.filter((c) => c.stage === "hired");
      if (!hires.length) return 0;
      const days =
        hires.reduce((sum, c) => {
          const applied = new Date(c.appliedAt).getTime();
          return sum + Math.max(0, Date.now() - applied);
        }, 0) /
        hires.length /
        (1000 * 60 * 60 * 24);
      return Math.round(days);
    });

    const funnelData = computed(() =>
      state.settings.pipelineStages
        .filter((s) => s.id !== "rejected")
        .map((s) => ({
          ...s,
          count: state.candidates.filter((c) => c.stage === s.id).length,
        }))
    );

    const sourceData = computed(() => {
      const map = {};
      state.candidates.forEach((c) => {
        const k = c.source || "Altro";
        map[k] = (map[k] || 0) + 1;
      });
      return map;
    });

    const monthlyData = computed(() => {
      const labels = [];
      const applied = [];
      const hiredArr = [];
      const today = new Date();
      today.setDate(1);
      today.setHours(0, 0, 0, 0);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const start = d.getTime();
        const end = new Date(d);
        end.setMonth(end.getMonth() + 1);
        labels.push(
          d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" })
        );
        applied.push(
          state.candidates.filter((c) => {
            const t = new Date(c.appliedAt).getTime();
            return t >= start && t < end.getTime();
          }).length
        );
        hiredArr.push(
          state.candidates.filter((c) => {
            if (c.stage !== "hired") return false;
            const t = new Date(c.appliedAt).getTime();
            return t >= start && t < end.getTime();
          }).length
        );
      }
      return { labels, applied, hired: hiredArr };
    });

    const jobData = computed(() =>
      state.jobs
        .map((j) => ({
          title: j.title,
          count: state.candidates.filter((c) => c.jobId === j.id).length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    );

    function isDark() {
      return document.documentElement.getAttribute("data-bs-theme") === "dark";
    }
    function gridColor() {
      return isDark() ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)";
    }

    function buildCharts() {
      destroyCharts();
      Chart.defaults.color = isDark() ? "#cbd5e1" : "#475569";
      Chart.defaults.font.family = '"Open Sans", sans-serif';

      if (funnelCanvas.value) {
        charts.push(
          new Chart(funnelCanvas.value, {
            type: "bar",
            data: {
              labels: funnelData.value.map((s) => s.label),
              datasets: [
                {
                  data: funnelData.value.map((s) => s.count),
                  backgroundColor: funnelData.value.map((s) => s.color),
                  borderRadius: 8,
                  barThickness: 32,
                },
              ],
            },
            options: {
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: gridColor() }, ticks: { precision: 0 } },
                y: { grid: { display: false } },
              },
            },
          })
        );
      }

      if (monthlyCanvas.value) {
        const md = monthlyData.value;
        charts.push(
          new Chart(monthlyCanvas.value, {
            type: "bar",
            data: {
              labels: md.labels,
              datasets: [
                {
                  label: "Candidature",
                  data: md.applied,
                  backgroundColor: "#6366f1",
                  borderRadius: 6,
                },
                {
                  label: "Assunti",
                  data: md.hired,
                  backgroundColor: "#10b981",
                  borderRadius: 6,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: gridColor() }, ticks: { precision: 0 } },
              },
            },
          })
        );
      }

      if (jobCanvas.value) {
        charts.push(
          new Chart(jobCanvas.value, {
            type: "bar",
            data: {
              labels: jobData.value.map((j) => j.title),
              datasets: [
                {
                  data: jobData.value.map((j) => j.count),
                  backgroundColor: "#06b6d4",
                  borderRadius: 6,
                  barThickness: 22,
                },
              ],
            },
            options: {
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: gridColor() }, ticks: { precision: 0 } },
                y: { grid: { display: false } },
              },
            },
          })
        );
      }

      if (sourceCanvas.value) {
        charts.push(
          new Chart(sourceCanvas.value, {
            type: "polarArea",
            data: {
              labels: Object.keys(sourceData.value),
              datasets: [
                {
                  data: Object.values(sourceData.value),
                  backgroundColor: [
                    "rgba(10,102,194,.7)",
                    "rgba(99,102,241,.7)",
                    "rgba(6,182,212,.7)",
                    "rgba(16,185,129,.7)",
                    "rgba(245,158,11,.7)",
                    "rgba(236,72,153,.7)",
                  ],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
            },
          })
        );
      }
    }
    function destroyCharts() {
      charts.forEach((c) => c.destroy());
      charts = [];
    }

    onMounted(() => buildCharts());
    onBeforeUnmount(destroyCharts);
    watch(() => state.settings.theme, () => buildCharts());
    watch(
      [funnelData, monthlyData, jobData, sourceData],
      () => buildCharts(),
      { deep: true }
    );

    return {
      totalCandidates,
      hired,
      rejected,
      conversionRate,
      avgTimeToHire,
      funnelCanvas,
      monthlyCanvas,
      jobCanvas,
      sourceCanvas,
      jobData,
      jobById,
    };
  },
  template: `
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Report & Analytics</h1>
        <p class="page-subtitle">KPI e analisi del processo di recruiting</p>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="text-secondary small">Candidati totali</div>
            <div class="fs-3 fw-bold">{{ totalCandidates }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="text-secondary small">Assunti</div>
            <div class="fs-3 fw-bold text-success">{{ hired }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="text-secondary small">Tasso conversione</div>
            <div class="fs-3 fw-bold">{{ conversionRate }}%</div>
            <div class="text-secondary small">applicazioni → assunzioni</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6 col-xl-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="text-secondary small">Time to hire medio</div>
            <div class="fs-3 fw-bold">{{ avgTimeToHire }} <span class="fs-6 text-secondary">giorni</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-12 col-xl-7">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-3">Funnel di selezione</div>
            <div style="height: 300px">
              <canvas ref="funnelCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-5">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-3">Sorgenti candidati</div>
            <div style="height: 300px">
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
            <div class="fw-semibold mb-3">Andamento mensile</div>
            <div style="height: 280px">
              <canvas ref="monthlyCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-5">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold mb-3">Top posizioni per candidature</div>
            <div style="height: 280px">
              <canvas ref="jobCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
});
