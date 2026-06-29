"use client";

import { useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdArrowBack, MdArrowForward, MdSkipNext,
  MdFlag, MdTimer,
} from "react-icons/md";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { useQuizStore } from "@/store/quizStore";
import { useTimer, formatCountdown, timerStatus } from "@/hooks/useTimer";
import quizService from "@/services/quizService";
import { cn, difficultyColor } from "@/utils/helpers";

/* ─── Question progress dot ──────────────────────────────────────────────── */
function ProgressDot({
  index,
  answered,
  skipped,
  current,
  onClick,
}: {
  index: number;
  answered: boolean;
  skipped: boolean;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-full text-xs font-medium transition-all duration-150 border",
        current
          ? "bg-primary-600 text-white border-primary-600 scale-110"
          : answered
          ? "bg-accent-500/20 text-accent-600 border-accent-300 dark:border-accent-700"
          : skipped
          ? "bg-yellow-500/20 text-yellow-600 border-yellow-300"
          : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-primary-400"
      )}
    >
      {index + 1}
    </button>
  );
}

export default function QuizSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const totalTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const {
    attemptId,
    questions,
    currentIndex,
    answers,
    timerSeconds,
    isSubmitting,
    setAnswer,
    skipQuestion,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    tickTimer,
    setResult,
    setSubmitting,
    resetQuiz,
  } = useQuizStore();

  // Redirect if no active session
  useEffect(() => {
    if (!attemptId || questions.length === 0) {
      router.replace(`/subjects/${slug}/quiz`);
    } else {
      totalTimeRef.current = timerSeconds;
      startTimeRef.current = Date.now();
    }
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  // ── Submit quiz ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Build answer array — include skipped for unanswered questions
    const allAnswers = questions.map((q) => {
      const a = answers[q.id];
      return {
        question_id: q.id,
        user_answer: a?.user_answer ?? null,
        is_skipped: a?.is_skipped ?? true,
        time_spent_sec: a?.time_spent_sec ?? 0,
      };
    });

    try {
      const result = await quizService.completeQuiz(attemptId, allAnswers, timeTaken);
      setResult(result);
      router.push(`/subjects/${slug}/quiz/results`);
    } catch {
      toast.error("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  }, [attemptId, questions, answers, setResult, setSubmitting, router, slug]);

  // Timer countdown
  useTimer(timerSeconds, tickTimer, {
    enabled: timerSeconds > 0,
    onExpire: () => {
      toast("Time's up! Submitting your quiz.", { icon: "⏰" });
      handleSubmit();
    },
  });

  if (!currentQuestion) return null;

  const answeredCount = Object.values(answers).filter((a) => !a.is_skipped).length;
  const timerState = timerStatus(timerSeconds, totalTimeRef.current);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Timer */}
        {totalTimeRef.current > 0 && (
          <div
            className={cn(
              "flex items-center gap-1.5 ml-6 px-3 py-1.5 rounded-xl border text-sm font-mono font-semibold transition-colors",
              timerState === "danger"
                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 animate-pulse"
                : timerState === "warning"
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-600"
                : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]"
            )}
          >
            <MdTimer size={16} />
            {formatCountdown(timerSeconds)}
          </div>
        )}
      </div>

      {/* ── Question card ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="card p-7 space-y-6"
        >
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border font-medium",
                difficultyColor(currentQuestion.difficulty)
              )}
            >
              {currentQuestion.difficulty}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
              {currentQuestion.type}
            </span>
            {currentQuestion.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Question text */}
          <div className="text-base font-medium text-[var(--text-primary)] leading-relaxed">
            Q{currentIndex + 1}. {currentQuestion.question_text}
          </div>

          {/* MCQ options */}
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const selected = currentAnswer?.user_answer === option;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setAnswer(currentQuestion.id, option)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all duration-150",
                      selected
                        ? "bg-primary-600 border-primary-600 text-white shadow-glow"
                        : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    )}
                  >
                    <span className={cn("font-semibold mr-3", selected ? "text-white/70" : "text-[var(--text-muted)]")}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            /* Text answer */
            <textarea
              rows={5}
              value={currentAnswer?.user_answer ?? ""}
              onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          leftIcon={<MdArrowBack size={16} />}
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          Prev
        </Button>

        <Button
          variant="ghost"
          leftIcon={<MdSkipNext size={16} />}
          onClick={skipQuestion}
          className="text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
        >
          Skip
        </Button>

        <div className="flex-1" />

        {currentIndex < questions.length - 1 ? (
          <Button
            rightIcon={<MdArrowForward size={16} />}
            onClick={nextQuestion}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="secondary"
            leftIcon={<MdFlag size={16} />}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Submit Quiz
          </Button>
        )}
      </div>

      {/* ── Question grid navigator ─────────────────────────────────── */}
      <div className="card p-5">
        <p className="text-xs font-medium text-[var(--text-muted)] mb-3">Jump to question</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <ProgressDot
              key={q.id}
              index={i}
              answered={!!answers[q.id] && !answers[q.id].is_skipped}
              skipped={answers[q.id]?.is_skipped === true}
              current={i === currentIndex}
              onClick={() => goToQuestion(i)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          {[
            { color: "bg-accent-500/20 border-accent-300", label: "Answered" },
            { color: "bg-yellow-500/20 border-yellow-300", label: "Skipped" },
            { color: "bg-[var(--bg-secondary)] border-[var(--border)]", label: "Unanswered" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={cn("w-3.5 h-3.5 rounded-full border", l.color)} />
              <span className="text-[10px] text-[var(--text-muted)]">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Submit from bottom if near end */}
        {answeredCount >= Math.floor(questions.length * 0.6) && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              {answeredCount}/{questions.length} answered
            </span>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<MdFlag size={14} />}
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              Submit now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
