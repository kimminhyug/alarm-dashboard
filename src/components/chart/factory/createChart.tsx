import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
} from "recharts";
import { ChartContainer } from "../base/ChartContainer";
import { Tooltip } from "../base/Tooltip";
import { XAxis } from "../base/XAxis";
import { YAxis } from "../base/YAxis";
import type { RawChartRow } from "../hooks/useChartData";
import { useChartData } from "../hooks/useChartData";
import { useUnitFormatter } from "../hooks/useUnitFormatter";
import type { ChartSpec, DrilldownLevel } from "../types/chartSpec";
import { formatXAxisLabel } from "../utils/formatXAxisLabel";

export interface CreateChartProps {
  spec: ChartSpec;
  /** 1시간 단위 raw data. drilldownLevel에 따라 내부에서 집계 */
  data: RawChartRow[];
  /** 위젯에서 관리하는 드릴다운 단계. 없으면 hour 단위 그대로 */
  drilldownLevel?: DrilldownLevel;
  /** 클릭으로 선택된 상위 구간(해당 기간만 필터해 하위 단위 표시) */
  selectedPath?: string[];
  /** bar/point 클릭 시 클릭한 구간 키로 drillDown 연결 */
  onPointClick?: (clickedKey: string) => void;
}

/**
 * chartSpec을 받아 실제 Recharts 차트를 렌더하는 컴포넌트를 반환하지 않고,
 * spec + data를 받는 단일 Chart 컴포넌트로 사용.
 * 차트 타입별 분기는 이 팩토리(모듈) 내부에서만 처리.
 */
function CreateChartInner({
  spec,
  data,
  drilldownLevel,
  selectedPath = [],
  onPointClick,
}: CreateChartProps) {
  const seriesKeys = spec.series.map((s) => s.key);
  const effectiveLevel = spec.drilldown
    ? (drilldownLevel ?? "hour")
    : undefined;
  const drilldownOptions = useMemo(
    () =>
      spec.drilldown && selectedPath.length >= 0
        ? { levels: spec.drilldown.levels, selectedPath }
        : undefined,
    [spec.drilldown, selectedPath],
  );
  const chartData = useChartData(
    data,
    spec.xKey,
    effectiveLevel,
    seriesKeys,
    drilldownOptions,
  );
  const formatValue = useUnitFormatter(spec.series);

  const formatter = (value: unknown, name: string) => {
    const label = spec.series.find((s) => s.key === name)?.label ?? name;
    return [formatValue(value, name), label] as [string, string];
  };

  const commonProps = {
    data: chartData,
    margin: { top: 8, right: 16, bottom: 48, left: 44 },
  };

  /** X축 라벨. Recharts는 tickFormatter(value, index) 로 호출함 */
  const xAxisTickFormatter = (value: unknown, index?: number) => {
    const str = String(value ?? "");
    const i = typeof index === "number" ? index : chartData.findIndex((row) => String(row[spec.xKey]) === str);
    return formatXAxisLabel(str, effectiveLevel ?? undefined, i >= 0 ? i : 0, chartData.length);
  };

  const seriesClick = onPointClick
    ? {
        cursor: "pointer" as const,
        onClick: (data: unknown, index: number) => {
          const row =
            (data && typeof data === "object" && "payload" in data
              ? (data as { payload?: RawChartRow }).payload
              : null) ??
            (data && typeof data === "object" && spec.xKey in data
              ? (data as RawChartRow)
              : null) ??
            chartData[index];
          const key = row?.[spec.xKey];
          if (key != null) onPointClick(String(key));
        },
      }
    : undefined;

  const axisId = "main";
  const tickStyle = { fontSize: 11, fill: "#94a3b8" };
  const xAxisKey = `xaxis-${effectiveLevel ?? "raw"}-${selectedPath.join("-")}`;
  const axisProps = {
    xKey: spec.xKey,
    xAxis: (
      <XAxis
        key={xAxisKey}
        xAxisId={axisId}
        dataKey={spec.xKey}
        type="category"
        orientation="bottom"
        hide={false}
        height={40}
        tickMargin={8}
        tickFormatter={xAxisTickFormatter}
        tick={true}
        stroke="#94a3b8"
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={24}
        allowDuplicatedCategory
        padding={{ left: 0, right: 0 }}
      />
    ),
    yAxis: (
      <YAxis
        yAxisId={axisId}
        orientation="left"
        hide={false}
        width={40}
        tick={tickStyle}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => formatValue(v, seriesKeys[0])}
        tickCount={5}
      />
    ),
    tooltip: (
      <Tooltip
        formatter={formatter}
        contentStyle={{ fontSize: 12 }}
        labelFormatter={(label) => String(label)}
      />
    ),
  };

  const chartWrapper = (chart: React.ReactNode) => (
    <div
      className="relative w-full h-full overflow-visible"
      style={{ minHeight: 200 }}
    >
      {chart}
    </div>
  );

  if (spec.type === "line") {
    return chartWrapper(
      <ChartContainer minHeight={200}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {spec.series.map((s) => (
            <Line
              key={s.key}
              xAxisId={axisId}
              yAxisId={axisId}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke="#64748b"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              {...seriesClick}
            />
          ))}
        </LineChart>
      </ChartContainer>,
    );
  }

  if (spec.type === "pie") {
    const PIE_COLORS = [
      "#64748b",
      "#475569",
      "#334155",
      "#94a3b8",
      "#cbd5e1",
      "#f1f5f9",
    ];
    const pieClick = onPointClick
      ? {
          onClick: (_: unknown, index: number) => {
            const key = chartData[index]?.[spec.xKey];
            if (key != null) onPointClick(String(key));
          },
        }
      : undefined;
    return (
      <div className="relative w-full h-full">
        <ChartContainer>
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={chartData}
              dataKey={seriesKeys[0]}
              nameKey={spec.xKey}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={2}
              isAnimationActive={false}
              {...pieClick}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            {axisProps.tooltip}
          </PieChart>
        </ChartContainer>
      </div>
    );
  }

  if (spec.type === "bar") {
    return chartWrapper(
      <ChartContainer minHeight={200}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {spec.series.map((s) => (
            <Bar
              key={s.key}
              xAxisId={axisId}
              yAxisId={axisId}
              dataKey={s.key}
              name={s.label}
              fill="#475569"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
              {...seriesClick}
            />
          ))}
        </BarChart>
      </ChartContainer>,
    );
  }

  // area (default)
  return chartWrapper(
    <ChartContainer minHeight={200}>
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#64748b" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        {axisProps.xAxis}
        {axisProps.yAxis}
        {axisProps.tooltip}
        {spec.series.map((s) => (
          <Area
            key={s.key}
            xAxisId={axisId}
            yAxisId={axisId}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke="#64748b"
            strokeWidth={1}
            fill="url(#areaGradient)"
            fillOpacity={0.6}
            isAnimationActive={false}
            {...seriesClick}
          />
        ))}
      </AreaChart>
    </ChartContainer>,
  );
}

/** spec + data만 받아서 렌더하는 차트. 외부에서는 <Chart spec={...} data={...} /> 형태로만 사용 */
export const Chart = CreateChartInner;
