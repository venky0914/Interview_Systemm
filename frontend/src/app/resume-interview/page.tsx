"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdUploadFile, MdDescription, MdDelete, MdPlayArrow,
  MdCheckCircle, MdPerson, MdWork, MdCode,
} from "react-icons/md";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import { cn } from "@/utils/helpers";

interface ParsedResume {
  id: string;
  filename: string;
  skills: string[];
  projects: string[];
  experience: string[];
  extracted_text: string;
}

/* ─── Drop zone ──────────────────────────────────────────────────────────── */
function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") onFile(file);
    else toast.error("Please upload a PDF file");
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
        dragging
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-[1.02]"
          : "border-[var(--border)] hover:border-primary-400 hover:bg-[var(--bg-secondary)]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <motion.div
        animate={{ y: dragging ? -6 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <MdUploadFile size={32} className="text-primary-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            Drop your resume here
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            or <span className="text-primary-600 font-medium">click to browse</span> · PDF only
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Max 10MB</p>
      </motion.div>
    </div>
  );
}

/* ─── Resume preview card ────────────────────────────────────────────────── */
function ResumePreview({
  resume,
  onClear,
  onStart,
  starting,
}: {
  resume: ParsedResume;
  onClear: () => void;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* File card */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
          <MdDescription size={24} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {resume.filename}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <MdCheckCircle size={13} className="text-accent-500" />
            <p className="text-xs text-accent-600">Successfully parsed</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <MdDelete size={18} />
        </button>
      </div>

      {/* Parsed sections */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: MdCode, label: "Skills Detected", items: resume.skills, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20" },
          { icon: MdWork, label: "Projects Found", items: resume.projects, color: "text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20" },
          { icon: MdPerson, label: "Experience", items: resume.experience, color: "text-accent-500 bg-accent-50 dark:bg-accent-900/20" },
        ].map((section) => (
          <div key={section.label} className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", section.color)}>
                <section.icon size={15} />
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">{section.label}</p>
            </div>
            {section.items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {section.items.slice(0, 8).map((item) => (
                  <span
                    key={item}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"
                  >
                    {item}
                  </span>
                ))}
                {section.items.length > 8 && (
                  <span className="text-[10px] text-[var(--text-muted)] py-0.5">
                    +{section.items.length - 8} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">None detected</p>
            )}
          </div>
        ))}
      </div>

      {/* Interview type selection + start */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Ready to start?</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            The AI will interview you based on your resume — projects, skills, and experience.
          </p>
        </div>
        <Button
          onClick={onStart}
          loading={starting}
          size="lg"
          leftIcon={<MdPlayArrow size={20} />}
        >
          Start Interview
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ResumeInterviewPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [starting, setStarting] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const { data } = await api.post("/resume/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume({ ...data, filename: file.name });
      toast.success("Resume parsed successfully!");
    } catch {
      toast.error("Failed to parse resume. Please try a different PDF.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleStart = useCallback(async () => {
    if (!resume) return;
    setStarting(true);
    try {
      const { data } = await api.post("/interview/start", {
        resume_id: resume.id,
        interview_type: "mixed",
        difficulty: "medium",
      });
      // Navigate to a shared interview session page
      router.push(`/interview-session/${data.session_id}`);
    } catch {
      toast.error("Failed to start interview. Please try again.");
      setStarting(false);
    }
  }, [resume, router]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
            <MdDescription size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Resume Interview</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Upload your resume — AI creates a personalized interview just for you.
            </p>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { step: "1", title: "Upload Resume", desc: "PDF parsed and analyzed by AI", icon: "📄" },
          { step: "2", title: "AI Analyzes", desc: "Extracts skills, projects, experience", icon: "🤖" },
          { step: "3", title: "Interview", desc: "AI asks targeted questions", icon: "🎯" },
        ].map((item) => (
          <div key={item.step} className="card p-4 text-center space-y-2">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">{item.title}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Upload area or preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-12 flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Analyzing your resume...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Extracting skills, projects & experience</p>
              </div>
            </motion.div>
          ) : resume ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResumePreview
                resume={resume}
                onClear={() => setResume(null)}
                onStart={handleStart}
                starting={starting}
              />
            </motion.div>
          ) : (
            <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFile={handleFile} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tips */}
      {!resume && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-5 space-y-3"
        >
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tips for best results</p>
          <ul className="space-y-2">
            {[
              "Use a clean, ATS-friendly PDF format",
              "Include project names and technology stacks clearly",
              "List skills in a dedicated section",
              "Mention years of experience for each role",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                <MdCheckCircle size={13} className="text-accent-500 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
