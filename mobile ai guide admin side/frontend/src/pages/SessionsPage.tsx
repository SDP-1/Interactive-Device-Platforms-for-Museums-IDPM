import React, { useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listSessions,
  extendSession,
  SessionListQuery,
} from "../services/sessionService";
import CreateSessionModal from "../components/CreateSessionModal";
import SessionDetailsModal from "../components/SessionDetailsModal";
import ExtendSessionModal from "../components/ExtendSessionModal";
import QrModal from "../components/QrModal";
import DataTable, {
  DataTableColumn,
  DataTableQueryState,
} from "../components/DataTable";
import { UserSession } from "../types/UserSession";

function fmtDate(v?: string | Date | number) {
  if (!v) return "-";
  const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

const SessionsPage: React.FC = () => {
  const qc = useQueryClient();

  const [tableQuery, setTableQuery] = useState<DataTableQueryState>({
    page: 1,
    limit: 10,
    sort: "createdAt",
    order: "desc",
    search: "",
  });

  const queryParams: SessionListQuery = {
    page: tableQuery.page,
    limit: tableQuery.limit,
    sort: tableQuery.sort,
    order: tableQuery.order,
    search: tableQuery.search,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions", queryParams],
    queryFn: () => listSessions(queryParams),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
  const sessions: UserSession[] = data?.items || [];
  const pagination = data?.pagination || {
    page: tableQuery.page,
    limit: tableQuery.limit,
    total: sessions.length,
    totalPages: 1,
  };

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

  const sessionColumns: DataTableColumn<UserSession>[] = [
    {
      key: "no",
      header: "No",
      render: (_row, index) =>
        (tableQuery.page - 1) * tableQuery.limit + index + 1,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      sortKey: "price",
      exportAccessor: (row) => row.price ?? 0,
      searchAccessor: (row) => String(row.price ?? 0),
      render: (row) => `₨${row.price ?? 0}`,
    },
    {
      key: "start",
      header: "Start",
      sortable: true,
      sortKey: "start_time",
      exportAccessor: (row) => fmtDate(row.start_time),
      searchAccessor: (row) => fmtDate(row.start_time),
      render: (row) => fmtDate(row.start_time),
    },
    {
      key: "end",
      header: "End",
      sortable: true,
      sortKey: "end_time",
      exportAccessor: (row) => fmtDate(row.end_time),
      searchAccessor: (row) => fmtDate(row.end_time),
      render: (row) => fmtDate(row.end_time),
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      sortKey: "duration_hours",
      exportAccessor: (row) => row.duration_hours,
      searchAccessor: (row) => String(row.duration_hours),
      render: (row) => `${row.duration_hours}h`,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortKey: "is_active",
      exportAccessor: (row) => (row.is_active ? "Live" : "Ended"),
      searchAccessor: (row) => (row.is_active ? "Live" : "Ended"),
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${row.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
        >
          {row.is_active ? "Live" : "Ended"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      hideable: false,
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setDetailsOpen({ open: true, id: row.session_id })}
            className="px-3 py-1.5 border-2 border-amber-400 text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition"
          >
            Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Sessions</h2>
          <p className="text-sm text-gray-500">
            Manage sessions (total: {totals.total}, live: {totals.active})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
          >
            Create
          </button>
        </div>
      </div>

      {isLoading && <div className="text-gray-600">Loading sessions...</div>}
      {error && <div className="text-red-600">Failed to load sessions</div>}

      <DataTable
        data={sessions}
        columns={sessionColumns}
        rowKey={(row) => row.session_id || row._id || "unknown-session"}
        emptyMessage="No sessions found"
        loading={isLoading}
        enableSearch={false}
        enableSorting
        enablePagination
        enableColumnManagement
        enableExport
        pageSizeOptions={[10, 25, 50]}
        serverSide={{
          enabled: true,
          query: tableQuery,
          onQueryChange: setTableQuery,
          totalRows: pagination.total,
        }}
      />

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
        onRequestExtend={(id) => {
          if (!id) return;
          setExtendOpen({ open: true, id });
        }}
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
