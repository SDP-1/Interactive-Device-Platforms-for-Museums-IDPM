import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listSessions, extendSession } from "../services/sessionService";
import CreateSessionModal from "../components/CreateSessionModal";
import SessionDetailsModal from "../components/SessionDetailsModal";
import ExtendSessionModal from "../components/ExtendSessionModal";
import QrModal from "../components/QrModal";
import { UserSession } from "../types/UserSession";

function fmtDate(v?: string | Date | number) {
  if (!v) return "-";
  const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

const SessionsPage: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
    refetchInterval: 30_000,
  });
  const sessions: UserSession[] = Array.isArray(data)
    ? (data as UserSession[])
    : [];

  const extendMut = useMutation<
    UserSession,
    Error,
    { id: string; hours: number }
  >({
    mutationFn: ({ id, hours }) => extendSession(id, hours),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState<{
    open: boolean;
    id?: string;
  }>({ open: false });

  // create form handled by CreateSessionModal
  const [extendOpen, setExtendOpen] = useState<{ open: boolean; id?: string }>({
    open: false,
  });
  const [qrOpen, setQrOpen] = useState<{ open: boolean; id?: string }>({
    open: false,
  });

  const totals = useMemo(
    () => ({
      total: sessions.length,
      active: sessions.filter((s) => s.is_active).length,
    }),
    [sessions],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Sessions</h2>
          <p className="text-sm text-gray-500">
            Manage sessions (total: {totals.total}, live: {totals.active})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      </div>

      {isLoading && <div className="text-gray-600">Loading sessions...</div>}
      {error && <div className="text-red-600">Failed to load sessions</div>}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">No</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2 text-left">Duration</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={s.session_id || s._id} className="border-t">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">₨{s.price ?? 0}</td>
                <td className="px-4 py-3">{fmtDate(s.start_time)}</td>
                <td className="px-4 py-3">{fmtDate(s.end_time)}</td>
                <td className="px-4 py-3">{s.duration_hours}h</td>
                <td
                  className={`px-4 py-3 ${s.is_active ? "text-green-600" : "text-gray-600"}`}
                >
                  {s.is_active ? "Live" : "Ended"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setDetailsOpen({ open: true, id: s.session_id })
                      }
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Details
                    </button>
                    <button
                      onClick={() =>
                        setExtendOpen({ open: true, id: s.session_id })
                      }
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Extend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                  No sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <CreateSessionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id?: string) => {
          if (id) setQrOpen({ open: true, id });
        }}
      />

      {/* Details modal extracted into separate component */}
      <SessionDetailsModal
        isOpen={detailsOpen.open}
        onClose={() => setDetailsOpen({ open: false })}
        session={sessions.find(
          (x) => x.session_id === detailsOpen.id || x._id === detailsOpen.id,
        )}
      />

      <ExtendSessionModal
        isOpen={extendOpen.open}
        onClose={() => setExtendOpen({ open: false })}
        sessionId={extendOpen.id}
        alreadyExtended={Boolean(
          sessions.find(
            (x) => x.session_id === extendOpen.id || x._id === extendOpen.id,
          )?.extended_time_hours ||
          sessions.find(
            (x) => x.session_id === extendOpen.id || x._id === extendOpen.id,
          )?.extended_until,
        )}
        onExtend={async (id: string, hours: number) => {
          await extendMut.mutateAsync({ id, hours });
          setExtendOpen({ open: false });
        }}
        extending={extendMut.status === "pending"}
      />
      <QrModal
        isOpen={qrOpen.open}
        onClose={() => setQrOpen({ open: false })}
        text={qrOpen.id}
      />
    </div>
  );
};

export default SessionsPage;
