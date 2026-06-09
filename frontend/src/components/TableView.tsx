import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { fetchAllRows, fetchRows, searchRows } from '@/api/client';
import { exportToXlsx } from '@/api/export';
import { ApiConfig, PagedResponse, TableMeta } from '@/types';

interface TableViewProps {
  config: ApiConfig;
  table: TableMeta;
}

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 350;

export default function TableView({ config, table }: TableViewProps) {
  const [data, setData] = useState<PagedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (term: string, pg: number) => {
      setLoading(true);
      setError('');
      try {
        const params = { page: pg, page_size: PAGE_SIZE, ...(term ? { q: term } : {}) };
        const result = term
          ? await searchRows(config, table.name, params)
          : await fetchRows(config, table.name, params);
        setData(result);
      } catch (e: unknown) {
        setError(
          (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            'Failed to load data.',
        );
      } finally {
        setLoading(false);
      }
    },
    [config, table.name],
  );

  // Reset and reload when table changes
  useEffect(() => {
    setSearchTerm('');
    setPage(1);
    setData(null);
    load('', 1);
  }, [table.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(searchTerm, 1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePageChange(pg: number) {
    setPage(pg);
    load(searchTerm, pg);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await fetchAllRows(config, table.name, searchTerm || undefined);
      exportToXlsx(rows, table.name);
    } catch {
      setError('Export failed.');
    } finally {
      setExporting(false);
    }
  }

  const columns = data?.items[0] ? Object.keys(data.items[0]) : table.columns;
  const hasSearch = table.searchable_columns.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            {table.name}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-0.5">
            {data ? (
              <>
                {data.total.toLocaleString()} rows
                {data.total !== table.row_count && searchTerm
                  ? ` matching "${searchTerm}"`
                  : ''}
              </>
            ) : (
              `${table.row_count.toLocaleString()} rows`
            )}
          </p>
        </div>

        {/* Search */}
        {hasSearch && (
          <div className="relative w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${table.searchable_columns.join(', ')}…`}
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg
                         border border-gray-200 dark:border-gray-700
                         bg-gray-50 dark:bg-gray-800
                         text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-gray-600
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                         transition-shadow"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting || loading || !data?.items.length}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
                     border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-400
                     hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {exporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Export .xlsx
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40
                        border border-red-200 dark:border-red-800
                        text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && !data ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400 dark:text-gray-600">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-600">
            No results{searchTerm ? ` for "${searchTerm}"` : ''}.
          </div>
        ) : (
          <div className="relative rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            {loading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 z-10 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
            )}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400
                                 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-gray-800
                                 font-mono"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 dark:border-gray-800/60
                               hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
                  >
                    {columns.map((col) => {
                      const val = (row as Record<string, unknown>)[col];
                      return (
                        <td
                          key={col}
                          className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-xs"
                        >
                          <span className="block truncate">
                            {val === null || val === undefined ? (
                              <span className="text-gray-300 dark:text-gray-700 font-mono text-xs">null</span>
                            ) : typeof val === 'boolean' ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium
                                            ${val
                                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                              >
                                {val ? 'true' : 'false'}
                              </span>
                            ) : typeof val === 'number' ? (
                              <span className="font-mono text-brand-600 dark:text-brand-400">
                                {val.toLocaleString()}
                              </span>
                            ) : String(val).match(/^\d{4}-\d{2}-\d{2}/) ? (
                              <span className="text-gray-500 dark:text-gray-500 font-mono text-xs">
                                {String(val).slice(0, 19).replace('T', ' ')}
                              </span>
                            ) : (
                              String(val)
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3
                        border-t border-gray-100 dark:border-gray-800 shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-600">
            Page {data.page} of {data.pages} &mdash; {data.total.toLocaleString()} rows
          </span>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => handlePageChange(1)} disabled={page === 1} label="First">
              <ChevronsLeft size={14} />
            </PagBtn>
            <PagBtn onClick={() => handlePageChange(page - 1)} disabled={page === 1} label="Prev">
              <ChevronLeft size={14} />
            </PagBtn>
            <span className="px-3 py-1 text-xs font-mono text-gray-600 dark:text-gray-400">
              {page}
            </span>
            <PagBtn
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.pages}
              label="Next"
            >
              <ChevronRight size={14} />
            </PagBtn>
            <PagBtn
              onClick={() => handlePageChange(data.pages)}
              disabled={page >= data.pages}
              label="Last"
            >
              <ChevronsRight size={14} />
            </PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="p-1.5 rounded text-gray-400 dark:text-gray-600
                 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300
                 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
