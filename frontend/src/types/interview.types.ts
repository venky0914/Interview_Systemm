export interface InterviewSession {
  id: string;
  subject_id: string | null;
  resume_id: string | null;
  interview_type: "technical" | "hr" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  company: string | null;
  overall_score: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface InterviewMessage {
  role: "ai" | "user";
  content: string;
  technical_score?: number;
  communication_score?: number;
  improvement_tip?: string;
}

export interface InterviewReport {
  session_id: string;
  overall_score: number;
  technical_avg: number;
  communication_avg: number;
  confidence_score: number;
  responses: {
    question: string;
    answer: string;
    technical_score: number;
    communication_score: number;
    tip: string;
  }[];
  ai_feedback: string;
  strong_areas: string[];
  improvement_areas: string[];
}
