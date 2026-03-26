import { useCallback, useState } from "react";
import type { DrilldownLevel, DrilldownSpec } from "../types/chartSpec";

/**
 * 드릴다운 상태는 위젯 단위에서 관리하되, 로직은 이 hook으로 분리.
 * - bar/point 클릭 시 drillDown(clickedKey) 호출 → 해당 기간만 필터된 하위 단위 표시
 * - 최하위(hour)에서는 drillDown 불가
 * - drillUp은 상위 위젯 컨트롤에서만 호출
 */
export function useDrilldown(spec: DrilldownSpec | undefined) {
  const levels = spec?.levels ?? [];
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  /** 클릭한 구간 경로. [월키, 주키?, 일키?, 시키?] → 해당 구간만 필터 */
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const level: DrilldownLevel | undefined = levels[currentLevelIndex];
  const canDrillDown = currentLevelIndex < levels.length - 1;

  const drillDown = useCallback(
    (clickedKey: string) => {
      setSelectedPath((prev) => [...prev, clickedKey]);
      setCurrentLevelIndex((i) => Math.min(i + 1, levels.length - 1));
    },
    [levels.length],
  );

  const drillUp = useCallback(() => {
    setCurrentLevelIndex((i) => Math.max(i - 1, 0));
    setSelectedPath((prev) => prev.slice(0, -1));
  }, []);

  return {
    level,
    /** 클릭으로 선택된 상위 구간들. useChartData에서 이 구간만 필터해 집계 */
    selectedPath,
    currentLevelIndex,
    canDrillDown,
    drillDown,
    drillUp,
  };
}
