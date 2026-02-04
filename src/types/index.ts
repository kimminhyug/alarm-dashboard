/** 시스템/서브시스템 상태 리터럴 */
export type Status = "OK" | "WARNING" | "ERROR";

/** 서브시스템 한 개 */
export interface Subsystem {
  id: string;
  status: Status;
}

/** 대시보드에 전달하는 전체 시스템 데이터 */
export interface SystemData {
  system_status: Status;
  subsystems: Subsystem[];
  last_update: string;
}

/** 서브시스템 노드 배치 레이아웃 */
export type LayoutType = "circle" | "grid" | "arc" | "ring" | "spiral";

/** 레이아웃 좌표계: 중심 0,0 / 반지름 (SVG·노드 위치 공통) */
export const LAYOUT_HALF_SIZE_DEFAULT = 500;

/** 범용 레이아웃 설정 (값 없으면 기본값 사용) */
export interface LayoutConfig {
  /** 좌표계 반지름 (중심 0,0 기준). 기본 500 */
  layoutHalfSize: number;
  /** 중앙 메인 도형 반지름 - 노드는 이 값 밖에 배치. 기본 420 */
  centerShapeRadius: number;
  /** 노드 간 최소 간격(레이아웃 단위). 노드끼리 겹치지 않도록. 기본 90 */
  minNodeSpacing: number;
  /** 노드 최소 크기(px). 반응형 시 clamp 하한. 기본 20 */
  nodeSizeMin: number;
  /** 노드 최대 크기(px). 기본 80 */
  nodeSizeMax: number;
  /** 노드 크기용 vmin (반응형). 기본 7 */
  nodeSizeVmin: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  layoutHalfSize: 500,
  centerShapeRadius: 420,
  minNodeSpacing: 90,
  nodeSizeMin: 20,
  nodeSizeMax: 80,
  nodeSizeVmin: 7,
};

/** 레이아웃 좌표계: 하위 호환용 상수 (기본 config 기준) */
export const LAYOUT_HALF_SIZE = LAYOUT_HALF_SIZE_DEFAULT;

/** StatusDashboard props */
export interface StatusDashboardProps {
  data: SystemData;
  /** 서브시스템 노드 배치. 기본값: "circle" */
  layout?: LayoutType;
  /** 서브시스템 노드 클릭 시 호출 (지정 시 노드가 클릭 가능해짐) */
  onSubsystemClick?: (subsystem: Subsystem) => void;
  /** 레이아웃/노드 크기 설정. 일부만 넘기면 나머지는 기본값 */
  config?: Partial<LayoutConfig>;
}

/** SubSystemNode props (key는 React 예약 prop, TS 호환용으로 선택적 허용) */
export interface SubSystemNodeProps {
  key?: string | number;
  id: string;
  status: Status;
  x: number;
  y: number;
  /** 노드 크기(px). 반응형 시 clamp 상한·아이콘/폰트 기준으로 사용 */
  size?: number;
  /** 레이아웃 좌표계 반지름 (위치 % 변환용). config와 맞출 것 */
  layoutHalfSize?: number;
  /** 반응형: 노드 박스 크기 clamp 하한(px) */
  nodeSizeMin?: number;
  /** 반응형: 노드 박스 크기 clamp 상한(px) */
  nodeSizeMax?: number;
  /** 반응형: 노드 박스 크기 vmin */
  nodeSizeVmin?: number;
  /** 클릭 시 호출 (지정 시 커서 pointer) */
  onClick?: () => void;
}

/** MainStatusShape props */
export interface MainStatusShapeProps {
  status: Status;
}

/** TrendChart 데이터 포인트 (Recent Activity) */
export interface TrendDataPoint {
  time: number;
  severity: number;
}

/** 시스템 데이터 일부 (last_update 제외, 시나리오 등에 사용) */
export type SystemDataInput = Pick<SystemData, "system_status" | "subsystems">;
