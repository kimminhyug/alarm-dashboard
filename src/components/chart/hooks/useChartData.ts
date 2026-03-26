import { useMemo } from "react";
import type { DrilldownLevel } from "../types/chartSpec";

/** raw 데이터 한 행: xKey(시간) + 시리즈 값들. 시간은 ms 또는 ISO 문자열 */
export type RawChartRow = Record<string, number | string>;

function toDate(value: number | string): Date {
  if (typeof value === "number") return new Date(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date(0);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getWeekNumber(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor(
    (d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
  );
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function groupKey(d: Date, level: DrilldownLevel): string {
  switch (level) {
    case "year":
      return `${d.getFullYear()}`;
    case "month":
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    case "week":
      return getWeekNumber(d);
    case "day":
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    case "hour":
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:00`;
    default:
      return String(d.getTime());
  }
}

export interface UseChartDataDrilldownOptions {
  /** 드릴다운 단계 순서 (spec.drilldown.levels) */
  levels: DrilldownLevel[];
  /** 클릭으로 선택된 상위 구간 키들. 이 구간 안의 데이터만 필터 후 집계 */
  selectedPath: string[];
}

/**
 * 입력: rawData(1시간 단위), xKey, drilldownLevel, 시리즈 key 목록, [선택] 드릴다운 필터
 * 출력: selectedPath가 있으면 해당 기간만 필터한 뒤, drilldownLevel 기준으로 groupBy
 * - 1월 클릭 → selectedPath=['2025-01'] → 1월 1일~말일 데이터만 보고 day/hour 집계
 * - 특정 일 클릭 → selectedPath=['2025-01','2025-01-15'] → 그날 00~23시만 집계
 */
export function useChartData(
  rawData: RawChartRow[],
  xKey: string,
  drilldownLevel: DrilldownLevel | undefined,
  seriesKeys: string[],
  drilldownOptions?: UseChartDataDrilldownOptions
): RawChartRow[] {
  return useMemo(() => {
    let data = rawData;
    const { levels = [], selectedPath = [] } = drilldownOptions ?? {};
    if (selectedPath.length > 0 && levels.length >= selectedPath.length) {
      data = rawData.filter((row) => {
        const rawX = row[xKey];
        if (rawX == null) return false;
        const d = toDate(rawX);
        for (let i = 0; i < selectedPath.length; i++) {
          if (groupKey(d, levels[i]) !== selectedPath[i]) return false;
        }
        return true;
      });
    }
    if (drilldownLevel == null) {
      return [...data].sort((a, b) =>
        String(a[xKey]).localeCompare(String(b[xKey]))
      );
    }
    const level = drilldownLevel;
    const groups = new Map<
      string,
      { count: number; sum: Record<string, number> }
    >();

    for (const row of data) {
      const rawX = row[xKey];
      if (rawX == null) continue;
      const d = toDate(rawX);
      const key = groupKey(d, level);

      let entry = groups.get(key);
      if (!entry) {
        entry = { count: 0, sum: Object.fromEntries(seriesKeys.map((k) => [k, 0])) };
        groups.set(key, entry);
      }
      entry.count += 1;
      for (const k of seriesKeys) {
        const v = row[k];
        const num = typeof v === "number" ? v : Number(v);
        if (!Number.isNaN(num)) entry.sum[k] += num;
      }
    }

    return Array.from(groups.entries())
      .map(([xValue, { sum }]) => {
        const out: RawChartRow = { [xKey]: xValue };
        for (const k of seriesKeys) {
          out[k] = sum[k] ?? 0;
        }
        return out;
      })
      .sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey])));
  }, [rawData, xKey, drilldownLevel, seriesKeys, drilldownOptions]);
}
