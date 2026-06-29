"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdSearch, MdBookmark, MdBookmarkBorder, MdDownload,
  MdMenuBook, MdFilterList, MdClose, MdChevronRight,
} from "react-icons/md";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { subjectService } from "@/services/quizService";
import { useDebounce } from "@/hooks/useDebounce";
import Skeleton from "@/components/ui/Skeleton";
import { SUBJECTS } from "@/utils/constants";
import { cn, formatDate } from "@/utils/helpers";

interface Note {
  id: string;
  title: string;
  content: string;
  topic: string;
  pdf_url: string | null;
  read_count: number;
  updated_at: string;
}

export default function NotesPage() {
  const { slug } = useParams<{ slug: string }>();
  const subject = SUBJECTS.find((s) => s.slug === slug);

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [searchRaw, setSearchRaw] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const search = useDebounce(searchRaw, 300);

  useEffect(() => {
    subjectService.getNotes(slug)
      .then((data) => {
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0]);
      })
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setLoading(false));
  }, [slug]);

  // All unique topics
  const topics = useMemo(
    () => Array.from(new Set(notes.map((n) => n.topic).filter(Boolean))),
    [notes]
  );

  // Filtered notes list
  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchTopic = !activeTopic || n.topic === activeTopic;
      return matchSearch && matchTopic;
    });
  }, [notes, search, activeTopic]);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    toast.success(bookmarked.has(id) ? "Bookmark removed" : "Note bookmarked");
  };

  const handleDownload = (note: Note) => {
    if (note.pdf_url) {
      window.open(note.pdf_url, "_blank");
    } else {
      // Generate plain-text download from content
      const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title.replace(/\s+/g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Note downloaded");
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">

      {/* ── Left: Notes list panel ────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-72 shrink-0 flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <MdMenuBook size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              {subject?.emoji} Revision Notes
            </h1>
            <p className="text-xs text-[var(--text-muted)]">{notes.length} notes</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Search notes..."
            className="w-full h-9 pl-8 pr-8 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
          {searchRaw && (
            <button onClick={() => setSearchRaw("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <MdClose size={14} />
            </button>
          )}
        </div>

        {/* Topic filters */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTopic(null)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                !activeTopic
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-primary-400"
              )}
            >
              All
            </button>
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTopic(t === activeTopic ? null : t)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                  activeTopic === t
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-primary-400"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-3 space-y-2">
                  <Skeleton variant="text" width="75%" />
                  <Skeleton variant="text" width="45%" height={10} />
                </div>
              ))
            : filtered.length === 0
            ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-2xl mb-2">🔍</span>
                  <p className="text-xs text-[var(--text-muted)]">No notes match your search.</p>
                </div>
              )
            : filtered.map((note) => (
                <motion.button
                  key={note.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border transition-all duration-150",
                    selectedNote?.id === note.id
                      ? "bg-primary-600/10 border-primary-500/40 dark:bg-primary-900/20"
                      : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-xs font-medium leading-snug",
                      selectedNote?.id === note.id
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-[var(--text-primary)]"
                    )}>
                      {note.title}
                    </p>
                    <MdChevronRight size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  </div>
                  {note.topic && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)]">
                      {note.topic}
                    </span>
                  )}
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Updated {formatDate(note.updated_at)}
                  </p>
                </motion.button>
              ))}
        </div>
      </motion.aside>

      {/* ── Right: Note reader ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 card overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedNote ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="text-4xl mb-3">📖</div>
                <p className="text-sm text-[var(--text-secondary)]">Select a note to start reading.</p>
              </div>
            </div>
          ) : (
            <motion.div
              key={selectedNote.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Note toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    {selectedNote.title}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {selectedNote.topic && <span className="mr-2">{selectedNote.topic}</span>}
                    Updated {formatDate(selectedNote.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(selectedNote.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all"
                    title="Bookmark"
                  >
                    {bookmarked.has(selectedNote.id)
                      ? <MdBookmark size={18} className="text-yellow-500" />
                      : <MdBookmarkBorder size={18} />
                    }
                  </button>
                  <button
                    onClick={() => handleDownload(selectedNote)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    title="Download"
                  >
                    <MdDownload size={18} />
                  </button>
                </div>
              </div>

              {/* Note content */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-[var(--text-primary)] prose-headings:font-semibold
                  prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed
                  prose-strong:text-[var(--text-primary)]
                  prose-code:bg-[var(--bg-secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary-600 prose-code:text-xs
                  prose-pre:bg-dark-900 prose-pre:rounded-xl
                  prose-ul:text-[var(--text-secondary)] prose-ol:text-[var(--text-secondary)]
                  prose-blockquote:border-primary-500 prose-blockquote:text-[var(--text-secondary)]
                  prose-hr:border-[var(--border)]">
                  <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
