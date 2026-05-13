import { createApp, h } from "vue";
import { createRouter, createWebHashHistory, RouterView } from "vue-router";

import { AppShell } from "./components/AppShell.js";
import { CareerShell } from "./components/CareerShell.js";

import Candidates from "./pages/Candidates.js";
import CandidateDetail from "./pages/CandidateDetail.js";
import CandidateNew from "./pages/CandidateNew.js";
import Jobs from "./pages/Jobs.js";
import JobDetail from "./pages/JobDetail.js";
import JobNew from "./pages/JobNew.js";
import Pipeline from "./pages/Pipeline.js";
import Interviews from "./pages/Interviews.js";
import Reports from "./pages/Reports.js";
import LinkedInPage from "./pages/LinkedInPage.js";
import Settings from "./pages/Settings.js";
import NotFound from "./pages/NotFound.js";
import CareersHome from "./pages/CareersHome.js";
import CareerJobDetail from "./pages/CareerJobDetail.js";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: AppShell,
      children: [
        { path: "", redirect: "/jobs" },
        { path: "pipeline", name: "pipeline", component: Pipeline },
        { path: "candidates", name: "candidates", component: Candidates },
        {
          path: "candidates/new",
          name: "candidate-new",
          component: CandidateNew,
        },
        {
          path: "candidates/:id",
          name: "candidate-detail",
          component: CandidateDetail,
        },
        { path: "jobs", name: "jobs", component: Jobs },
        { path: "jobs/new", name: "job-new", component: JobNew },
        { path: "jobs/:id", name: "job-detail", component: JobDetail },
        { path: "interviews", name: "interviews", component: Interviews },
        { path: "reports", name: "reports", component: Reports },
        { path: "linkedin", name: "linkedin", component: LinkedInPage },
        { path: "settings", name: "settings", component: Settings },
        {
          path: ":pathMatch(.*)*",
          name: "not-found",
          component: NotFound,
        },
      ],
    },
    {
      path: "/carriere",
      component: CareerShell,
      children: [
        { path: "", name: "careers-home", component: CareersHome },
        {
          path: ":id",
          name: "career-job-detail",
          component: CareerJobDetail,
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

const app = createApp({
  render: () => h(RouterView),
});

app.use(router);
app.mount("#app");
