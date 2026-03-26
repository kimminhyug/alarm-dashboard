import { useMemo } from "react";
import { Chart, type ChartSpec, type RawChartRow } from "./chart";

const TREND_CHART_SPEC: ChartSpec = {
  type: "area",
  xKey: "time",
  series: [{ key: "severity", label: "Severity", unit: "count" }],
};

export function TrendChart() {
  const rawData = useMemo<RawChartRow[]>(() => {
    const data: RawChartRow[] = [];
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      const value = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;
      data.push({
        time: now - i * 60000,
        severity: value,
      });
    }
    return data;
  }, []);

  return (
    <div className="h-20 w-full bg-slate-900/50 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center gap-4 h-full">
        <div className="text-slate-400 text-xs whitespace-nowrap">
          Recent Activity
        </div>
        <Chart spec={TREND_CHART_SPEC} data={rawData} />
      </div>
    </div>
  );
}
