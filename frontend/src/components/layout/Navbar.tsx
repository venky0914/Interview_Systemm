"use client";

import { MdSearch, MdDarkMode, MdLightMode, MdNotifications } from "react-icons/md";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { getInitials } from "@/utils/helpers";

export default function Navbar() {
  const { theme, toggleTheme } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center px-6 gap-4 shrink-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <MdSearch
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Search topics, questions..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
          <MdNotifications size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
        </button>

        {/* Avatar */}
        {user && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:scale-105 transition-transform overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
        )}
      </div>
    </header>
  );
}
