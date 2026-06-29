export interface Subject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  is_active: boolean;
}

export interface UserSubject {
  subject: Subject;
  completion_pct: number;
  enrolled_at: string;
}

export type Difficulty = "easy" | "medium" | "hard" | "mixed";
export type QuestionType = "theory" | "coding" | "mixed";

export interface Question {
  id: string;
  subject_id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_text: string;
  correct_answer: string;
  options: string[] | null; // MCQ options
  tags: string[];
  is_top_question: boolean;
}

export interface Note {
  id: string;
  subject_id: string;
  title: string;
  content: string;
  pdf_url: string | null;
  topic: string;
  read_count: number;
  updated_at: string;
}

export interface CodingProblem {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  starter_code: string;
  solution_code: string;
  expected_output: string;
  language: "python" | "sql";
}
