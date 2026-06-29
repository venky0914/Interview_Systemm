"use client";

import { useMemo } from "react";
import { cn } from "@/utils/helpers";

interface ActivityDay {
  date: string;
  count: number;
}

interface StreakCalendarProps {
  data: ActivityDay[];
  weeks?: number;
}

function getColor(count: number): string {
  if (count === 0) return "bg-[var(--bg-secondary)] border-[var(--border)]";
  if (count === 1) return "bg-primary-200 dark:bg-primary-900 border-primary-300 dark:border-primary-700";
  if (count <= 3) return "bg-primary-400 dark:bg-primary-700 border-primary-400";
  if (count <= 5) return "bg-primary-500 border-primary-500";
  return "bg-primary-600 border-primary-600";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function StreakCalendar({ data, weeks = 14 }: StreakCalendarProps) {
  const { grid, monthLabels } = useMemo(() => {
    const activityMap = new Map(data.map((d) => [d.date, d.count]));
    const today = new Date();
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        count: activityMap.get(dateStr) ?? 0,
        dayOfWeek: d.getDay(),
      });
    }

    // Group into weeks columns
    const cols: typeof days[] = [];
    for (let w = 0; w < weeks; w++) {
      cols.push(days.slice(w * 7, w * 7 + 7));
    }

    // Month labels
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    cols.forEach((week, colIdx) => {
      const d = new Date(week[0].date);
      const m = d.getMonth();
      if (m !== lastMonth) {
        labels.push({ month: MONTHS[m], col: colIdx });
        lastMonth = m;
      }
    });

    return { grid: cols, monthLabels: labels };
  }, [data, weeks]);

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="relative flex" style={{ paddingLeft: 28 }}>
        {monthLabels.map((label) => (
          <span
            key={`${label.month}-${label.col}`}
            className="absolute text-[10px] text-[var(--text-muted)]"
            style={{ left: 28 + label.col * 14 }}
          >
            {label.month}
          </span>
        ))}
      </div>
      <div style={{ height: 12 }} />

      {/* Grid */}
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((d, i) => (
            <div key={d} className="h-2.5 flex items-center">
              <span className="text-[9px] text-[var(--text-muted)] w-6 text-right">
                {i % 2 === 1 ? d.slice(0, 1) : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Cells */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} activities`}
                className={cn(
                  "w-2.5 h-2.5 rounded-sm border transition-all hover:scale-125 cursor-default",
                  getColor(day.count)
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-1">
        <span className="text-[10px] text-[var(--text-muted)]">Less</span>
        {[0, 1, 2, 4, 6].map((count) => (
          <div
            key={count}
            className={cn("w-2.5 h-2.5 rounded-sm border", getColor(count))}
          />
        ))}
        <span className="text-[10px] text-[var(--text-muted)]">More</span>
      </div>
    </div>
  );
}
