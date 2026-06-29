"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdFlashOn, MdTrendingUp, MdQuiz, MdCode,
  MdArrowForward, MdLocalFireDepartment,
} from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import { useAuthStore } from "@/store/authStore";
import { SUBJECTS, ROUTES } from "@/utils/constants";
import { cn, scoreColor, formatDate } from "@/utils/helpers";

/* ─── Animation helpers ─────────────────────────────────────────────────── */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

/* ─── Static quick actions ──────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    label: "Start Quiz",
    desc: "Test your knowledge",
    icon: MdQuiz,
    color: "from-primary-500 to-primary-700",
    href: "/subjects",
  },
  {
    label: "Mock Interview",
    desc: "Practice with AI",
    icon: RiRobot2Line,
    color: "from-secondary-500 to-secondary-700",
    href: "/subjects",
  },
  {
    label: "Coding Practice",
    desc: "Solve problems",
    icon: MdCode,
    color: "from-accent-500 to-accent-700",
    href: "/subjects",
  },
  {
    label: "Track Progress",
    desc: "View your analytics",
    icon: MdTrendingUp,
    color: "from-purple-500 to-purple-700",
    href: ROUTES.PROGRESS,
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Hero greeting ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            {greeting},{" "}
            <span className="text-gradient">{firstName} 👋</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Ready to ace your next interview? Let&apos;s get to work.
          </p>
        </div>

        {/* Streak badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <MdLocalFireDepartment className="text-orange-500" size={20} />
          <span className="text-sm font-semibold text-orange-500">0 day streak</span>
        </div>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Quizzes Taken", value: "0", icon: MdQuiz, color: "text-primary-500" },
          { label: "Avg. Score", value: "—", icon: MdTrendingUp, color: "text-accent-500" },
          { label: "Topics Covered", value: "0", icon: MdFlashOn, color: "text-secondary-500" },
          { label: "Problems Solved", value: "0", icon: MdCode, color: "text-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 flex items-center gap-4">
            <div className={cn("p-2.5 rounded-xl bg-[var(--bg-secondary)]", stat.color)}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.1)}>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Quick Start</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card card-interactive p-5 group cursor-pointer"
            >
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4", action.color)}>
                <action.icon size={20} />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-600 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Subjects grid ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.15)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">All Subjects</h2>
          <Link
            href="/subjects"
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-500 font-medium transition-colors"
          >
            View all <MdArrowForward size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {SUBJECTS.map((subject, i) => (
            <motion.div
              key={subject.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.03 }}
            >
              <Link
                href={ROUTES.SUBJECT(subject.slug)}
                className="card card-interactive flex flex-col items-center gap-2 p-4 text-center group"
              >
                <span className="text-2xl">{subject.emoji}</span>
                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-primary-600 transition-colors leading-tight">
                  {subject.name}
                </span>
                {/* Progress bar placeholder */}
                <div className="w-full h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full w-0 rounded-full bg-primary-500" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Get started prompt (shown when no activity) ───────────────── */}
      <motion.div {...fadeUp(0.2)}>
        <div className="card p-8 text-center border-dashed">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Start your first quiz
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
            Pick a subject, choose your difficulty, and get personalized AI feedback.
          </p>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            Choose a subject <MdArrowForward size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
