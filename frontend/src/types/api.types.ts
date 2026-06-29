export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

export interface ProgressDashboard {
  current_streak: number;
  longest_streak: number;
  total_quiz_count: number;
  avg_score_pct: number;
  coding_accuracy: number;
  completion_by_subject: { subject: string; pct: number }[];
  recent_quizzes: RecentQuiz[];
  weak_topics: string[];
  strong_topics: string[];
  activity_heatmap: ActivityDay[];
}

export interface RecentQuiz {
  id: string;
  subject: string;
  score: number;
  date: string;
}

export interface ActivityDay {
  date: string;
  count: number;
}
