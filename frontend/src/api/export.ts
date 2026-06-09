import * as XLSX from 'xlsx';

export function exportToXlsx(
  rows: Record<string, unknown>[],
  tableName: string,
): void {
  if (rows.length === 0) return;

  // Convert rows → worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns (approximate)
  const cols = Object.keys(rows[0]);
  ws['!cols'] = cols.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.slice(0, 200).map((r) => String(r[key] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tableName.slice(0, 31));

  const filename = `${tableName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
