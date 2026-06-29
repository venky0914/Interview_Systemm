import { create } from "zustand";
import type { QuizConfig, QuizResult } from "@/types/quiz.types";

interface QuizQuestion {
  id: string;
  question_text: string;
  type: string;
  difficulty: string;
  options: string[];
  tags: string[];
}

interface QuizAnswer {
  question_id: string;
  user_answer: string | null;
  is_skipped: boolean;
  time_spent_sec: number;
}

interface QuizState {
  // Session
  attemptId: string | null;
  questions: QuizQuestion[];
  config: QuizConfig | null;
  timerSeconds: number;

  // Navigation
  currentIndex: number;
  answers: Record<string, QuizAnswer>;

  // Timing
  questionStartTime: number;

  // Result
  result: QuizResult | null;
  isSubmitting: boolean;

  // Actions
  initSession: (attemptId: string, questions: QuizQuestion[], config: QuizConfig, timerSeconds: number) => void;
  setAnswer: (questionId: string, answer: string) => void;
  skipQuestion: () => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  tickTimer: () => void;
  setResult: (result: QuizResult) => void;
  setSubmitting: (v: boolean) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  attemptId: null,
  questions: [],
  config: null,
  timerSeconds: 0,
  currentIndex: 0,
  answers: {},
  questionStartTime: Date.now(),
  result: null,
  isSubmitting: false,

  initSession: (attemptId, questions, config, timerSeconds) =>
    set({
      attemptId,
      questions,
      config,
      timerSeconds,
      currentIndex: 0,
      answers: {},
      questionStartTime: Date.now(),
      result: null,
      isSubmitting: false,
    }),

  setAnswer: (questionId, answer) => {
    const elapsed = Math.floor((Date.now() - get().questionStartTime) / 1000);
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          question_id: questionId,
          user_answer: answer,
          is_skipped: false,
          time_spent_sec: elapsed,
        },
      },
      questionStartTime: Date.now(),
    }));
  },

  skipQuestion: () => {
    const { questions, currentIndex, answers } = get();
    const q = questions[currentIndex];
    const elapsed = Math.floor((Date.now() - get().questionStartTime) / 1000);
    set({
      answers: {
        ...answers,
        [q.id]: {
          question_id: q.id,
          user_answer: null,
          is_skipped: true,
          time_spent_sec: elapsed,
        },
      },
      currentIndex: Math.min(currentIndex + 1, questions.length - 1),
      questionStartTime: Date.now(),
    });
  },

  goToQuestion: (index) =>
    set({ currentIndex: index, questionStartTime: Date.now() }),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      questionStartTime: Date.now(),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
      questionStartTime: Date.now(),
    })),

  tickTimer: () =>
    set((state) => ({ timerSeconds: Math.max(0, state.timerSeconds - 1) })),

  setResult: (result) => set({ result }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetQuiz: () =>
    set({
      attemptId: null,
      questions: [],
      config: null,
      timerSeconds: 0,
      currentIndex: 0,
      answers: {},
      result: null,
      isSubmitting: false,
    }),
}));
