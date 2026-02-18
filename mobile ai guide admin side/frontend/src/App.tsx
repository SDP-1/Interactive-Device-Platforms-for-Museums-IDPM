import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArtifactsPage } from "@/pages/ArtifactsPage";
import { KingsPage } from "@/pages/KingsPage";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Museum CMS</h1>
                <p className="text-sm text-gray-600">Admin dashboard</p>
              </div>
              <nav className="flex gap-3">
                <Link to="/" className="px-3 py-2 rounded hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link
                  to="/artifacts"
                  className="px-3 py-2 rounded hover:bg-gray-100"
                >
                  Artifacts
                </Link>
                <Link
                  to="/kings"
                  className="px-3 py-2 rounded hover:bg-gray-100"
                >
                  Kings
                </Link>
              </nav>
            </div>
          </header>

          <main>
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
