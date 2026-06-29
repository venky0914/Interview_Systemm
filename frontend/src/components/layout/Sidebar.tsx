"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MdDashboard, MdBarChart, MdDescription,
  MdChevronLeft, MdChevronRight, MdLogout,
  MdEmojiEvents, MdNotifications, MdBusiness,
  MdAdminPanelSettings,
} from "react-icons/md";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { SUBJECTS, ROUTES } from "@/utils/constants";
import { cn, getInitials } from "@/utils/helpers";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, icon: MdDashboard, label: "Dashboard" },
  { href: ROUTES.PROGRESS, icon: MdBarChart, label: "Progress" },
  { href: "/leaderboard", icon: MdEmojiEvents, label: "Leaderboard" },
  { href: ROUTES.RESUME_INTERVIEW, icon: MdDescription, label: "Resume Interview" },
  { href: ROUTES.COMPANY_INTERVIEW, icon: MdBusiness, label: "Company Interview" },
  { href: "/notifications", icon: MdNotifications, label: "Notifications" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    router.push(ROUTES.LOGIN);
  };

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 64 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[var(--border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          IF
        </div>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-semibold text-sm text-[var(--text-primary)] whitespace-nowrap"
          >
            InterviewForge AI
          </motion.span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          {sidebarOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
        </button>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary-600 text-white shadow-glow"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {/* Subjects section */}
        {sidebarOpen && (
          <div className="pt-4 pb-1 px-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Subjects
            </p>
          </div>
        )}

        {SUBJECTS.map((subject) => {
          const href = ROUTES.SUBJECT(subject.slug);
          const active = pathname.startsWith(href);
          return (
            <Link
              key={subject.slug}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-xl text-sm transition-all duration-150",
                active
                  ? "bg-primary-600/10 text-primary-600 dark:text-primary-400"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <span className="text-base shrink-0">{subject.emoji}</span>
              {sidebarOpen && <span className="whitespace-nowrap">{subject.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="shrink-0 border-t border-[var(--border)] p-3 space-y-1">
        {/* Admin link — shown only for admin users */}
        {user?.is_admin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-xl text-sm transition-all duration-150",
              pathname === "/admin"
                ? "bg-primary-600 text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <MdAdminPanelSettings size={18} className="shrink-0" />
            {sidebarOpen && <span>Admin Panel</span>}
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all duration-150"
        >
          <MdLogout size={18} className="shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>

        {user && sidebarOpen && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-[var(--bg-secondary)]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                : getInitials(user.full_name)
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user.full_name}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
