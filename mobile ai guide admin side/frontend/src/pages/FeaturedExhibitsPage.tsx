import React, { useEffect, useState } from "react";
import { featuredService } from "../services/featuredService";
import { FeaturedExhibit } from "../types/FeaturedExhibit";
import { FeaturedExhibitForm } from "../components/FeaturedExhibitForm";
import FeaturedExhibitList from "../components/FeaturedExhibitList";

const FeaturedExhibitsPage: React.FC = () => {
  const [exhibits, setExhibits] = useState<FeaturedExhibit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeaturedExhibit | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchExhibits();
  }, []);

  const fetchExhibits = async () => {
    try {
      setLoading(true);
      const res = await featuredService.getAll();
      if (res.success) setExhibits(res.data);
      else setError("Failed to load exhibits");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<FeaturedExhibit>) => {
    try {
      setLoading(true);
      const res = await featuredService.create(data);
      if (res.success) {
        setExhibits([res.data, ...exhibits]);
        setShowForm(false);
      } else setError("Failed to create exhibit");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ex: FeaturedExhibit) => {
    setEditing(ex);
    setShowForm(true);
  };

  const submitEdit = async (data: Partial<FeaturedExhibit>) => {
    if (!editing || !editing._id) return;
    try {
      setLoading(true);
      const res = await featuredService.update(editing._id, data);
      if (res.success) {
        setExhibits(
          exhibits.map((e) => (e._id === editing._id ? res.data : e)),
        );
        setEditing(null);
        setShowForm(false);
      } else setError("Failed to update exhibit");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Delete this exhibit?")) return;
    try {
      setLoading(true);
      const res = await featuredService.delete(id);
      if (res.success) setExhibits(exhibits.filter((e) => e._id !== id));
      else setError("Failed to delete exhibit");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (exhibitId: string, newOrder: string[]) => {
    try {
      await featuredService.updateOrder(exhibitId, newOrder);
      // optimistic update
      setExhibits(
        exhibits.map((e) =>
          e._id === exhibitId
            ? { ...e, order: newOrder, artifacts: newOrder }
            : e,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow sticky top-[72px] z-20">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Featured Exhibits ({exhibits.length})
            </h1>
            <p className="text-gray-600 text-sm">
              Group artifacts into curated exhibits
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditing(null);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
            >
              {showForm ? "Cancel" : "New Exhibit"}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editing ? "Edit Exhibit" : "Create Exhibit"}
            </h2>
            <FeaturedExhibitForm
              exhibit={editing || undefined}
              onSubmit={editing ? submitEdit : handleCreate}
              isLoading={loading}
            />
          </div>
        )}
        <div className="mb-4 flex items-center justify-between gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exhibits by name or description"
            className="w-full md:w-1/2 border rounded p-2"
          />
          <div className="text-sm text-gray-600">
            {exhibits.length} exhibits
          </div>
        </div>

        {!showForm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && exhibits.length === 0 ? (
              <div className="text-center py-12">Loading exhibits...</div>
            ) : (
              exhibits
                .filter((ex) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (ex.name || "").toLowerCase().includes(q) ||
                    (ex.description || "").toLowerCase().includes(q)
                  );
                })
                .map((ex) => (
                  <div
                    key={ex._id}
                    className="p-3 bg-white rounded shadow-sm flex flex-col"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {ex.imageUrl ? (
                          <img
                            src={ex.imageUrl}
                            alt={ex.name}
                            className="w-full h-full object-cover"
                          />
                        ) : ex.artifacts &&
                          ex.artifacts[0] &&
                          (ex.artifacts[0] as any).imageUrls &&
                          (ex.artifacts[0] as any).imageUrls[0] ? (
                          <img
                            src={(ex.artifacts[0] as any).imageUrls[0]}
                            alt={ex.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">{ex.name}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          {ex.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {(ex.artifacts || []).length} items
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {ex.estimated_visit_minutes || 0} mins
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEdit(ex)}
                          className="border-2 border-amber-400 text-amber-600 py-2 px-3 rounded-xl font-medium hover:bg-amber-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ex._id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <FeaturedExhibitList
                        exhibit={ex}
                        onReorder={(order) => handleReorder(ex._id!, order)}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeaturedExhibitsPage;
