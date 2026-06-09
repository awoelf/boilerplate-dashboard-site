import { Database, LogOut, Table2 } from 'lucide-react';
import { TableMeta } from '@/types';

interface SidebarProps {
  tables: TableMeta[];
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
  onLogout: () => void;
  endpoint: string;
}

export default function Sidebar({
  tables,
  selectedTable,
  onSelectTable,
  onLogout,
  endpoint,
}: SidebarProps) {
  // Group tables by their db key
  const byDb = tables.reduce<Record<string, TableMeta[]>>((acc, t) => {
    (acc[t.db] ??= []).push(t);
    return acc;
  }, {});

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-white dark:bg-gray-900
                      border-r border-gray-100 dark:border-gray-800 h-screen sticky top-0">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-600">
            <Database size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            API Explorer
          </span>
        </div>
        <p
          className="text-[10px] text-gray-400 dark:text-gray-600 font-mono truncate pl-0.5"
          title={endpoint}
        >
          {endpoint.replace(/^https?:\/\//, '')}
        </p>
      </div>

      {/* Table list */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {Object.entries(byDb).map(([db, dbTables]) => (
          <div key={db}>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest
                          text-gray-400 dark:text-gray-600">
              {db}
            </p>
            <ul className="space-y-0.5">
              {dbTables.map((t) => {
                const active = t.name === selectedTable;
                return (
                  <li key={t.name}>
                    <button
                      onClick={() => onSelectTable(t.name)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                                  text-sm transition-colors group text-left
                                  ${
                                    active
                                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                    >
                      <Table2
                        size={14}
                        className={active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500'}
                      />
                      <span className="flex-1 truncate font-medium">{t.name}</span>
                      <span
                        className={`text-[10px] font-mono tabular-nums
                                    ${active ? 'text-brand-500 dark:text-brand-400' : 'text-gray-300 dark:text-gray-700'}`}
                      >
                        {t.row_count.toLocaleString()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                     text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40
                     hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          Disconnect
        </button>
      </div>
    </aside>
  );
}
