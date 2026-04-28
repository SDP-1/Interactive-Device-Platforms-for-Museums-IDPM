import React, { useEffect, useState } from "react";
import { Artifact } from "../types/Artifact";
import { artifactService } from "../services/artifactService";
import { ArtifactForm } from "../components/ArtifactForm";
import { ArtifactList } from "../components/ArtifactList";
import Skeleton from "../components/ui/Skeleton";

export const ArtifactsPage: React.FC = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingArtifact, setEditingArtifact] = useState<
    Artifact | undefined
  >();
  const [language, setLanguage] = useState<"en" | "si">("en");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await artifactService.getAll();
      if (result.success) setArtifacts(result.data);
      else setError("Failed to load artifacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      if (editingId) {
        const result = await artifactService.update(editingId, data);
        if (result.success) {
          setArtifacts(
            artifacts.map((a) => (a._id === editingId ? result.data : a)),
          );
          setEditingId(null);
          setEditingArtifact(undefined);
          setShowForm(false);
        } else setError("Failed to update artifact");
      } else {
        const result = await artifactService.create(data);
        if (result.success) {
          setArtifacts([result.data, ...artifacts]);
          setShowForm(false);
        } else setError("Failed to create artifact");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (artifact: Artifact) => {
    setEditingId(artifact._id || null);
    setEditingArtifact(artifact);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this artifact?"))
      return;
    try {
      setDeletingId(id);
      const result = await artifactService.delete(id);
      if (result.success) setArtifacts(artifacts.filter((a) => a._id !== id));
      else setError("Failed to delete artifact");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingArtifact(undefined);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow sticky top-[72px] z-20">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Artifacts ({artifacts.length})
            </h1>
            <p className="text-gray-600 text-sm">Manage artifact content</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage(language === "en" ? "si" : "en")}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              {language === "en" ? "සිංහල" : "English"}
            </button>
            <button
              onClick={() => {
                handleCloseForm();
                setShowForm(!showForm);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
            >
              {showForm ? "Cancel" : "Add New Artifact"}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button onClick={() => setError(null)} className="ml-4">
              ✕
            </button>
          </div>
        )}

        {showForm && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? "Edit Artifact" : "Create New Artifact"}
            </h2>
            <ArtifactForm
              artifact={editingArtifact}
              onSubmit={handleSubmit}
              isLoading={loading}
            />
          </div>
        )}

        {!showForm && (
          <div>
            {loading ? (
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full max-w-[420px] justify-self-center bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="w-full h-48">
                      <Skeleton className="w-full h-48 skeleton-futuristic" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <Skeleton className="w-48 h-6 mb-3 skeleton-futuristic" />
                      <div className="space-y-2 mt-3">
                        <Skeleton className="w-3/4 h-4 rounded-md skeleton-futuristic" />
                        <Skeleton className="w-1/2 h-4 rounded-md skeleton-futuristic" />
                      </div>
                      <div className="flex gap-3 items-center mt-auto">
                        <Skeleton className="w-20 h-8 rounded-lg skeleton-futuristic" />
                        <Skeleton className="flex-1 h-10 rounded-lg skeleton-futuristic" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ArtifactList
                artifacts={artifacts}
                language={language}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletingId || undefined}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
