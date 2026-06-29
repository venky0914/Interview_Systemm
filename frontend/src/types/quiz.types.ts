import type { Difficulty, QuestionType, Question } from "./subject.types";

export type TimerOption = 0 | 5 | 10 | 20 | 30; // minutes, 0 = no timer
export type QuestionCount = 10 | 15 | 20 | 30 | "all" | number;

export interface QuizConfig {
  subject_ids: string[];
  type: QuestionType;
  difficulty: Difficulty;
  question_count: QuestionCount;
  timer_minutes: TimerOption;
  shuffle_questions: boolean;
  shuffle_options: boolean;
}

export interface QuizAttempt {
  id: string;
  config: QuizConfig;
  questions: Question[];
  started_at: string;
  status: "in_progress" | "completed" | "abandoned";
}

export interface QuizAnswer {
  question_id: string;
  user_answer: string;
  is_skipped: boolean;
  time_spent_sec: number;
}

export interface TopicAnalysis {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface QuizResult {
  attempt_id: string;
  score: number;
  accuracy: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  time_taken_sec: number;
  topic_analysis: TopicAnalysis[];
  weak_topics: string[];
  strong_topics: string[];
  recommended_topics: string[];
  ai_feedback: string;
  leaderboard_rank: number | null;
}
