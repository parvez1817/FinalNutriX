import type { ParsedDataset } from "./dataset";

export type ChartSpec = {
  id: string;
  title: string;
  description?: string;
  type: "bar" | "line" | "area" | "pie";
  xKey: string;
  yKeys: string[];
  size?: "sm" | "md" | "lg";
};

export type DashboardSpec = {
  title: string;
  summary: string;
  insights: string[];
  charts: ChartSpec[];
  kpis: { label: string; value: string; hint?: string }[];
};

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_API_BASE 
  ? `${import.meta.env.VITE_OLLAMA_API_BASE}/v1/chat/completions` 
  : "http://localhost:11434/v1/chat/completions";

function buildPrompt(dataset: ParsedDataset, userPrompt: string) {
  const sample = dataset.rows.slice(0, 10);
  return `You are a senior data analyst. Given this dataset, design a beautiful analytics dashboard.

User request: "${userPrompt || "Generate the most insightful default dashboard for this data."}"

Columns: ${dataset.columns.join(", ")}
Numeric columns: ${dataset.numericColumns.join(", ") || "(none)"}
Categorical columns: ${dataset.categoricalColumns.join(", ") || "(none)"}
Row count: ${dataset.rows.length}
Sample rows (JSON): ${JSON.stringify(sample)}

Respond ONLY with valid minified JSON matching this TypeScript type:
{
  "title": string,
  "summary": string,
  "insights": string[],          // 3-5 short insights derived from the data
  "kpis": { "label": string, "value": string, "hint"?: string }[], // 3-4 KPIs
  "charts": {                    // 3-5 charts
    "id": string,
    "title": string,
    "description"?: string,
    "type": "bar" | "line" | "area" | "pie",
    "xKey": string,              // must be one of the dataset columns
    "yKeys": string[],           // must be numeric columns
    "size"?: "sm" | "md" | "lg"
  }[]
}

Rules:
- xKey/yKeys MUST be valid column names from the dataset.
- Pie charts use a single yKey (numeric) and a categorical xKey.
- Prefer 'bar' for categorical breakdowns, 'line'/'area' for trends.
- Keep titles short and human.
- No markdown. No code fences. No commentary. JSON only.`;
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export async function generateDashboardSpec(
  dataset: ParsedDataset,
  userPrompt: string,
  apiKey: string,
): Promise<DashboardSpec> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama3.1:latest",
      messages: [{ role: "user", content: buildPrompt(dataset, userPrompt) }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama error ${res.status}: ${t.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  const cleaned = extractJson(text);
  let spec: DashboardSpec;
  try {
    spec = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Gemini returned invalid JSON");
  }

  // Validate references against dataset columns
  spec.charts = (spec.charts || []).filter((c) => {
    if (!dataset.columns.includes(c.xKey)) return false;
    c.yKeys = (c.yKeys || []).filter((k) => dataset.columns.includes(k));
    return c.yKeys.length > 0;
  });

  return spec;
}
