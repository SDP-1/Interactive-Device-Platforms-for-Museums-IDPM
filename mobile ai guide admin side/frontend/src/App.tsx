import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArtifactsPage } from "@/pages/ArtifactsPage";
import { KingsPage } from "@/pages/KingsPage";
import SessionsPage from "@/pages/SessionsPage";
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <div className="p-8">
                  Welcome to the Museum CMS. Use the navigation to manage
                  content.
                </div>
              }
            />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/kings" element={<KingsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
