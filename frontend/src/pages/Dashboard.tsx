import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Moon, RefreshCw, Sun } from 'lucide-react';
import { fetchTables } from '@/api/client';
import Sidebar from '@/components/Sidebar';
import TableView from '@/components/TableView';
import { useTheme } from '@/hooks/useTheme';
import { ApiConfig, TableMeta } from '@/types';

interface DashboardProps {
  config: ApiConfig;
  onLogout: () => void;
}

export default function Dashboard({ config, onLogout }: DashboardProps) {
  const { theme, toggle } = useTheme();
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTables() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTables(config);
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch {
      setError('Failed to load tables. The API may be unavailable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTable = tables.find((t) => t.name === selectedTable) ?? null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        onLogout={onLogout}
        endpoint={config.endpoint}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-2 px-5 py-3
                        border-b border-gray-100 dark:border-gray-800 shrink-0">
          <button
            onClick={loadTables}
            disabled={loading}
            aria-label="Refresh tables"
            title="Refresh"
            className="p-2 rounded-lg text-gray-400 dark:text-gray-600
                       hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300
                       disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-gray-400 dark:text-gray-600
                       hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300
                       transition-colors"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {loading && tables.length === 0 ? (
            <div className="flex items-center justify-center h-full gap-2 text-gray-400 dark:text-gray-600">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading tables…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400 max-w-sm">{error}</p>
              <button
                onClick={loadTables}
                className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-600">
              No tables found. Check your registry.
            </div>
          ) : currentTable ? (
            <TableView config={config} table={currentTable} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-600">
              Select a table from the sidebar.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
