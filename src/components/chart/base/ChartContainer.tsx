import React, { type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  children?: ReactNode;
  width?: string | number;
  height?: string | number;
  minWidth?: number;
  minHeight?: number;
}

/**
 * 차트를 감싸는 반응형 컨테이너.
 * Recharts ResponsiveContainer 래퍼.
 */
export function ChartContainer({
  children,
  width = "100%",
  height = "100%",
  minWidth,
  minHeight,
}: ChartContainerProps) {
  return (
    <ResponsiveContainer
      width={width}
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
    >
      {children}
    </ResponsiveContainer>
  );
}
