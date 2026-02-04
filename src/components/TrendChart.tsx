import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { TrendDataPoint } from "../types";

export function TrendChart() {
  const trendData = useMemo<TrendDataPoint[]>(() => {
    const data: TrendDataPoint[] = [];
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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="severityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#facc15" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[0, 2]} />
            <Area
              type="monotone"
              dataKey="severity"
              stroke="#64748b"
              strokeWidth={1}
              fill="url(#severityGradient)"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
