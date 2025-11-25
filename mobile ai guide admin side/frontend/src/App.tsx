import React, { useEffect, useState } from "react";
import { Artifact } from "@/types/Artifact";
import { artifactService } from "@/services/artifactService";
import { ArtifactForm } from "@/components/ArtifactForm";
import { ArtifactList } from "@/components/ArtifactList";

export const App: React.FC = () => {
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

  // Load artifacts on mount
  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await artifactService.getAll();
      if (result.success) {
        setArtifacts(result.data);
      } else {
        setError("Failed to load artifacts");
      }
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
            artifacts.map((a) => (a._id === editingId ? result.data : a))
          );
          setEditingId(null);
          setEditingArtifact(undefined);
          setShowForm(false);
        } else {
          setError("Failed to update artifact");
        }
      } else {
        const result = await artifactService.create(data);
        if (result.success) {
          setArtifacts([result.data, ...artifacts]);
          setShowForm(false);
        } else {
          setError("Failed to create artifact");
        }
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
      if (result.success) {
        setArtifacts(artifacts.filter((a) => a._id !== id));
      } else {
        setError("Failed to delete artifact");
      }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Museum Guide</h1>
              <p className="text-gray-600 mt-1">Manage Artifacts</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setLanguage(language === "en" ? "si" : "en")}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                {language === "en" ? "සිංහල" : "English"}
              </button>
              <button
                onClick={() => {
                  handleCloseForm();
                  setShowForm(!showForm);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                {showForm ? "Cancel" : "Add New Artifact"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
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

        {/* Artifacts List */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Artifacts ({artifacts.length})
            </h2>
          </div>

          {loading && !showForm ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading artifacts...</p>
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
      </main>
    </div>
  );
};
