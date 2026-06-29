"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/helpers";

interface ProgressRingProps {
  value: number;          // 0-100
  size?: number;          // px
  strokeWidth?: number;
  color?: string;         // Tailwind stroke color class OR hex
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  className?: string;
  animate?: boolean;
}

export default function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color = "#2563EB",
  trackColor,
  label,
  sublabel,
  showValue = true,
  className,
  animate = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  // Derive color from score value if no override given
  const strokeColor =
    color === "auto"
      ? clampedValue >= 80
        ? "#10B981"
        : clampedValue >= 60
        ? "#F59E0B"
        : "#EF4444"
      : color;

  const resolvedTrack = trackColor ?? "var(--border)";

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={label ?? `${clampedValue}%`}
        role="img"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedTrack}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animate ? offset : offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span
            className="font-bold text-[var(--text-primary)]"
            style={{ fontSize: size * 0.18 }}
          >
            {clampedValue}%
          </span>
        )}
        {label && (
          <span
            className="text-[var(--text-muted)] text-center leading-tight"
            style={{ fontSize: size * 0.1 }}
          >
            {label}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="mt-2 text-xs text-[var(--text-secondary)] text-center">{sublabel}</p>
      )}
    </div>
  );
}
