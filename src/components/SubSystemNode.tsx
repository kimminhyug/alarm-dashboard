import { motion } from "motion/react";
import React from "react";
import { FaCircle } from "react-icons/fa";
import type { Status, SubSystemNodeProps } from "../types";
import { LAYOUT_HALF_SIZE_DEFAULT } from "../types";

const statusColors: Record<Status, string> = {
  OK: "#22c55e",
  WARNING: "#facc15",
  ERROR: "#ef4444",
};

export function SubSystemNode({
  id,
  status,
  x,
  y,
  size = 80,
  layoutHalfSize = LAYOUT_HALF_SIZE_DEFAULT,
  nodeSizeMin,
  nodeSizeMax,
  nodeSizeVmin,
  onClick,
}: SubSystemNodeProps) {
  const color = statusColors[status];

  const animation =
    status === "WARNING"
      ? {
          scale: [1, 1.1, 1],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }
      : status === "ERROR"
      ? {
          opacity: [1, 0.3, 1],
          transition: { duration: 1, repeat: Infinity, ease: "easeInOut" },
        }
      : {};

  const effectiveSize = Math.min(size, nodeSizeMax ?? size);
  const iconSize = Math.max(16, effectiveSize * 0.4);
  const fontSize =
    effectiveSize <= 30
      ? "text-[10px]"
      : effectiveSize <= 50
      ? "text-xs"
      : "text-sm";
  const showLabel = effectiveSize >= 30;

  // 레이아웃 좌표계를 %로 변환 (config와 동일한 layoutHalfSize 사용)
  const leftPct = 50 + (x / layoutHalfSize) * 50;
  const topPct = 50 + (y / layoutHalfSize) * 50;

  const useResponsiveSize =
    nodeSizeMin != null && nodeSizeMax != null && nodeSizeVmin != null;
  const boxSizeStyle = useResponsiveSize
    ? {
        width: `clamp(${nodeSizeMin}px, ${nodeSizeVmin}vmin, ${Math.min(
          size,
          nodeSizeMax
        )}px)`,
        height: `clamp(${nodeSizeMin}px, ${nodeSizeVmin}vmin, ${Math.min(
          size,
          nodeSizeMax
        )}px)`,
        minWidth: nodeSizeMin,
        minHeight: nodeSizeMin,
      }
    : { width: size, height: size };

  return (
    <motion.div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`absolute pointer-events-auto ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, ...animation }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative flex flex-col items-center gap-2">
        {/* Circle node */}
        <motion.div
          className="rounded-full border-4 flex items-center justify-center shrink-0"
          style={{
            borderColor: color,
            backgroundColor: `${color}20`,
            ...boxSizeStyle,
          }}
        >
          <FaCircle size={iconSize} color={color} />
        </motion.div>

        {/* Label */}
        {showLabel && (
          <div
            className={`${fontSize} tracking-wide px-2 py-1 rounded whitespace-nowrap`}
            style={{
              color: color,
              backgroundColor: `${color}15`,
            }}
          >
            {id}
          </div>
        )}
      </div>
    </motion.div>
  );
}
