"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdUploadFile, MdQuiz, MdPeople, MdBarChart,
  MdAdd, MdDelete, MdEdit, MdCheckCircle,
  MdClose, MdCloudUpload,
} from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import { cn } from "@/utils/helpers";
import { SUBJECTS } from "@/utils/constants";

type Tab = "upload" | "questions" | "analytics";

/* ─── Analytics Card ─────────────────────────────────────────────────────── */
function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className={cn("card p-5 border-l-4", color)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
    </div>
  );
}

/* ─── Upload Notes Tab ───────────────────────────────────────────────────── */
function UploadNotesTab() {
  const [form, setForm] = useState({ subject_slug: "", title: "", topic: "", content: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!form.subject_slug || !form.title || !form.topic) {
      toast.error("Please fill in subject, title, and topic.");
      return;
    }
    if (!form.content && !file) {
      toast.error("Add note content or upload a PDF/image.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("subject_slug", form.subject_slug);
      formData.append("title", form.title);
      formData.append("topic", form.topic);
      formData.append("content", form.content);
      if (file) formData.append("file", file);

      const { data } = await api.post("/admin/notes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Note uploaded & indexed! (${data.message})`);
      setForm({ subject_slug: "", title: "", topic: "", content: "" });
      setFile(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Upload Revision Note</h3>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Subject</label>
          <select
            value={form.subject_slug}
            onChange={(e) => setForm((f) => ({ ...f, subject_slug: e.target.value }))}
            className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">Select a subject...</option>
            {SUBJECTS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.emoji} {s.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="Note Title"
          placeholder="e.g. Python List Comprehension"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <Input
          label="Topic / Chapter"
          placeholder="e.g. Data Structures"
          value={form.topic}
          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
        />

        {/* Content textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Note Content (Markdown supported)
          </label>
          <textarea
            rows={8}
            placeholder="Write or paste note content here... (Markdown supported)&#10;&#10;# Heading&#10;**Bold** text, `code`, lists, tables..."
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all font-mono"
          />
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Upload PDF / Image (optional — text extracted via OCR)
          </label>
          <label className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            file
              ? "border-accent-500 bg-accent-50 dark:bg-accent-900/10"
              : "border-[var(--border)] hover:border-primary-400 bg-[var(--bg-secondary)]"
          )}>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <MdCheckCircle size={18} className="text-accent-500 shrink-0" />
                <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setFile(null); }}
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <MdClose size={16} />
                </button>
              </>
            ) : (
              <>
                <MdCloudUpload size={18} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">Click to attach PDF or image</span>
              </>
            )}
          </label>
        </div>

        <Button
          fullWidth
          onClick={handleSubmit}
          loading={uploading}
          leftIcon={<MdUploadFile size={18} />}
        >
          Upload & Index Note
        </Button>
      </div>

      {/* RAG indexing info */}
      <div className="card p-4 flex items-start gap-3">
        <RiRobot2Line size={16} className="text-primary-500 shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)]">
          After upload, notes are automatically chunked and indexed into the FAISS vector store.
          Students can immediately query them via the AI Chat Assistant.
        </p>
      </div>
    </div>
  );
}

/* ─── Bulk Questions Tab ─────────────────────────────────────────────────── */
function QuestionsTab() {
  const [questions, setQuestions] = useState([
    { subject_id: "", type: "theory", difficulty: "medium", question_text: "", correct_answer: "", tags: "" },
  ]);
  const [uploading, setUploading] = useState(false);

  const addRow = () =>
    setQuestions((q) => [
      ...q,
      { subject_id: "", type: "theory", difficulty: "medium", question_text: "", correct_answer: "", tags: "" },
    ]);

  const removeRow = (i: number) =>
    setQuestions((q) => q.filter((_, idx) => idx !== i));

  const updateRow = (i: number, key: string, value: string) =>
    setQuestions((q) => q.map((row, idx) => idx === i ? { ...row, [key]: value } : row));

  const handleBulkUpload = async () => {
    const valid = questions.filter((q) => q.subject_id && q.question_text && q.correct_answer);
    if (valid.length === 0) {
      toast.error("Fill in at least one complete question.");
      return;
    }
    setUploading(true);
    try {
      const payload = valid.map((q) => ({
        ...q,
        tags: q.tags ? q.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        options: null,
        is_top_question: false,
      }));
      const { data } = await api.post("/admin/questions/bulk", payload);
      toast.success(`${data.created} questions uploaded!`);
      setQuestions([{ subject_id: "", type: "theory", difficulty: "medium", question_text: "", correct_answer: "", tags: "" }]);
    } catch {
      toast.error("Bulk upload failed. Check all required fields.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Bulk Add Questions ({questions.length})
        </h3>
        <Button size="sm" variant="outline" leftIcon={<MdAdd size={16} />} onClick={addRow}>
          Add Row
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">Question {i + 1}</span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <MdDelete size={15} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Subject */}
              <select
                value={q.subject_id}
                onChange={(e) => updateRow(i, "subject_id", e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">Subject...</option>
                {SUBJECTS.map((s) => <option key={s.slug} value={s.slug}>{s.emoji} {s.name}</option>)}
              </select>

              {/* Type */}
              <select
                value={q.type}
                onChange={(e) => updateRow(i, "type", e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="theory">Theory</option>
                <option value="coding">Coding</option>
              </select>

              {/* Difficulty */}
              <select
                value={q.difficulty}
                onChange={(e) => updateRow(i, "difficulty", e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <textarea
              rows={2}
              placeholder="Question text..."
              value={q.question_text}
              onChange={(e) => updateRow(i, "question_text", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none transition-all"
            />
            <textarea
              rows={2}
              placeholder="Correct answer..."
              value={q.correct_answer}
              onChange={(e) => updateRow(i, "correct_answer", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none transition-all"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated): python, loops, basics"
              value={q.tags}
              onChange={(e) => updateRow(i, "tags", e.target.value)}
              className="w-full h-8 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
            />
          </motion.div>
        ))}
      </div>

      <Button
        onClick={handleBulkUpload}
        loading={uploading}
        leftIcon={<MdUploadFile size={18} />}
      >
        Upload {questions.filter((q) => q.question_text).length} Question(s)
      </Button>
    </div>
  );
}

/* ─── Analytics Tab ──────────────────────────────────────────────────────── */
function AnalyticsTab() {
  const [stats, setStats] = useState<Record<string, number | string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics")
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 h-20 shimmer" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBox label="Total Users" value={stats?.total_users ?? 0} icon="👥" color="border-primary-500" />
        <StatBox label="Total Quizzes" value={stats?.total_quizzes ?? 0} icon="📝" color="border-secondary-500" />
        <StatBox label="Interviews Done" value={stats?.total_interviews ?? 0} icon="🎤" color="border-accent-500" />
        <StatBox label="Avg Quiz Score" value={`${stats?.avg_score ?? 0}%`} icon="📊" color="border-yellow-500" />
        <StatBox label="Subjects" value={stats?.total_subjects ?? 0} icon="📚" color="border-purple-500" />
        <StatBox label="Questions" value={stats?.total_questions ?? 0} icon="❓" color="border-orange-500" />
      </div>

      <div className="card p-5">
        <p className="text-xs text-[var(--text-muted)]">
          Full analytics charts (user growth, quiz trends, subject popularity) are coming in Phase 5 Admin Dashboard.
        </p>
      </div>
    </div>
  );
}

/* ─── Main Admin Page ────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  const TABS = [
    { key: "upload" as Tab, label: "Upload Notes", icon: MdUploadFile },
    { key: "questions" as Tab, label: "Questions", icon: MdQuiz },
    { key: "analytics" as Tab, label: "Analytics", icon: MdBarChart },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Panel</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage content, upload notes, and view platform analytics.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold border border-red-200 dark:border-red-800">
          Admin Only
        </span>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1.5 bg-[var(--bg-secondary)] rounded-2xl w-fit"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "upload" && <UploadNotesTab />}
          {activeTab === "questions" && <QuestionsTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
