"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MdPlayArrow, MdBusiness, MdArrowForward } from "react-icons/md";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import { cn } from "@/utils/helpers";
import { SUBJECTS, COMPANIES } from "@/utils/constants";

/* ─── Company metadata ───────────────────────────────────────────────────── */
const COMPANY_META: Record<string, { logo: string; desc: string; focus: string[] }> = {
  Amazon: {
    logo: "🛒",
    desc: "Leadership Principles + system design + DSA",
    focus: ["Leadership Principles", "System Design", "DSA", "Behavioral"],
  },
  Google: {
    logo: "🔍",
    desc: "Algorithmic thinking + coding efficiency + Googleyness",
    focus: ["Algorithms", "Data Structures", "System Design", "Culture Fit"],
  },
  Microsoft: {
    logo: "💻",
    desc: "Problem solving + Azure cloud + team collaboration",
    focus: ["Problem Solving", "Cloud", "OOP", "Behavioral"],
  },
  TCS: {
    logo: "🏢",
    desc: "Technical aptitude + communication + domain knowledge",
    focus: ["Aptitude", "Technical", "Communication", "HR"],
  },
  Infosys: {
    logo: "🌐",
    desc: "Verbal ability + logical reasoning + coding",
    focus: ["Verbal", "Logical", "Coding", "HR Round"],
  },
  Deloitte: {
    logo: "📊",
    desc: "Consulting skills + analytics + case studies",
    focus: ["Analytics", "Case Studies", "Communication", "Behavioral"],
  },
  Accenture: {
    logo: "⚡",
    desc: "Technical + communication + situational judgment",
    focus: ["Technical", "Situational", "Communication", "Values"],
  },
  Capgemini: {
    logo: "🎯",
    desc: "Aptitude + pseudo code + technical MCQs",
    focus: ["Aptitude", "Pseudo Code", "Technical MCQ", "HR"],
  },
};

function CompanyCard({
  name,
  selected,
  onClick,
}: {
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = COMPANY_META[name];
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all duration-150",
        selected
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow"
          : "border-[var(--border)] bg-[var(--bg-card)] hover:border-primary-300 hover:bg-[var(--bg-secondary)]"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{meta?.logo ?? "🏢"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-sm font-semibold",
              selected ? "text-primary-600 dark:text-primary-400" : "text-[var(--text-primary)]"
            )}>
              {name}
            </p>
            {selected && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-600 text-white">
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{meta?.desc}</p>
          {meta?.focus && (
            <div className="flex flex-wrap gap-1 mt-2">
              {meta.focus.map((f) => (
                <span
                  key={f}
                  className="px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)] border border-[var(--border)]"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Config chip ────────────────────────────────────────────────────────── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
        selected
          ? "bg-primary-600 border-primary-600 text-white shadow-glow"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-primary-400 bg-[var(--bg-secondary)]"
      )}
    >
      {label}
    </button>
  );
}

export default function CompanyInterviewPage() {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [interviewType, setInterviewType] = useState<"technical" | "hr" | "mixed">("mixed");
  const [loading, setLoading] = useState(false);

  const handleStart = useCallback(async () => {
    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/interview/start", {
        subject_id: selectedSubject || null,
        interview_type: interviewType,
        difficulty,
        company: selectedCompany,
      });
      router.push(`/subjects/${selectedSubject || "python"}/mock-interview?session=${data.session_id}`);
    } catch {
      toast.error("Failed to start interview. Please try again.");
      setLoading(false);
    }
  }, [selectedCompany, selectedSubject, difficulty, interviewType, router]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500 to-primary-600 flex items-center justify-center text-white">
          <MdBusiness size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Company Specific Interview</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Practice with questions tailored to top companies
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Company selection */}
        <div className="lg:col-span-3 space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Select Company <span className="text-red-500">*</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMPANIES.map((company) => (
                <CompanyCard
                  key={company}
                  name={company}
                  selected={selectedCompany === company}
                  onClick={() => setSelectedCompany(company)}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Config + start */}
        <div className="lg:col-span-2 space-y-5">
          {/* Subject */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Subject (Optional)</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubject("")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                  !selectedSubject
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-primary-400 bg-[var(--bg-secondary)]"
                )}
              >
                General
              </button>
              {SUBJECTS.slice(0, 6).map((s) => (
                <button
                  key={s.slug}
                  onClick={() => setSelectedSubject(s.slug)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                    selectedSubject === s.slug
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-primary-400 bg-[var(--bg-secondary)]"
                  )}
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Interview type */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="card p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Interview Type</h3>
            <div className="flex flex-wrap gap-2">
              {(["technical", "hr", "mixed"] as const).map((t) => (
                <Chip
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                  selected={interviewType === t}
                  onClick={() => setInterviewType(t)}
                />
              ))}
            </div>
          </motion.div>

          {/* Difficulty */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="card p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Difficulty</h3>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <Chip
                  key={d}
                  label={d.charAt(0).toUpperCase() + d.slice(1)}
                  selected={difficulty === d}
                  onClick={() => setDifficulty(d)}
                />
              ))}
            </div>
          </motion.div>

          {/* Summary + Start */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
            className="card p-5 space-y-4"
          >
            {selectedCompany ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <span className="text-xl">{COMPANY_META[selectedCompany]?.logo}</span>
                <div>
                  <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {selectedCompany}
                  </p>
                  <p className="text-xs text-primary-600/70 dark:text-primary-400/70 capitalize">
                    {interviewType} · {difficulty}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-2">
                Select a company to start
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleStart}
              loading={loading}
              disabled={!selectedCompany}
              leftIcon={<MdPlayArrow size={20} />}
            >
              Start Interview
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
