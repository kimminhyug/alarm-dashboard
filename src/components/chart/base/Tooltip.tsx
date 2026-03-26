import React, { type ComponentProps } from "react";
import { Tooltip as RechartsTooltip } from "recharts";

type RechartsTooltipProps = ComponentProps<typeof RechartsTooltip>;

export interface TooltipProps
  extends Omit<
    RechartsTooltipProps,
    "formatter" | "labelFormatter" | "content"
  > {
  /** 값 포맷팅. useUnitFormatter 등에서 주입 */
  formatter?: (
    value: unknown,
    name: string,
    props: unknown
  ) => [string, string] | string;
  /** 라벨(예: x값) 포맷팅 */
  labelFormatter?: (label: unknown, payload: unknown[]) => React.ReactNode;
}

/**
 * 툴팁 래퍼. formatter / labelFormatter 통로.
 * 실제 포맷팅은 hook에서 처리한다.
 */
export function Tooltip(props: TooltipProps) {
  return <RechartsTooltip {...props} />;
}
