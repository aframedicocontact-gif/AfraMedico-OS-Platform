export type ExportCellValue = string | number | boolean | null | undefined;
export type ExportRow = Record<string, ExportCellValue>;

export function exportRowsAsCsv(fileNameBase: string, rows: ExportRow[]) {
  if (typeof window === "undefined" || rows.length === 0) return;

  const headers = getHeaders(rows);
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(formatCsvCell).join(","))
    .join("\n");

  downloadBlob(`${normalizeFileName(fileNameBase)}.csv`, csv, "text/csv;charset=utf-8");
}

export function exportRowsAsExcel(fileNameBase: string, rows: ExportRow[]) {
  if (typeof window === "undefined" || rows.length === 0) return;

  const headers = getHeaders(rows);
  const headerCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyRows = rows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(formatDisplayCell(row[header]))}</td>`).join("")}</tr>`)
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;

  downloadBlob(`${normalizeFileName(fileNameBase)}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}

function getHeaders(rows: ExportRow[]) {
  return Array.from(rows.reduce((headers, row) => {
    Object.keys(row).forEach((header) => headers.add(header));
    return headers;
  }, new Set<string>()));
}

function formatCsvCell(value: ExportCellValue) {
  return `"${formatDisplayCell(value).replace(/"/g, '""')}"`;
}

function formatDisplayCell(value: ExportCellValue) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeFileName(fileNameBase: string) {
  const normalized = fileNameBase
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "export";
}

function downloadBlob(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
