"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdEmojiEvents, MdTrendingUp, MdPerson,
  MdStar, MdLocalFireDepartment, MdFilter,
} from "react-icons/md";
import toast from "react-hot-toast";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { cn, getInitials } from "@/utils/helpers";
import { SUBJECTS } from "@/utils/constants";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  avg_score: number;
  total_quizzes: number;
  current_streak: number;
  badge: string | null;
}

const MEDAL: Record<number, { color: string; icon: string }> = {
  1: { color: "text-yellow-400", icon: "🥇" },
  2: { color: "text-gray-400", icon: "🥈" },
  3: { color: "text-orange-400", icon: "🥉" },
};

const PERIOD_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

/* ─── Podium component ───────────────────────────────────────────────────── */
function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const order = [1, 0, 2]; // 2nd, 1st, 3rd
  const heights = ["h-24", "h-32", "h-20"];
  const sizes = ["w-14 h-14", "w-18 h-18", "w-12 h-12"];

  if (top3.length < 3) return null;

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {order.map((idx, podiumPos) => {
        const entry = top3[idx];
        if (!entry) return null;
        const medal = MEDAL[entry.rank];
        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: podiumPos * 0.15, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-2"
          >
            {/* Avatar */}
            <div className="relative">
              <div className={cn(
                "rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold overflow-hidden",
                podiumPos === 1 ? "w-18 h-18 text-lg" : "w-14 h-14 text-sm"
              )}
                style={{ width: podiumPos === 1 ? 72 : 56, height: podiumPos === 1 ? 72 : 56 }}
              >
                {entry.avatar_url
                  ? <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
                  : getInitials(entry.full_name)
                }
              </div>
              <span className="absolute -bottom-1 -right-1 text-lg">{medal.icon}</span>
            </div>

            {/* Name */}
            <div className="text-center">
              <p className="text-xs font-semibold text-[var(--text-primary)] max-w-[80px] truncate">
                {entry.full_name.split(" ")[0]}
              </p>
              <p className={cn("text-xs font-bold", medal.color)}>{entry.avg_score}%</p>
            </div>

            {/* Podium block */}
            <div className={cn(
              "w-20 rounded-t-xl flex items-center justify-center",
              heights[podiumPos],
              podiumPos === 1
                ? "bg-gradient-to-b from-yellow-400 to-yellow-600"
                : podiumPos === 0
                ? "bg-gradient-to-b from-gray-300 to-gray-500 dark:from-gray-500 dark:to-gray-700"
                : "bg-gradient-to-b from-orange-300 to-orange-500"
            )}>
              <span className="text-white font-bold text-lg">#{entry.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Row component ──────────────────────────────────────────────────────── */
function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  const medal = MEDAL[entry.rank];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
        isCurrentUser
          ? "bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700"
          : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border-hover)]"
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-xl">{medal.icon}</span>
        ) : (
          <span className="text-sm font-bold text-[var(--text-muted)]">#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
          : getInitials(entry.full_name)
        }
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-semibold truncate",
            isCurrentUser ? "text-primary-600 dark:text-primary-400" : "text-[var(--text-primary)]"
          )}>
            {entry.full_name}
            {isCurrentUser && <span className="ml-1 text-[10px] text-primary-500">(you)</span>}
          </p>
          {entry.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 font-medium shrink-0">
              {entry.badge}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-center hidden sm:block">
          <p className="text-xs font-bold text-[var(--text-primary)]">{entry.total_quizzes}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Quizzes</p>
        </div>
        <div className="text-center hidden sm:block">
          <div className="flex items-center gap-1 justify-center">
            <MdLocalFireDepartment size={12} className="text-orange-500" />
            <p className="text-xs font-bold text-[var(--text-primary)]">{entry.current_streak}</p>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">Streak</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-sm font-bold",
            entry.avg_score >= 80 ? "text-accent-600" : entry.avg_score >= 60 ? "text-yellow-500" : "text-red-500"
          )}>
            {entry.avg_score}%
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Avg Score</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/leaderboard?period=${period}&subject=${subjectFilter}`)
      .then((res) => {
        setEntries(res.data.entries ?? []);
        setMyRank(res.data.my_rank ?? null);
      })
      .catch(() => {
        // Show demo data when API not available
        setEntries(DEMO_ENTRIES);
      })
      .finally(() => setLoading(false));
  }, [period, subjectFilter]);

  const top3 = entries.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white">
            <MdEmojiEvents size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Leaderboard</h1>
            <p className="text-sm text-[var(--text-secondary)]">Top performers this {period === "all" ? "all time" : period}</p>
          </div>
        </div>

        {myRank && (
          <div className="px-4 py-2 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-center">
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Your Rank</p>
            <p className="text-xl font-bold text-primary-700 dark:text-primary-300">#{myRank}</p>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {/* Period */}
        <div className="flex gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-xl">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                period === opt.value
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Subject filter */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s.slug} value={s.slug}>{s.emoji} {s.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Podium */}
      {!loading && top3.length >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <Podium top3={top3} />
        </motion.div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card p-4 h-16 shimmer" />
            ))
          : entries.length === 0
          ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-sm text-[var(--text-secondary)]">No rankings yet. Be the first!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Complete quizzes to appear on the leaderboard.</p>
            </div>
          )
          : entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              isCurrentUser={entry.user_id === user?.id}
              index={i}
            />
          ))
        }
      </div>
    </div>
  );
}

/* ─── Demo data for when API isn't connected ──────────────────────────────── */
const DEMO_ENTRIES: LeaderboardEntry[] = Array.from({ length: 15 }, (_, i) => ({
  rank: i + 1,
  user_id: `demo-${i}`,
  full_name: ["Rahul Sharma", "Priya Singh", "Arjun Nair", "Divya Menon", "Karan Patel",
    "Anjali Rao", "Vikram Das", "Sneha Iyer", "Rohit Gupta", "Meera Nair",
    "Aditya Kumar", "Pooja Sharma", "Suresh Patel", "Kavita Rao", "Manish Singh"][i],
  avatar_url: null,
  avg_score: Math.max(45, 98 - i * 3 - Math.floor(Math.random() * 5)),
  total_quizzes: Math.max(5, 80 - i * 4),
  current_streak: Math.max(0, 30 - i * 2),
  badge: i === 0 ? "🔥 Top Scorer" : i === 1 ? "⚡ Speed Demon" : i === 2 ? "🎯 Accuracy King" : null,
}));
