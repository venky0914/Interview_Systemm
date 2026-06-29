"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdCheckCircle, MdCancel, MdSkipNext, MdTimer,
  MdAutoAwesome, MdRefresh, MdArrowForward,
  MdTrendingUp, MdTrendingDown, MdLightbulb,
} from "react-icons/md";
import { useQuizStore } from "@/store/quizStore";
import ProgressRing from "@/components/charts/ProgressRing";
import TopicRadarChart from "@/components/charts/TopicRadarChart";
import ScoreBarChart from "@/components/charts/ScoreBarChart";
import { cn, formatTime, scoreColor } from "@/utils/helpers";
import { SUBJECTS } from "@/utils/constants";

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

/* ─── Score emoji feedback ───────────────────────────────────────────────── */
function scoreFeedback(pct: number): { emoji: string; message: string } {
  if (pct >= 90) return { emoji: "🏆", message: "Outstanding performance!" };
  if (pct >= 80) return { emoji: "🎉", message: "Excellent work!" };
  if (pct >= 70) return { emoji: "👍", message: "Great effort!" };
  if (pct >= 60) return { emoji: "📈", message: "Good progress!" };
  if (pct >= 50) return { emoji: "💪", message: "Keep practicing!" };
  return { emoji: "📚", message: "More study needed." };
}

export default function QuizResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { result, config, questions, resetQuiz } = useQuizStore();
  const subject = SUBJECTS.find((s) => s.slug === slug);

  // Guard — redirect if no result in store
  useEffect(() => {
    if (!result) {
      router.replace(`/subjects/${slug}/quiz`);
    }
  }, [result, router, slug]);

  if (!result) return null;

  const { emoji, message } = scoreFeedback(result.score);
  const radarData = result.topic_analysis.map((t) => ({
    topic: t.topic,
    accuracy: t.accuracy,
  }));
  const barData = result.topic_analysis.map((t) => ({
    topic: t.topic,
    correct: t.correct,
    wrong: t.total - t.correct,
    accuracy: t.accuracy,
  }));

  const handleRetake = () => {
    resetQuiz();
    router.push(`/subjects/${slug}/quiz`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* ── Hero score card ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-800 to-dark-900 border border-[var(--border)] p-8"
      >
        {/* Background glow */}
        <div className="absolute top-[-60px] right-[-40px] w-64 h-64 rounded-full blur-3xl"
          style={{ background: result.score >= 70 ? "rgba(16,185,129,0.12)" : result.score >= 50 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)" }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          {/* Ring */}
          <ProgressRing
            value={result.score}
            size={140}
            strokeWidth={12}
            color="auto"
            sublabel="Score"
          />

          {/* Summary */}
          <div className="flex-1 text-center sm:text-left">
            <div className="text-4xl mb-2">{emoji}</div>
            <h1 className="text-2xl font-bold text-white mb-1">{message}</h1>
            <p className="text-dark-400 text-sm mb-4">
              {subject?.emoji} {subject?.name} · {config?.type} · {config?.difficulty}
            </p>

            {/* Accuracy bar */}
            <div className="space-y-2 max-w-sm">
              <div className="flex justify-between text-xs text-dark-400">
                <span>Accuracy</span>
                <span>{result.accuracy.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: result.accuracy >= 70
                      ? "linear-gradient(90deg,#10B981,#34D399)"
                      : result.accuracy >= 50
                      ? "linear-gradient(90deg,#F59E0B,#FCD34D)"
                      : "linear-gradient(90deg,#EF4444,#F87171)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.accuracy}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/10"
            >
              <MdRefresh size={16} /> Retake
            </button>
            <Link
              href={`/subjects/${slug}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-all"
            >
              Continue <MdArrowForward size={16} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard icon={MdCheckCircle} label="Correct" value={result.correct_count} color="bg-accent-500" />
        <StatCard icon={MdCancel} label="Wrong" value={result.wrong_count} color="bg-red-500" />
        <StatCard icon={MdSkipNext} label="Skipped" value={result.skipped_count} color="bg-yellow-500" />
        <StatCard icon={MdTimer} label="Time Taken" value={formatTime(result.time_taken_sec)} color="bg-secondary-500" />
      </motion.div>

      {/* ── AI Feedback card ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <MdAutoAwesome size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI Feedback</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {result.ai_feedback || "Great attempt! Keep practicing to improve your score."}
        </p>
      </motion.div>

      {/* ── Topic analysis ──────────────────────────────────────────────── */}
      {result.topic_analysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Radar */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              Topic Accuracy Radar
            </h2>
            <TopicRadarChart data={radarData} height={260} />
          </div>

          {/* Bar */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              Correct vs Wrong by Topic
            </h2>
            <ScoreBarChart data={barData} height={260} />
          </div>
        </motion.div>
      )}

      {/* ── Weak / Strong areas ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {/* Weak */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MdTrendingDown size={18} className="text-red-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Areas to Improve</h2>
          </div>
          {result.weak_topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.weak_topics.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No weak areas identified. 🎉</p>
          )}
        </div>

        {/* Strong */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MdTrendingUp size={18} className="text-accent-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Strong Areas</h2>
          </div>
          {result.strong_topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.strong_topics.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-accent-50 dark:bg-accent-900/20 text-accent-700 border border-accent-200 dark:border-accent-800"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Complete more quizzes to identify strengths.</p>
          )}
        </div>
      </motion.div>

      {/* ── Recommended next topics ─────────────────────────────────────── */}
      {result.recommended_topics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <MdLightbulb size={18} className="text-yellow-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recommended Next</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.recommended_topics.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 border border-primary-200 dark:border-primary-800 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              >
                {t} <MdArrowForward size={12} />
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Topic-by-topic table ─────────────────────────────────────────── */}
      {result.topic_analysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Topic Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  {["Topic", "Total", "Correct", "Wrong", "Accuracy"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {result.topic_analysis.map((row) => (
                  <tr key={row.topic} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-[var(--text-primary)]">{row.topic}</td>
                    <td className="px-6 py-3.5 text-[var(--text-secondary)]">{row.total}</td>
                    <td className="px-6 py-3.5 text-accent-600 font-medium">{row.correct}</td>
                    <td className="px-6 py-3.5 text-red-500 font-medium">{row.total - row.correct}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${row.accuracy}%`,
                              background: row.accuracy >= 70 ? "#10B981" : row.accuracy >= 50 ? "#F59E0B" : "#EF4444",
                            }}
                          />
                        </div>
                        <span className={cn("text-xs font-semibold", scoreColor(row.accuracy))}>
                          {row.accuracy}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
