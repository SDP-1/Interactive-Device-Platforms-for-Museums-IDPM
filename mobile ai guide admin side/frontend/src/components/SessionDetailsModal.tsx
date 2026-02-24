import React, { useState } from "react";
import Modal from "./Modal";
import QrCode from "./QrCode";
import { UserSession } from "../types/UserSession";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session?: UserSession;
}

function fmtDate(v?: string | Date | number) {
  if (!v) return "-";
  const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function renderStars(r?: number) {
  const rating = Math.max(0, Math.min(5, Math.floor(r ?? 0)));
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rating ? "text-yellow-500" : "text-gray-300"}
        >
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

const SessionDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session: s,
}) => {
  if (!s)
    return (
      <Modal title="Session Details" isOpen={isOpen} onClose={onClose}>
        <div>No session selected</div>
      </Modal>
    );

  const alreadyExtended = !!s.extended_time_hours || !!s.extended_until;

  return (
    <Modal title="Session Details" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-600">Session:</div>
          <div className="font-medium">{s.session_id}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600">QR</div>
          <div className="pt-2">
            <QrCode text={s.session_id} size={140} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-sm text-gray-600">Language</div>
            <div className="font-medium">
              {String(s.language || "").toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Price</div>
            <div className="font-medium">₨{s.price ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Start</div>
            <div className="font-medium">{fmtDate(s.start_time)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">End</div>
            <div className="font-medium">{fmtDate(s.end_time)}</div>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Duration</div>
          <div className="font-medium">{s.duration_hours}h</div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Status</div>
          <div
            className={`font-medium ${s.is_active ? "text-green-600" : "text-gray-600"}`}
          >
            {s.is_active ? "Live" : "Ended"}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Extended</div>
          <div className="font-medium">
            {alreadyExtended
              ? `${s.extended_time_hours ?? 0}h (until ${fmtDate(s.extended_until ?? undefined)})`
              : "Not extended"}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Star Rating</div>
          {renderStars(s.star_rating)}
        </div>

        <div>
          <div className="text-sm text-gray-600">Feedbacks</div>
          {s.feedbacks && s.feedbacks.length > 0 ? (
            <ul className="list-disc pl-5">
              {s.feedbacks.map((f, i) => (
                <li key={i} className="text-sm">
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">No feedbacks</div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button onClick={onClose} className="px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionDetailsModal;
