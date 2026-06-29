"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdLocalFireDepartment, MdQuiz, MdTrendingUp,
  MdCode, MdEmojiEvents, MdCalendarToday,
} from "react-icons/md";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import ProgressRing from "@/components/charts/ProgressRing";
import StreakCalendar from "@/components/charts/StreakCalendar";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import api from "@/services/api";
import { cn, formatDate, scoreColor } from "@/utils/helpers";

interface Dashboard {
  current_streak: number;
  longest_streak: number;
  total_quiz_count: number;
  avg_score_pct: number;
  coding_accuracy: number;
  completion_by_subject: { subject: string; pct: number }[];
  recent_quizzes: { id: string; score: number; mode: string; difficulty: string; date: string }[];
  weak_topics: string[];
  strong_topics: string[];
  activity_heatmap: { date: string; count: number }[];
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function ProgressPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/progress/dashboard")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load progress"))
      .finally(() => setLoading(false));
  }, []);

  // Build score trend line data from recent quizzes
  const trendData = data?.recent_quizzes
    .slice()
    .reverse()
    .map((q, i) => ({ quiz: `#${i + 1}`, score: q.score, date: formatDate(q.date) })) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Your Progress</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track streaks, scores, and learning milestones.
        </p>
      </motion.div>

      {/* ── Top stats ───────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : [
              {
                icon: MdLocalFireDepartment,
                label: "Current Streak",
                value: `${data?.current_streak ?? 0} days`,
                color: "bg-orange-500",
              },
              {
                icon: MdQuiz,
                label: "Quizzes Taken",
                value: data?.total_quiz_count ?? 0,
                color: "bg-primary-600",
              },
              {
                icon: MdTrendingUp,
                label: "Avg. Score",
                value: `${data?.avg_score_pct?.toFixed(1) ?? "0"}%`,
                color: "bg-accent-500",
              },
              {
                icon: MdCode,
                label: "Coding Accuracy",
                value: `${data?.coding_accuracy?.toFixed(1) ?? "0"}%`,
                color: "bg-secondary-600",
              },
            ].map((stat) => (
              <div key={stat.label} className="card p-5 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0", stat.color)}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                  <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                </div>
              </div>
            ))
        }
      </motion.div>

      {/* ── Score trend + Progress rings ────────────────────────────── */}
      <motion.div {...fadeUp(0.1)} className="grid md:grid-cols-3 gap-6">
        {/* Score trend */}
        <div className="md:col-span-2 card p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Score Trend</h2>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="quiz" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                  formatter={(v) => [`${v}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#2563EB", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--text-muted)]">
              Complete at least 2 quizzes to see your score trend.
            </div>
          )}
        </div>

        {/* Progress rings */}
        <div className="card p-6 flex flex-col items-center justify-center gap-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] self-start">Overview</h2>
          <div className="flex gap-6">
            <ProgressRing
              value={data?.avg_score_pct ?? 0}
              size={100}
              strokeWidth={9}
              color="auto"
              sublabel="Avg Score"
            />
            <ProgressRing
              value={data?.coding_accuracy ?? 0}
              size={100}
              strokeWidth={9}
              color="#06B6D4"
              sublabel="Coding"
            />
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)]">Longest streak</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <MdEmojiEvents size={16} className="text-yellow-500" />
              <span className="text-base font-bold text-[var(--text-primary)]">
                {data?.longest_streak ?? 0} days
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Activity heatmap ─────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.15)} className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <MdCalendarToday size={16} className="text-primary-500" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Activity — Last 14 Weeks</h2>
        </div>
        <StreakCalendar data={data?.activity_heatmap ?? []} weeks={14} />
      </motion.div>

      {/* ── Weak / Strong topics ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0.2)} className="grid md:grid-cols-2 gap-4">
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">📉 Weak Topics</h2>
          {(data?.weak_topics ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data!.weak_topics.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No weak topics yet — keep taking quizzes!</p>
          )}
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">💪 Strong Topics</h2>
          {(data?.strong_topics ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data!.strong_topics.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-accent-50 dark:bg-accent-900/20 text-accent-700 border border-accent-200 dark:border-accent-800">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Score 80%+ on topics to mark them as strong.</p>
          )}
        </div>
      </motion.div>

      {/* ── Recent quizzes table ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0.25)} className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Quizzes</h2>
        </div>
        {(data?.recent_quizzes ?? []).length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm text-[var(--text-secondary)]">No quizzes taken yet.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Take your first quiz to see history here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  {["#", "Mode", "Difficulty", "Score", "Date"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data!.recent_quizzes.map((quiz, i) => (
                  <tr key={quiz.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-3.5 text-[var(--text-muted)] text-xs">#{i + 1}</td>
                    <td className="px-6 py-3.5 capitalize text-[var(--text-primary)]">{quiz.mode}</td>
                    <td className="px-6 py-3.5 capitalize text-[var(--text-secondary)]">{quiz.difficulty}</td>
                    <td className="px-6 py-3.5">
                      <span className={cn("font-semibold", scoreColor(quiz.score))}>
                        {quiz.score}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[var(--text-muted)] text-xs">
                      {formatDate(quiz.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
