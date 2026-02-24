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
      <div className="space-y-3">
        <label className="block">Duration (hours)</label>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
        />

        <label className="block">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border rounded px-2 py-1"
        >
          <option value="en">English</option>
          <option value="si">Sinhala</option>
        </select>

        <label className="block">Price</label>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2">
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
                // report to parent then close modal so parent can open QR popup
                if (id && onCreated) onCreated(id);
                onClose();
              } catch (e: any) {
                alert(e?.message || "Create failed");
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {createMut.status === "pending" ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateSessionModal;
