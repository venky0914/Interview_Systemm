"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface TopicBar {
  topic: string;
  correct: number;
  wrong: number;
  accuracy: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-semibold text-[var(--text-primary)]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.name === "correct" ? "#10B981" : "#EF4444" }}>
          {p.name === "correct" ? "✓ Correct" : "✗ Wrong"}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function ScoreBarChart({ data, height = 240 }: { data: TopicBar[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="topic"
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-secondary)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }}
          formatter={(value) => (value === "correct" ? "Correct" : "Wrong")}
        />
        <Bar dataKey="correct" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="wrong" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
