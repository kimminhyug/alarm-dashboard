import type { ComponentProps } from "react";
import { XAxis as RechartsXAxis } from "recharts";

type RechartsXAxisProps = ComponentProps<typeof RechartsXAxis>;

export interface XAxisProps extends Omit<RechartsXAxisProps, "tickFormatter"> {
  /** 옵션: tick 포맷팅. hook(useUnitFormatter) 결과 주입용 */
  tickFormatter?: (value: unknown) => string;
}

/**
 * X축 래퍼. props 전달 + tickFormatter 통로.
 * Recharts XAxis는 직접 import하지 않고 이 컴포넌트만 사용한다.
 */
export function XAxis(props: XAxisProps) {
  return <RechartsXAxis {...props} />;
}
