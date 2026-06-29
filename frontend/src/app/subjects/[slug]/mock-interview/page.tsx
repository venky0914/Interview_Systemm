"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdMic, MdMicOff, MdSend, MdPlayArrow, MdStop,
  MdRecordVoiceOver, MdAutoAwesome, MdStar,
} from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/charts/ProgressRing";
import api from "@/services/api";
import { cn, difficultyColor } from "@/utils/helpers";
import { SUBJECTS, COMPANIES } from "@/utils/constants";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface InterviewMessage {
  role: "ai" | "user";
  content: string;
  technical_score?: number;
  communication_score?: number;
  improvement_tip?: string;
}

interface InterviewConfig {
  interview_type: "technical" | "hr" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  company?: string;
}

/* ─── Config screen ──────────────────────────────────────────────────────── */
function ConfigScreen({
  slug,
  onStart,
}: {
  slug: string;
  onStart: (config: InterviewConfig) => void;
}) {
  const [type, setType] = useState<"technical" | "hr" | "mixed">("technical");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [company, setCompany] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    onStart({ interview_type: type, difficulty, company: company || undefined });
  };

  const subject = SUBJECTS.find((s) => s.slug === slug);

  function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
        selected
          ? "bg-primary-600 border-primary-600 text-white shadow-glow"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-primary-500 bg-[var(--bg-secondary)]"
      )}>{label}</button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
          <MdRecordVoiceOver size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Mock Interview</h1>
          <p className="text-sm text-[var(--text-secondary)]">{subject?.emoji} {subject?.name}</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Interview Type</p>
          <div className="flex flex-wrap gap-2">
            {(["technical", "hr", "mixed"] as const).map((t) => (
              <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} selected={type === t} onClick={() => setType(t)} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <Chip key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} selected={difficulty === d} onClick={() => setDifficulty(d)} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Company (Optional)</p>
          <div className="flex flex-wrap gap-2">
            <Chip label="Any" selected={!company} onClick={() => setCompany("")} />
            {COMPANIES.map((c) => (
              <Chip key={c} label={c} selected={company === c} onClick={() => setCompany(c)} />
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleStart} loading={loading} fullWidth size="lg" leftIcon={<MdPlayArrow size={20} />}>
        Start Interview
      </Button>
    </motion.div>
  );
}

/* ─── Score badge ────────────────────────────────────────────────────────── */
function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? "text-accent-600" : score >= 5 ? "text-yellow-500" : "text-red-500";
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-[var(--text-muted)]">{label}:</span>
      <span className={cn("font-bold", color)}>{score}/10</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <MdStar key={i} size={10} className={i < Math.round(score / 2) ? "text-yellow-400" : "text-[var(--border)]"} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main interview screen ──────────────────────────────────────────────── */
export default function MockInterviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [phase, setPhase] = useState<"config" | "interview" | "report">("config");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions] = useState(8);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<{
    overall_score: number; ai_feedback: string;
    technical_avg: number; communication_avg: number;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  const handleStart = useCallback(async (config: InterviewConfig) => {
    try {
      const { data } = await api.post("/interview/start", {
        subject_id: slug,
        ...config,
      });
      setSessionId(data.session_id);
      setMessages([{ role: "ai", content: data.first_question }]);
      setPhase("interview");
    } catch {
      toast.error("Failed to start interview. Please try again.");
    }
  }, [slug]);

  const handleSend = useCallback(async () => {
    if (!userInput.trim() || !sessionId || sending) return;
    const answer = userInput.trim();
    setUserInput("");
    setSending(true);

    // Append user message immediately
    setMessages((prev) => [...prev, { role: "user", content: answer }]);
    setIsAiTyping(true);

    try {
      const { data } = await api.post("/interview/respond", {
        session_id: sessionId,
        answer,
        question_index: questionIndex,
      });

      setIsAiTyping(false);
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);

      if (data.is_complete) {
        // Fetch full report
        const { data: reportData } = await api.get(`/interview/${sessionId}/report`);
        setReport(reportData);
        setPhase("report");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.next_question,
            technical_score: data.technical_score,
            communication_score: data.communication_score,
            improvement_tip: data.improvement_tip,
          },
        ]);
      }
    } catch {
      setIsAiTyping(false);
      toast.error("Failed to send response. Please try again.");
    } finally {
      setSending(false);
    }
  }, [userInput, sessionId, questionIndex, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Config ── */
  if (phase === "config") return (
    <div className="flex items-start justify-center pt-8">
      <ConfigScreen slug={slug} onStart={handleStart} />
    </div>
  );

  /* ── Final Report ── */
  if (phase === "report" && report) return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="card p-8 text-center space-y-4">
        <div className="text-4xl">
          {report.overall_score >= 70 ? "🏆" : report.overall_score >= 50 ? "👍" : "📚"}
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Interview Complete!</h1>

        <div className="flex items-center justify-center gap-8 py-4">
          <ProgressRing value={report.overall_score} size={120} strokeWidth={10} color="auto" sublabel="Overall" />
          <div className="space-y-3 text-left">
            <ScoreBadge label="Technical" score={report.technical_avg} />
            <ScoreBadge label="Communication" score={report.communication_avg} />
          </div>
        </div>

        <div className="card p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <RiRobot2Line size={16} className="text-primary-500" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">AI Feedback</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.ai_feedback}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setPhase("config"); setMessages([]); setQuestionIndex(0); }}>
            Try Again
          </Button>
          <Button onClick={() => window.location.href = `/subjects/${slug}`}>
            Back to Subject
          </Button>
        </div>
      </div>
    </motion.div>
  );

  /* ── Interview chat ── */
  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Progress bar */}
      <div className="card px-5 py-3 flex items-center gap-4 shrink-0">
        <RiRobot2Line size={18} className="text-primary-500 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>Question {Math.min(questionIndex + 1, totalQuestions)} of {totalQuestions}</span>
            <span>{Math.round((questionIndex / totalQuestions) * 100)}% complete</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              animate={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0",
                msg.role === "ai" ? "bg-gradient-to-br from-primary-500 to-secondary-500" : "bg-dark-600"
              )}>
                {msg.role === "ai" ? <RiRobot2Line size={16} /> : "U"}
              </div>

              <div className="flex flex-col gap-1.5 max-w-[75%]">
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "ai"
                    ? "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm"
                    : "bg-primary-600 text-white rounded-tr-sm"
                )}>
                  {msg.content}
                </div>

                {/* Scores under previous AI message (not first) */}
                {msg.role === "ai" && msg.technical_score !== undefined && (
                  <div className="flex gap-4 px-1">
                    <ScoreBadge label="Technical" score={msg.technical_score} />
                    <ScoreBadge label="Communication" score={msg.communication_score ?? 0} />
                  </div>
                )}
                {msg.improvement_tip && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 px-1 flex items-start gap-1">
                    <MdAutoAwesome size={12} className="shrink-0 mt-0.5" />
                    {msg.improvement_tip}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI typing indicator */}
        {isAiTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-end"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shrink-0">
              <RiRobot2Line size={16} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="card p-4 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
            disabled={isAiTyping || sending}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!userInput.trim() || isAiTyping}
            loading={sending}
            leftIcon={<MdSend size={16} />}
            className="shrink-0"
          >
            Send
          </Button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2">
          Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
