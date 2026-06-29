import api from "./api";
import type { QuizConfig, QuizResult } from "@/types/quiz.types";

export interface StartQuizResponse {
  attempt_id: string;
  questions: Array<{
    id: string;
    question_text: string;
    type: string;
    difficulty: string;
    options: string[];
    tags: string[];
  }>;
  total: number;
  timer_seconds: number;
}

export interface SubmitAnswer {
  question_id: string;
  user_answer: string | null;
  is_skipped: boolean;
  time_spent_sec: number;
}

const quizService = {
  async startQuiz(config: {
    subject_ids: string[];
    type: string;
    difficulty: string;
    question_count: number;
    timer_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
  }): Promise<StartQuizResponse> {
    const { data } = await api.post("/quiz/start", config);
    return data;
  },

  async completeQuiz(
    attemptId: string,
    answers: SubmitAnswer[],
    timeTakenSec: number
  ): Promise<QuizResult> {
    const { data } = await api.post(
      `/quiz/complete/${attemptId}?time_taken_sec=${timeTakenSec}`,
      answers
    );
    return data;
  },
};

export const subjectService = {
  async getAll() {
    const { data } = await api.get("/subjects");
    return data;
  },

  async getBySlug(slug: string) {
    const { data } = await api.get(`/subjects/${slug}`);
    return data;
  },

  async getEnrolled() {
    const { data } = await api.get("/subjects/enrolled");
    return data;
  },

  async enroll(subjectIds: string[]) {
    await api.post("/subjects/enroll", { subject_ids: subjectIds });
  },

  async getNotes(slug: string, topic?: string) {
    const params = topic ? `?topic=${topic}` : "";
    const { data } = await api.get(`/subjects/${slug}/notes${params}`);
    return data;
  },

  async getQuestions(slug: string, filters?: { type?: string; difficulty?: string; top_only?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.difficulty) params.set("difficulty", filters.difficulty);
    if (filters?.top_only) params.set("top_only", "true");
    const { data } = await api.get(`/subjects/${slug}/questions?${params}`);
    return data;
  },

  async getCodingProblems(slug: string, difficulty?: string) {
    const params = difficulty ? `?difficulty=${difficulty}` : "";
    const { data } = await api.get(`/subjects/${slug}/coding${params}`);
    return data;
  },

  async getCodingProblemDetail(problemId: string) {
    const { data } = await api.get(`/subjects/coding/${problemId}`);
    return data;
  },
};

export default quizService;
