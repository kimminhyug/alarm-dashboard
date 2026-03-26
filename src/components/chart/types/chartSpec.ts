/** 시리즈 단위 (포맷터에서 사용) */
export type SeriesUnit = "count" | "ms" | "sec" | "percent" | "byte";

/** 시리즈 정의 */
export interface ChartSeriesSpec {
  key: string;
  label: string;
  unit?: SeriesUnit;
}

/** 드릴다운 시간 단위 (client-side aggregation) */
export type DrilldownLevel = "year" | "month" | "week" | "day" | "hour";

/** 드릴다운 설정 */
export interface DrilldownSpec {
  levels: DrilldownLevel[];
}

/** 차트 스펙: spec 기반 차트 정의 */
export interface ChartSpec {
  type: "line" | "bar" | "area" | "pie";
  xKey: string;
  series: ChartSeriesSpec[];
  drilldown?: DrilldownSpec;
}
