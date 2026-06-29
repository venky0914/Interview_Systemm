"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdNotifications, MdCheckCircle, MdLocalFireDepartment,
  MdQuiz, MdEmojiEvents, MdAutoAwesome, MdDoneAll,
  MdDelete,
} from "react-icons/md";
import { cn, formatDate } from "@/utils/helpers";

interface Notification {
  id: string;
  type: "streak" | "quiz_result" | "achievement" | "ai_tip" | "reminder";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  streak:       { icon: MdLocalFireDepartment, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20" },
  quiz_result:  { icon: MdQuiz,                color: "text-primary-500", bg: "bg-primary-100 dark:bg-primary-900/20" },
  achievement:  { icon: MdEmojiEvents,         color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
  ai_tip:       { icon: MdAutoAwesome,         color: "text-secondary-500", bg: "bg-secondary-100 dark:bg-secondary-900/20" },
  reminder:     { icon: MdNotifications,       color: "text-accent-500", bg: "bg-accent-100 dark:bg-accent-900/20" },
};

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "streak",
    title: "🔥 7-Day Streak!",
    message: "Amazing! You've studied for 7 days in a row. Keep the momentum going!",
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    type: "quiz_result",
    title: "New Personal Best!",
    message: "You scored 94% on the Python quiz — your highest score ever! 🎉",
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    type: "achievement",
    title: "Achievement Unlocked",
    message: "You've completed 10 quizzes! Badge earned: Quiz Warrior 🏆",
    read: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "4",
    type: "ai_tip",
    title: "AI Study Tip",
    message: "Based on your quiz history, focus on SQL JOINs — you've missed 60% of those questions.",
    read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "5",
    type: "reminder",
    title: "Daily Reminder",
    message: "You haven't studied today. Even 10 minutes keeps your streak alive! 💪",
    read: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "6",
    type: "quiz_result",
    title: "Quiz Completed",
    message: "Machine Learning quiz done — 72% score. Check your weak areas in the progress dashboard.",
    read: true,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const deleteNotif = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
              <MdNotifications size={20} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-500 font-medium transition-colors"
          >
            <MdDoneAll size={15} /> Mark all read
          </button>
        )}
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-xl w-fit"
      >
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              filter === f
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {f} {f === "unread" && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </motion.div>

      {/* Notification list */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-sm text-[var(--text-secondary)]">No notifications here.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif, i) => {
              const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.reminder;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    "card p-4 flex items-start gap-4 cursor-pointer group transition-all",
                    !notif.read && "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10"
                  )}
                >
                  {/* Icon */}
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                    <config.icon size={18} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm font-semibold",
                        notif.read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"
                      )}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                          className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 transition-all"
                        >
                          <MdDelete size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                      {formatDate(notif.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
