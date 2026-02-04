import { motion } from "motion/react";
import React from "react";
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import type { MainStatusShapeProps, Status } from "../types";

const statusConfig: Record<
  Status,
  {
    color: string;
    bgColor: string;
    icon: typeof FiCheckCircle;
    animation: object;
  }
> = {
  OK: {
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
    icon: FiCheckCircle,
    animation: {},
  },
  WARNING: {
    color: "#facc15",
    bgColor: "rgba(250, 204, 21, 0.1)",
    icon: FiAlertTriangle,
    animation: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  ERROR: {
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    icon: FiXCircle,
    animation: {
      opacity: [1, 0.4, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};

export function MainStatusShape({ status }: MainStatusShapeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // Create hexagon path
  const hexagonPath = () => {
    const size = 200;
    const points: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push([Math.cos(angle) * size, Math.sin(angle) * size]);
    }
    return `M ${points.map((p) => p.join(",")).join(" L ")} Z`;
  };

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,85vmin)] h-[min(500px,85vmin)]"
      style={{ aspectRatio: "1" }}
    >
      <svg className="w-full h-full" viewBox="-250 -250 500 500">
        {/* Outer glow/background */}
        <motion.path
          d={hexagonPath()}
          fill={config.bgColor}
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main hexagon fill */}
        <motion.path
          d={hexagonPath()}
          fill={config.color}
          fillOpacity={0.2}
          {...config.animation}
        />

        {/* Border with animation */}
        <motion.path
          d={hexagonPath()}
          fill="none"
          stroke={config.color}
          strokeWidth="8"
          {...config.animation}
        />
      </svg>

      {/* Icon in the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div {...config.animation}>
          <Icon size={120} color={config.color} />
        </motion.div>
      </div>

      {/* Status text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-32 mt-20">
        <motion.div
          className="text-4xl tracking-wider"
          style={{ color: config.color }}
          {...config.animation}
        >
          {status}
        </motion.div>
      </div>
    </div>
  );
}
