import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "./Modal";
import { createSession } from "../services/sessionService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

const CreateSessionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const qc = useQueryClient();
  const createMut = useMutation({
    mutationFn: (payload: {
      duration_hours: number;
      language?: string;
      price?: number;
    }) => createSession(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const [duration, setDuration] = useState<number>(2);
  const [language, setLanguage] = useState<string>("en");
  const [price, setPrice] = useState<number>(300);
  // creation result reported to parent via `onCreated`

  return (
    <Modal title="Create Session" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-sm text-amber-800">
          Create a new visitor session with duration, language, and price.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={createMut.status === "pending"}
            onClick={async () => {
              try {
                const res: any = await createMut.mutateAsync({
                  duration_hours: duration,
                  language,
                  price,
                });
                const id = res?.session_id || res?._id || null;
                setDuration(1);
                setLanguage("en");
                setPrice(0);
                if (id && onCreated) onCreated(id);
                onClose();
              } catch (e: any) {
                alert(e?.message || "Create failed");
              }
            }}
            className="px-4 py-2 rounded-lg bg-[#071428] text-white hover:bg-[#0B1E3B] disabled:opacity-60"
          >
            {createMut.status === "pending" ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateSessionModal;
