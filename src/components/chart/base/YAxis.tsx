import type { ComponentProps } from "react";
import { YAxis as RechartsYAxis } from "recharts";

type RechartsYAxisProps = ComponentProps<typeof RechartsYAxis>;

export interface YAxisProps extends Omit<RechartsYAxisProps, "tickFormatter"> {
  /** 옵션: tick 포맷팅. useUnitFormatter 결과 주입용 */
  tickFormatter?: (value: unknown) => string;
}

/**
 * Y축 래퍼. props 전달 + tickFormatter 통로.
 * Recharts YAxis는 직접 import하지 않고 이 컴포넌트만 사용한다.
 */
export function YAxis(props: YAxisProps) {
  return <RechartsYAxis {...props} />;
}
