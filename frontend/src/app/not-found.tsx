import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="text-8xl font-black text-gradient select-none">404</div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Page not found</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/subjects"
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
          >
            Browse Subjects
          </Link>
        </div>
      </div>
    </div>
  );
}
