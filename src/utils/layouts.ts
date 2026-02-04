import type { LayoutConfig, LayoutType } from "../types";
import { DEFAULT_LAYOUT_CONFIG } from "../types";

export type Position = { x: number; y: number };

function withConfig(config?: Partial<LayoutConfig>): LayoutConfig {
  return { ...DEFAULT_LAYOUT_CONFIG, ...config };
}

/** 중심에서 (x,y)까지 거리 */
function dist(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

/** (x,y)가 centerRadius 안쪽이면 밖으로 밀어냄 */
function clampOutsideCenter(
  x: number,
  y: number,
  centerRadius: number
): Position {
  const d = dist(x, y);
  if (d < centerRadius) {
    if (d === 0) return { x: centerRadius, y: 0 };
    const scale = centerRadius / d;
    return { x: x * scale, y: y * scale };
  }
  return { x, y };
}

/** 원형 배치 시 노드끼리 겹치지 않는 최소 반지름 (인접 노드 간 chord >= minSpacing) */
function minRadiusForCircle(
  total: number,
  minSpacing: number,
  centerRadius: number,
  layoutHalfSize: number
): number {
  if (total <= 0) return centerRadius;
  const chord = minSpacing;
  const rFromChord = chord / (2 * Math.sin(Math.PI / total));
  const r = Math.max(centerRadius, rFromChord);
  return Math.min(r, layoutHalfSize - 40);
}

/** circle: 중심 기준 원형 배치, 노드 간격·중앙 도형 반경 준수 */
export function layoutCircle(
  index: number,
  total: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Position {
  const { centerShapeRadius, minNodeSpacing, layoutHalfSize } = config;
  const radius = minRadiusForCircle(
    total,
    minNodeSpacing,
    centerShapeRadius,
    layoutHalfSize
  );
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/** grid: 셀 크기 >= minNodeSpacing (가로·세로 모두), 중앙 도형 안쪽 셀은 밖으로 밀어냄 */
export function layoutGrid(
  index: number,
  total: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Position {
  const { centerShapeRadius, minNodeSpacing, layoutHalfSize } = config;
  const size = layoutHalfSize * 2 * 0.9;
  const maxCols = Math.max(1, Math.floor(size / minNodeSpacing));
  const maxRows = Math.max(1, Math.floor(size / minNodeSpacing));
  let cols = Math.min(Math.ceil(Math.sqrt(total)), maxCols);
  let rows = Math.ceil(total / cols);
  if (rows > maxRows) {
    rows = maxRows;
    cols = Math.ceil(total / rows);
  }
  const cellW = size / cols;
  const cellH = size / rows;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = (col - (cols - 1) / 2) * cellW;
  const y = (row - (rows - 1) / 2) * cellH;
  return clampOutsideCenter(x, y, centerShapeRadius);
}

/** arc: 아래쪽 반원 호, 노드 간격·중앙 반경 준수 */
export function layoutArc(
  index: number,
  total: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Position {
  const { centerShapeRadius, minNodeSpacing, layoutHalfSize } = config;
  const radius = minRadiusForCircle(
    Math.max(total, 1),
    minNodeSpacing,
    centerShapeRadius,
    layoutHalfSize
  );
  const angle = Math.PI * (index / Math.max(total - 1, 1)) - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/** ring: 안/바깥 링, 둘 다 중앙 도형 밖, 각 링에서 노드 간격 준수 */
export function layoutRing(
  index: number,
  total: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Position {
  const { centerShapeRadius, minNodeSpacing, layoutHalfSize } = config;
  const half = Math.ceil(total / 2);
  const innerRadius = Math.max(
    centerShapeRadius,
    minNodeSpacing / (2 * Math.sin(Math.PI / Math.max(half, 1)))
  );
  const outerRadius = Math.min(layoutHalfSize - 40, innerRadius + 180);
  const isInner = index < half;
  const ringIndex = isInner ? index : index - half;
  const ringTotal = isInner ? half : total - half;
  const angle =
    (ringIndex * 2 * Math.PI) / Math.max(ringTotal, 1) - Math.PI / 2;
  const r = isInner ? innerRadius : outerRadius;
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

/** spiral: 나선형, 중앙 도형 밖에서 시작, 노드 간격 고려 */
export function layoutSpiral(
  index: number,
  total: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Position {
  const { centerShapeRadius, layoutHalfSize } = config;
  const maxR = Math.min(460, layoutHalfSize - 40);
  const progress = total <= 1 ? 0 : index / (total - 1);
  const angle = progress * Math.PI * 4 - Math.PI / 2;
  const radius = centerShapeRadius + progress * (maxR - centerShapeRadius);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

const layoutFns: Record<
  LayoutType,
  (index: number, total: number, config: LayoutConfig) => Position
> = {
  circle: layoutCircle,
  grid: layoutGrid,
  arc: layoutArc,
  ring: layoutRing,
  spiral: layoutSpiral,
};

export function getLayoutPosition(
  layout: LayoutType,
  index: number,
  total: number,
  config?: Partial<LayoutConfig>
): Position {
  const c = withConfig(config);
  return layoutFns[layout](index, total, c);
}
