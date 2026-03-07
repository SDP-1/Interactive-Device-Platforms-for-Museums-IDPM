import React, { useEffect, useState } from "react";
import { King } from "../types/King";
import { kingService } from "../services/kingService";
import { KingForm } from "../components/KingForm";
import { KingList } from "../components/KingList";

export const KingsPage: React.FC = () => {
  const [kings, setKings] = useState<King[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKing, setEditingKing] = useState<King | undefined>();
  const [language, setLanguage] = useState<"en" | "si">("en");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchKings();
  }, []);

  const fetchKings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await kingService.getAll();
      if (result.success) setKings(result.data);
      else setError("Failed to load kings");
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
        const result = await kingService.update(editingId, data);
        if (result.success) {
          setKings(kings.map((k) => (k._id === editingId ? result.data : k)));
          setEditingId(null);
          setEditingKing(undefined);
          setShowForm(false);
        } else setError("Failed to update king");
      } else {
        const result = await kingService.create(data);
        if (result.success) {
          setKings([result.data, ...kings]);
          setShowForm(false);
        } else setError("Failed to create king");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (king: King) => {
    setEditingId(king._id || null);
    setEditingKing(king);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this king?")) return;
    try {
      setDeletingId(id);
      const result = await kingService.delete(id);
      if (result.success) setKings(kings.filter((k) => k._id !== id));
      else setError("Failed to delete king");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingKing(undefined);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow sticky top-[72px] z-20">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Kings ({kings.length})
            </h1>
            <p className="text-gray-600 text-sm">Manage kings content</p>
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
              {showForm ? "Cancel" : "Add New King"}
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
              {editingId ? "Edit King" : "Create New King"}
            </h2>
            <KingForm
              king={editingKing}
              onSubmit={handleSubmit}
              isLoading={loading}
            />
          </div>
        )}

        {!showForm && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading kings...</p>
              </div>
            ) : (
              <KingList
                kings={kings}
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
