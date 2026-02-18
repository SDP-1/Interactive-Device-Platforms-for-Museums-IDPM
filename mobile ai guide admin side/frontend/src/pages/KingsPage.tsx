import React, { useEffect, useState } from "react";
import { King } from "@/types/King";
import { kingService } from "@/services/kingService";
import { KingForm } from "@/components/KingForm";
import { KingList } from "@/components/KingList";

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kings</h1>
            <p className="text-gray-600 mt-1">Manage kings content</p>
          </div>
          <div className="flex gap-4">
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
              className="px-6 py-2 bg-green-600 text-white rounded"
            >
              {showForm ? "Cancel" : "Add New King"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Kings ({kings.length})</h2>
          </div>
          {loading && !showForm ? (
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
      </main>
    </div>
  );
};
