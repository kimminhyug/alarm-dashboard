import { useCallback, useMemo } from "react";
import type { ChartSeriesSpec, SeriesUnit } from "../types/chartSpec";

function formatByUnit(value: number, unit?: SeriesUnit): string {
  if (value == null || Number.isNaN(value)) return "—";
  switch (unit) {
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    case "ms":
      return `${value} ms`;
    case "sec":
      return `${value} s`;
    case "byte":
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)} GB`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)} MB`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)} KB`;
      return `${value} B`;
    case "count":
    default:
      return String(Number(value));
  }
}

/**
 * series spec을 입력으로 (value, seriesKey) => formattedValue 포맷터 반환.
 * Tooltip / YAxis에서 공용 사용.
 */
export function useUnitFormatter(series: ChartSeriesSpec[]) {
  const keyToUnit = useMemo(() => {
    const map = new Map<string, SeriesUnit | undefined>();
    for (const s of series) {
      map.set(s.key, s.unit);
    }
    return map;
  }, [series]);

  return useCallback(
    (value: unknown, seriesKey: string): string => {
      const num = typeof value === "number" ? value : Number(value);
      const unit = keyToUnit.get(seriesKey);
      return formatByUnit(num, unit);
    },
    [keyToUnit]
  );
}
