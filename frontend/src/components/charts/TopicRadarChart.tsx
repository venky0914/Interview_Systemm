"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TopicData {
  topic: string;
  accuracy: number;
}

interface TopicRadarChartProps {
  data: TopicData[];
  height?: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: TopicData }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[var(--text-primary)]">{d.topic}</p>
      <p className="text-[var(--text-secondary)]">Accuracy: {d.accuracy}%</p>
    </div>
  );
};

export default function TopicRadarChart({ data, height = 280 }: TopicRadarChartProps) {
  if (!data || data.length < 3) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-muted)]"
        style={{ height }}
      >
        Not enough topic data to render radar.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
        />
        <Radar
          name="Accuracy"
          dataKey="accuracy"
          stroke="#2563EB"
          fill="#2563EB"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ r: 3, fill: "#2563EB" }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
