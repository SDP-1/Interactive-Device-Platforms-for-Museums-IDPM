import React from "react";

export type SortOrder = "asc" | "desc";

export type DataTableQueryState = {
  page: number;
  limit: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
};

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T, rowIndex: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  sortKey?: string;
  sortAccessor?: (row: T) => string | number;
  hideable?: boolean;
  exportAccessor?: (row: T) => string | number;
  searchAccessor?: (row: T) => string;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T, rowIndex: number) => string;
  emptyMessage?: string;
  emptyColSpan?: number;
  loading?: boolean;
  filters?: React.ReactNode;

  enableSorting?: boolean;
  enablePagination?: boolean;
  pageSizeOptions?: number[];
  enableSearch?: boolean;
  enableRowSelection?: boolean;
  enableColumnManagement?: boolean;
  enableExport?: boolean;

  serverSide?: {
    enabled: boolean;
    query: DataTableQueryState;
    onQueryChange: (next: DataTableQueryState) => void;
    totalRows: number;
  };
};

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const DataTable = <T,>({
  data,
  columns,
  rowKey,
  emptyMessage = "No data found",
  emptyColSpan,
  loading,
  filters,
  enableSorting = true,
  enablePagination = true,
  pageSizeOptions = [10, 25, 50],
  enableSearch = true,
  enableRowSelection = false,
  enableColumnManagement = false,
  enableExport = false,
  serverSide,
}: DataTableProps<T>) => {
  const isServer = !!serverSide?.enabled;

  const [localQuery, setLocalQuery] = React.useState<DataTableQueryState>({
    page: 1,
    limit: pageSizeOptions[0] || 10,
    sort: undefined,
    order: "asc",
    search: "",
  });

  const query = isServer ? serverSide.query : localQuery;
  const setQuery = (next: DataTableQueryState) => {
    if (isServer && serverSide) {
      serverSide.onQueryChange(next);
    } else {
      setLocalQuery(next);
    }
  };

  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(
    new Set(),
  );
  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((c) => {
      initial[c.key] = true;
    });
    return initial;
  });

  React.useEffect(() => {
    setSelectedRows(new Set());
  }, [data]);

  const activeColumns = React.useMemo(
    () => columns.filter((c) => visibleColumns[c.key] !== false),
    [columns, visibleColumns],
  );

  const processedData = React.useMemo(() => {
    if (isServer) return data;

    let items = [...data];

    if (enableSearch && query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter((row) =>
        columns.some((c) => {
          if (!activeColumns.find((ac) => ac.key === c.key)) return false;
          const text = c.searchAccessor
            ? c.searchAccessor(row)
            : c.exportAccessor
              ? String(c.exportAccessor(row))
              : "";
          return text.toLowerCase().includes(q);
        }),
      );
    }

    if (enableSorting && query.sort) {
      const sortColumn = columns.find((c) => c.key === query.sort);
      if (sortColumn?.sortAccessor) {
        items.sort((a, b) => {
          const av = sortColumn.sortAccessor!(a);
          const bv = sortColumn.sortAccessor!(b);
          if (av === bv) return 0;
          const result = String(av).localeCompare(String(bv), undefined, {
            numeric: true,
            sensitivity: "base",
          });
          return query.order === "desc" ? -result : result;
        });
      }
    }

    if (enablePagination) {
      const start = (query.page - 1) * query.limit;
      const end = start + query.limit;
      return items.slice(start, end);
    }

    return items;
  }, [
    isServer,
    data,
    enableSearch,
    query.search,
    columns,
    activeColumns,
    enableSorting,
    query.sort,
    query.order,
    enablePagination,
    query.page,
    query.limit,
  ]);

  const totalRows = isServer
    ? serverSide?.totalRows || 0
    : (() => {
        if (!enableSearch || !query.search?.trim()) return data.length;
        const q = query.search.trim().toLowerCase();
        return data.filter((row) =>
          columns.some((c) => {
            if (!activeColumns.find((ac) => ac.key === c.key)) return false;
            const text = c.searchAccessor
              ? c.searchAccessor(row)
              : c.exportAccessor
                ? String(c.exportAccessor(row))
                : "";
            return text.toLowerCase().includes(q);
          }),
        ).length;
      })();

  const totalPages = Math.max(1, Math.ceil(totalRows / query.limit));
  const safePage = Math.min(query.page, totalPages);

  React.useEffect(() => {
    if (safePage !== query.page) {
      setQuery({ ...query, page: safePage });
    }
  }, [safePage, query, setQuery]);

  const allVisibleSelected =
    processedData.length > 0 &&
    processedData.every((row, idx) => selectedRows.has(rowKey(row, idx)));

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!enableSorting || !column.sortable) return;
    const nextSort = column.sortKey || column.key;
    const same = query.sort === nextSort;
    const nextOrder: SortOrder = same && query.order === "asc" ? "desc" : "asc";
    setQuery({ ...query, sort: nextSort, order: nextOrder, page: 1 });
  };

  const exportRows = React.useMemo(() => {
    if (!enableRowSelection || selectedRows.size === 0) return processedData;
    return processedData.filter((row, idx) =>
      selectedRows.has(rowKey(row, idx)),
    );
  }, [enableRowSelection, selectedRows, processedData, rowKey]);

  const handleExportCsv = () => {
    const headers = activeColumns.map((c) =>
      typeof c.header === "string" ? c.header : c.key,
    );
    const rows = exportRows.map((row) =>
      activeColumns.map((c) => {
        const value = c.exportAccessor ? c.exportAccessor(row) : "";
        const escaped = String(value ?? "").replace(/"/g, '""');
        return `"${escaped}"`;
      }),
    );

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv("datatable-export.csv", csv);
  };

  const colSpan =
    (emptyColSpan || activeColumns.length) + (enableRowSelection ? 1 : 0);

  const pageItems = React.useMemo(() => {
    const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) items.push(i);
      return items;
    }

    items.push(1);
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    if (start > 2) items.push("ellipsis-left");
    for (let i = start; i <= end; i += 1) items.push(i);
    if (end < totalPages - 1) items.push("ellipsis-right");

    items.push(totalPages);
    return items;
  }, [safePage, totalPages]);

  return (
    <div className="space-y-3">
      {(enableSearch || enableColumnManagement || enableExport || filters) && (
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
            {enableSearch ? (
              <input
                value={query.search || ""}
                onChange={(e) =>
                  setQuery({ ...query, search: e.target.value, page: 1 })
                }
                placeholder="Search..."
                className="w-full lg:max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            ) : (
              <div />
            )}

            <div className="flex flex-wrap gap-2">
              {enableColumnManagement && (
                <div className="relative">
                  <button
                    onClick={() => setColumnPanelOpen((v) => !v)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                  >
                    Columns
                  </button>
                  {columnPanelOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-20">
                      {columns.map((column) => (
                        <label
                          key={column.key}
                          className="flex items-center gap-2 px-2 py-1 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key] !== false}
                            disabled={column.hideable === false}
                            onChange={(e) =>
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [column.key]: e.target.checked,
                              }))
                            }
                          />
                          <span>
                            {typeof column.header === "string"
                              ? column.header
                              : column.key}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {enableExport && (
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {filters}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-amber-50/70">
            <tr>
              {enableRowSelection && (
                <th className="px-4 py-3 text-left text-gray-700 font-semibold w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(
                          new Set(
                            processedData.map((row, idx) => rowKey(row, idx)),
                          ),
                        );
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
              )}

              {activeColumns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.headerClassName ||
                    "px-4 py-3 text-left text-gray-700 font-semibold"
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className={`inline-flex items-center gap-1 ${column.sortable ? "hover:text-gray-900" : "cursor-default"}`}
                  >
                    <span>{column.header}</span>
                    {enableSorting && column.sortable && (
                      <span className="text-xs text-gray-500">
                        {query.sort === (column.sortKey || column.key)
                          ? query.order === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-500"
                  colSpan={colSpan}
                >
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              processedData.map((row, rowIndex) => {
                const key = rowKey(row, rowIndex);
                return (
                  <tr
                    key={key}
                    className="border-t border-gray-100 hover:bg-gray-50/60"
                  >
                    {enableRowSelection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(key)}
                          onChange={(e) => {
                            setSelectedRows((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(key);
                              else next.delete(key);
                              return next;
                            });
                          }}
                        />
                      </td>
                    )}

                    {activeColumns.map((column) => (
                      <td
                        key={`${column.key}-${key}`}
                        className={column.cellClassName || "px-4 py-3"}
                      >
                        {column.render(row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                );
              })}

            {!loading && processedData.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-600"
                  colSpan={colSpan}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Showing page {safePage} of {totalPages} · {totalRows} records
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={query.limit}
              onChange={(e) =>
                setQuery({ ...query, limit: Number(e.target.value), page: 1 })
              }
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                setQuery({ ...query, page: Math.max(1, safePage - 1) })
              }
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
            >
              Prev
            </button>

            {pageItems.map((item) => {
              if (typeof item !== "number") {
                return (
                  <span key={item} className="px-2 text-sm text-gray-500">
                    ...
                  </span>
                );
              }

              const active = item === safePage;
              return (
                <button
                  key={item}
                  onClick={() => setQuery({ ...query, page: item })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition ${active ? "border-[#071428] bg-[#071428] text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  {item}
                </button>
              );
            })}

            <button
              onClick={() =>
                setQuery({ ...query, page: Math.min(totalPages, safePage + 1) })
              }
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
