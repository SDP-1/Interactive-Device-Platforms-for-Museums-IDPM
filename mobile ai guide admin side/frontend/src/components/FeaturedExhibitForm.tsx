import React, { useEffect, useState, useRef } from "react";
import { FeaturedExhibit } from "../types/FeaturedExhibit";
import { Artifact } from "../types/Artifact";
import { artifactService } from "../services/artifactService";

interface Props {
  exhibit?: FeaturedExhibit | null;
  onSubmit: (data: Partial<FeaturedExhibit>) => void;
  isLoading?: boolean;
}

export const FeaturedExhibitForm: React.FC<Props> = ({
  exhibit,
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState(exhibit?.name || "");
  const [description, setDescription] = useState(exhibit?.description || "");
  const [estimated, setEstimated] = useState<number>(
    exhibit?.estimated_visit_minutes || 30,
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    (exhibit && (exhibit as any).imageUrl) || undefined,
  );
  const [available, setAvailable] = useState<Artifact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArtifacts, setSelectedArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await artifactService.getAll();
        if (res.success) {
          setAvailable(res.data || []);

          if (exhibit && exhibit.artifacts && exhibit.artifacts.length > 0) {
            const init: Artifact[] = [];
            for (const a of exhibit.artifacts as any[]) {
              if (typeof a === "string") {
                const found = (res.data || []).find(
                  (x: Artifact) => x._id === a || x.artifact_id === a,
                );
                if (found) init.push(found);
                // if not found in the list, skip (we don't call getById by artifact_id here)
              } else if (typeof a === "object") {
                init.push(a as Artifact);
              }
            }
            setSelectedArtifacts(init);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    // no-op: show all artifacts in the add/edit UI
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addArtifact = (artifact: Artifact) => {
    if (
      selectedArtifacts.find(
        (s) => s._id === artifact._id || s.artifact_id === artifact.artifact_id,
      )
    )
      return;
    setSelectedArtifacts((p) => [...p, artifact]);
  };

  const removeArtifact = (id: string) => {
    setSelectedArtifacts((p) => p.filter((s) => s._id !== id));
  };

  const move = (index: number, direction: -1 | 1) => {
    setSelectedArtifacts((prev) => {
      const next = [...prev];
      const to = index + direction;
      if (to < 0 || to >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  // drag and drop for selected artifacts
  const dragIndex = useRef<number | null>(null);
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === undefined) return;
    setSelectedArtifacts((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    dragIndex.current = null;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Please provide a name for the exhibit");
    const ids = selectedArtifacts
      .map((s) => s.artifact_id || s._id)
      .filter(Boolean) as string[];
    onSubmit({
      name,
      description,
      estimated_visit_minutes: estimated,
      artifacts: ids,
      order: ids,
      imageUrl: imageUrl || undefined,
    });
  };

  const filteredAvailable = available
    .filter((a) => !selectedArtifacts.find((s) => s._id === a._id))
    .filter((a) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const title = (a.title_en || a.title_si || "").toLowerCase();
      return (
        title.includes(q) ||
        (a.origin_en || "").toLowerCase().includes(q) ||
        (a.category_en || "").toLowerCase().includes(q)
      );
    });

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Estimated visit time (minutes)
          </label>
          <input
            type="number"
            value={estimated}
            onChange={(e) => setEstimated(Number(e.target.value))}
            className="mt-1 block w-40 border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            rows={3}
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selected artifacts
            </label>
            <div className="mb-3">
              <label className="block text-sm font-medium">
                Exhibit image URL (optional)
              </label>
              <input
                value={imageUrl || ""}
                onChange={(e) => setImageUrl(e.target.value || undefined)}
                placeholder="https://example.com/exhibit.jpg"
                className="mt-1 block w-full border rounded p-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                If left empty, the first artifact image will be used as the
                exhibit image.
              </p>
            </div>
            <div className="border rounded p-2 bg-white">
              {selectedArtifacts.length === 0 && (
                <div className="text-sm text-gray-500">
                  No artifacts selected yet.
                </div>
              )}
              <ul>
                {selectedArtifacts.map((s, i) => (
                  <li
                    key={s._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, i)}
                    className="flex items-center gap-3 py-2 border-b last:border-b-0 cursor-grab"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                      {i + 1}
                    </span>
                    {s.imageUrls && s.imageUrls[0] ? (
                      <img
                        src={s.imageUrls[0]}
                        alt={s.title_en || s.title_si}
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-gray-100 rounded" />
                    )}
                    <div className="flex-1 text-sm">
                      {s.title_en || s.title_si || "Untitled"}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        className="px-2 py-1 bg-gray-200 rounded"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        className="px-2 py-1 bg-gray-200 rounded"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeArtifact(s._id!)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Search & add artifacts
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, origin or category"
              className="w-full border rounded p-2 mb-2"
            />
            <div className="max-h-48 overflow-auto border rounded p-2 bg-gray-50">
              {filteredAvailable.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    {a.imageUrls && a.imageUrls[0] ? (
                      <img
                        src={a.imageUrls[0]}
                        alt={a.title_en || a.title_si}
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-gray-100 rounded" />
                    )}
                    <div className="text-sm">
                      {a.title_en || a.title_si || "Untitled"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addArtifact(a)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default FeaturedExhibitForm;
