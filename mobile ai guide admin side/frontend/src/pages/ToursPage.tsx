import React, { useEffect, useMemo, useState } from "react";
import ToursModal from "../components/ToursModal";
import { artifactService } from "../services/artifactService";
import { tourService } from "../services/tourService";
import { Artifact } from "../types/Artifact";
import { NewTour, Tour, TourPoint } from "../types/Tour";

const ToursPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [tourSearch, setTourSearch] = useState("");
  const [artifactSearch, setArtifactSearch] = useState("");
  const [draggingOrder, setDraggingOrder] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingPath, setSavingPath] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const selectedTour = useMemo(
    () => tours.find((tour) => tour._id === selectedTourId) || null,
    [tours, selectedTourId],
  );

  const sortedPoints = useMemo(
    () =>
      (selectedTour?.points || []).slice().sort((a, b) => a.order - b.order),
    [selectedTour],
  );
  const [editedPoints, setEditedPoints] = useState<TourPoint[] | null>(null);

  useEffect(() => {
    setEditedPoints(sortedPoints.map((p) => ({ ...p })));
  }, [selectedTour]);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState<{
    name?: string;
    duration_minutes?: number | null;
    guidance?: string | null;
    floor?: string | null;
    section?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!selectedTour) {
      setInfoDraft(null);
      setEditingInfo(false);
      return;
    }
    setInfoDraft({
      name: selectedTour.name,
      duration_minutes: selectedTour.duration_minutes || null,
      guidance: selectedTour.guidance || null,
      floor: selectedTour.floor || null,
      section: selectedTour.section || null,
    });
    setEditingInfo(false);
  }, [selectedTour]);

  const filteredTours = useMemo(() => {
    const q = tourSearch.trim().toLowerCase();
    if (!q) return tours;

    return tours.filter((tour) => {
      const haystack = [
        tour.name,
        tour.floor || "",
        tour.section || "",
        String(tour.duration_minutes || ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tours, tourSearch]);

  const availableArtifacts = useMemo(() => {
    const selectedIds = new Set(
      (selectedTour?.points || []).map((point) => point.artifact_id),
    );
    const q = artifactSearch.trim().toLowerCase();

    return artifacts
      .filter(
        (artifact) =>
          artifact.artifact_id && !selectedIds.has(artifact.artifact_id),
      )
      .filter((artifact) => {
        if (!q) return true;

        const haystack = [
          artifact.artifact_id,
          artifact.title_en,
          artifact.title_si,
          artifact.category_en,
          artifact.category_si,
          artifact.description_en,
          artifact.description_si,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
  }, [artifacts, selectedTour, artifactSearch]);

  const tourSummary = useMemo(() => {
    const totalTours = tours.length;
    return { totalTours };
  }, [tours, selectedTour]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [toursRes, artifactsRes] = await Promise.all([
        tourService.getAll(),
        artifactService.getAll(),
      ]);

      const toursData = toursRes.data || [];
      setTours(toursData);
      setArtifacts(artifactsRes.data || []);

      if (toursData.length > 0) {
        setSelectedTourId((prev) => prev || toursData[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  const upsertTourLocal = (nextTour: Tour) => {
    setTours((prev) => {
      const index = prev.findIndex((tour) => tour._id === nextTour._id);
      if (index === -1) return [nextTour, ...prev];
      const clone = [...prev];
      clone[index] = nextTour;
      return clone;
    });
    setSelectedTourId(nextTour._id);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setModalOpen(true);
  };

  const handleModalSubmit = async (payload: NewTour) => {
    try {
      setModalSubmitting(true);
      setError(null);

      if (modalMode === "create") {
        const response = await tourService.create({ ...payload, points: [] });
        upsertTourLocal(response.data);
      } else if (selectedTour) {
        const response = await tourService.update(selectedTour._id, payload);
        upsertTourLocal(response.data);
      }

      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tour");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTour) return;
    if (!window.confirm("Delete this tour plan?")) return;

    try {
      setError(null);
      await tourService.delete(selectedTour._id);

      setTours((prev) => {
        const next = prev.filter((tour) => tour._id !== selectedTour._id);
        setSelectedTourId(next[0]?._id || null);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tour");
    }
  };

  const persistPoints = async (points: TourPoint[]) => {
    if (!selectedTour) return;
    try {
      setSavingPath(true);
      setError(null);
      const response = await tourService.savePoints(selectedTour._id, points);
      upsertTourLocal(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update tour path",
      );
    } finally {
      setSavingPath(false);
    }
  };
  const addPoint = (artifactId: string) => {
    if (!selectedTour || !artifactId || !editedPoints) return;
    if (editedPoints.some((p) => p.artifact_id === artifactId)) {
      setError("Artifact already exists in this tour path");
      return;
    }
    const nextOrder = editedPoints.length + 1;
    const newPoint: TourPoint = {
      artifact_id: artifactId,
      order: nextOrder,
      floor: selectedTour.floor || null,
      section: selectedTour.section || null,
      guidance: selectedTour.guidance || null,
    } as TourPoint;
    setEditedPoints([...editedPoints, newPoint]);
  };

  const removePoint = (order: number) => {
    if (!editedPoints) return;
    setEditedPoints(
      editedPoints
        .filter((p) => p.order !== order)
        .map((p, i) => ({ ...p, order: i + 1 })),
    );
  };

  const movePoint = (order: number, direction: -1 | 1) => {
    if (!editedPoints) return;
    const points = [...editedPoints].sort((a, b) => a.order - b.order);
    const currentIndex = points.findIndex((point) => point.order === order);
    if (currentIndex < 0) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= points.length) return;
    [points[currentIndex], points[nextIndex]] = [
      points[nextIndex],
      points[currentIndex],
    ];
    setEditedPoints(points.map((p, i) => ({ ...p, order: i + 1 })));
  };

  const updatePointField = (
    order: number,
    key: "floor" | "section" | "guidance" | "notes",
    value: string,
  ) => {
    if (!editedPoints) return;
    setEditedPoints(
      editedPoints.map((point) =>
        point.order === order ? { ...point, [key]: value } : point,
      ),
    );
  };

  const handleDropReorder = (targetOrder: number) => {
    if (
      !editedPoints ||
      draggingOrder === null ||
      draggingOrder === targetOrder
    ) {
      setDraggingOrder(null);
      return;
    }
    const points = [...editedPoints];
    const fromIndex = points.findIndex((p) => p.order === draggingOrder);
    const toIndex = points.findIndex((p) => p.order === targetOrder);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggingOrder(null);
      return;
    }
    const [moved] = points.splice(fromIndex, 1);
    points.splice(toIndex, 0, moved);
    setDraggingOrder(null);
    setEditedPoints(points.map((p, i) => ({ ...p, order: i + 1 })));
  };

  const artifactLabel = (artifactId: string, fallback?: string | null) => {
    const artifact = artifacts.find((item) => item.artifact_id === artifactId);
    return artifact?.title_en || artifact?.title_si || fallback || artifactId;
  };

  const artifactDescription = (
    artifactId: string,
    fallback?: string | null,
  ) => {
    const artifact = artifacts.find((item) => item.artifact_id === artifactId);
    return (
      artifact?.description_en ||
      artifact?.description_si ||
      fallback ||
      "No description"
    );
  };

  const stripHtml = (html?: string | null, max = 220) => {
    if (!html) return "";
    try {
      const stripped = html.replace(/<[^>]*>/g, "");
      return stripped.length > max ? stripped.slice(0, max) + "…" : stripped;
    } catch {
      return html;
    }
  };

  const artifactImage = (artifactId: string, fallback?: string | null) => {
    const artifact = artifacts.find((item) => item.artifact_id === artifactId);
    return artifact?.imageUrls?.[0] || fallback || null;
  };

  const scrollToLibrary = () => {
    const el = document.getElementById("artifact-library");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow sticky top-[72px] z-20">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tour Management
            </h1>
            <p className="text-sm text-gray-600">
              Create and edit museum tours with ordered artifact path cards
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
          >
            Create Tour Plan
          </button>
        </div>
      </header>

      <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Total Tours
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {tourSummary.totalTours}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading tours...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <section
              id="artifact-library"
              className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tour Plans
                </h2>
                <span className="text-xs text-gray-500">
                  {filteredTours.length}
                </span>
              </div>
              <input
                value={tourSearch}
                onChange={(event) => setTourSearch(event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search tours"
              />

              <div className="mt-3 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {filteredTours.length === 0 && (
                  <div className="text-sm text-gray-500">No tours found.</div>
                )}
                {filteredTours.map((tour) => {
                  const selected = selectedTourId === tour._id;
                  return (
                    <button
                      key={tour._id}
                      onClick={() => setSelectedTourId(tour._id)}
                      className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                        selected
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {tour.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {tour.points.length} stops • {tour.duration_minutes} min
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 truncate">
                        {tour.floor || "-"} • {tour.section || "-"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="xl:col-span-6 bg-white border border-gray-200 rounded-2xl p-4">
              {!selectedTour ? (
                <div className="text-sm text-gray-500 py-10 text-center">
                  Select a tour to manage path cards.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {!editingInfo ? (
                            <>
                              <h2 className="text-xl font-semibold text-gray-900">
                                {selectedTour.name}
                              </h2>
                              <p className="text-sm text-gray-600 mt-1">
                                Floor {selectedTour.floor || "-"} • Section{" "}
                                {selectedTour.section || "-"} •{" "}
                                {selectedTour.duration_minutes} min
                              </p>
                              {selectedTour.guidance && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {selectedTour.guidance}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                              <div className="md:col-span-2">
                                <label className="text-xs text-gray-600">
                                  Tour Name
                                </label>
                                <input
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  value={infoDraft?.name || ""}
                                  onChange={(e) =>
                                    setInfoDraft({
                                      ...(infoDraft || {}),
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">
                                  Duration (min)
                                </label>
                                <input
                                  type="number"
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  value={infoDraft?.duration_minutes ?? ""}
                                  onChange={(e) =>
                                    setInfoDraft({
                                      ...(infoDraft || {}),
                                      duration_minutes: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="text-xs text-gray-600">
                                  Description
                                </label>
                                <textarea
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-24"
                                  value={infoDraft?.guidance || ""}
                                  onChange={(e) =>
                                    setInfoDraft({
                                      ...(infoDraft || {}),
                                      guidance: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">
                                  Floor
                                </label>
                                <input
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  value={infoDraft?.floor || ""}
                                  onChange={(e) =>
                                    setInfoDraft({
                                      ...(infoDraft || {}),
                                      floor: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">
                                  Section
                                </label>
                                <input
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  value={infoDraft?.section || ""}
                                  onChange={(e) =>
                                    setInfoDraft({
                                      ...(infoDraft || {}),
                                      section: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!editingInfo ? (
                            <>
                              <button
                                onClick={() => setEditingInfo(true)}
                                className="px-3 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50"
                              >
                                Edit Tour
                              </button>
                              <button
                                onClick={handleDelete}
                                className="px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  if (!selectedTour || !infoDraft) return;
                                  try {
                                    setLoading(true);
                                    setError(null);
                                    const payload: Partial<NewTour> = {
                                      name: infoDraft.name,
                                      duration_minutes:
                                        infoDraft.duration_minutes || 0,
                                      guidance: infoDraft.guidance || "",
                                      floor: infoDraft.floor || "",
                                      section: infoDraft.section || "",
                                    };
                                    const res = await tourService.update(
                                      selectedTour._id,
                                      payload as NewTour,
                                    );
                                    upsertTourLocal(res.data);
                                    setEditingInfo(false);
                                  } catch (err) {
                                    setError(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to save tour info",
                                    );
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Save Tour
                              </button>
                              <button
                                onClick={() => {
                                  // discard
                                  setInfoDraft({
                                    name: selectedTour.name,
                                    duration_minutes:
                                      selectedTour.duration_minutes || null,
                                    guidance: selectedTour.guidance || null,
                                    floor: selectedTour.floor || null,
                                    section: selectedTour.section || null,
                                  });
                                  setEditingInfo(false);
                                }}
                                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Tour Artifacts</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scrollToLibrary()}
                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        + Add Artifact
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    Drag cards to reorder the path. Make changes locally and
                    click <strong>Save Path</strong> to persist.
                  </div>

                  <div className="mt-4 space-y-3">
                    {(editedPoints || []).length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                        No artifacts in this tour yet. Add artifacts from the
                        library.
                      </div>
                    )}

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={async () => {
                          if (!editedPoints) return;
                          await persistPoints(editedPoints);
                        }}
                        disabled={savingPath}
                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                      >
                        Save Path
                      </button>
                      <button
                        onClick={() =>
                          setEditedPoints(sortedPoints.map((p) => ({ ...p })))
                        }
                        className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50"
                      >
                        Discard Changes
                      </button>
                    </div>

                    {(editedPoints || []).map((point) => (
                      <div
                        key={`${point.artifact_id}-${point.order}`}
                        draggable
                        onDragStart={() => setDraggingOrder(point.order)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDropReorder(point.order)}
                        className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm cursor-move hover:shadow-md"
                      >
                        {/* connector line removed for cleaner UI */}

                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-3 w-12 flex-shrink-0">
                            <div className="text-gray-400 cursor-grab select-none">
                              ≡
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-semibold">
                              {point.order}
                            </div>
                          </div>

                          <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                            {artifactImage(
                              point.artifact_id,
                              point.artifact?.imageUrl,
                            ) ? (
                              <img
                                src={
                                  artifactImage(
                                    point.artifact_id,
                                    point.artifact?.imageUrl,
                                  ) as string
                                }
                                alt={artifactLabel(
                                  point.artifact_id,
                                  point.artifact?.title_en,
                                )}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <a
                                  href={`/artifacts/${point.artifact_id}`}
                                  className="font-semibold text-blue-700 text-lg hover:underline truncate"
                                >
                                  {artifactLabel(
                                    point.artifact_id,
                                    point.artifact?.title_en,
                                  )}
                                </a>
                                <div className="text-xs text-gray-500 mt-1">
                                  Artifact ID: {point.artifact_id}
                                </div>
                                <div className="text-sm text-gray-600 mt-2">
                                  {stripHtml(
                                    artifactDescription(
                                      point.artifact_id,
                                      point.artifact?.description_en,
                                    ),
                                    200,
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => movePoint(point.order, -1)}
                                    disabled={savingPath}
                                    className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => movePoint(point.order, 1)}
                                    disabled={savingPath}
                                    className="px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    ↓
                                  </button>
                                </div>
                                <button
                                  onClick={() => removePoint(point.order)}
                                  disabled={savingPath}
                                  className="px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-3">
                          <div className="sm:col-span-1">
                            <label className="text-xs text-gray-600">
                              Floor
                            </label>
                            <input
                              value={point.floor || ""}
                              onChange={(event) =>
                                updatePointField(
                                  point.order,
                                  "floor",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Floor"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="text-xs text-gray-600">
                              Section
                            </label>
                            <input
                              value={point.section || ""}
                              onChange={(event) =>
                                updatePointField(
                                  point.order,
                                  "section",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Section"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-gray-600">
                              Guidance
                            </label>
                            <input
                              value={point.guidance || ""}
                              onChange={(event) =>
                                updatePointField(
                                  point.order,
                                  "guidance",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Guidance"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-gray-600">
                              Notes
                            </label>
                            <input
                              value={point.notes || ""}
                              onChange={(event) =>
                                updatePointField(
                                  point.order,
                                  "notes",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Notes"
                            />
                          </div>
                        </div>

                        {/* visited tracking is handled by mobile visitor app; removed from CMS UI */}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="xl:col-span-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Artifact Library
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Search and add artifacts to the selected tour.
                  </p>
                </div>

                <div>
                  <input
                    value={artifactSearch}
                    onChange={(event) => setArtifactSearch(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm"
                    placeholder="Search by name, category, ID"
                  />
                </div>

                <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
                  {!selectedTour && (
                    <div className="text-sm text-gray-500">
                      Select a tour first.
                    </div>
                  )}

                  {selectedTour && availableArtifacts.length === 0 && (
                    <div className="text-sm text-gray-500">
                      No matching artifacts available.
                    </div>
                  )}

                  {selectedTour &&
                    availableArtifacts.map((artifact) => (
                      <div
                        key={artifact.artifact_id || artifact._id}
                        className="rounded-lg border border-gray-100 bg-white shadow-sm"
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                              {artifact.imageUrls?.[0] ? (
                                <img
                                  src={artifact.imageUrls[0]}
                                  alt={artifact.title_en || artifact.title_si}
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {artifact.title_en || artifact.title_si}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {artifact.artifact_id}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mt-2 line-clamp-3">
                                {stripHtml(
                                  artifact.description_en ||
                                    artifact.description_si,
                                  140,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-3 pb-3">
                          <button
                            onClick={() => addPoint(artifact.artifact_id || "")}
                            disabled={savingPath}
                            className="w-full rounded-md bg-blue-600 text-white py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                          >
                            Add to Tour
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-700">
                    Path Map Preview
                  </div>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    {(editedPoints || []).length === 0 && (
                      <div className="text-gray-500">No path defined yet.</div>
                    )}
                    {(editedPoints || []).map((point) => (
                      <div key={`map-${point.order}`} className="truncate">
                        Step {point.order}: Floor{" "}
                        {point.floor || selectedTour?.floor || "-"} • Section{" "}
                        {point.section || selectedTour?.section || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <ToursModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initialTour={modalMode === "edit" ? selectedTour : null}
        submitting={modalSubmitting}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default ToursPage;
