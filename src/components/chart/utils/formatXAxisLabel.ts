import type { DrilldownLevel } from "../types/chartSpec";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * 드릴다운 레벨에 따라 X축 틱 라벨 포맷.
 * - year: 2025, 2026
 * - month: January, February, ...
 * - week: 1w, 2w, ... 마지막은 last w
 * - day: 1~31, 또는 7개일 때 Mon~Sun
 * - hour: 00~23
 */
export function formatXAxisLabel(
  value: string,
  level: DrilldownLevel | undefined,
  index: number,
  total: number
): string {
  if (!value || level == null) return String(value);

  switch (level) {
    case "year":
      return value; // "2025", "2026"

    case "month": {
      const m = value.match(/^(\d{4})-(\d{2})$/);
      if (!m) return value;
      const monthIndex = parseInt(m[2], 10) - 1;
      return MONTH_NAMES[monthIndex] ?? value;
    }

    case "week":
      return index === total - 1 ? "last w" : `${index + 1}w`;

    case "day": {
      const d = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!d) return value;
      const dateNum = parseInt(d[3], 10);
      if (total === 7) {
        const date = new Date(parseInt(d[1], 10), parseInt(d[2], 10) - 1, dateNum);
        return WEEKDAY_SHORT[date.getDay()];
      }
      return String(dateNum); // 1~31
    }

    case "hour": {
      const h = value.match(/\s(\d{2}):00$/);
      return h ? h[1] : value; // "00"~"23"
    }

    default:
      return String(value);
  }
}
