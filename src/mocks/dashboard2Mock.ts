import type {
  AlarmEvent,
  AlarmTemplate,
  Dashboard2ApiResponse,
  DashboardHelpContent,
  DashboardMetricValue,
  LabeledTimeSeries,
  MetricDescriptor,
  MetricKey,
} from "../types";

function isoNow(): string {
  return new Date().toISOString();
}

function mkSeries(key: string, label: string, base: number): LabeledTimeSeries {
  const now = Date.now();
  const points = Array.from({ length: 24 }, (_, i) => ({
    ts: new Date(now - (23 - i) * 60 * 1000).toISOString(),
    value: Math.max(10, Math.min(100, base + Math.round(Math.random() * 8 - 4))),
  }));
  return { key, label, unit: "%", points };
}

function help(explain: string, action: string, formula: string): DashboardHelpContent {
  return { explain, action, formula };
}

const catalog: MetricDescriptor[] = [
  { key: "alarmRate", label: "Alarm Rate", unit: "/h", domain: "system", area: "left.system", invertForGoal: true },
  { key: "downtime1h", label: "Downtime (1h)", unit: "m", domain: "system", area: "left.system", invertForGoal: true },
  { key: "mttd", label: "MTTD", unit: "s", domain: "system", area: "left.system", invertForGoal: true },
  { key: "mttr", label: "MTTR", unit: "s", domain: "system", area: "left.system", invertForGoal: true },
  { key: "availability", label: "Availability", unit: "%", domain: "system", area: "left.system" },
  { key: "leadTimeP95", label: "Lead Time P95", unit: "s", domain: "oht", area: "left.oht", invertForGoal: true },
  { key: "queueLength", label: "Queue Length", unit: "", domain: "oht", area: "left.oht", invertForGoal: true },
  { key: "congestionIndex", label: "Congestion Index", unit: "", domain: "oht", area: "left.oht", invertForGoal: true },
  { key: "retryMoves", label: "Retry Moves", unit: "/h", domain: "oht", area: "left.oht", invertForGoal: true },
  { key: "utilization", label: "Utilization", unit: "%", domain: "oht", area: "left.oht" },
  { key: "capacityUsage", label: "Capacity Usage", unit: "%", domain: "stk", area: "left.stk-eq", invertForGoal: true },
  { key: "inOutThroughput", label: "In/Out Throughput", unit: "/h", domain: "stk", area: "left.stk-eq" },
  { key: "waitTimeP95", label: "Wait Time P95", unit: "s", domain: "stk", area: "left.stk-eq", invertForGoal: true },
  { key: "equipmentUptime", label: "Equipment Uptime", unit: "%", domain: "eqBay", area: "left.stk-eq" },
  { key: "criticalByBay", label: "Critical by Bay", unit: "", domain: "eqBay", area: "left.stk-eq" },
  { key: "dispatchDelay", label: "Dispatch Delay", unit: "s", domain: "eqBay", area: "bottom.summary", invertForGoal: true },
];

function healthByProgress(progress: number): "ok" | "warn" | "critical" {
  if (progress >= 95) return "ok";
  if (progress >= 85) return "warn";
  return "critical";
}

function metric(key: MetricKey, displayValue: string, progress = 90, targetDisplay?: string): DashboardMetricValue {
  return {
    key,
    value: Number.parseFloat(displayValue.replace(/[^\d.]/g, "")) || 0,
    displayValue,
    health: healthByProgress(progress),
    targetValue: targetDisplay ? Number.parseFloat(targetDisplay.replace(/[^\d.]/g, "")) : undefined,
    targetDisplay,
    progressPct: progress,
    measuredAt: isoNow(),
  };
}

const metricSeed: DashboardMetricValue[] = [
  metric("alarmRate", "18/h", 92, "<= 20/h"),
  metric("downtime1h", "31m", 86),
  metric("mttd", "42s", 90),
  metric("mttr", "6m 30s", 90, "<= 7m"),
  metric("availability", "99.21%", 97),
  metric("leadTimeP95", "28s", 84),
  metric("queueLength", "37", 81, "<= 30"),
  metric("congestionIndex", "0.81", 83),
  metric("retryMoves", "14/h", 82),
  metric("utilization", "87%", 88),
  metric("capacityUsage", "76%", 95, "<= 80%"),
  metric("inOutThroughput", "412/h", 92),
  metric("waitTimeP95", "19s", 89),
  metric("equipmentUptime", "96.8%", 94),
  metric("criticalByBay", "Bay-2", 80),
  metric("dispatchDelay", "17s", 87),
];

const alarmTemplates: AlarmTemplate[] = [
  {
    id: "tpl-alarm-rate-high",
    code: "ALARM_RATE_HIGH",
    name: "Alarm Rate High",
    enabled: true,
    severity: "warn",
    domain: "system",
    area: "center.goal",
    conditions: [{ metricKey: "alarmRate", op: "gt", threshold: 20, forMinutes: 5 }],
    message: {
      titleTemplate: "Alarm Rate 임계 초과",
      messageTemplate: "최근 1시간 Alarm Rate가 기준({{threshold}}/h)을 초과했습니다.",
      actionTemplate: "Fault 상위 설비를 분리하고 연관 알람 묶음을 확인하세요.",
      formulaTemplate: "Alarm Rate = 최근 1시간 알람 수 / 1h",
    },
    cooldownSec: 300,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
];

const events: AlarmEvent[] = [
  {
    id: "evt-1",
    templateId: "tpl-alarm-rate-high",
    severity: "warn",
    title: "Alarm Rate 상승 감지",
    message: "Alarm Rate 18/h, 기준선 근접 상태",
    action: "상위 Fault 설비를 선점검",
    formula: "Alarm Rate = 최근 1시간 알람 수 / 1h",
    metricKey: "alarmRate",
    metricDisplayValue: "18/h",
    occurredAt: isoNow(),
    acknowledged: false,
  },
];

export function createDashboard2MockResponse(): Dashboard2ApiResponse {
  return {
    meta: {
      windowMinutes: 60,
      bucketMinutes: 1,
      refreshedAt: isoNow(),
      source: "mock",
    },
    data: {
      title: "ALARM DASHBOARD 2",
      refreshedAt: isoNow(),
      metricCatalog: catalog,
      leftMetricGroups: [
        { id: "system", title: "System KPI (Top5)", metricKeys: ["alarmRate", "downtime1h", "mttd", "mttr", "availability"] },
        { id: "oht", title: "OHT KPI (Top5)", metricKeys: ["leadTimeP95", "queueLength", "congestionIndex", "retryMoves", "utilization"] },
        { id: "stk-eq", title: "STK / EQ-Bay KPI (Top5)", metricKeys: ["capacityUsage", "inOutThroughput", "waitTimeP95", "equipmentUptime", "criticalByBay"] },
      ],
      metricValues: metricSeed,
      goalCards: [
        {
          key: "alarmRate",
          title: "Alarm Rate 목표 달성",
          metric: metricSeed.find((m) => m.key === "alarmRate")!,
          help: help("최근 1시간 알람율이 기준선 이내인지 확인합니다.", "기준 초과 시 Fault 상위 설비를 먼저 점검하세요.", "달성률 = min(100, 목표값/현재값 x 100)"),
        },
        {
          key: "mttr",
          title: "MTTR 목표 달성",
          metric: metricSeed.find((m) => m.key === "mttr")!,
          help: help("복구시간이 목표 이내인지 확인합니다.", "지연 단계(승인/조치/검증) 중 병목을 먼저 제거하세요.", "달성률 = min(100, 목표 MTTR/실제 MTTR x 100)"),
        },
        {
          key: "queueLength",
          title: "Queue 목표 달성",
          metric: metricSeed.find((m) => m.key === "queueLength")!,
          help: help("대기 작업이 기준치 이하인지 확인합니다.", "큐 급증 시 우회 경로 및 우선순위 재정렬을 적용하세요.", "달성률 = min(100, 목표 Queue/현재 Queue x 100)"),
        },
        {
          key: "capacityUsage",
          title: "Capacity 목표 달성",
          metric: metricSeed.find((m) => m.key === "capacityUsage")!,
          help: help("적재율이 포화 임계치 미만인지 확인합니다.", "80% 근접 시 워크로드 분산과 포트 해소를 우선하세요.", "달성률 = min(100, 목표 적재율/현재 적재율 x 100)"),
        },
      ],
      centerTrend: {
        targetSeries: mkSeries("target", "Target", 90),
        actualSeries: mkSeries("actual", "Actual", 86),
        help: help("목표 대비 실제 달성률 추이를 표시합니다.", "Actual이 Target 미만으로 지속되면 원인 지표를 우선 점검하세요.", "달성 추이 = 시간 버킷별 KPI 달성률(%)"),
      },
      rightTrendPanels: [
        { key: "alarmRate", title: "Alarm Rate Trend (1h)", subtitle: "System / 1분 버킷", series: mkSeries("alarmRate", "Alarm Rate", 44), stats: { now: 0, avg: 0, peak: 0 }, help: help("알람율의 실시간 변화입니다.", "피크 근접이 지속되면 장애 전조로 보고 조치하세요.", "Now/Avg/Peak 집계") },
        { key: "queueLength", title: "Queue Length Trend", subtitle: "OHT / 실시간", series: mkSeries("queue", "Queue", 33), stats: { now: 0, avg: 0, peak: 0 }, help: help("큐 변화 추이입니다.", "급상승 시 우회와 분배 정책을 즉시 적용하세요.", "Now/Avg/Peak 집계") },
        { key: "capacityUsage", title: "Capacity Usage Trend", subtitle: "STK / 적재율", series: mkSeries("capacity", "Capacity", 28), stats: { now: 0, avg: 0, peak: 0 }, help: help("STK 적재율 추이입니다.", "포화 임계 접근 시 분산 적재를 적용하세요.", "Now/Avg/Peak 집계") },
        { key: "equipmentUptime", title: "Equipment Uptime Trend", subtitle: "EQ-Bay / 가용률", series: mkSeries("uptime", "Uptime", 92), stats: { now: 0, avg: 0, peak: 0 }, help: help("설비 가용률 추이입니다.", "급락 시 상위 다운타임 설비를 즉시 점검하세요.", "Now/Avg/Peak 집계") },
      ],
      summaryCards: [
        { id: "sum-1", title: "Critical Events", body: "TSC-2 Timeout x3 / EQ-23 Downtime 22m / Bay-2 Alert", relatedMetricKeys: ["alarmRate", "criticalByBay"], health: "critical", help: help("치명 이벤트 요약입니다.", "반복 설비를 우선 격리하고 로그를 분석하세요.", "Critical Events = Severity Critical 목록") },
        { id: "sum-2", title: "Dispatch & Congestion", body: "Queue 37 / Dispatch Delay 17s / Congestion 0.81", relatedMetricKeys: ["queueLength", "dispatchDelay"], health: "warn", help: help("디스패치/혼잡 상태입니다.", "큐 급증 시 우회 경로를 즉시 적용하세요.", "Congestion Index 종합 지표") },
        { id: "sum-3", title: "STK Flow Snapshot", body: "In 240/h / Out 218/h / Blocked Ports 1 / Mismatch 0", relatedMetricKeys: ["inOutThroughput", "capacityUsage"], health: "warn", help: help("STK 흐름 요약입니다.", "In-Out 불균형 지속 시 포트 해소를 우선하세요.", "Net Flow = In - Out") },
      ],
      ticker: [
        {
          id: "tick-1",
          level: "warn",
          message: "Alarm Rate 급증 + Critical Event 반복 감지: TSC-2, EQ-23, Bay-2 우선 점검 필요",
          occurredAt: isoNow(),
          help: help("최신 이벤트를 시간순으로 보여줍니다.", "동일 이벤트 재발 시 임시 조치 대신 원인 제거를 수행하세요.", "티커 = 최신 이벤트 시간 + 메시지"),
        },
      ],
    },
    alarmTemplates,
    templateEvaluations: [],
    events,
  };
}

export function tickDashboard2Mock(prev: Dashboard2ApiResponse): Dashboard2ApiResponse {
  const next = structuredClone(prev);
  next.meta.refreshedAt = isoNow();
  next.data.refreshedAt = isoNow();

  next.data.metricValues = next.data.metricValues.map((m) => {
    if (typeof m.progressPct !== "number") return { ...m, measuredAt: isoNow() };
    const progress = Math.max(72, Math.min(99, m.progressPct + Math.round(Math.random() * 6 - 3)));
    return { ...m, progressPct: progress, health: healthByProgress(progress), measuredAt: isoNow() };
  });

  next.data.goalCards = next.data.goalCards.map((g) => ({
    ...g,
    metric: next.data.metricValues.find((m) => m.key === g.key) ?? g.metric,
  }));

  const bumpSeries = (series: LabeledTimeSeries, drift = 0) => {
    const last = series.points[series.points.length - 1]?.value ?? 80;
    const value = Math.max(10, Math.min(100, last + Math.round(Math.random() * 10 - 5 + drift)));
    return {
      ...series,
      points: [...series.points.slice(1), { ts: isoNow(), value }],
    };
  };

  next.data.centerTrend.actualSeries = bumpSeries(next.data.centerTrend.actualSeries);
  next.data.centerTrend.targetSeries = bumpSeries(next.data.centerTrend.targetSeries, 0);
  next.data.rightTrendPanels = next.data.rightTrendPanels.map((p) => {
    const series = bumpSeries(p.series);
    const values = series.points.map((pt) => pt.value);
    return {
      ...p,
      series,
      stats: {
        now: Math.round(values[values.length - 1] ?? 0),
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        peak: Math.max(...values),
      },
    };
  });

  const alarmRate = next.data.metricValues.find((m) => m.key === "alarmRate");
  const matched = Boolean(alarmRate && alarmRate.value > 20);
  next.templateEvaluations = [
    {
      templateId: "tpl-alarm-rate-high",
      matched,
      matchedAt: matched ? isoNow() : undefined,
      evidence: alarmRate
        ? [{ metricKey: "alarmRate", actual: alarmRate.value, threshold: 20, op: "gt" }]
        : [],
    },
  ];

  return next;
}
