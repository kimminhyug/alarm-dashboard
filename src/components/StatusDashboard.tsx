import React from "react";
import type { LayoutConfig, StatusDashboardProps } from "../types";
import { DEFAULT_LAYOUT_CONFIG } from "../types";
import { getLayoutPosition } from "../utils/layouts";
import { MainStatusShape } from "./MainStatusShape";
import { SubSystemNode } from "./SubSystemNode";
import { TrendChart } from "./TrendChart";

function mergeConfig(config?: Partial<LayoutConfig>): LayoutConfig {
  return { ...DEFAULT_LAYOUT_CONFIG, ...config };
}

function getNodeSize(total: number, config: LayoutConfig): number {
  const { nodeSizeMax, nodeSizeMin } = config;
  if (total <= 4) return Math.min(80, nodeSizeMax);
  if (total <= 8) return Math.min(60, nodeSizeMax);
  if (total <= 12) return Math.min(50, nodeSizeMax);
  if (total <= 20) return Math.min(40, nodeSizeMax);
  if (total <= 50) return Math.min(30, nodeSizeMax);
  return Math.max(24, nodeSizeMin);
}

export function StatusDashboard({
  data,
  layout = "circle",
  onSubsystemClick,
  config: configOverride,
}: StatusDashboardProps) {
  const { system_status, subsystems } = data;
  const config = mergeConfig(configOverride);

  const getSubSystemPosition = (index: number, total: number) =>
    getLayoutPosition(layout, index, total, config);

  const nodeSize = getNodeSize(subsystems.length, config);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Main status visualization area */}
      <div className="relative w-full max-w-5xl aspect-square">
        {/* Connection lines from subsystems to center */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${config.layoutHalfSize * 2} ${
            config.layoutHalfSize * 2
          }`}
        >
          <g
            transform={`translate(${config.layoutHalfSize}, ${config.layoutHalfSize})`}
          >
            {subsystems.map((subsystem, index) => {
              const pos = getSubSystemPosition(index, subsystems.length);
              return (
                <line
                  key={subsystem.id}
                  x1="0"
                  y1="0"
                  x2={pos.x}
                  y2={pos.y}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.3"
                />
              );
            })}
          </g>
        </svg>

        {/* Central main status shape */}
        <MainStatusShape status={system_status} />

        {/* Subsystem nodes positioned around the main shape */}
        {subsystems.map((subsystem, index) => {
          const pos = getSubSystemPosition(index, subsystems.length);
          return (
            <SubSystemNode
              key={subsystem.id}
              id={subsystem.id}
              status={subsystem.status}
              x={pos.x}
              y={pos.y}
              size={nodeSize}
              layoutHalfSize={config.layoutHalfSize}
              nodeSizeMin={config.nodeSizeMin}
              nodeSizeMax={config.nodeSizeMax}
              nodeSizeVmin={config.nodeSizeVmin}
              onClick={
                onSubsystemClick ? () => onSubsystemClick(subsystem) : undefined
              }
            />
          );
        })}
      </div>

      {/* Bottom trend chart */}
      <div className="w-full max-w-4xl mt-8">
        <TrendChart />
      </div>
    </div>
  );
}
