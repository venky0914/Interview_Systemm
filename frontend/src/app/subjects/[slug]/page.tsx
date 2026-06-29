"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdMenuBook, MdQuiz, MdCode, MdRecordVoiceOver,
  MdSmartToy, MdBookmark, MdTrendingUp, MdStar,
  MdWarning, MdArrowForward, MdLock,
} from "react-icons/md";
import { SUBJECTS } from "@/utils/constants";
import { cn } from "@/utils/helpers";

/* ─── Learning mode cards config ──────────────────────────────────────────── */
const MODES = [
  {
    key: "notes",
    label: "Revision Notes",
    desc: "Study structured notes, highlight, bookmark, and download PDFs.",
    icon: MdMenuBook,
    gradient: "from-blue-500 to-blue-700",
    href: (slug: string) => `/subjects/${slug}/notes`,
    badge: null,
  },
  {
    key: "quiz",
    label: "Quiz",
    desc: "Theory, coding, or mixed quizzes with AI-powered feedback.",
    icon: MdQuiz,
    gradient: "from-violet-500 to-violet-700",
    href: (slug: string) => `/subjects/${slug}/quiz`,
    badge: "Popular",
  },
  {
    key: "coding",
    label: "Coding Practice",
    desc: "Solve Python and SQL problems with an in-browser code editor.",
    icon: MdCode,
    gradient: "from-emerald-500 to-emerald-700",
    href: (slug: string) => `/subjects/${slug}/coding`,
    badge: null,
  },
  {
    key: "mock-interview",
    label: "Mock Interview",
    desc: "AI interviews you one-on-one and evaluates every answer in real time.",
    icon: MdRecordVoiceOver,
    gradient: "from-orange-500 to-orange-700",
    href: (slug: string) => `/subjects/${slug}/mock-interview`,
    badge: "AI-Powered",
  },
  {
    key: "ai-assistant",
    label: "AI Assistant",
    desc: "Ask anything — answers sourced strictly from your uploaded notes.",
    icon: MdSmartToy,
    gradient: "from-cyan-500 to-cyan-700",
    href: (slug: string) => `/subjects/${slug}/ai-assistant`,
    badge: "RAG",
  },
  {
    key: "bookmarks",
    label: "Bookmarks",
    desc: "All your saved questions, notes, and code problems in one place.",
    icon: MdBookmark,
    gradient: "from-pink-500 to-pink-700",
    href: () => `/progress?tab=bookmarks`,
    badge: null,
  },
  {
    key: "progress",
    label: "My Progress",
    desc: "Track completion, streaks, weak areas, and learning milestones.",
    icon: MdTrendingUp,
    gradient: "from-teal-500 to-teal-700",
    href: () => `/progress`,
    badge: null,
  },
  {
    key: "top-questions",
    label: "Top Questions",
    desc: "The most frequently asked interview questions for this subject.",
    icon: MdStar,
    gradient: "from-yellow-500 to-yellow-600",
    href: (slug: string) => `/subjects/${slug}/quiz?top=true`,
    badge: "Must Do",
  },
  {
    key: "wrong-questions",
    label: "Wrong Answers",
    desc: "Re-practice every question you've answered incorrectly before.",
    icon: MdWarning,
    gradient: "from-red-500 to-red-700",
    href: () => `/progress?tab=wrong`,
    badge: null,
  },
];

/* ─── Quick stats placeholders ────────────────────────────────────────────── */
const QUICK_STATS = [
  { label: "Questions", value: "150+" },
  { label: "Notes Topics", value: "24" },
  { label: "Coding Problems", value: "40+" },
  { label: "Avg. Difficulty", value: "Medium" },
];

export default function SubjectPage() {
  const { slug } = useParams<{ slug: string }>();

  const subject = SUBJECTS.find((s) => s.slug === slug);
  if (!subject) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        Subject not found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-800 to-dark-900 border border-[var(--border)] p-8"
      >
        {/* Background orbs */}
        <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute bottom-[-20px] left-[30%] w-48 h-48 rounded-full bg-secondary-600/10 blur-3xl" />

        <div className="relative z-10 flex items-start gap-6">
          <div className="text-6xl">{subject.emoji}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{subject.name}</h1>
            <p className="text-dark-400 text-sm max-w-xl">
              Master {subject.name} with structured notes, adaptive quizzes, live coding
              practice, and AI-driven mock interviews — all in one place.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 mt-5">
              {QUICK_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-dark-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between text-xs text-dark-400 mb-2">
            <span>Overall progress</span>
            <span>0%</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-700" />
          </div>
        </div>
      </motion.div>

      {/* ── Learning modes grid ───────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Choose your learning mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODES.map((mode, i) => (
            <motion.div
              key={mode.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href={mode.href(slug)}
                className="card card-interactive group flex flex-col h-full p-5 gap-4"
              >
                {/* Icon + badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm",
                      mode.gradient
                    )}
                  >
                    <mode.icon size={22} />
                  </div>
                  {mode.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                      {mode.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors mb-1">
                    {mode.label}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1 text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start <MdArrowForward size={14} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Recent activity placeholder ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Recent Activity
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm text-[var(--text-secondary)]">
            No activity yet for {subject.name}.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Start a quiz or read the notes to track your progress here.
          </p>
          <Link
            href={`/subjects/${slug}/quiz`}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors"
          >
            Take first quiz <MdArrowForward size={13} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
