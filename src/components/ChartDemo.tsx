import React, { useMemo } from "react";
import { Chart, useDrilldown, type ChartSpec, type RawChartRow } from "./chart";

/** 데모용 1시간 간격 raw 데이터 (과거 N시간) */
function createDemoRawData(hoursBack: number): RawChartRow[] {
  const now = Date.now();
  const data: RawChartRow[] = [];
  for (let i = hoursBack; i >= 0; i--) {
    const t = now - i * 60 * 60 * 1000;
    data.push({
      time: t,
      count: Math.floor(Math.random() * 50) + 10,
      latency: Math.floor(Math.random() * 200) + 20,
    });
  }
  return data;
}

/** year → month → week(특정 month 클릭 시 1w~last w) → day(1일~말일, 7일이면 Mon~Sun) → day 클릭 시 00~23 */
const DRILLDOWN_LEVELS: ChartSpec["drilldown"] = {
  levels: ["year", "month", "week", "day", "hour"],
};

const LINE_SPEC: ChartSpec = {
  type: "line",
  xKey: "time",
  series: [{ key: "count", label: "요청 수", unit: "count" }],
  drilldown: DRILLDOWN_LEVELS,
};

const BAR_SPEC: ChartSpec = {
  type: "bar",
  xKey: "time",
  series: [{ key: "count", label: "건수", unit: "count" }],
  drilldown: DRILLDOWN_LEVELS,
};

const AREA_SPEC: ChartSpec = {
  type: "area",
  xKey: "time",
  series: [{ key: "latency", label: "지연(ms)", unit: "ms" }],
  drilldown: DRILLDOWN_LEVELS,
};

const PIE_SPEC: ChartSpec = {
  type: "pie",
  xKey: "time",
  series: [{ key: "count", label: "건수", unit: "count" }],
  drilldown: DRILLDOWN_LEVELS,
};

function DemoChartBlock({
  title,
  spec,
  rawData,
}: {
  title: string;
  spec: ChartSpec;
  rawData: RawChartRow[];
}) {
  const { level, selectedPath, canDrillDown, drillDown, drillUp } =
    useDrilldown(spec.drilldown);
  return (
    <div className="rounded-lg bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{title}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {level && (
            <span className="text-xs text-slate-500">단위: {level}</span>
          )}
          {selectedPath.length > 0 && (
            <span className="text-xs text-slate-400">
              구간: {selectedPath.join(" → ")}
            </span>
          )}
          {spec.drilldown && level && (
            <button
              type="button"
              onClick={drillUp}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600"
            >
              ↑ Drill Up
            </button>
          )}
        </div>
      </div>
      <div className="h-[240px] w-full overflow-visible">
        <Chart
          spec={spec}
          data={rawData}
          drilldownLevel={level}
          selectedPath={selectedPath}
          onPointClick={canDrillDown ? drillDown : undefined}
        />
      </div>
      {canDrillDown && (
        <p className="mt-1 text-xs text-slate-500">
          {/* 막대/포인트 클릭 시 해당 기간만 필터해 하위 단위로 표시 */}
        </p>
      )}
    </div>
  );
}

export function ChartDemo() {
  /** 더미: 7일치 시간 단위 (168개) → hour 집계 시 168개 구간, X축/차트가 안정적으로 표시 */
  const rawData = useMemo(() => createDemoRawData(24 * 7), []);
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold text-slate-200">
        차트 데모 (타입별 + 드릴다운)
      </h2>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        <DemoChartBlock title="Line" spec={LINE_SPEC} rawData={rawData} />
        <DemoChartBlock title="Bar" spec={BAR_SPEC} rawData={rawData} />
        <DemoChartBlock title="Area" spec={AREA_SPEC} rawData={rawData} />
        <DemoChartBlock title="Pie" spec={PIE_SPEC} rawData={rawData} />
      </div>
    </div>
  );
}
