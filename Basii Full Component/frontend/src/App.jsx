/**
 * ============================================================
 * UNIFIED FRONTEND — BASII FULL COMPONENT
 * ============================================================
 * Combines all three component frontends into a single React
 * application.  Each component keeps its own backend, its own
 * CSS theme, and exactly the same UI/UX it had before.
 *
 * Routing strategy
 * ─────────────────
 * The Scenario Generation component uses absolute path
 * navigation internally (/artifact/:id, /scenarios/:id, /),
 * so its pages are mounted directly at the root of the unified
 * BrowserRouter — no prefix needed, no changes to those files.
 *
 * The Artifact Comparison and Craft Simulation components use
 * useState-based screen navigation (no React Router), so they
 * are each mounted under a dedicated path prefix.
 *
 * URL map
 * ───────
 *   /                      → Scenario Explorer  (Scenario Generation)
 *   /artifact/:id          → Artifact Detail    (Scenario Generation)
 *   /scenarios/:id         → Scenario Analysis  (Scenario Generation)
 *   /comparison            → Artifact Comparison & AI Explainer
 *   /craft                 → Craft Simulation
 *
 * Backend proxy (configured in vite.config.js)
 * ─────────────────────────────────────────────
 *   /api/artifacts, /api/compare  → port 5000  (Comparison backend)
 *   /api/scenarios, /api/generate,
 *   /api/scenario-status, /health,
 *   /model-status                 → port 5001  (Scenario backend)
 * ============================================================
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// ── Scenario Generation pages (mounted at root-level routes) ──────────────────
// Imported individually so the unified BrowserRouter handles routing instead
// of the ScenarioApp's own BrowserRouter wrapper.
import ExplorerPage       from './scenario/pages/ExplorerPage.jsx'
import ArtifactDetailPage from './scenario/pages/ArtifactDetailPage.jsx'
import ScenariosPage      from './scenario/pages/ScenariosPage.jsx'

// ── Artifact Comparison Component (useState navigation, no Router) ────────────
import ComparisonApp from './comparison/App.jsx'

// ── Craft Simulation Component (useState navigation, no Router) ───────────────
import CraftApp from './craft/App.jsx'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Scenario Generation (root-level, preserves all absolute links) ── */}
        <Route index element={<ExplorerPage />} />
        <Route path="/artifact/:id" element={<ArtifactDetailPage />} />
        <Route path="/scenarios/:id" element={<ScenariosPage />} />

        {/* ── Artifact Comparison Component ────────────────────────────────── */}
        <Route path="/comparison/*" element={<ComparisonApp />} />

        {/* ── Craft Simulation Component ───────────────────────────────────── */}
        <Route path="/craft/*" element={<CraftApp />} />

        {/* ── Fallback ─────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
