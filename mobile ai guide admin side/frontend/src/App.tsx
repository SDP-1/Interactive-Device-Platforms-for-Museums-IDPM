import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArtifactsPage } from "./pages/ArtifactsPage";
import { KingsPage } from "./pages/KingsPage";
import SessionsPage from "./pages/SessionsPage";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";
import FeaturedExhibitsPage from "./pages/FeaturedExhibitsPage";
import ToursPage from "./pages/ToursPage";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/kings" element={<KingsPage />} />
            <Route
              path="/featured-exhibits"
              element={<FeaturedExhibitsPage />}
            />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
