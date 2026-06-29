"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  MdPlayArrow, MdLightbulb, MdVisibility, MdVisibilityOff,
  MdCode, MdCheckCircle, MdError, MdRefresh, MdChevronRight,
} from "react-icons/md";
import { SiPython, SiMysql } from "react-icons/si";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { subjectService } from "@/services/quizService";
import api from "@/services/api";
import { cn, difficultyColor } from "@/utils/helpers";
import { SUBJECTS } from "@/utils/constants";

// Monaco editor lazy-loaded to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  starter_code: string;
  solution_code?: string;
  expected_output: string;
  language: string;
}

interface RunResult {
  output: string;
  error: string | null;
  passed: boolean;
  execution_time_ms: number;
}

const HINT_REVEAL_DELAY = 500; // ms between hint reveals

export default function CodingPage() {
  const { slug } = useParams<{ slug: string }>();
  const subject = SUBJECTS.find((s) => s.slug === slug);

  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selected, setSelected] = useState<CodingProblem | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Static hints — in production these come from the backend per-problem
  const HINTS = [
    "Break the problem into smaller steps first.",
    "Think about edge cases like empty inputs or None values.",
    "Consider the time complexity of your approach.",
  ];

  useEffect(() => {
    subjectService.getCodingProblems(slug)
      .then((data) => {
        setProblems(data);
        if (data.length > 0) selectProblem(data[0]);
      })
      .catch(() => toast.error("Failed to load problems"))
      .finally(() => setLoading(false));
  }, [slug]);

  const selectProblem = useCallback(async (problem: CodingProblem) => {
    setSelected(problem);
    setCode(problem.starter_code || "");
    setResult(null);
    setShowSolution(false);
    setHintsRevealed(0);

    // Fetch full detail (includes solution & expected output)
    try {
      const detail = await subjectService.getCodingProblemDetail(problem.id);
      setSelected(detail);
    } catch {
      // Use list data as fallback
    }
  }, []);

  const handleRun = useCallback(async () => {
    if (!selected) return;
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post("/coding/run", {
        problem_id: selected.id,
        code,
        language: selected.language,
      });
      setResult(data);
      if (data.passed) toast.success("All tests passed! 🎉");
      else toast.error("Some tests failed. Check the output.");
    } catch {
      toast.error("Execution failed. Please try again.");
    } finally {
      setRunning(false);
    }
  }, [selected, code]);

  const handleReset = () => {
    if (!selected) return;
    setCode(selected.starter_code || "");
    setResult(null);
    toast("Code reset to starter template");
  };

  const filteredProblems = problems.filter((p) =>
    activeFilter === "all" ? true : p.difficulty === activeFilter
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">

      {/* ── Left: Problem list ────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <MdCode size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              {subject?.emoji} Coding Practice
            </h1>
            <p className="text-xs text-[var(--text-muted)]">{problems.length} problems</p>
          </div>
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["all", "easy", "medium", "hard"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium border capitalize transition-all",
                activeFilter === f
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-primary-400"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Problem list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-3 space-y-2">
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="35%" height={10} />
                </div>
              ))
            : filteredProblems.map((problem) => (
                <motion.button
                  key={problem.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => selectProblem(problem)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all",
                    selected?.id === problem.id
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                      {problem.title}
                    </p>
                    <MdChevronRight size={13} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] border font-medium", difficultyColor(problem.difficulty))}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {problem.language === "python" ? "🐍 Python" : "💾 SQL"}
                    </span>
                  </div>
                </motion.button>
              ))}
        </div>
      </aside>

      {/* ── Main: Problem + Editor ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Top split: description | editor */}
        <div className="flex gap-3 flex-1 min-h-0">

          {/* Problem description */}
          <div className="w-80 shrink-0 card overflow-hidden flex flex-col">
            {selected ? (
              <>
                <div className="px-5 py-4 border-b border-[var(--border)] shrink-0">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    {selected.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] border font-medium", difficultyColor(selected.difficulty))}>
                      {selected.difficulty}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {selected.language === "python" ? "🐍 Python" : "💾 SQL"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {selected.description}
                </div>

                {/* Expected output */}
                {selected.expected_output && (
                  <div className="px-5 py-3 border-t border-[var(--border)] shrink-0">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1.5">Expected Output</p>
                    <pre className="text-xs text-accent-600 dark:text-accent-400 font-mono bg-accent-50 dark:bg-accent-900/20 rounded-lg px-3 py-2 overflow-x-auto">
                      {selected.expected_output}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <div className="text-3xl mb-2">💻</div>
                  <p className="text-xs text-[var(--text-muted)]">Select a problem to start coding.</p>
                </div>
              </div>
            )}
          </div>

          {/* Code editor */}
          <div className="flex-1 card overflow-hidden flex flex-col min-w-0">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0 bg-dark-900/50">
              <div className="flex items-center gap-2">
                {selected?.language === "python"
                  ? <SiPython size={14} className="text-yellow-400" />
                  : <SiMysql size={14} className="text-blue-400" />
                }
                <span className="text-xs text-dark-400 font-mono">
                  {selected?.language === "python" ? "solution.py" : "query.sql"}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-dark-400 hover:text-white transition-colors"
              >
                <MdRefresh size={13} /> Reset
              </button>
            </div>

            {/* Monaco */}
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language={selected?.language === "sql" ? "sql" : "python"}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val ?? "")}
                options={{
                  fontSize: 13,
                  fontFamily: "JetBrains Mono, Fira Code, monospace",
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  tabSize: 4,
                  wordWrap: "on",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />
            </div>

            {/* Run button row */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)] shrink-0 bg-dark-900/50">
              <Button
                onClick={handleRun}
                loading={running}
                leftIcon={<MdPlayArrow size={18} />}
                className="bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                Run Code
              </Button>

              <button
                onClick={() => setHintsRevealed((h) => Math.min(h + 1, HINTS.length))}
                className="flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                <MdLightbulb size={15} />
                {hintsRevealed < HINTS.length ? `Hint (${HINTS.length - hintsRevealed} left)` : "No more hints"}
              </button>

              {selected?.solution_code && (
                <button
                  onClick={() => setShowSolution((s) => !s)}
                  className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showSolution ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                  {showSolution ? "Hide solution" : "Show solution"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom: output / hints / solution ─────────────────────── */}
        <div className="h-44 shrink-0 grid grid-cols-3 gap-3">

          {/* Output panel */}
          <div className="col-span-2 card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] shrink-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Output</span>
              {result && (
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
                  result.passed
                    ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600"
                    : "bg-red-100 dark:bg-red-900/20 text-red-500"
                )}>
                  {result.passed ? <MdCheckCircle size={11} /> : <MdError size={11} />}
                  {result.passed ? "Passed" : "Failed"}
                </span>
              )}
              {result?.execution_time_ms && (
                <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                  {result.execution_time_ms}ms
                </span>
              )}
            </div>
            <div className="flex-1 overflow-auto p-3">
              {running ? (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  Executing...
                </div>
              ) : result ? (
                <pre className={cn(
                  "text-xs font-mono whitespace-pre-wrap",
                  result.error ? "text-red-500" : "text-[var(--text-primary)]"
                )}>
                  {result.error || result.output || "(no output)"}
                </pre>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Run your code to see output here.</p>
              )}
            </div>
          </div>

          {/* Hints + solution panel */}
          <div className="card overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-[var(--border)] shrink-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                {showSolution ? "Solution" : "Hints"}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <AnimatePresence mode="wait">
                {showSolution && selected?.solution_code ? (
                  <motion.pre
                    key="solution"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-mono text-accent-500 whitespace-pre-wrap"
                  >
                    {selected.solution_code}
                  </motion.pre>
                ) : hintsRevealed > 0 ? (
                  <motion.div key="hints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    {HINTS.slice(0, hintsRevealed).map((hint, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                        <MdLightbulb size={13} className="text-yellow-500 shrink-0 mt-0.5" />
                        {hint}
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    Click "Hint" to reveal hints one at a time.
                  </p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
