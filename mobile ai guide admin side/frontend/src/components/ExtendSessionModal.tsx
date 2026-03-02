import React, { useState } from "react";
import Modal from "./Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  alreadyExtended?: boolean;
  onExtend: (id: string, hours: number) => Promise<any>;
  extending?: boolean;
}

const ExtendSessionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sessionId,
  alreadyExtended,
  onExtend,
  extending,
}) => {
  const [hours, setHours] = useState<number>(1);

  return (
    <Modal
      title="Extend Session"
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-600">Session:</div>
        <div className="font-medium">{sessionId ?? "-"}</div>

        <label className="block">Add hours</label>
        <input
          type="number"
          min={1}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
          disabled={alreadyExtended}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2">
            Cancel
          </button>
          <button
            disabled={extending || alreadyExtended || !sessionId}
            onClick={async () => {
              if (!sessionId) return;
              try {
                await onExtend(sessionId, hours);
                setHours(1);
              } catch (e: any) {
                alert(e?.message || "Extend failed");
              }
            }}
            className={`px-4 py-2 ${alreadyExtended ? "bg-gray-400 text-white" : "bg-yellow-500 text-white"} rounded`}
          >
            {extending
              ? "Extending..."
              : alreadyExtended
                ? "Already extended"
                : "Extend"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExtendSessionModal;
