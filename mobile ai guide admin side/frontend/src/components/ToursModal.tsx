import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { NewTour, Tour } from "../types/Tour";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialTour?: Tour | null;
  submitting?: boolean;
  onSubmit: (payload: NewTour) => Promise<void>;
};

const ToursModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  initialTour,
  submitting = false,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [floor, setFloor] = useState("");
  const [section, setSection] = useState("");
  const [guidance, setGuidance] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialTour) {
      setName(initialTour.name || "");
      setDurationMinutes(initialTour.duration_minutes || "");
      setFloor(initialTour.floor || "");
      setSection(initialTour.section || "");
      setGuidance(initialTour.guidance || "");
      setIsActive(initialTour.is_active ?? true);
      setError(null);
      return;
    }

    setName("");
    setDurationMinutes("");
    setFloor("");
    setSection("");
    setGuidance("");
    setIsActive(true);
    setError(null);
  }, [isOpen, mode, initialTour]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalizedName = name.trim();
    const duration = Number(durationMinutes);

    if (!normalizedName) {
      setError("Tour name is required");
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Duration must be greater than 0");
      return;
    }

    await onSubmit({
      name: normalizedName,
      duration_minutes: duration,
      floor: floor.trim() || undefined,
      section: section.trim() || undefined,
      guidance: guidance.trim() || undefined,
      is_active: isActive,
      points: initialTour?.points || [],
    });
  };

  return (
    <Modal
      title={mode === "create" ? "Create Tour Plan" : "Edit Tour Plan"}
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Tour Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Ancient Kingdom Highlights"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="45"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Floor</label>
            <input
              value={floor}
              onChange={(event) => setFloor(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="1st Floor"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Section</label>
            <input
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="South Wing"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Guidance</label>
          <textarea
            value={guidance}
            onChange={(event) => setGuidance(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Follow the highlighted route and read each artifact intro."
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="rounded"
          />
          Tour is active
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create Tour"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ToursModal;
