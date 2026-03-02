import React from "react";
import Modal from "./Modal";
import QrCode from "./QrCode";
import { UserSession } from "../types/UserSession";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session?: UserSession;
  onRequestExtend?: (id: string) => void;
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
  onRequestExtend,
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
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100/40 p-4">
          <div className="text-xs text-gray-500">Session ID</div>
          <div className="font-semibold text-gray-900 break-all text-sm sm:text-base">
            {s.session_id}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Language</div>
                <div className="font-medium">
                  {String(s.language || "").toUpperCase()}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Price</div>
                <div className="font-medium">₨{s.price ?? 0}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Start</div>
                <div className="font-medium">{fmtDate(s.start_time)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">End</div>
                <div className="font-medium">{fmtDate(s.end_time)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Duration</div>
                <div className="font-medium">{s.duration_hours}h</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 bg-white">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {s.is_active ? "Live" : "Ended"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Extended</div>
              <div className="font-medium text-gray-800">
                {alreadyExtended
                  ? `${s.extended_time_hours ?? 0}h (until ${fmtDate(s.extended_until ?? undefined)})`
                  : "Not extended"}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="text-xs text-gray-500 mb-2">Feedbacks</div>
              {s.feedbacks && s.feedbacks.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {s.feedbacks.map((f, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-600">No feedbacks</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="text-xs text-gray-500 mb-2">QR Code</div>
              <div className="flex justify-center">
                <QrCode text={s.session_id} size={140} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="text-xs text-gray-500 mb-2">Star Rating</div>
              {renderStars(s.star_rating)}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1 sticky bottom-0 bg-white/90 backdrop-blur-sm pb-1">
          <button
            onClick={() => onRequestExtend?.(s.session_id || s._id || "")}
            disabled={alreadyExtended || !(s.session_id || s._id)}
            className={`px-4 py-2 rounded-lg text-white transition ${alreadyExtended ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {alreadyExtended ? "Already extended" : "Extend Session"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionDetailsModal;
