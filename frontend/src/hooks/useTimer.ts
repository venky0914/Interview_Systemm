"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseTimerOptions {
  onExpire?: () => void;
  enabled?: boolean;
}

/**
 * Countdown timer hook.
 * Calls `tick` every second while `enabled` is true.
 * Calls `onExpire` when timer reaches 0.
 */
export function useTimer(
  seconds: number,
  tick: () => void,
  { onExpire, enabled = true }: UseTimerOptions = {}
) {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!enabled || seconds <= 0) return;

    const id = setInterval(() => {
      tick();
      if (seconds - 1 <= 0) {
        clearInterval(id);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [seconds, tick, enabled]);
}

/** Format seconds → "mm:ss" */
export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Returns "danger" when under 20% of total time remains */
export function timerStatus(
  remaining: number,
  total: number
): "normal" | "warning" | "danger" {
  if (total === 0) return "normal";
  const pct = remaining / total;
  if (pct < 0.1) return "danger";
  if (pct < 0.25) return "warning";
  return "normal";
}
