import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InterviewForge AI",
};

/**
 * All app pages (subjects, progress, resume, company, admin) use
 * the same Sidebar + Navbar shell that is defined in dashboard/layout.tsx.
 * This layout simply passes children through — the shell is applied via
 * the shared (app) route group below.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
