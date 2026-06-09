import axios, { AxiosInstance } from 'axios';
import { ApiConfig, PagedResponse, TableMeta } from '@/types';

const CONFIG_KEY = 'data_api_config';

// ── Persistence ───────────────────────────────────────────────────────────────

export function saveConfig(cfg: ApiConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function loadConfig(): ApiConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiConfig;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

// ── Client factory ────────────────────────────────────────────────────────────

function makeClient(cfg: ApiConfig): AxiosInstance {
  return axios.create({
    baseURL: cfg.endpoint.replace(/\/$/, ''),
    headers: { 'X-API-Key': cfg.apiKey },
    timeout: 15_000,
  });
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function validateConnection(cfg: ApiConfig): Promise<void> {
  const client = makeClient(cfg);
  // /health has no auth requirement – just proves endpoint is reachable
  await client.get('/health');
  // /api/tables proves the key is valid
  await client.get('/api/tables');
}

export async function fetchTables(cfg: ApiConfig): Promise<TableMeta[]> {
  const client = makeClient(cfg);
  const { data } = await client.get<TableMeta[]>('/api/tables');
  return data;
}

export async function fetchRows(
  cfg: ApiConfig,
  table: string,
  params: Record<string, string | number>,
): Promise<PagedResponse> {
  const client = makeClient(cfg);
  const { data } = await client.get<PagedResponse>(`/api/${table}`, { params });
  return data;
}

export async function searchRows(
  cfg: ApiConfig,
  table: string,
  params: Record<string, string | number>,
): Promise<PagedResponse> {
  const client = makeClient(cfg);
  const { data } = await client.get<PagedResponse>(`/api/${table}/search`, { params });
  return data;
}

export async function fetchAllRows(
  cfg: ApiConfig,
  table: string,
  searchTerm?: string,
): Promise<Record<string, unknown>[]> {
  // Fetch up to 10 000 rows for export
  const MAX = 1000;
  const params: Record<string, string | number> = { page: 1, page_size: MAX };
  if (searchTerm) params.q = searchTerm;

  const fn = searchTerm ? searchRows : fetchRows;
  const first = await fn(cfg, table, params);
  const items = [...first.items];

  if (first.pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: first.pages - 1 }, (_, i) =>
        fn(cfg, table, { ...params, page: i + 2 }),
      ),
    );
    rest.forEach((r) => items.push(...r.items));
  }

  return items;
}
