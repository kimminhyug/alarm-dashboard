import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiActivity, FiBox, FiCpu, FiTruck } from "react-icons/fi";

type HealthLevel = "ok" | "warn" | "critical";

type KpiItem = {
  label: string;
  value: string;
  delta: string;
  health: HealthLevel;
};

type Topic = {
  id: "system" | "oht" | "stk" | "eq-bay";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  health: HealthLevel;
  kpis: KpiItem[];
};

type HelpGuide = {
  insight: string[];
  actions: string[];
};

type OhtRouteLoad = { route: string; moves: number };
type OhtVehicleLoad = {
  vehicle: string;
  moves: number;
  share: string;
  health: HealthLevel;
};
type OhtRealtime = {
  p95Series: number[];
  avgSeries: number[];
  queueLength: number;
  queueDelta: number;
  routeLoads: OhtRouteLoad[];
  vehicleLoads: OhtVehicleLoad[];
};

type DashboardRealtime = {
  systemFaultTrend: number[];
  systemWarningTrend: number[];
  systemEvents: Array<{ name: string; desc: string; health: HealthLevel }>;
  stkInSeries: number[];
  stkOutSeries: number[];
  stkPortFlows: Array<{
    port: string;
    inQty: number;
    outQty: number;
    stock: number;
  }>;
  eqBayCells: Array<{ id: string; health: HealthLevel }>;
  eqDowntimeTop: Array<{ name: string; desc: string; health: HealthLevel }>;
};

function toHealthByQueue(queue: number): HealthLevel {
  if (queue >= 35) return "critical";
  if (queue >= 24) return "warn";
  return "ok";
}

function makeVehicleRows(totalMoves: number): OhtVehicleLoad[] {
  const baseShare = [0.23, 0.19, 0.15, 0.13];
  const ids = ["OHT-14", "OHT-03", "OHT-21", "OHT-08"];
  return ids.map((id, idx) => {
    const noise = Math.random() * 0.03 - 0.015;
    const share = Math.max(0.1, baseShare[idx] + noise);
    const moves = Math.round(totalMoves * share);
    const health: HealthLevel =
      share > 0.22 ? "critical" : share > 0.18 ? "warn" : "ok";
    return { vehicle: id, moves, share: `${Math.round(share * 100)}%`, health };
  });
}

function createInitialOhtRealtime(): OhtRealtime {
  const p95Series = Array.from({ length: 60 }, (_, idx) => {
    const wave = Math.sin(idx / 6) * 4;
    const noise = Math.random() * 3 - 1.5;
    const spike = idx > 44 && idx < 50 ? 6 : 0;
    return Math.max(16, Math.round(22 + wave + noise + spike));
  });
  const avgSeries = p95Series.map((v) =>
    Math.max(11, Math.round(v * 0.74 + (Math.random() * 2 - 1))),
  );
  const routeLoads = [
    { route: "Bay2 -> STK3", moves: 182 },
    { route: "Bay1 -> EQ12", moves: 146 },
    { route: "STK1 -> Bay4", moves: 123 },
    { route: "Bay3 -> EQ07", moves: 98 },
  ];
  const totalMoves = routeLoads.reduce((acc, row) => acc + row.moves, 0);
  return {
    p95Series,
    avgSeries,
    queueLength: 31,
    queueDelta: 4,
    routeLoads,
    vehicleLoads: makeVehicleRows(totalMoves),
  };
}

function simulateNextOhtRealtime(prev: OhtRealtime): OhtRealtime {
  const p95Prev = prev.p95Series[prev.p95Series.length - 1] ?? 24;
  const avgPrev = prev.avgSeries[prev.avgSeries.length - 1] ?? 17;
  const rushHourBias = Math.random() > 0.75 ? 3 : 0;
  const incidentBias = Math.random() > 0.92 ? 6 : 0;
  const p95Next = Math.max(
    16,
    Math.min(
      42,
      p95Prev +
        (Math.floor(Math.random() * 5) - 2) +
        rushHourBias +
        incidentBias,
    ),
  );
  const avgNext = Math.max(
    11,
    Math.min(
      31,
      avgPrev +
        (Math.floor(Math.random() * 5) - 2) +
        Math.floor((rushHourBias + incidentBias) / 2),
    ),
  );
  const nextP95Series = [...prev.p95Series.slice(1), p95Next];
  const nextAvgSeries = [...prev.avgSeries.slice(1), avgNext];

  const queueDelta = Math.max(
    -4,
    Math.min(
      7,
      Math.round((p95Next - 24) / 3) + (Math.floor(Math.random() * 3) - 1),
    ),
  );
  const queueLength = Math.max(8, Math.min(58, prev.queueLength + queueDelta));

  const routeLoads = prev.routeLoads.map((row, idx) => {
    const baseShift = idx === 0 ? 6 : idx === 1 ? 3 : -2;
    const noise = Math.floor(Math.random() * 9) - 4;
    return { ...row, moves: Math.max(60, row.moves + baseShift + noise) };
  });
  const totalMoves = routeLoads.reduce((acc, row) => acc + row.moves, 0);

  return {
    p95Series: nextP95Series,
    avgSeries: nextAvgSeries,
    queueLength,
    queueDelta,
    routeLoads,
    vehicleLoads: makeVehicleRows(totalMoves),
  };
}

function createInitialDashboardRealtime(): DashboardRealtime {
  return {
    systemFaultTrend: [2, 3, 2, 4, 5, 4, 6, 5, 7, 8, 7, 8],
    systemWarningTrend: [5, 6, 6, 7, 8, 6, 8, 7, 9, 10, 10, 10],
    systemEvents: [
      { name: "TSC-2", desc: "Fault: Timeout x3", health: "critical" },
      { name: "TSC-18", desc: "Warning: Connection unstable", health: "warn" },
      { name: "Gateway", desc: "Recovered", health: "ok" },
    ],
    stkInSeries: [212, 218, 224, 226, 232, 228, 236, 240],
    stkOutSeries: [198, 202, 208, 214, 210, 206, 212, 218],
    stkPortFlows: [
      { port: "P-01", inQty: 62, outQty: 48, stock: 142 },
      { port: "P-02", inQty: 51, outQty: 56, stock: 108 },
      { port: "P-03", inQty: 73, outQty: 52, stock: 167 },
      { port: "P-04", inQty: 44, outQty: 61, stock: 96 },
    ],
    eqBayCells: [
      { id: "B1", health: "ok" },
      { id: "B2", health: "critical" },
      { id: "B3", health: "warn" },
      { id: "B4", health: "ok" },
      { id: "B5", health: "warn" },
      { id: "B6", health: "ok" },
    ],
    eqDowntimeTop: [
      { name: "EQ-23", desc: "22m", health: "critical" },
      { name: "EQ-17", desc: "13m", health: "warn" },
      { name: "EQ-05", desc: "5m", health: "ok" },
    ],
  };
}

function simulateNextDashboardRealtime(
  prev: DashboardRealtime,
): DashboardRealtime {
  const lastFault =
    prev.systemFaultTrend[prev.systemFaultTrend.length - 1] ?? 5;
  const lastWarn =
    prev.systemWarningTrend[prev.systemWarningTrend.length - 1] ?? 8;
  const nextFault = Math.max(
    0,
    Math.min(15, lastFault + (Math.floor(Math.random() * 5) - 2)),
  );
  const nextWarn = Math.max(
    1,
    Math.min(20, lastWarn + (Math.floor(Math.random() * 7) - 3)),
  );
  const nextFaultTrend = [...prev.systemFaultTrend.slice(1), nextFault];
  const nextWarningTrend = [...prev.systemWarningTrend.slice(1), nextWarn];
  const lastIn = prev.stkInSeries[prev.stkInSeries.length - 1] ?? 230;
  const lastOut = prev.stkOutSeries[prev.stkOutSeries.length - 1] ?? 210;
  const nextInSeries = [
    ...prev.stkInSeries.slice(1),
    Math.max(170, Math.min(280, lastIn + (Math.floor(Math.random() * 13) - 6))),
  ];
  const nextOutSeries = [
    ...prev.stkOutSeries.slice(1),
    Math.max(
      160,
      Math.min(270, lastOut + (Math.floor(Math.random() * 13) - 6)),
    ),
  ];
  const bayHealthPool: HealthLevel[] = [
    "ok",
    "ok",
    "ok",
    "warn",
    "warn",
    "critical",
  ];
  const nextBayCells = prev.eqBayCells.map((cell) => ({
    ...cell,
    health: bayHealthPool[Math.floor(Math.random() * bayHealthPool.length)],
  }));
  const nextEvents = [
    {
      name: "TSC-2",
      desc: `Fault: Timeout x${2 + Math.floor(Math.random() * 4)}`,
      health: "critical" as HealthLevel,
    },
    {
      name: "TSC-18",
      desc: `Warning: Connection ${Math.random() > 0.5 ? "unstable" : "degraded"}`,
      health: "warn" as HealthLevel,
    },
    {
      name: "Gateway",
      desc: Math.random() > 0.65 ? "Recovered" : "Watch",
      health:
        Math.random() > 0.65 ? ("ok" as HealthLevel) : ("warn" as HealthLevel),
    },
  ];
  const nextDowntime = [
    {
      name: "EQ-23",
      desc: `${18 + Math.floor(Math.random() * 12)}m`,
      health: "critical" as HealthLevel,
    },
    {
      name: "EQ-17",
      desc: `${10 + Math.floor(Math.random() * 9)}m`,
      health: "warn" as HealthLevel,
    },
    {
      name: "EQ-05",
      desc: `${3 + Math.floor(Math.random() * 6)}m`,
      health: "ok" as HealthLevel,
    },
  ];
  const nextPortFlows = prev.stkPortFlows.map((row, idx) => {
    const inQty = Math.max(
      18,
      Math.min(
        95,
        row.inQty + (Math.floor(Math.random() * 13) - 6) + (idx === 2 ? 2 : 0),
      ),
    );
    const outQty = Math.max(
      18,
      Math.min(
        95,
        row.outQty + (Math.floor(Math.random() * 13) - 6) + (idx === 3 ? 2 : 0),
      ),
    );
    const stock = Math.max(
      40,
      Math.min(
        220,
        row.stock + (inQty - outQty) + (Math.floor(Math.random() * 9) - 4),
      ),
    );
    return { ...row, inQty, outQty, stock };
  });

  return {
    systemFaultTrend: nextFaultTrend,
    systemWarningTrend: nextWarningTrend,
    systemEvents: nextEvents,
    stkInSeries: nextInSeries,
    stkOutSeries: nextOutSeries,
    stkPortFlows: nextPortFlows,
    eqBayCells: nextBayCells,
    eqDowntimeTop: nextDowntime,
  };
}

function simulateTopicRefresh(
  prevTopics: Topic[],
  ohtRealtime: OhtRealtime,
): Topic[] {
  return prevTopics.map((topic) => {
    if (topic.id === "system") {
      const alarmRate = 16 + Math.floor(Math.random() * 8);
      const criticalAlarm = Math.max(
        0,
        Math.min(5, 1 + Math.floor(Math.random() * 4)),
      );
      const availability = 99.1 + Math.random() * 0.6;
      const downtimeMin = 18 + Math.floor(Math.random() * 28);
      const nextHealth: HealthLevel =
        criticalAlarm >= 3 ? "critical" : alarmRate >= 21 ? "warn" : "ok";
      return {
        ...topic,
        health: nextHealth,
        kpis: [
          {
            label: "Alarm Rate",
            value: `${alarmRate}/h`,
            delta: `${Math.random() > 0.5 ? "+" : "-"}${1 + Math.floor(Math.random() * 6)}%`,
            health: alarmRate >= 21 ? "warn" : "ok",
          },
          {
            label: "Downtime (1h)",
            value: `${downtimeMin}m`,
            delta: `${Math.random() > 0.5 ? "+" : "-"}${2 + Math.floor(Math.random() * 8)}m`,
            health: downtimeMin >= 35 ? "critical" : "warn",
          },
          {
            label: "MTTD",
            value: `${38 + Math.floor(Math.random() * 12)}s`,
            delta: `${Math.random() > 0.5 ? "+" : "-"}${1 + Math.floor(Math.random() * 8)}%`,
            health: "ok",
          },
          {
            label: "MTTR",
            value: `${5 + Math.floor(Math.random() * 3)}m ${10 + Math.floor(Math.random() * 50)}s`,
            delta: `+${3 + Math.floor(Math.random() * 10)}%`,
            health: "warn",
          },
          {
            label: "Availability",
            value: `${availability.toFixed(2)}%`,
            delta: `${Math.random() > 0.5 ? "-" : "+"}${(Math.random() * 0.3).toFixed(2)}%p`,
            health: availability < 99.4 ? "warn" : "ok",
          },
        ],
      };
    }

    if (topic.id === "oht") {
      const p95Latest =
        ohtRealtime.p95Series[ohtRealtime.p95Series.length - 1] ?? 0;
      const queue = ohtRealtime.queueLength;
      return {
        ...topic,
        health: toHealthByQueue(queue),
        kpis: [
          {
            label: "Lead Time P95",
            value: `${p95Latest}s`,
            delta: `${ohtRealtime.queueDelta >= 0 ? "+" : ""}${Math.abs(ohtRealtime.queueDelta) * 2}%`,
            health:
              p95Latest >= 30 ? "critical" : p95Latest >= 25 ? "warn" : "ok",
          },
          {
            label: "Queue Length",
            value: `${queue}`,
            delta: `${ohtRealtime.queueDelta >= 0 ? "+" : ""}${ohtRealtime.queueDelta}`,
            health: toHealthByQueue(queue),
          },
          {
            label: "Congestion Index",
            value: `${(0.6 + queue / 100).toFixed(2)}`,
            delta: `+${(Math.random() * 0.08).toFixed(2)}`,
            health: queue >= 34 ? "critical" : "warn",
          },
          {
            label: "Retry Moves",
            value: `${8 + Math.floor(Math.random() * 10)}/h`,
            delta: `+${2 + Math.floor(Math.random() * 6)}/h`,
            health: "critical",
          },
          {
            label: "Utilization",
            value: `${82 + Math.floor(Math.random() * 9)}%`,
            delta: `+${2 + Math.floor(Math.random() * 4)}%p`,
            health: "warn",
          },
        ],
      };
    }

    if (topic.id === "stk") {
      const cap = 72 + Math.floor(Math.random() * 10);
      return {
        ...topic,
        health: cap >= 80 ? "warn" : "ok",
        kpis: [
          {
            label: "Capacity Usage",
            value: `${cap}%`,
            delta: `${Math.random() > 0.5 ? "+" : "-"}${1 + Math.floor(Math.random() * 3)}%p`,
            health: cap >= 80 ? "warn" : "ok",
          },
          {
            label: "In/Out Throughput",
            value: `${392 + Math.floor(Math.random() * 36)}/h`,
            delta: `${Math.random() > 0.5 ? "+" : "-"}${1 + Math.floor(Math.random() * 4)}%`,
            health: "ok",
          },
          {
            label: "Wait Time P95",
            value: `${16 + Math.floor(Math.random() * 8)}s`,
            delta: `+${1 + Math.floor(Math.random() * 5)}%`,
            health: "warn",
          },
          {
            label: "Stock Mismatch",
            value: `${Math.floor(Math.random() * 2)}`,
            delta: `${Math.random() > 0.7 ? "+1" : "0"}`,
            health: "ok",
          },
          {
            label: "Blocked Ports",
            value: `${Math.floor(Math.random() * 3)}`,
            delta: `${Math.random() > 0.5 ? "+1" : "0"}`,
            health: "warn",
          },
        ],
      };
    }

    const uptime = 96 + Math.random() * 1.8;
    const eqHealth: HealthLevel = uptime < 97 ? "warn" : "ok";
    return {
      ...topic,
      health: eqHealth,
      kpis: [
        {
          label: "Equipment Uptime",
          value: `${uptime.toFixed(1)}%`,
          delta: `${Math.random() > 0.5 ? "-" : "+"}${(Math.random() * 0.8).toFixed(1)}%p`,
          health: eqHealth,
        },
        {
          label: "Top Downtime",
          value: "EQ-23",
          delta: `${16 + Math.floor(Math.random() * 12)}m`,
          health: "critical",
        },
        {
          label: "Bay WIP Balance",
          value: (1.2 + Math.random() * 0.4).toFixed(2),
          delta: `+${(Math.random() * 0.2).toFixed(2)}`,
          health: "warn",
        },
        {
          label: "Dispatch Delay",
          value: `${13 + Math.floor(Math.random() * 8)}s`,
          delta: `+${2 + Math.floor(Math.random() * 6)}s`,
          health: "warn",
        },
        {
          label: "Critical by Bay",
          value: "Bay-2",
          delta: `${1 + Math.floor(Math.random() * 3)}건`,
          health: "critical",
        },
      ],
    };
  });
}

const HELP_GUIDE: Record<Topic["id"], HelpGuide> = {
  system: {
    insight: [
      "Alarm Rate와 Critical Alarm이 같이 증가하면 전역 장애 확산 가능성이 큽니다.",
      "Downtime이 증가하면 실제 생산 영향이 커졌다는 뜻입니다.",
      "MTTD는 낮고 MTTR이 높으면 감지는 빠르지만 복구 절차가 병목일 수 있습니다.",
      "Availability는 보조 지표로 두고 Incident/Downtime과 함께 해석해야 정확합니다.",
    ],
    actions: [
      "Critical 이벤트 설비를 우선 격리하고 연관 알람 묶음을 확인하세요.",
      "복구 지연 구간(Triage/승인/현장조치) 중 어느 단계가 긴지 체크하세요.",
      "동일 유형 알람 재발 시 임시 조치 대신 영구 조치 티켓을 생성하세요.",
    ],
  },
  oht: {
    insight: [
      "Lead Time P95와 Queue Length가 같이 상승하면 경로 정체가 진행 중입니다.",
      "Retry Hotspot이 특정 Zone에 집중되면 센서/경로 설정 이상 가능성이 큽니다.",
      "Utilization이 90% 근접 상태에서 변동성이 커지면 급격한 지연이 발생할 수 있습니다.",
    ],
    actions: [
      "혼잡 Zone의 우회 경로를 우선 적용하고, 실패 재시도 간격을 조정하세요.",
      "상위 Retry Zone의 설비 상태와 인터락 로그를 함께 점검하세요.",
      "피크 시간대에 Dispatch 정책을 보수적으로 전환해 큐 폭증을 완화하세요.",
    ],
  },
  stk: {
    insight: [
      "Capacity Usage 80% 이상과 Wait Time 상승이 동반되면 포화 임박 신호입니다.",
      "Throughput 감소가 지속되면 입출고 경로나 포트 가용성 이슈일 가능성이 큽니다.",
      "Stock Mismatch는 작아도 반복되면 데이터 정합성 문제로 이어집니다.",
    ],
    actions: [
      "적재율 상위 STK를 우선 분산하고, 저부하 STK로 워크로드를 재배치하세요.",
      "Blocked Port의 원인(기계/통신/작업대기)을 분리해 즉시 해소하세요.",
      "Mismatch 발생 시 재고 동기화 배치를 즉시 실행하고 원인 로그를 추적하세요.",
    ],
  },
  "eq-bay": {
    insight: [
      "Bay Map에서 경고/치명 셀이 군집되면 구역 단위 병목 가능성이 큽니다.",
      "Top Downtime 설비가 고정되면 단건 고장이 아닌 구조적 이슈일 수 있습니다.",
      "Dispatch Delay 상승은 Bay WIP 불균형과 함께 보는 것이 효과적입니다.",
    ],
    actions: [
      "치명 셀이 있는 Bay를 우선으로 WIP 유입을 제한하고 우회 투입을 적용하세요.",
      "Downtime 상위 EQ에 대해 최근 유지보수/부품 교체 이력을 확인하세요.",
      "Bay 간 WIP 편차를 기준으로 Dispatch 우선순위를 재조정하세요.",
    ],
  },
};

const TOPICS: Topic[] = [
  {
    id: "system",
    title: "System",
    subtitle: "전체 상태 모니터링",
    icon: <FiActivity size={72} />,
    health: "warn",
    kpis: [
      { label: "Alarm Rate", value: "18/h", delta: "+12%", health: "warn" },
      { label: "Downtime (1h)", value: "31m", delta: "+6m", health: "warn" },
      { label: "MTTD", value: "42s", delta: "-8%", health: "ok" },
      { label: "MTTR", value: "6m 30s", delta: "+14%", health: "warn" },
      {
        label: "Availability",
        value: "99.21%",
        delta: "-0.2%p",
        health: "warn",
      },
    ],
  },
  {
    id: "oht",
    title: "OHT",
    subtitle: "이송 성능 및 정체",
    icon: <FiTruck size={72} />,
    health: "critical",
    kpis: [
      {
        label: "Lead Time P95",
        value: "28s",
        delta: "+21%",
        health: "critical",
      },
      { label: "Queue Length", value: "37", delta: "+11", health: "critical" },
      {
        label: "Congestion Index",
        value: "0.81",
        delta: "+0.19",
        health: "warn",
      },
      {
        label: "Retry Moves",
        value: "14/h",
        delta: "+8/h",
        health: "critical",
      },
      { label: "Utilization", value: "87%", delta: "+5%p", health: "warn" },
    ],
  },
  {
    id: "stk",
    title: "STK",
    subtitle: "재고 및 입출고 병목",
    icon: <FiBox size={72} />,
    health: "ok",
    kpis: [
      { label: "Capacity Usage", value: "76%", delta: "+2%p", health: "ok" },
      {
        label: "In/Out Throughput",
        value: "412/h",
        delta: "-3%",
        health: "ok",
      },
      { label: "Wait Time P95", value: "19s", delta: "+4%", health: "warn" },
      { label: "Stock Mismatch", value: "0", delta: "0", health: "ok" },
      { label: "Blocked Ports", value: "1", delta: "+1", health: "warn" },
    ],
  },
  {
    id: "eq-bay",
    title: "EQ / Bay",
    subtitle: "설비 가용률 및 베이 편차",
    icon: <FiCpu size={72} />,
    health: "warn",
    kpis: [
      {
        label: "Equipment Uptime",
        value: "96.8%",
        delta: "-0.7%p",
        health: "warn",
      },
      {
        label: "Top Downtime",
        value: "EQ-23",
        delta: "22m",
        health: "critical",
      },
      {
        label: "Bay WIP Balance",
        value: "1.42",
        delta: "+0.21",
        health: "warn",
      },
      { label: "Dispatch Delay", value: "17s", delta: "+6s", health: "warn" },
      {
        label: "Critical by Bay",
        value: "Bay-2",
        delta: "3건",
        health: "critical",
      },
    ],
  },
];

function healthClass(health: HealthLevel): string {
  if (health === "critical") return "kpi-critical";
  if (health === "warn") return "kpi-warn";
  return "kpi-ok";
}

function HelpDrawer({
  title,
  insight,
  action,
  formula,
}: {
  title: string;
  insight: string;
  action: string;
  formula?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mini-help-btn"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "닫기" : "도움말"}
      </button>
      {open && (
        <aside className="widget-help-drawer" aria-label={`${title} 도움말`}>
          <p className="help-mini-title">{title}</p>
          <p className="help-mini-label">무엇을 알 수 있나</p>
          <p className="help-mini-text">{insight}</p>
          <p className="help-mini-label">권장 조치</p>
          <p className="help-mini-text">{action}</p>
          {formula ? (
            <>
              <p className="help-mini-label">계산법</p>
              <p className="help-mini-text">{formula}</p>
            </>
          ) : null}
        </aside>
      )}
    </>
  );
}

function MetricCard({
  item,
  insight,
  action,
  formula,
}: {
  item: KpiItem;
  insight: string;
  action: string;
  formula?: string;
}) {
  return (
    <article className={`kpi-card ${healthClass(item.health)}`}>
      <div className="widget-head">
        <p className="label">{item.label}</p>
        <HelpDrawer
          title={item.label}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <p className="value">{item.value}</p>
      <p className="delta">{item.delta}</p>
    </article>
  );
}

function SparkBars({
  title,
  values,
  insight,
  action,
  formula,
}: {
  title: string;
  values: number[];
  insight: string;
  action: string;
  formula?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="spark-bars">
        {values.map((v, idx) => (
          <div key={`${title}-${idx}`} className="spark-bar-wrap">
            <div
              className="spark-bar"
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

function AlarmTypeBars({
  title,
  faultValues,
  warningValues,
  insight,
  action,
  formula,
}: {
  title: string;
  faultValues: number[];
  warningValues: number[];
  insight: string;
  action: string;
  formula?: string;
}) {
  const merged = faultValues.map((v, i) => v + (warningValues[i] ?? 0));
  const max = Math.max(...merged, 1);
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="alarm-legend">
        <span>
          <i className="fault" /> Fault
        </span>
        <span>
          <i className="warning" /> Warning
        </span>
      </div>
      <div className="spark-bars">
        {merged.map((sum, idx) => (
          <div key={`${title}-${idx}`} className="spark-bar-wrap stacked">
            <div
              className="spark-bar warning"
              style={{ height: `${((warningValues[idx] ?? 0) / max) * 100}%` }}
            />
            <div
              className="spark-bar fault"
              style={{ height: `${((faultValues[idx] ?? 0) / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

function StkInOutBars({
  title,
  inValues,
  outValues,
  insight,
  action,
  formula,
}: {
  title: string;
  inValues: number[];
  outValues: number[];
  insight: string;
  action: string;
  formula?: string;
}) {
  const peak = Math.max(...inValues, ...outValues, 1);
  const latestIn = inValues[inValues.length - 1] ?? 0;
  const latestOut = outValues[outValues.length - 1] ?? 0;
  const net = latestIn - latestOut;

  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="alarm-legend">
        <span>
          <i className="inflow" /> In
        </span>
        <span>
          <i className="outflow" /> Out
        </span>
      </div>
      <div className="spark-bars">
        {inValues.map((v, idx) => (
          <div key={`stk-io-${idx}`} className="spark-bar-wrap dual">
            <div
              className="spark-bar in"
              style={{ height: `${(v / peak) * 100}%` }}
            />
            <div
              className="spark-bar out"
              style={{ height: `${((outValues[idx] ?? 0) / peak) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="stat-chip-row">
        <span className="stat-chip">In {latestIn}/h</span>
        <span className="stat-chip">Out {latestOut}/h</span>
        <span className={`stat-chip ${net > 20 ? "kpi-warn" : ""}`}>
          Net {net >= 0 ? "+" : ""}
          {net}/h
        </span>
      </div>
    </article>
  );
}

function StkPortFlowTable({
  title,
  rows,
  insight,
  action,
  formula,
}: {
  title: string;
  rows: Array<{ port: string; inQty: number; outQty: number; stock: number }>;
  insight: string;
  action: string;
  formula?: string;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  const rankedByNet = [...rows]
    .map((row) => ({ ...row, net: row.inQty - row.outQty }))
    .sort((a, b) => b.net - a.net);

  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl || typeof ResizeObserver === "undefined") return;

    const recalc = () => {
      const cardH = cardEl.clientHeight;
      const headH = headRef.current?.clientHeight ?? 26;
      const available = Math.max(56, cardH - headH - 18);
      const rowH = 56;
      setVisibleCount(Math.max(1, Math.floor(available / rowH)));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(cardEl);
    if (headRef.current) observer.observe(headRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleRows = rankedByNet.slice(0, visibleCount);
  const hiddenCount = Math.max(0, rankedByNet.length - visibleRows.length);

  return (
    <article ref={cardRef} className="widget-card port-flow-card">
      <div ref={headRef} className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="port-flow-list">
        {visibleRows.map((row) => {
          const net = row.net;
          return (
            <div key={row.port} className="port-flow-row">
              <div className="port-head">
                <span className="port-id">{row.port}</span>
                <span className={`port-net ${net > 0 ? "kpi-warn" : "kpi-ok"}`}>
                  Net {net >= 0 ? "+" : ""}
                  {net}
                </span>
              </div>
              <p className="port-io">
                In {row.inQty} / Out {row.outQty}
              </p>
              <p className="port-stock">Stock {row.stock}</p>
            </div>
          );
        })}
        {hiddenCount > 0 ? <p className="port-more">+{hiddenCount} more</p> : null}
      </div>
    </article>
  );
}

function LineTrendStats({
  title,
  values,
  avg,
  p99,
  insight,
  action,
  formula,
}: {
  title: string;
  values: number[];
  avg: number;
  p99: number;
  insight: string;
  action: string;
  formula?: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((v - min) / Math.max(max - min, 1)) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const pointCoords = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * 100;
    const y = 100 - ((v - min) / Math.max(max - min, 1)) * 100;
    return { x, y, v };
  });
  const last = pointCoords[pointCoords.length - 1];

  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>

      <div className="line-trend-wrap">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="line-trend-svg"
        >
          <polyline points={points} className="line-trend-path" />
          {pointCoords.map((p, idx) => (
            <circle
              key={`p95-point-${idx}`}
              cx={p.x}
              cy={p.y}
              r={idx === pointCoords.length - 1 ? 2 : 1.4}
              className={
                idx === pointCoords.length - 1
                  ? "line-point latest"
                  : "line-point"
              }
            />
          ))}
        </svg>
      </div>
      <p className="trend-latest">최신 지점 P95: {last?.v}s</p>
      <div className="stat-chip-row">
        <span className="stat-chip">평균 {avg}s</span>
        <span className="stat-chip kpi-warn">
          상위 5% 경계 {values[values.length - 1]}s
        </span>
        <span className="stat-chip kpi-critical">상위 1% 경계 {p99}s</span>
      </div>
    </article>
  );
}

function AlertList({
  title,
  items,
  insight,
  action,
  formula,
}: {
  title: string;
  items: Array<{ name: string; desc: string; health: HealthLevel }>;
  insight: string;
  action: string;
  formula?: string;
}) {
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <ul className="alert-list">
        {items.map((item) => (
          <li key={item.name} className="alert-item">
            <span className={`dot ${healthClass(item.health)}`} />
            <div>
              <p className="name">{item.name}</p>
              <p className="desc">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function UtilGauge({
  title,
  percent,
  insight,
  action,
  formula,
}: {
  title: string;
  percent: number;
  insight: string;
  action: string;
  formula?: string;
}) {
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="gauge-wrap">
        <div className="gauge-track">
          <div className="gauge-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="gauge-text">{percent}%</p>
      </div>
    </article>
  );
}

function BayMap({
  title,
  cells,
  insight,
  action,
  formula,
}: {
  title: string;
  cells: Array<{ id: string; health: HealthLevel }>;
  insight: string;
  action: string;
  formula?: string;
}) {
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="bay-map">
        {cells.map((cell) => (
          <div key={cell.id} className={`bay-cell ${healthClass(cell.health)}`}>
            {cell.id}
          </div>
        ))}
      </div>
    </article>
  );
}

function WorkloadByRoute({
  title,
  rows,
  insight,
  action,
  formula,
}: {
  title: string;
  rows: Array<{ route: string; moves: number }>;
  insight: string;
  action: string;
  formula?: string;
}) {
  const max = Math.max(...rows.map((row) => row.moves), 1);
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <div className="route-load-list">
        {rows.map((row) => (
          <div key={row.route} className="route-load-row">
            <span className="route-name">{row.route}</span>
            <div className="route-load-track">
              <div
                className="route-load-fill"
                style={{ width: `${(row.moves / max) * 100}%` }}
              />
            </div>
            <span className="route-moves">{row.moves}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function VehicleTopList({
  title,
  rows,
  insight,
  action,
  formula,
}: {
  title: string;
  rows: Array<{
    vehicle: string;
    moves: number;
    share: string;
    health: HealthLevel;
  }>;
  insight: string;
  action: string;
  formula?: string;
}) {
  return (
    <article className="widget-card">
      <div className="widget-head">
        <h3>{title}</h3>
        <HelpDrawer
          title={title}
          insight={insight}
          action={action}
          formula={formula}
        />
      </div>
      <ul className="vehicle-top-list">
        {rows.map((row) => (
          <li key={row.vehicle} className="vehicle-top-item">
            <span className={`dot ${healthClass(row.health)}`} />
            <span className="vehicle-id">{row.vehicle}</span>
            <span className="vehicle-moves">{row.moves} moves</span>
            <span className="vehicle-share">{row.share}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TopicWidgets({
  topic,
  ohtRealtime,
  ohtAvg,
  ohtP99,
  realtime,
}: {
  topic: Topic;
  ohtRealtime: OhtRealtime;
  ohtAvg: number;
  ohtP99: number;
  realtime: DashboardRealtime;
}) {
  if (topic.id === "system") {
    return (
      <div className="widget-grid">
        <AlarmTypeBars
          title="Fault / Warning Alarm Trend (1분 버킷)"
          faultValues={realtime.systemFaultTrend}
          warningValues={realtime.systemWarningTrend}
          insight="Fault가 급증하면 즉시 장애 대응이 필요하고, Warning 우상향은 장애 전조일 가능성이 큽니다."
          action="Fault 상위 설비를 우선 격리하고 Warning 증감이 큰 구간을 선조치하세요."
          formula="분당 Count = 해당 1분에 발생한 타입별 알람 건수 합"
        />
        <AlertList
          title="Critical Events"
          items={[...realtime.systemEvents]}
          insight="치명 이벤트가 특정 설비에 반복되면 연쇄 장애 가능성이 높습니다."
          action="반복되는 설비를 우선 격리하고 최근 30분 로그를 우선 분석하세요."
          formula="Critical Event = Severity가 Critical인 이벤트 목록(최신순)"
        />
        <MetricCard
          item={topic.kpis[0]}
          insight="알람율이 평소 대비 급증하면 장애 전조일 가능성이 큽니다."
          action="급증 시간대의 공통 원인(설비/구간/명령 유형)을 먼저 분리하세요."
          formula="Alarm Rate = (최근 1시간 알람 수) / 1h"
        />
        <MetricCard
          item={topic.kpis[1]}
          insight="다운타임 누적시간은 실제 생산 손실과 가장 직결되는 지표입니다."
          action="Downtime 상위 원인(설비/구역/유형)을 먼저 제거해 손실을 줄이세요."
          formula="Downtime(분) = 기간 내 비가동 이벤트 지속시간 합"
        />
      </div>
    );
  }

  if (topic.id === "oht") {
    return (
      <div className="widget-grid">
        <LineTrendStats
          title="Lead Time Percentile Trend"
          values={ohtRealtime.p95Series}
          avg={ohtAvg}
          p99={ohtP99}
          insight="P95 상승은 일부 경로에서 지연 꼬리가 길어지고 있다는 신호입니다."
          action="지연 상위 경로를 우회하고 피크 시간 디스패치 조건을 완화하세요."
          formula="P95 = 1분 버킷 Lead Time 분포의 95백분위, P99 = 99백분위"
        />
        <WorkloadByRoute
          title="Route Throughput Share"
          rows={ohtRealtime.routeLoads}
          insight="특정 경로 물동량 집중은 국소 병목과 지연 확산의 시작점이 됩니다."
          action="상위 경로에 우회 규칙을 추가하고 시간대별 분산 배치를 적용하세요."
          formula="Route Share = (해당 경로 moves / 전체 moves) x 100"
        />
        <MetricCard
          item={{
            label: "현재 대기 작업",
            value: `${ohtRealtime.queueLength}건`,
            delta: `${ohtRealtime.queueDelta >= 0 ? "+" : ""}${ohtRealtime.queueDelta} (1분)`,
            health: toHealthByQueue(ohtRealtime.queueLength),
          }}
          insight="Queue Length 증가는 처리능력 대비 유입 초과를 의미합니다."
          action="유입 속도 제한 또는 우선순위 재정렬로 큐를 먼저 안정화하세요."
          formula="Queue Length = 현재 미할당/미완료 이송 요청 건수"
        />
        <VehicleTopList
          title="Top Vehicle Workload"
          rows={ohtRealtime.vehicleLoads}
          insight="상위 차량 편중이 심하면 장애 시 영향 반경이 크게 확대됩니다."
          action="상위 차량에 편중된 디스패치를 완화하고 후보 차량 풀을 넓히세요."
          formula="Vehicle Share = (차량별 처리 moves / 전체 moves) x 100"
        />
      </div>
    );
  }

  if (topic.id === "stk") {
    return (
      <div className="widget-grid">
        <StkInOutBars
          title="In/Out Throughput (분리)"
          inValues={realtime.stkInSeries}
          outValues={realtime.stkOutSeries}
          insight="In 대비 Out이 지속적으로 낮으면 STK 내부에 WIP가 누적되는 신호입니다."
          action="Out 처리 경로와 포트 가용성을 우선 점검해 순유입 편차를 축소하세요."
          formula="In/Out Throughput = 단위시간당 In/Out 완료 건수, Net = In - Out"
        />
        <StkPortFlowTable
          title="Port별 In-Out Net Top"
          rows={realtime.stkPortFlows}
          insight="포트별 순유입(Net +)이 누적되면 해당 포트 중심 병목이 발생합니다."
          action="Net + 상위 포트는 유입 제한/유출 우선 처리로 재고를 먼저 낮추세요."
          formula="Port Net = Port In - Port Out, Port Stock은 해당 포트 적재 수량"
        />
      </div>
    );
  }

  return (
    <div className="widget-grid">
      <BayMap
        title="Bay Health Map"
        cells={[...realtime.eqBayCells]}
        insight="경고/치명 Bay가 군집되면 구역 단위 병목이 진행 중입니다."
        action="치명 Bay 유입을 제한하고 인접 Bay로 우회 투입을 적용하세요."
        formula="Bay Health = Bay 내 Critical/Warning 이벤트 집계 기반 상태 분류"
      />
      <AlertList
        title="Downtime Top"
        items={[...realtime.eqDowntimeTop]}
        insight="동일 설비가 반복 상위면 구조적 결함 가능성이 큽니다."
        action="해당 설비의 정비 이력과 최근 변경사항을 우선 검토하세요."
        formula="Downtime = 설비 비가동 이벤트 지속시간 누적"
      />
      <MetricCard
        item={topic.kpis[0]}
        insight="Uptime 하락은 라인 전체 생산성 저하로 이어집니다."
        action="다운타임 상위 설비를 즉시 우선 조치 대상으로 승격하세요."
        formula="Uptime(%) = (가동 시간 / 총 운영 시간) x 100"
      />
      <MetricCard
        item={topic.kpis[3]}
        insight="Dispatch Delay 상승은 Bay 불균형과 동반되는 경우가 많습니다."
        action="Bay별 WIP 편차를 기준으로 투입 우선순위를 재조정하세요."
        formula="Dispatch Delay = 작업 생성 시각 ~ 실제 투입 시각"
      />
    </div>
  );
}

export function SolarKpiDashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTopicId, setActiveTopicId] = useState<Topic["id"]>("system");
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastRefetchAt, setLastRefetchAt] = useState<Date>(new Date());
  const [isRefetching, setIsRefetching] = useState(false);
  const [refreshMs, setRefreshMs] = useState(60 * 1000);
  const [nextRefreshInSec, setNextRefreshInSec] = useState(60);
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [ohtRealtime, setOhtRealtime] = useState<OhtRealtime>(() =>
    createInitialOhtRealtime(),
  );
  const [realtime, setRealtime] = useState<DashboardRealtime>(() =>
    createInitialDashboardRealtime(),
  );

  const runRefetch = () => {
    setIsRefetching(true);
    setOhtRealtime((prev) => {
      const nextOht = simulateNextOhtRealtime(prev);
      setTopics((prevTopics) => simulateTopicRefresh(prevTopics, nextOht));
      return nextOht;
    });
    setRealtime((prev) => simulateNextDashboardRealtime(prev));
    setLastRefetchAt(new Date());
    setNextRefreshInSec(Math.ceil(refreshMs / 1000));
    setTimeout(() => setIsRefetching(false), 900);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      runRefetch();
    }, refreshMs);

    return () => clearInterval(interval);
  }, [refreshMs]);

  useEffect(() => {
    const reset = Math.ceil(refreshMs / 1000);
    setNextRefreshInSec(reset);
    const ticker = setInterval(() => {
      setNextRefreshInSec((prev) => (prev <= 1 ? reset : prev - 1));
    }, 1000);
    return () => clearInterval(ticker);
  }, [refreshMs]);

  const ohtAvg = useMemo(() => {
    const latestAvg = ohtRealtime.avgSeries[ohtRealtime.avgSeries.length - 1];
    return latestAvg ?? 0;
  }, [ohtRealtime.avgSeries]);

  const ohtP99 = useMemo(() => {
    const sorted = [...ohtRealtime.p95Series].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.99) - 1;
    return (sorted[Math.max(0, idx)] ?? sorted[sorted.length - 1] ?? 0) + 4;
  }, [ohtRealtime.p95Series]);

  const lastRefetchText = useMemo(() => {
    return lastRefetchAt.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastRefetchAt]);
  return (
    <main className={darkMode ? "app-theme dark" : "app-theme"}>
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div />
        </header>

        <div className="solar-classifier" aria-label="태양계 분류 네비게이션">
          <div className="classifier-meta">
            <div className="meta-line">
              Window: 최근 1시간 | Refresh: 1분 | Last sync: {lastRefetchText}
              <span
                className={`refetch-badge ${isRefetching ? "is-loading" : ""}`}
              >
                {isRefetching ? "Refetching..." : "Live"}
              </span>
              <span className="countdown-badge">Next: {nextRefreshInSec}s</span>
            </div>
            <div className="meta-actions">
              <button
                type="button"
                className="mini-action-btn"
                onClick={() => setDarkMode((v) => !v)}
              >
                {darkMode ? "Light" : "Dark"}
              </button>
              <button
                type="button"
                className="mini-action-btn"
                onClick={() => setHelpOpen((v) => !v)}
              >
                {helpOpen ? "도움말 닫기" : "도움말"}
              </button>
              <button
                type="button"
                className="mini-action-btn"
                onClick={runRefetch}
              >
                새로고침
              </button>
              <button
                type="button"
                className="mini-action-btn"
                onClick={() =>
                  setRefreshMs((v) => (v === 60 * 1000 ? 5000 : 60 * 1000))
                }
              >
                {refreshMs === 60 * 1000 ? "5초" : "1분"}
              </button>
            </div>
          </div>
          <div className="solar-center">AMHS</div>
          <div className="solar-orbits">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={`orbit-topic ${healthClass(topic.health)} ${
                  topic.id === activeTopicId ? "active" : ""
                }`}
                onClick={() => setActiveTopicId(topic.id)}
              >
                <span className="topic-icon">{topic.icon}</span>
                <span className="topic-label">{topic.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="topic-grid">
          {topics.map((topic) => (
            <section
              key={topic.id}
              className={`topic-panel ${healthClass(topic.health)} ${
                topic.id === activeTopicId ? "active" : ""
              }`}
            >
              <header className="topic-panel-header">
                <div className="topic-panel-title-wrap">
                  <div className="topic-panel-icon">{topic.icon}</div>
                  <div className="flex gap-2">
                    <h2 className="topic-panel-title">{topic.title}</h2>
                    <p className="topic-panel-subtitle">{topic.subtitle}</p>
                  </div>
                </div>
                <span className={`topic-health ${healthClass(topic.health)}`}>
                  {topic.health.toUpperCase()}
                </span>
              </header>

              <TopicWidgets
                topic={topic}
                ohtRealtime={ohtRealtime}
                ohtAvg={ohtAvg}
                ohtP99={ohtP99}
                realtime={realtime}
              />
            </section>
          ))}
        </div>

        {helpOpen && (
          <section className="help-panel" aria-live="polite">
            <h2>도움말: 무엇을 알 수 있고, 어떻게 조치할까</h2>
            <div className="help-grid">
              {topics.map((topic) => {
                const guide = HELP_GUIDE[topic.id];
                return (
                  <article
                    key={`help-${topic.id}`}
                    className={`help-card ${healthClass(topic.health)}`}
                  >
                    <header className="help-card-head">
                      <span className="help-icon">{topic.icon}</span>
                      <h3>{topic.title}</h3>
                    </header>
                    <p className="help-section-title">
                      이 화면으로 알 수 있는 것
                    </p>
                    <ul>
                      {guide.insight.map((line) => (
                        <li key={`${topic.id}-insight-${line}`}>{line}</li>
                      ))}
                    </ul>
                    <p className="help-section-title">권장 조치사항</p>
                    <ol>
                      {guide.actions.map((line) => (
                        <li key={`${topic.id}-action-${line}`}>{line}</li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
