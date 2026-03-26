import React, { useEffect, useMemo, useState } from "react";
import { createDashboard2MockResponse, tickDashboard2Mock } from "../mocks/dashboard2Mock";
import type { Dashboard2ApiResponse, DashboardHelpContent, DashboardMetricValue } from "../types";

function toGauge(valueText: string): number {
  const parsed = Number.parseFloat(valueText.replace(/[^\d.]/g, ""));
  if (Number.isNaN(parsed)) return 40;
  if (valueText.includes("%")) return Math.max(8, Math.min(100, parsed));
  if (valueText.includes("m")) return Math.max(8, Math.min(100, parsed * 2));
  if (valueText.includes("s")) return Math.max(8, Math.min(100, parsed * 2.5));
  if (valueText.includes("/h")) return Math.max(8, Math.min(100, parsed / 5));
  return Math.max(8, Math.min(100, parsed));
}

function linePath(values: number[], max = Math.max(...values, 1)): string {
  return values
    .map((v, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

function D2Help({ title, help }: { title: string; help: DashboardHelpContent }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="d2-help-wrap">
      <button type="button" className="d2-help-btn" onClick={() => setOpen((v) => !v)}>
        {open ? "닫기" : "도움말"}
      </button>
      {open ? (
        <aside className="d2-help-drawer" aria-label={`${title} 도움말`}>
          <p className="d2-help-title">{title}</p>
          <p className="d2-help-label">설명</p>
          <p className="d2-help-text">{help.explain}</p>
          <p className="d2-help-label">조치사항</p>
          <p className="d2-help-text">{help.action}</p>
          <p className="d2-help-label">계산법</p>
          <p className="d2-help-text">{help.formula}</p>
        </aside>
      ) : null}
    </div>
  );
}

function makeKpiHelp(name: string): DashboardHelpContent {
  return {
    explain: `${name} 지표의 현재 상태와 기준 대비 변화를 확인합니다.`,
    action: `${name}이(가) 기준을 벗어나면 상위 영향 설비/구간을 먼저 분리하고 즉시 조치하세요.`,
    formula: `${name} = 운영 기준에 따라 집계된 현재 값(최근 1시간 또는 실시간)`,
  };
}

export function Dashboard2() {
  const [now, setNow] = useState(new Date());
  const [api, setApi] = useState<Dashboard2ApiResponse>(() => createDashboard2MockResponse());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    const rt = setInterval(() => setApi((prev) => tickDashboard2Mock(prev)), 3000);
    return () => {
      clearInterval(tick);
      clearInterval(rt);
    };
  }, []);

  const timeText = useMemo(
    () =>
      now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now],
  );
  const dateText = useMemo(
    () =>
      now.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [now],
  );

  const metricMap = useMemo(() => {
    return new Map(api.data.metricValues.map((m) => [m.key, m] as const));
  }, [api.data.metricValues]);

  const leftGroups = api.data.leftMetricGroups.map((g) => ({
    ...g,
    metrics: g.metricKeys
      .map((k) => metricMap.get(k))
      .filter((m): m is DashboardMetricValue => Boolean(m)),
  }));
  const centerTarget = api.data.centerTrend.targetSeries.points.map((pt) => pt.value);
  const centerActual = api.data.centerTrend.actualSeries.points.map((pt) => pt.value);
  const ticker = api.data.ticker[0];

  return (
    <main className="d2-root">
      <section className="d2-shell">
        <header className="d2-header">
          <div className="d2-brand">AMHS</div>
          <h1>{api.data.title}</h1>
          <div className="d2-header-badges">
            <span>OK</span>
            <span>Warn</span>
            <span>Critical</span>
          </div>
        </header>

        <section className="d2-main-grid">
          <aside className="d2-left">
            {leftGroups.map((group) => (
              <article key={group.id} className="d2-panel">
                <div className="d2-row-head">
                  <h3>{group.title}</h3>
                  <D2Help
                    title={group.title}
                    help={{
                      explain: `${group.title}의 핵심 지표를 한 화면에서 빠르게 점검합니다.`,
                      action: `경고/치명 수치가 많은 지표부터 우선 조치하고 연관 이벤트를 함께 확인하세요.`,
                      formula: `Top5 = 주요 운영 지표 5개를 우선순위로 표시`,
                    }}
                  />
                </div>
                <ul className="d2-top-list">
                  {group.metrics.map((item) => (
                    <li key={`${group.id}-${item.key}`}>
                      <div className="d2-item-head">
                        <span>{api.data.metricCatalog.find((c) => c.key === item.key)?.label ?? item.key}</span>
                        <div className="d2-item-right">
                          <strong className="d2-mem">{item.displayValue}</strong>
                          <D2Help
                            title={api.data.metricCatalog.find((c) => c.key === item.key)?.label ?? item.key}
                            help={makeKpiHelp(api.data.metricCatalog.find((c) => c.key === item.key)?.label ?? item.key)}
                          />
                        </div>
                      </div>
                      <div className="d2-meter">
                        <div
                          className="d2-meter-fill d2-mem"
                          style={{ width: `${item.progressPct ?? toGauge(item.displayValue)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </aside>

          <section className="d2-center">
            <article className="d2-center-hero d2-panel">
              <div className="d2-clock-core d2-clock-core-sm">
                <span className="d2-clock-label">LIVE</span>
                <strong>{timeText}</strong>
                <small>{dateText}</small>
              </div>
              <div className="d2-goal-grid">
                {api.data.goalCards.map((goal) => (
                  <article key={goal.key} className="d2-goal-card">
                    <div className="d2-goal-head">
                      <p>{goal.title}</p>
                      <D2Help title={goal.title} help={goal.help} />
                    </div>
                    <div className="d2-goal-meta">
                      <span>목표 {goal.metric.targetDisplay ?? "-"}</span>
                      <strong>{goal.metric.displayValue}</strong>
                    </div>
                    <div className="d2-goal-track">
                      <div className="d2-goal-fill" style={{ width: `${goal.metric.progressPct ?? 0}%` }} />
                    </div>
                    <p className="d2-goal-rate">달성률 {goal.metric.progressPct ?? 0}%</p>
                  </article>
                ))}
              </div>
              <article className="d2-goal-trend">
                <div className="d2-goal-trend-head">
                  <h3>목표 대비 달성 추이 (최근 1시간)</h3>
                  <D2Help title="목표 대비 달성 추이" help={api.data.centerTrend.help} />
                </div>
                <div className="d2-goal-legend">
                  <span className="target">Target</span>
                  <span className="actual">Actual</span>
                </div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="d2-goal-svg">
                  <polyline className="target" points={linePath(centerTarget, 100)} />
                  <polyline className="actual" points={linePath(centerActual, 100)} />
                </svg>
              </article>
              <div className="d2-center-metrics">
                {(["alarmRate", "queueLength", "capacityUsage", "equipmentUptime"] as const).map((key) => {
                  const metric = metricMap.get(key);
                  const label = api.data.metricCatalog.find((c) => c.key === key)?.label ?? key;
                  return (
                    <div key={key} className="d2-mini-tile">
                      <span>{label}</span>
                      <strong>{metric?.displayValue ?? "-"}</strong>
                    </div>
                  );
                })}
              </div>
            </article>

            <div className="d2-bottom-cards">
              {api.data.summaryCards.map((card) => (
                <article key={card.id} className="d2-panel">
                  <div className="d2-row-head">
                    <h3>{card.title}</h3>
                    <D2Help title={card.title} help={card.help} />
                  </div>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="d2-right">
            {api.data.rightTrendPanels.map((panel) => {
              const values = panel.series.points.map((pt) => pt.value);
              return (
              <article key={panel.key} className="d2-panel">
                <div className="d2-row-head">
                  <h3>{panel.title}</h3>
                  <D2Help title={panel.title} help={panel.help} />
                </div>
                <p className="d2-sub">{panel.subtitle}</p>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="d2-line-svg">
                  <polyline points={linePath(values)} />
                </svg>
                <div className="d2-line-stats">
                  <span>Now {panel.stats.now}</span>
                  <span>Avg {panel.stats.avg}</span>
                  <span>Peak {panel.stats.peak}</span>
                </div>
              </article>
            )})}
          </aside>
        </section>

        <footer className="d2-event-ticker d2-panel">
          <span className="d2-dot" />
          {ticker?.help ? <D2Help title="이벤트 티커" help={ticker.help} /> : null}
          <p>{dateText} {timeText} [ALARM] {ticker?.message ?? "-"}</p>
        </footer>
      </section>
    </main>
  );
}
