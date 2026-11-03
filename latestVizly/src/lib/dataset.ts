export type CsvRow = Record<string, string | number | null>;

export type ParsedDataset = {
  rows: CsvRow[];
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
};

export type DashboardPayload = {
  csvText: string;
  fileName: string;
  prompt: string;
  theme?: string | null;
};

const STORAGE_KEY = "vizly:dashboard-payload";

export function saveDashboardPayload(payload: DashboardPayload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

export function loadDashboardPayload(): DashboardPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DashboardPayload) : null;
  } catch {
    return null;
  }
}

export function analyzeDataset(rows: CsvRow[]): ParsedDataset {
  if (!rows.length) {
    return { rows: [], columns: [], numericColumns: [], categoricalColumns: [] };
  }
  const columns = Object.keys(rows[0]);
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  for (const col of columns) {
    let numericCount = 0;
    let total = 0;
    for (const row of rows) {
      const v = row[col];
      if (v === null || v === undefined || v === "") continue;
      total++;
      if (typeof v === "number" && !isNaN(v)) numericCount++;
      else if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) numericCount++;
    }
    if (total > 0 && numericCount / total >= 0.7) numericColumns.push(col);
    else categoricalColumns.push(col);
  }

  return { rows, columns, numericColumns, categoricalColumns };
}

export function coerceNumeric(rows: CsvRow[], numericCols: string[]): CsvRow[] {
  return rows.map((row) => {
    const next = { ...row };
    for (const col of numericCols) {
      const v = next[col];
      if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) {
        next[col] = Number(v);
      }
    }
    return next;
  });
}
