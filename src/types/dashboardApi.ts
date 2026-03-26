export type ApiSource = "live" | "mock";

export type HealthLevel = "ok" | "warn" | "critical";

export type AlarmType = "fault" | "warning";

export interface DashboardApiMeta {
  windowMinutes: number;
  bucketMinutes: number;
  refreshedAt: string;
  source: ApiSource;
}

export interface MetricSnapshot {
  value: number;
  delta: number;
  unit?: string;
  health?: HealthLevel;
}

export interface TimeSeriesPoint {
  ts: string;
  value: number;
}

export interface LabeledTimeSeries {
  key: string;
  label: string;
  unit?: string;
  points: TimeSeriesPoint[];
}

export interface AlarmTrendSeries extends LabeledTimeSeries {
  alarmType: AlarmType;
}

export interface IncidentItem {
  id: string;
  title: string;
  message: string;
  health: HealthLevel;
  occurredAt: string;
}

export interface SystemKpiPayload {
  alarmRatePerHour: MetricSnapshot;
  downtimeMinutesInWindow: MetricSnapshot;
  mttdSec: MetricSnapshot;
  mttrSec: MetricSnapshot;
  availabilityPct: MetricSnapshot;
  alarmTrends: AlarmTrendSeries[];
  recentIncidents: IncidentItem[];
}

export interface RouteFlowItem {
  route: string;
  moves: number;
  sharePct: number;
}

export interface VehicleWorkloadItem {
  vehicleId: string;
  moves: number;
  sharePct: number;
  health: HealthLevel;
}

export interface OhtKpiPayload {
  queueLength: MetricSnapshot;
  leadTimeAvgSec: MetricSnapshot;
  leadTimeP95Sec: MetricSnapshot;
  leadTimeP99Sec: MetricSnapshot;
  leadTimeSeries: LabeledTimeSeries[];
  routeFlows: RouteFlowItem[];
  vehicleWorkloads: VehicleWorkloadItem[];
}

export interface StkPortFlowItem {
  portId: string;
  inQty: number;
  outQty: number;
  stockQty: number;
  netQty: number;
}

export interface StkKpiPayload {
  inOutThroughputSeries: LabeledTimeSeries[];
  topPortNetFlows: StkPortFlowItem[];
}

export interface BayHealthItem {
  bayId: string;
  health: HealthLevel;
}

export interface EqDowntimeItem {
  equipmentId: string;
  downtimeMinutes: number;
  health: HealthLevel;
}

export interface EqBayKpiPayload {
  equipmentUptimePct: MetricSnapshot;
  dispatchDelaySec: MetricSnapshot;
  bayHealthMap: BayHealthItem[];
  topDowntime: EqDowntimeItem[];
}

export interface DashboardApiData {
  system: SystemKpiPayload;
  oht: OhtKpiPayload;
  stk: StkKpiPayload;
  eqBay: EqBayKpiPayload;
}

export interface DashboardApiResponse {
  meta: DashboardApiMeta;
  data: DashboardApiData;
}

export interface DashboardApiQuery {
  windowMinutes?: number;
  bucketMinutes?: number;
  timezone?: string;
}

/**
 * Dashboard2 (관제형) 확장 타입
 * - DB에서 지표 메타/알람 템플릿/규칙을 내려받아 렌더링하기 위한 스키마
 */

export type DashboardArea =
  | "left.system"
  | "left.oht"
  | "left.stk-eq"
  | "center.goal"
  | "center.trend"
  | "right.trend"
  | "bottom.summary"
  | "ticker";

export type MetricKey =
  | "alarmRate"
  | "downtime1h"
  | "mttd"
  | "mttr"
  | "availability"
  | "leadTimeP95"
  | "queueLength"
  | "congestionIndex"
  | "retryMoves"
  | "utilization"
  | "capacityUsage"
  | "inOutThroughput"
  | "waitTimeP95"
  | "equipmentUptime"
  | "criticalByBay"
  | "dispatchDelay";

export type ComparisonOp = "gt" | "gte" | "lt" | "lte" | "eq" | "between";

export interface MetricDescriptor {
  key: MetricKey;
  label: string;
  unit?: string;
  domain: "system" | "oht" | "stk" | "eqBay" | "cross";
  area: DashboardArea;
  decimals?: number;
  invertForGoal?: boolean;
}

export interface DashboardMetricValue {
  key: MetricKey;
  value: number;
  displayValue: string;
  health: HealthLevel;
  targetValue?: number;
  targetDisplay?: string;
  progressPct?: number;
  delta?: number;
  deltaDisplay?: string;
  measuredAt: string;
}

export interface AlarmCondition {
  metricKey: MetricKey;
  op: ComparisonOp;
  threshold: number | [number, number];
  forMinutes?: number;
}

export interface AlarmMessageTemplate {
  titleTemplate: string;
  messageTemplate: string;
  actionTemplate: string;
  formulaTemplate?: string;
}

export interface AlarmTemplate {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  severity: HealthLevel;
  domain: "system" | "oht" | "stk" | "eqBay" | "cross";
  area: DashboardArea;
  conditions: AlarmCondition[];
  message: AlarmMessageTemplate;
  cooldownSec?: number;
  dedupKeyTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlarmTemplateEvaluation {
  templateId: string;
  matched: boolean;
  matchedAt?: string;
  evidence: Array<{
    metricKey: MetricKey;
    actual: number;
    threshold: number | [number, number];
    op: ComparisonOp;
  }>;
}

export interface AlarmEvent {
  id: string;
  templateId: string;
  severity: HealthLevel;
  title: string;
  message: string;
  action: string;
  formula?: string;
  metricKey: MetricKey;
  metricDisplayValue: string;
  occurredAt: string;
  acknowledged: boolean;
}

export interface DashboardHelpContent {
  explain: string;
  action: string;
  formula: string;
}

export interface DashboardGoalCard {
  key: MetricKey;
  title: string;
  metric: DashboardMetricValue;
  help: DashboardHelpContent;
}

export interface DashboardTrendPanel {
  key: MetricKey;
  title: string;
  subtitle: string;
  series: LabeledTimeSeries;
  stats: {
    now: number;
    avg: number;
    peak: number;
  };
  help: DashboardHelpContent;
}

export interface DashboardSummaryCard {
  id: string;
  title: string;
  body: string;
  relatedMetricKeys: MetricKey[];
  health: HealthLevel;
  help: DashboardHelpContent;
}

export interface DashboardTickerItem {
  id: string;
  level: HealthLevel;
  message: string;
  occurredAt: string;
  help?: DashboardHelpContent;
}

export interface Dashboard2Payload {
  title: string;
  refreshedAt: string;
  metricCatalog: MetricDescriptor[];
  leftMetricGroups: Array<{
    id: "system" | "oht" | "stk-eq";
    title: string;
    metricKeys: MetricKey[];
    help?: DashboardHelpContent;
  }>;
  metricValues: DashboardMetricValue[];
  goalCards: DashboardGoalCard[];
  centerTrend: {
    targetSeries: LabeledTimeSeries;
    actualSeries: LabeledTimeSeries;
    help: DashboardHelpContent;
  };
  rightTrendPanels: DashboardTrendPanel[];
  summaryCards: DashboardSummaryCard[];
  ticker: DashboardTickerItem[];
}

export interface Dashboard2ApiResponse {
  meta: DashboardApiMeta;
  data: Dashboard2Payload;
  alarmTemplates: AlarmTemplate[];
  templateEvaluations?: AlarmTemplateEvaluation[];
  events: AlarmEvent[];
}
