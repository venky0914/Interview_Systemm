"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MdSearch, MdArrowForward, MdCheckCircle } from "react-icons/md";
import toast from "react-hot-toast";
import Skeleton from "@/components/ui/Skeleton";
import { subjectService } from "@/services/quizService";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/utils/helpers";
import { SUBJECTS } from "@/utils/constants";

interface Subject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 300);

  useEffect(() => {
    Promise.all([
      subjectService.getAll(),
      subjectService.getEnrolled(),
    ])
      .then(([all, enrolledList]) => {
        setSubjects(all);
        setEnrolled(new Set(enrolledList.map((s: Subject) => s.slug)));
      })
      .catch(() => toast.error("Failed to load subjects"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subjects.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnroll = async (subjectId: string, slug: string) => {
    try {
      await subjectService.enroll([subjectId]);
      setEnrolled((prev) => new Set([...prev, slug]));
      toast.success("Enrolled successfully!");
    } catch {
      toast.error("Failed to enroll. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">All Subjects</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Choose subjects to start learning and tracking progress.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Search subjects..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circle" width={48} height={48} />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" height={10} />
                  </div>
                </div>
                <Skeleton height={36} />
              </div>
            ))
          : filtered.map((subject, i) => {
              const isEnrolled = enrolled.has(subject.slug);
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="card p-6 flex flex-col gap-4 group hover:shadow-card-hover transition-shadow"
                >
                  {/* Subject info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center text-2xl shrink-0">
                      {subject.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {subject.name}
                        </h3>
                        {isEnrolled && (
                          <MdCheckCircle size={14} className="text-accent-500 shrink-0" />
                        )}
                      </div>
                      {subject.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/subjects/${subject.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors"
                    >
                      Start Learning <MdArrowForward size={14} />
                    </Link>
                    {!isEnrolled && (
                      <button
                        onClick={() => handleEnroll(subject.id, subject.slug)}
                        className="h-9 px-3 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:border-accent-500 hover:text-accent-500 transition-all"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
      </div>

      {/* Empty search state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-[var(--text-secondary)]">No subjects match &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
