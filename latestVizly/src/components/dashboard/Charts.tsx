import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Sparkles, TrendingUp, AlertCircle, FileWarning } from "lucide-react";
import {
  analyzeDataset,
  coerceNumeric,
  loadDashboardPayload,
  type CsvRow,
  type ParsedDataset,
} from "@/lib/dataset";
import { generateDashboardSpec, type ChartSpec, type DashboardSpec } from "@/lib/gemini";

const PALETTE = ["#adc6ff", "#ddb7ff", "#7dd3fc", "#fca5a5", "#86efac", "#fcd34d", "#f0abfc"];

const LOADING_MESSAGES = [
  "Analyzing your data...",
  "Detecting patterns...",
  "Designing visual layout...",
  "Generating insights...",
  "Building your dashboard...",
];

type Status = "idle" | "loading" | "ready" | "error" | "empty";

export type ChartsHandle = {
  exportAsImage: (format?: "png" | "jpeg") => Promise<void>;
};

type Props = {
  onReady?: (handle: ChartsHandle) => void;
};

export const Charts = ({ onReady }: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<DashboardSpec | null>(null);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Rotating loading messages
  useEffect(() => {
    if (status !== "loading") return;
    const t = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(t);
  }, [status]);

  // Main pipeline
  useEffect(() => {
    let cancelled = false;
    const payload = loadDashboardPayload();
    if (!payload || !payload.csvText) {
      setStatus("empty");
      return;
    }

    const apiKey = (import.meta.env.VITE_OLLAMA_API_KEY as string) || "ollama";

    setStatus("loading");
    const startedAt = Date.now();

    (async () => {
      try {
        const parsed = Papa.parse<CsvRow>(payload.csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        const rows = (parsed.data || []).filter(
          (r) => r && Object.keys(r).length > 0,
        ) as CsvRow[];
        if (!rows.length) throw new Error("CSV has no data rows.");

        const ds = analyzeDataset(rows);
        ds.rows = coerceNumeric(ds.rows, ds.numericColumns);

        const aiSpec = await generateDashboardSpec(ds, payload.prompt || "", apiKey);

        // Ensure minimum 2s loading for premium feel
        const elapsed = Date.now() - startedAt;
        if (elapsed < 2000) await new Promise((r) => setTimeout(r, 2000 - elapsed));

        if (cancelled) return;
        setDataset(ds);
        setSpec(aiSpec);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to generate dashboard");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Expose export handle
  useEffect(() => {
    if (!onReady) return;
    onReady({
      exportAsImage: async (format = "png") => {
        if (!dashboardRef.current) return;
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: "#0a0b14",
          scale: 2,
          useCORS: true,
        });
        const mime = format === "jpeg" ? "image/jpeg" : "image/png";
        const dataUrl = canvas.toDataURL(mime, 0.95);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `dashboard-${Date.now()}.${format}`;
        a.click();
      },
    });
  }, [onReady, status]);

  if (status === "loading" || status === "idle") {
    return <LoadingState message={LOADING_MESSAGES[loadingMsgIdx]} />;
  }

  if (status === "empty") {
    return (
      <EmptyState
        icon={<FileWarning className="h-6 w-6" />}
        title="No dataset uploaded"
        description="Go back to the home page, upload a CSV, and click Generate."
      />
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        icon={<AlertCircle className="h-6 w-6 text-red-400" />}
        title="Couldn't build your dashboard"
        description={error || "Unknown error"}
      />
    );
  }

  if (!spec || !dataset) return null;

  return (
    <div
      ref={dashboardRef}
      className="space-y-6 animate-rise"
      style={{ background: "transparent" }}
    >
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-border">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/40 flex items-center justify-center text-primary shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gradient">{spec.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{spec.summary}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {spec.kpis?.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {spec.kpis.map((k, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 border border-border transition-transform hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {k.label}
              </div>
              <div className="text-3xl font-bold mt-2">{k.value}</div>
              {k.hint && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{k.hint}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {spec.charts.map((chart, i) => (
          <ChartCard
            key={chart.id || i}
            chart={chart}
            data={dataset.rows}
            delay={i * 100}
            full={chart.size === "lg"}
          />
        ))}
      </div>

      {/* Insights */}
      {spec.insights?.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
              AI Insights
            </h3>
          </div>
          <ul className="space-y-3">
            {spec.insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/90">
                <span className="text-primary mt-1">→</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ---------- Sub components ---------- */

function ChartCard({
  chart,
  data,
  delay,
  full,
}: {
  chart: ChartSpec;
  data: CsvRow[];
  delay: number;
  full?: boolean;
}) {
  // Aggregate data per xKey if there are duplicates (typical for categorical)
  const chartData = useMemo(() => {
    const map = new Map<string, CsvRow>();
    for (const row of data) {
      const key = String(row[chart.xKey] ?? "");
      if (!key) continue;
      const existing = map.get(key);
      if (!existing) {
        const next: CsvRow = { [chart.xKey]: key };
        for (const yk of chart.yKeys) next[yk] = Number(row[yk]) || 0;
        map.set(key, next);
      } else {
        for (const yk of chart.yKeys) {
          existing[yk] = (Number(existing[yk]) || 0) + (Number(row[yk]) || 0);
        }
      }
    }
    const arr = Array.from(map.values());
    // Limit to 20 categories for readability
    return arr.slice(0, 20);
  }, [data, chart]);

  return (
    <div
      className={`glass-card rounded-2xl p-6 border border-border transition-transform hover:-translate-y-0.5 ${
        full ? "lg:col-span-2" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{chart.title}</h3>
        {chart.description && (
          <p className="text-xs text-muted-foreground mt-1">{chart.description}</p>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chart, chartData)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(chart: ChartSpec, data: CsvRow[]) {
  const tooltipStyle = {
    backgroundColor: "#131313",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    fontSize: 12,
  };
  const axisTick = { fill: "#71717a", fontSize: 10 };

  switch (chart.type) {
    case "line":
      return (
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={chart.xKey} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {chart.yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {chart.yKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              dot={false}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      );
    case "area":
      return (
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {chart.yKeys.map((k, i) => (
              <linearGradient key={k} id={`area-${chart.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={chart.xKey} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {chart.yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {chart.yKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              fill={`url(#area-${chart.id}-${i})`}
              animationDuration={1500}
            />
          ))}
        </AreaChart>
      );
    case "pie": {
      const yk = chart.yKeys[0];
      return (
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Pie
            data={data}
            dataKey={yk}
            nameKey={chart.xKey}
            outerRadius={90}
            innerRadius={50}
            paddingAngle={2}
            animationDuration={1500}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      );
    }
    case "bar":
    default:
      return (
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={chart.xKey} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          {chart.yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {chart.yKeys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              fill={PALETTE[i % PALETTE.length]}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          ))}
        </BarChart>
      );
  }
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-primary-glow to-primary opacity-30 blur-2xl animate-pulse" />
        <div className="absolute inset-2 rounded-full border-2 border-primary/20" />
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary border-r-primary"
          style={{ animation: "spin 1.2s linear infinite" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="mt-10 h-6 overflow-hidden">
        <div
          key={message}
          className="text-sm uppercase tracking-widest text-muted-foreground animate-rise"
        >
          {message}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-12 border border-border flex flex-col items-center text-center">
      <div className="h-12 w-12 rounded-full bg-accent/40 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
    </div>
  );
}

/* Legacy exports kept so nothing else in the app breaks until we wire everything up.
   These are now thin no-op placeholders — the real work happens in <Charts />. */
export const MainChart = () => null;
export const ColumnChart = () => null;
export const MiniArea = () => null;
