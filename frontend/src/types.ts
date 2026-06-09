// ── API connection config stored in localStorage ──────────────────────────────
export interface ApiConfig {
  endpoint: string;  // e.g. http://localhost:5000
  apiKey: string;
}

// ── Table metadata returned by GET /api/tables ────────────────────────────────
export interface TableMeta {
  name: string;
  db: string;
  row_count: number;
  columns: string[];
  searchable_columns: string[];
}

// ── Paginated response wrapper ────────────────────────────────────────────────
export interface PagedResponse<T = Record<string, unknown>> {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: T[];
}

// ── Theme ─────────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';
