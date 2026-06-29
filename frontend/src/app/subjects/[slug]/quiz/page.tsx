"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MdQuiz, MdTimer, MdShuffle, MdPlayArrow,
  MdCheckCircle, MdRadioButtonUnchecked,
} from "react-icons/md";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { SUBJECTS, QUIZ_TIMER_OPTIONS, QUIZ_QUESTION_COUNTS } from "@/utils/constants";
import { cn } from "@/utils/helpers";
import quizService from "@/services/quizService";
import { useQuizStore } from "@/store/quizStore";

/* ─── Option chip component ──────────────────────────────────────────────── */
function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150",
        selected
          ? "bg-primary-600 border-primary-600 text-white shadow-glow"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-primary-500 hover:text-primary-600 bg-[var(--bg-secondary)]"
      )}
    >
      {label}
    </button>
  );
}

/* ─── Section wrapper ────────────────────────────────────────────────────── */
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function QuizConfigPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { initSession } = useQuizStore();
  const subject = SUBJECTS.find((s) => s.slug === slug);

  // Config state
  const [quizType, setQuizType] = useState<"theory" | "coding" | "mixed">("mixed");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const response = await quizService.startQuiz({
        subject_ids: [slug],
        type: quizType,
        difficulty,
        question_count: questionCount,
        timer_minutes: timerMinutes,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
      });

      initSession(
        response.attempt_id,
        response.questions,
        {
          subject_ids: [slug],
          type: quizType,
          difficulty,
          question_count: questionCount,
          timer_minutes: timerMinutes,
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
        },
        response.timer_seconds
      );

      router.push(`/subjects/${slug}/quiz/session`);
    } catch {
      toast.error("Failed to start quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug, quizType, difficulty, questionCount, timerMinutes, shuffleQuestions, shuffleOptions, initSession, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white">
          <MdQuiz size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Configure Quiz</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {subject?.emoji} {subject?.name}
          </p>
        </div>
      </motion.div>

      {/* Quiz Type */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Section title="Quiz Type" icon={MdQuiz}>
          <div className="flex flex-wrap gap-2">
            {(["theory", "coding", "mixed"] as const).map((t) => (
              <OptionChip
                key={t}
                label={t.charAt(0).toUpperCase() + t.slice(1)}
                selected={quizType === t}
                onClick={() => setQuizType(t)}
              />
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {quizType === "theory" && "Conceptual and definition-based questions."}
            {quizType === "coding" && "Code output, debugging, and logic questions."}
            {quizType === "mixed" && "A balanced mix of theory and coding questions."}
          </p>
        </Section>
      </motion.div>

      {/* Difficulty */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Section title="Difficulty" icon={MdQuiz}>
          <div className="flex flex-wrap gap-2">
            {(["easy", "medium", "hard", "mixed"] as const).map((d) => (
              <OptionChip
                key={d}
                label={d.charAt(0).toUpperCase() + d.slice(1)}
                selected={difficulty === d}
                onClick={() => setDifficulty(d)}
              />
            ))}
          </div>
        </Section>
      </motion.div>

      {/* Question Count */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
        <Section title="Number of Questions" icon={MdQuiz}>
          <div className="flex flex-wrap gap-2">
            {[10, 15, 20, 30, 50].map((n) => (
              <OptionChip
                key={n}
                label={String(n)}
                selected={questionCount === n}
                onClick={() => setQuestionCount(n)}
              />
            ))}
          </div>
        </Section>
      </motion.div>

      {/* Timer */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Section title="Timer" icon={MdTimer}>
          <div className="flex flex-wrap gap-2">
            {QUIZ_TIMER_OPTIONS.map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={timerMinutes === opt.value}
                onClick={() => setTimerMinutes(opt.value)}
              />
            ))}
          </div>
        </Section>
      </motion.div>

      {/* Shuffle options */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
        <Section title="Options" icon={MdShuffle}>
          <div className="space-y-3">
            {[
              { label: "Shuffle questions", value: shuffleQuestions, set: setShuffleQuestions },
              { label: "Shuffle answer options (MCQ)", value: shuffleOptions, set: setShuffleOptions },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => opt.set(!opt.value)}
                className="flex items-center gap-3 w-full text-left"
              >
                {opt.value
                  ? <MdCheckCircle size={20} className="text-primary-500 shrink-0" />
                  : <MdRadioButtonUnchecked size={20} className="text-[var(--text-muted)] shrink-0" />
                }
                <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
              </button>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* Summary + Start */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5 flex items-center justify-between gap-4"
      >
        <div className="text-sm text-[var(--text-secondary)] space-y-1">
          <p>
            <span className="font-medium text-[var(--text-primary)]">{questionCount}</span> questions ·{" "}
            <span className="font-medium text-[var(--text-primary)] capitalize">{difficulty}</span> ·{" "}
            <span className="font-medium text-[var(--text-primary)] capitalize">{quizType}</span>
          </p>
          <p>
            Timer: <span className="font-medium text-[var(--text-primary)]">
              {timerMinutes === 0 ? "None" : `${timerMinutes} min`}
            </span>
          </p>
        </div>

        <Button
          onClick={handleStartQuiz}
          loading={loading}
          size="lg"
          leftIcon={<MdPlayArrow size={20} />}
        >
          Start Quiz
        </Button>
      </motion.div>
    </div>
  );
}
